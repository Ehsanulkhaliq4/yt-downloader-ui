import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { VideoInfo, VideoFormat } from '../../models/video-info.model';

@Component({
  selector: 'app-format-selector',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatBadgeModule,
    MatTooltipModule,
    MatChipsModule,
  ],
  templateUrl: './format-selector.component.html',
  styleUrls: ['./format-selector.component.scss'],
})
export class FormatSelectorComponent {
  @Input({ required: true }) video!: VideoInfo;
  @Output() download = new EventEmitter<VideoFormat>();

  selectedFormat = signal<VideoFormat | null>(null);

  displayedColumns = ['quality', 'ext', 'resolution', 'codec', 'size', 'action'];

  get combinedFormats(): VideoFormat[] {
    return this.video.formats.filter(f => f.type === 'video+audio');
  }

  get videoOnlyFormats(): VideoFormat[] {
    return this.video.formats.filter(f => f.type === 'video');
  }

  get audioFormats(): VideoFormat[] {
    return this.video.formats.filter(f => f.type === 'audio');
  }

  selectAndDownload(format: VideoFormat): void {
    this.selectedFormat.set(format);
    this.download.emit(format);
  }

  formatBytes(bytes: number | null): string {
    if (bytes === null) return '—';
    if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(0)} KB`;
    if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
    return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
  }

  codecLabel(format: VideoFormat): string {
    const parts: string[] = [];
    if (format.vcodec && format.vcodec !== 'none') parts.push(format.vcodec.split('.')[0]);
    if (format.acodec && format.acodec !== 'none') parts.push(format.acodec.split('.')[0]);
    return parts.join(' + ') || '—';
  }

  qualityColor(quality: string): 'primary' | 'accent' | 'warn' | '' {
    if (['2160p', '1440p', '1080p'].includes(quality)) return 'primary';
    if (['720p', '480p'].includes(quality)) return 'accent';
    return '';
  }
}
