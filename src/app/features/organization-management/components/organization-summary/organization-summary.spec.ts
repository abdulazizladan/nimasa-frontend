import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrganizationSummary } from './organization-summary';

describe('OrganizationSummary', () => {
  let component: OrganizationSummary;
  let fixture: ComponentFixture<OrganizationSummary>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OrganizationSummary]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OrganizationSummary);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
