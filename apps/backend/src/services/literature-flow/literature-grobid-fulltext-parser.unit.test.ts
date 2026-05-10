import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test, { after } from 'node:test';
import type { LiteratureContentAssetRecord } from '../../repositories/literature-repository.js';
import type { LiteratureContentProcessingSettingsService } from '../literature-content-processing-settings-service.js';
import { LiteratureGrobidFulltextParser } from './literature-grobid-fulltext-parser.js';

const tempDirs = new Set<string>();

after(async () => {
  await Promise.all([...tempDirs].map((dir) => fs.rm(dir, { recursive: true, force: true })));
});

test('GROBID TEI parser extracts sections, paragraphs, and layout anchors', () => {
  const parser = new LiteratureGrobidFulltextParser();
  const result = parser.parseTei([
    '<TEI xmlns="http://www.tei-c.org/ns/1.0">',
    '<text><body>',
    '<div xml:id="section-0001" coords="1,10,20,500,40">',
    '<head>Method</head>',
    '<p xml:id="para-0001" coords="1,10,70,500,80">The method paragraph describes the model.</p>',
    '<formula xml:id="formula-0001" coords="1,15,160,200,40">y = f(x)</formula>',
    '<figure xml:id="figure-0001" coords="2,20,30,240,120"><label>Figure 1</label><figDesc>Architecture overview.</figDesc></figure>',
    '</div>',
    '</body></text>',
    '</TEI>',
  ].join(''));

  assert.match(result.normalizedText, /# Method/);
  assert.equal(result.sections[0]?.sectionId, 'section-0001');
  assert.equal(result.paragraphs[0]?.paragraphId, 'para-0001');
  assert.equal(result.paragraphs[0]?.pageNumber, 1);
  const figure = result.anchors.find((anchor) => anchor.anchorType === 'figure');
  assert.equal(figure?.anchorId, 'figure-0001');
  assert.equal(figure?.pageNumber, 2);
  assert.deepEqual(figure?.bbox, {
    raw: '2,20,30,240,120',
    boxes: [{ page: 2, x: 20, y: 30, width: 240, height: 120 }],
  });
  assert.equal(result.anchors.some((anchor) => anchor.anchorType === 'formula'), true);
});

test('GROBID parser emits parser quality diagnostics on successful parses', async () => {
  const previousFetch = globalThis.fetch;
  const teiXml = [
    '<TEI xmlns="http://www.tei-c.org/ns/1.0">',
    '<text><body>',
    '<div xml:id="section-0001" coords="1,10,20,500,40">',
    '<head>Method</head>',
    '<p xml:id="para-0001" coords="1,10,70,500,80">Short extracted paragraph.</p>',
    '<figure xml:id="figure-0001" coords="1,20,30,240,120"><label>Figure 1</label></figure>',
    '</div>',
    '</body></text>',
    '</TEI>',
  ].join('');
  globalThis.fetch = (async (input: Parameters<typeof fetch>[0]) => {
    assert.equal(String(input), 'http://grobid.test/api/processFulltextDocument');
    return new Response(teiXml, {
      status: 200,
      headers: { 'Content-Type': 'application/xml' },
    });
  }) as typeof fetch;

  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'pea-grobid-parser-'));
  tempDirs.add(dir);
  const localPath = path.join(dir, 'paper.pdf');
  await fs.writeFile(localPath, '%PDF-1.4 fixture', 'utf8');
  const settingsService = {
    resolveGrobidEndpointUrl: async () => 'http://grobid.test',
  } as unknown as LiteratureContentProcessingSettingsService;
  const parser = new LiteratureGrobidFulltextParser(settingsService);

  try {
    const result = await parser.parse({
      id: 'asset-1',
      literatureId: 'lit-1',
      assetKind: 'raw_fulltext',
      sourceKind: 'local_path',
      localPath,
      checksum: 'checksum',
      mimeType: 'application/pdf',
      byteSize: 16,
      rightsClass: 'OA',
      status: 'registered',
      metadata: {},
      createdAt: '2026-05-11T00:00:00.000Z',
      updatedAt: '2026-05-11T00:00:00.000Z',
    } satisfies LiteratureContentAssetRecord);

    assert.equal(result.ready, true);
    if (result.ready) {
      const parsedDiagnostic = result.diagnostics.find((item) => item.code === 'GROBID_TEI_PARSED');
      assert.equal(typeof parsedDiagnostic?.parser_quality_score, 'number');
      assert.equal(parsedDiagnostic?.parser_quality_bucket, 'low');
      assert.deepEqual(parsedDiagnostic?.parser_quality_inputs, {
        text_length: 35,
        section_count: 1,
        paragraph_count: 1,
        anchor_count: 1,
        average_paragraph_length: 26,
        page_count: 1,
      });
      assert.equal(result.diagnostics.some((item) => item.code === 'FULLTEXT_PARSER_QUALITY_LOW'), true);
    }
  } finally {
    globalThis.fetch = previousFetch;
  }
});
