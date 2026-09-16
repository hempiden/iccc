import { VoCRecord, ActionOwner } from '../types';
import { db } from './firebase';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  deleteDoc, 
  writeBatch 
} from 'firebase/firestore';

const LOCAL_STORAGE_KEY = 'dhl_voc_local_survey_records';
const COLLEAGUE_STORAGE_KEY = 'dhl_voc_colleagues_v2';
const SYSTEM_SETTINGS_KEY = 'dhl_system_settings_v1';

export interface SystemLoginSettings {
  sandboxOtpEnabled: boolean;
  allowedCountryCodes?: string[];
  lastUpdatedBy?: string;
  updatedAt?: string;
}

export const DEFAULT_INITIAL_COLLEAGUES: ActionOwner[] = [
  {
    id: 'superadmin-hempiden-1',
    username: 'hempiden.superadmin',
    fullName: 'Hempiden (Superadmin)',
    role: 'superadmin',
    department: 'Management',
    phoneNumber: '+85561999906',
    phoneNumbers: ['+85561999906', '+85561999905', '+855964277775', '+15555555555'],
    email: 'piden.hem@dhl.com',
    facility: 'All',
    status: 'approved',
    avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=Hempiden'
  },
  {
    id: 'colleague-1',
    username: 'rothana.art',
    fullName: 'Rothana Art',
    role: 'HoD',
    department: 'ICCC Team',
    phoneNumber: '+15551111111',
    phoneNumbers: ['+15551111111'],
    facility: 'All',
    status: 'approved',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&fit=crop&q=80'
  },
  {
    id: 'colleague-2',
    username: 'panha.chhun',
    fullName: 'Panha Chhun',
    role: 'Customs Clearance Agent',
    department: 'Clearance Operations',
    phoneNumber: '+85512345678',
    phoneNumbers: ['+85512345678'],
    facility: 'PNHGTW',
    status: 'approved',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&fit=crop&q=80'
  },
  {
    id: 'colleague-3',
    username: 'sreynich.kong',
    fullName: 'Sreynich Kong',
    role: 'Retail Supervisor',
    department: 'Counter Services',
    phoneNumber: '+85587654321',
    phoneNumbers: ['+85587654321'],
    facility: 'PNHGTW',
    status: 'approved',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&fit=crop&q=80'
  },
  {
    id: 'colleague-4',
    username: 'thida.sovann',
    fullName: 'Thida Sovann',
    role: 'Resolution Specialist',
    department: 'Escalations Team',
    phoneNumber: '+85598765432',
    phoneNumbers: ['+85598765432'],
    facility: 'PNHGTW',
    status: 'approved',
    avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&fit=crop&q=80'
  },
  {
    id: 'colleague-5',
    username: 'sok.chea',
    fullName: 'Sok Chea',
    role: 'Facility Agent',
    department: 'Operations',
    phoneNumber: '+15552222222',
    phoneNumbers: ['+15552222222'],
    facility: 'PNHGTW',
    status: 'approved',
    avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=SokChea'
  }
];

/**
 * Normalizes a phone number by stripping spaces, dashes, parentheses,
 * and removing any leading '0' after the '+855' or '855' country code.
 */
export function normalizePhoneNumber(raw: string): string {
  if (!raw) return '';
  let cleaned = raw.replace(/[\s\-\(\)]/g, '');

  if (cleaned.startsWith('+8550')) {
    cleaned = '+855' + cleaned.slice(5);
  } else if (cleaned.startsWith('8550')) {
    cleaned = '+855' + cleaned.slice(4);
  } else if (cleaned.startsWith('0') && !cleaned.startsWith('+') && !cleaned.startsWith('855')) {
    cleaned = '+855' + cleaned.slice(1);
  } else if (cleaned.startsWith('855') && !cleaned.startsWith('+')) {
    cleaned = '+' + cleaned;
  } else if (cleaned && !cleaned.startsWith('+')) {
    cleaned = '+' + cleaned;
  }
  return cleaned;
}

/**
 * Fetches the global login and OTP configuration settings from Firestore and local storage.
 */
