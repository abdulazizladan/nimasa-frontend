import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeliverablesDashboard } from './deliverables-dashboard';

describe('DeliverablesDashboard', () => {
  let component: DeliverablesDashboard;
  let fixture: ComponentFixture<DeliverablesDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DeliverablesDashboard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DeliverablesDashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
