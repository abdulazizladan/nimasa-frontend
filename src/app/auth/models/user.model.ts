export interface User {
    id: number;
    email: string;
    role: 'admin' | 'guest';
    departmentId: number;
}
  