export async function fetchSystemLoginSettings(): Promise<SystemLoginSettings> {
  const defaultFallback: SystemLoginSettings = {
    sandboxOtpEnabled: true,
    allowedCountryCodes: ['+855', '+1'],
    lastUpdatedBy: 'Superadmin',
    updatedAt: new Date().toISOString()
  };

  try {
    if (db) {
      const snap = await getDoc(doc(db, 'system_settings', 'auth_settings'));
      if (snap.exists()) {
        const data = snap.data() as SystemLoginSettings;
        localStorage.setItem(SYSTEM_SETTINGS_KEY, JSON.stringify(data));
        localStorage.setItem('dhl_sandbox_otp_enabled', String(data.sandboxOtpEnabled));
        return data;
      }
    }
  } catch (err) {
    console.warn('Falling back to local storage for system settings:', err);
  }

  try {
    const raw = localStorage.getItem(SYSTEM_SETTINGS_KEY);
    if (raw) {
      return JSON.parse(raw) as SystemLoginSettings;
    }
    localStorage.setItem(SYSTEM_SETTINGS_KEY, JSON.stringify(defaultFallback));
    localStorage.setItem('dhl_sandbox_otp_enabled', 'true');
    return defaultFallback;
  } catch (err) {
    console.warn('Using default login settings on local machine:', err);
    return defaultFallback;
  }
}

/**
 * Saves global login and OTP settings to Firestore and local storage.
 */
export async function saveSystemLoginSettings(settings: Partial<SystemLoginSettings>, updatedBy?: string): Promise<void> {
  try {
    const current = await fetchSystemLoginSettings();
    const merged: SystemLoginSettings = {
      ...current,
      ...settings,
      lastUpdatedBy: updatedBy || current.lastUpdatedBy || 'Superadmin',
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(SYSTEM_SETTINGS_KEY, JSON.stringify(merged));
    localStorage.setItem('dhl_sandbox_otp_enabled', String(merged.sandboxOtpEnabled));

    if (db) {
      await setDoc(doc(db, 'system_settings', 'auth_settings'), merged);
    }
  } catch (err) {
    console.error('Error saving login settings:', err);
  }
}

/**
 * Fetches all VoC survey records from Firestore (with localStorage fallback & sync).
 */
export async function fetchVoCRecords(): Promise<VoCRecord[]> {
  try {
    if (db) {
      const snap = await getDocs(collection(db, 'voc_records'));
      if (!snap.empty) {
        const records = snap.docs.map(d => d.data() as VoCRecord);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(records));
        return records;
      }
    }
  } catch (error) {
    console.warn('Error reading voc_records from Firestore, checking local storage:', error);
  }

  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw) as VoCRecord[];
    }
    return [];
  } catch (error) {
    console.error('Error fetching records from local storage:', error);
    return [];
  }
}

/**
 * Saves or updates a single VoC survey record in Firestore and local storage.
 */
export async function saveVoCRecord(record: VoCRecord): Promise<void> {
  try {
    const existing = await fetchVoCRecords();
    const idx = existing.findIndex(r => r.id === record.id);
    if (idx >= 0) {
      existing[idx] = record;
    } else {
      existing.push(record);
    }
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(existing));

    if (db) {
      const cleanRecord = JSON.parse(JSON.stringify(record));
      await setDoc(doc(db, 'voc_records', record.id), cleanRecord);
    }
  } catch (error) {
    console.error(`Error saving record ${record.id}:`, error);
  }
}

/**
 * Saves multiple survey records to Firestore and local storage.
 */
export async function batchSaveVoCRecords(records: VoCRecord[]): Promise<void> {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(records));

    if (db) {
      const batch = writeBatch(db);
      records.forEach(r => {
        const cleanRecord = JSON.parse(JSON.stringify(r));
        batch.set(doc(db, 'voc_records', r.id), cleanRecord);
      });
      await batch.commit();
    }
  } catch (error) {
    console.error('Error saving batch records:', error);
  }
}

/**
 * Appends or merges new survey records with existing ones in Firestore and local storage.
 */
export async function appendVoCRecords(newRecords: VoCRecord[]): Promise<VoCRecord[]> {
  try {
    const existing = await fetchVoCRecords();
    const map = new Map<string, VoCRecord>();
    existing.forEach(r => map.set(r.id, r));
    newRecords.forEach(r => map.set(r.id, r));
    const combined = Array.from(map.values());
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(combined));

    if (db) {
      const batch = writeBatch(db);
      newRecords.forEach(r => {
        const cleanRecord = JSON.parse(JSON.stringify(r));
        batch.set(doc(db, 'voc_records', r.id), cleanRecord);
      });
      await batch.commit();
    }

    return combined;
  } catch (error) {
    console.error('Error appending survey records:', error);
    return newRecords;
  }
}

/**
 * Deletes all VoC survey records from Firestore and local storage.
 */
export async function clearVoCRecords(): Promise<void> {
  try {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    if (db) {
      const snap = await getDocs(collection(db, 'voc_records'));
      const batch = writeBatch(db);
      snap.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
    }
  } catch (error) {
    console.error('Error clearing VoC records:', error);
  }
}

