import { ESLint } from 'eslint';
import assert from 'node:assert/strict';
import { test } from 'node:test';

test('ESLint rejects private keywords and brace-free control statements', async () => {
  const eslint = new ESLint();
  const [result] = await eslint.lintText(
    'export class Example { private value = 0; read() { if (this.value) return 1; return 0; } }',
    { filePath: 'src/lint-fixture.ts' }
  );
  assert.ok(result?.messages.some((message) => message.ruleId === 'no-restricted-syntax'));
  assert.ok(result?.messages.some((message) => message.ruleId === 'curly'));
  const [valid] = await eslint.lintText(
    'export class Example { #value = 0; read() { if (this.#value) { return 1; } return 0; } }',
    { filePath: 'src/lint-fixture.ts' }
  );
  assert.equal(valid?.errorCount, 0);
});
