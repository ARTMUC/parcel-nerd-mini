import { Component, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { Parcel } from '../interfaces/parcel';
import { ParcelService } from '../services/parcel/parcel.service';

@Component({
  selector: 'app-parcel-list',
  templateUrl: './parcel-list.component.html',
  styleUrls: ['./parcel-list.component.scss'],
})
export class ParcelListComponent implements OnInit {
  subscription: Subscription = new Subscription();
  parcelList: Parcel[] = [];

  constructor(private parcelService: ParcelService) {}

  ngOnInit(): void {
    this.subscription = this.parcelService.data.subscribe(
      (d) => (this.parcelList = d)
    );
  }
}
