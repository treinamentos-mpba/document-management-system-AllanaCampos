const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');
const express = require('express');
const multer = require('multer');
const documentsController = require('../controllers/documents.controller');
const ApplicationError = require('../errors/application-error');

const router = express.Router();
const uploadDirectory = path.resolve(
  process.env.UPLOAD_DIR || path.join(__dirname, '../../storage'),
);
const configuredMaxFileSize = Number(process.env.MAX_UPLOAD_SIZE_BYTES);
const maxFileSize = Number.isFinite(configuredMaxFileSize) && configuredMaxFileSize > 0
  ? configuredMaxFileSize
  : 10 * 1024 * 1024;
const configuredUploadLimit = Number(process.env.MAX_UPLOADS_PER_MINUTE);
const maxUploadsPerMinute = Number.isInteger(configuredUploadLimit) && configuredUploadLimit > 0
  ? configuredUploadLimit
  : 20;
const uploadAttemptsByIp = new Map();
const rateLimitWindowMs = 60 * 1000;
let lastRateLimitCleanup = 0;

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, callback) => {
      fs.mkdir(uploadDirectory, { recursive: true })
        .then(() => callback(null, uploadDirectory))
        .catch(callback);
    },
    filename: (req, file, callback) => callback(null, crypto.randomUUID()),
  }),
  limits: { fileSize: maxFileSize },
});

function limitUploadRate(req, res, next) {
  const now = Date.now();
  const clientIp = req.ip || req.socket.remoteAddress || 'unknown';

  if (now - lastRateLimitCleanup >= rateLimitWindowMs) {
    for (const [ip, attempt] of uploadAttemptsByIp) {
      if (now - attempt.windowStartedAt >= rateLimitWindowMs) {
        uploadAttemptsByIp.delete(ip);
      }
    }
    lastRateLimitCleanup = now;
  }

  let attempt = uploadAttemptsByIp.get(clientIp);
  if (!attempt || now - attempt.windowStartedAt >= rateLimitWindowMs) {
    attempt = { windowStartedAt: now, count: 0 };
    uploadAttemptsByIp.set(clientIp, attempt);
  }

  if (attempt.count >= maxUploadsPerMinute) {
    return next(new ApplicationError('UPLOAD_RATE_LIMIT', 'Limite de uploads atingido. Tente novamente em um minuto.'));
  }

  attempt.count += 1;

  if (uploadAttemptsByIp.size > 10000) {
    const oldestIp = uploadAttemptsByIp.keys().next().value;
    uploadAttemptsByIp.delete(oldestIp);
  }

  return next();
}

router.post(
  '/upload',
  documentsController.requireUser,
  limitUploadRate,
  upload.single('file'),
  documentsController.upload,
);
router.get('/documents', documentsController.requireUser, documentsController.list);
router.get(
  '/documents/:id/download',
  documentsController.requireUser,
  documentsController.download,
);

module.exports = router;