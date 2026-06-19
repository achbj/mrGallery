import { describe, expect, it } from 'vitest';
import {
  buildFolderGroups,
  buildTimelineGroups,
  getMediaKind,
  getPreviewSupport,
  normalizePath,
  type MediaItem
} from '../src/lib/media';

describe('media format detection', () => {
  it('recognizes common, professional, and phone image/video formats case-insensitively', () => {
    expect(getMediaKind('/photos/IMG_001.HEIC')).toBe('image');
    expect(getMediaKind('D:\\shoot\\raw\\frame.CR3')).toBe('image');
    expect(getMediaKind('/mnt/archive/camera/clip.M2TS')).toBe('video');
    expect(getMediaKind('/tmp/readme.txt')).toBe('unknown');
  });

  it('separates indexable formats from formats the webview can usually preview natively', () => {
    expect(getPreviewSupport('/photos/edited.webp')).toBe('native');
    expect(getPreviewSupport('/photos/raw.NEF')).toBe('external');
    expect(getPreviewSupport('/video/family.mkv')).toBe('external');
    expect(getPreviewSupport('/video/family.mp4')).toBe('native');
  });
});

describe('media organization', () => {
  const items: MediaItem[] = [
    item('/Volumes/Travel/DCIM/IMG_001.jpg', 'image', 10, Date.UTC(2025, 4, 1)),
    item('/Volumes/Travel/DCIM/IMG_002.jpg', 'image', 12, Date.UTC(2025, 4, 2)),
    item('D:\\Archive\\Videos\\clip.mov', 'video', 20, Date.UTC(2024, 11, 30))
  ];

  it('normalizes paths across macOS/Linux and Windows separators', () => {
    expect(normalizePath('D:\\Archive\\Videos\\clip.mov')).toBe('D:/Archive/Videos/clip.mov');
  });

  it('groups timeline entries by month newest first', () => {
    expect(buildTimelineGroups(items).map((group) => group.label)).toEqual(['May 2025', 'December 2024']);
  });

  it('groups folder entries by parent folder', () => {
    expect(buildFolderGroups(items).map((group) => group.label)).toEqual([
      '/Volumes/Travel/DCIM',
      'D:/Archive/Videos'
    ]);
  });
});

function item(path: string, kind: MediaItem['kind'], size: number, modifiedAt: number): MediaItem {
  return {
    id: path,
    path,
    name: path.split(/[\\/]/).at(-1) ?? path,
    extension: path.split('.').at(-1) ?? '',
    kind,
    previewSupport: 'native',
    size,
    modifiedAt,
    folder: '',
    selected: false
  };
}
