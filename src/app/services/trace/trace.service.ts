import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { Trace } from 'src/app/interfaces/trace';

@Injectable({
  providedIn: 'root',
})
export class TraceService {
  traceList: Trace[] = [];
  private dataSource = new BehaviorSubject<Trace[]>([]);
  data = this.dataSource.asObservable();
  constructor() {}

  add(trace: Trace) {
    this.traceList.push(trace);
    this.dataSource.next(this.traceList);
  }
}
