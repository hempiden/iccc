import { VoCRecord, ActionOwner } from '../types';

const LOCAL_STORAGE_KEY = 'dhl_voc_local_survey_records';
const COLLEAGUE_STORAGE_KEY = 'dhl_voc_colleagues_v2';
const SYSTEM_SETTINGS_KEY = 'dhl_system_settings_v1';

export interface SystemLoginSettings {
  sandboxOtpEnabled: boolean;
  allowedCountryCodes?: string[];
  lastUpdatedBy?: string;
  updatedAt?: string;
}

const DEFAULT_INITIAL_COLLEAGUES: ActionOwner[] = [
  {
    id: 'superadmin-hempiden-1',
    username: 'hempiden.superadmin',
    fullName: 'Hempiden (Superadmin)',
    role: 'superadmin',
    department: 'Management',
    phoneNumber: '+85561999906',
    phoneNumbers: ['+85561999906', '+85561999905', '+15555555555'],
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
 * Fetches the global login and OTP configuration settings from local storage.
 */
export async function fetchSystemLoginSettings(): Promise<SystemLoginSettings> {
  const defaultFallback: SystemLoginSettings = {
    sandboxOtpEnabled: true,
    allowedCountryCodes: ['+855', '+1'],
    lastUpdatedBy: 'Superadmin',
    updatedAt: new Date().toISOString()
  };

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
 * Saves global login and OTP settings to local storage.
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
  } catch (err) {
    console.error('Error saving login settings to local storage:', err);
  }
}

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
 * Fetches all VoC survey records from local storage.
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
    existing.forEach(r => map.set(r.id, r));
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
 */
export async function seedFirestoreIfNeeded(defaultSampleRecords: VoCRecord[]): Promise<VoCRecord[]> {
  try {
    const existing = await fetchVoCRecords();
    if (existing.length > 0) {
      return existing;
    }
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(defaultSampleRecords));
    return defaultSampleRecords;
  } catch (error) {
    console.error('Error seeding local survey records:', error);
    return defaultSampleRecords;
  }
}

/**
 * Fetches all colleague profiles from local storage.
 */
export async function fetchColleagues(): Promise<ActionOwner[]> {
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
 * Saves or updates a colleague's role and facility assignment locally.
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
  } catch (error) {
    console.error(`Error saving colleague ${colleague.id} locally:`, error);
    throw error;
  }
}

/**
 * Searches for a colleague profile matching a given phone number locally.
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
    console.error('Error finding colleague by phone locally:', error);
    return null;
  }
}

/**
 * Resolves or registers a colleague by phone number locally.
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
    console.error('Error resolving colleague profile locally:', error);
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
