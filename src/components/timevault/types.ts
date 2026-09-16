export interface Site {
  id: string;
  url: string;
  domain: string;
  title: string;
  description: string | null;
  favicon: string | null;
  createdAt: string;
  lastArchivedAt: string | null;
  _count?: { snapshots: number };
}

export interface SnapshotMeta {
  id: string;
  siteId: string;
  capturedAt: string;
  title: string;
  excerpt: string | null;
  status: string;
  contentLength: number | null;
  publishedTime: string | null;
  captureMs: number | null;
}

export interface SnapshotFull extends SnapshotMeta {
  html: string;
  text: string | null;
}
