export interface TimelineEvent {
  timestamp: string;
  action: string;
  deadline?: string;
  pic?: string;
  status?: 'Completed' | 'In Progress' | 'New';
}

export interface ActionOwner {
  id: string;
  username: string;
  fullName: string;
  role: string;
  department: string;
  avatarUrl?: string;
}

export interface VoCRecord {
  id: string; // Survey ID
  likelihood: number; // NPS Score (0-10)
  category: 'Promoter' | 'Passive' | 'Detractor';
  comment: string; // Primary Customer Comment
  customSummary?: string; // Optional shorter text summary written by action owner or pre-summarized
  actionSummary?: string; // Optional shorter action summary written by action owner or pre-summarized
  actionDetailsRaw: string; // Raw logs string
  timeline: TimelineEvent[]; // Parsed logs
  owner: string; // Follow-up owner
  status: 'New' | 'In Progress' | 'Completed'; // Case Status derived or parsed
  interaction?: string; // Interaction ID (e.g., PNHGTW)
  followUpComments?: string; // Additional comments column
  // Additional BA / Management fields from full spreadsheet export:
  journeyName?: string;
  momentOfTruthName?: string;
  transactionName?: string;
  easeOfUse?: number;
  responseDate?: string;
  creationDate?: string;
  customerName?: string;
  contactPhone?: string;
  contactEmail?: string;
  countryName?: string;
  region?: string;
  industry?: string;
  accountName?: string;
  awbNumber?: string;
  rootCauseCategory?: string;
  rootCause?: string;
  rootCauseComment?: string;
  topic?: string;
  sentiment?: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL' | 'NO_OPINION';
  responseFeedbackChannel?: string;
}

export interface DashboardFilters {
  searchQuery: string;
  categoryFilter: 'All' | 'Promoter' | 'Passive' | 'Detractor';
  statusFilter: 'All' | 'New' | 'In Progress' | 'Completed';
  ownerFilter: string;
  channelFilter: string;
}
