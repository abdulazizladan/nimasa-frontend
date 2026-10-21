import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { provideRouter, RouterModule } from '@angular/router';

import { Layout } from './layout';
import { AuthStore } from '../../../../auth/store/auth.store';
import { ConfirmDialog } from '../../../../core/components/confirm-dialog/confirm-dialog';

describe('Layout', () => {
  let component: Layout;
  let fixture: ComponentFixture<Layout>;
  let logoutCalls: number;

  beforeEach(async () => {
    logoutCalls = 0;
    await TestBed.configureTestingModule({
      declarations: [Layout],
      imports: [CommonModule, RouterModule, ConfirmDialog],
      providers: [
        provideRouter([]),
        { provide: AuthStore, useValue: { logout: () => logoutCalls++ } }
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Layout);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  const el = () => fixture.nativeElement as HTMLElement;
  const dialog = () => el().querySelector('[role=alertdialog]');

  async function click(selector: string) {
    (el().querySelector(selector) as HTMLElement).click();
    fixture.detectChanges();
    await fixture.whenStable();
  }

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('asks for confirmation before logging out', async () => {
    expect(dialog()).toBeNull();
    await click('.logout-btn');

    expect(dialog()).not.toBeNull();
    expect(dialog()?.textContent).toContain('Are you sure you want to log out?');
    expect(logoutCalls).toBe(0);
  });

  it('stays logged in when the confirmation is cancelled', async () => {
    await click('.logout-btn');
    await click('.btn-cancel');

    expect(dialog()).toBeNull();
    expect(logoutCalls).toBe(0);
  });

  it('logs out when the confirmation is accepted', async () => {
    await click('.logout-btn');
    await click('.btn-confirm');

    expect(dialog()).toBeNull();
    expect(logoutCalls).toBe(1);
  });
});
