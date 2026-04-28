import { useState, useEffect, useRef } from 'react';
import Stage1 from './Stage1';
import Stage2 from './Stage2';
import Stage3 from './Stage3';
import './ChatInterface.css';

const ADVISOR_ROLES = [
  'Contrarian',
  'First Principles Operator',
  'Customer Realist',
  'Expansionist',
  'Executor',
];

function AdvisorsLoading() {
  return (
    <div className="advisors-loading">
      {ADVISOR_ROLES.map((role) => (
        <div key={role} className="advisor-skeleton">
          <div className="advisor-skeleton-dot" />
          <span className="advisor-skeleton-role">{role}</span>
        </div>
      ))}
    </div>
  );
}

function StageLoading({ text }) {
  return (
    <div className="stage-loading">
      <div className="stage-loading-dot" />
      <span>{text}</span>
    </div>
  );
}

function AssistantMessage({ msg }) {
  const isDone =
    msg.stage3 &&
    !msg.loading?.stage1 &&
    !msg.loading?.stage2 &&
    !msg.loading?.stage3;

  const stage2Block = msg.stage2 ? (
    <details className="stage2-details">
      <summary className="stage2-summary">Peer Rankings</summary>
      <div className="stage2-details-body">
        <Stage2
          rankings={msg.stage2}
          labelToModel={msg.metadata?.label_to_model}
          labelToRole={msg.metadata?.label_to_role}
          aggregateRankings={msg.metadata?.aggregate_rankings}
        />
      </div>
    </details>
  ) : null;

  if (isDone) {
    return (
      <>
        <Stage3 finalResponse={msg.stage3} />
        <Stage1 responses={msg.stage1} />
        {stage2Block}
      </>
    );
  }

  return (
    <>
      {msg.loading?.stage1 && <AdvisorsLoading />}
      {msg.stage1 && <Stage1 responses={msg.stage1} />}
      {msg.loading?.stage2 && <StageLoading text="Peer review in progress" />}
      {stage2Block}
      {msg.loading?.stage3 && <StageLoading text="Synthesizing final answer" />}
      {msg.stage3 && <Stage3 finalResponse={msg.stage3} />}
    </>
  );
}

export default function ChatInterface({ conversation, onSendMessage, isLoading }) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input);
      setInput('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const inputDisabled = isLoading || !conversation;

  return (
    <div className="chat-interface">
      <div className="messages-container">
        {!conversation ? (
          <div className="empty-state">
            <div className="empty-state-title">Council</div>
            <div className="empty-state-sub">Select a session or start a new one</div>
          </div>
        ) : conversation.messages.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-title">Ready</div>
            <div className="empty-state-sub">Ask your question to convene the council</div>
          </div>
        ) : (
          conversation.messages.map((msg, index) => (
            <div key={index} className="message-group">
              {msg.role === 'user' ? (
                <div className="user-message">
                  <div className="user-label">You</div>
                  <div className="user-content">{msg.content}</div>
                </div>
              ) : (
                <div className="assistant-message">
                  <AssistantMessage msg={msg} />
                </div>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="input-area">
        <form className="input-form" onSubmit={handleSubmit}>
          <textarea
            className="message-input"
            placeholder="Ask the council… (Enter to send, Shift+Enter for new line)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={inputDisabled}
            rows={2}
          />
          <button
            type="submit"
            className="send-button"
            disabled={!input.trim() || inputDisabled}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
