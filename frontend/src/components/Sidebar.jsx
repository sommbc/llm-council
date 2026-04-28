import { api } from '../api';
import './Sidebar.css';

export default function Sidebar({
  conversations,
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
}) {
  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Delete this conversation?')) return;
    try {
      await api.deleteConversation(id);
      onDeleteConversation(id);
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <span className="sidebar-wordmark">Council</span>
        <button className="new-conversation-btn" onClick={onNewConversation}>
          New Session
        </button>
      </div>

      <div className="conversation-list">
        {conversations.length === 0 ? (
          <div className="no-conversations">No sessions yet</div>
        ) : (
          conversations.map((conv) => (
            <div
              key={conv.id}
              className={`conversation-item ${conv.id === currentConversationId ? 'active' : ''}`}
              onClick={() => onSelectConversation(conv.id)}
            >
              <div className="conversation-title">
                {conv.title || 'New Session'}
              </div>
              <div className="conversation-meta">
                {conv.message_count} messages
              </div>
              <button
                className="conversation-delete-btn"
                onClick={(e) => handleDelete(e, conv.id)}
                title="Delete session"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 3h10M4 3V2h4v1M2 3l.8 7.2A1 1 0 003.8 11h4.4a1 1 0 001-.8L10 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
