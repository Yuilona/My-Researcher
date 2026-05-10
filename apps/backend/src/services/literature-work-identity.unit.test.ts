import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildLiteratureTitleAuthorsYearHash,
  buildLiteratureWorkIdentity,
  normalizeLiteratureArxivId,
  normalizeLiteratureDoi,
} from './literature-work-identity.js';

test('literature work identity prefers DOI and retains weaker aliases for grouping', () => {
  const identity = buildLiteratureWorkIdentity({
    id: 'LIT-WORK-1',
    title: '  Work Identity: A Test  ',
    authors: ['Bob Example', 'Alice Example'],
    year: 2025,
    doi: 'https://doi.org/10.1000/Work.Identity',
    arxiv_id: 'https://arxiv.org/pdf/2501.12345v2.pdf',
  });

  assert.equal(identity.canonicalWorkKey, 'doi:10.1000/work.identity');
  assert.equal(identity.identityKeys.includes('doi:10.1000/work.identity'), true);
  assert.equal(identity.identityKeys.includes('arxiv:2501.12345'), true);
  assert.equal(identity.identityKeys.some((key) => key.startsWith('tay:')), true);
});

test('literature title-author-year hash is stable across author order and punctuation', () => {
  const left = buildLiteratureTitleAuthorsYearHash(
    'Graph-Augmented Retrieval',
    ['Alice Smith', 'Bob Jones'],
    2024,
  );
  const right = buildLiteratureTitleAuthorsYearHash(
    'Graph augmented retrieval',
    ['Bob Jones', 'Alice Smith'],
    2024,
  );

  assert.ok(left);
  assert.equal(left, right);
});

test('literature identifier normalization handles DOI and arXiv URL variants', () => {
  assert.equal(normalizeLiteratureDoi('DOI: 10.5555/ABC.DEF'), '10.5555/abc.def');
  assert.equal(normalizeLiteratureDoi('https://dx.doi.org/10.5555/ABC.DEF'), '10.5555/abc.def');
  assert.equal(normalizeLiteratureArxivId('arXiv:2401.01234v3'), '2401.01234');
  assert.equal(normalizeLiteratureArxivId('https://arxiv.org/pdf/2401.01234v2.pdf'), '2401.01234');
});
