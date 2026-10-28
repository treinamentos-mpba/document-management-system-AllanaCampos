const documentsService = require('../services/documents.service');

function requireUser(req, res, next) {
  const owner = req.get('X-User-Id')?.trim();

  if (!owner) {
    return res.status(401).json({
      error: { code: 'USER_REQUIRED', message: 'Informe o usuário no cabeçalho X-User-Id.' },
    });
  }

  if (owner.length > 128) {
    return res.status(400).json({
      error: { code: 'INVALID_USER', message: 'O identificador do usuário é inválido.' },
    });
  }

  req.owner = owner;
  return next();
}

async function upload(req, res) {
  if (!req.file) {
    return res.status(400).json({
      error: { code: 'FILE_REQUIRED', message: 'Envie um arquivo no campo file.' },
    });
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
    return res.status(404).json({
      error: { code: 'DOCUMENT_NOT_FOUND', message: 'Documento não encontrado.' },
    });
  }

  return res.download(document.storagePath, document.originalName, (error) => {
    if (error && !res.headersSent) {
      next(error);
    }
  });
}

module.exports = { requireUser, upload, list, download };