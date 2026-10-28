const fs = require('node:fs/promises');
const crypto = require('node:crypto');
const documentsRepository = require('../repositories/documents.repository');

async function createDocument(file, owner) {
  if (file.size === 0) {
    await fs.unlink(file.path).catch(() => {});
    const error = new Error('O arquivo enviado está vazio.');
    error.statusCode = 400;
    error.code = 'EMPTY_FILE';
    throw error;
  }

  const document = {
    id: crypto.randomUUID(),
    originalName: file.originalname,
    size: file.size,
    uploadedAt: new Date().toISOString(),
    owner,
    storagePath: file.path,
  };

  return documentsRepository.add(document);
}

function listDocuments(owner) {
  return documentsRepository.listByOwner(owner);
}

async function findDocumentForDownload(id, owner) {
  const document = documentsRepository.findByIdAndOwner(id, owner);

  if (!document) {
    return null;
  }

  try {
    await fs.access(document.storagePath);
    return document;
  } catch {
    return null;
  }
}

module.exports = { createDocument, listDocuments, findDocumentForDownload };