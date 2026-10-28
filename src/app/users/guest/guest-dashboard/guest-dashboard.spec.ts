import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';

import { GuestDashboard } from './guest-dashboard';
import { DeliverablesOverview } from '../../../strategic-deliverables/components/deliverables-overview/deliverables-overview';
import { GlobalStateService } from '../../../core/services/global-state.service';

const YEAR = new Date().getFullYear();

/** A deliverable active this year with one quarter reported: on track (90 of a 100 target). */
const onTrack = {
  id: 'p1', serialNumber: 1, category: 'PRESIDENTIAL_PRIORITY', ministry: 'NIMASA', priorityArea: 'Safety',
  outcome: 'Safer seas', deliverable: '', indicator: '% of vessels inspected', baselineType: 'Percentage',
  baselineYear: YEAR - 1, responsibleDepartment: 'Marine Safety and Security', supportingEvidence: '',
  annualAggregation: 'latest', annualTargets: [{ baselineYear: YEAR - 1, baselineValue: 50, targetYear: YEAR, targetValue: 100 }],
  yearlyPerformance: { [YEAR]: { q1: { target: 100, actual: 90 } } }, createdAt: '', updatedAt: ''
};

describe('GuestDashboard', () => {
  let component: GuestDashboard;
  let fixture: ComponentFixture<GuestDashboard>;
  let httpMock: HttpTestingController;
  let globalState: GlobalStateService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [GuestDashboard],
      imports: [FormsModule, DeliverablesOverview],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    globalState = TestBed.inject(GlobalStateService);
    globalState.setYear(YEAR);

    fixture = TestBed.createComponent(GuestDashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  /** Answers the overview's three list requests (presidential, ministerial, agency). */
  async function respond(presidential: unknown[] = [], ministerial: unknown[] = [], agency: unknown[] = []) {
    httpMock.expectOne(r => r.url.endsWith('/presidential-priorities')).flush(presidential);
    httpMock.expectOne(r => r.url.endsWith('/ministerial-deliverables/deliverables')).flush(ministerial);
    httpMock.expectOne(r => r.url.endsWith('/agency-deliverables')).flush(agency);
    httpMock.expectOne(r => r.url.endsWith('/departments')).flush([]);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it('should create', async () => {
    expect(component).toBeTruthy();
    await respond();
  });

  it('shows the deliverables overview from the uploaded data', async () => {
    await respond([onTrack]);
    const text: string = fixture.nativeElement.textContent;

    expect(text).toContain(`Deliverables overview · ${YEAR}`);
    expect(text).toContain('Presidential Priorities');
    expect(text).toContain('Ministerial Deliverables');
    expect(text).toContain('Agency Deliverables');
    // The on-track presidential deliverable is counted
    expect(text).toContain('100%');
    expect(text).toContain('1 of 1 with results');
  });

  it('links guests to the guest KPI pages, not the admin pages', async () => {
    await respond([onTrack]);
    const el: HTMLElement = fixture.nativeElement;
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    (el.querySelector('button.tile') as HTMLElement).click();
    expect(navigate).toHaveBeenCalledWith(['/guest/kpis'], { queryParams: { type: 'presidential' } });
  });

  it('hides the internal overdue reports panel from guests', async () => {
    await respond([onTrack]);
    expect(fixture.nativeElement.textContent).not.toContain('Overdue reports');
    expect(fixture.nativeElement.textContent).toContain('How the priorities are doing');
  });

  it('does not show the admin-only data readiness panel', async () => {
    await respond([onTrack]);
    expect(fixture.nativeElement.querySelector('.readiness')).toBeNull();
  });

  it('changes the shared year when a different year is selected', async () => {
    await respond();
    component.onYearChange(String(YEAR - 1));
    expect(globalState.getYear()).toBe(YEAR - 1);
    expect(component.year).toBe(String(YEAR - 1));
  });
});
