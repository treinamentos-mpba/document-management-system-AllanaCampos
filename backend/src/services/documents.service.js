const crypto = require('node:crypto');
const documentsRepository = require('../repositories/documents.repository');
const ApplicationError = require('../errors/application-error');

const configuredOwnerQuota = Number(process.env.MAX_DOCUMENTS_PER_USER);
const maxDocumentsPerUser = Number.isInteger(configuredOwnerQuota) && configuredOwnerQuota > 0
  ? configuredOwnerQuota
  : 1000;

function getUploadValidationError(file, owner) {
  if (file.size === 0) {
    return new ApplicationError('EMPTY_FILE', 'O arquivo enviado está vazio.');
  }

  if (documentsRepository.countByOwner(owner) >= maxDocumentsPerUser) {
    return new ApplicationError(
      'DOCUMENT_QUOTA_EXCEEDED',
      'Limite de documentos deste usuário atingido.',
    );
  }

  return null;
}

function createDocumentMetadata(file, owner) {
  return {
    id: crypto.randomUUID(),
    originalName: file.originalname,
    size: file.size,
    uploadedAt: new Date().toISOString(),
    owner,
    storagePath: file.path,
  };
}

async function cleanupAndThrow(filePath, error) {
  try {
    await documentsRepository.deleteStoredFile(filePath);
  } catch (cleanupError) {
    error.cause = cleanupError;
  }

  throw error;
}

async function createDocument(file, owner) {
  const validationError = getUploadValidationError(file, owner);
  if (validationError) {
    return cleanupAndThrow(file.path, validationError);
  }

  const document = createDocumentMetadata(file, owner);

  try {
    return documentsRepository.add(document);
  } catch (error) {
    return cleanupAndThrow(file.path, error);
  }
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
    await documentsRepository.assertStoredFileExists(document.storagePath);
    return document;
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

module.exports = { createDocument, listDocuments, findDocumentForDownload };