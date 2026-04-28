import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import './Stage2.css';

function buildModelToRole(labelToModel, labelToRole) {
  if (!labelToModel || !labelToRole) return {};
  const map = {};
  Object.entries(labelToModel).forEach(([label, model]) => {
    if (labelToRole[label]) map[model] = labelToRole[label];
  });
  return map;
}

function deAnonymizeText(text, labelToRole) {
  if (!labelToRole) return text;
  let result = text;
  Object.entries(labelToRole).forEach(([label, role]) => {
    result = result.replace(new RegExp(label, 'g'), `**${role}**`);
  });
  return result;
}

export default function Stage2({ rankings, labelToModel, labelToRole, aggregateRankings }) {
  const [activeTab, setActiveTab] = useState(0);

  if (!rankings || rankings.length === 0) return null;

  const modelToRole = buildModelToRole(labelToModel, labelToRole);

  return (
    <div className="stage2">
      <div className="stage2-label">Peer Rankings</div>

      {aggregateRankings && aggregateRankings.length > 0 && (
        <div className="leaderboard">
          {aggregateRankings.map((agg, index) => {
            const role = modelToRole[agg.model] || agg.model.split('/')[1] || agg.model;
            return (
              <div key={index} className={`leaderboard-item ${index === 0 ? 'first' : ''}`}>
                <span className="lb-rank">#{index + 1}</span>
                <span className="lb-role">{role}</span>
                <span className="lb-score">{agg.average_rank.toFixed(2)} avg</span>
              </div>
            );
          })}
        </div>
      )}

      <div className="stage2-tabs">
        {rankings.map((rank, index) => {
          const role = modelToRole[rank.model] || rank.model.split('/')[1] || rank.model;
          return (
            <button
              key={index}
              className={`stage2-tab ${activeTab === index ? 'active' : ''}`}
              onClick={() => setActiveTab(index)}
            >
              {role}
            </button>
          );
        })}
      </div>

      <div className="stage2-content">
        <div className="stage2-model-badge">
          {rankings[activeTab].model}
        </div>
        <div className="ranking-content markdown-content">
          <ReactMarkdown>
            {deAnonymizeText(rankings[activeTab].ranking, labelToRole)}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
