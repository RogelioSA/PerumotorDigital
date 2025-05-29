import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/api.service';
import { CookieService } from 'ngx-cookie-service';

@Component({
  selector: 'app-login',
  imports: [FormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
  providers: [CookieService]
})
export class LoginComponent {
  usuario: string = '';
  clave: string = '';
  error: string = '';

  constructor(private router: Router,private apiService: ApiService,private cookieService: CookieService) { }

  iniciarSesion() {
    this.apiService.iniciarSesion(this.usuario, this.clave).subscribe(
      (res) => {
        if (res.success) {
          const id = res.data.id;
          const token = res.data.token;
          const usuario = res.data.usuario;
          
          this.cookieService.set('usuarioId', id.toString());
          this.cookieService.set('token', token);
          this.cookieService.set('usuario',usuario)
          
          this.router.navigate(['/home']);
        } else {
          alert('Credenciales incorrectas');
        }
      },
      (err) => {
        alert('Error al conectar con el servidor');
        console.error(err);
      }
    );
  }
}
