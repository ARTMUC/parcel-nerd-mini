import { Injectable } from '@angular/core';
import proj4 from 'proj4';
import {
  coordSystemDefinitions,
  mappedSystemDefinitions,
} from './coordinates-system-definitions';

@Injectable({
  providedIn: 'root',
})
export class CoordinatesConverterService {
  constructor() {}

  convertToDeg(data: number[][], originalSystem: string): [number, number][] {
    this.loadCoordinatesDefinitions(mappedSystemDefinitions);

    const convertedCoordinates = this.convertUnits(
      this.deepCopyData(data),
      originalSystem,
      'EPSG:4326'
    );
    return this.inverseCoordinates(convertedCoordinates);
  }

  //this library seems to be mutating data so please work only on deep copy of data you want to pass here
  private convertUnits(
    copiedData: [number, number][],
    originalSystem: string,
    newSystem: string
  ): [number, number][] {
    return copiedData.map((coordinates) => {
      return proj4(originalSystem, newSystem).forward(coordinates);
    });
  }

  private inverseCoordinates(
    coordinates: [number, number][]
  ): [number, number][] {
    return coordinates.map((coord) => {
      return [coord[1], coord[0]];
    });
  }

  private deepCopyData(data: number[][]): [number, number][] {
    return JSON.parse(JSON.stringify(data));
  }

  private loadCoordinatesDefinitions(
    coordSystemDefinitions: [string, string][]
  ) {
    proj4.defs(coordSystemDefinitions);
  }
  parseTraceNodes(string: string): [number, number][] {
    const r = /[X]=[0-9]*\.[0-9]+\s*[Y]=[0-9]*\.[0-9]+/g;
    const r2 = /[0-9]*\.[0-9]+/g;
    return [...string.matchAll(r)].map((e) => {
      const arr = [...e[0].matchAll(r2)];
      return [Number(...arr[0]), Number(...arr[1])];
    });
  }
}
