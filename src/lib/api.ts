import { type MediaItem } from './media';

const API_BASE = 'http://127.0.0.1:8000/api';

export async function apiPickFolder(): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE}/dialog/folder`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.path;
  } catch (err) {
    console.error(err);
    return null;
  }
}

export interface FolderStat {
  path: string;
  count: number;
}

export async function apiGetFolders(): Promise<FolderStat[]> {
  const response = await fetch(`${API_BASE}/folders`);
  if (!response.ok) throw new Error('Failed to fetch folders');
  const data = await response.json();
  return data.folders;
}

export async function apiRemoveFolder(folder: string): Promise<number> {
  const response = await fetch(`${API_BASE}/folders`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ folder })
  });
  if (!response.ok) throw new Error('Failed to remove folder');
  const data = await response.json();
  return data.deleted;
}

export async function apiScanFolder(folder: string): Promise<number> {
  const response = await fetch(`${API_BASE}/scan?folder=${encodeURIComponent(folder)}`, {
    method: 'POST'
  });
  if (!response.ok) throw new Error('Failed to scan folder');
  const data = await response.json();
  return data.added;
}

export async function apiGetMedia(offset: number = 0, limit: number = 100, kind: string = 'all'): Promise<{items: MediaItem[], total: number}> {
  const response = await fetch(`${API_BASE}/media?offset=${offset}&limit=${limit}&kind=${kind}`);
  if (!response.ok) throw new Error('Failed to fetch media');
  const data = await response.json();
  
  // Format items
  data.items = data.items.map((item: any) => ({
    ...item,
    previewUrl: `${API_BASE}/thumbnail/${item.id}`,
    previewSupport: 'native', // Backend handles HEIC natively now!
    objectUrl: `${API_BASE}/file/${item.id}`
  }));
  
  return data;
}

export function getFileUrl(id: string): string {
  return `${API_BASE}/file/${id}`;
}

export function getThumbnailUrl(id: string): string {
  return `${API_BASE}/thumbnail/${id}`;
}

export async function apiDeleteFiles(ids: string[]): Promise<number> {
  const response = await fetch(`${API_BASE}/media`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids })
  });
  
  if (!response.ok) {
    throw new Error('Failed to delete files');
  }
  
  const data = await response.json();
  return data.deleted;
}

export async function apiAnalyzeDuplicates(): Promise<number> {
  const response = await fetch(`${API_BASE}/analyze`, { method: 'POST' });
  if (!response.ok) {
    throw new Error('Failed to analyze duplicates');
  }
  const data = await response.json();
  return data.analyzed;
}

export async function apiGetDuplicates(): Promise<MediaItem[][]> {
  const response = await fetch(`${API_BASE}/duplicates`);
  if (!response.ok) {
    throw new Error('Failed to fetch duplicates');
  }
  const data = await response.json();
  return data.groups;
}

export async function apiAnalyzeFaces(): Promise<{status: string, queued: number}> {
  const res = await fetch(`${API_BASE}/analyze/faces`, { method: 'POST' });
  return res.json();
}

export interface FaceScanStatus {
  running: boolean;
  total: number;
  done: number;
  current_file: string;
}

export async function apiFaceScanStatus(): Promise<FaceScanStatus> {
  const res = await fetch(`${API_BASE}/analyze/faces/status`);
  return res.json();
}

export interface FaceInfo {
  id: string;
  item_id: string;
  box: { x: number; y: number; w: number; h: number };
}

export async function apiGetPeople(): Promise<Record<string, FaceInfo[]>> {
  const response = await fetch(`${API_BASE}/people`);
  if (!response.ok) {
    throw new Error('Failed to fetch people');
  }
  const data = await response.json();
  return data.people;
}

export async function apiRenamePerson(oldName: string, newName: string): Promise<void> {
  const response = await fetch(`${API_BASE}/people/rename`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ old_name: oldName, new_name: newName })
  });
  if (!response.ok) {
    throw new Error('Failed to rename person');
  }
}
