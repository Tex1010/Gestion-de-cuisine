import { Component, OnInit, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterOutlet } from '@angular/router';
import { CONFIG } from '../config';
import { MatSnackBar } from '@angular/material/snack-bar';


@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  imports: [FormsModule, RouterLink, RouterOutlet]
})
export class LoginComponent implements OnInit, AfterViewInit {
  password: string = '';
  nom: string = '';
  showPassword: boolean = false;

  constructor(private router: Router, private snackBar: MatSnackBar) {}

  ngOnInit() {
    sessionStorage.removeItem('isLoggedIn');
    this.snackBar.open('Entrer le nom et le mot de passe pour connecter', 'Fermer', { duration: 1000 });
  }

  ngAfterViewInit() {
    const container = document.getElementById('container');
    const showLoginBtn = document.getElementById('showLogin');
    const backBtn = document.getElementById('backBtn');
  
    if (container) {
      showLoginBtn?.addEventListener('click', () => {
        container.classList.add('active');
      });
  
      backBtn?.addEventListener('click', () => {
        container.classList.remove('active');
      });
    }
  
    // Afficher ou cacher le mot de passe
    const showPasswordCheckbox = document.getElementById('show-password') as HTMLInputElement;
    const passwordInput = document.getElementById('password') as HTMLInputElement;
  
    if (showPasswordCheckbox) {
      showPasswordCheckbox.addEventListener('change', function () {
        passwordInput.type = this.checked ? 'text' : 'password';
      });
    }
  }

  ok() {
    if (this.nom === CONFIG.username && this.password === CONFIG.password) {
      sessionStorage.setItem('isLoggedIn', 'true');
      this.router.navigate(['/corps']);
    } else {
      alert('Utilisateur ou mot de passe incorrect ! Veuillez réessayer.');
      this.password = '';
      this.nom = '';
    }
  }

  mamono() {
    window.close();
  }
}
