import { User as FirebaseUser } from 'firebase/auth';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  writeBatch,
} from 'firebase/firestore';
import {
  VoCRecord,
  ActionOwner,
  TopicSentimentRecord,
  TopicHighlightSummary,
  SentimentType,
} from '../types';
import { auth, db, handleFirestoreError, OperationType } from './firebase';

const COLLEAGUE_STORAGE_KEY = 'dhl_voc_colleagues_v2';
const SYSTEM_SETTINGS_KEY = 'dhl_system_settings_v1';
const BOOTSTRAPPED_ADMIN_EMAIL = 'hempiden@gmail.com';
const MAX_BATCH_OPS = 400;

const LEGACY_SHARED_KEYS = [
  'dhl_voc_local_survey_records',
  'dhl_voc_topic_sentiment_records',
  'dhl_voc_topic_highlights',
  'dhl_voc_topic_sentiment_v',
  'dhl_voc_ta_start_date',
  'dhl_voc_ta_end_date',
  'dhl_voc_read_notifications',
  'dhl_voc_current_user',
];

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
    email: 'hempiden@gmail.com',
    facility: 'All',
    status: 'approved',
    avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=Hempiden',
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
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&fit=crop&q=80',
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
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&fit=crop&q=80',
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
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&fit=crop&q=80',
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
    avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&fit=crop&q=80',
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
    avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=SokChea',
  },
];

// =============================================================================
// PER-USER STORAGE KEY HELPERS & LEGACY CLEANUP
// =============================================================================
export function getUserVoCStorageKey(userId: string): string {
  return `dhl_voc_bucket_${sanitizeFirestoreId(userId, 'user')}_records`;
}

export function getUserTopicStorageKey(userId: string): string {
  return `dhl_voc_bucket_${sanitizeFirestoreId(userId, 'user')}_topic_records`;
}

export function getUserHighlightsStorageKey(userId: string): string {
  return `dhl_voc_bucket_${sanitizeFirestoreId(userId, 'user')}_topic_highlights`;
}

export function getUserDateFilterKey(userId: string, bound: 'start' | 'end'): string {
  return `dhl_voc_bucket_${sanitizeFirestoreId(userId, 'user')}_ta_${bound}_date`;
}

export function getUserNotificationsStorageKey(userId: string): string {
  return `dhl_voc_bucket_${sanitizeFirestoreId(userId, 'user')}_read_notifications`;
}

/**
 * Removes legacy unscoped localStorage keys so shared browser state
 * from before per-user bucketing can never bleed into another user's workspace.
 */
export function clearLegacySharedStorage(): void {
  try {
    LEGACY_SHARED_KEYS.forEach((key) => localStorage.removeItem(key));
  } catch {
    // ignore storage errors
  }
}

