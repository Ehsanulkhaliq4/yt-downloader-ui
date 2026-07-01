import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, interval, BehaviorSubject, Subscription } from 'rxjs';
import { delay, switchMap, takeWhile, tap } from 'rxjs/operators';
import { VideoInfo, VideoFormat } from '../models/video-info.model';
import { DownloadStatus, DownloadState } from '../models/download-status.model';

const API_BASE = '/api';

// Set to false once Quarkus backend is running
const USE_MOCK = false;

@Injectable({ providedIn: 'root' })
export class YtdlpService {
  private downloads = new BehaviorSubject<DownloadStatus[]>([]);
  downloads$ = this.downloads.asObservable();

  private pollSubs = new Map<string, Subscription>();

  constructor(private http: HttpClient) {}

  // ── Public API ──────────────────────────────────────────────────────────

  fetchVideoInfo(url: string): Observable<VideoInfo> {
    if (USE_MOCK) return this.mockVideoInfo(url);
    return this.http.get<VideoInfo>(`${API_BASE}/video/info`, { params: { url } });
  }

  startDownload(videoInfo: VideoInfo, format: VideoFormat): Observable<{ downloadId: string }> {
    if (USE_MOCK) return this.mockStartDownload(videoInfo, format);

    const body = {
      url: videoInfo.webpageUrl,
      formatId: format.formatId,
      formatNote: `${format.quality} ${format.note}`,
      videoTitle: videoInfo.title,
      thumbnail: videoInfo.thumbnail,
    };

    return this.http.post<{ downloadId: string }>(`${API_BASE}/download/start`, body).pipe(
      tap(({ downloadId }) => this.beginPolling(downloadId, videoInfo, format))
    );
  }

  cancelDownload(downloadId: string): void {
    this.stopPolling(downloadId);
    if (!USE_MOCK) {
      this.http.delete(`${API_BASE}/download/${downloadId}`).subscribe();
    }
    this.patchDownload(downloadId, { state: 'error', error: 'Cancelled' });
    setTimeout(() => this.removeDownload(downloadId), 800);
  }

  removeDownload(downloadId: string): void {
    this.stopPolling(downloadId);
    if (!USE_MOCK) {
      this.http.delete(`${API_BASE}/download/${downloadId}?remove=true`).subscribe();
    }
    const current = this.downloads.getValue();
    this.downloads.next(current.filter(d => d.downloadId !== downloadId));
  }

  // ── Real backend polling ────────────────────────────────────────────────

  private beginPolling(downloadId: string, videoInfo: VideoInfo, format: VideoFormat): void {
    const placeholder: DownloadStatus = {
      downloadId,
      videoTitle: videoInfo.title,
      thumbnail: videoInfo.thumbnail,
      formatNote: `${format.quality} ${format.note}`,
      state: 'queued',
      progress: 0,
      speed: null,
      eta: null,
      totalSize: null,
      downloadedSize: null,
      filename: null,
      error: null,
      startedAt: new Date(),
    };
    this.upsertDownload(placeholder);

    const sub = interval(500).pipe(
      switchMap(() => this.http.get<DownloadStatus>(`${API_BASE}/download/${downloadId}/progress`)),
      tap(status => this.upsertDownload(status)),
      takeWhile(status => status.state !== 'completed' && status.state !== 'error', true)
    ).subscribe({ error: () => this.stopPolling(downloadId) });

    this.pollSubs.set(downloadId, sub);
  }

  private stopPolling(downloadId: string): void {
    this.pollSubs.get(downloadId)?.unsubscribe();
    this.pollSubs.delete(downloadId);
  }

  private upsertDownload(status: DownloadStatus): void {
    const current = this.downloads.getValue();
    const idx = current.findIndex(d => d.downloadId === status.downloadId);
    if (idx >= 0) {
      const updated = [...current];
      updated[idx] = status;
      this.downloads.next(updated);
    } else {
      this.downloads.next([...current, status]);
    }
  }

  private patchDownload(downloadId: string, patch: Partial<DownloadStatus>): void {
    const current = this.downloads.getValue();
    this.downloads.next(current.map(d => d.downloadId === downloadId ? { ...d, ...patch } : d));
  }

  // ── Mock implementations ────────────────────────────────────────────────

