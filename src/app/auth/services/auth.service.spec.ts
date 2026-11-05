import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { AuthService } from './auth.service';

/** A JWT whose payload says it expired in 2020 (signature irrelevant: only the payload is read). */
const expired = 'x.' + btoa(JSON.stringify({ exp: 1577836800 })) + '.y';
const valid = 'x.' + btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 })) + '.y';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(AuthService);
  });

  it('is logged in only with an unexpired token', () => {
    expect(service.isLoggedIn()).toBe(false);
    localStorage.setItem('access_token', valid);
    expect(service.isLoggedIn()).toBe(true);
  });

  it('clears an expired session', () => {
    localStorage.setItem('access_token', expired);
    localStorage.setItem('user', JSON.stringify({ email: 'a@b.c', role: 'admin' }));
    expect(service.isLoggedIn()).toBe(false);
    expect(service.getUser()).toBeNull();
  });

  it('knows the admin role', () => {
    localStorage.setItem('user', JSON.stringify({ email: 'a@b.c', role: 'admin' }));
    expect(service.isAdmin()).toBe(true);
    localStorage.setItem('user', JSON.stringify({ email: 'g@b.c', role: 'guest' }));
    expect(service.isAdmin()).toBe(false);
  });
});
