import { TestBed } from '@angular/core/testing';

import { ProjecctServices } from './projecct-services';

describe('ProjecctServices', () => {
  let service: ProjecctServices;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProjecctServices);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
