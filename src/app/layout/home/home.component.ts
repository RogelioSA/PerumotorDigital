import { Component } from '@angular/core';
import { TopbarComponent } from "../../component/topbar/topbar.component";
import { TitleComponent } from '../../component/title/title.component';
import { Router } from '@angular/router';
@Component({
  selector: 'app-home',
  imports: [TopbarComponent,TitleComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {

  constructor(private router: Router) { }
  handleCardClick(cardId: number) {
    this.router.navigate(['billingpayment']);
  }

}
