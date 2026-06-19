export type MediaKind = 'image' | 'video' | 'unknown';
export type PreviewSupport = 'native' | 'external' | 'none';

export interface MediaLocation {
  latitude: number;
  longitude: number;
}

export interface MediaItem {
  id: string;
  path: string;
  name: string;
  extension: string;
  kind: MediaKind;
  previewSupport: PreviewSupport;
  size: number;
  modifiedAt: number;
  folder: string;
  selected: boolean;
  createdAt?: number;
  takenAt?: number;
  width?: number;
  height?: number;
  duration?: number;
  location?: MediaLocation;
  people?: string[];
  fingerprint?: string;
  perceptualHash?: string;
  sourceRoot?: string;
  mountPath?: string;
  previewUrl?: string;
  objectUrl?: string;
  previewError?: string;
}

export interface MediaGroup {
  id: string;
  label: string;
  items: MediaItem[];
}

export const IMAGE_EXTENSIONS = new Set([
  'jpg',
  'jpeg',
  'png',
  'gif',
  'webp',
  'bmp',
  'tif',
  'tiff',
  'avif',
  'heic',
  'heif',
  'jxl',
  'svg',
  'ico',
  'dng',
  'cr2',
  'cr3',
  'nef',
  'nrw',
  'arw',
  'srf',
  'sr2',
  'raf',
  'orf',
  'rw2',
  'pef',
  'rwl',
  'srw',
  'x3f',
  'psd'
]);

export const VIDEO_EXTENSIONS = new Set([
  'mp4',
  'm4v',
  'mov',
  'webm',
  'mkv',
  'avi',
  'wmv',
  'flv',
  'mpg',
  'mpeg',
  '3gp',
  '3g2',
  'mts',
  'm2ts',
  'ts',
  'ogv',
  'divx',
  'mxf'
]);

const NATIVE_IMAGE_PREVIEW_EXTENSIONS = new Set([
  'jpg',
  'jpeg',
  'png',
  'gif',
  'webp',
  'bmp',
  'avif',
  'svg',
  'ico'
]);

const NATIVE_VIDEO_PREVIEW_EXTENSIONS = new Set([
  'mp4',
  'm4v',
  'mov',
  'webm',
  'ogv'
]);

const MIME_TYPES = new Map<string, string>([
  ['jpg', 'image/jpeg'],
  ['jpeg', 'image/jpeg'],
  ['png', 'image/png'],
  ['gif', 'image/gif'],
  ['webp', 'image/webp'],
  ['bmp', 'image/bmp'],
  ['avif', 'image/avif'],
  ['svg', 'image/svg+xml'],
  ['ico', 'image/x-icon'],
  ['mp4', 'video/mp4'],
  ['m4v', 'video/mp4'],
  ['mov', 'video/quicktime'],
  ['webm', 'video/webm'],
  ['ogv', 'video/ogg']
]);

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
];

export function normalizePath(path: string): string {
  return path.replaceAll('\\', '/').replace(/\/{2,}/g, '/');
}

export function getExtension(path: string): string {
  const normalized = normalizePath(path);
  const filename = normalized.split('/').at(-1) ?? normalized;
  const dotIndex = filename.lastIndexOf('.');

  if (dotIndex < 0 || dotIndex === filename.length - 1) {
    return '';
  }

  return filename.slice(dotIndex + 1).toLowerCase();
}

export function getMediaKind(path: string): MediaKind {
  const extension = getExtension(path);

  if (IMAGE_EXTENSIONS.has(extension)) {
    return 'image';
  }

  if (VIDEO_EXTENSIONS.has(extension)) {
    return 'video';
  }

  return 'unknown';
}

export function getPreviewSupport(path: string): PreviewSupport {
  const extension = getExtension(path);
  const kind = getMediaKind(path);

  if (kind === 'image') {
    return NATIVE_IMAGE_PREVIEW_EXTENSIONS.has(extension) ? 'native' : 'external';
  }

  if (kind === 'video') {
    return NATIVE_VIDEO_PREVIEW_EXTENSIONS.has(extension) ? 'native' : 'external';
  }

  return 'none';
}

export function getMimeType(path: string): string {
  return MIME_TYPES.get(getExtension(path)) ?? 'application/octet-stream';
}

export function getParentFolder(path: string): string {
  const normalized = normalizePath(path);
  const index = normalized.lastIndexOf('/');

  if (index <= 0) {
    return normalized.includes(':') ? normalized.split('/')[0] : '/';
  }

  return normalized.slice(0, index);
}

export function joinPath(...parts: string[]): string {
  return normalizePath(parts.filter(Boolean).join('/')).replace(/([^:])\/{2,}/g, '$1/');
}

