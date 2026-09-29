import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DbService } from './services/db.service';
import { BadgeToast } from './pages/badge-toast/badge-toast';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, BadgeToast],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  constructor(readonly db: DbService) {}
}
