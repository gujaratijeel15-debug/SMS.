import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthStateService {

  // store role instead of just boolean
  private roleSubject = new BehaviorSubject<string | null>(
    localStorage.getItem('role')
  );

  role$ = this.roleSubject.asObservable();

  setRole(role: string | null) {
    this.roleSubject.next(role);
  }

  checkRole() {
    this.roleSubject.next(localStorage.getItem('role'));
  }
}
