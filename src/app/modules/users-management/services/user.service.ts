import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Observable } from 'rxjs';

export interface UserInfo {
  firstName: string;
  lastName: string;
  image?: string;
}

export interface UserContact {
  phone: string;
}

export interface User {
  id?: number;
  email: string;
  role: string;
  status?: string;
  info?: UserInfo;
  contact?: UserContact;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = `${environment.baseUrl}/users`;

  constructor(private http: HttpClient) {}

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl);
  }

  getUser(email: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${email}`);
  }

  createUser(user: any): Observable<User> {
    return this.http.post<User>(this.apiUrl, user);
  }

  updateUser(email: string, user: any): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/${email}`, user);
  }

  deleteUser(email: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${email}`);
  }

  getStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/stats`);
  }
}
