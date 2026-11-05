import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { AddUser } from './add-user';
import { Icon } from '../../../core/components/icon/icon';

describe('AddUser', () => {
  let component: AddUser;
  let fixture: ComponentFixture<AddUser>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AddUser],
      imports: [FormsModule, Icon],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(AddUser);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create with a guest role by default', () => {
    expect(component).toBeTruthy();
    expect(component.userForm.role).toBe('guest');
  });
});
