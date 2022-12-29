import { getNgModuleById, Injectable } from '@angular/core';
import { checkIntersection } from 'line-intersect';
import { BehaviorSubject, EMPTY, from, of } from 'rxjs';
import { concatMap, distinct, expand, finalize, tap } from 'rxjs/operators';
import { Trace } from 'src/app/interfaces/trace';
import { UldkService } from '../third-party/uldk/uldk.service';
import * as geolib from 'geolib';
import { Parcel } from 'src/app/interfaces/parcel';

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
  constructor(private uldkService: UldkService) {}

  public add(parcel: Parcel) {
    this.parcelList.push(parcel);
    this.dataSource.next(this.parcelList);
  }

  public createParcelList(nodes: number[][]) {
    const lines = this.mapNodesToLines(nodes);

    if (!lines) {
      return EMPTY;
    }

    return from(lines)
      .pipe(
        concatMap((line) =>
          this.uldkService.fetchParcelDataByXY(line.prevNode).pipe(
            expand((resp) => {
              const { parcel, node } = resp;
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
        distinct(({ parcel: { parcelNumber } }) => parcelNumber),
        tap({
          next: (resp) => {
            console.log('[next] Called');
            const parcel = this.parcelList.find(
              (parcel) => parcel.parcelNumber === resp.parcel.parcelNumber
            );
            if (!parcel) {
              this.parcelList.push(resp.parcel);
            }
          },
          error: (error) => console.log('[error] Called', error),
          complete: () => {
            console.log('[tap complete] Called');
            this.dataSource.next([...this.parcelList]);
          },
        }),
        finalize(() => console.log('[finalize] Called'))
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
    traceLine: { prevNode: number[]; nextNode: number[] }
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
          return { prevNode: node, nextNode: nodes[i + 1] };
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
}
