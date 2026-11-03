import test from 'node:test';
import assert from 'node:assert/strict';
import { adminClient } from '../scripts/admin-client.mjs';
test('administrative tools reject a different production project before creating clients', () => {
  const previous = process.env.GCLOUD_PROJECT;
  try {
    process.env.GCLOUD_PROJECT = 'unrelated-production-project';
    assert.throws(() => adminClient(), /solo admite el proyecto configurado/);
  } finally {
    if (previous === undefined) delete process.env.GCLOUD_PROJECT;
    else process.env.GCLOUD_PROJECT = previous;
  }
});
