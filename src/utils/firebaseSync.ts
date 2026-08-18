import { db } from './firebase';
import { collection, getDocs, getDoc, doc, setDoc, writeBatch, query, where, limit } from 'firebase/firestore';
import { VoCRecord, ActionOwner } from '../types';

const COLLECTION_NAME = 'voc_records';
const COLLEAGUE_COLLECTION = 'colleagues';
const SYSTEM_SETTINGS_COLLECTION = 'system_settings';
const AUTH_SETTINGS_DOC = 'auth_settings';

export interface SystemLoginSettings {
  sandboxOtpEnabled: boolean;
  allowedCountryCodes?: string[];
  lastUpdatedBy?: string;
  updatedAt?: string;
}

/**
 * Fetches the global login and OTP configuration settings from Firestore.
 * Falls back to local storage cache if offline.
 */
export async function fetchSystemLoginSettings(): Promise<SystemLoginSettings> {
  const localVal = localStorage.getItem('dhl_sandbox_otp_enabled');
  const defaultFallback: SystemLoginSettings = {
    sandboxOtpEnabled: localVal !== null ? localVal === 'true' : true,
    updatedAt: new Date().toISOString()
  };

  try {
    const docRef = doc(db, SYSTEM_SETTINGS_COLLECTION, AUTH_SETTINGS_DOC);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as SystemLoginSettings;
      // Synchronize local cache
      localStorage.setItem('dhl_sandbox_otp_enabled', String(data.sandboxOtpEnabled));
      return data;
    } else {
      // Initialize external document
      await setDoc(docRef, sanitizeForFirestore(defaultFallback));
      return defaultFallback;
    }
  } catch (err) {
    console.warn('Using local fallback for login settings:', err);
    return defaultFallback;
  }
}

/**
 * Saves global login and OTP settings externally to Cloud Firestore.
 */
export async function saveSystemLoginSettings(settings: Partial<SystemLoginSettings>, updatedBy?: string): Promise<void> {
  const currentLocal = localStorage.getItem('dhl_sandbox_otp_enabled');
  const merged: SystemLoginSettings = {
    sandboxOtpEnabled: settings.sandboxOtpEnabled !== undefined ? settings.sandboxOtpEnabled : (currentLocal !== null ? currentLocal === 'true' : true),
    allowedCountryCodes: settings.allowedCountryCodes || ['+855', '+1'],
    lastUpdatedBy: updatedBy || 'Superadmin',
    updatedAt: new Date().toISOString()
  };

  // Immediate local cache update
  localStorage.setItem('dhl_sandbox_otp_enabled', String(merged.sandboxOtpEnabled));

  try {
    const docRef = doc(db, SYSTEM_SETTINGS_COLLECTION, AUTH_SETTINGS_DOC);
    await setDoc(docRef, sanitizeForFirestore(merged));
  } catch (err) {
    console.error('Error saving login settings to Firestore:', err);
  }
}


/**
 * Strips all keys with undefined values from an object, recursively,
 * to prevent Firestore "Unsupported field value: undefined" errors.
 */
function sanitizeForFirestore<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeForFirestore(item)) as unknown as T;
  }
  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const val = obj[key];
        if (val !== undefined) {
          cleaned[key] = sanitizeForFirestore(val);
        }
      }
    }
    return cleaned as T;
  }
  return obj;
}

/**
 * Normalizes a phone number by stripping spaces, dashes, parentheses,
 * and removing any leading '0' after the '+855' or '855' country code.
 * e.g. +855061999905 -> +85561999905, +855 061 999 905 -> +85561999905, 061999905 -> +85561999905
 */
export function normalizePhoneNumber(raw: string): string {
  if (!raw) return '';
  // Remove all spaces, dashes, and parentheses
  let cleaned = raw.replace(/[\s\-\(\)]/g, '');

  // If it starts with '+8550', remove the '0' immediately after country code
  if (cleaned.startsWith('+8550')) {
    cleaned = '+855' + cleaned.slice(5);
  }
  // If it starts with '8550' (no plus), convert to '+855' and strip the '0'
  else if (cleaned.startsWith('8550')) {
    cleaned = '+855' + cleaned.slice(4);
  }
  // If it starts with '0', assume it is local format and convert to '+855'
  else if (cleaned.startsWith('0') && !cleaned.startsWith('+') && !cleaned.startsWith('855')) {
    cleaned = '+855' + cleaned.slice(1);
  }
  // If it starts with '855' but doesn't have '+', prepends '+'
  else if (cleaned.startsWith('855') && !cleaned.startsWith('+')) {
    cleaned = '+' + cleaned;
  }
  // If it does not start with '+', add '+' if it contains digits
  else if (cleaned && !cleaned.startsWith('+')) {
    cleaned = '+' + cleaned;
  }
  return cleaned;
}

const LOCAL_STORAGE_KEY = 'dhl_voc_local_survey_records';

/**
 * Fetches all VoC survey records from local storage.
 * Customer survey records are strictly kept client-side and not sent to Firestore.
 */
export async function fetchVoCRecords(): Promise<VoCRecord[]> {
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
 * Saves or updates a single VoC survey record in local storage.
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
  } catch (error) {
    console.error(`Error saving record ${record.id} locally:`, error);
  }
}

