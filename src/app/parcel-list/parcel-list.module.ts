import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ParcelListRoutingModule } from './parcel-list-routing.module';
import { ParcelListComponent } from './parcel-list.component';


@NgModule({
  declarations: [
    ParcelListComponent
  ],
  imports: [
    CommonModule,
    ParcelListRoutingModule
  ]
})
export class ParcelListModule { }
