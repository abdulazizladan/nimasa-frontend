import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StatusConfirmDialogComponent } from './status-confirm-dialog-component';

describe('StatusConfirmDialogComponent', () => {
  let component: StatusConfirmDialogComponent;
  let fixture: ComponentFixture<StatusConfirmDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [StatusConfirmDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StatusConfirmDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
