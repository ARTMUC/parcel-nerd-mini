import { TestBed } from '@angular/core/testing';

import { UldkService } from './uldk.service';

describe('UldkService', () => {
  let service: UldkService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UldkService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
