import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

declare var Razorpay: any;

@Injectable({ providedIn: 'root' })
export class PaymentService {

  constructor(private http: HttpClient) {}

  createOrder(bookingId: string) {
    return this.http.post(
      `http://localhost:5000/api/bookings/${bookingId}/create-order`,
      {}
    );
  }

  verifyPayment(bookingId: string, data: any) {
    return this.http.post(
      `http://localhost:5000/api/bookings/${bookingId}/verify-payment`,
      data
    );
  }

  openPayment(data: any, bookingId: string, callback: any) {

    const options = {
      key: data.key,
      amount: data.amount,
      currency: "INR",
      order_id: data.orderId,

      handler: (response: any) => {
        this.verifyPayment(bookingId, response).subscribe(callback);
      }
    };

    const rzp = new Razorpay(options);
    rzp.open();
  }
}