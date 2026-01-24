import { Lead } from '../types/Lead';
import { User } from '../types/User';
import {
  apiGetLeads,
  apiBulkSaveLeads,
  apiGetUsers,
  apiBulkSaveUsers,
  apiCreateLead,
  apiUpdateLead,
  apiDeleteLead,
  apiCreateUser,
  apiUpdateUser,
  apiDeleteUser,
  checkAPIAvailability
} from './api';

const STORAGE_KEY = 'crm_leads_data';
const USERS_STORAGE_KEY = 'crm_users_data';

// Track API availability
let apiAvailable = false;

// Check API on load
checkAPIAvailability().then(available => {
  apiAvailable = available;
  if (available) {
    console.log('API server connected - using JSON file storage');
  } else {
    console.log('API server not available - using localStorage');
  }
});

// Helper to convert date strings to Date objects for leads
const convertLeadDates = (lead: any): Lead => ({
  ...lead,
  createdAt: new Date(lead.createdAt),
  comments: (lead.comments || []).map((c: any) => ({
    ...c,
    createdAt: new Date(c.createdAt),
  })),
  reminders: (lead.reminders || []).map((r: any) => ({
    ...r,
    dateTime: new Date(r.dateTime),
  })),
  assignmentHistory: (lead.assignmentHistory || []).map((a: any) => ({
    ...a,
    assignedAt: new Date(a.assignedAt),
  })),
  teamThread: lead.teamThread || [],
  transferredAt: lead.transferredAt ? new Date(lead.transferredAt) : undefined,
});

// Helper to convert date strings to Date objects for users
const convertUserDates = (user: any): User => ({
  ...user,
  createdAt: new Date(user.createdAt),
});

// ============ LEADS ============

export const saveLeads = async (leads: Lead[]): Promise<void> => {
  try {
    // Always save to localStorage as backup
    localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));

    // Try to save to API if available
    if (apiAvailable) {
      await apiBulkSaveLeads(leads);
    }
  } catch (error) {
    console.error('Error saving leads:', error);
  }
};

export const loadLeads = (): Lead[] => {
  // This is the synchronous version for initial load
  // Use loadLeadsAsync for API-first loading
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const leads = JSON.parse(data);
      return leads.map(convertLeadDates);
    }
  } catch (error) {
    console.error('Error loading leads from localStorage:', error);
  }
  return [];
};

export const loadLeadsAsync = async (): Promise<Lead[]> => {
  try {
    // Try API first
    if (apiAvailable) {
      const leads = await apiGetLeads();
      // Also update localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
      return leads.map(convertLeadDates);
    }
  } catch (error) {
    console.error('Error loading leads from API:', error);
  }

  // Fallback to localStorage
  return loadLeads();
};

export const createLead = async (lead: Lead): Promise<Lead> => {
  try {
    if (apiAvailable) {
      const savedLead = await apiCreateLead(lead);
      // Update localStorage cache
      const leads = loadLeads();
      localStorage.setItem(STORAGE_KEY, JSON.stringify([savedLead, ...leads]));
      return convertLeadDates(savedLead);
    }
  } catch (error) {
    console.error('Error creating lead via API:', error);
  }

  // Fallback to localStorage
  const leads = loadLeads();
  localStorage.setItem(STORAGE_KEY, JSON.stringify([lead, ...leads]));
  return lead;
};

export const updateLead = async (lead: Lead): Promise<Lead> => {
  try {
    if (apiAvailable) {
      const updatedLead = await apiUpdateLead(lead.id, lead);
      // Update localStorage cache
      const leads = loadLeads();
      const updatedLeads = leads.map(l => l.id === lead.id ? updatedLead : l);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedLeads));
      return convertLeadDates(updatedLead);
    }
  } catch (error) {
    console.error('Error updating lead via API:', error);
  }

  // Fallback to localStorage
  const leads = loadLeads();
  const updatedLeads = leads.map(l => l.id === lead.id ? lead : l);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedLeads));
  return lead;
};

export const deleteLead = async (leadId: string): Promise<boolean> => {
  try {
    if (apiAvailable) {
      await apiDeleteLead(leadId);
      // Update localStorage cache
      const leads = loadLeads();
      const filteredLeads = leads.filter(l => l.id !== leadId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredLeads));
      return true;
    }
  } catch (error) {
    console.error('Error deleting lead via API:', error);
  }

  // Fallback to localStorage
  const leads = loadLeads();
  const filteredLeads = leads.filter(l => l.id !== leadId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredLeads));
  return true;
};

