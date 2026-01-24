import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lead, LeadStatus, LeadType, LEAD_STATUSES, LEAD_TYPES } from '../types/Lead';
import LeadForm from '../components/LeadForm';
import { saveLeads, loadLeadsAsync } from '../utils/storage';
import { useUser, canViewLead } from '../context/UserContext';
import './LeadsPage.css';

const LeadsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState<LeadStatus | 'all'>('all');
  const [filterType, setFilterType] = useState<LeadType | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'working' | 'converted' | 'lost'>('working');
  const { currentUser, users } = useUser();

  // Read filters from URL params on mount
  useEffect(() => {
    const statusParam = searchParams.get('status');
    const typeParam = searchParams.get('type');

    if (statusParam && ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'converted', 'lost'].includes(statusParam)) {
      setFilterStatus(statusParam as LeadStatus);
    }
    if (typeParam && ['hot', 'warm', 'cold'].includes(typeParam)) {
      setFilterType(typeParam as LeadType);
    }
  }, [searchParams]);

  // Load leads from API on mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const savedLeads = await loadLeadsAsync();
        setLeads(savedLeads);
      } catch (error) {
        console.error('Error loading leads:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // Save leads to localStorage whenever they change
  useEffect(() => {
    if (leads.length > 0) {
      saveLeads(leads);
    }
  }, [leads]);

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      const savedLeads = await loadLeadsAsync();
      setLeads(savedLeads);
    } catch (error) {
      console.error('Error refreshing leads:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddLead = (leadData: Omit<Lead, 'id' | 'status' | 'comments' | 'reminders' | 'createdAt'>) => {
    const newLead: Lead = {
      ...leadData,
      id: Date.now().toString(),
      status: 'new',
      comments: [],
      reminders: [],
      createdAt: new Date(),
      createdBy: currentUser?.id,
      createdByName: currentUser?.name,
      assignedTo: currentUser?.id,
      assignedToName: currentUser?.name,
      assignmentHistory: [],
      teamThread: currentUser ? [currentUser.id] : [],
    };
    setLeads(prev => [newLead, ...prev]);
    setShowForm(false);
  };

  // Filter leads by visibility based on current user role
  const visibleLeads = currentUser
    ? leads.filter(lead => canViewLead(currentUser, lead, users))
    : leads;

  // Filter leads by tab first
  const tabFilteredLeads = visibleLeads.filter(lead => {
    if (activeTab === 'working') {
      return lead.status !== 'converted' && lead.status !== 'lost';
    } else if (activeTab === 'converted') {
      return lead.status === 'converted';
    } else {
      return lead.status === 'lost';
    }
  });

  // Filter and search leads
  const filteredLeads = tabFilteredLeads
    .filter(lead => filterStatus === 'all' || lead.status === filterStatus)
    .filter(lead => filterType === 'all' || lead.leadType === filterType)
    .filter(lead =>
      searchTerm === '' ||
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.number.includes(searchTerm) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

  // Handle filter changes and update URL
  const handleStatusChange = (status: LeadStatus | 'all') => {
    setFilterStatus(status);
    const newParams = new URLSearchParams(searchParams);
    if (status === 'all') {
      newParams.delete('status');
    } else {
      newParams.set('status', status);
    }
    setSearchParams(newParams);
  };

  const handleTypeChange = (type: LeadType | 'all') => {
    setFilterType(type);
    const newParams = new URLSearchParams(searchParams);
    if (type === 'all') {
      newParams.delete('type');
    } else {
      newParams.set('type', type);
    }
    setSearchParams(newParams);
  };

  const clearFilters = () => {
    setFilterStatus('all');
    setFilterType('all');
    setSearchTerm('');
    setSearchParams({});
  };

  const hasActiveFilters = filterStatus !== 'all' || filterType !== 'all' || searchTerm !== '';

  // Stats
  const stats = {
    total: visibleLeads.length,
    hot: visibleLeads.filter(l => l.leadType === 'hot').length,
    warm: visibleLeads.filter(l => l.leadType === 'warm').length,
    cold: visibleLeads.filter(l => l.leadType === 'cold').length,
    working: visibleLeads.filter(l => l.status !== 'converted' && l.status !== 'lost').length,
    converted: visibleLeads.filter(l => l.status === 'converted').length,
    lost: visibleLeads.filter(l => l.status === 'lost').length,
  };

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

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusInfo = (status: LeadStatus) => {
    return LEAD_STATUSES.find(s => s.value === status);
  };

  const getTypeInfo = (type: string) => {
    return LEAD_TYPES.find(t => t.value === type);
  };

  return (
    <div className="leads-page">
      {/* Page Header */}
      <div className="page-header">
        <h1>Leads</h1>
      </div>

      {/* Stats Bar */}
      <div className="stats-bar">
        <div className="stat-item">
          <div className="stat-icon total">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">Total Leads</span>
          </div>
        </div>
        <div className="stat-divider"></div>
        <div className="stat-breakdown">
          <div className="breakdown-item">
            <span className="breakdown-dot hot"></span>
            <span className="breakdown-label">Hot:</span>
            <span className="breakdown-value">{stats.hot}</span>
          </div>
          <div className="breakdown-item">
            <span className="breakdown-dot warm"></span>
            <span className="breakdown-label">Warm:</span>
            <span className="breakdown-value">{stats.warm}</span>
          </div>
          <div className="breakdown-item">
            <span className="breakdown-dot cold"></span>
            <span className="breakdown-label">Cold:</span>
            <span className="breakdown-value">{stats.cold}</span>
          </div>
        </div>
      </div>

      {/* Lead Tabs */}
      <div className="leads-tabs">
        <button
          className={`tab-btn ${activeTab === 'working' ? 'active' : ''}`}
          onClick={() => setActiveTab('working')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          Working Leads
          <span className="tab-count">{stats.working}</span>
        </button>
        <button
          className={`tab-btn converted ${activeTab === 'converted' ? 'active' : ''}`}
          onClick={() => setActiveTab('converted')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          Converted
          <span className="tab-count">{stats.converted}</span>
        </button>
        <button
          className={`tab-btn lost ${activeTab === 'lost' ? 'active' : ''}`}
          onClick={() => setActiveTab('lost')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
          Lost
          <span className="tab-count">{stats.lost}</span>
        </button>
      </div>

      {/* Today's Scheduled Calls */}
      {todaysScheduledCalls.length > 0 && (
        <div className="todays-calls-bar">
          <div className="calls-bar-header">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
            <span>Today's Calls</span>
            <span className="calls-count">{todaysScheduledCalls.length}</span>
          </div>
          <div className="calls-bar-list">
            {todaysScheduledCalls.slice(0, 3).map(call => (
              <div
                key={call.id}
                className="call-chip"
                onClick={() => navigate(`/leads/${call.leadId}`)}
              >
                <span className="chip-time">
                  {new Date(call.dateTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="chip-name">{call.leadName}</span>
              </div>
            ))}
            {todaysScheduledCalls.length > 3 && (
              <span className="more-calls">+{todaysScheduledCalls.length - 3} more</span>
            )}
          </div>
        </div>
      )}

      {/* Main Content Card */}
      <div className="content-card">
        {/* Toolbar */}
        <div className="toolbar">
          <div className="toolbar-left">
            <div className="search-box">
              <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="M21 21l-4.35-4.35"/>
              </svg>
              <input
                type="text"
                placeholder="Search leads..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button className="clear-search" onClick={() => setSearchTerm('')}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              )}
            </div>
          </div>
          <div className="toolbar-right">
            <button className="btn-icon" onClick={handleRefresh} title="Refresh Data" disabled={isLoading}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={isLoading ? 'spin' : ''}>
                <path d="M23 4v6h-6"/>
                <path d="M1 20v-6h6"/>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
              </svg>
              <span>Refresh</span>
            </button>
            <div className="filter-dropdown">
              <select
                value={filterType}
                onChange={(e) => handleTypeChange(e.target.value as LeadType | 'all')}
              >
                <option value="all">All Types</option>
                <option value="hot">Hot</option>
                <option value="warm">Warm</option>
                <option value="cold">Cold</option>
              </select>
            </div>
            <div className="filter-dropdown">
              <select
                value={filterStatus}
                onChange={(e) => handleStatusChange(e.target.value as LeadStatus | 'all')}
              >
                <option value="all">All Status</option>
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="qualified">Qualified</option>
                <option value="proposal">Proposal</option>
                <option value="negotiation">Negotiation</option>
                <option value="converted">Converted</option>
                <option value="lost">Lost</option>
              </select>
            </div>
            {hasActiveFilters && (
              <button className="btn-clear-filters" onClick={clearFilters}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
                Clear
              </button>
            )}
            <button className="btn-primary" onClick={() => setShowForm(true)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Add Lead
            </button>
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading leads...</p>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="empty-state">
            {leads.length === 0 ? (
              <>
                <div className="empty-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                </div>
                <h3>No leads yet</h3>
                <p>Add your first lead to get started</p>
                <div className="empty-actions">
                  <button className="btn-primary" onClick={() => setShowForm(true)}>
                    Add Lead
                  </button>
                </div>
              </>
            ) : visibleLeads.length === 0 ? (
              <>
                <div className="empty-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </div>
                <h3>No leads visible</h3>
                <p>You don't have access to any leads yet. Leads will appear here when assigned to you or your team.</p>
              </>
            ) : (
              <>
                <div className="empty-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="11" cy="11" r="8"/>
                    <path d="M21 21l-4.35-4.35"/>
                  </svg>
                </div>
                <h3>No results found</h3>
                <p>Try adjusting your search or filter</p>
              </>
            )}
          </div>
        ) : (
          <div className="table-container">
            <table className="leads-table">
              <thead>
                <tr>
                  <th>Lead</th>
                  <th>Contact</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Assigned To</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map(lead => {
                  const statusInfo = getStatusInfo(lead.status);
                  const typeInfo = getTypeInfo(lead.leadType);
                  const pendingReminders = lead.reminders?.filter(r => !r.completed).length || 0;

                  return (
                    <tr key={lead.id} onClick={() => navigate(`/leads/${lead.id}`)}>
                      <td>
                        <div className="lead-cell">
                          <div className="lead-avatar" style={{ background: typeInfo?.color }}>
                            {lead.name.charAt(0)}
                          </div>
                          <div className="lead-info">
                            <span className="lead-name">{lead.name}</span>
                            <span className="lead-city">{lead.city}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="contact-cell">
                          <span className="contact-phone">{lead.number}</span>
                          <span className="contact-email">{lead.email}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`type-badge ${lead.leadType}`}>
                          {typeInfo?.label}
                        </span>
                      </td>
                      <td>
                        <span className="status-badge" style={{
                          background: `${statusInfo?.color}15`,
                          color: statusInfo?.color
                        }}>
                          {statusInfo?.label}
                        </span>
                      </td>
                      <td>
                        <div className="assigned-cell">
                          {lead.assignedToName || '—'}
                        </div>
                      </td>
                      <td>
                        <span className="date-cell">{formatDate(lead.createdAt)}</span>
                      </td>
                      <td>
                        <div className="actions-cell">
                          {pendingReminders > 0 && (
                            <span className="reminder-badge" title={`${pendingReminders} pending reminders`}>
                              {pendingReminders}
                            </span>
                          )}
                          <button
                            className="action-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/leads/${lead.id}`);
                            }}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                              <circle cx="12" cy="12" r="3"/>
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        {filteredLeads.length > 0 && (
          <div className="table-footer">
            <span className="results-info">
              Showing {filteredLeads.length} of {tabFilteredLeads.length} {activeTab} leads
              {currentUser && <span className="user-info"> • Logged in as {currentUser.name}</span>}
            </span>
          </div>
        )}
      </div>

      {showForm && (
        <LeadForm
          onSubmit={handleAddLead}
          onCancel={() => setShowForm(false)}
        />
      )}
    </div>
  );
};

export default LeadsPage;
