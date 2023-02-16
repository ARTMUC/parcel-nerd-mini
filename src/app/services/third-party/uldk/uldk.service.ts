import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { filter, map } from 'rxjs';
import { Parcel } from 'src/app/interfaces/parcel';

@Injectable({
  providedIn: 'root',
})
export class UldkService {
  constructor(private http: HttpClient) {
  }

  fetchParcelDataByXY(node: number[]) {
    const [x, y] = node;
    return this.http
      .get<string>(
        `https://uldk.gugik.gov.pl/?request=GetParcelByXY&xy=${y},${x},4326&result=id,voivodeship,county,commune,geom_wkt&srid=4326`,
        {responseType: 'text' as 'json'}
      )
      .pipe(
        map((r) => this.extractParcelData(r)),
        filter((item: Parcel | undefined): item is Parcel => item != null),
        map((parcel) => {
          return {parcel, node};
        })
      );
  }

  // async fetchParcelDataByParcelNumber(parcelNo: string) {
  //   const res = await fetch(
  //     `https://uldk.gugik.gov.pl/?request=GetParcelById&id=${parcelNo}&result=id,voivodeship,county,commune,geom_wkt&srid=4326`
  //   );

  //   const data = await res.text();

  //   return this.extractParcelData(data);
  // }

  private extractParcelData(data: string) {
    if (data.substr(0, 1) !== '0') {
      console.log('error', data);
      return;
    }

    const [parcelNumber, voivodeship, county, commune, geom] = data
      .split('\n')[1]
      .split('|');

    if (!parcelNumber || !voivodeship || !county || !commune || !geom) {
      console.log('error');
      return;
    }

    const r = /(([\d.]+)\s+([\d.]+))/g;

    const parcelBounds = [...geom.matchAll(r)].map((d) => {
      const x = +d[3];
      const y = +d[2];
      return [x, y];
    });

    return {
      parcelNumber,
      voivodeship,
      county,
      commune,
      parcelBounds,
    };
  }
}
