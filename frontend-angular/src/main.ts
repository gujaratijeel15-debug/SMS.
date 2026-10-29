import 'zone.js';   // 👈 THIS LINE FIXES THE BLACK SCREEN

import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config'; // 👈 Make sure this is imported!
import { App } from './app/app';  // Or AppComponent
import { provideAnimations } from '@angular/platform-browser/animations';


bootstrapApplication(App, appConfig) // 👈 CRITICAL: You must pass appConfig here!
  .catch((err) => console.error(err));
   providers: [
    provideAnimations() // ✅ REQUIRED
  ]