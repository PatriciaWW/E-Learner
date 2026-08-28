import { Routes } from '@angular/router';
import { Journey } from './journey/journey';
import { Code } from './code/code';

export const routes: Routes = [

    { 
    path: 'journey', 
    component: Journey, 
    pathMatch: 'full' ,
    title : "E-Learning" 
    
  },
  { 
    path: 'code/:topic', 
    component: Code, 
    pathMatch: 'full' ,
    title : "E-Learning" 
    
  }

];
