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

function findByIdAndOwner(id, owner) {
  const document = documents.get(id);
  return document?.owner === owner ? document : null;
}

module.exports = { add, listByOwner, findByIdAndOwner };