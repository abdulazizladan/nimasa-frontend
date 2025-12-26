import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeliverableDetails } from './deliverable-details';

describe('DeliverableDetails', () => {
  let component: DeliverableDetails;
  let fixture: ComponentFixture<DeliverableDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DeliverableDetails]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DeliverableDetails);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
