export interface DuplicateSource {
  id: string;
  path: string;
  size: number;
  fingerprint?: string;
  perceptualHash?: string;
}

export interface DuplicateGroup {
  id: string;
  reason: 'exact' | 'similar';
  items: DuplicateSource[];
}

export interface DuplicateGroups {
  exact: DuplicateGroup[];
  similar: DuplicateGroup[];
}

export interface DuplicateOptions {
  similarThreshold?: number;
}

const DEFAULT_SIMILAR_THRESHOLD = 8;

export function buildDuplicateGroups(
  sources: DuplicateSource[],
  options: DuplicateOptions = {}
): DuplicateGroups {
  const exact = buildExactGroups(sources);
  const similar = buildSimilarGroups(sources, options.similarThreshold ?? DEFAULT_SIMILAR_THRESHOLD);

  return { exact, similar };
}

export function hammingDistance(left: string, right: string): number {
  if (left.length !== right.length) {
    return Number.POSITIVE_INFINITY;
  }

  let distance = 0;
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) {
      distance += 1;
    }
  }

  return distance;
}

export function isSimilarHash(left: string, right: string, threshold: number): boolean {
  return hammingDistance(left, right) <= threshold;
}

function buildExactGroups(sources: DuplicateSource[]): DuplicateGroup[] {
  const groups = new Map<string, DuplicateSource[]>();

  for (const source of sources) {
    if (!source.fingerprint) {
      continue;
    }

    const key = `${source.size}:${source.fingerprint}`;
    const group = groups.get(key) ?? [];
    group.push(source);
    groups.set(key, group);
  }

  return [...groups.entries()]
    .filter(([, group]) => group.length > 1)
    .map(([id, group]) => ({
      id,
      reason: 'exact',
      items: group
    }));
}

function buildSimilarGroups(sources: DuplicateSource[], threshold: number): DuplicateGroup[] {
  const hashSources = sources.filter((source) => source.perceptualHash);
  const parent = new Map<string, string>();

  for (const source of hashSources) {
    parent.set(source.id, source.id);
  }

  for (let leftIndex = 0; leftIndex < hashSources.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < hashSources.length; rightIndex += 1) {
      const left = hashSources[leftIndex];
      const right = hashSources[rightIndex];

      if (
        left.perceptualHash &&
        right.perceptualHash &&
        isSimilarHash(left.perceptualHash, right.perceptualHash, threshold)
      ) {
        union(parent, left.id, right.id);
      }
    }
  }

  const clusters = new Map<string, DuplicateSource[]>();

  for (const source of hashSources) {
    const root = find(parent, source.id);
    const group = clusters.get(root) ?? [];
    group.push(source);
    clusters.set(root, group);
  }

  return [...clusters.entries()]
    .filter(([, group]) => group.length > 1)
    .map(([id, group]) => ({
      id,
      reason: 'similar',
      items: group
    }));
}

function find(parent: Map<string, string>, id: string): string {
  const value = parent.get(id);

  if (!value || value === id) {
    return id;
  }

  const root = find(parent, value);
  parent.set(id, root);

  return root;
}

function union(parent: Map<string, string>, left: string, right: string): void {
  const leftRoot = find(parent, left);
  const rightRoot = find(parent, right);

  if (leftRoot !== rightRoot) {
    parent.set(rightRoot, leftRoot);
  }
}
