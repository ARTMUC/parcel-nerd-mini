import { TestBed } from '@angular/core/testing';

import { CoordinatesConverterService } from './coordinates-converter.service';

describe('CoordinatesConverterService', () => {
  let service: CoordinatesConverterService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CoordinatesConverterService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
