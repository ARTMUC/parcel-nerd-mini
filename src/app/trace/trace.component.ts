import { Component, OnInit } from '@angular/core';
import { finalize, lastValueFrom, Observable, Subscription, tap } from 'rxjs';
import { getRandomId } from '../common/utils';
import { Trace } from '../interfaces/trace';
import { CoordinatesConverterService } from '../services/coordinates-converter/coordinates-converter.service';
import { coordSystemDefinitions } from '../services/coordinates-converter/coordinates-system-definitions';
import { ParcelService } from '../services/parcel/parcel.service';
import { UldkService } from '../services/third-party/uldk/uldk.service';
import { TraceService } from '../services/trace/trace.service';
import { Router } from "@angular/router";

@Component({
  selector: 'app-trace',
  templateUrl: './trace.component.html',
  styleUrls: ['./trace.component.scss'],
})
export class TraceComponent implements OnInit {
  coordSystems = coordSystemDefinitions;
  traceList: Trace[] = [];
  subscription: Subscription = new Subscription();
  traceModel = {traceName: '', system: '', nodes: ''};

  constructor(
    private parcelService: ParcelService,
    private coordinatesConverterService: CoordinatesConverterService,
    private traceService: TraceService,
    private router: Router
  ) {
  }

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
    this.traceModel = {traceName: '', system: '', nodes: ''};
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
      .createParcelList(degNodes, `for line: ${trace.traceName}`)
      .subscribe(() => {
      }, () => {
      }, () => this.router.navigate(['../']));
  }
}
