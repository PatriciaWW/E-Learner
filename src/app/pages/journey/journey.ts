import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Nav } from '../nav/nav';
import { Footer } from '../footer/footer';

@Component({
  selector: 'app-journey',
  imports: [RouterLink, Nav, Footer],
  templateUrl: './journey.html',
  styleUrl: './journey.css',
})
export class Journey {}
