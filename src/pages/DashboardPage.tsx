import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lead } from '../types/Lead';
import { loadLeadsAsync, loadUsersAsync } from '../utils/storage';
import { useUser, canViewLead } from '../context/UserContext';
import { User } from '../types/User';
import './DashboardPage.css';

// SVG Icons
const Icons = {
  users: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  flame: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
    </svg>
  ),
  checkCircle: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  ),
  clipboard: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
    </svg>
  ),
  plus: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  eye: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  userPlus: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="8.5" cy="7" r="4"/>
      <line x1="20" y1="8" x2="20" y2="14"/>
      <line x1="23" y1="11" x2="17" y2="11"/>
    </svg>
  ),
  warm: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/>
      <line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/>
      <line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  ),
  cold: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M19.07 4.93L4.93 19.07"/>
    </svg>
  ),
  phone: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>
  ),
  clock: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
};

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useUser();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [savedLeads, users] = await Promise.all([loadLeadsAsync(), loadUsersAsync()]);
        setAllUsers(users);
        setLeads(savedLeads);
      } catch (error) {
        console.error('Error loading leads:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // Filter leads based on current user's visibility
  const visibleLeads = currentUser
    ? leads.filter(lead => canViewLead(currentUser, lead, allUsers))
    : [];

  const stats = {
    total: visibleLeads.length,
    hot: visibleLeads.filter(l => l.leadType === 'hot').length,
    warm: visibleLeads.filter(l => l.leadType === 'warm').length,
    cold: visibleLeads.filter(l => l.leadType === 'cold').length,
    new: visibleLeads.filter(l => l.status === 'new').length,
    contacted: visibleLeads.filter(l => l.status === 'contacted').length,
    qualified: visibleLeads.filter(l => l.status === 'qualified').length,
    proposal: visibleLeads.filter(l => l.status === 'proposal').length,
    negotiation: visibleLeads.filter(l => l.status === 'negotiation').length,
    converted: visibleLeads.filter(l => l.status === 'converted').length,
    lost: visibleLeads.filter(l => l.status === 'lost').length,
  };

  const recentLeads = visibleLeads.slice(0, 5);

  const overdueReminders = visibleLeads.flatMap(lead =>
    lead.reminders
      .filter(r => !r.completed && new Date(r.dateTime) < new Date())
      .map(r => ({ ...r, leadName: lead.name, leadId: lead.id }))
  ).slice(0, 5);

  // Today's scheduled calls
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todaysScheduledCalls = visibleLeads.flatMap(lead =>
    lead.reminders
      .filter(r => {
        const reminderDate = new Date(r.dateTime);
        return !r.completed && reminderDate >= today && reminderDate < tomorrow;
      })
      .map(r => ({ ...r, leadName: lead.name, leadId: lead.id, leadNumber: lead.number }))
  ).sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());

  // Navigation handlers for clickable cards
  const handleStatClick = (filter: string, value: string) => {
    navigate(`/leads?${filter}=${value}`);
  };

  const handlePipelineClick = (status: string) => {
    navigate(`/leads?status=${status}`);
  };

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (isLoading) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-header">
          <h1>Dashboard</h1>
          <p className="subtitle">Loading your CRM overview...</p>
        </div>
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p className="subtitle">
          {getGreeting()}, {currentUser?.name || 'User'}! Here's your CRM overview.
        </p>
      </div>

      {/* Stats Overview - Clickable Cards */}
      <div className="stats-grid">
        <div className="stat-card primary clickable" onClick={() => navigate('/leads')}>
          <div className="stat-icon">{Icons.users}</div>
          <div className="stat-content">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">Total Leads</span>
          </div>
        </div>
        <div className="stat-card hot clickable" onClick={() => handleStatClick('type', 'hot')}>
          <div className="stat-icon">{Icons.flame}</div>
          <div className="stat-content">
            <span className="stat-value">{stats.hot}</span>
            <span className="stat-label">Hot Leads</span>
          </div>
        </div>
        <div className="stat-card success clickable" onClick={() => handleStatClick('status', 'converted')}>
          <div className="stat-icon">{Icons.checkCircle}</div>
          <div className="stat-content">
            <span className="stat-value">{stats.converted}</span>
            <span className="stat-label">Converted</span>
          </div>
        </div>
        <div className="stat-card warning clickable" onClick={() => handleStatClick('status', 'new')}>
          <div className="stat-icon">{Icons.clipboard}</div>
          <div className="stat-content">
            <span className="stat-value">{stats.new}</span>
            <span className="stat-label">New Leads</span>
          </div>
        </div>
      </div>

      {/* Lead Type Distribution */}
      <div className="section">
        <h2 className="section-title">Lead Types</h2>
        <div className="type-cards">
          <div className="type-card hot clickable" onClick={() => handleStatClick('type', 'hot')}>
            <div className="type-icon">{Icons.flame}</div>
            <div className="type-info">
              <span className="type-count">{stats.hot}</span>
              <span className="type-label">Hot</span>
            </div>
          </div>
          <div className="type-card warm clickable" onClick={() => handleStatClick('type', 'warm')}>
            <div className="type-icon">{Icons.warm}</div>
            <div className="type-info">
              <span className="type-count">{stats.warm}</span>
              <span className="type-label">Warm</span>
            </div>
          </div>
          <div className="type-card cold clickable" onClick={() => handleStatClick('type', 'cold')}>
            <div className="type-icon">{Icons.cold}</div>
            <div className="type-info">
              <span className="type-count">{stats.cold}</span>
              <span className="type-label">Cold</span>
            </div>
          </div>
        </div>
      </div>

      {/* Pipeline Stats - Clickable */}
      <div className="section">
        <h2 className="section-title">Pipeline Overview</h2>
        <div className="pipeline-grid">
          <div className="pipeline-item clickable" onClick={() => handlePipelineClick('new')}>
            <span className="pipeline-count">{stats.new}</span>
            <span className="pipeline-label">New</span>
            <div className="pipeline-bar" style={{ backgroundColor: '#3498db' }}></div>
          </div>
          <div className="pipeline-item clickable" onClick={() => handlePipelineClick('contacted')}>
            <span className="pipeline-count">{stats.contacted}</span>
            <span className="pipeline-label">Contacted</span>
            <div className="pipeline-bar" style={{ backgroundColor: '#9b59b6' }}></div>
          </div>
          <div className="pipeline-item clickable" onClick={() => handlePipelineClick('qualified')}>
            <span className="pipeline-count">{stats.qualified}</span>
            <span className="pipeline-label">Qualified</span>
            <div className="pipeline-bar" style={{ backgroundColor: '#e67e22' }}></div>
          </div>
          <div className="pipeline-item clickable" onClick={() => handlePipelineClick('proposal')}>
            <span className="pipeline-count">{stats.proposal}</span>
            <span className="pipeline-label">Proposal</span>
            <div className="pipeline-bar" style={{ backgroundColor: '#f39c12' }}></div>
          </div>
          <div className="pipeline-item clickable" onClick={() => handlePipelineClick('negotiation')}>
            <span className="pipeline-count">{stats.negotiation}</span>
            <span className="pipeline-label">Negotiation</span>
            <div className="pipeline-bar" style={{ backgroundColor: '#1abc9c' }}></div>
          </div>
          <div className="pipeline-item clickable" onClick={() => handlePipelineClick('converted')}>
            <span className="pipeline-count">{stats.converted}</span>
            <span className="pipeline-label">Converted</span>
            <div className="pipeline-bar" style={{ backgroundColor: '#27ae60' }}></div>
          </div>
          <div className="pipeline-item clickable" onClick={() => handlePipelineClick('lost')}>
            <span className="pipeline-count">{stats.lost}</span>
            <span className="pipeline-label">Lost</span>
            <div className="pipeline-bar" style={{ backgroundColor: '#e74c3c' }}></div>
          </div>
        </div>
      </div>

      {/* Today's Scheduled Calls */}
      <div className="section scheduled-calls-section">
        <div className="section-header">
          <h2 className="section-title">
            {Icons.phone}
            Today's Scheduled Calls
            {todaysScheduledCalls.length > 0 && (
              <span className="call-count-badge">{todaysScheduledCalls.length}</span>
            )}
          </h2>
        </div>
        {todaysScheduledCalls.length === 0 ? (
          <div className="empty-state">
            <p>No calls scheduled for today</p>
          </div>
        ) : (
          <div className="scheduled-calls-list">
            {todaysScheduledCalls.map(call => (
              <Link to={`/leads/${call.leadId}`} key={call.id} className="scheduled-call-item">
                <div className="call-time">
                  {Icons.clock}
                  <span>{new Date(call.dateTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="call-info">
                  <span className="call-lead-name">{call.leadName}</span>
                  <span className="call-note">{call.note || 'Follow-up call'}</span>
                </div>
                <div className="call-number">{call.leadNumber}</div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="dashboard-grid">
        {/* Recent Leads */}
        <div className="section">
          <div className="section-header">
            <h2 className="section-title">Recent Leads</h2>
            <Link to="/leads" className="view-all">View All</Link>
          </div>
          {recentLeads.length === 0 ? (
            <div className="empty-state">
              <p>No leads yet. <Link to="/add-lead">Add your first lead</Link></p>
            </div>
          ) : (
            <div className="recent-list">
              {recentLeads.map(lead => (
                <Link to={`/leads/${lead.id}`} key={lead.id} className="recent-item">
                  <div className="recent-info">
                    <span className="recent-name">{lead.name}</span>
                    <span className="recent-city">{lead.city}</span>
                  </div>
                  <span className={`recent-badge ${lead.leadType}`}>{lead.leadType}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Overdue Follow-ups */}
        <div className="section">
          <div className="section-header">
            <h2 className="section-title">Overdue Follow-ups</h2>
          </div>
          {overdueReminders.length === 0 ? (
            <div className="empty-state success">
              <p>No overdue follow-ups. Great job!</p>
            </div>
          ) : (
            <div className="reminder-list">
              {overdueReminders.map(reminder => (
                <Link to={`/leads/${reminder.leadId}`} key={reminder.id} className="reminder-item">
                  <div className="reminder-info">
                    <span className="reminder-lead">{reminder.leadName}</span>
                    <span className="reminder-note">{reminder.note || 'Follow-up call'}</span>
                  </div>
                  <span className="reminder-date">
                    {new Date(reminder.dateTime).toLocaleDateString()}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default DashboardPage;
