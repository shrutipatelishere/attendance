import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types/User';
import { loadUsers, loadUsersAsync } from '../utils/storage';

interface UserContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  users: User[];
  refreshUsers: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUsers = async () => {
    setIsLoading(true);
    try {
      const loadedUsers = await loadUsersAsync();
      setUsers(loadedUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      // Fallback to sync load
      const loadedUsers = loadUsers();
      setUsers(loadedUsers);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const initializeUsers = async () => {
      setIsLoading(true);
      try {
        const loadedUsers = await loadUsersAsync();
        setUsers(loadedUsers);

        // Try to restore current user from localStorage
        const savedUserId = localStorage.getItem('crm_current_user');
        if (savedUserId) {
          const user = loadedUsers.find(u => u.id === savedUserId);
          if (user) {
            setCurrentUser(user);
          }
        }
      } catch (error) {
        console.error('Error initializing users:', error);
        // Fallback to sync load
        const loadedUsers = loadUsers();
        setUsers(loadedUsers);

        const savedUserId = localStorage.getItem('crm_current_user');
        if (savedUserId) {
          const user = loadedUsers.find(u => u.id === savedUserId);
          if (user) {
            setCurrentUser(user);
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    initializeUsers();
  }, []);

  const handleSetCurrentUser = (user: User | null) => {
    setCurrentUser(user);
    if (user) {
      localStorage.setItem('crm_current_user', user.id);
    } else {
      localStorage.removeItem('crm_current_user');
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('crm_current_user');
  };

  const isAuthenticated = currentUser !== null;

  return (
    <UserContext.Provider value={{
      currentUser,
      setCurrentUser: handleSetCurrentUser,
      users,
      refreshUsers,
      isLoading,
      isAuthenticated,
      logout
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

// Helper functions
export const canAssignTo = (fromUser: User, toUser: User): boolean => {
  // Caller can assign to their manager
  if (fromUser.role === 'caller' && toUser.role === 'manager' && fromUser.reportingTo === toUser.id) {
    return true;
  }
  // Manager can assign to their TL
  if (fromUser.role === 'manager' && toUser.role === 'team_leader' && fromUser.reportingTo === toUser.id) {
    return true;
  }
  // TL can assign to any manager under them
  if (fromUser.role === 'team_leader' && toUser.role === 'manager' && toUser.reportingTo === fromUser.id) {
    return true;
  }
  // Manager can assign to any caller under them
  if (fromUser.role === 'manager' && toUser.role === 'caller' && toUser.reportingTo === fromUser.id) {
    return true;
  }
  return false;
};

export const getAssignableUsers = (currentUser: User, allUsers: User[]): User[] => {
  if (!currentUser) return [];

  switch (currentUser.role) {
    case 'caller':
      // Caller can only assign to their manager
      return allUsers.filter(u => u.id === currentUser.reportingTo);
    case 'manager':
      // Manager can assign to their TL or to callers under them
      return allUsers.filter(u =>
        (u.id === currentUser.reportingTo) || // Their TL
        (u.role === 'caller' && u.reportingTo === currentUser.id) // Callers under them
      );
    case 'team_leader':
      // TL can assign to any manager or caller under their team
      const managersUnderTL = allUsers.filter(u => u.role === 'manager' && u.reportingTo === currentUser.id);
      const managerIds = managersUnderTL.map(m => m.id);
      const callersUnderManagers = allUsers.filter(u => u.role === 'caller' && managerIds.includes(u.reportingTo || ''));
      return [...managersUnderTL, ...callersUnderManagers];
    case 'admin':
      // Admin can assign to anyone
      return allUsers.filter(u => u.id !== currentUser.id);
    default:
      return [];
  }
};

export const canViewLead = (user: User, lead: any, allUsers: User[]): boolean => {
  if (!user) return false;

  // If user is in the team thread, they can view
  if (lead.teamThread?.includes(user.id)) return true;

  // If user created the lead
  if (lead.createdBy === user.id) return true;

  // If lead is assigned to the user
  if (lead.assignedTo === user.id) return true;

  // Managers can see all leads of their callers
  if (user.role === 'manager') {
    const callersUnderManager = allUsers.filter(u => u.reportingTo === user.id).map(u => u.id);
    if (lead.createdBy && callersUnderManager.includes(lead.createdBy)) return true;
    if (lead.assignedTo && callersUnderManager.includes(lead.assignedTo)) return true;
    if (lead.teamThread?.some((id: string) => callersUnderManager.includes(id))) return true;
  }

  // TL can see all leads of their managers and callers
  if (user.role === 'team_leader') {
    const managersUnderTL = allUsers.filter(u => u.role === 'manager' && u.reportingTo === user.id).map(u => u.id);
    const callersUnderManagers = allUsers.filter(u => u.role === 'caller' && managersUnderTL.includes(u.reportingTo || '')).map(u => u.id);
    const teamMemberIds = [...managersUnderTL, ...callersUnderManagers];

    if (lead.createdBy && teamMemberIds.includes(lead.createdBy)) return true;
    if (lead.assignedTo && teamMemberIds.includes(lead.assignedTo)) return true;
    if (lead.teamThread?.some((id: string) => teamMemberIds.includes(id))) return true;
  }

  // Admin can see all
  if (user.role === 'admin') return true;

  return false;
};
