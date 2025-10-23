import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, map } from 'rxjs';
import { env } from '../../../environment/environment';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
}

@Injectable({
  providedIn: 'root'
})
export class Auth {
  
  private readonly baseUrl = env.baseUrl;
  private readonly http = inject(HttpClient)
  
  
  /**
   * 
   * @param credentials 
   * @returns 
   */
  login(credentials: LoginRequest): Promise<string> {
    const url = `${this.baseUrl}auth/login`;
    return firstValueFrom( 
      this.http.post<LoginResponse>(`${this.baseUrl}auth/login`, credentials).pipe(
        map(
          response => response.access_token
        )
      )
  );
  }
}
