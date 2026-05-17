import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Homepage } from './pages/homepage/homepage';
import { adminGuard } from './auth/guards/admin.guard';
import { guestGuard } from './auth/guards/guest.guard';

const routes: Routes = [
  {
    path: '',
    component: Homepage
  },
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth-module').then(m => m.AuthModule)
  },
  {
    path: 'admin',
    loadChildren: () => import('./users/admin/admin-module').then(m => m.AdminModule),
    canActivate: [adminGuard]
  },
  {
    path: 'guest',
    loadChildren: () => import('./users/guest/guest-module').then(m => m.GuestModule),
    canActivate: [guestGuard]
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule { }
