import { useEffect, useState } from 'react';
import DocumentList from './components/DocumentList.jsx';
import UploadComponent from './components/UploadComponent.jsx';
import {
  downloadDocument,
  listDocuments,
  uploadDocument,
} from './services/documentsApi.js';
import './App.css';

const USER_STORAGE_KEY = 'dms-user-id';

export default function App() {
  const [userId, setUserId] = useState(() => localStorage.getItem(USER_STORAGE_KEY) || '');
  const [documents, setDocuments] = useState([]);
  const [loadedForUser, setLoadedForUser] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [downloadingId, setDownloadingId] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const normalizedUserId = userId.trim();
  const visibleDocuments = loadedForUser === normalizedUserId ? documents : [];

  useEffect(() => {
    let active = true;

    setError('');
    setNotice('');

    if (!normalizedUserId) {
      setDocuments([]);
      setLoadedForUser('');
      setIsLoading(false);
      return () => {
        active = false;
      };
    }

    setIsLoading(true);
    listDocuments(normalizedUserId)
      .then((result) => {
        if (active) {
          setDocuments(result);
          setLoadedForUser(normalizedUserId);
        }
      })
      .catch((requestError) => {
        if (active) {
          setDocuments([]);
          setLoadedForUser(normalizedUserId);
          setError(requestError.message);
        }
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [normalizedUserId, refreshKey]);

  function handleUserChange(event) {
    const nextUserId = event.target.value;
    setUserId(nextUserId);
    localStorage.setItem(USER_STORAGE_KEY, nextUserId);
  }

  async function handleUpload(file) {
    setError('');
    setNotice('');
    setIsUploading(true);

    try {
      const document = await uploadDocument(file, normalizedUserId);
      setDocuments((currentDocuments) => [document, ...currentDocuments]);
      setLoadedForUser(normalizedUserId);
      setNotice('Documento enviado.');
      return true;
    } catch (requestError) {
      setError(requestError.message);
      return false;
    } finally {
      setIsUploading(false);
    }
  }

  async function handleDownload(document) {
    setError('');
    setDownloadingId(document.id);

    try {
      const file = await downloadDocument(document.id, normalizedUserId);
      const objectUrl = URL.createObjectURL(file);
      const link = window.document.createElement('a');
      link.href = objectUrl;
      link.download = document.originalName;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setDownloadingId('');
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#inicio" aria-label="DMS, início">
          <span className="brand-mark" aria-hidden="true">D</span>
          <span className="brand-name">arquivo<span>/</span>dms</span>
        </a>
        <label className="user-field">
          <span>Usuário</span>
          <input
            autoComplete="username"
            maxLength={128}
            onChange={handleUserChange}
            placeholder="Identificador"
            value={userId}
          />
        </label>
      </header>

      <main id="inicio" className="content">
        <section className="page-heading" aria-labelledby="page-title">
          <div>
            <p className="eyebrow">BIBLIOTECA PESSOAL</p>
            <h1 id="page-title">Documentos</h1>
          </div>
          <div className="document-count" aria-live="polite">
            <span className="count-number">{visibleDocuments.length.toString().padStart(2, '0')}</span>
            <span>arquivos</span>
          </div>
        </section>

        {error && (
          <div className="feedback feedback-error" role="alert">
            <span>{error}</span>
            <button type="button" className="feedback-dismiss" onClick={() => setError('')} aria-label="Fechar aviso">
              ×
            </button>
          </div>
        )}
        {notice && <p className="feedback feedback-success" role="status">{notice}</p>}

        <UploadComponent
          disabled={!normalizedUserId}
          isUploading={isUploading}
          onUpload={handleUpload}
        />

        <DocumentList
          documents={visibleDocuments}
          downloadingId={downloadingId}
          isLoading={isLoading}
          onDownload={handleDownload}
          onRefresh={() => setRefreshKey((currentKey) => currentKey + 1)}
          userId={normalizedUserId}
        />
      </main>

      <footer className="footer">
        <span>ARQUIVO LOCAL</span>
        <span className="footer-indicator"><i /> SISTEMA DISPONÍVEL</span>
      </footer>
    </div>
  );
}