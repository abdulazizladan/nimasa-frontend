import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { User } from '../models/user.model';
import { env } from '../../../../environment/environment';
import { firstValueFrom, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  
  private readonly http = inject(HttpClient);
  private readonly baseUrl = env.baseUrl;

  createUser(userDetails: Partial<User>): Promise<User> {
    return firstValueFrom(
      this.http.post<{data: User}>(`${this.baseUrl}user`, userDetails).pipe(
        map(response => response.data)
      )
    );
  }

  findAll(): Promise<User[]> {
    return firstValueFrom(
      this.http.get<{data: User[], message: string, success: boolean}>(`${this.baseUrl}user`).pipe(
        map(response => response.data)
      )
    )
  }

  findByID(id: string): Promise<User> {
    return firstValueFrom(
      this.http.get<User>(`${this.baseUrl}user/${id}`)
    )
  }

  findByEmail(email: string): Promise<User> {
    return firstValueFrom(
      this.http.get<{data: User, message: string, success: boolean}>(`${this.baseUrl}user/${email}`).pipe(
        map(response => response.data)
      )
    )
  }

  update(id: string, user: Partial<User>): Promise<User> {
    return firstValueFrom(
      this.http.put<User>(`${this.baseUrl}user/${id}`, user)
    );
  }

  removeByID(id: string): Promise<void> {
    return firstValueFrom(
      this.http.delete<void>(`${this.baseUrl}user/${id}`)
    );
  }
}
