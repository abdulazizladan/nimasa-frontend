import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, RouterLink } from '@angular/router';

import { UsersList } from './users-list';
import { Icon } from '../../../core/components/icon/icon';
import { ConfirmDialog } from '../../../core/components/confirm-dialog/confirm-dialog';

describe('UsersList', () => {
  let component: UsersList;
  let fixture: ComponentFixture<UsersList>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UsersList],
      imports: [RouterLink, Icon, ConfirmDialog],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(UsersList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  it('lists users and asks before deleting one', async () => {
    expect(component).toBeTruthy();
    httpMock.expectOne(r => r.url.endsWith('/users')).flush([{ email: 'g@b.c', role: 'guest', info: { firstName: 'Grace', lastName: 'Hopper' } }]);
    fixture.detectChanges();
    await fixture.whenStable();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Grace Hopper');

    (el.querySelector('.btn-icon.danger') as HTMLElement).click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(el.querySelector('[role=alertdialog]')?.textContent).toContain('Delete g@b.c?');
  });
});
