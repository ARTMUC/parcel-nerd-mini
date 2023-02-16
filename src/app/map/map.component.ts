import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import * as L from 'leaflet';
import { Parcel } from "../interfaces/parcel";
import { ParcelService } from "../services/parcel/parcel.service";
import { LatLngBoundsExpression, LatLngExpression, LatLngTuple } from "leaflet";
import 'leaflet-easyprint';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements OnInit, OnDestroy {
  subscription: Subscription = new Subscription();
  parcelList: Parcel[] = [];
  map!: L.Map;

  constructor(private parcelService: ParcelService) {
  }

  ngOnInit(): void {
    this.initMap();
    this.subscription = this.parcelService.data.subscribe(d => {
      console.log("map data changed!!!!!!")
      console.log(this.map)
      console.log(this.parcelList)
      this.parcelList = d;
      if (this.map && d.length > 0) {
        this.drawBounds();
        this.map = L.map('map', {
          center: [this.parcelList[0].parcelBounds[0][0], this.parcelList[0].parcelBounds[0][1]],
          zoom: 18
        });
      }
    });
  }

  initMap(): void {
    this.map = L.map('map', {
      center: [52.2297, 21.0122],
      zoom: 10
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: 'Map data © <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
    }).addTo(this.map);
  }

  drawBounds(): void {
    this.parcelList.forEach((parcel) => {
      const latLngBounds = parcel.parcelBounds.map((coords) => {
        return [coords[0], coords[1]] as LatLngTuple;
      });
      L.polyline(latLngBounds, {color: 'red'}).addTo(this.map);
      if (parcel.parcelBounds.length > 0) {
        this.map.fitBounds(latLngBounds);
      }
    });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  printMap() {
    //@TODO fix printing
    // const easyPrint = L.easyPrint({
    //   title: 'My Map',
    //   position: 'topleft',
    //   sizeModes: ['Current', 'A4Landscape', 'A4Portrait'],
    //   hideClasses: ['leaflet-control-container', 'leaflet-top', 'leaflet-bottom']
    // }).addTo(this.map);
    //
    // easyPrint.print();
  }
}
