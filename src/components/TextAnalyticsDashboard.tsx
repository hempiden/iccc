import React, { useState, useMemo } from 'react';
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
  Sparkles,
  BarChart3,
  Layers,
  Presentation,
  FileText,
  Copy,
  SlidersHorizontal,
  ExternalLink,
  Edit3
} from 'lucide-react';
import {
  TopicSentimentRecord,
  TopicAnalyticsItem,
  SentimentType,
  TopicHighlightSummary
} from '../types';
import {
  RAW_SAMPLE_CSV,
  parseCSV,
  aggregateTopicAnalytics,
  getDefaultTopicHighlights
} from '../utils/textAnalyticsData';
import { exportTextAnalyticsToPowerPoint } from '../utils/textAnalyticsPptx';
import * as XLSX from 'xlsx';

interface TextAnalyticsDashboardProps {
  onBackToVoC?: () => void;
}

export const TextAnalyticsDashboard: React.FC<TextAnalyticsDashboardProps> = ({ onBackToVoC }) => {
  // Persistence state
  const [records, setRecords] = useState<TopicSentimentRecord[]>(() => {
    const saved = localStorage.getItem('dhl_voc_topic_sentiment_records');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return parseCSV(RAW_SAMPLE_CSV);
  });

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

  // Custom highlights for ICCC+ Executive slide
  const [highlights, setHighlights] = useState<{
    top3: TopicHighlightSummary[];
    bottom3: TopicHighlightSummary[];
  }>(() => {
    const saved = localStorage.getItem('dhl_voc_topic_highlights');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return getDefaultTopicHighlights();
  });

  const [isEditingHighlights, setIsEditingHighlights] = useState(false);
  const [pasteCSVText, setPasteCSVText] = useState('');
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Compute aggregated topic analytics
  const analytics = useMemo(() => {
    return aggregateTopicAnalytics(records);
  }, [records]);

  // Save to local storage whenever records or highlights change
  const saveRecords = (newRecords: TopicSentimentRecord[]) => {
    setRecords(newRecords);
    localStorage.setItem('dhl_voc_topic_sentiment_records', JSON.stringify(newRecords));
  };

  const saveHighlights = (newHighlights: typeof highlights) => {
    setHighlights(newHighlights);
    localStorage.setItem('dhl_voc_topic_highlights', JSON.stringify(newHighlights));
  };

  // Filtered phrases for feed
  const filteredPhrases = useMemo(() => {
    return records.filter(r => {
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
  }, [records, selectedSentiment, selectedParentTopic, selectedSubTopic, searchQuery]);

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
        highlights,
        option
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

    // Sheet 1: Raw Records
    const rawWs = XLSX.utils.json_to_sheet(
      records.map(r => ({
        'Survey ID': r.surveyId,
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

    XLSX.writeFile(wb, `DHL_Text_Analytics_Data_${new Date().toISOString().split('T')[0]}.xlsx`);
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
        if (parsed.length > 0) {
          saveRecords(parsed);
          setUploadStatus(`Successfully loaded ${parsed.length} phrase records!`);
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
    if (parsed.length > 0) {
      saveRecords(parsed);
      setUploadStatus(`Successfully parsed ${parsed.length} phrase records from pasted text.`);
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
        {/* TAB 1: TOP & BOTTOM SUB-TOPICS (SCREENSHOT 1) */}
        {activeTab === 'top_bottom' && (
          <div className="space-y-6">
            {/* Header Info Banner */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Top and Bottom Sub-Topics
                </h2>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                  <span>
                    <strong>Time Period:</strong> 06/01/26 to 07/31/26
                  </span>
                  <span className="text-slate-300">•</span>
                  <span>
                    <strong>Reporting Date:</strong> Responsedate
                  </span>
                  <span className="text-slate-300">•</span>
                  <span>
                    <strong>Metric:</strong> Main Score incl. Social
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-semibold">
                    {records.length} Analyzed Records
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleExportPPTX('top_bottom')}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 transition"
                >
                  <Presentation className="w-3.5 h-3.5 text-red-600" />
                  Download Slide (.pptx)
                </button>
              </div>
            </div>

            {/* Dual Grid: Top Topics (Green) vs Bottom Topics (Red) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* TOP TOPICS CARD */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-sm">
                      +
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Top Topics</h3>
                      <p className="text-xs text-emerald-600 font-semibold">
                        Positive Impact Score (Higher driver of satisfaction)
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    {analytics.topSubTopics.length} Topics
                  </span>
                </div>

                {/* Bar Chart Visualization */}
                <div className="space-y-4">
                  {analytics.topSubTopics.slice(0, 10).map((item, idx) => {
                    const maxImpact = Math.max(1, analytics.topSubTopics[0]?.impactScore || 8);
                    const widthPct = Math.min(100, Math.max(8, (item.impactScore / maxImpact) * 100));

                    return (
                      <div
                        key={item.name}
                        onClick={() => {
                          setSelectedSubTopic(item.name);
                          setActiveTab('summary');
                        }}
                        className="group cursor-pointer hover:bg-emerald-50/50 p-2.5 rounded-xl transition border border-transparent hover:border-emerald-200"
                      >
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="font-bold text-slate-800 group-hover:text-emerald-900 flex items-center gap-1.5">
                            <span className="text-slate-400 font-mono text-[10px]">#{idx + 1}</span>
                            {item.name}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500 font-medium">{item.volume} mentions</span>
                            <span className="font-extrabold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded text-[11px]">
                              +{item.impactScore.toFixed(1)}
                            </span>
                          </div>
                        </div>

                        {/* Bar */}
                        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden flex">
                          <div
                            style={{ width: `${widthPct}%` }}
                            className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-500"
                          />
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                          <span>Positive Sentiment: {item.percentPositive}%</span>
                          <span>Negative: {item.percentNegative}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* BOTTOM TOPICS CARD */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-red-100 text-red-700 flex items-center justify-center font-black text-sm">
                      -
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Bottom Topics</h3>
                      <p className="text-xs text-red-600 font-semibold">
                        Negative Impact Score (Friction points causing detraction)
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-red-700 bg-red-50 px-2.5 py-1 rounded-full border border-red-200">
                    {analytics.bottomSubTopics.length} Topics
                  </span>
                </div>

                {/* Bar Chart Visualization */}
                <div className="space-y-4">
                  {analytics.bottomSubTopics.slice(0, 10).map((item, idx) => {
                    const minImpact = Math.min(-1, analytics.bottomSubTopics[0]?.impactScore || -6);
                    const widthPct = Math.min(100, Math.max(8, (Math.abs(item.impactScore) / Math.abs(minImpact)) * 100));

                    return (
                      <div
                        key={item.name}
                        onClick={() => {
                          setSelectedSubTopic(item.name);
                          setActiveTab('summary');
                        }}
                        className="group cursor-pointer hover:bg-red-50/50 p-2.5 rounded-xl transition border border-transparent hover:border-red-200"
                      >
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="font-bold text-slate-800 group-hover:text-red-900 flex items-center gap-1.5">
                            <span className="text-slate-400 font-mono text-[10px]">#{idx + 1}</span>
                            {item.name}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500 font-medium">{item.volume} mentions</span>
                            <span className="font-extrabold text-red-600 bg-red-100 px-2 py-0.5 rounded text-[11px]">
                              {item.impactScore.toFixed(1)}
                            </span>
                          </div>
                        </div>

                        {/* Bar */}
                        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden flex">
                          <div
                            style={{ width: `${widthPct}%` }}
                            className="bg-gradient-to-r from-red-500 to-rose-600 h-full rounded-full transition-all duration-500"
                          />
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                          <span>Negative Sentiment: {item.percentNegative}%</span>
                          <span>Positive: {item.percentPositive}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
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
                  {records.filter(r => r.sentiment === 'POSITIVE' || r.sentiment === 'STRONGLY_POSITIVE').length} of {records.length} records
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
                  {records.filter(r => r.sentiment === 'NEGATIVE').length} of {records.length} records
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
                  {records.filter(r => r.sentiment === 'MIXED_OPINION').length} records
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
                  {records.filter(r => r.sentiment === 'NEUTRAL' || r.sentiment === 'NO_OPINION').length} records
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
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <div className="text-xs font-bold text-emerald-800 mb-2 flex items-center justify-between">
                      <span>Top Topics Driver</span>
                      <span className="text-[10px] text-emerald-600 bg-emerald-100 px-1.5 rounded">+Impact</span>
                    </div>
                    <div className="h-28 flex items-end gap-2 pt-2 border-b border-slate-300 pb-1">
                      {analytics.topSubTopics.slice(0, 5).map(t => {
                        const h = Math.min(100, Math.max(20, (t.impactScore / 7) * 100));
                        return (
                          <div key={t.name} className="flex-1 flex flex-col items-center gap-1 group relative">
                            <span className="text-[9px] font-bold text-emerald-700">+{t.impactScore.toFixed(1)}</span>
                            <div
                              style={{ height: `${h}%` }}
                              className="w-full bg-emerald-500 rounded-t group-hover:bg-emerald-600 transition"
                            />
                            <span className="text-[8px] text-slate-500 font-medium truncate w-full text-center">
                              {t.subTopic || t.name}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Bottom Topics Chart */}
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <div className="text-xs font-bold text-red-800 mb-2 flex items-center justify-between">
                      <span>Bottom Topics Friction</span>
                      <span className="text-[10px] text-red-600 bg-red-100 px-1.5 rounded">-Impact</span>
                    </div>
                    <div className="h-28 flex items-start gap-2 pt-2 border-t border-slate-300 mt-6">
                      {analytics.bottomSubTopics.slice(0, 5).map(t => {
                        const h = Math.min(100, Math.max(20, (Math.abs(t.impactScore) / 5) * 100));
                        return (
                          <div key={t.name} className="flex-1 flex flex-col items-center gap-1 group relative">
                            <div
                              style={{ height: `${h}%` }}
                              className="w-full bg-red-500 rounded-b group-hover:bg-red-600 transition"
                            />
                            <span className="text-[9px] font-bold text-red-700">{t.impactScore.toFixed(1)}</span>
                            <span className="text-[8px] text-slate-500 font-medium truncate w-full text-center">
                              {t.subTopic || t.name}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Right KPI Callout (from Screenshot 3) */}
                <div className="lg:col-span-4 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-3xl font-black text-emerald-600 leading-none">96.1%</div>
                      <div className="text-xs font-semibold text-slate-700">Positive (293 records)</div>
                    </div>
                    <div>
                      <div className="text-3xl font-black text-red-600 leading-none">3.6%</div>
                      <div className="text-xs font-semibold text-slate-700">Negative (11 records)</div>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600 font-medium">
                    <span>0.3% Mixed Opinion</span>
                    <span>8.5% Neutral</span>
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
                    {highlights.top3.map((item, idx) => (
                      <div key={item.topic} className="grid grid-cols-12 px-3 py-3 text-xs gap-2">
                        <div className="col-span-3 font-bold text-slate-900">
                          {item.topic}
                        </div>
                        <div className="col-span-9 space-y-1.5 text-slate-700 text-[11px] leading-relaxed">
                          {item.subTopicHighlights.map((sh, sIdx) => (
                            <div key={sIdx}>
                              <strong className="text-slate-900 font-semibold">{sh.aspect}: </strong>
                              {isEditingHighlights ? (
                                <textarea
                                  value={sh.summary}
                                  onChange={e => {
                                    const updated = { ...highlights };
                                    updated.top3[idx].subTopicHighlights[sIdx].summary = e.target.value;
                                    saveHighlights(updated);
                                  }}
                                  className="w-full text-xs p-1.5 rounded border border-slate-300 mt-1 font-sans"
                                  rows={2}
                                />
                              ) : (
                                <span>{sh.summary}</span>
                              )}
                            </div>
                          ))}
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
                    {highlights.bottom3.map((item, idx) => (
                      <div key={item.topic} className="grid grid-cols-12 px-3 py-3 text-xs gap-2">
                        <div className="col-span-3 font-bold text-slate-900">
                          {item.topic}
                        </div>
                        <div className="col-span-9 space-y-1.5 text-slate-700 text-[11px] leading-relaxed">
                          {item.subTopicHighlights.map((sh, sIdx) => (
                            <div key={sIdx}>
                              <strong className="text-slate-900 font-semibold">{sh.aspect}: </strong>
                              {isEditingHighlights ? (
                                <textarea
                                  value={sh.summary}
                                  onChange={e => {
                                    const updated = { ...highlights };
                                    updated.bottom3[idx].subTopicHighlights[sIdx].summary = e.target.value;
                                    saveHighlights(updated);
                                  }}
                                  className="w-full text-xs p-1.5 rounded border border-slate-300 mt-1 font-sans"
                                  rows={2}
                                />
                              ) : (
                                <span>{sh.summary}</span>
                              )}
                            </div>
                          ))}
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
              <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-600">
                <span>
                  Currently storing: <strong>{records.length} records</strong>
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
    </div>
  );
};
