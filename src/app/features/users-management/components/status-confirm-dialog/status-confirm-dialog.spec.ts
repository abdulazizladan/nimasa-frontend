import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StatusConfirmDialog } from './status-confirm-dialog';

describe('StatusConfirmDialog', () => {
  let component: StatusConfirmDialog;
  let fixture: ComponentFixture<StatusConfirmDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [StatusConfirmDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StatusConfirmDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
