import { describe, expect, it } from 'vitest';
import {
  buildDuplicateGroups,
  hammingDistance,
  isSimilarHash,
  type DuplicateSource
} from '../src/lib/duplicates';

describe('duplicate and similarity analysis', () => {
  it('detects exact duplicate candidates by size and strong file fingerprint', () => {
    const sources: DuplicateSource[] = [
      source('/a/IMG_1001.jpg', 2048, 'abc'),
      source('/b/IMG_1001 copy.jpg', 2048, 'abc'),
      source('/c/IMG_1002.jpg', 2048, 'def')
    ];

    expect(buildDuplicateGroups(sources).exact).toHaveLength(1);
    expect(buildDuplicateGroups(sources).exact[0].items.map((entry) => entry.path)).toEqual([
      '/a/IMG_1001.jpg',
      '/b/IMG_1001 copy.jpg'
    ]);
  });

  it('detects similar image candidates with compact perceptual hashes', () => {
    const sources: DuplicateSource[] = [
      source('/a/a.jpg', 10, 'a', '1111000011110000'),
      source('/b/b.jpg', 11, 'b', '1111000011110001'),
      source('/c/c.jpg', 12, 'c', '0000111100001111')
    ];

    expect(buildDuplicateGroups(sources, { similarThreshold: 2 }).similar).toHaveLength(1);
  });

  it('computes hash distance and guards incompatible hash sizes', () => {
    expect(hammingDistance('101010', '101110')).toBe(1);
    expect(isSimilarHash('101010', '101110', 1)).toBe(true);
    expect(isSimilarHash('1010', '101010', 1)).toBe(false);
  });
});

function source(
  path: string,
  size: number,
  fingerprint: string,
  perceptualHash?: string
): DuplicateSource {
  return {
    id: path,
    path,
    size,
    fingerprint,
    perceptualHash
  };
}