export const exportToJSON = (leads: Lead[]): void => {
  const dataStr = JSON.stringify(leads, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `crm_leads_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const exportToCSV = (leads: Lead[]): void => {
  const headers = [
    'ID',
    'Name',
    'Phone',
    'Email',
    'City',
    'Lead Type',
    'Source',
    'Service',
    'Status',
    'Notes',
    'Created At',
    'Assigned To',
    'Comments Count',
    'Pending Reminders',
    'Completed Reminders',
  ];

  const rows = leads.map(lead => [
    lead.id,
    lead.name,
    lead.number,
    lead.email,
    lead.city,
    lead.leadType,
    lead.source,
    lead.service,
    lead.status,
    lead.notes.replace(/,/g, ';').replace(/\n/g, ' '),
    new Date(lead.createdAt).toLocaleString(),
    lead.assignedToName || '',
    lead.comments.length,
    lead.reminders.filter(r => !r.completed).length,
    lead.reminders.filter(r => r.completed).length,
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `crm_leads_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const importFromJSON = (file: File): Promise<Lead[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        const leads = data.map(convertLeadDates);
        resolve(leads);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
};

// ============ USERS ============

export const saveUsers = async (users: User[]): Promise<void> => {
  try {
    // Always save to localStorage as backup
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));

    // Try to save to API if available
    if (apiAvailable) {
      await apiBulkSaveUsers(users);
    }
  } catch (error) {
    console.error('Error saving users:', error);
  }
};

export const loadUsers = (): User[] => {
  // Synchronous version for initial load
  try {
    const data = localStorage.getItem(USERS_STORAGE_KEY);
    if (data) {
      const users = JSON.parse(data);
      return users.map(convertUserDates);
    }
  } catch (error) {
    console.error('Error loading users from localStorage:', error);
  }
  return [];
};

export const loadUsersAsync = async (): Promise<User[]> => {
  try {
    // Try API first
    if (apiAvailable) {
      const users = await apiGetUsers();
      // Also update localStorage
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
      return users.map(convertUserDates);
    }
  } catch (error) {
    console.error('Error loading users from API:', error);
  }

  // Fallback to localStorage
  return loadUsers();
};

export const createUser = async (user: User): Promise<User> => {
  try {
    if (apiAvailable) {
      const savedUser = await apiCreateUser(user);
      // Update localStorage cache
      const users = loadUsers();
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify([savedUser, ...users]));
      return convertUserDates(savedUser);
    }
  } catch (error) {
    console.error('Error creating user via API:', error);
  }

  // Fallback to localStorage
  const users = loadUsers();
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify([user, ...users]));
  return user;
};

export const updateUser = async (user: User): Promise<User> => {
  try {
    if (apiAvailable) {
      const updatedUser = await apiUpdateUser(user.id, user);
      // Update localStorage cache
      const users = loadUsers();
      const updatedUsers = users.map(u => u.id === user.id ? updatedUser : u);
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));
      return convertUserDates(updatedUser);
    }
  } catch (error) {
    console.error('Error updating user via API:', error);
  }

  // Fallback to localStorage
  const users = loadUsers();
  const updatedUsers = users.map(u => u.id === user.id ? user : u);
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));
  return user;
};

export const deleteUser = async (userId: string): Promise<boolean> => {
  try {
    if (apiAvailable) {
      await apiDeleteUser(userId);
      // Update localStorage cache
      const users = loadUsers();
      const filteredUsers = users.filter(u => u.id !== userId);
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(filteredUsers));
      return true;
    }
  } catch (error) {
    console.error('Error deleting user via API:', error);
  }

  // Fallback to localStorage
  const users = loadUsers();
  const filteredUsers = users.filter(u => u.id !== userId);
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(filteredUsers));
  return true;
};

// ============ UTILITY ============

export const isUsingAPI = (): boolean => apiAvailable;

export const syncToAPI = async (): Promise<{ leads: boolean; users: boolean }> => {
  const result = { leads: false, users: false };

  try {
    const leads = loadLeads();
    if (leads.length > 0) {
      await apiBulkSaveLeads(leads);
      result.leads = true;
    }
  } catch (error) {
    console.error('Error syncing leads to API:', error);
  }

  try {
    const users = loadUsers();
    if (users.length > 0) {
      await apiBulkSaveUsers(users);
      result.users = true;
    }
  } catch (error) {
    console.error('Error syncing users to API:', error);
  }

  return result;
};
