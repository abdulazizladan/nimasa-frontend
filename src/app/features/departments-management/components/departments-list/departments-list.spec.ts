import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DepartmentsList } from './departments-list';

describe('DepartmentsList', () => {
  let component: DepartmentsList;
  let fixture: ComponentFixture<DepartmentsList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DepartmentsList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DepartmentsList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
