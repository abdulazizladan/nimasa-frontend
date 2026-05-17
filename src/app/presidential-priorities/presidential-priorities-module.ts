import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { PresidentialPrioritiesRoutingModule } from './presidential-priorities-routing-module';
import { PresidentialPrioritiesList } from './components/presidential-priorities-list/presidential-priorities-list';

@NgModule({
  declarations: [PresidentialPrioritiesList],
  imports: [CommonModule, FormsModule, HttpClientModule, PresidentialPrioritiesRoutingModule],
})
export class PresidentialPrioritiesModule {}