/**
 * Deletes selected VoC survey records from Firestore and local storage.
 */
export async function deleteVoCRecords(ids: string[]): Promise<void> {
  if (!ids || ids.length === 0) return;
  try {
    const existing = await fetchVoCRecords();
    const filtered = existing.filter(r => !ids.includes(r.id));
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));

    if (db) {
      const batch = writeBatch(db);
      ids.forEach(id => {
        batch.delete(doc(db, 'voc_records', id));
      });
      await batch.commit();
    }
  } catch (error) {
    console.error('Error deleting specific VoC records:', error);
  }
}

/**
 * Seeds Firestore and local storage with default sample records if empty.
 */
export async function seedFirestoreIfNeeded(defaultSampleRecords: VoCRecord[]): Promise<VoCRecord[]> {
  try {
    const existing = await fetchVoCRecords();
    if (existing && existing.length > 0) {
      return existing;
    }

    // Seed Firestore
    if (db) {
      const batch = writeBatch(db);
      defaultSampleRecords.forEach(r => {
        const cleanRecord = JSON.parse(JSON.stringify(r));
        batch.set(doc(db, 'voc_records', r.id), cleanRecord);
      });
      await batch.commit();
    }

    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(defaultSampleRecords));
    return defaultSampleRecords;
  } catch (error) {
    console.error('Error seeding survey records:', error);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(defaultSampleRecords));
    return defaultSampleRecords;
  }
}

/**
 * Fetches all colleague profiles from Firestore (with local storage fallback).
 */
export async function fetchColleagues(): Promise<ActionOwner[]> {
  try {
    if (db) {
      const snap = await getDocs(collection(db, 'colleagues'));
      if (!snap.empty) {
        const list = snap.docs.map(d => d.data() as ActionOwner);
        localStorage.setItem(COLLEAGUE_STORAGE_KEY, JSON.stringify(list));
        return list;
      }
    }
  } catch (error) {
    console.warn('Error reading colleagues from Firestore, checking local storage:', error);
  }

  try {
    const raw = localStorage.getItem(COLLEAGUE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as ActionOwner[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
    // Seed initial default colleagues if missing
    localStorage.setItem(COLLEAGUE_STORAGE_KEY, JSON.stringify(DEFAULT_INITIAL_COLLEAGUES));
    return DEFAULT_INITIAL_COLLEAGUES;
  } catch (error) {
    console.error('Error fetching colleagues from local storage:', error);
    return DEFAULT_INITIAL_COLLEAGUES;
  }
}

/**
 * Saves or updates a colleague's role and facility assignment in Firestore and local storage.
 */
export async function saveColleague(colleague: ActionOwner): Promise<void> {
  try {
    const list = await fetchColleagues();
    const idx = list.findIndex(c => c.id === colleague.id || c.username === colleague.username);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...colleague };
    } else {
      list.push(colleague);
    }
    localStorage.setItem(COLLEAGUE_STORAGE_KEY, JSON.stringify(list));

    if (db) {
      const cleanColleague = JSON.parse(JSON.stringify(colleague));
      await setDoc(doc(db, 'colleagues', colleague.id), cleanColleague);
    }
  } catch (error) {
    console.error(`Error saving colleague ${colleague.id}:`, error);
    throw error;
  }
}

/**
 * Searches for a colleague profile matching a given phone number.
 */
export async function findColleagueByPhoneNumber(phoneNumber: string): Promise<ActionOwner | null> {
  try {
    const cleanPhone = normalizePhoneNumber(phoneNumber);
    const colleagues = await fetchColleagues();
    const existing = colleagues.find(c => {
      const matchPrimary = normalizePhoneNumber(c.phoneNumber || '') === cleanPhone;
      const matchArray = c.phoneNumbers?.some(p => normalizePhoneNumber(p) === cleanPhone);
      return matchPrimary || matchArray;
    });
    return existing || null;
  } catch (error) {
    console.error('Error finding colleague by phone:', error);
    return null;
  }
}

/**
 * Resolves or registers a colleague by phone number.
 */
