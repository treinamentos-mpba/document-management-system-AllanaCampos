// Seed do servidor backend do Document Management System.
//
// Este arquivo é apenas um ponto de partida mínimo. Ao longo do workshop você
// vai usar o Agent Mode do GitHub Copilot para construir as camadas:
//   - routes/       (definição das rotas)
//   - controllers/  (entrada HTTP e validação)
//   - services/     (regras de negócio)
//   - repositories/ (persistência: arquivos locais + metadados em memória)
//
// Restrição do projeto: uploads são gravados no filesystem local da aplicação
// usando multer com diskStorage. Não utilize provedores externos.

const express = require('express');
const multer = require('multer');
const documentsRouter = require('./routes/documents.routes');
const ApplicationError = require('./errors/application-error');

const applicationErrorStatuses = {
  USER_REQUIRED: 401,
  INVALID_USER: 400,
  FILE_REQUIRED: 400,
  DOCUMENT_NOT_FOUND: 404,
  EMPTY_FILE: 400,
  DOCUMENT_QUOTA_EXCEEDED: 429,
  UPLOAD_RATE_LIMIT: 429,
};

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use(documentsRouter);

app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  const isMulterError = error instanceof multer.MulterError;
  const statusCode = isMulterError
    ? error.code === 'LIMIT_FILE_SIZE' ? 413 : 400
    : error instanceof ApplicationError ? applicationErrorStatuses[error.code] || 500 : 500;
  const code = isMulterError ? error.code : error.code || 'INTERNAL_ERROR';
  const message = statusCode === 500
    ? 'Ocorreu um erro interno.'
    : isMulterError && statusCode === 413
      ? 'O arquivo excede o tamanho máximo permitido.'
      : isMulterError
        ? 'Não foi possível processar o arquivo enviado.'
        : error instanceof ApplicationError ? error.message : 'Ocorreu um erro interno.';

  return res.status(statusCode).json({
    error: { code, message },
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`DMS backend ouvindo na porta ${PORT}`);
  });
}

module.exports = app;
