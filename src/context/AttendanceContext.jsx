import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  getStaff,
  getAttendance,
  getSettings,
  addStaff as localAddStaff,
  updateStaff as localUpdateStaff,
  removeStaff as localRemoveStaff,
  updateStaffImage as localUpdateStaffImage,
  markAttendance as localMarkAttendance,
  markAllAttendance as localMarkAllAttendance,
  saveSettings as localSaveSettings,
  subscribe,
  KEYS
} from '../localStore';
import { format, parse, differenceInMinutes } from 'date-fns';

const AttendanceContext = createContext();

export const useAttendance = () => useContext(AttendanceContext);

export const AttendanceProvider = ({ children }) => {
  const [members, setMembers] = useState([]);
  const [records, setRecords] = useState({});
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({ ruleSets: [], locations: [], holidays: [] });

  // Load initial data
  const loadData = useCallback(() => {
    const staffList = getStaff();
    const attendanceRecords = getAttendance();
    const settingsData = getSettings();

    setMembers(staffList);
    setRecords(attendanceRecords);
    setSettings({
      ruleSets: settingsData.ruleSets || [{ id: 'default', name: 'General Shift', minHalfDay: 4, minFullDay: 8 }],
      locations: settingsData.locations || [],
      holidays: settingsData.holidays || []
    });
    setLoading(false);
  }, []);

  // Initial load
  useEffect(() => {
    loadData();

    // Subscribe to changes for real-time updates (simulated)
    const unsubStaff = subscribe(KEYS.STAFF, () => {
      setMembers(getStaff());
    });
    const unsubAttendance = subscribe(KEYS.ATTENDANCE, () => {
      setRecords(getAttendance());
    });
    const unsubSettings = subscribe(KEYS.SETTINGS, () => {
      const settingsData = getSettings();
      setSettings({
        ruleSets: settingsData.ruleSets || [{ id: 'default', name: 'General Shift', minHalfDay: 4, minFullDay: 8 }],
        locations: settingsData.locations || [],
        holidays: settingsData.holidays || []
      });
    });

    return () => {
      unsubStaff();
      unsubAttendance();
      unsubSettings();
    };
  }, [loadData]);

  // Actions
  const addMember = async (name, email = "", role = "Employee", uid = null, additionalDetails = {}) => {
    const {
      salary = '',
      phone = '',
      address = '',
      bankDetails = {},
      ruleSetId = null,
      attendanceLocationId = null,
      attendanceLocation = null,
      password = 'password123'
    } = additionalDetails;

    const newStaff = localAddStaff({
      name,
      email,
      role,
      uid: uid || 'emp' + Date.now(),
      salary,
      phone,
      address,
      bankDetails,
      ruleSetId,
      attendanceLocationId,
      attendanceLocation,
      password
    });

    // Refresh members
    setMembers(getStaff());
    return newStaff;
  };

  const updateMember = async (id, data) => {
    localUpdateStaff(id, data);
    setMembers(getStaff());
  };

  const updateMemberImage = async (id, imageDataUrl) => {
    localUpdateStaffImage(id, imageDataUrl);
    setMembers(getStaff());
  };

  const removeMember = async (id) => {
    localRemoveStaff(id);
    setMembers(getStaff());
  };

  const resetAttendance = async (dateStr, memberId) => {
    localMarkAttendance(dateStr, memberId, 'absent');
    setRecords(getAttendance());
  };

  const markAttendance = async (dateStr, memberId, data) => {
    localMarkAttendance(dateStr, memberId, data);
    setRecords(getAttendance());
  };

  const markAll = async (dateStr, status) => {
    const memberIds = members.map(m => m.uid || m.id);
    localMarkAllAttendance(dateStr, memberIds, status);
    setRecords(getAttendance());
  };

  const getDayStatus = (dateStr) => {
    return records[dateStr] || {};
  };

  const getStats = (dateStr) => {
    const dayRecords = records[dateStr] || {};
    let present = 0, absent = 0, late = 0;

    members.forEach(m => {
      const lookupId = m.uid || m.id;
      let raw = dayRecords[lookupId];
      let status = typeof raw === 'object' ? raw.status : raw;

      if (status === 'present') present++;
      if (status === 'absent') absent++;
      if (status === 'late') late++;
    });

    return {
      total: members.length,
      present,
      absent,
      late,
      unmarked: members.length - (present + absent + late)
    };
  };

  // SHARED: Strict Status Calculation
  const calculateDetailedStatus = (raw, ruleSetId) => {
    if (!raw) return { status: '', label: 'Unmarked', color: 'var(--text-secondary)' };

    let statusKey = typeof raw === 'object' ? raw.status : raw;
    let punchIn = typeof raw === 'object' ? raw.punchIn : null;
    let punchOut = typeof raw === 'object' ? raw.punchOut : null;

    if (statusKey === 'absent') return { status: 'absent', label: 'Absent', color: 'var(--color-absent)' };
    if (statusKey === 'late') return { status: 'late', label: 'Late', color: 'var(--color-late)' };

    if ((statusKey === 'present' || statusKey === 'late') && punchIn) {
      // Find Rule
      const ruleSets = settings?.ruleSets || [];
      const rule = ruleSets.find(r => r.id === ruleSetId) || ruleSets.find(r => r.id === 'default') || { minHalfDay: 4, minFullDay: 8 };

      if (punchOut) {
        try {
          const today = new Date();
          const pIn = parse(punchIn, 'HH:mm:ss', today);
          const pOut = parse(punchOut, 'HH:mm:ss', today);
          const diffMinutes = differenceInMinutes(pOut, pIn);
          const diffHours = diffMinutes / 60;

          if (diffHours >= rule.minFullDay) {
            return { status: 'present', label: 'Full Day', color: 'var(--color-present)', duration: diffHours };
          } else if (diffHours >= rule.minHalfDay) {
            return { status: 'halfday', label: 'Half Day', color: 'orange', duration: diffHours };
          } else {
            return { status: 'short', label: 'Short (Absent)', color: 'var(--color-absent)', duration: diffHours };
          }
        } catch (e) {
          return { status: 'error', label: 'Error', color: 'gray' };
        }
      } else {
        return { status: 'working', label: 'Present (On-Site)', color: 'var(--color-present)' };
      }
    }

    if (statusKey === 'present') return { status: 'present', label: 'Present', color: 'var(--color-present)' };

    return { status: '', label: 'Unmarked', color: 'var(--text-secondary)' };
  };

  // Helper to find member by UID
  const getMemberByUid = (uid) => {
    return members.find(m => m.uid === uid);
  };

  // Save settings
  const updateSettings = async (newSettings) => {
    localSaveSettings(newSettings);
    setSettings({
      ruleSets: newSettings.ruleSets || [],
      locations: newSettings.locations || [],
      holidays: newSettings.holidays || []
    });
  };

  return (
    <AttendanceContext.Provider value={{
      members,
      addMember,
      updateMember,
      updateMemberImage,
      removeMember,
      records,
      markAttendance,
      resetAttendance,
      getDayStatus,
      getStats,
      markAll,
      settings,
      updateSettings,
      calculateDetailedStatus,
      getMemberByUid,
      loading
    }}>
      {children}
    </AttendanceContext.Provider>
  );
};
