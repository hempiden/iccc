import React, { useState, useMemo } from 'react';
import { Search, Filter, Award, Sparkles, ShieldAlert, CheckCircle2, Clock, HelpCircle, RefreshCw, AlertCircle, Calendar } from 'lucide-react';
import { VoCRecord } from '../types';
import { getSurveyUrl } from '../utils/parser';

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
  categoryFilter: 'All' | 'Promoter' | 'Passive' | 'Detractor';
  setCategoryFilter: (category: 'All' | 'Promoter' | 'Passive' | 'Detractor') => void;
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
  categoryFilter,
  setCategoryFilter
}: CompactSidebarListProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredRecords = useMemo(() => {
    return records.filter(record => {
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch = query === '' ||
        record.id.toLowerCase().includes(query) ||
        (record.surveyId && record.surveyId.toLowerCase().includes(query)) ||
        record.comment.toLowerCase().includes(query) ||
        record.owner.toLowerCase().includes(query);

      const matchesCategory = categoryFilter === 'All' || record.category === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [records, searchQuery, categoryFilter]);

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
            
            return (
              <div
                key={`${record.id}-${index}`}
                onClick={() => onSelect(record.id)}
                className={`p-4 flex items-center justify-between cursor-pointer transition-all border-l-4 ${
                  isSelected 
                    ? 'bg-blue-50/50 border-blue-600' 
                    : 'border-transparent hover:bg-slate-50'
                }`}
              >
                <div className="min-w-0 pr-2">
                  <div className="font-semibold text-sm text-slate-800 tracking-tight flex items-center gap-2">
                    <span className="font-mono">
                      <a
                        href={getSurveyUrl(record.surveyId || record.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 hover:underline transition-colors font-bold"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {record.surveyId || record.id}
                      </a>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    <span className={`text-[11px] font-bold ${scoreColor}`}>
                      Score: {formattedScore(record.likelihood)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium truncate max-w-[100px]">
                      • {record.owner}
                    </span>
                    {record.responseFeedbackChannel && (
                      <span className="text-[8px] font-extrabold bg-slate-100 text-slate-500 px-1 py-0.5 rounded uppercase tracking-wide">
                        {record.responseFeedbackChannel}
                      </span>
                    )}
                  </div>
                </div>

                <div className="shrink-0">
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

      {/* Sidebar stats footer */}
      <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-[9px] text-slate-400 font-bold flex items-center justify-between">
        <span>TOTAL:</span>
        <span className="text-slate-600">{records.length} SURVEYS</span>
      </div>
    </div>
  );
}
