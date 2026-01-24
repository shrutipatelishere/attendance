import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Lead, LEAD_STATUSES, LEAD_TYPES, SERVICES } from '../types/Lead';
import './LeadCard.css';

interface LeadCardProps {
  lead: Lead;
}

const LeadCard: React.FC<LeadCardProps> = ({ lead }) => {
  const navigate = useNavigate();

  const currentStatus = LEAD_STATUSES.find(s => s.value === lead.status);
  const currentLeadType = LEAD_TYPES.find(t => t.value === lead.leadType);
  const currentService = SERVICES.find(s => s.value === lead.service);

  const pendingReminders = lead.reminders.filter(r => !r.completed);

  const isReminderOverdue = (date: Date) => {
    return new Date(date) < new Date();
  };

  const handleClick = () => {
    navigate(`/lead/${lead.id}`);
  };

  return (
    <div className="lead-card" onClick={handleClick}>
      <div className="lead-card-header">
        <div className="lead-info">
          <div className="lead-name-row">
            <h3>{lead.name}</h3>
            <span className="lead-service-tag">{currentService?.label}</span>
          </div>
          <p className="lead-subtitle">
            <span>{lead.city}</span>
            <span className="divider">•</span>
            <span>{lead.number}</span>
          </p>
        </div>
        <div className="lead-meta">
          <div className="lead-badges">
            <span className="badge" style={{ backgroundColor: currentLeadType?.color }}>
              {currentLeadType?.label}
            </span>
            <span className="badge" style={{ backgroundColor: currentStatus?.color }}>
              {currentStatus?.label}
            </span>
          </div>
          {pendingReminders.length > 0 && (
            <span className={`reminder-badge ${isReminderOverdue(pendingReminders[0].dateTime) ? 'overdue' : ''}`}>
              🔔 {pendingReminders.length}
            </span>
          )}
        </div>
        <span className="arrow-icon">→</span>
      </div>
    </div>
  );
};

export default LeadCard;
