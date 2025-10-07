import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

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
    loadChildren: () => import('./users/guest/guest-module').then(module => module.GuestModule)
  },
  {
    path: 'admin',
    loadChildren: () => import('./users/admin/admin-module').then(module => module.AdminModule)
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
