import { db, auth, secondaryAuth } from './firebase';
import {
  collection, doc, getDocs, getDoc, setDoc, addDoc, updateDoc, deleteDoc,
  onSnapshot, query, where, orderBy
} from 'firebase/firestore';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updatePassword, signOut, sendPasswordResetEmail } from 'firebase/auth';

// ─── Staff ───────────────────────────────────────────────

export async function fsGetStaff() {
  const snap = await getDocs(collection(db, 'staff'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function fsAddStaff(data) {
  const staffRef = await addDoc(collection(db, 'staff'), {
    ...data,
    joinedAt: new Date().toISOString(),
    status: 'active',
    profileImage: null
  });

  // Also create a user doc so auth role lookup works
  if (data.uid) {
    await setDoc(doc(db, 'users', data.uid), {
      email: data.email,
      name: data.name,
      role: data.role || 'Employee',
      createdAt: new Date().toISOString()
    }, { merge: true });
  }

  return { id: staffRef.id, ...data, joinedAt: new Date().toISOString(), status: 'active', profileImage: null };
}

export async function fsUpdateStaff(id, data) {
  await updateDoc(doc(db, 'staff', id), data);
}

export async function fsUpdateStaffImage(id, imageDataUrl) {
  await updateDoc(doc(db, 'staff', id), { profileImage: imageDataUrl });
}

export async function fsRemoveStaff(id) {
  await deleteDoc(doc(db, 'staff', id));
}

// ─── Auth User Management ────────────────────────────────

export async function fsCreateAuthUser(email, password) {
  // Use secondary app so admin stays logged in
  const cred = await createUserWithEmailAndPassword(secondaryAuth, email, password);
  await signOut(secondaryAuth);
  return cred.user.uid;
}

export async function fsChangeUserPassword(email, currentPassword, newPassword) {
  // Sign in as the user on secondary auth, update password, sign out
  const cred = await signInWithEmailAndPassword(secondaryAuth, email, currentPassword);
  await updatePassword(cred.user, newPassword);
  await signOut(secondaryAuth);
}

export async function fsSendPasswordReset(email) {
  await sendPasswordResetEmail(auth, email);
}

// ─── Staff listener ──────────────────────────────────────

export function subscribeStaff(callback) {
  return onSnapshot(collection(db, 'staff'), (snap) => {
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(list);
  });
}

// ─── Attendance ──────────────────────────────────────────

export async function fsMarkAttendance(dateStr, memberId, data) {
  const ref = doc(db, 'attendance', dateStr);
  const snap = await getDoc(ref);
  const existing = snap.exists() ? snap.data() : {};
  existing[memberId] = data;
  await setDoc(ref, existing);
}

export async function fsMarkAllAttendance(dateStr, memberIds, status) {
  const ref = doc(db, 'attendance', dateStr);
  const snap = await getDoc(ref);
  const existing = snap.exists() ? snap.data() : {};
  memberIds.forEach(id => { existing[id] = status; });
  await setDoc(ref, existing);
}

// ─── Attendance listener ─────────────────────────────────

export function subscribeAttendance(callback) {
  return onSnapshot(collection(db, 'attendance'), (snap) => {
    const records = {};
    snap.docs.forEach(d => { records[d.id] = d.data(); });
    callback(records);
  });
}

// ─── Settings ────────────────────────────────────────────

const SETTINGS_DOC = doc(db, 'settings', 'config');

export async function fsGetSettings() {
  const snap = await getDoc(SETTINGS_DOC);
  if (snap.exists()) return snap.data();
  return { ruleSets: [{ id: 'default', name: 'General Shift', minHalfDay: 4, minFullDay: 8 }], locations: [], holidays: [] };
}

export async function fsSaveSettings(settings) {
  await setDoc(SETTINGS_DOC, settings);
}

export function subscribeSettings(callback) {
  return onSnapshot(SETTINGS_DOC, (snap) => {
    if (snap.exists()) {
      callback(snap.data());
    } else {
      callback({ ruleSets: [{ id: 'default', name: 'General Shift', minHalfDay: 4, minFullDay: 8 }], locations: [], holidays: [] });
    }
  });
}

// ─── Miss Punch Requests ─────────────────────────────────

export async function fsGetMissPunchRequestsByUser(userId) {
  const q = query(collection(db, 'missPunchRequests'), where('userId', '==', userId), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function fsGetMissPunchRequestsByStatus(status) {
  let q;
  if (status === 'all') {
    q = query(collection(db, 'missPunchRequests'), orderBy('createdAt', 'desc'));
  } else {
    q = query(collection(db, 'missPunchRequests'), where('status', '==', status), orderBy('createdAt', 'desc'));
  }
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function fsAddMissPunchRequest(request) {
  const newReq = {
    ...request,
    createdAt: new Date().toISOString(),
    status: 'pending',
    approvedBy: null,
    approvedAt: null
  };
  const ref = await addDoc(collection(db, 'missPunchRequests'), newReq);
  return { id: ref.id, ...newReq };
}

export async function fsUpdateMissPunchRequest(id, data) {
  await updateDoc(doc(db, 'missPunchRequests', id), data);
}

// ─── Data Management ─────────────────────────────────────

export async function fsExportAllData() {
  const [staffSnap, attSnap, settSnap, mpSnap] = await Promise.all([
    getDocs(collection(db, 'staff')),
    getDocs(collection(db, 'attendance')),
    getDoc(SETTINGS_DOC),
    getDocs(collection(db, 'missPunchRequests'))
  ]);

  const staff = staffSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const attendance = {};
  attSnap.docs.forEach(d => { attendance[d.id] = d.data(); });
  const settings = settSnap.exists() ? settSnap.data() : {};
  const missPunchRequests = mpSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  return { staff, attendance, settings, missPunchRequests, exportedAt: new Date().toISOString() };
}

export async function fsImportAllData(data) {
  if (!data.staff) throw new Error('Invalid data: missing staff');

  // Import staff
  for (const s of data.staff) {
    const { id, ...rest } = s;
    if (id) {
      await setDoc(doc(db, 'staff', id), rest);
    } else {
      await addDoc(collection(db, 'staff'), rest);
    }
  }

  // Import attendance
  if (data.attendance) {
    for (const [dateStr, dayData] of Object.entries(data.attendance)) {
      await setDoc(doc(db, 'attendance', dateStr), dayData);
    }
  }

  // Import settings
  if (data.settings) {
    await setDoc(SETTINGS_DOC, data.settings);
  }

  // Import miss punch requests
  if (data.missPunchRequests) {
    for (const req of data.missPunchRequests) {
      const { id, ...rest } = req;
      if (id) {
        await setDoc(doc(db, 'missPunchRequests', id), rest);
      } else {
        await addDoc(collection(db, 'missPunchRequests'), rest);
      }
    }
  }

  return true;
}

export async function fsGetDataStats() {
  const [staffSnap, attSnap, mpSnap] = await Promise.all([
    getDocs(collection(db, 'staff')),
    getDocs(collection(db, 'attendance')),
    getDocs(collection(db, 'missPunchRequests'))
  ]);

  return {
    totalStaff: staffSnap.size,
    totalAttendanceDays: attSnap.size,
    totalMissPunchRequests: mpSnap.size
  };
}

export async function fsDownloadDataAsJson() {
  const data = await fsExportAllData();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `presenz-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
