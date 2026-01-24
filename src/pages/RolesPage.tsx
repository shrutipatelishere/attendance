import React, { useState, useEffect } from 'react';
import { User, USER_ROLES } from '../types/User';
import { loadUsersAsync, updateUser } from '../utils/storage';
import './RolesPage.css';

const RolesPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedReportingTo, setSelectedReportingTo] = useState<string>('');

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const loadedUsers = await loadUsersAsync();
        setUsers(loadedUsers);
      } catch (error) {
        console.error('Error loading users:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const getRoleColor = (role: string) => {
    const roleInfo = USER_ROLES.find(r => r.value === role);
    return roleInfo?.color || '#666';
  };

  const getRoleLabel = (role: string) => {
    const roleInfo = USER_ROLES.find(r => r.value === role);
    return roleInfo?.label || role;
  };

  const handleOpenAssignModal = (user: User) => {
    setSelectedUser(user);
    setSelectedReportingTo(user.reportingTo || '');
    setShowAssignModal(true);
  };

  const handleAssignReportingTo = async () => {
    if (!selectedUser) return;

    const updatedUserData: User = {
      ...selectedUser,
      reportingTo: selectedReportingTo || undefined
    };

    // Update local state
    const updatedUsers = users.map(u =>
      u.id === selectedUser.id ? updatedUserData : u
    );
    setUsers(updatedUsers);

    // Save to API/JSON file
    await updateUser(updatedUserData);

    setShowAssignModal(false);
    setSelectedUser(null);
    setSelectedReportingTo('');
  };

  const getAvailableSupervisors = (user: User): User[] => {
    switch (user.role) {
      case 'caller':
        return users.filter(u => u.role === 'manager' && u.isActive);
      case 'manager':
        return users.filter(u => u.role === 'team_leader' && u.isActive);
      case 'team_leader':
        return users.filter(u => u.role === 'admin' && u.isActive);
      default:
        return [];
    }
  };

  const teamLeaders = users.filter(u => u.role === 'team_leader' && u.isActive);
  const managers = users.filter(u => u.role === 'manager' && u.isActive);
  const callers = users.filter(u => u.role === 'caller' && u.isActive);
  const admins = users.filter(u => u.role === 'admin' && u.isActive);

  const getManagersUnderTL = (tlId: string) => managers.filter(m => m.reportingTo === tlId);
  const getCallersUnderManager = (managerId: string) => callers.filter(c => c.reportingTo === managerId);
  const getUnassignedManagers = () => managers.filter(m => !m.reportingTo || !teamLeaders.find(tl => tl.id === m.reportingTo));
  const getUnassignedCallers = () => callers.filter(c => !c.reportingTo || !managers.find(m => m.id === c.reportingTo));

  if (isLoading) {
    return (
      <div className="roles-page">
        <div className="page-header">
          <h1>Team Hierarchy</h1>
          <p className="subtitle">Manage reporting structure and team assignments</p>
        </div>
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading team structure...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="roles-page">
      <div className="page-header">
        <div className="header-content">
          <h1>Team Hierarchy</h1>
          <p className="subtitle">Manage reporting structure - TL sees all leads from managers assigned to them</p>
        </div>
      </div>

      {/* Role Summary */}
      <div className="role-summary">
        <div className="role-stat">
          <span className="role-count" style={{ color: getRoleColor('admin') }}>{admins.length}</span>
          <span className="role-name">Admins</span>
        </div>
        <div className="role-stat">
          <span className="role-count" style={{ color: getRoleColor('team_leader') }}>{teamLeaders.length}</span>
          <span className="role-name">Team Leaders</span>
        </div>
        <div className="role-stat">
          <span className="role-count" style={{ color: getRoleColor('manager') }}>{managers.length}</span>
          <span className="role-name">Managers</span>
        </div>
        <div className="role-stat">
          <span className="role-count" style={{ color: getRoleColor('caller') }}>{callers.length}</span>
          <span className="role-name">Callers</span>
        </div>
      </div>

      {/* Visibility Rules Info */}
      <div className="info-card">
        <h3>Lead Visibility Rules</h3>
        <ul>
          <li><strong>Callers</strong> see only their own leads</li>
          <li><strong>Managers</strong> see leads from all callers assigned to them</li>
          <li><strong>Team Leaders</strong> see leads from all managers (and their callers) assigned to them</li>
          <li><strong>Admins</strong> see all leads in the system</li>
        </ul>
      </div>

      {/* Team Hierarchy */}
      <div className="hierarchy-section">
        <h2>Team Structure</h2>

        {teamLeaders.length === 0 ? (
          <div className="empty-state">
            <p>No Team Leaders found. Add users with Team Leader role to see the hierarchy.</p>
          </div>
        ) : (
          <div className="hierarchy-container">
            {teamLeaders.map(tl => {
              const tlManagers = getManagersUnderTL(tl.id);
              return (
                <div key={tl.id} className="team-card">
                  <div className="team-header">
                    <div className="user-info">
                      <div className="user-avatar" style={{ backgroundColor: getRoleColor('team_leader') }}>
                        {tl.name.charAt(0)}
                      </div>
                      <div>
                        <span className="user-name">{tl.name}</span>
                        <span className="user-role">Team Leader</span>
                      </div>
                    </div>
                    <span className="team-count">{tlManagers.length} managers</span>
                  </div>

                  <div className="team-members">
                    {tlManagers.length === 0 ? (
                      <p className="no-members">No managers assigned to this TL</p>
                    ) : (
                      tlManagers.map(manager => {
                        const managerCallers = getCallersUnderManager(manager.id);
                        return (
                          <div key={manager.id} className="manager-card">
                            <div className="manager-header">
                              <div className="user-info">
                                <div className="user-avatar small" style={{ backgroundColor: getRoleColor('manager') }}>
                                  {manager.name.charAt(0)}
                                </div>
                                <div>
                                  <span className="user-name">{manager.name}</span>
                                  <span className="user-role">Manager</span>
                                </div>
                              </div>
                              <button
                                className="btn-reassign"
                                onClick={() => handleOpenAssignModal(manager)}
                                title="Change TL assignment"
                              >
                                Reassign
                              </button>
                            </div>

                            {managerCallers.length > 0 && (
                              <div className="caller-list">
                                {managerCallers.map(caller => (
                                  <div key={caller.id} className="caller-item">
                                    <div className="user-avatar tiny" style={{ backgroundColor: getRoleColor('caller') }}>
                                      {caller.name.charAt(0)}
                                    </div>
                                    <span className="caller-name">{caller.name}</span>
                                    <button
                                      className="btn-small"
                                      onClick={() => handleOpenAssignModal(caller)}
                                    >
                                      Reassign
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Unassigned Users */}
      {(getUnassignedManagers().length > 0 || getUnassignedCallers().length > 0) && (
        <div className="unassigned-section">
          <h2>Unassigned Users</h2>
          <p className="section-desc">These users are not assigned to any supervisor. Click "Assign" to add them to a team.</p>

          {getUnassignedManagers().length > 0 && (
            <div className="unassigned-group">
              <h3>Managers without TL</h3>
              <div className="unassigned-list">
                {getUnassignedManagers().map(manager => (
                  <div key={manager.id} className="unassigned-item">
                    <div className="user-info">
                      <div className="user-avatar small" style={{ backgroundColor: getRoleColor('manager') }}>
                        {manager.name.charAt(0)}
                      </div>
                      <span className="user-name">{manager.name}</span>
                    </div>
                    <button
                      className="btn-assign"
                      onClick={() => handleOpenAssignModal(manager)}
                    >
                      Assign to TL
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {getUnassignedCallers().length > 0 && (
            <div className="unassigned-group">
              <h3>Callers without Manager</h3>
              <div className="unassigned-list">
                {getUnassignedCallers().map(caller => (
                  <div key={caller.id} className="unassigned-item">
                    <div className="user-info">
                      <div className="user-avatar small" style={{ backgroundColor: getRoleColor('caller') }}>
                        {caller.name.charAt(0)}
                      </div>
                      <span className="user-name">{caller.name}</span>
                    </div>
                    <button
                      className="btn-assign"
                      onClick={() => handleOpenAssignModal(caller)}
                    >
                      Assign to Manager
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Assign Modal */}
      {showAssignModal && selectedUser && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Assign {selectedUser.name}</h2>
              <button className="modal-close" onClick={() => setShowAssignModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p>
                Assign <strong>{selectedUser.name}</strong> ({getRoleLabel(selectedUser.role)}) to a supervisor.
              </p>
              <div className="form-group">
                <label>Reports To</label>
                <select
                  value={selectedReportingTo}
                  onChange={(e) => setSelectedReportingTo(e.target.value)}
                >
                  <option value="">-- No Assignment --</option>
                  {getAvailableSupervisors(selectedUser).map(sup => (
                    <option key={sup.id} value={sup.id}>
                      {sup.name} ({getRoleLabel(sup.role)})
                    </option>
                  ))}
                </select>
              </div>
              {selectedUser.role === 'manager' && (
                <p className="info-text">
                  The selected Team Leader will be able to see all leads from this manager and their callers.
                </p>
              )}
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowAssignModal(false)}>
                Cancel
              </button>
              <button className="btn-confirm" onClick={handleAssignReportingTo}>
                Save Assignment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RolesPage;
