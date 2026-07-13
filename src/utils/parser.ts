import { TimelineEvent, VoCRecord } from '../types';

/**
 * Parses raw action details into structured timeline events.
 * Handles messy text with timestamp brackets: [YYYY-MM-DD HH:MM:SS] Action description;
 * Even works across multiple lines and with or without semicolon delimiters.
 */
export function parseActionDetails(rawText: string, fallbackDate: string = 'N/A'): TimelineEvent[] {
  if (!rawText) return [];

  const timeline: TimelineEvent[] = [];
  
  // A highly robust timestamp regex that matches various formats inside brackets, allowing optional spaces:
  // e.g. [2026-06-02 16:58:34], [ 2026-06-02 16:58:34 ], [02/06/2026 16:58:34], [2026-06-02], [2026-06-02 16:58]
  const timestampRegex = /\[\s*(\d{1,4}[-/.]\d{1,4}[-/.]\d{2,4}(?:[\s\u00A0T]+\d{1,2}:\d{1,2}(?::\d{1,2})?(?:\s*[AaPpMm]{2})?)?)\s*\]/g;

  interface TempMatch {
    timestamp: string;
    startIndex: number;
    endIndex: number;
  }

  const matches: TempMatch[] = [];
  let match;
  
  timestampRegex.lastIndex = 0;
  while ((match = timestampRegex.exec(rawText)) !== null) {
    matches.push({
      timestamp: match[1].trim(),
      startIndex: match.index,
      endIndex: timestampRegex.lastIndex
    });
  }

  if (matches.length > 0) {
    for (let i = 0; i < matches.length; i++) {
      const current = matches[i];
      const next = matches[i + 1];
      
      const actionStart = current.endIndex;
      const actionEnd = next ? next.startIndex : rawText.length;
      
      let action = rawText.substring(actionStart, actionEnd).trim();
      
      // Clean up trailing/leading punctuation, semicolons, commas, or extra separator noise
      action = action
        .replace(/^[:;\s,·•-]+/, '') // leading punctuation/whitespace
        .replace(/[:;\s,·•-]+$/, '') // trailing punctuation/whitespace
        .trim();
        
      if (action) {
        timeline.push({
          timestamp: current.timestamp,
          action: action
        });
      }
    }
  }

  // If regex parsing didn't find any standard timestamps, but text exists, treat the entire text as one initial action
  if (timeline.length === 0 && rawText.trim().length > 0) {
    timeline.push({
      timestamp: fallbackDate,
      action: rawText.trim()
    });
  }

  // Sort timeline events chronologically (or preserve order as in log)
  return timeline;
}

/**
 * Heals a record's parsed timeline if it was previously saved with a failed/N/A parsing,
 * but still has the raw logs in `actionDetailsRaw`.
 */
export function healRecordTimeline(record: VoCRecord): VoCRecord {
  if (!record) return record;
  
  let timeline = record.timeline || [];
  const fallbackDate = record.creationDate || record.responseDate || 'N/A';

  if (timeline.length === 0 && record.actionDetailsRaw) {
    timeline = parseActionDetails(record.actionDetailsRaw, fallbackDate);
  } else {
    // If any event has 'N/A' as timestamp, heal it with record dates
    timeline = timeline.map(event => {
      if (!event.timestamp || event.timestamp === 'N/A') {
        return {
          ...event,
          timestamp: fallbackDate
        };
      }
      return event;
    });
  }

  return {
    ...record,
    timeline
  };
}

/**
 * Infers Case Status based on timeline content and log descriptions.
 */
export function inferStatus(timeline: TimelineEvent[], rawText: string): 'New' | 'In Progress' | 'Completed' {
  if (timeline.length === 0) return 'New';
  
  const lowerText = rawText.toLowerCase();
  
  // Check if closed alert keywords are in the recent logs
  if (lowerText.includes('alert closed') || lowerText.includes('case closed') || lowerText.includes('status set to closed') || lowerText.includes('status set to completed') || lowerText.includes('completed')) {
    return 'Completed';
  }
  
  if (lowerText.includes('pending') || lowerText.includes('wait for customer') || lowerText.includes('assigned') || lowerText.includes('edited') || lowerText.includes('in progress') || timeline.length > 1) {
    return 'In Progress';
  }
  
  return 'New';
}

/**
 * Maps standard NPS score (0-10) to category.
 */
export function getNPSCategory(score: number): 'Promoter' | 'Passive' | 'Detractor' {
  if (score >= 9) return 'Promoter';
  if (score >= 7) return 'Passive';
  return 'Detractor';
}

