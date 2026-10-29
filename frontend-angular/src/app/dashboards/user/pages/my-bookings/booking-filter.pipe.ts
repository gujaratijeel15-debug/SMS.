import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'bookingFilter',
  standalone: true
})
export class BookingFilterPipe implements PipeTransform {

  transform(bookings: any[], filter: string, search: string) {

    let filtered = bookings;

    if (filter !== 'all') {
      filtered = filtered.filter(b => b.status === filter);
    }

    if (search) {
      filtered = filtered.filter(b =>
        String(b.serviceName || '').toLowerCase()
        .includes(search.toLowerCase())
      );
    }

    return filtered;
  }
}
