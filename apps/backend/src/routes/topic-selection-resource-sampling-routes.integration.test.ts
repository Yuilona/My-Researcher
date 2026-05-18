import assert from 'node:assert/strict';
import test from 'node:test';

import { buildApp } from '../app.js';

test('topic-selection resource sampling routes create blocked empty sample and read it back', async () => {
  const app = buildApp();
  await app.ready();

  try {
    const createResponse = await app.inject({
      method: 'POST',
      url: '/topic-selection/v1a/resource-samples',
      payload: {
        topic_id: 'topic_without_resources',
        sample_size: 4,
      },
    });
    assert.equal(createResponse.statusCode, 201);
    const created = createResponse.json();
    assert.equal(created.sample_set.status, 'blocked');
    assert.equal(created.sample_set.warnings.includes('NO_ELIGIBLE_RESOURCE_CANDIDATES'), true);

    const readResponse = await app.inject({
      method: 'GET',
      url: `/topic-selection/v1a/resource-samples/${created.sample_set.resource_sample_set_id}`,
    });
    assert.equal(readResponse.statusCode, 200);
    const readBack = readResponse.json();
    assert.equal(readBack.sample_set.resource_sample_set_id, created.sample_set.resource_sample_set_id);
    assert.deepEqual(readBack.selected_items, []);
  } finally {
    await app.close();
  }
});

test('topic-selection resource sampling route rejects malformed payloads with INVALID_PAYLOAD', async () => {
  const app = buildApp();
  await app.ready();

  try {
    const response = await app.inject({
      method: 'POST',
      url: '/topic-selection/v1a/resource-samples',
      payload: {
        sample_size: 4,
      },
    });
    assert.equal(response.statusCode, 400);
    assert.equal(response.json().error.code, 'INVALID_PAYLOAD');
  } finally {
    await app.close();
  }
});