  private mockVideoInfo(url: string): Observable<VideoInfo> {
    const info: VideoInfo = {
      id: 'dQw4w9WgXcQ',
      title: 'Rick Astley - Never Gonna Give You Up (Official Video)',
      thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
      duration: 212,
      channel: 'Rick Astley',
      channelUrl: 'https://www.youtube.com/@RickAstleyYT',
      viewCount: 1_500_000_000,
      likeCount: 16_000_000,
      uploadDate: '2009-10-25',
      description: 'The official video for "Never Gonna Give You Up" by Rick Astley.',
      url,
      webpageUrl: url,
      formats: this.mockFormats(),
    };
    return of(info).pipe(delay(1400));
  }

  private mockFormats(): VideoFormat[] {
    return [
      { formatId: '137+140', ext: 'mp4', resolution: '1920x1080', fps: 30, vcodec: 'avc1', acodec: 'mp4a', filesize: 145_000_000, tbr: 2800, type: 'video+audio', quality: '1080p', note: 'Full HD' },
      { formatId: '136+140', ext: 'mp4', resolution: '1280x720',  fps: 30, vcodec: 'avc1', acodec: 'mp4a', filesize: 78_000_000,  tbr: 1500, type: 'video+audio', quality: '720p',  note: 'HD' },
      { formatId: '135+140', ext: 'mp4', resolution: '854x480',   fps: 30, vcodec: 'avc1', acodec: 'mp4a', filesize: 42_000_000,  tbr: 800,  type: 'video+audio', quality: '480p',  note: 'SD' },
      { formatId: '134+140', ext: 'mp4', resolution: '640x360',   fps: 30, vcodec: 'avc1', acodec: 'mp4a', filesize: 22_000_000,  tbr: 400,  type: 'video+audio', quality: '360p',  note: 'Low' },
      { formatId: '271',     ext: 'webm', resolution: '2560x1440', fps: 30, vcodec: 'vp9',  acodec: 'none', filesize: 220_000_000, tbr: 4000, type: 'video',       quality: '1440p', note: '2K Video Only' },
      { formatId: '137',     ext: 'mp4', resolution: '1920x1080', fps: 30, vcodec: 'avc1', acodec: 'none', filesize: 125_000_000, tbr: 2600, type: 'video',       quality: '1080p', note: 'Video Only' },
      { formatId: '140',     ext: 'm4a', resolution: 'audio only', fps: null, vcodec: 'none', acodec: 'mp4a.40.2', filesize: 3_500_000, tbr: 128, type: 'audio', quality: '128k', note: 'AAC 128kbps' },
      { formatId: '251',     ext: 'webm', resolution: 'audio only', fps: null, vcodec: 'none', acodec: 'opus', filesize: 2_800_000, tbr: 160, type: 'audio', quality: '160k', note: 'Opus 160kbps' },
    ];
  }

  private mockStartDownload(videoInfo: VideoInfo, format: VideoFormat): Observable<{ downloadId: string }> {
    const downloadId = `dl_${Date.now()}`;
    const status: DownloadStatus = {
      downloadId,
      videoTitle: videoInfo.title,
      thumbnail: videoInfo.thumbnail,
      formatNote: `${format.quality} ${format.note}`,
      state: 'queued',
      progress: 0,
      speed: null,
      eta: null,
      totalSize: this.formatBytes(format.filesize),
      downloadedSize: '0 B',
      filename: null,
      error: null,
      startedAt: new Date(),
    };

    this.upsertDownload(status);
    this.simulateProgress(downloadId, format.filesize ?? 50_000_000);
    return of({ downloadId }).pipe(delay(300));
  }

  private simulateProgress(downloadId: string, totalBytes: number): void {
    let progress = 0;
    const sub = interval(400).pipe(
      takeWhile(() => progress < 100)
    ).subscribe(() => {
      const increment = Math.random() * 4 + 1;
      progress = Math.min(progress + increment, 100);
      const downloaded = Math.floor((progress / 100) * totalBytes);
      const speed = Math.floor(Math.random() * 3_000_000 + 500_000);
      const remaining = totalBytes - downloaded;
      const eta = Math.floor(remaining / speed);
      const state: DownloadState = progress >= 100 ? 'processing' : 'downloading';

      this.patchDownload(downloadId, {
        state,
        progress: Math.floor(progress),
        speed: this.formatBytes(speed) + '/s',
        eta,
        downloadedSize: this.formatBytes(downloaded),
      });

      if (progress >= 100) {
        setTimeout(() => {
          this.patchDownload(downloadId, {
            state: 'completed',
            progress: 100,
            speed: null,
            eta: null,
            filename: `video_${downloadId.slice(-6)}.mp4`,
          });
          sub.unsubscribe();
        }, 1200);
      }
    });
  }

  private formatBytes(bytes: number | null): string | null {
    if (bytes === null) return null;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
    return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
  }
}