// =============================================================================
// BLUEPRINT-ALIGNED SANITIZERS (Matches firebase-blueprint.json & firestore.rules)
// =============================================================================
export function sanitizeFirestoreId(raw: string | undefined, fallbackPrefix = 'rec'): string {
  const cleaned = String(raw || '')
    .trim()
    .replace(/[^a-zA-Z0-9_\-]/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 128);
  if (cleaned.length > 0 && /^[a-zA-Z0-9_\-]+$/.test(cleaned)) {
    return cleaned;
  }
  return `${fallbackPrefix}_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
}

function truncateStr(val: unknown, maxLen: number): string | undefined {
  if (val === undefined || val === null) return undefined;
  const s = String(val).trim();
  if (!s) return undefined;
  return s.length > maxLen ? s.slice(0, maxLen) : s;
}

function normalizeStatus(status: unknown): 'New' | 'In Progress' | 'Completed' {
  const s = String(status || '').trim();
  if (s === 'Completed' || s === 'Closed') return 'Completed';
  if (s === 'In Progress' || s === 'Pending') return 'In Progress';
  return 'New';
}

function normalizeCategory(category: unknown, likelihood: number): 'Promoter' | 'Passive' | 'Detractor' {
  if (category === 'Promoter' || category === 'Passive' || category === 'Detractor') {
    return category;
  }
  if (likelihood >= 9) return 'Promoter';
  if (likelihood >= 7) return 'Passive';
  return 'Detractor';
}

function normalizeVoCSentiment(
  sentiment: unknown
): 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL' | 'NO_OPINION' | undefined {
  if (
    sentiment === 'POSITIVE' ||
    sentiment === 'NEGATIVE' ||
    sentiment === 'NEUTRAL' ||
    sentiment === 'NO_OPINION'
  ) {
    return sentiment;
  }
  return undefined;
}

function normalizeTopicSentiment(sentiment: unknown): SentimentType {
  const valid: SentimentType[] = [
    'POSITIVE',
    'NEGATIVE',
    'NEUTRAL',
    'NO_OPINION',
    'MIXED_OPINION',
    'STRONGLY_POSITIVE',
  ];
  const s = String(sentiment || '').toUpperCase().trim() as SentimentType;
  if (valid.includes(s)) return s;
  if (s.includes('POS')) return 'POSITIVE';
  if (s.includes('NEG')) return 'NEGATIVE';
  if (s.includes('MIX')) return 'MIXED_OPINION';
  if (s.includes('NEU')) return 'NEUTRAL';
  return 'NO_OPINION';
}

function clampScore(val: unknown, fallback = 5): number {
  const num = Number(val);
  if (Number.isNaN(num)) return fallback;
  return Math.max(0, Math.min(10, num));
}

/**
 * Produces a strictly validated, blueprint-compliant VoCRecord bound to `userId`.
 */
export function sanitizeVoCRecordForBucket(record: VoCRecord, userId: string): VoCRecord & { ownerId: string; updatedAt: string } {
  const cleanId = sanitizeFirestoreId(record.id, 'voc');
  const likelihood = clampScore(record.likelihood, 5);
  const category = normalizeCategory(record.category, likelihood);
  const status = normalizeStatus(record.status);

  const payload: Record<string, unknown> = {
    id: cleanId,
    ownerId: userId,
    likelihood,
    category,
    comment: truncateStr(record.comment, 10000) || 'No comment provided.',
    owner: truncateStr(record.owner, 150) || 'Unassigned',
    status,
    actionDetailsRaw: truncateStr(record.actionDetailsRaw, 20000) || '',
    timeline: Array.isArray(record.timeline)
      ? JSON.parse(JSON.stringify(record.timeline.slice(0, 200)))
      : [],
    comments: Array.isArray(record.comments)
      ? JSON.parse(JSON.stringify(record.comments.slice(0, 200)))
      : [],
    updatedAt: new Date().toISOString(),
  };

  const optionalStrings: Array<[keyof VoCRecord, number]> = [
    ['surveyId', 128],
    ['customSummary', 4000],
    ['actionSummary', 4000],
    ['interaction', 128],
    ['followUpComments', 10000],
    ['deadline', 128],
    ['transaction', 256],
    ['alertType', 128],
    ['journeyName', 256],
    ['momentOfTruthName', 256],
    ['transactionName', 256],
    ['responseDate', 64],
    ['creationDate', 64],
    ['customerName', 256],
    ['contactPhone', 128],
    ['contactEmail', 254],
    ['countryName', 128],
    ['region', 128],
    ['industry', 128],
    ['accountName', 256],
    ['awbNumber', 128],
    ['rootCauseCategory', 256],
    ['rootCause', 256],
    ['rootCauseComment', 4000],
    ['topic', 256],
    ['responseFeedbackChannel', 128],
  ];

  for (const [key, maxLen] of optionalStrings) {
    const val = truncateStr(record[key], maxLen);
    if (val !== undefined) {
      payload[key] = val;
    }
  }

  if (record.easeOfUse !== undefined && record.easeOfUse !== null && !Number.isNaN(Number(record.easeOfUse))) {
    payload.easeOfUse = clampScore(record.easeOfUse, 5);
  }

  const normalizedSentiment = normalizeVoCSentiment(record.sentiment);
  if (normalizedSentiment) {
    payload.sentiment = normalizedSentiment;
  }

  return payload as unknown as VoCRecord & { ownerId: string; updatedAt: string };
}

/**
 * Produces a strictly validated, blueprint-compliant TopicSentimentRecord bound to `userId`.
 */
export function sanitizeTopicRecordForBucket(
  record: TopicSentimentRecord,
  userId: string
): TopicSentimentRecord & { ownerId: string } {
  const cleanId = sanitizeFirestoreId(record.id, 'topic');
  const payload: Record<string, unknown> = {
    id: cleanId,
    ownerId: userId,
    surveyId: truncateStr(record.surveyId, 128) || cleanId,
    topicTheme: truncateStr(record.topicTheme, 256) || 'General',
    sentiment: normalizeTopicSentiment(record.sentiment),
    mainScore: clampScore(record.mainScore, 5),
    commentField: truncateStr(record.commentField, 256) || 'Primary Comment',
    comment: truncateStr(record.comment, 10000) || '',
    phrase: truncateStr(record.phrase, 2000) || '',
    parentTopic: truncateStr(record.parentTopic, 256) || 'General',
    subTopic: truncateStr(record.subTopic, 256) || 'General',
    countryUnit: truncateStr(record.countryUnit, 128) || 'KH',
  };

  const responseDate = truncateStr(record.responseDate, 64);
  if (responseDate) {
    payload.responseDate = responseDate;
  }

  return payload as unknown as TopicSentimentRecord & { ownerId: string };
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

// =============================================================================
// AUTHENTICATED USER PROFILE (Master Gate Anchor: /users/{userId})
// =============================================================================
export async function ensureUserProfile(firebaseUser: FirebaseUser): Promise<ActionOwner> {
  const uid = firebaseUser.uid;
  const userDocPath = `users/${uid}`;
  const userRef = doc(db, 'users', uid);

  const isBootstrappedAdmin =
    firebaseUser.email?.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL &&
    firebaseUser.emailVerified === true;

  try {
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const existing = snap.data() as Record<string, unknown>;
      const role = isBootstrappedAdmin
        ? 'superadmin'
        : String(existing.role || 'Facility Agent');
      const fullName =
        String(existing.fullName || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User');
      const username =
        String(existing.username || fullName.toLowerCase().replace(/[^a-z0-9]+/g, '.') || uid.slice(0, 12));

      return {
        id: uid,
        uid,
        username,
        fullName,
        email: String(existing.email || firebaseUser.email || ''),
        role,
        department: String(existing.department || (isBootstrappedAdmin ? 'Management' : 'Operations')),
        facility: String(existing.facility || (isBootstrappedAdmin ? 'All' : 'PNHGTW')),
        phoneNumber: existing.phoneNumber ? String(existing.phoneNumber) : undefined,
        phoneNumbers: Array.isArray(existing.phoneNumbers)
          ? (existing.phoneNumbers as string[])
          : undefined,
        status: (existing.status as 'approved' | 'pending' | 'rejected') || 'approved',
        avatarUrl:
          String(
            existing.avatarUrl ||
              firebaseUser.photoURL ||
              `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName)}`
          ),
      };
    }

    const displayName =
      truncateStr(firebaseUser.displayName, 150) ||
      truncateStr(firebaseUser.email?.split('@')[0], 150) ||
      'Workspace User';
    const username =
      truncateStr(displayName.toLowerCase().replace(/[^a-z0-9]+/g, '.'), 128) ||
      `user_${uid.slice(0, 8)}`;
    const nowIso = new Date().toISOString();

    const newProfilePayload: Record<string, unknown> = {
      uid,
      username,
      fullName: displayName,
      role: isBootstrappedAdmin ? 'superadmin' : 'Facility Agent',
      department: isBootstrappedAdmin ? 'Management' : 'Operations',
      facility: isBootstrappedAdmin ? 'All' : 'PNHGTW',
      status: 'approved',
      avatarUrl:
        truncateStr(firebaseUser.photoURL, 1024) ||
        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName)}`,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    const email = truncateStr(firebaseUser.email, 254);
    if (email) {
      newProfilePayload.email = email;
    }

    await setDoc(userRef, newProfilePayload);

    return {
      id: uid,
      uid,
      username,
      fullName: displayName,
      email: email || '',
      role: String(newProfilePayload.role),
      department: String(newProfilePayload.department),
      facility: String(newProfilePayload.facility),
      status: 'approved',
      avatarUrl: String(newProfilePayload.avatarUrl),
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, userDocPath);
  }
}