export function getRelativePath(path: string, root: string): string {
  const normalizedPath = normalizePath(path);
  const normalizedRoot = normalizePath(root).replace(/\/$/, '');

  if (normalizedPath === normalizedRoot) {
    return '';
  }

  if (normalizedPath.startsWith(`${normalizedRoot}/`)) {
    return normalizedPath.slice(normalizedRoot.length + 1);
  }

  return normalizedPath.split('/').at(-1) ?? normalizedPath;
}

export function createMediaItem(path: string, size: number, modifiedAt: number): MediaItem | null {
  const kind = getMediaKind(path);

  if (kind === 'unknown') {
    return null;
  }

  const normalizedPath = normalizePath(path);
  const name = normalizedPath.split('/').at(-1) ?? normalizedPath;

  return {
    id: normalizedPath,
    path: normalizedPath,
    name,
    extension: getExtension(normalizedPath),
    kind,
    previewSupport: getPreviewSupport(normalizedPath),
    size,
    modifiedAt,
    folder: getParentFolder(normalizedPath),
    selected: false
  };
}

export function buildTimelineGroups(items: MediaItem[]): MediaGroup[] {
  const groups = new Map<string, MediaItem[]>();

  for (const item of items) {
    const date = new Date(item.takenAt ?? item.createdAt ?? item.modifiedAt);
    const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
    const groupItems = groups.get(key) ?? [];
    groupItems.push(item);
    groups.set(key, groupItems);
  }

  return [...groups.entries()]
    .sort(([left], [right]) => right.localeCompare(left))
    .map(([key, groupItems]) => {
      const [year, month] = key.split('-').map(Number);
      return {
        id: key,
        label: `${MONTH_NAMES[month - 1]} ${year}`,
        items: sortNewestFirst(groupItems)
      };
    });
}

export function buildFolderGroups(items: MediaItem[]): MediaGroup[] {
  const groups = new Map<string, MediaItem[]>();

  for (const item of items) {
    const folder = item.folder || getParentFolder(item.path);
    const groupItems = groups.get(folder) ?? [];
    groupItems.push(item);
    groups.set(folder, groupItems);
  }

  return [...groups.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([folder, groupItems]) => ({
      id: folder,
      label: folder,
      items: sortNewestFirst(groupItems)
    }));
}

export function buildKindGroups(items: MediaItem[]): MediaGroup[] {
  const images = items.filter((item) => item.kind === 'image');
  const videos = items.filter((item) => item.kind === 'video');
  const groups: MediaGroup[] = [];

  if (images.length > 0) {
    groups.push({ id: 'images', label: 'Images', items: sortNewestFirst(images) });
  }

  if (videos.length > 0) {
    groups.push({ id: 'videos', label: 'Videos', items: sortNewestFirst(videos) });
  }

  return groups;
}

export function buildLocationGroups(items: MediaItem[]): MediaGroup[] {
  const withLocation = items.filter((item) => item.location);
  const withoutLocation = items.filter((item) => !item.location);
  const groups: MediaGroup[] = [];

  if (withLocation.length > 0) {
    groups.push({ id: 'gps', label: 'GPS tagged', items: sortNewestFirst(withLocation) });
  }

  if (withoutLocation.length > 0) {
    groups.push({ id: 'no-gps', label: 'No GPS metadata', items: sortNewestFirst(withoutLocation) });
  }

  return groups;
}

export function buildPeopleGroups(items: MediaItem[]): MediaGroup[] {
  const groups = new Map<string, MediaItem[]>();

  for (const item of items) {
    const people = item.people?.length ? item.people : ['Unassigned'];
    for (const person of people) {
      const group = groups.get(person) ?? [];
      group.push(item);
      groups.set(person, group);
    }
  }

  return [...groups.entries()]
    .sort(([left], [right]) => {
      if (left === 'Unassigned') return 1;
      if (right === 'Unassigned') return -1;
      return left.localeCompare(right);
    })
    .map(([person, groupItems]) => ({
      id: person,
      label: person,
      items: sortNewestFirst(groupItems)
    }));
}

export function sortNewestFirst(items: MediaItem[]): MediaItem[] {
  return [...items].sort((left, right) => {
    const leftTime = left.takenAt ?? left.createdAt ?? left.modifiedAt;
    const rightTime = right.takenAt ?? right.createdAt ?? right.modifiedAt;
    return rightTime - leftTime;
  });
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) {
    return '0 B';
  }

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exponent;
  const precision = value >= 10 || exponent === 0 ? 0 : 1;

  return `${value.toFixed(precision)} ${units[exponent]}`;
}

export function formatDate(timestamp?: number): string {
  if (!timestamp) {
    return 'Unknown';
  }

  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(new Date(timestamp));
}

export function formatDuration(seconds?: number): string {
  if (!seconds || isNaN(seconds) || seconds <= 0) return '';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
