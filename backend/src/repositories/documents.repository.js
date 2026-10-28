const fs = require('node:fs/promises');

const documents = new Map();

function toPublicDocument(document) {
  const { storagePath, ...metadata } = document;
  return metadata;
}

function add(document) {
  documents.set(document.id, document);
  return toPublicDocument(document);
}

function listByOwner(owner) {
  return Array.from(documents.values())
    .filter((document) => document.owner === owner)
    .sort((first, second) => second.uploadedAt.localeCompare(first.uploadedAt))
    .map(toPublicDocument);
}

function countByOwner(owner) {
  let count = 0;
  for (const document of documents.values()) {
    if (document.owner === owner) {
      count += 1;
    }
  }
  return count;
}

function findByIdAndOwner(id, owner) {
  const document = documents.get(id);
  return document?.owner === owner ? document : null;
}

async function deleteStoredFile(filePath) {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
}

function assertStoredFileExists(filePath) {
  return fs.access(filePath);
}

module.exports = {
  add,
  listByOwner,
  countByOwner,
  findByIdAndOwner,
  deleteStoredFile,
  assertStoredFileExists,
};