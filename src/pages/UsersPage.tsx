import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, USER_ROLES } from '../types/User';
import { loadUsersAsync, saveUsers } from '../utils/storage';
import { useUser } from '../context/UserContext';
import './UsersPage.css';

// SVG Icons
const Icons = {
  users: (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  search: (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="11" cy="11" r="8"/>
      <path d="M21 21l-4.35-4.35"/>
    </svg>
  ),
  lock: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  ),
  unlock: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 9.9-1"/>
    </svg>
  ),
  plus: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
};

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterRole, setFilterRole] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const { refreshUsers } = useUser();

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const savedUsers = await loadUsersAsync();
        setUsers(savedUsers);
      } catch (error) {
        console.error('Error loading users:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      const savedUsers = await loadUsersAsync();
      setUsers(savedUsers);
      refreshUsers();
    } catch (error) {
      console.error('Error refreshing users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = (userId: string) => {
    const updatedUsers = users.map(u =>
      u.id === userId ? { ...u, isActive: !u.isActive } : u
    );
    setUsers(updatedUsers);
    saveUsers(updatedUsers);
  };

  const getReportingToName = (reportingToId?: string) => {
    if (!reportingToId) return '—';
    const manager = users.find(u => u.id === reportingToId);
    return manager ? manager.name : '—';
  };

  const getRoleColor = (role: string) => {
    const roleInfo = USER_ROLES.find(r => r.value === role);
    return roleInfo?.color || '#666';
  };

  const getRoleLabel = (role: string) => {
    const roleInfo = USER_ROLES.find(r => r.value === role);
    return roleInfo?.label || role;
  };

  const getTeamSize = (userId: string) => {
    return users.filter(u => u.reportingTo === userId).length;
  };

  const filteredUsers = users
    .filter(user => filterRole === 'all' || user.role === filterRole)
    .filter(user =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

  // Group users by role for stats
  const stats = {
    total: users.length,
    teamLeaders: users.filter(u => u.role === 'team_leader').length,
    managers: users.filter(u => u.role === 'manager').length,
    callers: users.filter(u => u.role === 'caller').length,
    admins: users.filter(u => u.role === 'admin').length,
  };

  return (
    <div className="users-page">
      <div className="page-header">
        <div className="header-content">
          <h1>Users</h1>
          <p className="subtitle">Manage your team members and their roles</p>
        </div>
        <div className="header-actions">
          <button className="btn-secondary" onClick={handleRefresh} disabled={isLoading}>
            {isLoading ? 'Loading...' : 'Refresh'}
          </button>
          <Link to="/add-user" className="btn-primary">
            {Icons.plus} Add User
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-row">
        <div className="stat-card">
          <span className="stat-value">{stats.total}</span>
          <span className="stat-label">Total Users</span>
        </div>
        <div className="stat-card">
          <span className="stat-value" style={{ color: '#8e44ad' }}>{stats.teamLeaders}</span>
          <span className="stat-label">Team Leaders</span>
        </div>
        <div className="stat-card">
          <span className="stat-value" style={{ color: '#27ae60' }}>{stats.managers}</span>
          <span className="stat-label">Managers</span>
        </div>
        <div className="stat-card">
          <span className="stat-value" style={{ color: '#3498db' }}>{stats.callers}</span>
          <span className="stat-label">Callers</span>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <label>Role:</label>
          <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
            <option value="all">All Roles</option>
            <option value="team_leader">Team Leader</option>
            <option value="manager">Manager</option>
            <option value="caller">Caller</option>
            <option value="admin">Administrator</option>
          </select>
        </div>
      </div>

      {/* Users List */}
      {isLoading ? (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading users...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="empty-state">
          {users.length === 0 ? (
            <>
              <div className="empty-icon">{Icons.users}</div>
              <h3>No users yet</h3>
              <p>Add your first user to get started</p>
              <div className="empty-actions">
                <Link to="/add-user" className="btn-primary">{Icons.plus} Add User</Link>
              </div>
            </>
          ) : (
            <>
              <div className="empty-icon">{Icons.search}</div>
              <h3>No results found</h3>
              <p>Try adjusting your search or filter</p>
            </>
          )}
        </div>
      ) : (
        <div className="users-table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Reports To</th>
                <th>Team Size</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user.id} className={!user.isActive ? 'inactive' : ''}>
                  <td className="user-name">
                    <div className="user-avatar" style={{ backgroundColor: getRoleColor(user.role) }}>
                      {user.name.charAt(0)}
                    </div>
                    <span>{user.name}</span>
                  </td>
                  <td>
                    <span className="role-badge" style={{ backgroundColor: getRoleColor(user.role) }}>
                      {getRoleLabel(user.role)}
                    </span>
                  </td>
                  <td>{user.email}</td>
                  <td>{user.phone}</td>
                  <td>{getReportingToName(user.reportingTo)}</td>
                  <td>
                    {(user.role === 'manager' || user.role === 'team_leader') && (
                      <span className="team-size">{getTeamSize(user.id)} members</span>
                    )}
                    {user.role === 'caller' && '—'}
                  </td>
                  <td>
                    <span className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn-icon"
                      onClick={() => handleToggleActive(user.id)}
                      title={user.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {user.isActive ? Icons.lock : Icons.unlock}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Team Hierarchy */}
      {users.length > 0 && (
        <div className="hierarchy-section">
          <h2>Team Hierarchy</h2>
          <div className="hierarchy-grid">
            {users.filter(u => u.role === 'team_leader').map(tl => (
              <div key={tl.id} className="hierarchy-card tl">
                <div className="hierarchy-header">
                  <span className="role-tag">Team Leader</span>
                  <h3>{tl.name}</h3>
                </div>
                <div className="hierarchy-team">
                  {users.filter(u => u.reportingTo === tl.id).map(manager => (
                    <div key={manager.id} className="hierarchy-member manager">
                      <div className="member-info">
                        <span className="role-tag small">Manager</span>
                        <span className="member-name">{manager.name}</span>
                      </div>
                      <div className="member-team">
                        {users.filter(u => u.reportingTo === manager.id).map(caller => (
                          <div key={caller.id} className="hierarchy-member caller">
                            <span className="member-name">{caller.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;
