// Local Storage utility to replace Firebase
// This uses localStorage for demo purposes - data persists in browser

import demoData from './demoData.json';

const STORAGE_KEYS = {
  USERS: 'attendify_users',
  STAFF: 'attendify_staff',
  ATTENDANCE: 'attendify_attendance',
  SETTINGS: 'attendify_settings',
  MISS_PUNCH_REQUESTS: 'attendify_miss_punch_requests',
  CURRENT_USER: 'attendify_current_user',
  INITIALIZED: 'attendify_initialized'
};

// Initialize data from demo JSON if not already initialized
export const initializeStore = () => {
  const isInitialized = localStorage.getItem(STORAGE_KEYS.INITIALIZED);

  if (!isInitialized) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(demoData.users));
    localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(demoData.staff));
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(demoData.attendance));
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(demoData.settings));
    localStorage.setItem(STORAGE_KEYS.MISS_PUNCH_REQUESTS, JSON.stringify(demoData.missPunchRequests));
    localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
    console.log('Demo data initialized!');
  }
};

// Reset to demo data (useful for testing)
export const resetToDemo = () => {
  localStorage.removeItem(STORAGE_KEYS.INITIALIZED);
  localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  initializeStore();
};

// Generic getter with parsing
const getItem = (key) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (e) {
    console.error(`Error parsing ${key}:`, e);
    return null;
  }
};

// Generic setter with stringify
const setItem = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.error(`Error saving ${key}:`, e);
    return false;
  }
};

// ============ AUTHENTICATION ============

export const login = (email, password) => {
  const users = getItem(STORAGE_KEYS.USERS) || {};

  // Find user by email
  const user = Object.values(users).find(u => u.email === email);

  if (!user) {
    throw new Error('User not found');
  }

  if (user.password !== password) {
    throw new Error('Invalid password');
  }

  // Store current user session
  const sessionUser = {
    uid: user.uid,
    email: user.email,
    name: user.name,
    role: user.role
  };

  setItem(STORAGE_KEYS.CURRENT_USER, sessionUser);
  return sessionUser;
};

export const logout = () => {
  localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
};

export const getCurrentUser = () => {
  return getItem(STORAGE_KEYS.CURRENT_USER);
};

export const getUserByUid = (uid) => {
  const users = getItem(STORAGE_KEYS.USERS) || {};
  return users[uid] || null;
};

// ============ STAFF ============

export const getStaff = () => {
  return getItem(STORAGE_KEYS.STAFF) || [];
};

export const addStaff = (staffData) => {
  const staff = getStaff();
  const newStaff = {
    ...staffData,
    id: 'staff' + Date.now(),
    joinedAt: new Date().toISOString(),
    status: 'active',
    profileImage: null
  };
  staff.push(newStaff);
  setItem(STORAGE_KEYS.STAFF, staff);

  // Also add to users for authentication
  const users = getItem(STORAGE_KEYS.USERS) || {};
  users[newStaff.uid] = {
    uid: newStaff.uid,
    name: newStaff.name,
    email: newStaff.email,
    password: staffData.password || 'password123',
    role: newStaff.role,
    createdAt: new Date().toISOString()
  };
  setItem(STORAGE_KEYS.USERS, users);

  return newStaff;
};

export const updateStaff = (id, data) => {
  const staff = getStaff();
  const index = staff.findIndex(s => s.id === id);
  if (index !== -1) {
    staff[index] = { ...staff[index], ...data };
    setItem(STORAGE_KEYS.STAFF, staff);
    return staff[index];
  }
  return null;
};

export const updateStaffImage = (id, imageDataUrl) => {
  const staff = getStaff();
  const index = staff.findIndex(s => s.id === id);
  if (index !== -1) {
    staff[index].profileImage = imageDataUrl;
    setItem(STORAGE_KEYS.STAFF, staff);
    return staff[index];
  }
  return null;
};

export const removeStaff = (id) => {
  let staff = getStaff();
  const staffMember = staff.find(s => s.id === id);

  staff = staff.filter(s => s.id !== id);
  setItem(STORAGE_KEYS.STAFF, staff);

  // Also remove from users
  if (staffMember && staffMember.uid) {
    const users = getItem(STORAGE_KEYS.USERS) || {};
    delete users[staffMember.uid];
    setItem(STORAGE_KEYS.USERS, users);
  }

  return true;
};

// ============ ATTENDANCE ============

export const getAttendance = () => {
  return getItem(STORAGE_KEYS.ATTENDANCE) || {};
};

export const getAttendanceByDate = (dateStr) => {
  const attendance = getAttendance();
  return attendance[dateStr] || {};
};

export const markAttendance = (dateStr, memberId, data) => {
  const attendance = getAttendance();
  if (!attendance[dateStr]) {
    attendance[dateStr] = {};
  }
  attendance[dateStr][memberId] = data;
  setItem(STORAGE_KEYS.ATTENDANCE, attendance);
  return attendance[dateStr];
};

export const markAllAttendance = (dateStr, memberIds, status) => {
  const attendance = getAttendance();
  if (!attendance[dateStr]) {
    attendance[dateStr] = {};
  }
  memberIds.forEach(id => {
    attendance[dateStr][id] = status;
  });
  setItem(STORAGE_KEYS.ATTENDANCE, attendance);
  return attendance[dateStr];
};

