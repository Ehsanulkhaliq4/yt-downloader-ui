import { Component, inject, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';

import { UrlInputComponent } from './components/url-input/url-input.component';
import { VideoCardComponent } from './components/video-card/video-card.component';
import { FormatSelectorComponent } from './components/format-selector/format-selector.component';
import { DownloadTrackerComponent } from './components/download-tracker/download-tracker.component';
import { YtdlpService } from './services/ytdlp.service';
import { VideoInfo, VideoFormat } from './models/video-info.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatDividerModule,
    UrlInputComponent,
    VideoCardComponent,
    FormatSelectorComponent,
    DownloadTrackerComponent,
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  private svc = inject(YtdlpService);
  private snack = inject(MatSnackBar);

  @ViewChild(UrlInputComponent) urlInput!: UrlInputComponent;

  videoInfo = signal<VideoInfo | null>(null);
  showFormats = signal(false);
  error = signal<string | null>(null);
  darkMode = signal(false);

  onFetchInfo(url: string): void {
    this.videoInfo.set(null);
    this.showFormats.set(false);
    this.error.set(null);
    this.urlInput.setLoading(true);

    this.svc.fetchVideoInfo(url).subscribe({
      next: (info) => {
        this.videoInfo.set(info);
        this.urlInput.setLoading(false);
      },
      error: (err) => {
        this.error.set(err?.message ?? 'Failed to fetch video info. Check the URL and try again.');
        this.urlInput.setLoading(false);
      },
    });
  }

  onShowFormats(): void {
    this.showFormats.set(true);
    setTimeout(() => {
      document.getElementById('format-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  }

  onDownload(format: VideoFormat): void {
    const info = this.videoInfo();
    if (!info) return;

    this.svc.startDownload(info, format).subscribe({
      next: () => {
        this.snack.open(`Download started: ${format.quality} ${format.note}`, 'Dismiss', {
          duration: 3000,
          horizontalPosition: 'right',
          verticalPosition: 'bottom',
        });
        setTimeout(() => {
          document.getElementById('download-tracker')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 200);
      },
      error: () => {
        this.snack.open('Failed to start download', 'Close', { duration: 4000 });
      },
    });
  }

  toggleDark(): void {
    this.darkMode.update(v => !v);
    document.body.classList.toggle('dark-mode', this.darkMode());
  }

  resetSearch(): void {
    this.videoInfo.set(null);
    this.showFormats.set(false);
    this.error.set(null);
  }
}
