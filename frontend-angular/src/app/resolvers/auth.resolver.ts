import { ResolveFn } from '@angular/router';

export const authResolver: ResolveFn<boolean> = () => {
  return new Promise(resolve => {
    const wait = () => {
      if (typeof window !== 'undefined' && localStorage.getItem('token')) {
        resolve(true);
      } else {
        requestAnimationFrame(wait);
      }
    };
    wait();
  });
};