/**
 * Business Analyst Intelligence: Classifies customer comment into core Topics/Themes
 */
export function classifyTopic(comment: string, transactionName?: string): string {
  const text = comment.toLowerCase();
  
  // High-priority matches
  if (text.includes('customs') || text.includes('clearance') || text.includes('broker') || text.includes('duties') || text.includes('permit') || text.includes('tax') || text.includes('formal')) {
    return 'Customs Clearance';
  }
  
  if (text.includes('price') || text.includes('expensive') || text.includes('surcharge') || text.includes('fee') || text.includes('ppwk') || text.includes('charge') || text.includes('cost')) {
    return 'Price';
  }

  if (text.includes('billing') || text.includes('invoice') || text.includes('invoice accuracy') || text.includes('charged') || text.includes('payment') || text.includes('mybill')) {
    return 'Invoicing and Payment';
  }

  if (text.includes('app') || text.includes('website') || text.includes('tracking') || text.includes('monitored') || text.includes('hotline') || text.includes('ivr') || text.includes('phone') || text.includes('telegram') || text.includes('communication') || text.includes('email')) {
    return 'Digital User Experience';
  }

  if (text.includes('pick up') || text.includes('picks up') || text.includes('picked-up') || text.includes('schedule') || text.includes('drop it off') || text.includes('drop-off') || text.includes('svp') || text.includes('service point')) {
    return 'Pickup';
  }

  if (text.includes('courier') || text.includes('polite') || text.includes('friendly') || text.includes('helpful') || text.includes('professional') || text.includes('staff') || text.includes('morality') || text.includes('employees') || text.includes('driver')) {
    return 'People';
  }

  if (text.includes('delivery') || text.includes('delivered') || text.includes('transit') || text.includes('on time') || text.includes('timed') || text.includes('delay') || text.includes('arrive') || text.includes('route')) {
    return 'Delivery';
  }

  if (text.includes('support') || text.includes('help') || text.includes('resolved') || text.includes('customer service') || text.includes('helpline')) {
    return 'Support';
  }

  if (text.includes('book service') || text.includes('booking') || text.includes('booking tool')) {
    return 'Booking';
  }

  if (text.includes('information') || text.includes('info') || text.includes('regulations')) {
    return 'Information';
  }

  // Fallback on transaction if available
  if (transactionName) {
    const tx = transactionName.toLowerCase();
    if (tx.includes('clearance') || tx.includes('duties')) return 'Customs Clearance';
    if (tx.includes('pickup') || tx.includes('drop')) return 'Pickup';
    if (tx.includes('delivery')) return 'Delivery';
    if (tx.includes('management') || tx.includes('self-service')) return 'Digital User Experience';
  }

  return 'Brand';
}

/**
 * Business Analyst Intelligence: Analyzes sentiment of comment
 */
export function analyzeSentiment(comment: string, score: number): 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL' | 'NO_OPINION' {
  const text = comment.toLowerCase();
  
  if (text === '' || text.includes('no comment') || text === 'no comment provided.') {
    return 'NO_OPINION';
  }

  if (score >= 9) {
    // Promoters are usually positive, unless they complain about price/surcharges
    if (text.includes('expensive') || text.includes('high surcharge') || text.includes('but') && (text.includes('expensive') || text.includes('delay'))) {
      return 'NEUTRAL';
    }
    return 'POSITIVE';
  }

  if (score >= 7) {
    // Passives are mixed or neutral
    if (text.includes('good') || text.includes('great') || text.includes('fast') || text.includes('friendly')) {
      if (text.includes('but') || text.includes('however') || text.includes('expensive') || text.includes('delay')) {
        return 'NEUTRAL'; // mixed
      }
      return 'POSITIVE';
    }
    return 'NEUTRAL';
  }

  // Detractors are negative
  return 'NEGATIVE';
}

/**
 * Generates the Medallia URL for a given Survey ID, handling 11-digit IDs with leading '22'
 */
export function getSurveyUrl(id: string): string {
  let cleanId = id.trim().replace(/^["']|["']$/g, '');
  if (cleanId.length === 11 && cleanId.startsWith('22')) {
    cleanId = cleanId.substring(2);
  }
  return `https://dhl.medallia.eu/sso/dhl/applications/ex_WEB-9/pages/435?roleId=556&v.id=%22${encodeURIComponent(cleanId)}%22`;
}
