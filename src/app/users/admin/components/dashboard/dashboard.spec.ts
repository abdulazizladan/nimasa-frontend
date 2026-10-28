import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { Dashboard } from './dashboard';
import { DeliverablesOverview } from '../../../../strategic-deliverables/components/deliverables-overview/deliverables-overview';
import { GlobalStateService } from '../../../../core/services/global-state.service';

const YEAR = new Date().getFullYear();

/** Active this year: has a target for this year, no reports, no direction (so readiness flags it) */
const activeThisYear = {
  id: 'p1', serialNumber: 1, category: 'PRESIDENTIAL_PRIORITY', ministry: 'NIMASA', priorityArea: 'Safety',
  outcome: 'Safer seas', deliverable: '', indicator: 'Incidents', baselineType: '', baselineYear: YEAR - 1,
  responsibleDepartment: 'Marine Safety and Security', supportingEvidence: '',
  annualTargets: [{ baselineYear: YEAR - 1, baselineValue: 5, targetYear: YEAR, targetValue: 2 }],
  createdAt: '', updatedAt: ''
};
/** Only active in an earlier year */
const earlier = { ...activeThisYear, id: 'p2', serialNumber: 2, baselineYear: YEAR - 4, annualTargets: [] };

describe('Dashboard', () => {
  let component: Dashboard;
  let fixture: ComponentFixture<Dashboard>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [Dashboard],
      imports: [FormsModule, DeliverablesOverview],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    TestBed.inject(GlobalStateService).setYear(YEAR);
    fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  /** Answers the user counts, the three deliverable lists and the departments list. */
  async function respond() {
    httpMock.expectOne(r => r.url.endsWith('/dashboard/performance-report')).flush({
      summary_metrics: { totalUsers: { admin: 1, guest: 2, total: 3 } }
    });
    httpMock.expectOne(r => r.url.endsWith('/presidential-priorities')).flush([activeThisYear, earlier]);
    httpMock.expectOne(r => r.url.endsWith('/ministerial-deliverables/deliverables')).flush([]);
    httpMock.expectOne(r => r.url.endsWith('/agency-deliverables')).flush([]);
    httpMock.expectOne(r => r.url.endsWith('/departments')).flush([{ id: 'x', code: 'MSR', name: 'Marine Safety and Security' }]);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  const el = () => fixture.nativeElement as HTMLElement;

  it('should create', async () => {
    expect(component).toBeTruthy();
    await respond();
  });

  it('counts deliverables on the top cards for the selected year, with the all-time total', async () => {
    await respond();
    const values = Array.from(el().querySelectorAll('.stat-value')).map(e => e.textContent?.trim());
    expect(values).toEqual(['3', '1', '0', '0']);
    expect(el().querySelector('.stat-sub')?.textContent).toContain(`in ${YEAR} · 2 in total`);
  });

  it('shows the data readiness panel to admins', async () => {
    await respond();
    const readiness = el().querySelector('.readiness')?.textContent ?? '';
    expect(readiness).toContain('Performance direction never set');
    expect(readiness).toContain(`No report yet in ${YEAR}`);
    expect(readiness).not.toContain('No annual target');
  });

  it('applies the type filter to every panel', async () => {
    await respond();
    const overview = fixture.debugElement.query(d => d.componentInstance instanceof DeliverablesOverview)
      .componentInstance as DeliverablesOverview;

    overview.setType('agency');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(el().querySelectorAll('app-deliverables-overview .tile').length).toBe(1);
    expect(el().querySelector('.readiness')).toBeNull();   // no agency deliverables, so nothing to check
  });
});
