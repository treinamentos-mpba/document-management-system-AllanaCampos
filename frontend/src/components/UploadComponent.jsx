import { useRef, useState } from 'react';

export default function UploadComponent({ disabled, isUploading, onUpload }) {
  const [file, setFile] = useState(null);
  const inputRef = useRef(null);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!file || disabled || isUploading) {
      return;
    }

    const uploaded = await onUpload(file);
    if (uploaded) {
      setFile(null);
      inputRef.current.value = '';
    }
  }

  return (
    <section className="upload-section" aria-labelledby="upload-title">
      <div className="section-marker" aria-hidden="true">01</div>
      <div className="upload-content">
        <div className="upload-heading">
          <div>
            <p className="eyebrow">NOVO ARQUIVO</p>
            <h2 id="upload-title">Adicionar documento</h2>
          </div>
          <span className="upload-symbol" aria-hidden="true">↑</span>
        </div>
        <form className="upload-form" onSubmit={handleSubmit}>
          <label className="file-picker">
            <input
              ref={inputRef}
              type="file"
              onChange={(event) => setFile(event.target.files?.[0] || null)}
              disabled={disabled || isUploading}
            />
            <span className="file-picker-label">{file ? file.name : 'Escolher arquivo'}</span>
            <span className="file-picker-action">PROCURAR</span>
          </label>
          <button className="button button-primary" type="submit" disabled={!file || disabled || isUploading}>
            {isUploading ? 'Enviando...' : 'Enviar arquivo'}
            <span aria-hidden="true">↗</span>
          </button>
        </form>
        {!disabled && file && (
          <p className="file-size">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
        )}
        {disabled && <p className="field-hint">Informe um identificador de usuário para enviar documentos.</p>}
      </div>
    </section>
  );
}