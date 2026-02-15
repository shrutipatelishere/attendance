import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  fsAddStaff, fsUpdateStaff, fsRemoveStaff, fsUpdateStaffImage,
  fsMarkAttendance, fsMarkAllAttendance, fsSaveSettings,
  subscribeStaff, subscribeAttendance, subscribeSettings
} from '../firestoreService';
import { parse, differenceInMinutes } from 'date-fns';

const AttendanceContext = createContext();

export const useAttendance = () => useContext(AttendanceContext);

export const AttendanceProvider = ({ children }) => {
  const [members, setMembers] = useState([]);
  const [records, setRecords] = useState({});
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({ ruleSets: [], locations: [], holidays: [] });

  // Real-time Firestore listeners
  useEffect(() => {
    let initialLoads = 3;
    const markReady = () => { if (--initialLoads <= 0) setLoading(false); };

    const unsubStaff = subscribeStaff((list) => {
      setMembers(list);
      markReady();
    });

    const unsubAttendance = subscribeAttendance((recs) => {
      setRecords(recs);
      markReady();
    });

    const unsubSettings = subscribeSettings((data) => {
      setSettings({
        ruleSets: data.ruleSets || [{ id: 'default', name: 'General Shift', minHalfDay: 4, minFullDay: 8 }],
        locations: data.locations || [],
        holidays: data.holidays || []
      });
      markReady();
    });

    return () => {
      unsubStaff();
      unsubAttendance();
      unsubSettings();
    };
  }, []);

  // Actions — write to Firestore; onSnapshot callbacks update state automatically
  const addMember = async (name, email = "", role = "Employee", uid = null, additionalDetails = {}) => {
    const {
      salary = '',
      phone = '',
      address = '',
      bankDetails = {},
      ruleSetId = null,
      attendanceLocationId = null,
      attendanceLocation = null,
    } = additionalDetails;

    return await fsAddStaff({
      name, email, role,
      uid: uid || 'emp' + Date.now(),
      salary, phone, address, bankDetails,
      ruleSetId, attendanceLocationId, attendanceLocation
    });
  };

  const updateMember = async (id, data) => {
    await fsUpdateStaff(id, data);
  };

  const updateMemberImage = async (id, imageDataUrl) => {
    await fsUpdateStaffImage(id, imageDataUrl);
  };

  const removeMember = async (id) => {
    await fsRemoveStaff(id);
  };

  const resetAttendance = async (dateStr, memberId) => {
    await fsMarkAttendance(dateStr, memberId, 'absent');
  };

  const markAttendance = async (dateStr, memberId, data) => {
    await fsMarkAttendance(dateStr, memberId, data);
  };

  const markAll = async (dateStr, status) => {
    const memberIds = members.map(m => m.uid || m.id);
    await fsMarkAllAttendance(dateStr, memberIds, status);
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

  const calculateDetailedStatus = (raw, ruleSetId) => {
    if (!raw) return { status: '', label: 'Unmarked', color: 'var(--text-secondary)' };

    let statusKey = typeof raw === 'object' ? raw.status : raw;
    let punchIn = typeof raw === 'object' ? raw.punchIn : null;
    let punchOut = typeof raw === 'object' ? raw.punchOut : null;

    if (statusKey === 'absent') return { status: 'absent', label: 'Absent', color: 'var(--color-absent)' };
    if (statusKey === 'late') return { status: 'late', label: 'Late', color: 'var(--color-late)' };

    if ((statusKey === 'present' || statusKey === 'late') && punchIn) {
      const ruleSets = settings?.ruleSets || [];
      const rule = ruleSets.find(r => r.id === ruleSetId) || ruleSets.find(r => r.id === 'default') || { minHalfDay: 4, minFullDay: 8 };

      if (punchOut) {
        try {
          const today = new Date();
          const pIn = parse(punchIn, 'HH:mm:ss', today);
          const pOut = parse(punchOut, 'HH:mm:ss', today);
          const diffMins = differenceInMinutes(pOut, pIn);
          const diffHours = diffMins / 60;

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

  const getMemberByUid = (uid) => {
    return members.find(m => m.uid === uid);
  };

  const updateSettings = async (newSettings) => {
    await fsSaveSettings(newSettings);
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
