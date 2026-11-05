import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { unwrapList } from '../../../core/api';
import { Role } from '../../../auth/services/auth.service';

export interface UserInfo {
  firstName: string;
  lastName: string;
  image?: string;
}

export interface UserContact {
  phone: string;
}

export type UserStatus = 'active' | 'inactive';

export interface User {
  id?: number;
  email: string;
  role: Role;
  status?: UserStatus;
  info?: UserInfo;
  contact?: UserContact;
}

export interface CreateUserDto {
  email: string;
  password: string;
  role: Role;
  info: UserInfo;
  contact: UserContact;
}

export interface UpdateUserDto {
  role?: Role;
  status?: UserStatus;
  info?: Partial<UserInfo>;
  contact?: Partial<UserContact>;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.baseUrl}/users`;

  getUsers(): Observable<User[]> {
    return this.http.get<User[] | { data: User[] }>(this.apiUrl).pipe(map(unwrapList<User>));
  }

  getUser(email: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${email}`);
  }

  createUser(user: CreateUserDto): Observable<User> {
    return this.http.post<User>(this.apiUrl, user);
  }

  updateUser(email: string, user: UpdateUserDto): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/${email}`, user);
  }

  deleteUser(email: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${email}`);
  }
}
