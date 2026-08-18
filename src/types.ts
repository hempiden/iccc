export interface TimelineEvent {
  timestamp: string;
  action: string;
  deadline?: string;
  pic?: string;
  status?: 'Completed' | 'In Progress' | 'New' | 'Closed';
}

export interface VoCComment {
  id: string;
  timestamp: string;
  author: string;
  role: string;
  text: string;
}

export interface ActionOwner {
  id: string;
  username: string;
  fullName: string;
  role: string;
  department: string;
  avatarUrl?: string;
  facility?: string; // Assigned Facility (e.g. PNHGTW, PNHASC, PNHSVC or 'All')
  phoneNumber?: string;
  phoneNumbers?: string[]; // Multiple phone numbers associated to this person
  status?: 'approved' | 'pending' | 'rejected'; // Approval status for user signups
  email?: string; // Outlook / Communication email
}

export interface VoCRecord {
  id: string; // Unique database record ID
  surveyId?: string; // Original Survey ID (which may have duplicates for different themes)
  likelihood: number; // NPS Score (0-10)
  category: 'Promoter' | 'Passive' | 'Detractor';
  comment: string; // Primary Customer Comment
  customSummary?: string; // Optional shorter text summary written by action owner or pre-summarized
  actionSummary?: string; // Optional shorter action summary written by action owner or pre-summarized
  actionDetailsRaw: string; // Raw logs string
  timeline: TimelineEvent[]; // Parsed logs
  comments?: VoCComment[]; // In-system comment/followup conversation
  owner: string; // Follow-up owner
  status: 'New' | 'In Progress' | 'Completed'; // Case Status derived or parsed
  interaction?: string; // Interaction ID (e.g., PNHGTW)
  followUpComments?: string; // Additional comments column
  deadline?: string;
  transaction?: string;
  alertType?: string;
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

export type SentimentType = 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL' | 'NO_OPINION' | 'MIXED_OPINION' | 'STRONGLY_POSITIVE';

export interface TopicSentimentRecord {
  id: string;
  surveyId: string;
  commentField: string;
  comment: string;
  phrase: string;
  topicTheme: string;
  parentTopic: string;
  subTopic: string;
  sentiment: SentimentType;
  mainScore: number;
  countryUnit: string;
  responseDate?: string;
}

export interface TopicAnalyticsItem {
  name: string; // Full topic or parent topic name
  parentTopic?: string;
  subTopic?: string;
  isSubTopic?: boolean;
  volume: number;
  volumeChange?: string;
  percentOfResponses: number;
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;
  mixedCount: number;
  percentPositive: number;
  percentNegative: number;
  percentNeutral: number;
  percentMixed: number;
  impactScore: number;
  subTopics?: TopicAnalyticsItem[];
  samplePhrases?: {
    id: string;
    surveyId: string;
    phrase: string;
    comment: string;
    sentiment: SentimentType;
    score: number;
  }[];
}

export interface TopicHighlightSummary {
  topic: string;
  subTopicHighlights: {
    aspect: string; // e.g. "Overall Satisfaction", "Politeness", "Helpfulness", "Timeliness"
    summary: string; // concise AI synthesis of customer feedback
  }[];
}

