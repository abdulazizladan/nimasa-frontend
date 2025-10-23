import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './auth/guard/auth.guard';
import { RoleGuard } from './auth/guard/role.guard';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'auth',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth-module').then(module => module.AuthModule)
  },
  {
    path: 'guest',
    loadChildren: () => import('./users/guest/guest-module').then(module => module.GuestModule),
    canActivate: [AuthGuard, RoleGuard],
    data: {role: 'guest'}
  },
  {
    path: 'admin',
    loadChildren: () => import('./users/admin/admin-module').then(module => module.AdminModule),
    canActivate: [AuthGuard, RoleGuard],
    data: { role: 'admin' }
  },
  {
    path: '**',
    redirectTo: 'auth',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { } 