// ============ SETTINGS ============

export const getSettings = () => {
  return getItem(STORAGE_KEYS.SETTINGS) || {
    holidays: [],
    ruleSets: [{ id: 'default', name: 'General Shift', startTime: '09:00', endTime: '18:00', minHalfDay: 4, minFullDay: 8, weeklyOffs: [] }],
    locations: []
  };
};

export const saveSettings = (settings) => {
  setItem(STORAGE_KEYS.SETTINGS, settings);
  return settings;
};

// ============ MISS PUNCH REQUESTS ============

export const getMissPunchRequests = () => {
  return getItem(STORAGE_KEYS.MISS_PUNCH_REQUESTS) || [];
};

export const getMissPunchRequestsByUser = (userId) => {
  const requests = getMissPunchRequests();
  return requests.filter(r => r.userId === userId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

export const getMissPunchRequestsByStatus = (status) => {
  const requests = getMissPunchRequests();
  if (status === 'all') {
    return requests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
  return requests.filter(r => r.status === status).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

export const addMissPunchRequest = (request) => {
  const requests = getMissPunchRequests();
  const newRequest = {
    ...request,
    id: 'mpr' + Date.now(),
    createdAt: new Date().toISOString(),
    status: 'pending',
    approvedBy: null,
    approvedAt: null
  };
  requests.push(newRequest);
  setItem(STORAGE_KEYS.MISS_PUNCH_REQUESTS, requests);
  return newRequest;
};

export const updateMissPunchRequest = (id, data) => {
  const requests = getMissPunchRequests();
  const index = requests.findIndex(r => r.id === id);
  if (index !== -1) {
    requests[index] = { ...requests[index], ...data };
    setItem(STORAGE_KEYS.MISS_PUNCH_REQUESTS, requests);
    return requests[index];
  }
  return null;
};

// ============ LISTENERS (for real-time updates simulation) ============

// Simple pub/sub for simulating Firebase onSnapshot
const listeners = {};

export const subscribe = (key, callback) => {
  if (!listeners[key]) {
    listeners[key] = [];
  }
  listeners[key].push(callback);

  // Return unsubscribe function
  return () => {
    listeners[key] = listeners[key].filter(cb => cb !== callback);
  };
};

export const notify = (key) => {
  if (listeners[key]) {
    listeners[key].forEach(callback => callback());
  }
};

// Wrap setItem to notify listeners
const setItemWithNotify = (key, value) => {
  setItem(key, value);
  notify(key);
};

// Export wrapped versions
export const setStaff = (staff) => setItemWithNotify(STORAGE_KEYS.STAFF, staff);
export const setAttendance = (attendance) => setItemWithNotify(STORAGE_KEYS.ATTENDANCE, attendance);
export const setSettings = (settings) => setItemWithNotify(STORAGE_KEYS.SETTINGS, settings);
export const setMissPunchRequests = (requests) => setItemWithNotify(STORAGE_KEYS.MISS_PUNCH_REQUESTS, requests);

export const KEYS = STORAGE_KEYS;

// ============ EXPORT / IMPORT DATA ============

export const exportAllData = () => {
  const data = {
    users: getItem(STORAGE_KEYS.USERS) || {},
    staff: getItem(STORAGE_KEYS.STAFF) || [],
    attendance: getItem(STORAGE_KEYS.ATTENDANCE) || {},
    settings: getItem(STORAGE_KEYS.SETTINGS) || {},
    missPunchRequests: getItem(STORAGE_KEYS.MISS_PUNCH_REQUESTS) || [],
    exportedAt: new Date().toISOString()
  };
  return data;
};

export const importAllData = (data) => {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid data format');
  }

  // Validate required fields
  if (!data.users || !data.staff) {
    throw new Error('Data must contain users and staff');
  }

  // Import all data
  if (data.users) setItem(STORAGE_KEYS.USERS, data.users);
  if (data.staff) setItem(STORAGE_KEYS.STAFF, data.staff);
  if (data.attendance) setItem(STORAGE_KEYS.ATTENDANCE, data.attendance);
  if (data.settings) setItem(STORAGE_KEYS.SETTINGS, data.settings);
  if (data.missPunchRequests) setItem(STORAGE_KEYS.MISS_PUNCH_REQUESTS, data.missPunchRequests);

  // Mark as initialized
  localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');

  // Notify all listeners
  notify(STORAGE_KEYS.STAFF);
  notify(STORAGE_KEYS.ATTENDANCE);
  notify(STORAGE_KEYS.SETTINGS);

  return true;
};

export const downloadDataAsJson = () => {
  const data = exportAllData();
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `attendify-backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const getDataStats = () => {
  const users = getItem(STORAGE_KEYS.USERS) || {};
  const staff = getItem(STORAGE_KEYS.STAFF) || [];
  const attendance = getItem(STORAGE_KEYS.ATTENDANCE) || {};
  const missPunchRequests = getItem(STORAGE_KEYS.MISS_PUNCH_REQUESTS) || [];

  return {
    totalUsers: Object.keys(users).length,
    totalStaff: staff.length,
    totalAttendanceDays: Object.keys(attendance).length,
    totalMissPunchRequests: missPunchRequests.length
  };
};
