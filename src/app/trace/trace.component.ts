import { Component, OnInit } from '@angular/core';
import { finalize, lastValueFrom, Observable, Subscription, tap } from 'rxjs';
import { getRandomId } from '../common/utils';
import { Trace } from '../interfaces/trace';
import { CoordinatesConverterService } from '../services/coordinates-converter/coordinates-converter.service';
import { coordSystemDefinitions } from '../services/coordinates-converter/coordinates-system-definitions';
import { ParcelService } from '../services/parcel/parcel.service';
import { UldkService } from '../services/third-party/uldk/uldk.service';
import { TraceService } from '../services/trace/trace.service';

@Component({
  selector: 'app-trace',
  templateUrl: './trace.component.html',
  styleUrls: ['./trace.component.scss'],
})
export class TraceComponent implements OnInit {
  coordSystems = coordSystemDefinitions;
  traceList: Trace[] = [];
  subscription: Subscription = new Subscription();
  traceModel = { traceName: '', system: '', nodes: '' };

  constructor(
    private parcelService: ParcelService,
    private coordinatesConverterService: CoordinatesConverterService,
    private traceService: TraceService
  ) {}

  ngOnInit(): void {
    this.subscription = this.traceService.data.subscribe(
      (d) => (this.traceList = d)
    );
  }

  onSubmit() {
    const newTrace = {
      id: getRandomId(),
      traceName: this.traceModel?.traceName,
      system: this.traceModel?.system,
      nodes: this.coordinatesConverterService.parseTraceNodes(
        this.traceModel.nodes
      ),
    };
    this.traceService.add(newTrace);
    this.traceModel = { traceName: '', system: '', nodes: '' };
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  async createParcelList(trace: Trace) {
    const degNodes = this.coordinatesConverterService.convertToDeg(
      trace.nodes,
      trace.system
    );
    this.parcelService
      .createParcelList(degNodes)
      .pipe(
        tap({
          next: () => console.log('loading.....'),
          error: (error) => console.log('error', error),
          complete: () => console.log('loading complete'),
        }),
        finalize(() => console.log('loading finalised'))
      )
      .subscribe();
  }
}
