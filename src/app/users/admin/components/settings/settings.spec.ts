import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, RouterLink } from '@angular/router';

import { Settings } from './settings';
import { Icon } from '../../../../core/components/icon/icon';

describe('Settings', () => {
  let component: Settings;
  let fixture: ComponentFixture<Settings>;

  beforeEach(async () => {
    localStorage.setItem('user', JSON.stringify({ email: 'admin@nimasa.gov.ng', role: 'admin' }));
    await TestBed.configureTestingModule({
      declarations: [Settings],
      imports: [RouterLink, Icon],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Settings);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('shows the signed-in account', () => {
    expect(component).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('admin@nimasa.gov.ng');
  });
});
