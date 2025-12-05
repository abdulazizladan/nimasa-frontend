import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule, provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { MatExpansionModule } from '@angular/material/expansion';
import { AuthInterceptor } from './auth/interceptors/auth.interceptor';

import { AppRoutingModule } from './app-routing-module';
import { App } from './app';
import { Dashboard } from './admin/components/dashboard/dashboard';
import { AuthModule } from './auth/auth-module';

@NgModule({
  declarations: [
    App,
    Dashboard
  ],
  imports: [
    BrowserModule,
    AuthModule,
    AppRoutingModule,
    MatExpansionModule
  ],
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideClientHydration(withEventReplay()),
    provideHttpClient(withInterceptorsFromDi()),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    }
  ],
  bootstrap: [App]
})
export class AppModule { }
