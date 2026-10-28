import DownloadButton from './DownloadButton.jsx';

function formatFileSize(size) {
  if (size < 1024) {
    return `${size} B`;
  }
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export default function DocumentList({
  documents,
  downloadingId,
  isLoading,
  onDownload,
  onRefresh,
  userId,
}) {
  return (
    <section className="documents-section" aria-labelledby="documents-title">
      <div className="section-heading">
        <div className="section-title-group">
          <div className="section-marker" aria-hidden="true">02</div>
          <div>
            <p className="eyebrow">SEU ACERVO</p>
            <h2 id="documents-title">Todos os documentos</h2>
          </div>
        </div>
        <button
          className="button button-quiet"
          type="button"
          onClick={onRefresh}
          disabled={!userId || isLoading}
          title="Atualizar lista"
        >
          <span aria-hidden="true">↻</span>
          Atualizar
        </button>
      </div>

      {!userId ? (
        <div className="list-message">Informe um usuário para consultar os documentos.</div>
      ) : isLoading && documents.length === 0 ? (
        <div className="list-message" role="status">Carregando documentos...</div>
      ) : documents.length === 0 ? (
        <div className="empty-state">
          <span className="empty-glyph" aria-hidden="true">□</span>
          <p>Nenhum documento encontrado.</p>
        </div>
      ) : (
        <div className="document-table-wrap">
          <table className="document-table">
            <thead>
              <tr>
                <th scope="col">Nome</th>
                <th scope="col">Enviado em</th>
                <th scope="col">Tamanho</th>
                <th scope="col"><span className="visually-hidden">Ações</span></th>
              </tr>
            </thead>
            <tbody>
              {documents.map((document) => (
                <tr key={document.id}>
                  <td className="document-name" title={document.originalName}>
                    <span className="document-icon" aria-hidden="true">DOC</span>
                    <span>{document.originalName}</span>
                  </td>
                  <td className="document-date">{formatDate(document.uploadedAt)}</td>
                  <td className="document-size">{formatFileSize(document.size)}</td>
                  <td className="document-action">
                    <DownloadButton
                      isLoading={downloadingId === document.id}
                      onClick={() => onDownload(document)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}