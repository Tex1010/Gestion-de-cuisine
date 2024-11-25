import { Routes } from '@angular/router';
import { AppComponent } from './app.component';
import { CorpsComponent } from './corps/corps.component';
import { LoginComponent } from './login/login.component';

export const routes: Routes = [
    { path: '',redirectTo: '/login', pathMatch: 'full', },
    { path: 'login', component: LoginComponent, },
    { path: 'corps', component: CorpsComponent, },
    { path: 'app', component: AppComponent}
    
];
