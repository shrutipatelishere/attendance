import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, UserRole, USER_ROLES } from '../types/User';
import { loadUsersAsync, createUser, saveUsers } from '../utils/storage';
import { demoUsers } from '../data/demoUsers';
import './AddUserPage.css';

interface UserFormData {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
  reportingTo: string;
}

const AddUserPage: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'caller',
    reportingTo: '',
  });

  const [errors, setErrors] = useState<Partial<UserFormData>>({});

  useEffect(() => {
    const loadData = async () => {
      try {
        const savedUsers = await loadUsersAsync();
        setUsers(savedUsers);
      } catch (error) {
        console.error('Error loading users:', error);
      }
    };
    loadData();
  }, []);

  const handleLoadDemoUsers = () => {
    if (window.confirm('This will add 9 demo users (1 TL, 2 Managers, 6 Callers). Continue?')) {
      const existingIds = users.map(u => u.id);
      const newUsers = demoUsers.filter(u => !existingIds.includes(u.id));
      const updatedUsers = [...newUsers, ...users];
      setUsers(updatedUsers);
      saveUsers(updatedUsers);
      alert(`Added ${newUsers.length} demo users!`);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof UserFormData]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<UserFormData> = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    // Callers must report to a manager, managers must report to TL
    if (formData.role === 'caller' && !formData.reportingTo) {
      newErrors.reportingTo = 'Caller must report to a manager';
    }
    if (formData.role === 'manager' && !formData.reportingTo) {
      newErrors.reportingTo = 'Manager must report to a Team Leader';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      try {
        const newUser: User = {
          id: `user-${Date.now()}`,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          role: formData.role,
          reportingTo: formData.reportingTo || undefined,
          createdAt: new Date(),
          isActive: true,
        };

        await createUser(newUser);
        alert(`User "${formData.name}" created successfully!`);
        navigate('/users');
      } catch (error) {
        console.error('Error creating user:', error);
      }
    }
  };

  // Get managers and TLs for reporting dropdown
  const managers = users.filter(u => u.role === 'manager' && u.isActive);
  const teamLeaders = users.filter(u => u.role === 'team_leader' && u.isActive);

  const getReportingOptions = () => {
    if (formData.role === 'caller') {
      return managers;
    } else if (formData.role === 'manager') {
      return teamLeaders;
    }
    return [];
  };

  return (
    <div className="add-user-page">
      <div className="page-header">
        <div className="header-content">
          <h1>Add New User</h1>
          <p className="subtitle">Create a new user account for the CRM system</p>
        </div>
        <button className="btn-demo" onClick={handleLoadDemoUsers}>
          Load Demo Users
        </button>
      </div>

      <div className="form-card">
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>Full Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter full name"
                className={errors.name ? 'error' : ''}
              />
              {errors.name && <span className="error-text">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label>Email Address *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter email address"
                className={errors.email ? 'error' : ''}
              />
              {errors.email && <span className="error-text">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label>Phone Number *</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Enter phone number"
                className={errors.phone ? 'error' : ''}
              />
              {errors.phone && <span className="error-text">{errors.phone}</span>}
            </div>

            <div className="form-group">
              <label>Password *</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter password (min 6 characters)"
                className={errors.password ? 'error' : ''}
              />
              {errors.password && <span className="error-text">{errors.password}</span>}
            </div>

            <div className="form-group">
              <label>Role *</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
              >
                {USER_ROLES.map(role => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>

            {(formData.role === 'caller' || formData.role === 'manager') && (
              <div className="form-group full-width">
                <label>
                  Reports To *
                  {formData.role === 'caller' && ' (Select Manager)'}
                  {formData.role === 'manager' && ' (Select Team Leader)'}
                </label>
                <select
                  name="reportingTo"
                  value={formData.reportingTo}
                  onChange={handleChange}
                  className={errors.reportingTo ? 'error' : ''}
                >
                  <option value="">-- Select --</option>
                  {getReportingOptions().map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.role === 'manager' ? 'Manager' : 'Team Leader'})
                    </option>
                  ))}
                </select>
                {errors.reportingTo && <span className="error-text">{errors.reportingTo}</span>}
                {getReportingOptions().length === 0 && (
                  <span className="hint-text">
                    No {formData.role === 'caller' ? 'managers' : 'team leaders'} available.
                    Please create one first or load demo users.
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => navigate('/users')}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Create User
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddUserPage;