export async function resolveColleagueProfile(phoneNumber: string, fullName: string, selectedFacility?: string): Promise<ActionOwner> {
  try {
    const cleanPhone = normalizePhoneNumber(phoneNumber);
    const allColleagues = await fetchColleagues();

    const existing = allColleagues.find(c => {
      const matchPrimary = normalizePhoneNumber(c.phoneNumber || '') === cleanPhone;
      const matchArray = c.phoneNumbers?.some(p => normalizePhoneNumber(p) === cleanPhone);
      return matchPrimary || matchArray;
    });
    if (existing) {
      return existing;
    }

    let role = 'Facility Agent';
    let facility = selectedFacility || 'PNHGTW';
    let department = 'Operations';
    let status: 'approved' | 'pending' = 'approved';

    const nameLower = fullName.toLowerCase();
    if (allColleagues.length === 0 || nameLower.includes('superadmin') || nameLower.includes('hempiden')) {
      role = 'superadmin';
      facility = 'All';
      department = 'Management';
      status = 'approved';
    }

    const username = fullName.toLowerCase().replace(/\s+/g, '.');
    const newColleague: ActionOwner = {
      id: username + '-' + Math.floor(Math.random() * 1000),
      username,
      fullName,
      role,
      department,
      phoneNumber: cleanPhone,
      phoneNumbers: [cleanPhone],
      facility,
      status,
      avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName)}`
    };

    await saveColleague(newColleague);
    return newColleague;
  } catch (error) {
    console.error('Error resolving colleague profile:', error);
    return {
      id: 'fallback-' + Date.now(),
      username: fullName.toLowerCase().replace(/\s+/g, '.'),
      fullName,
      role: fullName.toLowerCase().includes('superadmin') ? 'superadmin' : 'Facility Agent',
      department: 'Operations',
      facility: selectedFacility || 'PNHGTW',
      status: 'approved',
      phoneNumber: normalizePhoneNumber(phoneNumber),
      phoneNumbers: [normalizePhoneNumber(phoneNumber)],
      avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName)}`
    };
  }
}

/**
 * Clears ALL application and database data, leaving ONLY clean make up sample data in Firestore and this system.
 */
export async function resetAllDataToSampleData(sampleRecords: VoCRecord[]): Promise<{ vocCount: number; colleagueCount: number }> {
  console.log('--- RESETTING ALL DATA TO CLEAN SAMPLE DATA ---');

  // 1. Reset Firestore
  if (db) {
    try {
      // Clear old voc_records
      const vSnap = await getDocs(collection(db, 'voc_records'));
      const sampleIds = new Set(sampleRecords.map(r => r.id));
      const vBatch = writeBatch(db);
      vSnap.docs.forEach(d => {
        if (!sampleIds.has(d.id)) {
          vBatch.delete(d.ref);
        }
      });
      // Seed sample VoC records
      sampleRecords.forEach(r => {
        const cleanRecord = JSON.parse(JSON.stringify(r));
        vBatch.set(doc(db, 'voc_records', r.id), cleanRecord);
      });
      await vBatch.commit();

      // Clear & Seed Colleagues
      const cSnap = await getDocs(collection(db, 'colleagues'));
      const sampleCIds = new Set(DEFAULT_INITIAL_COLLEAGUES.map(c => c.id));
      const cBatch = writeBatch(db);
      cSnap.docs.forEach(d => {
        if (!sampleCIds.has(d.id)) {
          cBatch.delete(d.ref);
        }
      });
      DEFAULT_INITIAL_COLLEAGUES.forEach(c => {
        const cleanColleague = JSON.parse(JSON.stringify(c));
        cBatch.set(doc(db, 'colleagues', c.id), cleanColleague);
      });
      await cBatch.commit();

      // System Settings
      await setDoc(doc(db, 'system_settings', 'auth_settings'), {
        sandboxOtpEnabled: true,
        allowedCountryCodes: ['+855', '+1'],
        lastUpdatedBy: 'Superadmin',
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.error('Error resetting Firestore data:', err);
    }
  }

  // 2. Reset Local Storage in this system
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sampleRecords));
    localStorage.setItem(COLLEAGUE_STORAGE_KEY, JSON.stringify(DEFAULT_INITIAL_COLLEAGUES));
    localStorage.setItem(SYSTEM_SETTINGS_KEY, JSON.stringify({
      sandboxOtpEnabled: true,
      allowedCountryCodes: ['+855', '+1'],
      lastUpdatedBy: 'Superadmin',
      updatedAt: new Date().toISOString()
    }));
    localStorage.setItem('dhl_sandbox_otp_enabled', 'true');
    // Clear any temporary import or upload caches
    localStorage.removeItem('dhl_voc_topic_sentiment_records');
    localStorage.removeItem('dhl_voc_read_notifications');
    localStorage.removeItem('dhl_excel_db_cache');
    localStorage.removeItem('dhl_active_user_session');
  } catch (err) {
    console.error('Error resetting localStorage:', err);
  }

  return {
    vocCount: sampleRecords.length,
    colleagueCount: DEFAULT_INITIAL_COLLEAGUES.length
  };
}

