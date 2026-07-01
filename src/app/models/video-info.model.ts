export interface VideoFormat {
  formatId: string;
  ext: string;
  resolution: string;
  fps: number | null;
  vcodec: string;
  acodec: string;
  filesize: number | null;
  tbr: number | null;
  type: 'video+audio' | 'video' | 'audio';
  quality: string;
  note: string;
}

export interface VideoInfo {
  id: string;
  title: string;
  thumbnail: string;
  duration: number;
  channel: string;
  channelUrl: string;
  viewCount: number;
  likeCount: number;
  uploadDate: string;
  description: string;
  url: string;
  formats: VideoFormat[];
  webpageUrl: string;
}
