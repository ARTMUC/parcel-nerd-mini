import { getNgModuleById, Injectable } from '@angular/core';
import { checkIntersection } from 'line-intersect';
import { BehaviorSubject, EMPTY, from, of } from 'rxjs';
import { concatMap, distinct, expand, finalize, tap } from 'rxjs/operators';
import { Trace } from 'src/app/interfaces/trace';
import { UldkService } from '../third-party/uldk/uldk.service';
import * as geolib from 'geolib';
import { Parcel } from 'src/app/interfaces/parcel';
import { NgxSpinnerService } from "ngx-spinner";

// nice snippet
// const notNull = <T>(item: T | null | undefined): item is T => item != null;

interface Line {
  prevNode: number[];
  nextNode: number[];
}

@Injectable({
  providedIn: 'root',
})
export class ParcelService {
  parcelList: Parcel[] = [];
  private dataSource = new BehaviorSubject<Parcel[]>([]);
  data = this.dataSource.asObservable();

  constructor(private uldkService: UldkService, private spinner: NgxSpinnerService) {
  }

  public delete(parcel: Parcel) {
    this.parcelList = this.parcelList.filter(p => p.parcelNumber != parcel.parcelNumber)
    this.dataSource.next([...this.parcelList]);
  }

  public addParcelByXY(x: number, y: number): Parcel | void {
    for (const parcel of this.parcelList) {
      if (this.isInBounds(x, y, parcel)) {
        return parcel
      }
    }

    this.spinner.show();
    this.uldkService.fetchParcelDataByXY([x, y]).pipe(
      tap({
        next: (resp) => {
          console.log('[next] Called');
          const newParcel = resp.parcel;
          const existingParcel = this.parcelList.find(
            (ex) => ex.parcelNumber === newParcel.parcelNumber
          );
          if (!existingParcel) {
            const closestParcel = this.getClosestParcel(newParcel);
            if (!closestParcel) {
              // If there are no parcels on the list yet, add the new parcel as the first item.
              this.parcelList.push(newParcel);
            } else {
              const closestParcelIndex = this.parcelList.findIndex(e => e.parcelNumber === closestParcel?.parcelNumber);
              if (closestParcelIndex === this.parcelList.length - 1) {
                this.parcelList.push(newParcel);
              } else {
                // Otherwise, insert the new parcel after the closest parcel.
                this.parcelList.splice(closestParcelIndex + 1, 0, newParcel);
              }
            }

          }
        },
        error: (error) => {
          this.spinner.hide();
          console.log('[error] Called', error);
        },
        complete: () => {
          console.log('[tap complete] Called');
          this.dataSource.next([...this.parcelList]);
        },
      }),
      finalize(() => {
        this.spinner.hide();
        console.log('[finalize] Called');
      })
    ).subscribe();
  }


  public createParcelList(nodes: number[][], comment?: string) {
    const lines = this.mapNodesToLines(nodes);

    if (!lines) {
      return EMPTY;
    }

    this.spinner.show()

    return from(lines)
      .pipe(
        concatMap((line) =>
          this.uldkService.fetchParcelDataByXY(line.prevNode).pipe(
            expand((resp) => {
              const {parcel, node} = resp;
              if (!resp) {
                return EMPTY;
              }
              const newPrevNode = this.getNewPrevNode(
                parcel,
                node,
                line.nextNode
              );
              if (!newPrevNode) {
                return EMPTY;
              }
              return this.uldkService.fetchParcelDataByXY(newPrevNode);
            })
          )
        )
      )
      .pipe(
        distinct(({parcel: {parcelNumber}}) => parcelNumber),
        tap({
          next: (resp) => {
            console.log('[next] Called');
            const parcel = this.parcelList.find(
              (parcel) => parcel.parcelNumber === resp.parcel.parcelNumber
            );
            if (!parcel) {
              resp.parcel.comment = comment
              this.parcelList.push(resp.parcel);
            }
          },
          error: (error) => {
            this.spinner.hide()
            console.log('[error] Called', error)
          },
          complete: () => {
            console.log('[tap complete] Called');
            this.dataSource.next([...this.parcelList]);
          },
        }),
        finalize(() => {
          this.spinner.hide()
          console.log('[finalize] Called')
        })
      );
  }

