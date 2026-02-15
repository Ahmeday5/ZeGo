import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './notification.component.html',
  styleUrl: './notification.component.scss',
})
export class NotificationComponent {
  title: string = '';
  body: string = '';
  topic: string = 'drivers'; // الافتراضي
  successMessage: string = '';
  errorMessage: string = '';
  isLoading: boolean = false;

  constructor(private http: HttpClient) {}

  async sendNotification() {
    this.successMessage = '';
    this.errorMessage = '';
    this.isLoading = true;

    try {
      const response = await firstValueFrom(
        this.http.post<any>(
          'https://zego.premiumasp.net/api/Dashboard/send',
          {
            title: this.title,
            body: this.body,
            topic: this.topic,
          },
        ),
      );
      console.log('Notification sent:', response);
      this.successMessage = 'تم إرسال الإشعار بنجاح';
      setTimeout(() => {
        this.successMessage = '';
        // 👇 تفريغ الحقول بعد النجاح
        this.title = '';
        this.body = '';
        this.topic = 'drivers';
      }, 2000);
    } catch (error: any) {
      console.error('Error sending notification:', error);
      this.errorMessage = 'فشل في إرسال الإشعار';
    } finally {
      this.isLoading = false;
    }
  }
}
