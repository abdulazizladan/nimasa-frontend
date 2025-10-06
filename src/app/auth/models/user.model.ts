export interface User {
    id: number;
    email: string;
    role: 'Admin' | 'DG' | 'DH' | 'Staff';
    departmentId: number;
}
  