export async function saveUserProfile(user: ActionOwner): Promise<void> {
  const uid = user.uid || user.id;
  if (!uid) return;
  const userDocPath = `users/${uid}`;
  const userRef = doc(db, 'users', uid);

  try {
    const existingSnap = await getDoc(userRef);
    const existing = existingSnap.exists() ? (existingSnap.data() as Record<string, unknown>) : {};

    const payload: Record<string, unknown> = {
      uid,
      username: truncateStr(user.username || existing.username, 128) || `user_${uid.slice(0, 8)}`,
      fullName: truncateStr(user.fullName, 150) || 'Workspace User',
      role: existing.role || user.role || 'Facility Agent',
      status: existing.status || user.status || 'approved',
      department: truncateStr(user.department || existing.department, 120) || 'Operations',
      facility: truncateStr(user.facility || existing.facility, 64) || 'PNHGTW',
      updatedAt: new Date().toISOString(),
    };

    if (existing.createdAt) {
      payload.createdAt = existing.createdAt;
    } else {
      payload.createdAt = new Date().toISOString();
    }

    const email = truncateStr(user.email, 254);
    if (email) payload.email = email;

    const phone = truncateStr(user.phoneNumber, 40);
    if (phone) payload.phoneNumber = phone;

    if (Array.isArray(user.phoneNumbers) && user.phoneNumbers.length > 0) {
      payload.phoneNumbers = user.phoneNumbers
        .map((p) => truncateStr(p, 40))
        .filter((p): p is string => Boolean(p))
        .slice(0, 10);
    }

    const avatarUrl = truncateStr(user.avatarUrl, 1024);
    if (avatarUrl) payload.avatarUrl = avatarUrl;

    await setDoc(userRef, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, userDocPath);
  }
}

