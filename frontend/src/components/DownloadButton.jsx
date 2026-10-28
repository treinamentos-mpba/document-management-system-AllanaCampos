export default function DownloadButton({ isLoading, onClick }) {
  return (
    <button
      className="button button-download"
      type="button"
      onClick={onClick}
      disabled={isLoading}
      aria-label={isLoading ? 'Baixando documento' : 'Baixar documento'}
      title="Baixar documento"
    >
      <span aria-hidden="true">↓</span>
      <span>{isLoading ? 'Baixando' : 'Baixar'}</span>
    </button>
  );
}