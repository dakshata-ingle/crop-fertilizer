import test from 'node:test';
import assert from 'node:assert/strict';
import { translateText, translateTextBatch } from './translationService.js';

test('translateText returns original text when target language is the same', async () => {
  const result = await translateText('Hello', 'en');
  assert.equal(result.translatedText, 'Hello');
  assert.equal(result.usedFallback, false);
});

test('translateText falls back to the original text when the service fails', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    throw new Error('network down');
  };

  try {
    const result = await translateText('Hello', 'hi');
    assert.equal(result.translatedText, 'Hello');
    assert.equal(result.usedFallback, true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('translateTextBatch returns translated values from the service response', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => ({
    ok: true,
    json: async () => [{ translatedText: 'नमस्ते' }, { translatedText: 'विश्व' }],
  });

  try {
    const result = await translateTextBatch(['Hello', 'World'], 'hi');
    assert.deepEqual(result, ['नमस्ते', 'विश्व']);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
