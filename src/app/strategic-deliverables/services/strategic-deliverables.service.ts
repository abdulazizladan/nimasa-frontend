import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { DELIVERABLES_CONFIG, DeliverableCategory } from '../deliverables-config';
import { unwrapList } from '../../core/api';

export type AnnualAggregation = 'sum' | 'average' | 'latest';
export type PerformanceDirection = 'higher' | 'lower';
export type QuarterKey = 'q1' | 'q2' | 'q3' | 'q4';

/** One quarter's figures, synced by the backend from the quarterly report */
export interface QuarterEntry {
  target: number | null;
  actual: number | null;
  /** Running total, kept by the backend for some ministerial KPIs */
  cumulative?: number | null;
}

/** The year's combined figure, computed by the backend with the KPI's aggregation method */
export interface AnnualEntry {
  target: number | null;
  actual: number | null;
  method?: AnnualAggregation;
}

export interface YearPerformance {
  q1?: QuarterEntry;
  q2?: QuarterEntry;
  q3?: QuarterEntry;
  q4?: QuarterEntry;
  annual?: AnnualEntry;
}

/**
 * A deliverable (a KPI with its targets). The field names come from the API; the UI shows
 * `outcome` as "Deliverable", `deliverable` as "Description" and `indicator` as "KPI".
 */
export interface StrategicDeliverable {
  id: string;
  /** Assigned by the backend; unique within a page */
  serialNumber: number;
  /** Responsible ministry; presidential and ministerial pages only */
  ministry: string;
  priorityArea: string;
  /** Shown as "Deliverable" */
  outcome: string;
  /** Shown as "Description" */
  deliverable: string;
  baselineType: string;
  /** Shown as "KPI" */
  indicator: string;
  /** Year the baseline was measured; the KPI's report year is baselineYear + 1 */
  baselineYear?: number;
  /** Baseline value for baselineYear (column name is historical, not tied to 2023) */
  baseline2023?: number;
  /** Quarterly results keyed by year, synced by the backend from quarterly reports */
  yearlyPerformance?: Record<string, YearPerformance>;
  /** Saved quarterly reports; included when fetching a single deliverable */
  quarterlyReports?: QuarterlyReport[];
  /** Annual targets keyed by target year; derived by the backend from annualTargets */
  projections?: Record<string, number>;
  /** Annual targets, each with its own baseline */
  annualTargets?: AnnualTarget[];
  /** How quarterly results combine into the annual figure (null/undefined = sum) */
  annualAggregation?: AnnualAggregation | null;
  /** 'lower' when fewer is better, e.g. incident counts (null/undefined = higher) */
  performanceDirection?: PerformanceDirection | null;
  responsibleDepartment: string;
  supportingEvidence: string;
  category: DeliverableCategory;
  /** Evidence file name or template link */
  evidenceFile?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AnnualTarget {
  baselineYear: number;
  baselineValue?: number | null;
  targetYear: number;
  targetValue: number;
}

export interface QuarterlyReport {
  id: string;
  year: number;
  quarter: string;
  targetValue?: number;
  actualValue?: number;
  progress?: string;
  keyIssues?: string;
  mdaEfforts?: string;
  comments?: string;
  supportingDocType?: string;
  createdAt?: string;
  updatedAt?: string;
}

/** What the report form sends */
export type QuarterlyReportInput = Omit<QuarterlyReport, 'id' | 'createdAt' | 'updatedAt'>;

export interface PriorityArea {
  id: string;
  name: string;
  description?: string;
}

/** The API still calls quarterly reports "monthlySubmissions"; the app uses `quarterlyReports`. */
interface ApiDeliverable extends StrategicDeliverable {
  monthlySubmissions?: QuarterlyReport[];
}

export function deliverableFromApi(raw: ApiDeliverable): StrategicDeliverable {
  const { monthlySubmissions, ...deliverable } = raw;
  return monthlySubmissions ? { ...deliverable, quarterlyReports: monthlySubmissions } : deliverable;
}

/** API access for one deliverables page; provided per route with that page's DELIVERABLES_CONFIG. */
@Injectable()
export class StrategicDeliverablesService {
  private http = inject(HttpClient);
  private readonly config = inject(DELIVERABLES_CONFIG);
  private readonly base = `${environment.baseUrl}/${this.config.apiPath}`;
  private readonly agencyBase = `${environment.baseUrl}/agency-deliverables`;
  private readonly reportsBase = `${environment.baseUrl}/quarterly-reports`;

  getAll(): Observable<StrategicDeliverable[]> {
    return this.http.get<ApiDeliverable[] | { data: ApiDeliverable[] }>(this.base).pipe(
      map(res => unwrapList<ApiDeliverable>(res).map(deliverableFromApi))
    );
  }

  /** One deliverable with its quarterly reports */
  getOne(id: string): Observable<StrategicDeliverable> {
    return this.http.get<ApiDeliverable>(`${this.base}/${id}`).pipe(map(deliverableFromApi));
  }

  getPriorityAreas(): Observable<PriorityArea[]> {
    // Each page sees only its own list (national for presidential/ministerial, agency for agency)
    const params = new HttpParams().set('scope', this.config.priorityAreaScope);
    return this.http.get<PriorityArea[] | { data: PriorityArea[] }>(`${this.agencyBase}/priority-areas`, { params })
      .pipe(map(unwrapList<PriorityArea>));
  }

  create(dto: Partial<StrategicDeliverable>): Observable<StrategicDeliverable> {
    return this.http.post<ApiDeliverable>(this.base, dto).pipe(map(deliverableFromApi));
  }

  update(id: string, dto: Partial<StrategicDeliverable>): Observable<StrategicDeliverable> {
    return this.http.patch<ApiDeliverable>(`${this.base}/${id}`, dto).pipe(map(deliverableFromApi));
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  createPriorityArea(name: string): Observable<PriorityArea> {
    return this.http.post<PriorityArea>(`${this.agencyBase}/priority-areas`, { name, scope: this.config.priorityAreaScope });
  }

  updatePriorityArea(id: string, name: string): Observable<PriorityArea> {
    return this.http.patch<PriorityArea>(`${this.agencyBase}/priority-areas/${id}`, { name });
  }

  deletePriorityArea(id: string): Observable<void> {
    return this.http.delete<void>(`${this.agencyBase}/priority-areas/${id}`);
  }

  // ── Quarterly reports ──

  getReports(deliverableId: string): Observable<QuarterlyReport[]> {
    const params = new HttpParams().set('deliverableId', deliverableId);
    return this.http.get<QuarterlyReport[] | { data: QuarterlyReport[] }>(this.reportsBase, { params })
      .pipe(map(unwrapList<QuarterlyReport>));
  }

  createReport(deliverableId: string, report: QuarterlyReportInput): Observable<QuarterlyReport> {
    return this.http.post<QuarterlyReport>(this.reportsBase, { ...report, deliverableId });
  }

  updateReport(id: string, report: Partial<QuarterlyReportInput>): Observable<QuarterlyReport> {
    return this.http.patch<QuarterlyReport>(`${this.reportsBase}/${id}`, report);
  }

  deleteReport(id: string): Observable<void> {
    return this.http.delete<void>(`${this.reportsBase}/${id}`);
  }
}
