export interface Deliverable {
    id: string;
    serialNumber: number;
    ministry: string;
    priorityArea: string;
    outcome: string;
    deliverable: string;
    baselineType: string;
    indicator: string;
    baseline2023?: number;
    q1_2024_target?: number;
    q1_2024_actual?: number;
    q2_2024_target?: number;
    q2_2024_actual?: number;
    q2_2024_cumulative_actual?: number;
    q3_2024_target?: number;
    q3_2024_actual?: number;
    q3_2024_cumulative_actual?: number;
    q4_2024_target?: number;
    q4_2024_actual?: number;
    annual_2024_target?: number;
    annual_2024_actual?: number;
    target_2025?: number;
    target_2026?: number;
    target_2027?: number;
    responsibleDepartment: string;
    supportingEvidence: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface DeliverableSummary {
    totalDeliverables: number;
    totalMinistries: number;
    averageProgress: number;
    byMinistry: { [key: string]: number };
    byPriorityArea: { [key: string]: number };
}
