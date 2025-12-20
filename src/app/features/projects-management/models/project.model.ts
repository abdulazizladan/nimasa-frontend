export interface Project {
    id: number;
    name: string;
    description?: string;
    departmentCode: string;
    departmentName?: string;
    status: 'Ongoing' | 'Completed' | 'Outstanding';
    priority?: 'Low' | 'Medium' | 'High' | 'Critical';
    startDate?: string;
    dueDate: string;
    completionDate?: string;
    progress?: number; // 0-100
    budget?: number;
    actualSpent?: number;
    projectManager?: string;
    teamMembers?: string[];
    milestones?: Milestone[];
    tasks?: Task[];
}

export interface Milestone {
    id: number;
    name: string;
    dueDate: string;
    status: 'Pending' | 'In Progress' | 'Completed' | 'Delayed';
    description?: string;
}

export interface Task {
    id: number;
    name: string;
    assignedTo: string;
    status: 'Not Started' | 'In Progress' | 'Completed' | 'Blocked';
    dueDate: string;
    priority: 'Low' | 'Medium' | 'High';
}
