import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, Filter, Award, Sparkles, ShieldAlert, CheckCircle2, Clock, HelpCircle, RefreshCw, AlertCircle, Calendar, Download, FileSpreadsheet, FileText, Presentation, ChevronDown, Loader2 } from 'lucide-react';
import { VoCRecord, ActionOwner } from '../types';
import { getSurveyUrl, getCleanSurveyId, getSurveyIdSuffix } from '../utils/parser';
import { exportFilteredExcelWorkbook, exportFilteredCSV } from '../utils/excelDatabase';
import { exportVoCToPowerPoint } from '../utils/pptxExport';

interface CompactSidebarListProps {
  records: VoCRecord[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  sliderStart: number;
  setSliderStart: (val: number) => void;
  sliderEnd: number;
  setSliderEnd: (val: number) => void;
  safeMin: number;
  safeMax: number;
  statusFilter: 'All' | 'New' | 'In Progress' | 'Completed';
  setStatusFilter: (status: 'All' | 'New' | 'In Progress' | 'Completed') => void;
  channelFilter: string;
  setChannelFilter: (channel: string) => void;
  uniqueChannels: string[];
  transactionFilter?: string;
  setTransactionFilter?: (tx: string) => void;
  uniqueTransactions?: string[];
  categoryFilter: 'All' | 'Promoter' | 'Passive' | 'Detractor';
  setCategoryFilter: (category: 'All' | 'Promoter' | 'Passive' | 'Detractor') => void;
  currentUser?: ActionOwner | null;
}

export default function CompactSidebarList({ 
  records, 
  selectedId, 
  onSelect,
  sliderStart,
  setSliderStart,
  sliderEnd,
  setSliderEnd,
  safeMin,
  safeMax,
  statusFilter,
  setStatusFilter,
  channelFilter,
  setChannelFilter,
  uniqueChannels,
  transactionFilter = 'All',
  setTransactionFilter,
  uniqueTransactions = [],
  categoryFilter,
  setCategoryFilter,
  currentUser
}: CompactSidebarListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredRecords = useMemo(() => {
    return records.filter(record => {
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch = query === '' ||
        record.id.toLowerCase().includes(query) ||
        (record.surveyId && record.surveyId.toLowerCase().includes(query)) ||
        record.comment.toLowerCase().includes(query) ||
        record.owner.toLowerCase().includes(query) ||
        (record.transactionName && record.transactionName.toLowerCase().includes(query)) ||
        (record.transaction && record.transaction.toLowerCase().includes(query));

      const matchesCategory = categoryFilter === 'All' || record.category === categoryFilter;
      const matchesTransaction = transactionFilter === 'All' || 
        record.transactionName === transactionFilter || 
        record.transaction === transactionFilter;

      return matchesSearch && matchesCategory && matchesTransaction;
    });
  }, [records, searchQuery, categoryFilter, transactionFilter]);

  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: 'xlsx' | 'csv' | 'pptx') => {
    const filterContext = {
      category: categoryFilter,
      status: statusFilter,
      channel: channelFilter,
      transaction: transactionFilter !== 'All' ? transactionFilter : undefined,
      dateRange: `${formatDateShort(sliderStart)} - ${formatDateShort(sliderEnd)}`,
      searchQuery: searchQuery || undefined,
      selectedCount: filteredRecords.length
    };

    setIsExporting(true);
    try {
      if (format === 'xlsx') {
        exportFilteredExcelWorkbook(filteredRecords, filterContext, currentUser);
      } else if (format === 'csv') {
        exportFilteredCSV(filteredRecords, filterContext);
      } else if (format === 'pptx') {
        await exportVoCToPowerPoint(filteredRecords, filterContext, currentUser);
      }
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setIsExporting(false);
      setShowExportMenu(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 9) return 'text-emerald-600';
    if (score >= 7) return 'text-amber-500';
    return 'text-rose-500';
  };

  const formattedScore = (score: number) => {
    return score < 10 ? `0${score}` : `${score}`;
  };

  const formatDateShort = (timestamp: number) => {
    const d = new Date(timestamp);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const toInputDate = (timestamp: number) => {
    const d = new Date(timestamp);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const fromInputDate = (dateStr: string, isEnd: boolean) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return Date.now();
    if (isEnd) {
      d.setHours(23, 59, 59, 999);
    } else {
      d.setHours(0, 0, 0, 0);
    }
    return d.getTime();
  };

  return (
    <div className="flex flex-col h-full bg-white text-slate-800 border-r border-slate-200">
      {/* Sidebar Controls Panel */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/50 space-y-4">
        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search ID, comment, owner..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all text-slate-800 placeholder-slate-400 font-medium"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
        </div>

        {/* Category segment filters */}
        <div className="space-y-1">
          <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">NPS Category</label>
          <div className="grid grid-cols-4 gap-1 text-[10px]">
            {(['All', 'Promoter', 'Passive', 'Detractor'] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`py-1 rounded-md font-bold transition-all cursor-pointer text-center border ${
                  categoryFilter === cat
                    ? 'bg-slate-800 text-white border-slate-800 shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Status segment filters */}
        <div className="space-y-1">
          <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Case Status</label>
          <div className="grid grid-cols-4 gap-1 text-[9px]">
            {(['All', 'New', 'In Progress', 'Completed'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`py-1 rounded-md font-bold transition-all cursor-pointer text-center border truncate px-0.5 ${
                  statusFilter === st
                    ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Feedback Channel filter */}
        <div className="space-y-1">
          <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Feedback Channel</label>
          <select
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value)}
            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer transition-all"
          >
            <option value="All">All Channels</option>
            {uniqueChannels.map((chan) => (
              <option key={chan} value={chan}>
                {chan}
              </option>
            ))}
          </select>
        </div>

        {/* Transaction Name filter */}
        <div className="space-y-1">
          <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Transaction Name</span>
            {transactionFilter !== 'All' && setTransactionFilter && (
              <button
                type="button"
                onClick={() => setTransactionFilter('All')}
                className="text-[9px] text-amber-600 font-bold hover:underline normal-case"
              >
                Clear
              </button>
            )}
          </label>
          <select
            value={transactionFilter}
            onChange={(e) => setTransactionFilter && setTransactionFilter(e.target.value)}
            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer transition-all truncate"
          >
            <option value="All">All Transactions ({uniqueTransactions.length || 10})</option>
            {uniqueTransactions.map((tx) => (
              <option key={tx} value={tx}>
                {tx}
              </option>
            ))}
          </select>
        </div>

        {/* Timeline Slider Section */}
        <div className="space-y-2.5 pt-1.5 border-t border-slate-200" id="voc-timeline-slider-card">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Calendar className="w-3 h-3 text-amber-500" />
              Timeline Window
            </span>
            <button
              type="button"
              onClick={() => {
                setSliderStart(safeMin);
                setSliderEnd(safeMax);
              }}
              className="text-[9px] text-amber-600 font-extrabold hover:underline"
            >
              Reset
            </button>
          </div>

          {/* Stacked Start/End sliders */}
          <div className="space-y-2 text-[10px]">
            <div className="space-y-1">
              <div className="flex justify-between items-center text-slate-500 font-semibold">
                <span>From:</span>
                <div className="relative inline-block cursor-pointer">
                  <span className="font-black text-slate-700 bg-white border border-slate-200 hover:border-amber-400 hover:text-amber-600 px-1.5 py-0.5 rounded transition-all flex items-center gap-1">
                    {formatDateShort(sliderStart)}
                    <Calendar className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                  </span>
                  <input 
                    type="date"
                    value={toInputDate(sliderStart)}
                    min={toInputDate(safeMin)}
                    max={toInputDate(sliderEnd)}
                    onChange={(e) => {
                      if (e.target.value) {
                        const val = fromInputDate(e.target.value, false);
                        if (val <= sliderEnd) {
                          setSliderStart(val);
                        }
                      }
                    }}
                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                  />
                </div>
              </div>
              <input 
                type="range"
                min={safeMin}
                max={safeMax}
                value={sliderStart}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (val < sliderEnd) {
                    setSliderStart(val);
                  }
                }}
                className="w-full accent-amber-500 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center text-slate-500 font-semibold">
                <span>To:</span>
                <div className="relative inline-block cursor-pointer">
                  <span className="font-black text-slate-700 bg-white border border-slate-200 hover:border-amber-400 hover:text-amber-600 px-1.5 py-0.5 rounded transition-all flex items-center gap-1">
                    {formatDateShort(sliderEnd)}
                    <Calendar className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                  </span>
                  <input 
                    type="date"
                    value={toInputDate(sliderEnd)}
                    min={toInputDate(sliderStart)}
                    max={toInputDate(safeMax)}
                    onChange={(e) => {
                      if (e.target.value) {
                        const val = fromInputDate(e.target.value, true);
                        if (val >= sliderStart) {
                          setSliderEnd(val);
                        }
                      }
                    }}
                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                  />
                </div>
              </div>
              <input 
                type="range"
                min={safeMin}
                max={safeMax}
                value={sliderEnd}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (val > sliderStart) {
                    setSliderEnd(val);
                  }
                }}
                className="w-full accent-amber-500 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* List Container with Native Scroll */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
        {filteredRecords.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400">
            No matching customer files
          </div>
        ) : (
          filteredRecords.map((record, index) => {
            const isSelected = selectedId === record.id;
            const scoreColor = getScoreColor(record.likelihood);
            
            const cleanId = getCleanSurveyId(record.surveyId || record.id);
            const rawSuffix = getSurveyIdSuffix(record.surveyId) || getSurveyIdSuffix(record.id);
            const rawTopic = rawSuffix || 
              (record.topic && record.topic !== 'General' && record.topic !== 'Brand' ? record.topic : undefined) ||
              record.momentOfTruthName || 
              record.transactionName || 
              record.transaction || 
              record.topic || 
              'DELIVERY';
            
            const topicChip = rawTopic ? rawTopic.trim().toUpperCase().replace(/[\s/-]+/g, '_') : 'DELIVERY';

            // Tag for alert / first call
            const alertPill = record.alertType 
              ? (record.alertType.includes(':') ? record.alertType.split(':')[0] : record.alertType)
              : (record.actionDetailsRaw && record.actionDetailsRaw.toLowerCase().includes('first call') ? 'FIRST CALL' : (record.responseFeedbackChannel || 'FIRST CALL'));

            return (
              <div
                key={`${record.id}-${index}`}
                onClick={() => onSelect(record.id)}
                className={`p-3.5 flex items-center justify-between cursor-pointer transition-all border-l-4 ${
                  isSelected 
                    ? 'bg-blue-50/60 border-blue-600' 
                    : 'border-transparent hover:bg-slate-50'
                }`}
              >
                <div className="min-w-0 pr-2 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-mono">
                      <a
                        href={getSurveyUrl(cleanId)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 hover:underline transition-colors font-bold text-sm"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {cleanId}
                      </a>
                    </span>
                    {topicChip && (
                      <span className="text-[10px] font-sans font-extrabold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200/80 uppercase tracking-tight">
                        {topicChip}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    <span className={`text-[11px] font-bold ${scoreColor}`}>
                      Score: {formattedScore(record.likelihood)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium truncate max-w-[110px]">
                      • {record.owner && record.owner.trim() !== '' ? record.owner : '(blank)'}
                    </span>
                    {alertPill && (
                      <span className="text-[8px] font-extrabold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded uppercase tracking-wide">
                        {alertPill}
                      </span>
                    )}
                  </div>
                </div>

                <div className="shrink-0 pl-1">
                  {isSelected ? (
                    <span className="text-[9px] bg-blue-600 text-white px-2 py-1 rounded-md font-extrabold uppercase tracking-wider shadow-xs">
                      Viewing
                    </span>
                  ) : (
                    <span className="text-[9px] border border-slate-200 text-slate-500 px-2 py-1 rounded-md font-bold uppercase tracking-wider hover:bg-white hover:text-slate-700 transition-colors">
                      Details
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Sidebar stats & export footer */}
      <div className="p-2.5 bg-slate-50 border-t border-slate-200 text-[10px] flex items-center justify-between gap-2 relative">
        <div className="flex items-center gap-1.5 text-slate-500 font-bold">
          <span className="text-[9px] uppercase tracking-wider text-slate-400">TOTAL:</span>
          <span className="text-slate-800 font-extrabold">{filteredRecords.length} SURVEYS</span>
        </div>

        {/* Export Button & Menu */}
        <div className="relative" ref={exportMenuRef}>
          <button
            type="button"
            onClick={() => setShowExportMenu(prev => !prev)}
            className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-amber-50 border border-slate-300 hover:border-amber-400 text-slate-700 hover:text-amber-800 rounded-md font-bold text-[10px] transition-all cursor-pointer shadow-2xs"
            title="Export filtered records matching active search, NPS category, status, and timeline"
          >
            <Download className="w-3 h-3 text-amber-600" />
            <span>Export ({filteredRecords.length})</span>
            <ChevronDown className={`w-2.5 h-2.5 text-slate-400 transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
          </button>

          {showExportMenu && (
            <div className="absolute right-0 bottom-full mb-1.5 w-52 bg-white rounded-lg shadow-xl border border-slate-200 py-1.5 z-50 animate-fade-in text-left">
              <div className="px-3 py-1 border-b border-slate-100 mb-1">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">
                  Export Filtered ({filteredRecords.length})
                </span>
                <span className="text-[9px] text-slate-500 truncate block">
                  {categoryFilter !== 'All' ? `[${categoryFilter}] ` : ''}
                  {statusFilter !== 'All' ? `[${statusFilter}] ` : ''}
                  {channelFilter !== 'All' ? `[${channelFilter}]` : ''}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleExport('pptx')}
                disabled={isExporting}
                className="w-full px-3 py-1.5 hover:bg-amber-50/80 text-slate-700 hover:text-slate-900 text-xs font-semibold flex items-center gap-2 transition-colors text-left cursor-pointer border-b border-slate-100 pb-2 mb-1"
              >
                <Presentation className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <div>
                  <div className="font-bold text-[11px] text-amber-800 flex items-center gap-1">
                    PowerPoint Presentation (.pptx)
                    {isExporting && <Loader2 className="w-2.5 h-2.5 animate-spin text-amber-600" />}
                  </div>
                  <div className="text-[9px] text-slate-400 font-normal">Summary slide + 1 slide per case</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => handleExport('xlsx')}
                disabled={isExporting}
                className="w-full px-3 py-1.5 hover:bg-amber-50/80 text-slate-700 hover:text-slate-900 text-xs font-semibold flex items-center gap-2 transition-colors text-left cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <div>
                  <div className="font-bold text-[11px]">Excel Workbook (.xlsx)</div>
                  <div className="text-[9px] text-slate-400 font-normal">Multi-sheet with comments & timeline</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => handleExport('csv')}
                disabled={isExporting}
                className="w-full px-3 py-1.5 hover:bg-amber-50/80 text-slate-700 hover:text-slate-900 text-xs font-semibold flex items-center gap-2 transition-colors text-left cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <div>
                  <div className="font-bold text-[11px]">CSV Document (.csv)</div>
                  <div className="text-[9px] text-slate-400 font-normal">Universal UTF-8 spreadsheet</div>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
