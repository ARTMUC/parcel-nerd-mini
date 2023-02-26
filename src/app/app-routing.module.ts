import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {path: 'map', loadChildren: () => import('./map/map.module').then(m => m.MapModule)},

  {path: 'trace', loadChildren: () => import('./trace/trace.module').then(m => m.TraceModule)},

  {path: '', redirectTo: 'map', pathMatch: 'full'}

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
