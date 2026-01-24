export type UserRole = 'caller' | 'manager' | 'team_leader' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  password: string; // Plain text for demo purposes
  role: UserRole;
  reportingTo?: string; // ID of the manager/TL this user reports to
  createdAt: Date;
  isActive: boolean;
}

export const USER_ROLES: { value: UserRole; label: string; color: string }[] = [
  { value: 'caller', label: 'Caller', color: '#3498db' },
  { value: 'manager', label: 'Manager', color: '#27ae60' },
  { value: 'team_leader', label: 'Team Leader', color: '#8e44ad' },
  { value: 'admin', label: 'Administrator', color: '#e74c3c' },
];
