import { db } from './firebase';
import { collection, getDocs, doc, setDoc, writeBatch, query, where, limit } from 'firebase/firestore';
import { VoCRecord, ActionOwner } from '../types';

const COLLECTION_NAME = 'voc_records';
const COLLEAGUE_COLLECTION = 'colleagues';

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

/**
 * Fetches all VoC records from Firestore.
 */
export async function fetchVoCRecords(): Promise<VoCRecord[]> {
  try {
    const colRef = collection(db, COLLECTION_NAME);
    const snapshot = await getDocs(colRef);
    const records: VoCRecord[] = [];
    snapshot.forEach((doc) => {
      records.push(doc.data() as VoCRecord);
    });
    return records;
  } catch (error) {
    console.error('Error fetching records from Firestore:', error);
    throw error;
  }
}

/**
 * Saves or updates a single VoC record in Firestore.
 */
export async function saveVoCRecord(record: VoCRecord): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, record.id);
    await setDoc(docRef, record);
  } catch (error) {
    console.error(`Error saving record ${record.id} to Firestore:`, error);
    throw error;
  }
}

/**
 * Saves multiple records in batches of 400 (Firestore max batch limit is 500).
 */
export async function batchSaveVoCRecords(records: VoCRecord[]): Promise<void> {
  try {
    // Partition records into chunks of 400 to prevent exceeding Firestore limits
    const chunks: VoCRecord[][] = [];
    for (let i = 0; i < records.length; i += 400) {
      chunks.push(records.slice(i, i + 400));
    }

    for (const chunk of chunks) {
      const batch = writeBatch(db);
      chunk.forEach((r) => {
        const docRef = doc(db, COLLECTION_NAME, r.id);
        batch.set(docRef, r);
      });
      await batch.commit();
    }
  } catch (error) {
    console.error('Error saving batch records to Firestore:', error);
    throw error;
  }
}

/**
 * Seeds Firestore with default sample records if the collection is empty.
 * Returns the current set of records.
 */
export async function seedFirestoreIfNeeded(defaultSampleRecords: VoCRecord[]): Promise<VoCRecord[]> {
  try {
    const existing = await fetchVoCRecords();
    if (existing.length > 0) {
      return existing;
    }
    
    // Seed database
    console.log('Firestore is empty. Seeding with pre-loaded DHL records...');
    await batchSaveVoCRecords(defaultSampleRecords);
    return defaultSampleRecords;
  } catch (error) {
    console.error('Error seeding Firestore:', error);
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
    const docRef = doc(db, COLLEAGUE_COLLECTION, colleague.id);
    await setDoc(docRef, colleague);
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