// =============================================================================
// SYSTEM LOGIN SETTINGS (/system_settings/auth_settings)
// =============================================================================
export async function fetchSystemLoginSettings(): Promise<SystemLoginSettings> {
  const defaultFallback: SystemLoginSettings = {
    sandboxOtpEnabled: true,
    allowedCountryCodes: ['+855', '+1'],
    lastUpdatedBy: 'Superadmin',
    updatedAt: new Date().toISOString(),
  };

  try {
    if (db && auth.currentUser) {
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
    return defaultFallback;
  } catch {
    return defaultFallback;
  }
}

export async function saveSystemLoginSettings(
  settings: Partial<SystemLoginSettings>,
  updatedBy?: string
): Promise<void> {
  const current = await fetchSystemLoginSettings();
  const merged: SystemLoginSettings = {
    sandboxOtpEnabled:
      typeof settings.sandboxOtpEnabled === 'boolean'
        ? settings.sandboxOtpEnabled
        : current.sandboxOtpEnabled,
    allowedCountryCodes: (settings.allowedCountryCodes || current.allowedCountryCodes || ['+855', '+1']).slice(0, 20),
    lastUpdatedBy: truncateStr(updatedBy || current.lastUpdatedBy || 'Superadmin', 150),
    updatedAt: new Date().toISOString(),
  };

  try {
    localStorage.setItem(SYSTEM_SETTINGS_KEY, JSON.stringify(merged));
    localStorage.setItem('dhl_sandbox_otp_enabled', String(merged.sandboxOtpEnabled));
  } catch {
    // ignore localStorage errors
  }

  if (db && auth.currentUser) {
    const path = 'system_settings/auth_settings';
    try {
      await setDoc(doc(db, 'system_settings', 'auth_settings'), merged);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }
}

// =============================================================================
// PRIVATE USER VOC SURVEY BUCKET (/users/{userId}/voc_records/{recordId})
// =============================================================================

/**
 * Fetches ONLY the signed-in user's private VoC records from /users/{userId}/voc_records.
 * Never reads another user's bucket or any shared collection.
 */
export async function fetchVoCRecords(userId: string): Promise<VoCRecord[]> {
  if (!userId) return [];
  const storageKey = getUserVoCStorageKey(userId);
  const collectionPath = `users/${userId}/voc_records`;

  try {
    const snap = await getDocs(collection(db, 'users', userId, 'voc_records'));
    const records = snap.docs.map((d) => ({
      ...(d.data() as VoCRecord),
      id: d.id,
      ownerId: userId,
    }));
    try {
      localStorage.setItem(storageKey, JSON.stringify(records));
    } catch {
      // ignore quota errors
    }
    return records;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, collectionPath);
  }
}

/**
 * Saves or updates a single VoC record inside the user's private bucket.
 */
export async function saveVoCRecord(userId: string, record: VoCRecord): Promise<VoCRecord> {
  if (!userId) throw new Error('Cannot save VoC record without authenticated userId.');
  const sanitized = sanitizeVoCRecordForBucket(record, userId);
  const docPath = `users/${userId}/voc_records/${sanitized.id}`;

  try {
    await setDoc(doc(db, 'users', userId, 'voc_records', sanitized.id), sanitized);

    try {
      const storageKey = getUserVoCStorageKey(userId);
      const raw = localStorage.getItem(storageKey);
      const existing: VoCRecord[] = raw ? JSON.parse(raw) : [];
      const idx = existing.findIndex((r) => r.id === sanitized.id);
      if (idx >= 0) existing[idx] = sanitized;
      else existing.push(sanitized);
      localStorage.setItem(storageKey, JSON.stringify(existing));
    } catch {
      // ignore localStorage errors
    }

    return sanitized;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

/**
 * Replaces the active user's private VoC bucket with the newly uploaded records.
 * Uses chunked batches (<= 400 ops) so large Excel uploads succeed reliably.
 */
export async function batchSaveVoCRecords(userId: string, records: VoCRecord[]): Promise<VoCRecord[]> {
  if (!userId) throw new Error('Cannot save batch records without authenticated userId.');
  const collectionPath = `users/${userId}/voc_records`;
  const sanitizedList = records.map((r) => sanitizeVoCRecordForBucket(r, userId));

  // Deduplicate by sanitized ID so we don't write the same doc twice in a batch
  const dedupedMap = new Map<string, VoCRecord & { ownerId: string; updatedAt: string }>();
  sanitizedList.forEach((r) => dedupedMap.set(r.id, r));
  const uniqueSanitized = Array.from(dedupedMap.values());

  try {
    for (let i = 0; i < uniqueSanitized.length; i += MAX_BATCH_OPS) {
      const chunk = uniqueSanitized.slice(i, i + MAX_BATCH_OPS);
      const batch = writeBatch(db);
      chunk.forEach((r) => {
        batch.set(doc(db, 'users', userId, 'voc_records', r.id), r);
      });
      await batch.commit();
    }

    try {
      localStorage.setItem(getUserVoCStorageKey(userId), JSON.stringify(uniqueSanitized));
    } catch {
      // ignore localStorage quota errors
    }

    return uniqueSanitized;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, collectionPath);
  }
}

/**
 * Appends/merges newly uploaded VoC records into ONLY the active user's private bucket.
 */
export async function appendVoCRecords(userId: string, newRecords: VoCRecord[]): Promise<VoCRecord[]> {
  if (!userId) throw new Error('Cannot append records without authenticated userId.');
  const collectionPath = `users/${userId}/voc_records`;

  const existing = await fetchVoCRecords(userId);
  const sanitizedNew = newRecords.map((r) => sanitizeVoCRecordForBucket(r, userId));

  const dedupedNewMap = new Map<string, VoCRecord & { ownerId: string; updatedAt: string }>();
  sanitizedNew.forEach((r) => dedupedNewMap.set(r.id, r));
  const uniqueNew = Array.from(dedupedNewMap.values());

  try {
    for (let i = 0; i < uniqueNew.length; i += MAX_BATCH_OPS) {
      const chunk = uniqueNew.slice(i, i + MAX_BATCH_OPS);
      const batch = writeBatch(db);
      chunk.forEach((r) => {
        batch.set(doc(db, 'users', userId, 'voc_records', r.id), r);
      });
      await batch.commit();
    }

    const combinedMap = new Map<string, VoCRecord>();
    existing.forEach((r) => combinedMap.set(r.id, r));
    uniqueNew.forEach((r) => combinedMap.set(r.id, r));
    const combined = Array.from(combinedMap.values());

    try {
      localStorage.setItem(getUserVoCStorageKey(userId), JSON.stringify(combined));
    } catch {
      // ignore localStorage errors
    }

    return combined;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, collectionPath);
  }
}

/**
 * Deletes ALL VoC records inside ONLY the active user's private bucket.
 */
export async function clearVoCRecords(userId: string): Promise<void> {
  if (!userId) return;
  const collectionPath = `users/${userId}/voc_records`;

  try {
    const snap = await getDocs(collection(db, 'users', userId, 'voc_records'));
    for (let i = 0; i < snap.docs.length; i += MAX_BATCH_OPS) {
      const chunk = snap.docs.slice(i, i + MAX_BATCH_OPS);
      const batch = writeBatch(db);
      chunk.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }

    try {
      localStorage.removeItem(getUserVoCStorageKey(userId));
    } catch {
      // ignore
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, collectionPath);
  }
}

/**
 * Deletes specific VoC records from ONLY the active user's private bucket.
 */
export async function deleteVoCRecords(userId: string, ids: string[]): Promise<void> {
  if (!userId || !ids || ids.length === 0) return;
  const collectionPath = `users/${userId}/voc_records`;

  try {
    const cleanIds = ids.map((id) => sanitizeFirestoreId(id, 'voc'));
    for (let i = 0; i < cleanIds.length; i += MAX_BATCH_OPS) {
      const chunk = cleanIds.slice(i, i + MAX_BATCH_OPS);
      const batch = writeBatch(db);
      chunk.forEach((id) => {
        batch.delete(doc(db, 'users', userId, 'voc_records', id));
      });
      await batch.commit();
    }

    try {
      const storageKey = getUserVoCStorageKey(userId);
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const existing: VoCRecord[] = JSON.parse(raw);
        const idSet = new Set([...ids, ...cleanIds]);
        localStorage.setItem(storageKey, JSON.stringify(existing.filter((r) => !idSet.has(r.id))));
      }
    } catch {
      // ignore
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, collectionPath);
  }
}

