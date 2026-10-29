import { CanActivateFn } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { inject, PLATFORM_ID } from '@angular/core';

export const browserReadyGuard: CanActivateFn = () => {
  const platformId = inject(PLATFORM_ID);
  return isPlatformBrowser(platformId);
};
