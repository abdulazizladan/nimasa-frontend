import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GuestDashboard } from './guest-dashboard';

describe('GuestDashboard', () => {
  let component: GuestDashboard;
  let fixture: ComponentFixture<GuestDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [GuestDashboard],
    }).compileComponents();

    fixture = TestBed.createComponent(GuestDashboard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
