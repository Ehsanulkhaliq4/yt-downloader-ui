import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { YtdlpService } from '../../services/ytdlp.service';
import { DownloadStatus } from '../../models/download-status.model';

@Component({
  selector: 'app-download-tracker',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatProgressBarModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatChipsModule,
  ],
  templateUrl: './download-tracker.component.html',
  styleUrls: ['./download-tracker.component.scss'],
})
export class DownloadTrackerComponent {
  private svc = inject(YtdlpService);
  downloads$ = this.svc.downloads$;

  progressMode(dl: DownloadStatus): 'determinate' | 'indeterminate' | 'buffer' | 'query' {
    if (dl.state === 'queued') return 'query';
    if (dl.state === 'processing') return 'indeterminate';
    return 'determinate';
  }

  progressColor(dl: DownloadStatus): 'primary' | 'accent' | 'warn' {
    if (dl.state === 'error') return 'warn';
    if (dl.state === 'completed') return 'accent';
    return 'primary';
  }

  stateIcon(dl: DownloadStatus): string {
    const icons: Record<string, string> = {
      queued: 'hourglass_empty',
      downloading: 'downloading',
      processing: 'settings',
      completed: 'check_circle',
      error: 'error',
    };
    return icons[dl.state] ?? 'help';
  }

  stateLabel(dl: DownloadStatus): string {
    const labels: Record<string, string> = {
      queued: 'Queued',
      downloading: `${dl.progress}%`,
      processing: 'Processing…',
      completed: 'Completed',
      error: 'Error',
    };
    return labels[dl.state] ?? dl.state;
  }

  etaLabel(seconds: number | null): string {
    if (seconds === null) return '';
    if (seconds < 60) return `${seconds}s`;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  }

  cancel(dl: DownloadStatus): void {
    this.svc.cancelDownload(dl.downloadId);
  }

  remove(dl: DownloadStatus): void {
    this.svc.removeDownload(dl.downloadId);
  }

  trackById(_: number, dl: DownloadStatus): string {
    return dl.downloadId;
  }
}
