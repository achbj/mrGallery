import exifr from 'exifr';
import type { MediaItem, MediaLocation } from './media';

export interface ExtractedMetadata {
  takenAt?: number;
  createdAt?: number;
  width?: number;
  height?: number;
  location?: MediaLocation;
}

export async function extractImageMetadata(item: MediaItem): Promise<ExtractedMetadata> {
  const url = item.previewUrl ?? item.objectUrl;

  if (!url || item.kind !== 'image') {
    return {};
  }

  try {
    const metadata = await exifr.parse(url, {
      tiff: true,
      exif: true,
      gps: true,
      xmp: false,
      icc: false,
      iptc: false,
      jfif: false
    });

    if (!metadata) {
      return {};
    }

    const takenAt = dateToTimestamp(metadata.DateTimeOriginal ?? metadata.CreateDate);
    const createdAt = dateToTimestamp(metadata.CreateDate ?? metadata.ModifyDate);
    const width = numberFrom(
      metadata.ExifImageWidth,
      metadata.PixelXDimension,
      metadata.ImageWidth,
      metadata.ImageWidthValue
    );
    const height = numberFrom(
      metadata.ExifImageHeight,
      metadata.PixelYDimension,
      metadata.ImageHeight,
      metadata.ImageHeightValue
    );
    const latitude = numberFrom(metadata.latitude, metadata.GPSLatitude);
    const longitude = numberFrom(metadata.longitude, metadata.GPSLongitude);

    return {
      takenAt,
      createdAt,
      width,
      height,
      location:
        latitude !== undefined && longitude !== undefined
          ? { latitude, longitude }
          : undefined
    };
  } catch {
    return {};
  }
}

export async function computeAverageHash(url: string, sampleSize = 8): Promise<string | undefined> {
  try {
    const image = await loadImage(url);
    const canvas = document.createElement('canvas');
    canvas.width = sampleSize;
    canvas.height = sampleSize;

    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) {
      return undefined;
    }

    context.fillStyle = '#fff';
    context.fillRect(0, 0, sampleSize, sampleSize);
    context.drawImage(image, 0, 0, sampleSize, sampleSize);

    const pixels = context.getImageData(0, 0, sampleSize, sampleSize).data;
    const grays: number[] = [];

    for (let index = 0; index < pixels.length; index += 4) {
      const red = pixels[index];
      const green = pixels[index + 1];
      const blue = pixels[index + 2];
      grays.push(0.299 * red + 0.587 * green + 0.114 * blue);
    }

    const average = grays.reduce((sum, value) => sum + value, 0) / grays.length;
    return grays.map((value) => (value >= average ? '1' : '0')).join('');
  } catch {
    return undefined;
  }
}

export async function sha256Hex(buffer: BufferSource): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', buffer);
  return [...new Uint8Array(hash)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export function concatArrayBuffers(buffers: ArrayBuffer[]): ArrayBuffer {
  const length = buffers.reduce((sum, buffer) => sum + buffer.byteLength, 0);
  const output = new Uint8Array(length);
  let offset = 0;

  for (const buffer of buffers) {
    output.set(new Uint8Array(buffer), offset);
    offset += buffer.byteLength;
  }

  return output.buffer;
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Image could not be decoded'));
    image.src = url;
  });
}

function dateToTimestamp(value: unknown): number | undefined {
  if (value instanceof Date && Number.isFinite(value.getTime())) {
    return value.getTime();
  }

  if (typeof value === 'string' || typeof value === 'number') {
    const timestamp = new Date(value).getTime();
    return Number.isFinite(timestamp) ? timestamp : undefined;
  }

  return undefined;
}

function numberFrom(...values: unknown[]): number | undefined {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
  }

  return undefined;
}
