import { TestBed } from '@angular/core/testing';

import { ApiS } from './api';

describe('Api', () => {
  let service: ApiS;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ApiS);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
