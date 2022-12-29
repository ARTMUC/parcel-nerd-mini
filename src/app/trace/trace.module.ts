import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TraceRoutingModule } from './trace-routing.module';
import { TraceComponent } from './trace.component';
import { FormsModule } from '@angular/forms';


@NgModule({
  declarations: [
    TraceComponent
  ],
  imports: [
    CommonModule,
    TraceRoutingModule,
    FormsModule
  ]
})
export class TraceModule { }
