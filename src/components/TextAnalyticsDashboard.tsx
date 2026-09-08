import React, { useState, useMemo, useEffect } from 'react';
import {
  FileSpreadsheet,
  Download,
  Upload,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Smile,
  Frown,
  Meh,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Sparkles,
  BarChart2,
  BarChart3,
  Layers,
  Presentation,
  FileText,
  Copy,
  SlidersHorizontal,
  ExternalLink,
  Edit3,
  MoreVertical,
  Info,
  X,
  LayoutGrid,
  MessageSquare,
  Eye,
  Quote,
  ArrowUpRight,
  Check,
  Calendar,
  RotateCcw
} from 'lucide-react';
import {
  TopicSentimentRecord,
  TopicAnalyticsItem,
  SentimentType,
  TopicHighlightSummary,
  ContributingSurveyPhrase,
  VoCRecord
} from '../types';
import {
  RAW_SAMPLE_CSV,
  parseCSV,
  deduplicateRecords,
  aggregateTopicAnalytics,
  getDefaultTopicHighlights,
  TOPIC_AI_SUMMARIES,
  generateRealisticResponseDate
} from '../utils/textAnalyticsData';
import {
  syncTopicRecordsWithVoCLookup
} from '../utils/vocDateLookup';
import { exportTextAnalyticsToPowerPoint } from '../utils/textAnalyticsPptx';
import * as XLSX from 'xlsx';

interface TextAnalyticsDashboardProps {
  vocRecords?: VoCRecord[];
  onBackToVoC?: () => void;
}