  private getNewPrevNode(
    parcel: Parcel,
    prevNode: number[],
    nextNode: number[]
  ) {
    const parcelBoundLines = this.mapNodesToLines(
      parcel.parcelBounds
    ) as Line[];
    const intersections = parcelBoundLines.map((parcelBoundLine) =>
      this.getIntersectionWithParcelBound(parcelBoundLine, {
        prevNode,
        nextNode,
      })
    );

    const intersectionsWithLinesLength = intersections.flatMap(
      (lineIntersection) => {
        if (lineIntersection.type !== 'intersecting') {
          return [];
        }
        const [x, y] = prevNode;
        return [
          {
            ...lineIntersection,
            length: geolib.getDistance(
              [x, y],
              [lineIntersection.point.x, lineIntersection.point.y]
            ),
          },
        ];
      }
    );

    if (intersectionsWithLinesLength.length === 0) {
      return;
    }

    const firstIntersection = intersectionsWithLinesLength.sort(
      (a, b) => a.length - b.length
    )[0];

    return this.offsetNode(
      [firstIntersection.point.x, firstIntersection.point.y],
      nextNode
    );
  }

  private getIntersectionWithParcelBound(
    parcelBoundLine: Line,
    traceLine: {prevNode: number[]; nextNode: number[]}
  ) {
    return this.findLinesIntersection(
      parcelBoundLine.prevNode,
      parcelBoundLine.nextNode,
      traceLine.prevNode,
      traceLine.nextNode
    );
  }

  private mapNodesToLines(nodes: number[][]) {
    if (!nodes || nodes.length < 2) {
      return;
    }
    const lines = nodes
      .map((node, i) => {
        if (i + 1 < nodes.length) {
          return {prevNode: node, nextNode: nodes[i + 1]};
        }
        return;
      })
      .filter((line) => line !== undefined);
    return lines as Line[];
  }

  private findLinesIntersection(
    node1: number[],
    node2: number[],
    node3: number[],
    node4: number[]
  ) {
    const [x1, y1] = node1;
    const [x2, y2] = node2;
    const [x3, y3] = node3;
    const [x4, y4] = node4;
    const result = checkIntersection(x1, y1, x2, y2, x3, y3, x4, y4);
    return result;
  }

  private offsetNode(prevNode: number[], nextNode: number[], offset = 5e-6) {
    const getLineLength = (x1: number, y1: number, x2: number, y2: number) => {
      return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    };
    const [x1, y1] = prevNode;
    const [x2, y2] = nextNode;
    const lineLength = getLineLength(x1, y1, x2, y2);
    const newX = x1 + (offset / lineLength) * (x2 - x1);
    const newY = y1 + (offset / lineLength) * (y2 - y1);

    return [newX, newY];
  }

  private isInBounds(x: number, y: number, parcel: Parcel) {
    const bounds = parcel.parcelBounds;
    let isInBounds = false;

    for (let i = 0, j = bounds.length - 1; i < bounds.length; j = i++) {
      const xi = bounds[i][0];
      const yi = bounds[i][1];
      const xj = bounds[j][0];
      const yj = bounds[j][1];

      const intersect =
        yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

      if (intersect) {
        isInBounds = !isInBounds;
      }
    }

    return isInBounds;
  }

  private getClosestParcel(parcel: Parcel) {
    let closestParcel = null;
    let closestDistance = Infinity;

    for (const existingParcel of this.parcelList) {
      const distance = this.distance(parcel.parcelBounds[0][0], parcel.parcelBounds[0][1], existingParcel.parcelBounds[0][0], existingParcel.parcelBounds[0][1]);

      if (distance < closestDistance) {
        closestParcel = existingParcel;
        closestDistance = distance;
      }
    }

    return closestParcel;
  }

  private distance(x1: number, y1: number, x2: number, y2: number): number {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  }
}
