import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddProjecct } from './add-projecct';

describe('AddProjecct', () => {
  let component: AddProjecct;
  let fixture: ComponentFixture<AddProjecct>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AddProjecct]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddProjecct);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
