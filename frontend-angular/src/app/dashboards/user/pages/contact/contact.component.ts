import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.css']
})
export class ContactComponent {
  form = {
    name: '',
    email: '',
    message: ''
  };

  loading = false;
  successMsg = '';
  errorMsg = '';

  constructor(private http: HttpClient) {}

  sendMessage(event: Event) {
    event.preventDefault();
    this.successMsg = '';
    this.errorMsg = '';

    const payload = {
      name: this.form.name.trim(),
      email: this.form.email.trim(),
      message: this.form.message.trim()
    };

    if (!payload.name || !payload.email || !payload.message) {
      this.errorMsg = 'Name, email, and message should not be empty.';
      return;
    }

    this.loading = true;

    this.http.post('http://localhost:5000/api/contact', payload).subscribe({
      next: () => {
        this.loading = false;
        this.successMsg =
          'Thank you for contacting us! Our support team will review your request and respond shortly to your registered email address.';
        this.form = { name: '', email: '', message: '' };
      },
      error: () => {
        this.loading = false;
        this.errorMsg = 'Unable to send your message right now. Please try again.';
      }
    });
  }
}
