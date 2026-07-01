import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { VideoInfo } from '../../models/video-info.model';

@Component({
  selector: 'app-video-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatChipsModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
  ],
  templateUrl: './video-card.component.html',
  styleUrls: ['./video-card.component.scss'],
})
export class VideoCardComponent {
  @Input({ required: true }) video!: VideoInfo;
  @Output() selectFormats = new EventEmitter<void>();

  showFullDescription = false;

  get formattedDuration(): string {
    const s = this.video.duration;
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}:${this.pad(m)}:${this.pad(sec)}`;
    return `${m}:${this.pad(sec)}`;
  }

  get formattedViews(): string {
    const v = this.video.viewCount;
    if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}B`;
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
    return v.toString();
  }

  get formattedLikes(): string {
    const l = this.video.likeCount;
    if (l >= 1_000_000) return `${(l / 1_000_000).toFixed(1)}M`;
    if (l >= 1_000) return `${(l / 1_000).toFixed(1)}K`;
    return l.toString();
  }

  get formatCount(): number {
    return this.video.formats.length;
  }

  get shortDescription(): string {
    const max = 200;
    if (this.video.description.length <= max) return this.video.description;
    return this.video.description.slice(0, max) + '…';
  }

  private pad(n: number): string {
    return n.toString().padStart(2, '0');
  }
}
