import { Routes } from '@angular/router';
import { LoginComponent } from './layout/login/login.component';
import { HomeComponent } from './layout/home/home.component';
import { BillingpaymentComponent } from './layout/billingpayment/billingpayment.component';

export const routes: Routes = [
    { path: '', component: LoginComponent },
    { path: 'home', component: HomeComponent },
    { path: 'billingpayment', component: BillingpaymentComponent }
];
