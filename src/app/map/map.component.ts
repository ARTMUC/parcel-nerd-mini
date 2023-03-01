import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import * as L from 'leaflet';
import { Parcel } from "../interfaces/parcel";
import { ParcelService } from "../services/parcel/parcel.service";
import { LatLngBoundsExpression, LatLngExpression, LatLngTuple, LeafletMouseEventHandlerFn } from "leaflet";
import 'leaflet-easyprint';
import { TraceService } from "../services/trace/trace.service";
import { Trace } from "../interfaces/trace";
import { CoordinatesConverterService } from "../services/coordinates-converter/coordinates-converter.service";


class LineString {
}

class MultiLineString {
}

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements OnInit, OnDestroy {
  subscription: Subscription = new Subscription();
  subscription2: Subscription = new Subscription();
  parcelList: Parcel[] = [];
  drawnParcels: {parcel: Parcel, pl: any}[] = [];
  traceList: Trace[] = []
  drawnTraces: Trace[] = []
  map!: L.Map;
  parcelsWmsUrl = {
    layers: 'dzialki,numery_dzialek,budynki',
    url: 'https://integracja01.gugik.gov.pl/cgi-bin/KrajowaIntegracjaEwidencjiGruntow'
  };
  civilWmsUrl = {
    layers:
      'przewod_wodociagowy,przewod_kanalizacyjny,przewod_cieplowniczy,przewod_gazowy,przewod_telekomunikacyjny,przewod_elektroenergetyczny,przewod_niezidentyfikowany,przewod_niezidentyfikowany,przewod_urzadzenia',
    url: 'https://integracja01.gugik.gov.pl/cgi-bin/KrajowaIntegracjaUzbrojeniaTerenu_24'
  };
  wmsProps = {
    opacity: 1,
    format: 'image/png',
    control: true,
    tiled: true,
    maxZoom: 20,
    transparent: true,
    keepBuffer: 20,
    tileSize: 1024
  };

  constructor(private parcelService: ParcelService,
              private traceService: TraceService,
              private coordinatesConverterService: CoordinatesConverterService) {
  }

  ngOnInit(): void {
    this.initMap();
    this.subscription = this.parcelService.data.subscribe(d => {
      console.log(this.parcelList)
      this.parcelList = d
      if (this.map && d.length > 0) {
        this.drawBounds();
        // this.map.flyTo([this.parcelList[0].parcelBounds[0][0], this.parcelList[0].parcelBounds[0][1]]);
      }
    });
    this.subscription2 = this.traceService.data.subscribe(d => {
      this.traceList = d.map(trace => {
        const nodes = this.coordinatesConverterService.convertToDeg(trace.nodes, trace.system)
        return {
          ...trace,
          nodes
        }
      })
      console.log(this.traceList)
      if (this.map && d.length > 0) {
        this.drawTraces();
      }
    });

  }

  initMap(): void {
    console.log(this.map)
    if (this.map) {
      return
    }
    this.map = L.map('map', {
      center: [52.2297, 21.0122],
      zoom: 10
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: 'Map data © <a href="https://openstreetmap.org">OpenStreetMap</a> contributors',
      maxZoom: 17
    }).addTo(this.map);
    // url="http://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
    // subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
    // maxZoom={21}
    // eventHandlers={{ click: (e) => console.log(e) }}
    L.tileLayer("http://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}", {
      attribution: 'Map data © <a href="https://openstreetmap.org">OpenStreetMap</a> contributors',
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'], maxZoom: 20, minZoom: 18
    }).addTo(this.map);
    L.tileLayer.wms(this.parcelsWmsUrl.url, {
      layers: this.parcelsWmsUrl.layers,
      ...this.wmsProps,
    }).addTo(this.map);
    L.tileLayer.wms(this.civilWmsUrl.url, {
      layers: this.civilWmsUrl.layers,
      ...this.wmsProps,
    }).addTo(this.map);

    this.map.on('click', (event) => {
      console.log(`Clicked at ${event.latlng.lat}, ${event.latlng.lng}`);
      const currParcel = this.parcelService.addParcelByXY(event.latlng.lat, event.latlng.lng)
      if (currParcel) {
        alert(currParcel.parcelNumber)
      }
    });
  }

  drawBounds(): void {
    this.parcelList.forEach((parcel) => {
      if (!!this.drawnParcels.find(p => p.parcel.parcelNumber === parcel.parcelNumber)) {
        return
      }
      const latLngBounds = parcel.parcelBounds.map((coords) => {
        return [coords[0], coords[1]] as LatLngTuple;
      });
      const pl = L.polyline(latLngBounds, {
        color: 'purple',
        fill: true,
        fillColor: 'purple',
        noClip: true,
        fillOpacity: 0.5,

      }).addTo(this.map);
      this.drawnParcels.push({parcel, pl})
    });
  }

  drawTraces(): void {
    this.traceList.forEach((trace) => {
      if (!!this.drawnTraces.find(t => t.id === trace.id)) {
        return
      }

      const latLngBounds = trace.nodes.map((coords) => {
        return [coords[0], coords[1]] as LatLngTuple;
      });
      L.polyline(latLngBounds, {color: 'blue'}).addTo(this.map);
      if (trace.nodes.length > 0) {
        this.map.fitBounds(latLngBounds, {})
      }
      this.drawnTraces.push(trace)
    });
  }

  ngOnDestroy(): void {
    // this.subscription.unsubscribe();
    // this.subscription2.unsubscribe();
  }

  downloadCsv() {
    const csvRows = [];
    const headers = ['Numer dzialki', 'Wojewodztwo', 'Powiat', 'Gmina', 'komentarz'];
    csvRows.push(headers.join(','));

    this.parcelList.forEach((parcel) => {
      const row = [parcel.parcelNumber, parcel.voivodeship, parcel.county, parcel.commune, parcel.comment];
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

  removeParcel(parcel: Parcel) {
    this.parcelService.delete(parcel)
    const pl = this.drawnParcels.find(p => p.parcel.parcelNumber === parcel.parcelNumber)?.pl
    this.drawnParcels = this.drawnParcels.filter(p => p.parcel.parcelNumber != parcel.parcelNumber)
    this.map.removeLayer(pl)
  }
}
