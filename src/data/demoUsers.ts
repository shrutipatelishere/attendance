import { User } from '../types/User';

// Admin
const admin: User = {
  id: 'admin-001',
  name: 'Sanjay Kapoor',
  email: 'admin@crm.com',
  phone: '+91 98765 00000',
  password: 'admin123',
  role: 'admin',
  createdAt: new Date('2024-01-01'),
  isActive: true,
};

// Team Leader
const teamLeader: User = {
  id: 'tl-001',
  name: 'Rajesh Kumar',
  email: 'tl@crm.com',
  phone: '+91 98765 43210',
  password: 'tl123',
  role: 'team_leader',
  createdAt: new Date('2024-01-01'),
  isActive: true,
};

// Manager 1 - Reports to TL
const manager1: User = {
  id: 'mgr-001',
  name: 'Priya Sharma',
  email: 'manager1@crm.com',
  phone: '+91 98765 43211',
  password: 'manager123',
  role: 'manager',
  reportingTo: 'tl-001',
  createdAt: new Date('2024-01-15'),
  isActive: true,
};

// Manager 2 - Reports to TL
const manager2: User = {
  id: 'mgr-002',
  name: 'Amit Patel',
  email: 'manager2@crm.com',
  phone: '+91 98765 43212',
  password: 'manager123',
  role: 'manager',
  reportingTo: 'tl-001',
  createdAt: new Date('2024-02-01'),
  isActive: true,
};

// Callers under Manager 1 (Priya Sharma)
const caller1: User = {
  id: 'clr-001',
  name: 'Neha Gupta',
  email: 'caller1@crm.com',
  phone: '+91 98765 43213',
  password: 'caller123',
  role: 'caller',
  reportingTo: 'mgr-001',
  createdAt: new Date('2024-02-15'),
  isActive: true,
};

const caller2: User = {
  id: 'clr-002',
  name: 'Vikram Singh',
  email: 'caller2@crm.com',
  phone: '+91 98765 43214',
  password: 'caller123',
  role: 'caller',
  reportingTo: 'mgr-001',
  createdAt: new Date('2024-02-20'),
  isActive: true,
};

const caller3: User = {
  id: 'clr-003',
  name: 'Anita Desai',
  email: 'caller3@crm.com',
  phone: '+91 98765 43215',
  password: 'caller123',
  role: 'caller',
  reportingTo: 'mgr-001',
  createdAt: new Date('2024-03-01'),
  isActive: true,
};

// Callers under Manager 2 (Amit Patel)
const caller4: User = {
  id: 'clr-004',
  name: 'Rahul Verma',
  email: 'caller4@crm.com',
  phone: '+91 98765 43216',
  password: 'caller123',
  role: 'caller',
  reportingTo: 'mgr-002',
  createdAt: new Date('2024-03-10'),
  isActive: true,
};

const caller5: User = {
  id: 'clr-005',
  name: 'Sneha Reddy',
  email: 'caller5@crm.com',
  phone: '+91 98765 43217',
  password: 'caller123',
  role: 'caller',
  reportingTo: 'mgr-002',
  createdAt: new Date('2024-03-15'),
  isActive: true,
};

const caller6: User = {
  id: 'clr-006',
  name: 'Karan Mehta',
  email: 'caller6@crm.com',
  phone: '+91 98765 43218',
  password: 'caller123',
  role: 'caller',
  reportingTo: 'mgr-002',
  createdAt: new Date('2024-03-20'),
  isActive: true,
};

export const demoUsers: User[] = [
  admin,
  teamLeader,
  manager1,
  manager2,
  caller1,
  caller2,
  caller3,
  caller4,
  caller5,
  caller6,
];

// Helper function to get team hierarchy
export const getTeamHierarchy = () => {
  return {
    admin: admin,
    teamLeader: teamLeader,
    teams: [
      {
        manager: manager1,
        callers: [caller1, caller2, caller3],
      },
      {
        manager: manager2,
        callers: [caller4, caller5, caller6],
      },
    ],
  };
};

// Helper function to get users by role
export const getUsersByRole = (users: User[], role: string) => {
  return users.filter(u => u.role === role);
};

// Helper function to get team members under a manager
export const getTeamMembers = (users: User[], managerId: string) => {
  return users.filter(u => u.reportingTo === managerId);
};
