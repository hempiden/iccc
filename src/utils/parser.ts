import { TimelineEvent, VoCRecord } from '../types';

/**
 * Parses raw action details into structured timeline events.
 * Handles messy text with timestamp brackets: [YYYY-MM-DD HH:MM:SS] Action description;
 * Even works across multiple lines and with or without semicolon delimiters.
 */
export function parseActionDetails(rawText: string): TimelineEvent[] {
  if (!rawText) return [];

  const timeline: TimelineEvent[] = [];
  
  // Lookahead regex to find [YYYY-MM-DD HH:MM:SS] and capture everything up to the next timestamp or end of text.
  const regex = /\[(\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2})\]\s*([\s\S]*?)(?=\[(\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2})\]|$)/g;
  
  let match;
  while ((match = regex.exec(rawText)) !== null) {
    const timestamp = match[1].trim();
    let action = match[2].trim();
    
    // Clean up trailing semicolons or comma separators often found in logs
    action = action.replace(/;\s*$/, '').replace(/,\s*$/, '').trim();
    
    if (timestamp && action) {
      timeline.push({ timestamp, action });
    }
  }

  // If regex parsing didn't find any standard timestamps, but text exists, treat the entire text as one initial action
  if (timeline.length === 0 && rawText.trim().length > 0) {
    timeline.push({
      timestamp: 'N/A',
      action: rawText.trim()
    });
  }

  // Sort timeline events chronologically (or preserve order as in log)
  return timeline;
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
