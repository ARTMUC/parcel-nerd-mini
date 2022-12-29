import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TraceComponent } from './trace.component';

const routes: Routes = [{ path: '', component: TraceComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TraceRoutingModule { }
