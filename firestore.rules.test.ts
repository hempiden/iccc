/**
 * Firestore Security Rules Verification Matrix (Dirty Dozen + Happy Path)
 * Documents every access control assertion enforced by firestore.rules.
 */

export interface SecurityRuleTestCase {
  id: string;
  description: string;
  actor: 'unauthenticated' | 'userA' | 'userB' | 'admin';
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  path: string;
  payload?: Record<string, unknown>;
  expected: 'ALLOW' | 'DENY';
}

export const FIRESTORE_SECURITY_TEST_CASES: SecurityRuleTestCase[] = [
  // Happy Path: User A owns their own isolated bucket
  {
    id: 'HP-1',
    description: 'User A creates own profile with safe Facility Agent role',
    actor: 'userA',
    operation: 'create',
    path: '/users/userA',
    payload: {
      uid: 'userA',
      username: 'alice',
      fullName: 'Alice Tan',
      email: 'alice@example.com',
      role: 'Facility Agent',
      status: 'approved',
    },
    expected: 'ALLOW',
  },
  {
    id: 'HP-2',
    description: 'User A uploads a valid VoC record into own bucket /users/userA/voc_records/rec_1',
    actor: 'userA',
    operation: 'create',
    path: '/users/userA/voc_records/rec_1',
    payload: {
      id: 'rec_1',
      ownerId: 'userA',
      likelihood: 9,
      category: 'Promoter',
      comment: 'Fast delivery',
      owner: 'Alice Tan',
      status: 'New',
    },
    expected: 'ALLOW',
  },
  {
    id: 'HP-3',
    description: 'User A lists own uploaded VoC records',
    actor: 'userA',
    operation: 'list',
    path: '/users/userA/voc_records',
    expected: 'ALLOW',
  },

  // Dirty Dozen Attack Payloads (All MUST be DENIED)
  {
    id: 'DD-1',
    description: 'Cross-tenant list: User B tries to list User A VoC records',
    actor: 'userB',
    operation: 'list',
    path: '/users/userA/voc_records',
    expected: 'DENY',
  },
  {
    id: 'DD-2',
    description: 'Cross-tenant read: User B tries to read User A topic sentiment record',
    actor: 'userB',
    operation: 'get',
    path: '/users/userA/topic_records/topic_1',
    expected: 'DENY',
  },
  {
    id: 'DD-3',
    description: 'Cross-tenant write: User B tries to inject record into User A bucket',
    actor: 'userB',
    operation: 'create',
    path: '/users/userA/voc_records/rec_evil',
    payload: {
      id: 'rec_evil',
      ownerId: 'userA',
      likelihood: 1,
      category: 'Detractor',
      comment: 'Injected',
      owner: 'Evil',
      status: 'New',
    },
    expected: 'DENY',
  },
  {
    id: 'DD-4',
    description: 'Owner spoofing: User A tries to create record with ownerId=userB',
    actor: 'userA',
    operation: 'create',
    path: '/users/userA/voc_records/rec_spoof',
    payload: {
      id: 'rec_spoof',
      ownerId: 'userB',
      likelihood: 8,
      category: 'Passive',
      comment: 'Spoofed',
      owner: 'Alice',
      status: 'New',
    },
    expected: 'DENY',
  },
  {
    id: 'DD-5',
    description: 'Privilege escalation on create: User A attempts role=superadmin',
    actor: 'userA',
    operation: 'create',
    path: '/users/userA',
    payload: {
      uid: 'userA',
      username: 'alice',
      fullName: 'Alice Tan',
      role: 'superadmin',
      status: 'approved',
    },
    expected: 'DENY',
  },
  {
    id: 'DD-6',
    description: 'Privilege escalation on update: User A tries to change role to superadmin',
    actor: 'userA',
    operation: 'update',
    path: '/users/userA',
    payload: {
      uid: 'userA',
      username: 'alice',
      fullName: 'Alice Tan',
      role: 'superadmin',
      status: 'approved',
    },
    expected: 'DENY',
  },
  {
    id: 'DD-7',
    description: 'Unauthenticated read on user VoC bucket',
    actor: 'unauthenticated',
    operation: 'list',
    path: '/users/userA/voc_records',
    expected: 'DENY',
  },
  {
    id: 'DD-8',
    description: 'Legacy shared /voc_records collection access denied',
    actor: 'userA',
    operation: 'list',
    path: '/voc_records',
    expected: 'DENY',
  },
  {
    id: 'DD-9',
    description: 'Schema pollution: unexpected extra field on VoC record',
    actor: 'userA',
    operation: 'create',
    path: '/users/userA/voc_records/rec_extra',
    payload: {
      id: 'rec_extra',
      ownerId: 'userA',
      likelihood: 10,
      category: 'Promoter',
      comment: 'Nice',
      owner: 'Alice',
      status: 'New',
      isAdmin: true,
    },
    expected: 'DENY',
  },
  {
    id: 'DD-10',
    description: 'Invalid score out of bounds (likelihood: 99)',
    actor: 'userA',
    operation: 'create',
    path: '/users/userA/voc_records/rec_oob',
    payload: {
      id: 'rec_oob',
      ownerId: 'userA',
      likelihood: 99,
      category: 'Promoter',
      comment: 'Out of bounds',
      owner: 'Alice',
      status: 'New',
    },
    expected: 'DENY',
  },
  {
    id: 'DD-11',
    description: 'PII harvesting: User B tries to list /users collection',
    actor: 'userB',
    operation: 'list',
    path: '/users',
    expected: 'DENY',
  },
  {
    id: 'DD-12',
    description: 'PII harvesting: User B tries to list /colleagues collection',
    actor: 'userB',
    operation: 'list',
    path: '/colleagues',
    expected: 'DENY',
  },
];
