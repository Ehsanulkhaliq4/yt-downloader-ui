import { Component, EventEmitter, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-url-input',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './url-input.component.html',
  styleUrls: ['./url-input.component.scss'],
})
export class UrlInputComponent {
  @Output() fetchInfo = new EventEmitter<string>();

  url = '';
  loading = signal(false);

  onFetch(): void {
    const trimmed = this.url.trim();
    if (!trimmed) return;
    this.fetchInfo.emit(trimmed);
  }

  onPaste(event: ClipboardEvent): void {
    const text = event.clipboardData?.getData('text') ?? '';
    if (this.isVideoUrl(text)) {
      this.url = text;
      setTimeout(() => this.onFetch(), 100);
    }
  }

  isVideoUrl(url: string): boolean {
    return /^https?:\/\/(www\.)?(youtube\.com|youtu\.be|vimeo\.com|dailymotion\.com|twitch\.tv)/.test(url);
  }

  setLoading(val: boolean): void {
    this.loading.set(val);
  }

  clearUrl(): void {
    this.url = '';
  }
}