/**
 * Explicitly loads sample demo records into ONLY the active user's private bucket.
 */
export async function seedUserSampleData(
  userId: string,
  defaultSampleRecords: VoCRecord[]
): Promise<VoCRecord[]> {
  if (!userId) return [];
  await clearVoCRecords(userId);
  return batchSaveVoCRecords(userId, defaultSampleRecords);
}

// =============================================================================
// PRIVATE USER TEXT ANALYTICS BUCKET (/users/{userId}/topic_records & topic_highlights)
// =============================================================================
export async function fetchTopicRecords(userId: string): Promise<TopicSentimentRecord[]> {
  if (!userId) return [];
  const collectionPath = `users/${userId}/topic_records`;

  try {
    const snap = await getDocs(collection(db, 'users', userId, 'topic_records'));
    const records = snap.docs.map((d) => ({
      ...(d.data() as TopicSentimentRecord),
      id: d.id,
      ownerId: userId,
    }));

    try {
      localStorage.setItem(getUserTopicStorageKey(userId), JSON.stringify(records));
    } catch {
      // ignore quota errors
    }

    return records;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, collectionPath);
  }
}

export async function replaceTopicRecords(
  userId: string,
  records: TopicSentimentRecord[]
): Promise<TopicSentimentRecord[]> {
  if (!userId) return [];
  const collectionPath = `users/${userId}/topic_records`;

  const sanitizedList = records.map((r) => sanitizeTopicRecordForBucket(r, userId));
  const dedupedMap = new Map<string, TopicSentimentRecord & { ownerId: string }>();
  sanitizedList.forEach((r) => dedupedMap.set(r.id, r));
  const uniqueSanitized = Array.from(dedupedMap.values());

  try {
    // Delete existing docs that are no longer in the replaced set
    const existingSnap = await getDocs(collection(db, 'users', userId, 'topic_records'));
    const toDelete = existingSnap.docs.filter((d) => !dedupedMap.has(d.id));

    for (let i = 0; i < toDelete.length; i += MAX_BATCH_OPS) {
      const chunk = toDelete.slice(i, i + MAX_BATCH_OPS);
      const batch = writeBatch(db);
      chunk.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }

    for (let i = 0; i < uniqueSanitized.length; i += MAX_BATCH_OPS) {
      const chunk = uniqueSanitized.slice(i, i + MAX_BATCH_OPS);
      const batch = writeBatch(db);
      chunk.forEach((r) => {
        batch.set(doc(db, 'users', userId, 'topic_records', r.id), r);
      });
      await batch.commit();
    }

    try {
      localStorage.setItem(getUserTopicStorageKey(userId), JSON.stringify(uniqueSanitized));
    } catch {
      // ignore quota errors
    }

    return uniqueSanitized;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, collectionPath);
  }
}

