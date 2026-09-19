import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveCropImagePath } from './cropImage.js';

test('uses a provided image path when it is already valid', () => {
  const crop = { id: 'rice', image: '/images/custom-rice.webp' };
  assert.equal(resolveCropImagePath(crop), '/images/custom-rice.webp');
});

test('maps known crop ids to the public image files', () => {
  const crop = { id: 'wheat' };
  assert.equal(resolveCropImagePath(crop), '/images/wheat.webp');
});

test('falls back to the placeholder when no matching image exists', () => {
  const crop = { id: 'unknown-crop' };
  assert.equal(resolveCropImagePath(crop), '/images/placeholder.svg');
});