export const TextAnalyticsDashboard: React.FC<TextAnalyticsDashboardProps> = ({ vocRecords, onBackToVoC }) => {
  // Sync status tracking between VoC Survey Records and Text Analytics Survey IDs
  const [vocSyncStatus, setVocSyncStatus] = useState<{ matchedCount: number; totalVoCLinked: number }>({
    matchedCount: 0,
    totalVoCLinked: 0
  });
  const [syncToastMessage, setSyncToastMessage] = useState<string | null>(null);

  // Persistence state with deduplication by surveyID + topic/theme + phrase
  const [records, setRecords] = useState<TopicSentimentRecord[]>(() => {
    let initialRecords: TopicSentimentRecord[] = [];
    const saved = localStorage.getItem('dhl_voc_topic_sentiment_records');
    if (saved) {
      try {
        const parsed: TopicSentimentRecord[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          initialRecords = parsed;
        }
      } catch {
        // fallback
      }
    }
    if (initialRecords.length === 0) {
      initialRecords = parseCSV(RAW_SAMPLE_CSV);
    }

    // Deduplicate records
    const deduped = deduplicateRecords(initialRecords);

    // Initial VoC lookup sync using surveyID
    const { updatedRecords } = syncTopicRecordsWithVoCLookup(deduped, vocRecords);
    return updatedRecords;
  });

  // Re-sync with VoC Survey Records whenever vocRecords changes or on mount
  useEffect(() => {
    const { updatedRecords, matchedCount, totalVoCLinked } = syncTopicRecordsWithVoCLookup(records, vocRecords);
    setVocSyncStatus({ matchedCount, totalVoCLinked });
    const hasChanges = updatedRecords.some((r, idx) => r.responseDate !== records[idx]?.responseDate);
    if (hasChanges) {
      setRecords(updatedRecords);
      try {
        localStorage.setItem('dhl_voc_topic_sentiment_records', JSON.stringify(updatedRecords));
      } catch {
        // ignore
      }
    }
  }, [vocRecords]);

  // Handler for manual VoC Survey Records date re-sync
  const handleManualVoCDateSync = () => {
    const { updatedRecords, matchedCount, totalVoCLinked } = syncTopicRecordsWithVoCLookup(records, vocRecords);
    setRecords(updatedRecords);
    try {
      localStorage.setItem('dhl_voc_topic_sentiment_records', JSON.stringify(updatedRecords));
    } catch {
      // ignore
    }
    setVocSyncStatus({ matchedCount, totalVoCLinked });
    setSyncToastMessage(
      `✓ Successfully linked ${matchedCount} survey records with interactive dates from VoC Survey Records by Survey ID!`
    );
    setTimeout(() => setSyncToastMessage(null), 4500);
  };

  // Min and Max dates across records
  const { minDate, maxDate } = useMemo(() => {
    let min = '';
    let max = '';
    if (records.length > 0) {
      records.forEach(r => {
        if (r.responseDate && r.responseDate.length >= 10) {
          const d = r.responseDate.substring(0, 10);
          if (!min || d < min) min = d;
          if (!max || d > max) max = d;
        }
      });
    }
    return { minDate: min || '2026-03-01', maxDate: max || '2026-07-31' };
  }, [records]);

  const [startDate, setStartDate] = useState<string>('2026-06-01');
  const [endDate, setEndDate] = useState<string>('2026-07-31');

  // Format date range text for subtitle and exports (e.g. 06/01/26 to 07/31/26)
  const formatDateRangeDisplay = (start: string, end: string) => {
    const fmt = (dStr: string) => {
      if (!dStr) return '';
      const parts = dStr.split('-');
      if (parts.length === 3) {
        return `${parts[1]}/${parts[2]}/${parts[0].slice(-2)}`;
      }
      return dStr;
    };
    return `${fmt(start)} to ${fmt(end)}`;
  };

  // Filter records by date range
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      if (!r.responseDate) return false;
      const d = r.responseDate.substring(0, 10);
      if (startDate && d < startDate) return false;
      if (endDate && d > endDate) return false;
      return true;
    });
  }, [records, startDate, endDate]);

  const isAllTime = filteredRecords.length === records.length && (
    (!startDate || startDate <= minDate) && (!endDate || endDate >= maxDate)
  );

  const [activeTab, setActiveTab] = useState<'top_bottom' | 'summary' | 'iccc' | 'upload'>('top_bottom');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSentiment, setSelectedSentiment] = useState<string>('ALL');
  const [selectedParentTopic, setSelectedParentTopic] = useState<string | null>(null);
  const [selectedSubTopic, setSelectedSubTopic] = useState<string | null>(null);
  const [expandedParents, setExpandedParents] = useState<Record<string, boolean>>({
    Brand: true,
    People: true,
    Delivery: true,
    'Customs Clearance': true
  });

  // Top/Bottom View controls
  const [isTopBottomExpanded, setIsTopBottomExpanded] = useState(true);
  const [topBottomDisplayMode, setTopBottomDisplayMode] = useState<'table' | 'chart'>('table');
  const [viewTopicSummaryModal, setViewTopicSummaryModal] = useState<string | null>(null);

  // Pill Style Generator for Screenshot 1 Impact Score Bars
  const getImpactPillStyle = (score: number): { bg: string; text: string } => {
    if (score >= 6.0) return { bg: '#48BB78', text: '#0F172A' }; // Solid Green (+6.9)
    if (score >= 3.0) return { bg: '#68D391', text: '#0F172A' }; // Green (+4.0)
    if (score >= 2.0) return { bg: '#68D391', text: '#0F172A' }; // Green (+2.4)
    if (score >= 1.5) return { bg: '#9AE6B4', text: '#0F172A' }; // Light Green (+1.8, +1.5)
    if (score >= 1.0) return { bg: '#C6F6D5', text: '#0F172A' }; // Light Pastel Green (+1.3)
    if (score >= 0.0) return { bg: '#E6FFFA', text: '#0F172A' }; // Very Light Mint (+0.8)

    if (score <= -4.0) return { bg: '#E53E3E', text: '#0F172A' }; // Solid Coral Red (-4.7)
    if (score <= -2.4) return { bg: '#F56565', text: '#0F172A' }; // Coral Red (-2.9, -2.7, -2.5)
    if (score <= -1.5) return { bg: '#FEB2B2', text: '#0F172A' }; // Light Coral Red (-2.1, -1.6)
    return { bg: '#FED7D7', text: '#0F172A' }; // Light Pastel Red (-1.3)
  };

  // Custom highlights for ICCC+ Executive slide
  const [highlights, setHighlights] = useState<{
    top3: TopicHighlightSummary[];
    bottom3: TopicHighlightSummary[];
  }>(() => {
    const saved = localStorage.getItem('dhl_voc_topic_highlights');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Automatically reset stale cache if bottom3 still has 'People' or 'Delivery' or lacks contributingPhrases or has outdated counts
        if (
          parsed &&
          Array.isArray(parsed.bottom3) &&
          (parsed.bottom3.some((b: any) => b.topic === 'People' || b.topic === 'Delivery') ||
           !parsed.top3?.[0]?.subTopicHighlights?.[0]?.contributingPhrases ||
           !parsed.bottom3?.[0]?.subTopicHighlights?.[0]?.contributingPhrases ||
           parsed.bottom3?.[0]?.subTopicHighlights?.[0]?.caseCount === 85 ||
           parsed.bottom3?.[0]?.subTopicHighlights?.[0]?.impactScore === -4.7)
        ) {
          const fresh = getDefaultTopicHighlights();
          localStorage.setItem('dhl_voc_topic_highlights', JSON.stringify(fresh));
          return fresh;
        }
        return parsed;
      } catch {
        // fallback
      }
    }
    return getDefaultTopicHighlights();
  });

  const [showAllChartFrictionTopics, setShowAllChartFrictionTopics] = useState(false);
  const [isEditingHighlights, setIsEditingHighlights] = useState(false);
  const [pasteCSVText, setPasteCSVText] = useState('');
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Case Detail Hint & Modal State
  const [selectedHighlightDetail, setSelectedHighlightDetail] = useState<{
    topic: string;
    aspect: string;
    summary: string;
    type: 'top' | 'bottom';
    impactScore?: number;
    caseCount?: number;
    contributingPhrases?: ContributingSurveyPhrase[];
  } | null>(null);
  const [caseModalSearch, setCaseModalSearch] = useState('');
  const [caseModalSentiment, setCaseModalSentiment] = useState<'ALL' | 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL'>('ALL');
  const [copiedSurveyId, setCopiedSurveyId] = useState<string | null>(null);

  // Helper to extract matching cases for any (topic, aspect)
  const getMatchingCasesForAspect = (topic: string, aspect: string, summary?: string) => {
    const normTopic = topic.toLowerCase();
    const normAspect = aspect.toLowerCase();

    // 1. Exact matcher for Customs Clearance - Duties/Taxes/Fees
    if (
      normTopic.includes('dut') ||
      normTopic.includes('tax') ||
      normTopic.includes('fee') ||
      normAspect.includes('dut') ||
      normAspect.includes('tax') ||
      normAspect.includes('storage charge') ||
      normAspect.includes('ppwk')
    ) {
      return filteredRecords.filter(r =>
        (r.topicTheme || '').includes('Customs Clearance - Duties/Taxes/Fees') ||
        (r.subTopic || '').includes('Duties/Taxes/Fees') ||
        (r.parentTopic === 'Customs Clearance' && (
          (r.subTopic || '').toLowerCase().includes('dut') ||
          (r.subTopic || '').toLowerCase().includes('tax') ||
          (r.subTopic || '').toLowerCase().includes('fee')
        ))
      );
    }

    // 2. Customs Clearance - Process
    if (
      normTopic === 'process' ||
      normTopic.includes('clearance process') ||
      (normTopic.includes('custom') && normAspect.includes('process')) ||
      normAspect.includes('clearance delay')
    ) {
      return filteredRecords.filter(r =>
        (r.topicTheme || '').includes('Customs Clearance - Process') ||
        (r.parentTopic === 'Customs Clearance' && (r.subTopic || '').toLowerCase() === 'process')
      );
    }

    // 3. Customs Clearance - Payment
    if (
      normTopic.includes('payment') &&
      (normTopic.includes('custom') || normAspect.includes('custom') || normAspect.includes('duty') || normAspect.includes('processing'))
    ) {
      return filteredRecords.filter(r =>
        (r.topicTheme || '').includes('Customs Clearance - Payment') ||
        (r.parentTopic === 'Customs Clearance' && (r.subTopic || '').toLowerCase().includes('payment'))
      );
    }

    // 4. Price - Value for money
    if (normTopic.includes('price') || normTopic.includes('value for money') || normAspect.includes('shipping rate') || normAspect.includes('surcharge')) {
      return filteredRecords.filter(r =>
        (r.topicTheme || '').includes('Price - Value for money') ||
        (r.parentTopic === 'Price' && (r.subTopic || '').toLowerCase().includes('value'))
      );
    }

    // 5. Relationship - Overall Relationship
    if (normTopic.includes('relationship')) {
      return filteredRecords.filter(r =>
        (r.topicTheme || '').includes('Relationship') ||
        (r.parentTopic === 'Relationship')
      );
    }

    // 6. Generic Payment
    if (normTopic.includes('payment')) {
      return filteredRecords.filter(r =>
        (r.subTopic || '').toLowerCase().includes('payment') ||
        (r.topicTheme || '').toLowerCase().includes('payment') ||
        (r.phrase || '').toLowerCase().includes('payment')
      );
    }

    return filteredRecords.filter(r => {
      const parent = (r.parentTopic || '').toLowerCase();
      const sub = (r.subTopic || '').toLowerCase();
      const theme = (r.topicTheme || '').toLowerCase();
      const phrase = (r.phrase || '').toLowerCase();
      const comment = (r.comment || '').toLowerCase();

      // 1. Check if topic matches
      const topicMatches =
        parent.includes(normTopic) ||
        normTopic.includes(parent) ||
        theme.includes(normTopic) ||
        normTopic.includes(sub) ||
        sub.includes(normTopic) ||
        normTopic.split(/[\s/]+/).some(w => w.length > 2 && (parent.includes(w) || theme.includes(w)));

      if (!topicMatches) return false;

      // 2. Filter by aspect keywords if specified
      if (normAspect.includes('overall') || normAspect.includes('satisfaction')) {
        return (
          theme.includes('satisfaction') ||
          phrase.includes('satisfaction') ||
          phrase.includes('service') ||
          phrase.includes('quality') ||
          phrase.includes('good') ||
          comment.includes('service') ||
          comment.includes('quality') ||
          r.mainScore >= 8
        );
      }
      if (normAspect.includes('recommend')) {
        return (
          theme.includes('recommend') ||
          phrase.includes('recommend') ||
          comment.includes('recommend') ||
          r.mainScore >= 9
        );
      }
      if (normAspect.includes('polite') || normAspect.includes('help')) {
        return (
          phrase.includes('polite') ||
          phrase.includes('help') ||
          phrase.includes('care') ||
          phrase.includes('support') ||
          phrase.includes('friendly') ||
          phrase.includes('nice') ||
          comment.includes('telegram') ||
          comment.includes('call') ||
          comment.includes('helpful') ||
          sub.includes('knowledge') ||
          parent.includes('people')
        );
      }
      if (normAspect.includes('timeliness') || normAspect.includes('speed') || normAspect.includes('time')) {
        return (
          phrase.includes('time') ||
          phrase.includes('speed') ||
          phrase.includes('fast') ||
          phrase.includes('delay') ||
          phrase.includes('transit') ||
          comment.includes('fast') ||
          comment.includes('time') ||
          sub.includes('timeliness')
        );
      }
      if (normAspect.includes('instruction') || normAspect.includes('modification')) {
        return (
          theme.includes('instruction') ||
          theme.includes('delivery') ||
          phrase.includes('instruction') ||
          phrase.includes('trouble') ||
          comment.includes('delivery') ||
          comment.includes('fill')
        );
      }

      // Default: match topic records
      return true;
    });
  };

  // Handler to copy Survey ID
  const handleCopySurveyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedSurveyId(id);
    setTimeout(() => setCopiedSurveyId(null), 2000);
  };

  // Compute aggregated topic analytics based on date-filtered records
  const analytics = useMemo(() => {
    return aggregateTopicAnalytics(filteredRecords, isAllTime);
  }, [filteredRecords, isAllTime]);

  // Save to local storage whenever records or highlights change (with deduplication)
  const saveRecords = (newRecords: TopicSentimentRecord[]) => {
    const deduped = deduplicateRecords(newRecords);
    const { updatedRecords } = syncTopicRecordsWithVoCLookup(deduped, vocRecords);
    setRecords(updatedRecords);
    localStorage.setItem('dhl_voc_topic_sentiment_records', JSON.stringify(updatedRecords));
  };

  const saveHighlights = (newHighlights: typeof highlights) => {
    setHighlights(newHighlights);
    localStorage.setItem('dhl_voc_topic_highlights', JSON.stringify(newHighlights));
  };

  // Derive top topics highlights strictly from the top topics impact listed in the chart
  const effectiveTopHighlights = useMemo(() => {
    // Top topics that appear in the top topics impact chart
    const chartTopics = analytics.topSubTopics.slice(0, 3);
    const defaultTop = getDefaultTopicHighlights().top3;

    return chartTopics.map(t => {
      const topicLabel = t.subTopic || t.name.replace(/^.*-\s*/, '');
      const parentLabel = t.parentTopic || 'General';

      // Look for user edited highlight in highlights.top3
      const existing = highlights.top3.find(
        h => h.topic.toLowerCase() === topicLabel.toLowerCase() ||
             h.topic.toLowerCase() === t.name.toLowerCase() ||
             h.topic.toLowerCase() === parentLabel.toLowerCase() ||
             h.subTopicHighlights?.some(sh => sh.aspect.toLowerCase() === topicLabel.toLowerCase())
      );

      // Look for matching baseline in defaultTop
      const matchedDefault = defaultTop.find(
        d => d.topic.toLowerCase() === topicLabel.toLowerCase() ||
             d.topic.toLowerCase() === t.name.toLowerCase() ||
             d.topic.toLowerCase() === parentLabel.toLowerCase() ||
             d.subTopicHighlights?.some(sh => sh.aspect.toLowerCase() === topicLabel.toLowerCase())
      );

      const matchedDefaultAspect = matchedDefault?.subTopicHighlights?.find(
        sh => sh.aspect.toLowerCase() === topicLabel.toLowerCase() ||
              topicLabel.toLowerCase().includes(sh.aspect.toLowerCase()) ||
              sh.aspect.toLowerCase().includes(topicLabel.toLowerCase())
      ) || matchedDefault?.subTopicHighlights?.[0];

      // Look in TOPIC_AI_SUMMARIES
      const aiSummaryObj = TOPIC_AI_SUMMARIES[t.name] || 
        Object.entries(TOPIC_AI_SUMMARIES).find(([k]) => 
          k.toLowerCase().includes(topicLabel.toLowerCase()) || 
          topicLabel.toLowerCase().includes(k.toLowerCase())
        )?.[1];

      let subTopicHighlights = existing?.subTopicHighlights;

      if (!subTopicHighlights || subTopicHighlights.length === 0) {
        const fallbackSummary = aiSummaryObj?.summary || 
          (t.samplePhrases && t.samplePhrases.length > 0 
            ? t.samplePhrases.slice(0, 2).map(sp => sp.phrase || sp.comment).join('. ') + '.'
            : `Customer feedback highlights strong positive sentiment for ${topicLabel} with an impact score of +${t.impactScore.toFixed(1)}.`);

        const contributingPhrases = (t.samplePhrases && t.samplePhrases.length > 0)
          ? t.samplePhrases.slice(0, 5).map(sp => ({
              surveyId: sp.surveyId,
              score: sp.score,
              sentiment: (sp.sentiment || 'POSITIVE') as any,
              respondentType: 'Verified Customer',
              selectedPhrase: sp.phrase,
              fullComment: sp.comment || sp.phrase
            }))
          : (matchedDefaultAspect?.contributingPhrases || []);

        subTopicHighlights = [
          {
            aspect: topicLabel,
            parentTopic: parentLabel,
            summary: fallbackSummary,
            impactScore: t.impactScore,
            caseCount: t.volume,
            contributingPhrases
          }
        ];
      } else {
        // Ensure caseCount and impactScore follow the chart
        subTopicHighlights = subTopicHighlights.map((sh, sIdx) => {
          const defAspect = matchedDefaultAspect || matchedDefault?.subTopicHighlights?.[sIdx];
          const dynamicPhrases = (t.samplePhrases && t.samplePhrases.length > 0)
            ? t.samplePhrases.slice(0, 5).map(sp => ({
                surveyId: sp.surveyId,
                score: sp.score,
                sentiment: (sp.sentiment || 'POSITIVE') as any,
                respondentType: 'Verified Customer',
                selectedPhrase: sp.phrase,
                fullComment: sp.comment || sp.phrase
              }))
            : (defAspect?.contributingPhrases || sh.contributingPhrases || []);

          return {
            ...sh,
            aspect: sh.aspect || topicLabel,
            summary: sh.summary || aiSummaryObj?.summary || defAspect?.summary || 'Consistent positive customer feedback.',
            caseCount: isAllTime ? (defAspect?.caseCount ?? t.volume) : t.volume,
            impactScore: isAllTime ? (defAspect?.impactScore ?? t.impactScore) : t.impactScore,
            contributingPhrases: dynamicPhrases
          };
        });
      }

      return {
        topic: topicLabel,
        fullTopicName: t.name,
        parentTopic: parentLabel,
        impactScore: t.impactScore,
        subTopicHighlights
      };
    });
  }, [analytics.topSubTopics, highlights.top3, isAllTime]);

  // Update top highlights when edited in UI
  const handleUpdateTopHighlight = (topicLabel: string, sIdx: number, newSummary: string) => {
    const updated = { ...highlights };
    const tIdx = updated.top3.findIndex(
      t => t.topic.toLowerCase() === topicLabel.toLowerCase() ||
           topicLabel.toLowerCase().includes(t.topic.toLowerCase())
    );
    if (tIdx >= 0) {
      if (updated.top3[tIdx].subTopicHighlights[sIdx]) {
        updated.top3[tIdx].subTopicHighlights[sIdx].summary = newSummary;
      }
    } else {
      updated.top3.push({
        topic: topicLabel,
        subTopicHighlights: [{ aspect: topicLabel, summary: newSummary }]
      });
    }
    saveHighlights(updated);
  };

  // Derive bottom topics highlights strictly from the bottom topics impact listed in the chart
  const effectiveBottomHighlights = useMemo(() => {
    // Only topics that appear in the bottom topics impact chart
    const chartTopics = showAllChartFrictionTopics
      ? analytics.bottomSubTopics.slice(0, 4)
      : analytics.bottomSubTopics.slice(0, 3);

    const defaultBottom = getDefaultTopicHighlights().bottom3;

    return chartTopics.map(t => {
      const topicLabel = t.subTopic || t.name.replace(/^.*-\s*/, '');

      // Look for user edited highlight in highlights.bottom3
      const existing = highlights.bottom3.find(
        h => h.topic.toLowerCase() === topicLabel.toLowerCase() ||
             h.topic.toLowerCase() === t.name.toLowerCase() ||
             (h.topic.toLowerCase().includes('duty') && topicLabel.toLowerCase().includes('duty')) ||
             (h.topic.toLowerCase().includes('process') && topicLabel.toLowerCase().includes('process')) ||
             (h.topic.toLowerCase().includes('relationship') && topicLabel.toLowerCase().includes('relationship')) ||
             (h.topic.toLowerCase().includes('payment') && topicLabel.toLowerCase().includes('payment'))
      );

      // Look for matching baseline in defaultBottom
      const matchedDefault = defaultBottom.find(
        d => d.topic.toLowerCase() === topicLabel.toLowerCase() ||
             (d.topic.toLowerCase().includes('duty') && topicLabel.toLowerCase().includes('duty')) ||
             (d.topic.toLowerCase().includes('process') && topicLabel.toLowerCase().includes('process')) ||
             (d.topic.toLowerCase().includes('payment') && topicLabel.toLowerCase().includes('payment')) ||
             (d.topic.toLowerCase().includes('price') && topicLabel.toLowerCase().includes('money'))
      );

      let subTopicHighlights = existing?.subTopicHighlights || matchedDefault?.subTopicHighlights;

      if (!subTopicHighlights || subTopicHighlights.length === 0) {
        subTopicHighlights = [
          {
            aspect: 'Friction Highlight',
            summary: t.samplePhrases?.[0]?.comment || `Customer feedback indicates negative impact for ${topicLabel} with an impact score of ${t.impactScore.toFixed(1)}.`,
            impactScore: t.impactScore,
            caseCount: t.volume
          }
        ];
      } else {
        // Ensure contributingPhrases, caseCount, and impactScore are present
        subTopicHighlights = subTopicHighlights.map((sh, sIdx) => {
          const defAspect = matchedDefault?.subTopicHighlights?.[sIdx];
          return {
            ...sh,
            aspect: sh.aspect || defAspect?.aspect || 'Key Highlight',
            summary: sh.summary,
            caseCount: isAllTime ? (defAspect?.caseCount ?? t.volume) : t.volume,
            impactScore: isAllTime ? (defAspect?.impactScore ?? t.impactScore) : t.impactScore,
            contributingPhrases: (defAspect?.contributingPhrases && defAspect.contributingPhrases.length > 0) ? defAspect.contributingPhrases : (sh.contributingPhrases || [])
          };
        });
      }

      return {
        topic: topicLabel,
        fullTopicName: t.name,
        parentTopic: t.parentTopic,
        impactScore: t.impactScore,
        subTopicHighlights
      };
    });
  }, [analytics.bottomSubTopics, highlights.bottom3, showAllChartFrictionTopics, isAllTime]);

  // Update bottom highlights when edited in UI
  const handleUpdateBottomHighlight = (topicLabel: string, sIdx: number, newSummary: string) => {
    const updated = { ...highlights };
    const bIdx = updated.bottom3.findIndex(
      b => b.topic.toLowerCase() === topicLabel.toLowerCase() ||
           topicLabel.toLowerCase().includes(b.topic.toLowerCase())
    );
    if (bIdx >= 0) {
      if (updated.bottom3[bIdx].subTopicHighlights[sIdx]) {
        updated.bottom3[bIdx].subTopicHighlights[sIdx].summary = newSummary;
      }
    } else {
      updated.bottom3.push({
        topic: topicLabel,
        subTopicHighlights: [{ aspect: 'Friction Highlight', summary: newSummary }]
      });
    }
    saveHighlights(updated);
  };

  // Filtered phrases for feed
  const filteredPhrases = useMemo(() => {
    return filteredRecords.filter(r => {
      if (selectedSentiment !== 'ALL') {
        if (selectedSentiment === 'POSITIVE' && r.sentiment !== 'POSITIVE' && r.sentiment !== 'STRONGLY_POSITIVE') return false;
        if (selectedSentiment === 'NEGATIVE' && r.sentiment !== 'NEGATIVE') return false;
        if (selectedSentiment === 'NEUTRAL' && r.sentiment !== 'NEUTRAL' && r.sentiment !== 'NO_OPINION') return false;
        if (selectedSentiment === 'MIXED_OPINION' && r.sentiment !== 'MIXED_OPINION') return false;
      }
      if (selectedParentTopic && r.parentTopic !== selectedParentTopic) {
        return false;
      }
      if (selectedSubTopic && r.topicTheme !== selectedSubTopic) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          r.phrase.toLowerCase().includes(q) ||
          r.comment.toLowerCase().includes(q) ||
          r.topicTheme.toLowerCase().includes(q) ||
          r.surveyId.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [filteredRecords, selectedSentiment, selectedParentTopic, selectedSubTopic, searchQuery]);

  // PowerPoint Export Handlers
  const handleExportPPTX = async (option: 'all' | 'top_bottom' | 'summary' | 'iccc') => {
    try {
      setIsExporting(true);
      await exportTextAnalyticsToPowerPoint(
        analytics.topSubTopics,
        analytics.bottomSubTopics,
        analytics.parentTopics,
        {
          totalRecords: analytics.totalRecords,
          overallPosPercent: analytics.overallPosPercent,
          overallNegPercent: analytics.overallNegPercent,
          overallNeutralPercent: analytics.overallNeutralPercent,
          overallMixedPercent: analytics.overallMixedPercent
        },
        {
          top3: effectiveTopHighlights.map(eh => ({
            topic: eh.topic,
            subTopicHighlights: eh.subTopicHighlights
          })),
          bottom3: effectiveBottomHighlights.map(eh => ({
            topic: eh.topic,
            subTopicHighlights: eh.subTopicHighlights
          }))
        },
        option,
        formatDateRangeDisplay(startDate, endDate)
      );
    } catch (err) {
      console.error('Failed to export PPTX:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Excel Export Handler
  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Filtered Raw Records
    const rawWs = XLSX.utils.json_to_sheet(
      filteredRecords.map(r => ({
        'Survey ID': r.surveyId,
        'Response Date': r.responseDate || '',
        'Comment Field': r.commentField,
        'Full Comment': r.comment,
        'AI Phrase': r.phrase,
        'Topic/Theme': r.topicTheme,
        'Parent Topic': r.parentTopic,
        'Sub Topic': r.subTopic,
        'Sentiment': r.sentiment,
        'Score': r.mainScore,
        'Country': r.countryUnit
      }))
    );
    XLSX.utils.book_append_sheet(wb, rawWs, 'Phrase Records');

    // Sheet 2: Top & Bottom Topics
    const topWs = XLSX.utils.json_to_sheet(
      analytics.topSubTopics.map(t => ({
        'Topic Name': t.name,
        'Impact Score': `+${t.impactScore.toFixed(1)}`,
        'Volume': t.volume,
        '% Positive': `${t.percentPositive}%`,
        '% Negative': `${t.percentNegative}%`
      }))
    );
    XLSX.utils.book_append_sheet(wb, topWs, 'Top Topics');

    const botWs = XLSX.utils.json_to_sheet(
      analytics.bottomSubTopics.map(t => ({
        'Topic Name': t.name,
        'Impact Score': `${t.impactScore.toFixed(1)}`,
        'Volume': t.volume,
        '% Positive': `${t.percentPositive}%`,
        '% Negative': `${t.percentNegative}%`
      }))
    );
    XLSX.utils.book_append_sheet(wb, botWs, 'Bottom Topics');

    // Sheet 3: Report Filter & Summary
    const summaryWs = XLSX.utils.json_to_sheet([
      { 'Report Parameter': 'Time Period', 'Value': formatDateRangeDisplay(startDate, endDate) },
      { 'Report Parameter': 'Reporting Date Field', 'Value': 'Responsedate' },
      { 'Report Parameter': 'Total Dataset Volume', 'Value': records.length },
      { 'Report Parameter': 'Analyzed / Filtered Volume', 'Value': filteredRecords.length },
      { 'Report Parameter': 'Positive Sentiment Rate', 'Value': `${analytics.overallPosPercent}%` },
      { 'Report Parameter': 'Negative Sentiment Rate', 'Value': `${analytics.overallNegPercent}%` },
      { 'Report Parameter': 'Neutral Sentiment Rate', 'Value': `${analytics.overallNeutralPercent}%` },
      { 'Report Parameter': 'Mixed Opinion Rate', 'Value': `${analytics.overallMixedPercent}%` },
      { 'Report Parameter': 'Export Timestamp', 'Value': new Date().toISOString() }
    ]);
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Report Filter & Metadata');

    XLSX.writeFile(wb, `DHL_Text_Analytics_${startDate}_to_${endDate}.xlsx`);
  };

  // CSV File Ingestion
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = evt => {
      const content = evt.target?.result;
      if (typeof content === 'string') {
        const parsed = parseCSV(content);
        const deduped = deduplicateRecords(parsed);
        if (deduped.length > 0) {
          saveRecords(deduped);
          const dupCount = parsed.length - deduped.length;
          setUploadStatus(
            dupCount > 0
              ? `Successfully loaded ${deduped.length} unique phrase records (${dupCount} duplicate rows removed).`
              : `Successfully loaded ${deduped.length} unique phrase records!`
          );
          setActiveTab('top_bottom');
        } else {
          setUploadStatus('Could not parse valid records from CSV. Please check formatting.');
        }
      }
    };
    reader.readAsText(file);
  };

  const handlePasteSubmit = () => {
    if (!pasteCSVText.trim()) return;
    const parsed = parseCSV(pasteCSVText);
    const deduped = deduplicateRecords(parsed);
    if (deduped.length > 0) {
      saveRecords(deduped);
      const dupCount = parsed.length - deduped.length;
      setUploadStatus(
        dupCount > 0
          ? `Successfully parsed ${deduped.length} unique phrase records (${dupCount} duplicate rows removed).`
          : `Successfully parsed ${deduped.length} unique phrase records from pasted text.`
      );
      setPasteCSVText('');
      setActiveTab('top_bottom');
    } else {
      setUploadStatus('Failed to parse records. Ensure headers match the expected format.');
    }
  };

  const toggleParentExpand = (parentName: string) => {
    setExpandedParents(prev => ({ ...prev, [parentName]: !prev[parentName] }));
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Top Banner Navigation */}
      <header className="bg-slate-900 text-white shadow-md border-b border-slate-800 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-slate-950 font-black text-xl shadow-lg">
              AI
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-white tracking-tight">
                  VoC AI Text & Topic Analytics
                </h1>
                <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded-full font-semibold">
                  DHL Express Cambodia
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Driver Impact Analysis, Sentiment Scores & ICCC+ Executive Synthesis
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center flex-wrap gap-2">
            {onBackToVoC && (
              <button
                onClick={onBackToVoC}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
              >
                ← Back to Case CRM
              </button>
            )}

            {/* PowerPoint Export Dropdown */}
            <div className="relative group">
              <button
                disabled={isExporting}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-sm transition disabled:opacity-50"
              >
                <Presentation className="w-4 h-4 text-red-700" />
                {isExporting ? 'Generating PPTX...' : 'Download PPTX'}
                <ChevronDown className="w-3.5 h-3.5 opacity-70" />
              </button>
              <div className="absolute right-0 mt-1 w-64 bg-white text-slate-800 rounded-xl shadow-2xl border border-slate-200 py-1.5 hidden group-hover:block z-50 animate-fadeIn">
                <button
                  onClick={() => handleExportPPTX('all')}
                  className="w-full text-left px-4 py-2 text-xs font-semibold hover:bg-amber-50 hover:text-amber-900 flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Full 4-Slide Executive Deck (.pptx)
                </button>
                <button
                  onClick={() => handleExportPPTX('top_bottom')}
                  className="w-full text-left px-4 py-2 text-xs hover:bg-slate-50 flex items-center gap-2"
                >
                  <BarChart3 className="w-4 h-4 text-emerald-600" />
                  Slide 2: Top & Bottom Sub-Topics
                </button>
                <button
                  onClick={() => handleExportPPTX('summary')}
                  className="w-full text-left px-4 py-2 text-xs hover:bg-slate-50 flex items-center gap-2"
                >
                  <Layers className="w-4 h-4 text-indigo-600" />
                  Slide 3: Text Analytics Summary
                </button>
                <button
                  onClick={() => handleExportPPTX('iccc')}
                  className="w-full text-left px-4 py-2 text-xs hover:bg-red-50 text-red-700 font-semibold flex items-center gap-2"
                >
                  <FileText className="w-4 h-4 text-red-600" />
                  Slide 4: ICCC+ Top/Bottom Slide (Screenshot 3)
                </button>
              </div>
            </div>

            {/* Excel Download */}
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-700 hover:bg-emerald-600 text-white shadow-sm transition"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Export Excel
            </button>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 pt-1 pb-0 overflow-x-auto border-t border-slate-800/80">
          <button
            onClick={() => setActiveTab('top_bottom')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'top_bottom'
                ? 'border-amber-400 text-amber-300 bg-slate-800/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            1. Top & Bottom Sub-Topics
          </button>

          <button
            onClick={() => setActiveTab('summary')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'summary'
                ? 'border-amber-400 text-amber-300 bg-slate-800/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            2. Text Analytics Summary
          </button>

          <button
            onClick={() => setActiveTab('iccc')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'iccc'
                ? 'border-red-500 text-red-400 bg-slate-800/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Presentation className="w-4 h-4" />
            3. ICCC+ Executive Slide (Screenshot 3)
          </button>

          <button
            onClick={() => setActiveTab('upload')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'upload'
                ? 'border-amber-400 text-amber-300 bg-slate-800/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-4 h-4" />
            4. Data Ingestion & CSV Update ({records.length})
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Global Date Filter Bar (Responsedate Window) */}
        <div className="bg-white rounded-xl shadow-xs border border-slate-200/90 p-4 transition-all">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Left: Title & Pickers */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2.5 pr-3 border-r border-slate-200">
                <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                    <span>Date Filter</span>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">Responsedate</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Filter customer comments and topic impact by response date
                  </p>
                </div>
              </div>

              {/* Date Inputs */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 hover:border-slate-400 focus-within:border-amber-500 rounded-lg px-2.5 py-1.5 text-xs">
                  <span className="text-slate-500 font-medium">From:</span>
                  <input
                    type="date"
                    value={startDate}
                    min="2020-01-01"
                    max="2030-12-31"
                    onChange={e => setStartDate(e.target.value)}
                    className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer text-xs"
                  />
                </div>

                <span className="text-slate-400 font-bold text-xs">to</span>

                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 hover:border-slate-400 focus-within:border-amber-500 rounded-lg px-2.5 py-1.5 text-xs">
                  <span className="text-slate-500 font-medium">To:</span>
                  <input
                    type="date"
                    value={endDate}
                    min="2020-01-01"
                    max="2030-12-31"
                    onChange={e => setEndDate(e.target.value)}
                    className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer text-xs"
                  />
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => {
                    setStartDate('2026-01-01');
                    setEndDate('2026-07-31');
                  }}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition ${
                    startDate === '2026-01-01' && endDate === '2026-07-31'
                      ? 'bg-amber-500 text-slate-950 shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All (01/01 – 07/31)
                </button>
                <button
                  onClick={() => {
                    setStartDate('2026-06-01');
                    setEndDate('2026-07-31');
                  }}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition ${
                    startDate === '2026-06-01' && endDate === '2026-07-31'
                      ? 'bg-amber-500 text-slate-950 shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Full Period (06/01 – 07/31)
                </button>
                <button
                  onClick={() => {
                    setStartDate('2026-06-01');
                    setEndDate('2026-06-30');
                  }}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition ${
                    startDate === '2026-06-01' && endDate === '2026-06-30'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  June 2026
                </button>
                <button
                  onClick={() => {
                    setStartDate('2026-07-01');
                    setEndDate('2026-07-31');
                  }}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition ${
                    startDate === '2026-07-01' && endDate === '2026-07-31'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  July 2026
                </button>
                <button
                  onClick={() => {
                    setStartDate('2026-07-18');
                    setEndDate('2026-07-31');
                  }}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition ${
                    startDate === '2026-07-18' && endDate === '2026-07-31'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Last 14 Days
                </button>
              </div>

              {/* VoC Survey Records Lookup Button */}
              <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
                <button
                  onClick={handleManualVoCDateSync}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-700 bg-slate-100 hover:bg-amber-100 hover:text-amber-900 border border-slate-200 hover:border-amber-300 transition shadow-2xs"
                  title="Lookup and sync interactive dates from VoC Survey Records using Survey ID"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-amber-600" />
                  <span>Sync VoC Survey Dates</span>
                  {vocSyncStatus.matchedCount > 0 && (
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-1.5 py-0.2 rounded-full border border-emerald-200">
                      {vocSyncStatus.matchedCount} linked
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Right: Response count & Reset */}
            <div className="flex items-center gap-3 shrink-0 self-end lg:self-center">
              <div className="text-right">
                <div className="text-xs font-bold text-slate-800">
                  <span className="text-indigo-600 font-black">{filteredRecords.length.toLocaleString()}</span> / {records.length.toLocaleString()}
                  <span className="text-slate-500 font-normal ml-1">
                    ({records.length > 0 ? Math.round((filteredRecords.length / records.length) * 100) : 0}%)
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 font-medium">
                  Analyzed Responses
                </div>
              </div>

              {!isAllTime && (
                <button
                  onClick={() => {
                    setStartDate('2026-06-01');
                    setEndDate('2026-07-31');
                  }}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition"
                  title="Reset date filter to full time window"
                >
                  <X className="w-3.5 h-3.5" />
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Sync Toast Alert */}
        {syncToastMessage && (
          <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 px-4 py-2.5 rounded-xl text-xs font-medium flex items-center justify-between shadow-xs animate-in fade-in slide-in-from-top-1">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{syncToastMessage}</span>
            </div>
            <button
              onClick={() => setSyncToastMessage(null)}
              className="text-emerald-700 hover:text-emerald-900 text-xs font-bold px-2 py-0.5"
            >
              &times;
            </button>
          </div>
        )}

        {/* TAB 1: TOP & BOTTOM SUB-TOPICS (SCREENSHOT 1) */}
        {activeTab === 'top_bottom' && (
          <div className="space-y-6">
            {/* Medallia / DHL Style Top and Bottom Sub-Topics Card */}
            <div className="bg-white rounded-xl shadow-xs border border-slate-200/90 overflow-hidden">
              {/* Card Header matching Screenshot 1 */}
              <div className="px-6 py-4 flex flex-wrap items-center justify-between border-b border-slate-100 gap-3">
                <div className="flex items-start gap-2.5">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-1.5">
                        Top and Bottom Sub-Topics
                      </h2>
                      <button
                        onClick={() => setIsTopBottomExpanded(!isTopBottomExpanded)}
                        className="text-slate-400 hover:text-slate-600 transition"
                        title={isTopBottomExpanded ? "Collapse card" : "Expand card"}
                      >
                        {isTopBottomExpanded ? (
                          <ChevronUp className="w-4 h-4 text-indigo-600" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 font-semibold text-slate-800 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded text-xs">
                        <Calendar className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        Time Period: {formatDateRangeDisplay(startDate, endDate)}
                      </span>
                      <span className="text-slate-300">|</span>
                      <span>Reporting Date: Responsedate</span>
                      <span className="text-slate-300">|</span>
                      <span>Question: Main Score incl. Social</span>
                      {!isAllTime && (
                        <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200/70 px-2 py-0.5 rounded-full">
                          Showing {filteredRecords.length} of {records.length} records
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Right controls */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                    <button
                      onClick={() => setTopBottomDisplayMode('chart')}
                      title="Bar chart view"
                      className={`p-1.5 rounded-md text-xs font-semibold transition ${
                        topBottomDisplayMode === 'chart'
                          ? 'bg-white text-indigo-700 shadow-xs'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      <BarChart2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setTopBottomDisplayMode('table')}
                      title="Table matrix view"
                      className={`p-1.5 rounded-md text-xs font-semibold transition ${
                        topBottomDisplayMode === 'table'
                          ? 'bg-white text-indigo-700 shadow-xs'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    onClick={() => handleExportPPTX('top_bottom')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 transition shadow-2xs"
                  >
                    <Presentation className="w-3.5 h-3.5 text-red-600" />
                    Export Slide (.pptx)
                  </button>

                  <button
                    onClick={() => handleExportExcel()}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition"
                    title="Export table to Excel"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  </button>
                </div>
              </div>

              {/* Collapsible Content */}
              {isTopBottomExpanded && (
                <div>
                  {topBottomDisplayMode === 'table' ? (
                    /* Two Column Exact Matrix matching Screenshot 1 */
                    <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-200/80">
                      {/* LEFT COLUMN: TOP TOPICS */}
                      <div className="p-6 space-y-4">
                        {/* Column Header */}
                        <div className="flex items-center justify-between text-xs font-bold text-slate-800 pb-2 border-b border-slate-100">
                          <span className="w-1/2">Top Topics</span>
                          <span className="w-1/4 text-center flex items-center justify-center gap-1 text-indigo-600 font-semibold">
                            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                            Summary
                          </span>
                          <span className="w-1/4 text-right flex items-center justify-end gap-1 text-slate-600">
                            Impact Score
                            <Info className="w-3 h-3 text-slate-400" />
                          </span>
                        </div>

                        {/* Top Topics Rows (7 exact benchmark rows) */}
                        <div className="space-y-3">
                          {analytics.topSubTopics.slice(0, 7).map((item) => {
                            const pillStyle = getImpactPillStyle(item.impactScore);
                            return (
                              <div
                                key={item.name}
                                className="flex items-center justify-between text-xs py-1 hover:bg-slate-50/80 rounded-lg px-1.5 transition group"
                              >
                                {/* Topic Name */}
                                <div className="w-1/2 pr-2">
                                  <button
                                    onClick={() => {
                                      setSelectedSubTopic(item.name);
                                      setActiveTab('summary');
                                    }}
                                    className="text-left font-semibold text-indigo-600 hover:text-indigo-800 hover:underline truncate block w-full"
                                    title={item.name}
                                  >
                                    {item.name}
                                  </button>
                                </div>

                                {/* Summary: View */}
                                <div className="w-1/4 text-center">
                                  <button
                                    onClick={() => setViewTopicSummaryModal(item.name)}
                                    className="text-indigo-600 hover:text-indigo-800 font-medium hover:underline inline-flex items-center gap-0.5"
                                  >
                                    View
                                  </button>
                                </div>

                                {/* Impact Score Pill */}
                                <div className="w-1/4 flex justify-end">
                                  <div
                                    style={{ backgroundColor: pillStyle.bg, color: pillStyle.text }}
                                    className="w-24 sm:w-28 py-1.5 px-3 rounded-lg text-right font-extrabold text-xs shadow-2xs transition-all flex items-center justify-end"
                                  >
                                    +{item.impactScore.toFixed(1)}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* RIGHT COLUMN: BOTTOM TOPICS */}
                      <div className="p-6 space-y-4">
                        {/* Column Header */}
                        <div className="flex items-center justify-between text-xs font-bold text-slate-800 pb-2 border-b border-slate-100">
                          <span className="w-1/2">Bottom Topics</span>
                          <span className="w-1/4 text-center flex items-center justify-center gap-1 text-indigo-600 font-semibold">
                            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                            Summary
                          </span>
                          <span className="w-1/4 text-right flex items-center justify-end gap-1 text-slate-600">
                            Impact Score
                            <Info className="w-3 h-3 text-slate-400" />
                          </span>
                        </div>

                        {/* Bottom Topics Rows (7 exact benchmark rows) */}
                        <div className="space-y-3">
                          {analytics.bottomSubTopics.slice(0, 7).map((item) => {
                            const pillStyle = getImpactPillStyle(item.impactScore);
                            return (
                              <div
                                key={item.name}
                                className="flex items-center justify-between text-xs py-1 hover:bg-slate-50/80 rounded-lg px-1.5 transition group"
                              >
                                {/* Topic Name */}
                                <div className="w-1/2 pr-2">
                                  <button
                                    onClick={() => {
                                      setSelectedSubTopic(item.name);
                                      setActiveTab('summary');
                                    }}
                                    className="text-left font-semibold text-indigo-600 hover:text-indigo-800 hover:underline truncate block w-full"
                                    title={item.name}
                                  >
                                    {item.name}
                                  </button>
                                </div>

                                {/* Summary: View */}
                                <div className="w-1/4 text-center">
                                  <button
                                    onClick={() => setViewTopicSummaryModal(item.name)}
                                    className="text-indigo-600 hover:text-indigo-800 font-medium hover:underline inline-flex items-center gap-0.5"
                                  >
                                    View
                                  </button>
                                </div>

                                {/* Impact Score Pill */}
                                <div className="w-1/4 flex justify-end">
                                  <div
                                    style={{ backgroundColor: pillStyle.bg, color: pillStyle.text }}
                                    className="w-24 sm:w-28 py-1.5 px-3 rounded-lg text-right font-extrabold text-xs shadow-2xs transition-all flex items-center justify-end"
                                  >
                                    {item.impactScore.toFixed(1)}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Bar Chart Visual Mode */
                    <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Top Topics Chart */}
                      <div className="space-y-4">
                        <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Top Driver Sub-Topics</h4>
                        <div className="space-y-3">
                          {analytics.topSubTopics.slice(0, 7).map((item, idx) => {
                            const widthPct = Math.min(100, Math.max(10, (item.impactScore / 7.0) * 100));
                            return (
                              <div key={item.name} className="space-y-1">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="font-semibold text-slate-800">{idx + 1}. {item.name}</span>
                                  <span className="font-extrabold text-emerald-700">+{item.impactScore.toFixed(1)}</span>
                                </div>
                                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                                  <div style={{ width: `${widthPct}%` }} className="bg-emerald-500 h-full rounded-full" />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Bottom Topics Chart */}
                      <div className="space-y-4">
                        <h4 className="text-xs font-bold text-red-800 uppercase tracking-wider">Bottom Detractor Sub-Topics</h4>
                        <div className="space-y-3">
                          {analytics.bottomSubTopics.slice(0, 7).map((item, idx) => {
                            const widthPct = Math.min(100, Math.max(10, (Math.abs(item.impactScore) / 5.0) * 100));
                            return (
                              <div key={item.name} className="space-y-1">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="font-semibold text-slate-800">{idx + 1}. {item.name}</span>
                                  <span className="font-extrabold text-red-700">{item.impactScore.toFixed(1)}</span>
                                </div>
                                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                                  <div style={{ width: `${widthPct}%` }} className="bg-red-500 h-full rounded-full" />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Card Footer matching Screenshot 1 */}
                  <div className="px-6 py-3 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      Some content is generated by AI
                      <Info className="w-3 h-3 text-slate-400" />
                    </span>
                    <span className="text-slate-400">
                      Total Analyzed Responses: <strong>{filteredRecords.length.toLocaleString()}</strong>
                      {!isAllTime && (
                        <span className="text-slate-400 ml-1"> (of {records.length.toLocaleString()} total)</span>
                      )}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: TEXT ANALYTICS SUMMARY (SCREENSHOT 2) */}
        {activeTab === 'summary' && (
          <div className="space-y-6">
            {/* Top Sentiment Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div
                onClick={() => setSelectedSentiment(selectedSentiment === 'POSITIVE' ? 'ALL' : 'POSITIVE')}
                className={`cursor-pointer bg-white rounded-2xl p-5 border shadow-sm transition hover:shadow-md ${
                  selectedSentiment === 'POSITIVE' ? 'border-emerald-500 ring-2 ring-emerald-200' : 'border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Positive</span>
                  <Smile className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="mt-2 text-2xl font-black text-emerald-700">
                  {analytics.overallPosPercent}%
                </div>
                <div className="text-xs text-slate-500 mt-0.5 font-medium">
                  {filteredRecords.filter(r => r.sentiment === 'POSITIVE' || r.sentiment === 'STRONGLY_POSITIVE').length} of {filteredRecords.length} records
                </div>
              </div>

              <div
                onClick={() => setSelectedSentiment(selectedSentiment === 'NEGATIVE' ? 'ALL' : 'NEGATIVE')}
                className={`cursor-pointer bg-white rounded-2xl p-5 border shadow-sm transition hover:shadow-md ${
                  selectedSentiment === 'NEGATIVE' ? 'border-red-500 ring-2 ring-red-200' : 'border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-red-800 uppercase tracking-wider">Negative</span>
                  <Frown className="w-5 h-5 text-red-600" />
                </div>
                <div className="mt-2 text-2xl font-black text-red-700">
                  {analytics.overallNegPercent}%
                </div>
                <div className="text-xs text-slate-500 mt-0.5 font-medium">
                  {filteredRecords.filter(r => r.sentiment === 'NEGATIVE').length} of {filteredRecords.length} records
                </div>
              </div>

              <div
                onClick={() => setSelectedSentiment(selectedSentiment === 'MIXED_OPINION' ? 'ALL' : 'MIXED_OPINION')}
                className={`cursor-pointer bg-white rounded-2xl p-5 border shadow-sm transition hover:shadow-md ${
                  selectedSentiment === 'MIXED_OPINION' ? 'border-amber-500 ring-2 ring-amber-200' : 'border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">Mixed Opinion</span>
                  <Meh className="w-5 h-5 text-amber-600" />
                </div>
                <div className="mt-2 text-2xl font-black text-amber-700">
                  {analytics.overallMixedPercent}%
                </div>
                <div className="text-xs text-slate-500 mt-0.5 font-medium">
                  {filteredRecords.filter(r => r.sentiment === 'MIXED_OPINION').length} records
                </div>
              </div>

              <div
                onClick={() => setSelectedSentiment(selectedSentiment === 'NEUTRAL' ? 'ALL' : 'NEUTRAL')}
                className={`cursor-pointer bg-white rounded-2xl p-5 border shadow-sm transition hover:shadow-md ${
                  selectedSentiment === 'NEUTRAL' ? 'border-slate-500 ring-2 ring-slate-200' : 'border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Neutral</span>
                  <Meh className="w-5 h-5 text-slate-500" />
                </div>
                <div className="mt-2 text-2xl font-black text-slate-800">
                  {analytics.overallNeutralPercent}%
                </div>
                <div className="text-xs text-slate-500 mt-0.5 font-medium">
                  {filteredRecords.filter(r => r.sentiment === 'NEUTRAL' || r.sentiment === 'NO_OPINION').length} records
                </div>
              </div>
            </div>

            {/* Split Screen: Topics Matrix Table (Left) + Filtered Phrases & Comments (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Topics Breakdown Table (7 cols) */}
              <div className="lg:col-span-7 bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900">
                    Topic Hierarchy Matrix
                  </h3>
                  <div className="flex items-center gap-2 text-xs">
                    {selectedParentTopic && (
                      <button
                        onClick={() => {
                          setSelectedParentTopic(null);
                          setSelectedSubTopic(null);
                        }}
                        className="text-amber-700 hover:underline font-semibold"
                      >
                        Clear topic filter ({selectedParentTopic})
                      </button>
                    )}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-900 text-white uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="py-2.5 px-3 rounded-l-lg">Topic</th>
                        <th className="py-2.5 px-2 text-center">Volume</th>
                        <th className="py-2.5 px-2 text-center">Change</th>
                        <th className="py-2.5 px-2 text-center">% Responses</th>
                        <th className="py-2.5 px-2 text-center">% Pos</th>
                        <th className="py-2.5 px-2 text-center">% Neg</th>
                        <th className="py-2.5 px-3 text-center rounded-r-lg">Impact</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {analytics.parentTopics.map(pt => {
                        const isExpanded = expandedParents[pt.name];
                        const isSelected = selectedParentTopic === pt.name;
                        const isPos = pt.impactScore >= 0;

                        return (
                          <React.Fragment key={pt.name}>
                            <tr
                              onClick={() => {
                                setSelectedParentTopic(isSelected ? null : pt.name);
                                setSelectedSubTopic(null);
                              }}
                              className={`cursor-pointer transition hover:bg-amber-50/60 ${
                                isSelected ? 'bg-amber-100/70 font-bold' : ''
                              }`}
                            >
                              <td className="py-2.5 px-3 text-slate-900 flex items-center gap-1.5 font-bold">
                                {pt.subTopics && pt.subTopics.length > 0 ? (
                                  <button
                                    type="button"
                                    onClick={e => {
                                      e.stopPropagation();
                                      toggleParentExpand(pt.name);
                                    }}
                                    className="text-slate-400 hover:text-slate-700"
                                  >
                                    {isExpanded ? (
                                      <ChevronDown className="w-3.5 h-3.5" />
                                    ) : (
                                      <ChevronRight className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                ) : (
                                  <span className="w-3.5 inline-block" />
                                )}
                                {pt.name}
                              </td>
                              <td className="py-2.5 px-2 text-center text-slate-700 font-semibold">{pt.volume}</td>
                              <td className="py-2.5 px-2 text-center text-slate-500 text-[10px]">{pt.volumeChange}</td>
                              <td className="py-2.5 px-2 text-center text-slate-600">{pt.percentOfResponses}%</td>
                              <td className="py-2.5 px-2 text-center font-bold text-emerald-600">
                                {pt.percentPositive > 0 ? `${pt.percentPositive}%` : '-'}
                              </td>
                              <td className="py-2.5 px-2 text-center font-bold text-red-600">
                                {pt.percentNegative > 0 ? `${pt.percentNegative}%` : '-'}
                              </td>
                              <td className="py-2.5 px-3 text-center font-black">
                                {pt.volume === 0 ? (
                                  <span className="text-slate-400">-</span>
                                ) : (
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-[11px] ${
                                      isPos
                                        ? 'text-emerald-700 bg-emerald-100'
                                        : 'text-red-700 bg-red-100'
                                    }`}
                                  >
                                    {isPos ? `+${pt.impactScore.toFixed(1)}` : pt.impactScore.toFixed(1)}
                                  </span>
                                )}
                              </td>
                            </tr>

                            {/* Subtopics Rows */}
                            {isExpanded &&
                              pt.subTopics?.map(st => {
                                const isSubSelected = selectedSubTopic === st.name;
                                const isSubPos = st.impactScore >= 0;

                                return (
                                  <tr
                                    key={st.name}
                                    onClick={() => {
                                      setSelectedSubTopic(isSubSelected ? null : st.name);
                                      setSelectedParentTopic(pt.name);
                                    }}
                                    className={`cursor-pointer text-[11px] hover:bg-slate-100/70 transition ${
                                      isSubSelected ? 'bg-amber-100 font-bold' : 'bg-slate-50/50'
                                    }`}
                                  >
                                    <td className="py-2 px-3 pl-8 text-slate-700 flex items-center gap-1">
                                      <span className="w-1.5 h-1.5 rounded-full bg-slate-300 mr-1" />
                                      {st.subTopic}
                                    </td>
                                    <td className="py-2 px-2 text-center text-slate-600">{st.volume}</td>
                                    <td className="py-2 px-2 text-center text-slate-400 text-[10px]">{st.volumeChange}</td>
                                    <td className="py-2 px-2 text-center text-slate-500">{st.percentOfResponses}%</td>
                                    <td className="py-2 px-2 text-center text-emerald-600 font-semibold">
                                      {st.percentPositive}%
                                    </td>
                                    <td className="py-2 px-2 text-center text-red-600 font-semibold">
                                      {st.percentNegative}%
                                    </td>
                                    <td className="py-2 px-3 text-center">
                                      <span
                                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                          isSubPos
                                            ? 'text-emerald-700 bg-emerald-50'
                                            : 'text-red-700 bg-red-50'
                                        }`}
                                      >
                                        {isSubPos ? `+${st.impactScore.toFixed(1)}` : st.impactScore.toFixed(1)}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Right Column: Interactive Phrase / Comment Feed (5 cols) */}
              <div className="lg:col-span-5 bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col h-[650px]">
                <div className="border-b border-slate-100 pb-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-slate-900">
                      Live Customer Voice Stream
                    </h3>
                    <span className="text-xs bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-full">
                      {filteredPhrases.length} Mentions
                    </span>
                  </div>

                  {/* Search Bar inside Feed */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search phrases, comments, keywords..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>

                  {/* Active filters pill */}
                  {(selectedParentTopic || selectedSubTopic || selectedSentiment !== 'ALL') && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {selectedSentiment !== 'ALL' && (
                        <span className="text-[10px] bg-slate-800 text-white px-2 py-0.5 rounded-full font-semibold">
                          Sentiment: {selectedSentiment}
                        </span>
                      )}
                      {selectedParentTopic && (
                        <span className="text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full font-semibold">
                          {selectedParentTopic}
                        </span>
                      )}
                      {selectedSubTopic && (
                        <span className="text-[10px] bg-indigo-100 text-indigo-900 px-2 py-0.5 rounded-full font-semibold">
                          {selectedSubTopic}
                        </span>
                      )}
                      <button
                        onClick={() => {
                          setSelectedSentiment('ALL');
                          setSelectedParentTopic(null);
                          setSelectedSubTopic(null);
                        }}
                        className="text-[10px] text-red-600 hover:underline font-bold"
                      >
                        Reset All
                      </button>
                    </div>
                  )}
                </div>

                {/* Phrase Stream List */}
                <div className="flex-1 overflow-y-auto pt-3 space-y-3 pr-1">
                  {filteredPhrases.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-xs">
                      No phrases found matching selected filters.
                    </div>
                  ) : (
                    filteredPhrases.map(r => {
                      const isPos = r.sentiment === 'POSITIVE' || r.sentiment === 'STRONGLY_POSITIVE';
                      const isNeg = r.sentiment === 'NEGATIVE';

                      return (
                        <div
                          key={r.id}
                          className="bg-slate-50 hover:bg-amber-50/40 p-3.5 rounded-xl border border-slate-200 transition space-y-2"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              {isPos ? (
                                <Smile className="w-4 h-4 text-emerald-600 shrink-0" />
                              ) : isNeg ? (
                                <Frown className="w-4 h-4 text-red-600 shrink-0" />
                              ) : (
                                <Meh className="w-4 h-4 text-amber-600 shrink-0" />
                              )}
                              <span className="font-bold text-slate-800 text-[11px] truncate max-w-[200px]">
                                {r.topicTheme}
                              </span>
                            </div>
                            <span
                              className={`font-black text-xs px-2 py-0.5 rounded ${
                                r.mainScore >= 9
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : r.mainScore >= 7
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              Score: {r.mainScore}/10
                            </span>
                          </div>

                          {/* Extracted AI Phrase */}
                          <div className="text-xs text-slate-900 font-semibold bg-white p-2 rounded-lg border border-slate-100">
                            "{r.phrase}"
                          </div>

                          {/* Expandable full comment if different */}
                          {r.comment && r.comment !== r.phrase && (
                            <details className="text-[11px] text-slate-500">
                              <summary className="cursor-pointer text-amber-700 hover:underline font-medium">
                                View full customer feedback
                              </summary>
                              <p className="mt-1 text-slate-700 italic bg-amber-50/50 p-2 rounded border border-amber-100">
                                {r.comment}
                              </p>
                            </details>
                          )}

                          <div className="flex items-center justify-between text-[10px] text-slate-400">
                            <span>Survey ID: {r.surveyId}</span>
                            <span>{r.commentField}</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ICCC+ EXECUTIVE SLIDE PREVIEW (SCREENSHOT 3 EXACT REPLICA) */}
        {activeTab === 'iccc' && (
          <div className="space-y-6">
            {/* Header & Controls */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-black uppercase text-red-600 tracking-wider">
                  Executive Bi-Monthly Template
                </span>
                <h2 className="text-xl font-bold text-slate-900">
                  ICCC+ - Top and Bottom Topics Slide (Printscreen 3)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Replicates the exact layout with Top/Bottom charts, KPI percentages, and structured key highlight summary cards.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEditingHighlights(!isEditingHighlights)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  {isEditingHighlights ? 'Done Editing' : 'Edit Highlight Texts'}
                </button>

                <button
                  onClick={() => {
                    const fresh = getDefaultTopicHighlights();
                    saveHighlights(fresh);
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition"
                  title="Reset highlights to default calibrated topics matching the chart"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset Highlights
                </button>

                <button
                  onClick={() => handleExportPPTX('iccc')}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow transition"
                >
                  <Presentation className="w-4 h-4 text-amber-300" />
                  Download This Slide (.pptx)
                </button>
              </div>
            </div>

            {/* Slide Frame (Exact Visual Replica) */}
            <div className="bg-white rounded-2xl shadow-xl border-4 border-slate-800 p-8 space-y-6 max-w-6xl mx-auto font-sans">
              {/* Slide Top Bar */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    FOR INTERNAL USE
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black text-red-600 tracking-tight mt-0.5">
                    ICCC+ - Top and Bottom Topics
                  </h1>
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mt-1">
                    <span className="font-semibold text-slate-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60">
                      Time Period: {formatDateRangeDisplay(startDate, endDate)}
                    </span>
                    <span>•</span>
                    <span>Reporting Date: Responsedate</span>
                    {!isAllTime && (
                      <>
                        <span>•</span>
                        <span className="text-indigo-600 font-bold">
                          {filteredRecords.length} of {records.length} records analyzed
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <div className="text-lg font-black text-red-600">ICCC+</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Cambodia</div>
                  </div>
                </div>
              </div>

              {/* Upper Section: Mini Bar Chart & Right KPI Callout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                {/* Left Mini Charts */}
                <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Top Topics Chart */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-2xs">
                    <div className="text-xs font-bold text-emerald-800 mb-2 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        Top Topics Impact
                      </span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">+Impact Driver</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2 pt-2 pb-1 border-b border-slate-200">
                      {analytics.topSubTopics.slice(0, 4).map(t => {
                        const hPct = Math.min(100, Math.max(25, (t.impactScore / 7.8) * 100));
                        const label = t.subTopic || t.name.replace(/^.*-\s*/, '');
                        return (
                          <div key={t.name} className="flex flex-col items-center group">
                            {/* Score Number and Case Count above bar */}
                            <div className="flex flex-col items-center mb-1">
                              <span className="text-[11px] font-extrabold text-emerald-700 leading-none">
                                +{t.impactScore.toFixed(1)}
                              </span>
                              <span className="text-[8px] font-extrabold text-emerald-800/80 bg-emerald-100/90 px-1 py-0.2 rounded-full mt-0.5">
                                {t.volume} recs
                              </span>
                            </div>
                            {/* Bar container */}
                            <div className="h-16 w-full flex items-end justify-center px-1">
                              <div
                                style={{ height: `${hPct}%` }}
                                className="w-full bg-emerald-500 rounded-t-sm group-hover:bg-emerald-600 transition-all duration-300 shadow-2xs"
                              />
                            </div>
                            {/* Topic Name */}
                            <span className="text-[9px] text-slate-600 font-medium text-center line-clamp-2 leading-tight mt-1.5 h-6 flex items-center justify-center" title={t.name}>
                              {label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Bottom Topics Chart */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-2xs">
                    <div className="text-xs font-bold text-red-800 mb-2 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-red-500"></span>
                        Bottom Topics Impact
                      </span>
                      <span className="text-[10px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full border border-red-200">-Impact Friction</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2 pt-2 pb-1 border-b border-slate-200">
                      {analytics.bottomSubTopics.slice(0, 4).map(t => {
                        const hPct = Math.min(100, Math.max(25, (Math.abs(t.impactScore) / 4.7) * 100));
                        const label = t.subTopic || t.name.replace(/^.*-\s*/, '');
                        return (
                          <div key={t.name} className="flex flex-col items-center group">
                            {/* Score Number and Case Count above bar */}
                            <div className="flex flex-col items-center mb-1">
                              <span className="text-[11px] font-extrabold text-red-700 leading-none">
                                {t.impactScore.toFixed(1)}
                              </span>
                              <span className="text-[8px] font-extrabold text-red-800/80 bg-red-100/90 px-1 py-0.2 rounded-full mt-0.5">
                                {t.volume} recs
                              </span>
                            </div>
                            {/* Bar container */}
                            <div className="h-16 w-full flex items-end justify-center px-1">
                              <div
                                style={{ height: `${hPct}%` }}
                                className="w-full bg-red-500 rounded-t-sm group-hover:bg-red-600 transition-all duration-300 shadow-2xs"
                              />
                            </div>
                            {/* Topic Name */}
                            <span className="text-[9px] text-slate-600 font-medium text-center line-clamp-2 leading-tight mt-1.5 h-6 flex items-center justify-center" title={t.name}>
                              {label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Right KPI Callout (from Screenshot 1 Section 1.8) */}
                <div className="lg:col-span-4 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-3xl font-black text-emerald-600 leading-none">{analytics.overallPosPercent}%</div>
                      <div className="text-xs font-semibold text-slate-700 mt-1">
                        Positive (534 records)
                      </div>
                    </div>
                    <div>
                      <div className="text-3xl font-black text-red-600 leading-none">{analytics.overallNegPercent}%</div>
                      <div className="text-xs font-semibold text-slate-700 mt-1">
                        Negative (102 records)
                      </div>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600 font-medium">
                    <span>{analytics.overallMixedPercent}% Mixed Opinion</span>
                    <span>{analytics.overallNeutralPercent}% Neutral</span>
                  </div>
                </div>
              </div>

              {/* Lower Section: Dual Structured Summary Tables */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* TOP 3 TOPICS TABLE (GREEN HEADER) */}
                <div className="border border-emerald-300 rounded-xl overflow-hidden shadow-sm">
                  <div className="bg-emerald-600 text-white text-center py-2 text-xs font-black tracking-wider uppercase">
                    TOP 3 TOPICS
                  </div>
                  <div className="bg-slate-100 text-slate-800 text-[11px] font-bold grid grid-cols-12 px-3 py-1.5 border-b border-emerald-200">
                    <span className="col-span-3">Topics</span>
                    <span className="col-span-9">Key Highlights</span>
                  </div>

                  <div className="divide-y divide-slate-100 bg-white">
                    {effectiveTopHighlights.map((item, idx) => (
                      <div key={`${item.topic}_${idx}`} className="grid grid-cols-12 px-3 py-3 text-xs gap-2">
                        <div className="col-span-3 font-bold text-slate-900 flex items-start gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-1"></span>
                          <div>
                            <span className="text-slate-900 font-bold block">{item.topic}</span>
                            {item.parentTopic && item.parentTopic !== item.topic && item.parentTopic !== 'General' && (
                              <span className="text-[10px] text-slate-400 font-medium block">{item.parentTopic}</span>
                            )}
                          </div>
                        </div>
                        <div className="col-span-9 space-y-2 text-slate-700 text-[11px] leading-relaxed">
                          {item.subTopicHighlights.map((sh, sIdx) => {
                            const matchingCases = getMatchingCasesForAspect(item.topic, sh.aspect, sh.summary);
                            return (
                              <div key={sIdx}>
                                {isEditingHighlights ? (
                                  <div>
                                    <strong className="text-slate-900 font-semibold">{sh.aspect}: </strong>
                                    <textarea
                                      value={sh.summary}
                                      onChange={e => handleUpdateTopHighlight(item.topic, sIdx, e.target.value)}
                                      className="w-full text-xs p-1.5 rounded border border-slate-300 mt-1 font-sans"
                                      rows={2}
                                    />
                                  </div>
                                ) : (
                                  <div className="relative group/phrase inline-block w-full">
                                    <div
                                      onClick={() => setSelectedHighlightDetail({
                                        topic: item.topic,
                                        aspect: sh.aspect,
                                        summary: sh.summary,
                                        type: 'top',
                                        impactScore: sh.impactScore,
                                        caseCount: sh.caseCount,
                                        contributingPhrases: sh.contributingPhrases
                                      })}
                                      className="p-1.5 -m-1.5 rounded-lg hover:bg-emerald-50/80 border border-transparent hover:border-emerald-200 transition-all duration-150 cursor-pointer flex items-start justify-between gap-2"
                                    >
                                      <div>
                                        <strong className="text-slate-900 font-semibold">{sh.aspect}: </strong>
                                        <span className="text-slate-700">{sh.summary}</span>
                                      </div>
                                      <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/90 group-hover/phrase:bg-emerald-200 px-2 py-0.5 rounded-full border border-emerald-300/60 shadow-2xs transition">
                                        <Eye className="w-3 h-3" />
                                        {sh.caseCount ? `${sh.caseCount} phrases` : (matchingCases.length > 0 ? `${matchingCases.length} phrases` : 'View phrases')}
                                      </span>
                                    </div>

                                    {/* HOVER HINT POPUP - SHOW FULL DETAIL OF CONTRIBUTING PHRASES */}
                                    <div className="invisible group-hover/phrase:visible opacity-0 group-hover/phrase:opacity-100 transition-all duration-200 delay-75 absolute bottom-full left-0 mb-2 w-[480px] max-w-[92vw] max-h-[70vh] overflow-y-auto bg-slate-900/98 backdrop-blur-md text-white rounded-2xl p-4 shadow-2xl z-50 border border-slate-700 text-left">
                                      <div className="flex items-center justify-between border-b border-slate-700/80 pb-2 mb-2.5">
                                        <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-400">
                                          <Sparkles className="w-3.5 h-3.5 shrink-0" />
                                          <span className="truncate">{item.topic} &bull; {sh.aspect}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 shrink-0">
                                          {sh.caseCount && (
                                            <span className="text-[10px] font-extrabold bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded">
                                              {sh.caseCount} phrases
                                            </span>
                                          )}
                                          <span className="text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded">
                                            {sh.impactScore ? `+${sh.impactScore.toFixed(1)} Driver` : '+Promoter Driver'}
                                          </span>
                                        </div>
                                      </div>

                                      {/* Joined Phrase Synthesis Notice */}
                                      <div className="text-[11px] text-emerald-300/90 font-medium mb-3 bg-emerald-950/50 p-2.5 rounded-xl border border-emerald-800/40 leading-relaxed">
                                        <div className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider mb-1 flex items-center gap-1">
                                          <Sparkles className="w-3 h-3" />
                                          Multi-Survey Joined Synthesis:
                                        </div>
                                        "{sh.summary}"
                                      </div>

                                      {/* Detailed Contributing Survey Phrases & Full Comments */}
                                      {sh.contributingPhrases && sh.contributingPhrases.length > 0 ? (
                                        <div className="space-y-2 mb-3">
                                          <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400 flex items-center justify-between">
                                            <span>Contributing Survey Details ({sh.contributingPhrases.length} surveys joined)</span>
                                            <span className="text-[9px] text-emerald-400">Full Verbatims</span>
                                          </div>
                                          {sh.contributingPhrases.map((cp, cpIdx) => (
                                            <div key={cpIdx} className="bg-slate-800/90 rounded-xl p-3 border border-slate-700/80 space-y-2 text-[11px]">
                                              <div className="flex items-center justify-between gap-1 text-[10px]">
                                                <span className="font-mono font-bold text-slate-300 bg-slate-700/70 px-1.5 py-0.5 rounded">
                                                  Survey #{cp.surveyId}
                                                </span>
                                                <div className="flex items-center gap-1.5">
                                                  {cp.respondentType && (
                                                    <span className="text-slate-400 bg-slate-700/60 px-1.5 py-0.5 rounded text-[9px]">
                                                      {cp.respondentType}
                                                    </span>
                                                  )}
                                                  <span className="font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/60">
                                                    {cp.score}/10 NPS ({cp.sentiment})
                                                  </span>
                                                </div>
                                              </div>
                                              <div className="text-emerald-200 font-semibold bg-emerald-900/30 px-2.5 py-1.5 rounded-lg border border-emerald-800/30 text-[10.5px]">
                                                <span className="text-emerald-400 font-bold block text-[9.5px] uppercase tracking-wide mb-0.5">
                                                  Selected Phrase:
                                                </span>
                                                "{cp.selectedPhrase}"
                                              </div>
                                              <div className="text-slate-300 text-[10.5px] leading-relaxed italic bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                                                <span className="text-slate-400 not-italic font-semibold block text-[9.5px] uppercase tracking-wide mb-0.5">
                                                  Full Customer Comment:
                                                </span>
                                                "{cp.fullComment}"
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        matchingCases.length > 0 && (
                                          <div className="bg-slate-800/80 rounded-lg p-2.5 border border-slate-700 text-[11px] text-slate-300 italic mb-2.5">
                                            <span className="text-slate-400 not-italic font-semibold block text-[9.5px] uppercase mb-1">Full Comment:</span>
                                            "{matchingCases[0].comment || matchingCases[0].phrase}"
                                            <span className="not-italic text-emerald-400 font-bold ml-1">
                                              ({matchingCases[0].mainScore}/10 NPS)
                                            </span>
                                          </div>
                                        )
                                      )}

                                      <div className="flex items-center justify-between text-[10px] text-indigo-300 font-semibold pt-2 border-t border-slate-800">
                                        <span className="flex items-center gap-1 text-slate-400">
                                          <Quote className="w-3 h-3 text-emerald-400" /> Click topic row to explore all phrases
                                        </span>
                                        <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                                          Open explorer &rarr;
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* BOTTOM 3 TOPICS TABLE (RED HEADER) */}
                <div className="border border-red-300 rounded-xl overflow-hidden shadow-sm">
                  <div className="bg-red-600 text-white text-center py-2 text-xs font-black tracking-wider uppercase">
                    BOTTOM 3 TOPICS
                  </div>
                  <div className="bg-slate-100 text-slate-800 text-[11px] font-bold grid grid-cols-12 px-3 py-1.5 border-b border-red-200">
                    <span className="col-span-3">Topics</span>
                    <span className="col-span-9">Key Highlights</span>
                  </div>

                  <div className="divide-y divide-slate-100 bg-white">
                    {effectiveBottomHighlights.map((item, idx) => (
                      <div key={`${item.topic}_${idx}`} className="grid grid-cols-12 px-3 py-3 text-xs gap-2">
                        <div className="col-span-3 font-bold text-slate-900 flex items-start gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-red-500 shrink-0 mt-1"></span>
                          <div>
                            <span className="text-slate-900 font-bold block">{item.topic}</span>
                            {item.parentTopic && item.parentTopic !== item.topic && item.parentTopic !== 'General' && (
                              <span className="text-[10px] text-slate-400 font-medium block">{item.parentTopic}</span>
                            )}
                          </div>
                        </div>
                        <div className="col-span-9 space-y-2 text-slate-700 text-[11px] leading-relaxed">
                          {item.subTopicHighlights.map((sh, sIdx) => {
                            const matchingCases = getMatchingCasesForAspect(item.topic, sh.aspect, sh.summary);
                            return (
                              <div key={sIdx}>
                                {isEditingHighlights ? (
                                  <div>
                                    <strong className="text-slate-900 font-semibold">{sh.aspect}: </strong>
                                    <textarea
                                      value={sh.summary}
                                      onChange={e => handleUpdateBottomHighlight(item.topic, sIdx, e.target.value)}
                                      className="w-full text-xs p-1.5 rounded border border-slate-300 mt-1 font-sans"
                                      rows={2}
                                    />
                                  </div>
                                ) : (
                                  <div className="relative group/phrase inline-block w-full">
                                    <div
                                      onClick={() => setSelectedHighlightDetail({
                                        topic: item.topic,
                                        aspect: sh.aspect,
                                        summary: sh.summary,
                                        type: 'bottom',
                                        impactScore: sh.impactScore || item.impactScore,
                                        caseCount: sh.caseCount,
                                        contributingPhrases: sh.contributingPhrases
                                      })}
                                      className="p-1.5 -m-1.5 rounded-lg hover:bg-red-50/80 border border-transparent hover:border-red-200 transition-all duration-150 cursor-pointer flex items-start justify-between gap-2"
                                    >
                                      <div>
                                        <strong className="text-slate-900 font-semibold">{sh.aspect}: </strong>
                                        <span className="text-slate-700">{sh.summary}</span>
                                      </div>
                                      <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-100/90 group-hover/phrase:bg-red-200 px-2 py-0.5 rounded-full border border-red-300/60 shadow-2xs transition">
                                        <Eye className="w-3 h-3" />
                                        {sh.caseCount ? `${sh.caseCount} phrases` : (matchingCases.length > 0 ? `${matchingCases.length} phrases` : 'View phrases')}
                                      </span>
                                    </div>

                                    {/* HOVER HINT POPUP - SHOW FULL DETAIL OF CONTRIBUTING PHRASES */}
                                    <div className="invisible group-hover/phrase:visible opacity-0 group-hover/phrase:opacity-100 transition-all duration-200 delay-75 absolute bottom-full right-0 mb-2 w-[480px] max-w-[92vw] max-h-[70vh] overflow-y-auto bg-slate-900/98 backdrop-blur-md text-white rounded-2xl p-4 shadow-2xl z-50 border border-slate-700 text-left">
                                      <div className="flex items-center justify-between border-b border-slate-700/80 pb-2 mb-2.5">
                                        <div className="flex items-center gap-1.5 font-bold text-xs text-red-400">
                                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                          <span className="truncate">{item.topic} &bull; {sh.aspect}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 shrink-0">
                                          {sh.caseCount && (
                                            <span className="text-[10px] font-extrabold bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded">
                                              {sh.caseCount} phrases
                                            </span>
                                          )}
                                          <span className="text-[10px] font-extrabold bg-red-500/20 text-red-300 border border-red-500/40 px-1.5 py-0.5 rounded">
                                            {item.impactScore.toFixed(1)} Impact
                                          </span>
                                        </div>
                                      </div>

                                      {/* Joined Phrase Synthesis Notice */}
                                      <div className="text-[11px] text-red-300/90 font-medium mb-3 bg-red-950/50 p-2.5 rounded-xl border border-red-800/40 leading-relaxed">
                                        <div className="text-[10px] uppercase font-bold text-red-400 tracking-wider mb-1 flex items-center gap-1">
                                          <AlertTriangle className="w-3 h-3" />
                                          Multi-Survey Joined Synthesis:
                                        </div>
                                        "{sh.summary}"
                                      </div>

                                      {/* Detailed Contributing Survey Phrases & Full Comments */}
                                      {sh.contributingPhrases && sh.contributingPhrases.length > 0 ? (
                                        <div className="space-y-2 mb-3">
                                          <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400 flex items-center justify-between">
                                            <span>Contributing Survey Details ({sh.contributingPhrases.length} surveys joined)</span>
                                            <span className="text-[9px] text-red-400">Full Verbatims</span>
                                          </div>
                                          {sh.contributingPhrases.map((cp, cpIdx) => (
                                            <div key={cpIdx} className="bg-slate-800/90 rounded-xl p-3 border border-slate-700/80 space-y-2 text-[11px]">
                                              <div className="flex items-center justify-between gap-1 text-[10px]">
                                                <span className="font-mono font-bold text-slate-300 bg-slate-700/70 px-1.5 py-0.5 rounded">
                                                  Survey #{cp.surveyId}
                                                </span>
                                                <div className="flex items-center gap-1.5">
                                                  {cp.respondentType && (
                                                    <span className="text-slate-400 bg-slate-700/60 px-1.5 py-0.5 rounded text-[9px]">
                                                      {cp.respondentType}
                                                    </span>
                                                  )}
                                                  <span className="font-bold text-red-400 bg-red-950/80 px-2 py-0.5 rounded border border-red-800/60">
                                                    {cp.score}/10 NPS ({cp.sentiment})
                                                  </span>
                                                </div>
                                              </div>
                                              <div className="text-red-200 font-semibold bg-red-900/30 px-2.5 py-1.5 rounded-lg border border-red-800/30 text-[10.5px]">
                                                <span className="text-red-400 font-bold block text-[9.5px] uppercase tracking-wide mb-0.5">
                                                  Selected Phrase:
                                                </span>
                                                "{cp.selectedPhrase}"
                                              </div>
                                              <div className="text-slate-300 text-[10.5px] leading-relaxed italic bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                                                <span className="text-slate-400 not-italic font-semibold block text-[9.5px] uppercase tracking-wide mb-0.5">
                                                  Full Customer Comment:
                                                </span>
                                                "{cp.fullComment}"
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        matchingCases.length > 0 && (
                                          <div className="bg-slate-800/80 rounded-lg p-2.5 border border-slate-700 text-[11px] text-slate-300 italic mb-2.5">
                                            <span className="text-slate-400 not-italic font-semibold block text-[9.5px] uppercase mb-1">Full Comment:</span>
                                            "{matchingCases[0].comment || matchingCases[0].phrase}"
                                            <span className="not-italic text-red-400 font-bold ml-1">
                                              ({matchingCases[0].mainScore}/10 NPS)
                                            </span>
                                          </div>
                                        )
                                      )}

                                      <div className="flex items-center justify-between text-[10px] text-slate-300 font-semibold pt-2 border-t border-slate-800">
                                        <span className="flex items-center gap-1">
                                          <Quote className="w-3 h-3 text-red-400" /> Click topic row to explore all phrases
                                        </span>
                                        <span className="text-red-400 font-bold flex items-center gap-0.5">
                                          Open explorer &rarr;
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Slide Footer */}
              <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-100">
                <span>DHL Express Cambodia | ICCC+ Bi-Monthly Meeting</span>
                <span className="font-bold text-slate-600">4</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: DATA INGESTION & CSV UPDATE */}
        {activeTab === 'upload' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Data Ingestion & Phrase Dataset Update
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Upload or paste your AI-classified phrase CSV dataset. Changes are saved locally and immediately update the charts, impact scores, and PowerPoint reports.
                </p>
              </div>

              {uploadStatus && (
                <div className="p-3 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-xl border border-emerald-200 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  {uploadStatus}
                </div>
              )}

              {/* Upload Card */}
              <div className="border-2 border-dashed border-slate-300 hover:border-amber-500 rounded-2xl p-8 text-center transition bg-slate-50/50">
                <Upload className="w-10 h-10 text-amber-500 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-slate-800">
                  Choose CSV or Drag & Drop here
                </h3>
                <p className="text-xs text-slate-500 mt-1 mb-4">
                  Accepts standard VoC Text Analytics CSV (Survey ID, Comment Field, Comment, Phrase, Topic/Theme, Sentiment, Main Score)
                </p>
                <label className="cursor-pointer inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition">
                  <FileSpreadsheet className="w-4 h-4" />
                  Browse CSV File
                  <input
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Paste Raw CSV Area */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span>Or Paste CSV Text directly:</span>
                  <button
                    onClick={() => {
                      saveRecords(parseCSV(RAW_SAMPLE_CSV));
                      setUploadStatus('Reset to original sample dataset with 130+ classified phrases.');
                    }}
                    className="text-xs text-amber-700 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Reset to Default Prompt Dataset
                  </button>
                </label>
                <textarea
                  value={pasteCSVText}
                  onChange={e => setPasteCSVText(e.target.value)}
                  placeholder={`Survey ID,Comment Field,Comment,Phrase,Topic/Theme,Sentiment,Main Score incl. Social,Complete Country Unit\n307934232,Invitation survey comment,"Good service...",Courier - Politeness,POSITIVE,9,Cambodia`}
                  rows={6}
                  className="w-full text-xs font-mono p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
                <button
                  onClick={handlePasteSubmit}
                  disabled={!pasteCSVText.trim()}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-sm transition disabled:opacity-50"
                >
                  Parse & Ingest CSV Text
                </button>
              </div>

              {/* Current Dataset Stats */}
              <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
                <span>
                  Currently storing: <strong>{records.length} records</strong>
                </span>
                <span>
                  Date Span: <strong className="text-slate-800">{minDate} to {maxDate}</strong>
                </span>
                <span>
                  Active Filter: <strong className="text-indigo-600">{filteredRecords.length} records</strong> ({formatDateRangeDisplay(startDate, endDate)})
                </span>
                <span>
                  Distinct Sub-Topics: <strong>{analytics.subTopics.length}</strong>
                </span>
                <span>
                  Positive Share: <strong>{analytics.overallPosPercent}%</strong>
                </span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* TOPIC AI SUMMARY MODAL (WHEN USER CLICKS "View" ON ANY SUB-TOPIC) */}
      {viewTopicSummaryModal && (() => {
        const topicName = viewTopicSummaryModal;
        const topicItem =
          analytics.topSubTopics.find(t => t.name === topicName) ||
          analytics.bottomSubTopics.find(t => t.name === topicName) ||
          analytics.subTopics.find(t => t.name === topicName);
        const aiSummary =
          TOPIC_AI_SUMMARIES[topicName] ||
          `Topic analytics derived from ${topicItem?.volume || 0} customer survey mentions in Cambodia.`;
        const topicPhrases = records.filter(r => r.topicTheme === topicName);
        const pillStyle = topicItem ? getImpactPillStyle(topicItem.impactScore) : { bg: '#E2E8F0', text: '#0F172A' };

        return (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
              {/* Modal Header */}
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      {topicName}
                    </h3>
                    <p className="text-xs text-slate-500">
                      AI Topic Summary & Driver Impact Deep Dive
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setViewTopicSummaryModal(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-5">
                {/* Score & Volume Banner */}
                <div className="flex flex-wrap items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200/80 gap-3">
                  <div>
                    <span className="text-xs text-slate-500 font-medium">Impact Score</span>
                    <div className="mt-1">
                      <span
                        style={{ backgroundColor: pillStyle.bg, color: pillStyle.text }}
                        className="py-1 px-3.5 rounded-lg font-black text-sm shadow-xs inline-block"
                      >
                        {topicItem ? (topicItem.impactScore > 0 ? `+${topicItem.impactScore.toFixed(1)}` : topicItem.impactScore.toFixed(1)) : '0.0'}
                      </span>
                    </div>
                  </div>

                  <div className="text-right sm:text-left">
                    <span className="text-xs text-slate-500 font-medium">Mentions Volume</span>
                    <p className="text-sm font-bold text-slate-900 mt-1">
                      {topicItem?.volume || topicPhrases.length} customer phrases
                    </p>
                  </div>

                  <div>
                    <span className="text-xs text-slate-500 font-medium">Sentiment Split</span>
                    <div className="flex items-center gap-2 text-xs font-bold mt-1">
                      <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                        +{topicItem?.percentPositive || 0}% Pos
                      </span>
                      <span className="text-red-700 bg-red-100 px-2 py-0.5 rounded">
                        {topicItem?.percentNegative || 0}% Neg
                      </span>
                    </div>
                  </div>
                </div>

                {/* AI Executive Summary */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    AI Key Driver Synthesis
                  </h4>
                  <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100 text-xs text-slate-800 leading-relaxed font-medium">
                    {aiSummary}
                  </div>
                </div>

                {/* Verbatim Feedback Samples */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
                    <span>Sample Customer Mentions ({topicPhrases.length})</span>
                    <span className="text-[10px] text-slate-400 font-normal">Real extracted survey data</span>
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {topicPhrases.length > 0 ? (
                      topicPhrases.slice(0, 6).map((ph, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-900">
                              "{ph.phrase}"
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                ph.sentiment === 'POSITIVE' || ph.sentiment === 'STRONGLY_POSITIVE'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : ph.sentiment === 'NEGATIVE'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {ph.sentiment}
                            </span>
                          </div>
                          {ph.comment && ph.comment !== ph.phrase && (
                            <p className="text-[11px] text-slate-500 italic">
                              Full: "{ph.comment}"
                            </p>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 italic py-2">
                        No direct verbatim samples found in current filtered set.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                <button
                  onClick={() => {
                    setSelectedSubTopic(topicName);
                    setActiveTab('summary');
                    setViewTopicSummaryModal(null);
                  }}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Jump to Detailed Breakdown View
                </button>

                <button
                  onClick={() => setViewTopicSummaryModal(null)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* CASE DETAIL & VERBATIM EXPLORER MODAL (WHEN USER CLICKS ON ANY HIGHLIGHT PHRASE) */}
      {selectedHighlightDetail && (() => {
        const { topic, aspect, summary, type } = selectedHighlightDetail;
        const allMatchedCases = getMatchingCasesForAspect(topic, aspect, summary);

        // Filter inside modal
        const filteredModalCases = allMatchedCases.filter(c => {
          if (caseModalSentiment !== 'ALL') {
            if (caseModalSentiment === 'POSITIVE' && c.sentiment !== 'POSITIVE' && c.sentiment !== 'STRONGLY_POSITIVE') return false;
            if (caseModalSentiment === 'NEGATIVE' && c.sentiment !== 'NEGATIVE') return false;
            if (caseModalSentiment === 'NEUTRAL' && c.sentiment !== 'NEUTRAL' && c.sentiment !== 'NO_OPINION') return false;
          }
          if (caseModalSearch.trim()) {
            const q = caseModalSearch.toLowerCase();
            return (
              c.surveyId.toLowerCase().includes(q) ||
              c.comment.toLowerCase().includes(q) ||
              c.phrase.toLowerCase().includes(q) ||
              c.topicTheme.toLowerCase().includes(q)
            );
          }
          return true;
        });

        const posCount = allMatchedCases.filter(c => c.sentiment === 'POSITIVE' || c.sentiment === 'STRONGLY_POSITIVE').length;
        const negCount = allMatchedCases.filter(c => c.sentiment === 'NEGATIVE').length;
        const avgScore = allMatchedCases.length > 0
          ? (allMatchedCases.reduce((acc, c) => acc + c.mainScore, 0) / allMatchedCases.length).toFixed(1)
          : 'N/A';

        const isPositiveType = type === 'top';

        return (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
            <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
              
              {/* Modal Header */}
              <div className={`px-6 py-4 border-b flex items-center justify-between ${
                isPositiveType ? 'bg-emerald-50/70 border-emerald-200' : 'bg-red-50/70 border-red-200'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    isPositiveType ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
                  }`}>
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                        isPositiveType
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : 'bg-red-100 text-red-800 border-red-300'
                      }`}>
                        {isPositiveType ? 'Top Driver Topic' : 'Friction Area Topic'}
                      </span>
                      <span className="text-xs font-bold text-slate-500">{topic}</span>
                    </div>
                    <h3 className="text-base font-black text-slate-900 mt-0.5 flex items-center gap-2">
                      <span>{aspect}</span>
                    </h3>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedHighlightDetail(null);
                    setCaseModalSearch('');
                    setCaseModalSentiment('ALL');
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Summary Banner & Stats */}
              <div className="p-4 sm:p-6 bg-slate-50 border-b border-slate-200 space-y-4">
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Executive Summary Highlight (Multi-Survey Synthesis)
                    </div>
                    {selectedHighlightDetail.impactScore !== undefined && (
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded border ${
                        isPositiveType
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-red-50 text-red-800 border-red-200'
                      }`}>
                        {isPositiveType ? `+${selectedHighlightDetail.impactScore.toFixed(1)} Impact` : `${selectedHighlightDetail.impactScore.toFixed(1)} Impact`}
                        {selectedHighlightDetail.caseCount ? ` • ${selectedHighlightDetail.caseCount} phrases` : ''}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-800 font-semibold leading-relaxed">
                    {summary}
                  </p>
                </div>

                {/* Metrics Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Phrase & Survey Count</span>
                      {selectedHighlightDetail.caseCount && (
                        <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                          Medallia: {selectedHighlightDetail.caseCount}
                        </span>
                      )}
                    </div>
                    <div className="text-lg font-black text-slate-900 mt-0.5 flex items-baseline gap-1.5">
                      <span>{new Set(allMatchedCases.map(c => c.surveyId)).size} surveys</span>
                      <span className="text-xs font-normal text-slate-500">({allMatchedCases.length} phrases)</span>
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Avg Rating Score</span>
                    <div className="text-lg font-black text-slate-900 mt-0.5">
                      {avgScore} <span className="text-xs font-normal text-slate-500">/ 10</span>
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                    <span className="text-[10px] font-bold text-emerald-600 uppercase">Positive Sentiment</span>
                    <div className="text-lg font-black text-emerald-600 mt-0.5">
                      {posCount} <span className="text-xs font-semibold text-slate-500">({allMatchedCases.length > 0 ? Math.round((posCount / allMatchedCases.length) * 100) : 0}%)</span>
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                    <span className="text-[10px] font-bold text-red-600 uppercase">Negative Sentiment</span>
                    <div className="text-lg font-black text-red-600 mt-0.5">
                      {negCount} <span className="text-xs font-semibold text-slate-500">({allMatchedCases.length > 0 ? Math.round((negCount / allMatchedCases.length) * 100) : 0}%)</span>
                    </div>
                  </div>
                </div>

                {/* Search and Sentiment Filter Toolbar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-1">
                  <div className="relative w-full sm:w-80">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search comments, survey ID..."
                      value={caseModalSearch}
                      onChange={e => setCaseModalSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
                    {(['ALL', 'POSITIVE', 'NEGATIVE', 'NEUTRAL'] as const).map(sent => (
                      <button
                        key={sent}
                        onClick={() => setCaseModalSentiment(sent)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                          caseModalSentiment === sent
                            ? 'bg-slate-900 text-white shadow-2xs'
                            : 'bg-white text-slate-600 hover:bg-slate-200/70 border border-slate-200'
                        }`}
                      >
                        {sent === 'ALL' ? 'All Phrases' : sent}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Case Cards Verbatim List */}
              <div className="p-4 sm:p-6 overflow-y-auto space-y-3 max-h-[50vh] bg-slate-100/60">
                {filteredModalCases.length > 0 ? (
                  filteredModalCases.map(c => {
                    const isPos = c.sentiment === 'POSITIVE' || c.sentiment === 'STRONGLY_POSITIVE';
                    const isNeg = c.sentiment === 'NEGATIVE';

                    return (
                      <div
                        key={c.id}
                        className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs hover:shadow-sm transition space-y-2.5"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            {/* Survey ID with Copy */}
                            <button
                              onClick={() => handleCopySurveyId(c.surveyId)}
                              title="Click to copy Survey ID"
                              className="group inline-flex items-center gap-1 font-mono text-xs font-bold text-slate-700 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 px-2 py-0.5 rounded border border-slate-200 transition"
                            >
                              <span>{c.surveyId}</span>
                              {copiedSurveyId === c.surveyId ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3 text-slate-400 group-hover:text-indigo-600" />
                              )}
                            </button>

                            {/* Score Pill */}
                            <span className={`text-xs font-black px-2 py-0.5 rounded ${
                              c.mainScore >= 9
                                ? 'bg-emerald-100 text-emerald-800'
                                : c.mainScore >= 7
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              Score: {c.mainScore}/10
                            </span>

                            {/* Sentiment Badge */}
                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                              isPos
                                ? 'bg-emerald-100 text-emerald-800'
                                : isNeg
                                ? 'bg-red-100 text-red-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}>
                              {c.sentiment}
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-400 font-medium">
                            {c.countryUnit || 'Cambodia (PNH)'}
                          </div>
                        </div>

                        {/* Customer Full Comment */}
                        <div className="text-xs text-slate-900 bg-slate-50/80 p-3 rounded-lg border border-slate-200/70 leading-relaxed font-medium">
                          "{c.comment || c.phrase}"
                        </div>

                        {/* AI Phrase & Topic Meta */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px]">
                          <div className="flex items-center gap-1.5 text-slate-500">
                            <span className="font-semibold text-slate-700">Classified Phrase:</span>
                            <span className={`px-2 py-0.5 rounded font-bold ${
                              isPos ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
                            }`}>
                              "{c.phrase}"
                            </span>
                          </div>

                          <div className="text-slate-500 font-semibold flex items-center gap-1">
                            <span>Theme:</span>
                            <span className="text-slate-800 font-bold">{c.topicTheme}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-10 bg-white rounded-xl border border-dashed border-slate-300">
                    <p className="text-xs text-slate-500">
                      No matching phrases found for "{caseModalSearch}" under {caseModalSentiment} filter.
                    </p>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                <button
                  onClick={() => {
                    setSelectedParentTopic(topic);
                    setSelectedSentiment(isPositiveType ? 'POSITIVE' : 'NEGATIVE');
                    setActiveTab('raw_feed');
                    setSelectedHighlightDetail(null);
                  }}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  View all in Raw Dataset Explorer
                </button>

                <button
                  onClick={() => {
                    setSelectedHighlightDetail(null);
                    setCaseModalSearch('');
                    setCaseModalSentiment('ALL');
                  }}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-xs"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