/**
 * Saves multiple survey records to local storage (replaces existing list).
 */
export async function batchSaveVoCRecords(records: VoCRecord[]): Promise<void> {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(records));
  } catch (error) {
    console.error('Error saving batch records to local storage:', error);
  }
}

/**
 * Appends or merges new survey records with existing ones in local storage without losing prior data.
 */
export async function appendVoCRecords(newRecords: VoCRecord[]): Promise<VoCRecord[]> {
  try {
    const existing = await fetchVoCRecords();
    const map = new Map<string, VoCRecord>();
    // Index existing records
    existing.forEach(r => map.set(r.id, r));
    // Merge or append new records
    newRecords.forEach(r => map.set(r.id, r));
    const combined = Array.from(map.values());
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(combined));
    return combined;
  } catch (error) {
    console.error('Error appending survey records to local storage:', error);
    return newRecords;
  }
}


/**
 * Deletes all VoC survey records from local storage.
 */
export async function clearVoCRecords(): Promise<void> {
  try {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing VoC records in local storage:', error);
  }
}

/**
 * Deletes selected VoC survey records from local storage.
 */
export async function deleteVoCRecords(ids: string[]): Promise<void> {
  if (!ids || ids.length === 0) return;
  try {
    const existing = await fetchVoCRecords();
    const filtered = existing.filter(r => !ids.includes(r.id));
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting specific VoC records in local storage:', error);
  }
}

/**
 * Seeds local storage with default sample records if empty.
 * Returns the current set of records. Customer survey data is strictly isolated from Firestore.
 */
export async function seedFirestoreIfNeeded(defaultSampleRecords: VoCRecord[]): Promise<VoCRecord[]> {
  try {
    const existing = await fetchVoCRecords();
    if (existing.length > 0) {
      return existing;
    }
    
    // Seed local storage
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(defaultSampleRecords));
    return defaultSampleRecords;
  } catch (error) {
    console.error('Error seeding local survey records:', error);
    return defaultSampleRecords;
  }
}

/**
 * Fetches all colleague profiles from Firestore.
 */
export async function fetchColleagues(): Promise<ActionOwner[]> {
  try {
    const colRef = collection(db, COLLEAGUE_COLLECTION);
    const snapshot = await getDocs(colRef);
    const colleagues: ActionOwner[] = [];
    snapshot.forEach((doc) => {
      colleagues.push(doc.data() as ActionOwner);
    });
    return colleagues;
  } catch (error) {
    console.error('Error fetching colleagues:', error);
    return [];
  }
}

/**
 * Saves or updates a colleague's role and facility assignment.
 */
export async function saveColleague(colleague: ActionOwner): Promise<void> {
  try {
    const cleaned = sanitizeForFirestore(colleague);
    const docRef = doc(db, COLLEAGUE_COLLECTION, colleague.id);
    await setDoc(docRef, cleaned);
  } catch (error) {
    console.error(`Error saving colleague ${colleague.id}:`, error);
    throw error;
  }
}

/**
 * Searches for a colleague profile matching a given phone number.
 * Can match either the primary phoneNumber or any phone number inside phoneNumbers array.
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
 * First user ever registered becomes the Superadmin.
 * Otherwise, resolves the existing record or registers a new default Facility Agent.
 */
export async function resolveColleagueProfile(phoneNumber: string, fullName: string, selectedFacility?: string): Promise<ActionOwner> {
  try {
    const cleanPhone = normalizePhoneNumber(phoneNumber);
    const colleaguesRef = collection(db, COLLEAGUE_COLLECTION);
    const snapshot = await getDocs(colleaguesRef);
    
    const allColleagues: ActionOwner[] = [];
    snapshot.forEach((doc) => {
      allColleagues.push(doc.data() as ActionOwner);
    });

    // Check if user already exists with this phone number (primary or secondary)
    const existing = allColleagues.find(c => {
      const matchPrimary = normalizePhoneNumber(c.phoneNumber || '') === cleanPhone;
      const matchArray = c.phoneNumbers?.some(p => normalizePhoneNumber(p) === cleanPhone);
      return matchPrimary || matchArray;
    });
    if (existing) {
      // Return existing profile
      return existing;
    }

    // Determine role, facility and approval status
    let role = 'Facility Agent';
    let facility = selectedFacility || 'PNHGTW'; // Selected facility or default
    let department = 'Operations';
    let status: 'approved' | 'pending' = 'pending';

    // If there are no colleagues in the database, the very first user becomes Superadmin (auto-approved)!
    // Or if name/username includes superadmin or hempiden
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
    // Fallback profile
    return {
      id: 'fallback-' + Date.now(),
      username: fullName.toLowerCase().replace(/\s+/g, '.'),
      fullName,
      role: fullName.toLowerCase().includes('superadmin') ? 'superadmin' : 'Facility Agent',
      department: 'Operations',
      facility: selectedFacility || 'PNHGTW',
      status: fullName.toLowerCase().includes('superadmin') ? 'approved' : 'pending',
      phoneNumber: normalizePhoneNumber(phoneNumber),
      phoneNumbers: [normalizePhoneNumber(phoneNumber)],
      avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName)}`
    };
  }
}
