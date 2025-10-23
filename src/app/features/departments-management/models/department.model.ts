export interface Department {
    id: string;
    code: string;
    name: string;
    description?: string;
    director: string;
    directorEmail?: string;
    contactPhone?: string;
    
    // Performance metrics
    performanceScore: number;
    totalTargets: number;
    completedTargets: number;
    pendingTargets: number;
    overdueTargets: number;
    
    // Organizational structure
    unitCount: number;
    staffCount: number;
    parentDepartmentId?: string; // For hierarchical structure
    childDepartments?: Department[];
    
    // Status and metadata
    status: 'active' | 'inactive' | 'restructured';
    createdAt: Date;
    updatedAt: Date;
    fiscalYear: string; // e.g., "2024"
    
    // Strategic alignment
    strategicPillars: string[]; // NIMASA strategic pillars
    keyPerformanceIndicators: KPI[];
    
    // Additional NIMASA-specific fields
    maritimeDomain?: 'safety' | 'security' | 'environment' | 'commercial' | 'administration';
    budgetAllocation?: number;
    actualSpending?: number;
  }
  
  export interface KPI {
    id: string;
    name: string;
    target: number;
    actual: number;
    unit: string; // e.g., "percentage", "number", "currency"
    frequency: 'monthly' | 'quarterly' | 'annual';
    deadline: Date;
    status: 'on-track' | 'at-risk' | 'behind';
    weight: number; // Importance weight for overall score calculation
  }
  
  export interface Unit {
    id: string;
    departmentId: string;
    code: string;
    name: string;
    head: string;
    headEmail?: string;
    staffCount: number;
    performanceScore: number;
    status: 'active' | 'inactive';
    description?: string;
  }
  
  export interface DepartmentFilter {
    search: string;
    status: string[];
    performance: string;
    maritimeDomain?: string;
    strategicPillar?: string;
  }