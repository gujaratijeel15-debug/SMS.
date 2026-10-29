import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class SessionService {

  private _ready = new BehaviorSubject<boolean>(false);
  ready$ = this._ready.asObservable();

  user: any = null;

  constructor(private http: HttpClient) {}

  bootstrap() {
    return this.http.get('/api/auth/me').pipe(
      tap(user => {
        this.user = user;
        this._ready.next(true);
      }),
      catchError(() => {
        this.user = null;
        this._ready.next(true);
        return of(null);
      })
    );
  }

  isReady() {
    return this._ready.value;
  }

    markReady() {
    this._ready.next(true);
  }

}
