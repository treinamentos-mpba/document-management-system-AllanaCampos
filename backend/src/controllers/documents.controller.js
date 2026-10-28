const documentsService = require('../services/documents.service');
const ApplicationError = require('../errors/application-error');

function requireUser(req, res, next) {
  const owner = req.get('X-User-Id')?.trim();

  if (!owner) {
    throw new ApplicationError('USER_REQUIRED', 'Informe o usuário no cabeçalho X-User-Id.');
  }

  if (owner.length > 128) {
    throw new ApplicationError('INVALID_USER', 'O identificador do usuário é inválido.');
  }

  req.owner = owner;
  return next();
}

async function upload(req, res) {
  if (!req.file) {
    throw new ApplicationError('FILE_REQUIRED', 'Envie um arquivo no campo file.');
  }

  const document = await documentsService.createDocument(req.file, req.owner);
  return res.status(201).json(document);
}

async function list(req, res) {
  const documents = await documentsService.listDocuments(req.owner);
  return res.json(documents);
}

async function download(req, res, next) {
  const document = await documentsService.findDocumentForDownload(req.params.id, req.owner);

  if (!document) {
    throw new ApplicationError('DOCUMENT_NOT_FOUND', 'Documento não encontrado.');
  }

  return res.download(document.storagePath, document.originalName, (error) => {
    if (error && !res.headersSent) {
      next(error);
    }
  });
}

module.exports = { requireUser, upload, list, download };