export async function fetchTopicHighlights(
  userId: string
): Promise<{ top3: TopicHighlightSummary[]; bottom3: TopicHighlightSummary[] } | null> {
  if (!userId) return null;
  const docPath = `users/${userId}/topic_highlights/default`;

  try {
    const snap = await getDoc(doc(db, 'users', userId, 'topic_highlights', 'default'));
    if (!snap.exists()) return null;
    const data = snap.data() as {
      top3?: TopicHighlightSummary[];
      bottom3?: TopicHighlightSummary[];
    };
    if (Array.isArray(data.top3) && Array.isArray(data.bottom3)) {
      const result = { top3: data.top3, bottom3: data.bottom3 };
      try {
        localStorage.setItem(getUserHighlightsStorageKey(userId), JSON.stringify(result));
      } catch {
        // ignore
      }
      return result;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, docPath);
  }
}

export async function saveTopicHighlights(
  userId: string,
  highlights: { top3: TopicHighlightSummary[]; bottom3: TopicHighlightSummary[] }
): Promise<void> {
  if (!userId) return;
  const docPath = `users/${userId}/topic_highlights/default`;
  const payload = {
    ownerId: userId,
    top3: JSON.parse(JSON.stringify((highlights.top3 || []).slice(0, 10))),
    bottom3: JSON.parse(JSON.stringify((highlights.bottom3 || []).slice(0, 10))),
    updatedAt: new Date().toISOString(),
  };

  try {
    await setDoc(doc(db, 'users', userId, 'topic_highlights', 'default'), payload);
    try {
      localStorage.setItem(getUserHighlightsStorageKey(userId), JSON.stringify(highlights));
    } catch {
      // ignore
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

// =============================================================================
// ADMIN-MANAGED COLLEAGUE DIRECTORY (/colleagues/{colleagueId})
// =============================================================================
function isCurrentUserBootstrappedAdmin(): boolean {
  return (
    auth.currentUser?.email?.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL &&
    auth.currentUser?.emailVerified === true
  );
}

export async function fetchColleagues(): Promise<ActionOwner[]> {
  // Only admins can list /colleagues (PII-isolated in firestore.rules)
  if (db && isCurrentUserBootstrappedAdmin()) {
    try {
      const snap = await getDocs(collection(db, 'colleagues'));
      if (!snap.empty) {
        const list = snap.docs.map((d) => d.data() as ActionOwner);
        localStorage.setItem(COLLEAGUE_STORAGE_KEY, JSON.stringify(list));
        return list;
      }
    } catch (error) {
      console.warn('Error reading colleagues from Firestore:', error);
    }
  }

  try {
    const raw = localStorage.getItem(COLLEAGUE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as ActionOwner[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
    return DEFAULT_INITIAL_COLLEAGUES;
  } catch {
    return DEFAULT_INITIAL_COLLEAGUES;
  }
}

export async function saveColleague(colleague: ActionOwner): Promise<void> {
  // If user is updating their own profile, persist to /users/{uid}
  if (auth.currentUser && (colleague.uid === auth.currentUser.uid || colleague.id === auth.currentUser.uid)) {
    await saveUserProfile({ ...colleague, uid: auth.currentUser.uid, id: auth.currentUser.uid });
    if (!isCurrentUserBootstrappedAdmin()) {
      return;
    }
  }

  const cleanId = sanitizeFirestoreId(colleague.id, 'colleague');
  const payload: Record<string, unknown> = {
    id: cleanId,
    fullName: truncateStr(colleague.fullName, 150) || 'Colleague',
    role: truncateStr(colleague.role, 64) || 'Facility Agent',
  };

  const optionalStrings: Array<[keyof ActionOwner, number]> = [
    ['uid', 128],
    ['username', 128],
    ['department', 120],
    ['facility', 64],
    ['phoneNumber', 40],
    ['email', 254],
    ['avatarUrl', 1024],
  ];
  for (const [key, maxLen] of optionalStrings) {
    const val = truncateStr(colleague[key], maxLen);
    if (val) payload[key] = val;
  }
  if (colleague.status && ['pending', 'approved', 'rejected'].includes(colleague.status)) {
    payload.status = colleague.status;
  }
  if (Array.isArray(colleague.phoneNumbers)) {
    payload.phoneNumbers = colleague.phoneNumbers
      .map((p) => truncateStr(p, 40))
      .filter((p): p is string => Boolean(p))
      .slice(0, 10);
  }

  if (db && isCurrentUserBootstrappedAdmin()) {
    const docPath = `colleagues/${cleanId}`;
    try {
      await setDoc(doc(db, 'colleagues', cleanId), payload);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, docPath);
    }
  }

  try {
    const list = await fetchColleagues();
    const idx = list.findIndex((c) => c.id === cleanId || c.username === colleague.username);
    const merged = { ...colleague, id: cleanId };
    if (idx >= 0) list[idx] = { ...list[idx], ...merged };
    else list.push(merged);
    localStorage.setItem(COLLEAGUE_STORAGE_KEY, JSON.stringify(list));
  } catch {
    // ignore localStorage errors
  }
}

export async function findColleagueByPhoneNumber(phoneNumber: string): Promise<ActionOwner | null> {
  try {
    const cleanPhone = normalizePhoneNumber(phoneNumber);
    const colleagues = await fetchColleagues();
    const existing = colleagues.find((c) => {
      const matchPrimary = normalizePhoneNumber(c.phoneNumber || '') === cleanPhone;
      const matchArray = c.phoneNumbers?.some((p) => normalizePhoneNumber(p) === cleanPhone);
      return matchPrimary || matchArray;
    });
    return existing || null;
  } catch {
    return null;
  }
}

/**
 * Resets ONLY the signed-in user's private bucket to the sample dataset
 * without affecting any other user's isolated data bucket.
 */
export async function resetAllDataToSampleData(
  userId: string,
  sampleRecords: VoCRecord[]
): Promise<{ vocCount: number; colleagueCount: number }> {
  const saved = await seedUserSampleData(userId, sampleRecords);
  clearLegacySharedStorage();

  try {
    localStorage.removeItem(getUserTopicStorageKey(userId));
    localStorage.removeItem(getUserHighlightsStorageKey(userId));
    localStorage.removeItem(getUserNotificationsStorageKey(userId));
  } catch {
    // ignore
  }

  return {
    vocCount: saved.length,
    colleagueCount: DEFAULT_INITIAL_COLLEAGUES.length,
  };
}
