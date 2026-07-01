export type DownloadState = 'queued' | 'downloading' | 'processing' | 'completed' | 'error';

export interface DownloadStatus {
  downloadId: string;
  videoTitle: string;
  thumbnail: string;
  formatNote: string;
  state: DownloadState;
  progress: number;
  speed: string | null;
  eta: number | null;
  totalSize: string | null;
  downloadedSize: string | null;
  filename: string | null;
  error: string | null;
  startedAt: Date;
}
