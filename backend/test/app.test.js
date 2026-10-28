const { test } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');

const uploadDirectory = path.join(os.tmpdir(), `dms-test-${crypto.randomUUID()}`);
process.env.UPLOAD_DIR = uploadDirectory;
process.env.MAX_UPLOAD_SIZE_BYTES = '16';
process.env.MAX_DOCUMENTS_PER_USER = '1';
process.env.MAX_UPLOADS_PER_MINUTE = '3';

const app = require('../src/app');

test('upload, listagem e download respeitam o usuário e os limites', async (t) => {
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  t.after(async () => {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
    await fs.rm(uploadDirectory, { recursive: true, force: true });
  });

  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;
  const headers = { 'X-User-Id': 'user-a' };
  const formData = new FormData();
  formData.append('file', new Blob(['documento']), 'relatorio.txt');

  const uploadResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers,
    body: formData,
  });
  assert.equal(uploadResponse.status, 201);

  const document = await uploadResponse.json();
  assert.equal(document.originalName, 'relatorio.txt');
  assert.equal(document.owner, 'user-a');
  assert.equal(Object.hasOwn(document, 'storagePath'), false);

  const ownListResponse = await fetch(`${baseUrl}/documents`, { headers });
  assert.equal(ownListResponse.status, 200);
  assert.deepEqual((await ownListResponse.json()).map(({ id }) => id), [document.id]);

  const otherUserHeaders = { 'X-User-Id': 'user-b' };
  const otherListResponse = await fetch(`${baseUrl}/documents`, {
    headers: otherUserHeaders,
  });
  assert.deepEqual(await otherListResponse.json(), []);

  const forbiddenDownload = await fetch(
    `${baseUrl}/documents/${document.id}/download`,
    { headers: otherUserHeaders },
  );
  assert.equal(forbiddenDownload.status, 404);

  const downloadResponse = await fetch(
    `${baseUrl}/documents/${document.id}/download`,
    { headers },
  );
  assert.equal(downloadResponse.status, 200);
  assert.equal(await downloadResponse.text(), 'documento');

  const missingUserResponse = await fetch(`${baseUrl}/documents`);
  assert.equal(missingUserResponse.status, 401);

  const quotaForm = new FormData();
  quotaForm.append('file', new Blob(['outro']), 'outro.txt');
  const quotaResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers,
    body: quotaForm,
  });
  assert.equal(quotaResponse.status, 429);
  assert.equal((await quotaResponse.json()).error.code, 'DOCUMENT_QUOTA_EXCEEDED');

  const oversizedForm = new FormData();
  oversizedForm.append('file', new Blob(['conteudo acima do limite']), 'grande.txt');
  const oversizedResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers,
    body: oversizedForm,
  });
  assert.equal(oversizedResponse.status, 413);

  const rateLimitedResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers,
    body: new FormData(),
  });
  assert.equal(rateLimitedResponse.status, 429);
});
