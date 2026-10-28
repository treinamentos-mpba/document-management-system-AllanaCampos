const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const express = require('express');
const multer = require('multer');
const documentsController = require('../controllers/documents.controller');

const router = express.Router();
const uploadDirectory = path.resolve(
  process.env.UPLOAD_DIR || path.join(__dirname, '../../storage'),
);
const configuredMaxFileSize = Number(process.env.MAX_UPLOAD_SIZE_BYTES);
const maxFileSize = Number.isFinite(configuredMaxFileSize) && configuredMaxFileSize > 0
  ? configuredMaxFileSize
  : 10 * 1024 * 1024;

fs.mkdirSync(uploadDirectory, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDirectory,
    filename: (req, file, callback) => callback(null, crypto.randomUUID()),
  }),
  limits: { fileSize: maxFileSize },
});

router.post(
  '/upload',
  documentsController.requireUser,
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