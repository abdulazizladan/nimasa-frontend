import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { Dashboard } from './dashboard';
import { DeliverablesOverview } from '../../../../strategic-deliverables/components/deliverables-overview/deliverables-overview';

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
    fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  /** Answers the summary counts and the overview's three deliverable lists. */
  async function respond() {
    httpMock.expectOne(r => r.url.endsWith('/dashboard/performance-report')).flush({
      summary_metrics: {
        totalUsers: { admin: 1, guest: 2, total: 3 },
        totalPresidentialPriorities: 4, totalMinisterialDeliverables: 5, totalAgencyKPIs: 6
      }
    });
    httpMock.expectOne(r => r.url.endsWith('/presidential-priorities')).flush([]);
    httpMock.expectOne(r => r.url.endsWith('/ministerial-deliverables/deliverables')).flush([]);
    httpMock.expectOne(r => r.url.endsWith('/agency-deliverables')).flush([]);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it('should create', async () => {
    expect(component).toBeTruthy();
    await respond();
  });

  it('shows the summary counts and the deliverables overview', async () => {
    await respond();
    const el: HTMLElement = fixture.nativeElement;
    const counts = Array.from(el.querySelectorAll('.stat-value')).map(e => e.textContent?.trim());

    expect(counts).toEqual(['3', '4', '5', '6']);
    expect(el.textContent).toContain('Deliverables overview');
    // Admins can open each deliverables page from its tile
    expect(el.querySelectorAll('app-deliverables-overview button.tile').length).toBe(3);
  });
});
