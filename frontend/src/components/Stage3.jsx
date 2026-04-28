import ReactMarkdown from 'react-markdown';
import './Stage3.css';

export default function Stage3({ finalResponse }) {
  if (!finalResponse) return null;

  const modelSlug = finalResponse.model.split('/')[1] || finalResponse.model;

  return (
    <div className="stage3">
      <div className="stage3-header">
        <span className="stage3-label">Council Synthesis</span>
        <span className="stage3-model">{modelSlug}</span>
      </div>
      <div className="final-text markdown-content">
        <ReactMarkdown>{finalResponse.response}</ReactMarkdown>
      </div>
    </div>
  );
}
