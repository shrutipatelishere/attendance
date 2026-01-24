import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Lead, LeadStatus, LeadType, LEAD_STATUSES, LEAD_TYPES, LEAD_SOURCES, SERVICES, CallReminder, Comment, LeadAssignment } from '../types/Lead';
import { loadLeadsAsync, updateLead as updateLeadAPI, loadUsersAsync } from '../utils/storage';
import { useUser, getAssignableUsers } from '../context/UserContext';
import { User, USER_ROLES } from '../types/User';
import './LeadDetailPage.css';

const LeadDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useUser();
  const [lead, setLead] = useState<Lead | null>(null);
  const [allLeads, setAllLeads] = useState<Lead[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [showReminderForm, setShowReminderForm] = useState(false);
  const [showCompletedReminders, setShowCompletedReminders] = useState(false);
  const [reminderData, setReminderData] = useState({ dateTime: '', note: '' });
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignToUser, setAssignToUser] = useState('');
  const [assignReason, setAssignReason] = useState('');

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [leads, users] = await Promise.all([loadLeadsAsync(), loadUsersAsync()]);
        setAllLeads(leads);
        setAllUsers(users);
        const foundLead = leads.find(l => l.id === id);
        if (foundLead) {
          // Ensure new fields exist
          setLead({
            ...foundLead,
            assignmentHistory: foundLead.assignmentHistory || [],
            teamThread: foundLead.teamThread || [],
          });
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [id]);

  const updateLead = async (updatedLead: Lead) => {
    const updatedLeads = allLeads.map(l => l.id === updatedLead.id ? updatedLead : l);
    setAllLeads(updatedLeads);
    setLead(updatedLead);
    await updateLeadAPI(updatedLead);
  };

  const handleStatusChange = (status: LeadStatus) => {
    if (lead) {
      updateLead({ ...lead, status });
    }
  };

  const handleLeadTypeChange = (leadType: LeadType) => {
    if (lead) {
      updateLead({ ...lead, leadType });
    }
  };

  const handleAddComment = () => {
    if (lead && newComment.trim()) {
      const newCommentObj: Comment = {
        id: Date.now().toString(),
        text: newComment.trim(),
        createdAt: new Date(),
        userId: currentUser?.id,
        userName: currentUser?.name,
      };
      updateLead({ ...lead, comments: [...lead.comments, newCommentObj] });
      setNewComment('');
    }
  };

  const handleAddReminder = () => {
    if (lead && reminderData.dateTime) {
      const newReminder: CallReminder = {
        id: Date.now().toString(),
        dateTime: new Date(reminderData.dateTime),
        note: reminderData.note,
        completed: false,
      };
      updateLead({ ...lead, reminders: [...lead.reminders, newReminder] });
      setReminderData({ dateTime: '', note: '' });
      setShowReminderForm(false);
    }
  };

  const handleToggleReminder = (reminderId: string) => {
    if (lead) {
      const updatedReminders = lead.reminders.map(r =>
        r.id === reminderId ? { ...r, completed: !r.completed } : r
      );
      updateLead({ ...lead, reminders: updatedReminders });
    }
  };

  const handleAssignLead = () => {
    if (lead && assignToUser && currentUser) {
      const targetUser = allUsers.find(u => u.id === assignToUser);
      if (!targetUser) return;

      const assignment: LeadAssignment = {
        id: Date.now().toString(),
        fromUserId: currentUser.id,
        fromUserName: currentUser.name,
        toUserId: targetUser.id,
        toUserName: targetUser.name,
        reason: assignReason,
        assignedAt: new Date(),
      };

      const assignComment: Comment = {
        id: (Date.now() + 1).toString(),
        text: `Lead assigned to ${targetUser.name} (${getRoleLabel(targetUser.role)})${assignReason ? `. Reason: ${assignReason}` : ''}`,
        createdAt: new Date(),
        userId: currentUser.id,
        userName: currentUser.name,
      };

      // Add both users to team thread if not already there
      const updatedTeamThread = [...(lead.teamThread || [])];
      if (!updatedTeamThread.includes(currentUser.id)) {
        updatedTeamThread.push(currentUser.id);
      }
      if (!updatedTeamThread.includes(targetUser.id)) {
        updatedTeamThread.push(targetUser.id);
      }

      updateLead({
        ...lead,
        assignedTo: targetUser.id,
        assignedToName: targetUser.name,
        assignmentHistory: [...(lead.assignmentHistory || []), assignment],
        teamThread: updatedTeamThread,
        comments: [...lead.comments, assignComment],
      });

      setShowAssignModal(false);
      setAssignToUser('');
      setAssignReason('');
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatReminderDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isReminderOverdue = (date: Date) => {
    return new Date(date) < new Date();
  };

  const getRoleLabel = (role: string) => {
    const roleInfo = USER_ROLES.find(r => r.value === role);
    return roleInfo?.label || role;
  };

  const getRoleColor = (role: string) => {
    const roleInfo = USER_ROLES.find(r => r.value === role);
    return roleInfo?.color || '#666';
  };

  if (isLoading) {
    return (
      <div className="lead-detail-page">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading lead details...</p>
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="lead-detail-page">
        <div className="not-found">
          <h2>Lead not found</h2>
          <button onClick={() => navigate('/leads')}>Back to Leads</button>
        </div>
      </div>
    );
  }

  const currentStatus = LEAD_STATUSES.find(s => s.value === lead.status);
  const currentLeadType = LEAD_TYPES.find(t => t.value === lead.leadType);
  const currentSource = LEAD_SOURCES.find(s => s.value === lead.source);
  const currentService = SERVICES.find(s => s.value === lead.service);

  const pendingReminders = lead.reminders
    .filter(r => !r.completed)
    .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());

  const completedReminders = lead.reminders
    .filter(r => r.completed)
    .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());

  // Get users this current user can assign to
  const assignableUsers = currentUser ? getAssignableUsers(currentUser, allUsers) : [];

  // Get team thread users
  const teamThreadUsers = (lead.teamThread || [])
    .map(userId => allUsers.find(u => u.id === userId))
    .filter(Boolean) as User[];

  return (
    <div className="lead-detail-page">
      {/* Header */}
      <div className="detail-header">
        <button className="back-btn" onClick={() => navigate('/leads')}>
          ← Back to Leads
        </button>
        <div className="header-info">
          <div className="header-top">
            <h1>{lead.name}</h1>
            <span className="service-tag">{currentService?.label}</span>
          </div>
          <p className="header-subtitle">{lead.city} • {lead.number}</p>
        </div>
        <div className="header-badges">
          <span className="badge" style={{ backgroundColor: currentLeadType?.color }}>
            {currentLeadType?.label}
          </span>
          <span className="badge" style={{ backgroundColor: currentStatus?.color }}>
            {currentStatus?.label}
          </span>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="detail-content">
        {/* LEFT COLUMN */}
        <div className="left-column">
          {/* Lead Information */}
          <div className="card">
            <h3 className="card-title">Lead Information</h3>
            <div className="info-grid">
              <div className="info-row">
                <label>Name</label>
                <span>{lead.name}</span>
              </div>
              <div className="info-row">
                <label>Phone</label>
                <span>{lead.number}</span>
              </div>
              <div className="info-row">
                <label>Email</label>
                <span>{lead.email || '—'}</span>
              </div>
              <div className="info-row">
                <label>City</label>
                <span>{lead.city}</span>
              </div>
              <div className="info-row">
                <label>Source</label>
                <span>{currentSource?.label}</span>
              </div>
              <div className="info-row">
                <label>Service</label>
                <span>{currentService?.label}</span>
              </div>
              <div className="info-row">
                <label>Created</label>
                <span>{formatDate(lead.createdAt)}</span>
              </div>
              <div className="info-row">
                <label>Created By</label>
                <span>{lead.createdByName || '—'}</span>
              </div>
              <div className="info-row">
                <label>Assigned To</label>
                <span>{lead.assignedToName || '—'}</span>
              </div>
            </div>

            {lead.notes && (
              <div className="notes-box">
                <label>Notes</label>
                <p>{lead.notes}</p>
              </div>
            )}
          </div>

          {/* Update Status */}
          <div className="card">
            <h3 className="card-title">Update Status</h3>
            <div className="status-grid">
              <div className="status-item">
                <label>Lead Type</label>
                <select
                  value={lead.leadType}
                  onChange={(e) => handleLeadTypeChange(e.target.value as LeadType)}
                >
                  {LEAD_TYPES.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
              <div className="status-item">
                <label>Status</label>
                <select
                  value={lead.status}
                  onChange={(e) => handleStatusChange(e.target.value as LeadStatus)}
                >
                  {LEAD_STATUSES.map(status => (
                    <option key={status.value} value={status.value}>{status.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Assign Lead */}
          {currentUser && assignableUsers.length > 0 && (
            <div className="card assign-card">
              <h3 className="card-title">Assign Lead</h3>
              <div className="assign-action">
                <p className="assign-desc">
                  {currentUser.role === 'caller' && 'Assign this lead to your Manager for assistance.'}
                  {currentUser.role === 'manager' && 'Assign this lead to TL or reassign to a Caller.'}
                  {currentUser.role === 'team_leader' && 'Reassign this lead to a Manager or Caller.'}
                </p>
                <button
                  className="btn-assign"
                  onClick={() => setShowAssignModal(true)}
                >
                  Assign Lead
                </button>
              </div>
            </div>
          )}

          {/* Team Thread */}
          {teamThreadUsers.length > 0 && (
            <div className="card">
              <h3 className="card-title">Team Thread</h3>
              <p className="team-desc">Users involved with this lead:</p>
              <div className="team-list">
                {teamThreadUsers.map(user => (
                  <div key={user.id} className="team-member">
                    <div className="member-avatar" style={{ backgroundColor: getRoleColor(user.role) }}>
                      {user.name.charAt(0)}
                    </div>
                    <div className="member-info">
                      <span className="member-name">{user.name}</span>
                      <span className="member-role">{getRoleLabel(user.role)}</span>
                    </div>
                    {lead.assignedTo === user.id && (
                      <span className="current-owner">Current</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}


          {/* Assignment History */}
          {lead.assignmentHistory && lead.assignmentHistory.length > 0 && (
            <div className="card">
              <h3 className="card-title">Assignment History</h3>
              <div className="assignment-history">
                {lead.assignmentHistory.slice().reverse().map(assignment => (
                  <div key={assignment.id} className="history-item">
                    <div className="history-flow">
                      <span className="history-from">{assignment.fromUserName}</span>
                      <span className="history-arrow">→</span>
                      <span className="history-to">{assignment.toUserName}</span>
                    </div>
                    {assignment.reason && (
                      <p className="history-reason">{assignment.reason}</p>
                    )}
                    <span className="history-date">{formatDate(assignment.assignedAt)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN */}
        <div className="right-column">
          {/* Follow-ups */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">
                Follow-ups
                {pendingReminders.length > 0 && <span className="count">{pendingReminders.length}</span>}
              </h3>
              <button className="btn-add" onClick={() => setShowReminderForm(!showReminderForm)}>
                {showReminderForm ? 'Cancel' : '+ Add Follow-up'}
              </button>
            </div>

            {showReminderForm && (
              <div className="add-form">
                <input
                  type="datetime-local"
                  value={reminderData.dateTime}
                  onChange={(e) => setReminderData(prev => ({ ...prev, dateTime: e.target.value }))}
                />
                <input
                  type="text"
                  placeholder="Note (optional)"
                  value={reminderData.note}
                  onChange={(e) => setReminderData(prev => ({ ...prev, note: e.target.value }))}
                />
                <button className="btn-submit" onClick={handleAddReminder} disabled={!reminderData.dateTime}>
                  Add
                </button>
              </div>
            )}

            <div className="followup-list">
              {pendingReminders.length === 0 ? (
                <p className="empty-text">No scheduled follow-ups</p>
              ) : (
                pendingReminders.map(reminder => (
                  <div key={reminder.id} className={`followup-item ${isReminderOverdue(reminder.dateTime) ? 'overdue' : ''}`}>
                    <input
                      type="checkbox"
                      onChange={() => handleToggleReminder(reminder.id)}
                    />
                    <div className="followup-info">
                      <span className="followup-date">{formatReminderDate(reminder.dateTime)}</span>
                      {reminder.note && <span className="followup-note">{reminder.note}</span>}
                    </div>
                    {isReminderOverdue(reminder.dateTime) && <span className="overdue-tag">Overdue</span>}
                  </div>
                ))
              )}
            </div>

            {completedReminders.length > 0 && (
              <div className="completed-section">
                <button className="btn-link" onClick={() => setShowCompletedReminders(!showCompletedReminders)}>
                  {showCompletedReminders ? '▼' : '▶'} Completed ({completedReminders.length})
                </button>
                {showCompletedReminders && (
                  <div className="followup-list">
                    {completedReminders.map(reminder => (
                      <div key={reminder.id} className="followup-item done">
                        <input
                          type="checkbox"
                          checked
                          onChange={() => handleToggleReminder(reminder.id)}
                        />
                        <div className="followup-info">
                          <span className="followup-date">{formatReminderDate(reminder.dateTime)}</span>
                          {reminder.note && <span className="followup-note">{reminder.note}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Activity Log */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">
                Activity Log
                {lead.comments.length > 0 && <span className="count">{lead.comments.length}</span>}
              </h3>
            </div>

            <div className="activity-list">
              {lead.comments.length === 0 ? (
                <p className="empty-text">No activity yet</p>
              ) : (
                lead.comments.slice().reverse().map(comment => (
                  <div key={comment.id} className="activity-item">
                    <div className="activity-dot"></div>
                    <div className="activity-content">
                      {comment.userName && (
                        <span className="activity-user">{comment.userName}</span>
                      )}
                      <p>{comment.text}</p>
                      <span className="activity-time">{formatDate(comment.createdAt)} at {formatTime(comment.createdAt)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="add-comment">
              <input
                type="text"
                placeholder="Add a note..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
              />
              <button onClick={handleAddComment} disabled={!newComment.trim()}>
                Add Note
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Assign Lead Modal */}
      {showAssignModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Assign Lead</h2>
              <button className="modal-close" onClick={() => setShowAssignModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p>Assign <strong>{lead.name}</strong> to a team member.</p>
              <div className="form-group">
                <label>Assign To *</label>
                <select
                  value={assignToUser}
                  onChange={(e) => setAssignToUser(e.target.value)}
                >
                  <option value="">-- Select User --</option>
                  {assignableUsers.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({getRoleLabel(user.role)})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Reason (optional)</label>
                <textarea
                  value={assignReason}
                  onChange={(e) => setAssignReason(e.target.value)}
                  placeholder="Why are you assigning this lead?"
                  rows={3}
                />
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowAssignModal(false)}>
                Cancel
              </button>
              <button
                className="btn-confirm"
                onClick={handleAssignLead}
                disabled={!assignToUser}
              >
                Assign Lead
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default LeadDetailPage;
