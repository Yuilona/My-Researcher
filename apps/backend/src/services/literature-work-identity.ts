import crypto from 'node:crypto';

export type LiteratureDedupCandidate = {
  doiNormalized: string | null;
  arxivId: string | null;
  titleAuthorsYearHash: string | null;
};

export type LiteratureWorkIdentityInput = {
  id?: string | null;
  title?: string | null;
  authors?: string[] | null;
  year?: number | null;
  doi?: string | null;
  doiNormalized?: string | null;
  arxiv_id?: string | null;
  arxivId?: string | null;
  titleAuthorsYearHash?: string | null;
};

export type LiteratureWorkIdentity = {
  canonicalWorkKey: string;
  identityKeys: string[];
  dedupCandidate: LiteratureDedupCandidate;
};

export function buildLiteratureWorkIdentity(input: LiteratureWorkIdentityInput): LiteratureWorkIdentity {
  const dedupCandidate = buildLiteratureDedupCandidate(input);
  const computedTitleAuthorsYearHash = buildLiteratureTitleAuthorsYearHash(
    input.title ?? '',
    input.authors ?? [],
    input.year ?? null,
  );
  const titleAuthorsYearHashes = [
    dedupCandidate.titleAuthorsYearHash,
    computedTitleAuthorsYearHash,
  ].filter((key): key is string => typeof key === 'string' && key.length > 0);
  const identityKeys = [
    dedupCandidate.doiNormalized ? `doi:${dedupCandidate.doiNormalized}` : null,
    dedupCandidate.arxivId ? `arxiv:${dedupCandidate.arxivId}` : null,
    ...[...new Set(titleAuthorsYearHashes)].map((hash) => `tay:${hash}`),
  ].filter((key): key is string => key !== null);

  if (identityKeys.length === 0) {
    const fallbackId = input.id?.trim();
    identityKeys.push(fallbackId ? `literature:${fallbackId}` : 'literature:unresolved');
  }

  return {
    canonicalWorkKey: selectCanonicalLiteratureWorkKey(identityKeys),
    identityKeys,
    dedupCandidate,
  };
}

export function buildLiteratureDedupCandidate(input: LiteratureWorkIdentityInput): LiteratureDedupCandidate {
  return {
    doiNormalized: normalizeLiteratureDoi(input.doiNormalized ?? input.doi ?? undefined),
    arxivId: normalizeLiteratureArxivId(input.arxivId ?? input.arxiv_id ?? undefined),
    titleAuthorsYearHash: input.titleAuthorsYearHash?.trim()
      || buildLiteratureTitleAuthorsYearHash(input.title ?? '', input.authors ?? [], input.year ?? null),
  };
}

export function selectCanonicalLiteratureWorkKey(keys: string[]): string {
  const uniqueKeys = [...new Set(keys.map((key) => key.trim()).filter((key) => key.length > 0))];
  if (uniqueKeys.length === 0) {
    return 'literature:unresolved';
  }
  return uniqueKeys.sort((left, right) => {
    const rankDelta = rankLiteratureWorkKey(left) - rankLiteratureWorkKey(right);
    return rankDelta !== 0 ? rankDelta : left.localeCompare(right);
  })[0]!;
}

export function rankLiteratureWorkKey(key: string): number {
  if (key.startsWith('doi:')) {
    return 0;
  }
  if (key.startsWith('arxiv:')) {
    return 1;
  }
  if (key.startsWith('tay:')) {
    return 2;
  }
  return 3;
}

export function buildLiteratureTitleAuthorsYearHash(
  title: string,
  authors: string[],
  year: number | null,
): string | null {
  if (!year) {
    return null;
  }
  const normalizedTitle = normalizeLiteratureTitle(title);
  const normalizedAuthors = normalizeLiteratureAuthors(authors);
  if (!normalizedTitle || normalizedAuthors.length === 0) {
    return null;
  }

  const raw = `${normalizedTitle}|${normalizedAuthors.join('|')}|${year}`;
  return crypto.createHash('sha1').update(raw).digest('hex');
}

export function normalizeLiteratureDoi(value?: string | null): string | null {
  if (!value) {
    return null;
  }

  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\/(?:dx\.)?doi\.org\//, '')
    .replace(/^doi:\s*/, '')
    .trim();
  return normalized || null;
}

export function normalizeLiteratureArxivId(value?: string | null): string | null {
  if (!value) {
    return null;
  }

  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\/arxiv\.org\/(?:abs|pdf)\//, '')
    .replace(/^arxiv:\s*/, '')
    .replace(/\.pdf$/, '')
    .trim();
  return normalized.replace(/v\d+$/, '') || null;
}

export function normalizeLiteratureTitle(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeLiteratureAuthors(authors: string[]): string[] {
  return authors
    .map((name) =>
      name
        .trim()
        .toLowerCase()
        .replace(/[^\p{L}\p{N}]+/gu, ' ')
        .replace(/\s+/g, ' ')
        .trim(),
    )
    .filter((name) => name.length > 0)
    .sort();
}
