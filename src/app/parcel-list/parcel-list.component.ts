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

  constructor(private parcelService: ParcelService) {
  }

  ngOnInit(): void {
    this.subscription = this.parcelService.data.subscribe(
      (d) => (this.parcelList = d)
    );
  }

  downloadCsv() {
    const csvRows = [];
    const headers = ['Parcel Number', 'Voivodeship', 'County', 'Commune'];
    csvRows.push(headers.join(','));

    this.parcelList.forEach((parcel) => {
      const row = [parcel.parcelNumber, parcel.voivodeship, parcel.county, parcel.commune];
      csvRows.push(row.join(','));
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], {type: 'text/csv'});
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'parcels.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  }

}
