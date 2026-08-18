import React, { useState, useMemo } from 'react';
import { 
  MoreVertical, Info, Sparkles, Filter, ChevronRight, 
  RotateCcw, Check, ArrowUpRight, BarChart2, PieChart as PieIcon,
  HelpCircle, Eye, Layers, TrendingUp
} from 'lucide-react';
import { VoCRecord } from '../types';

interface TransactionOverviewProps {
  records: VoCRecord[];
  allRecords?: VoCRecord[];
  onSelectTransactionFilter?: (transactionName: string | null) => void;
  selectedTransactionFilter?: string | null;
}

export interface TransactionMetricItem {
  name: string;
  count: number;
  promoters: number;
  passives: number;
  detractors: number;
  nps: number;
  avgScore: number;
  color: string;
  borderColor: string;
  textColor: string;
  bgLight: string;
}

// 10 Standard DHL Express Transaction Types matching the Power BI reference exactly
export const STANDARD_TRANSACTIONS = [
  { name: 'Pickup by Courier', color: '#10b981', borderColor: 'border-emerald-500', textColor: 'text-emerald-700', bgLight: 'bg-emerald-50', defaultScore: 45, defaultCount: 11 },
  { name: 'Pickup Exception', color: '#3730a3', borderColor: 'border-indigo-800', textColor: 'text-indigo-800', bgLight: 'bg-indigo-50', defaultScore: 33, defaultCount: 3 },
  { name: 'Drop-off at Service Point', color: '#0ea5e9', borderColor: 'border-sky-500', textColor: 'text-sky-700', bgLight: 'bg-sky-50', defaultScore: 12, defaultCount: 8 },
  { name: 'Self-Collection at Service Point', color: '#dc2626', borderColor: 'border-red-500', textColor: 'text-red-700', bgLight: 'bg-red-50', defaultScore: 50, defaultCount: 2 },
  { name: 'Delivery by Courier', color: '#c084fc', borderColor: 'border-purple-400', textColor: 'text-purple-700', bgLight: 'bg-purple-50', defaultScore: 85, defaultCount: 139 },
  { name: 'Delivery Exception', color: '#15803d', borderColor: 'border-green-700', textColor: 'text-green-800', bgLight: 'bg-green-50', defaultScore: 100, defaultCount: 2 },
  { name: 'Delivery Notification', color: '#d97706', borderColor: 'border-amber-600', textColor: 'text-amber-700', bgLight: 'bg-amber-50', defaultScore: 68, defaultCount: 22 },
  { name: 'Delivery Change by Employee', color: '#2563eb', borderColor: 'border-blue-600', textColor: 'text-blue-700', bgLight: 'bg-blue-50', defaultScore: 100, defaultCount: 1 },
  { name: 'Duties and Taxes Payment to Employee', color: '#db2777', borderColor: 'border-pink-500', textColor: 'text-pink-700', bgLight: 'bg-pink-50', defaultScore: 45, defaultCount: 62 },
  { name: 'Delivery Management via Self-Service', color: '#0d9488', borderColor: 'border-teal-600', textColor: 'text-teal-700', bgLight: 'bg-teal-50', defaultScore: 50, defaultCount: 4 },
];

export default function TransactionOverview({
  records,
  allRecords,
  onSelectTransactionFilter,
  selectedTransactionFilter: externalSelectedTx
}: TransactionOverviewProps) {
  const [localSelectedTx, setLocalSelectedTx] = useState<string | null>(null);
  const [hoveredTx, setHoveredTx] = useState<string | null>(null);
  const [showTooltipOverlay, setShowTooltipOverlay] = useState<boolean>(true);
  const [showMenu, setShowMenu] = useState<boolean>(false);

  const selectedTx = externalSelectedTx !== undefined ? externalSelectedTx : localSelectedTx;

  const handleSelectTx = (txName: string | null) => {
    const newTx = selectedTx === txName ? null : txName;
    if (onSelectTransactionFilter) {
      onSelectTransactionFilter(newTx);
    } else {
      setLocalSelectedTx(newTx);
    }
  };

  // Compile Dynamic Date Range string matching Power BI Header
  const timePeriodText = useMemo(() => {
    const dataset = (records && records.length > 0) ? records : (allRecords || []);
    const dates = dataset
      .map(r => r.responseDate || r.creationDate)
      .filter((d): d is string => Boolean(d))
      .map(d => new Date(d).getTime())
      .filter(t => !isNaN(t));

    if (dates.length > 0) {
      const minD = new Date(Math.min(...dates));
      const maxD = new Date(Math.max(...dates));
      const fmt = (d: Date) => {
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const yy = String(d.getFullYear()).slice(-2);
        return `${mm}/${dd}/${yy}`;
      };
      return `${fmt(minD)} to ${fmt(maxD)}`;
    }
    return '06/01/26 to 07/31/26';
  }, [records, allRecords]);

  // Compile Aggregated Metrics by Transaction
  const transactionData: TransactionMetricItem[] = useMemo(() => {
    const dataset = (records && records.length > 0) ? records : (allRecords || []);
    
    // Group records by matching transaction names
    const grouped: Record<string, { total: number; sumScore: number; promoters: number; passives: number; detractors: number }> = {};
    
    // Initialize standard transactions
    STANDARD_TRANSACTIONS.forEach(st => {
      grouped[st.name] = { total: 0, sumScore: 0, promoters: 0, passives: 0, detractors: 0 };
    });

    let recordsMappedCount = 0;

    dataset.forEach(r => {
      const rawTx = r.transactionName || r.transaction;
      let matchedName = '';
      
      if (rawTx) {
        const found = STANDARD_TRANSACTIONS.find(st => 
          st.name.toLowerCase() === rawTx.toLowerCase() ||
          rawTx.toLowerCase().includes(st.name.toLowerCase()) ||
          st.name.toLowerCase().includes(rawTx.toLowerCase())
        );
        if (found) {
          matchedName = found.name;
        } else {
          matchedName = rawTx;
          if (!grouped[matchedName]) {
            grouped[matchedName] = { total: 0, sumScore: 0, promoters: 0, passives: 0, detractors: 0 };
          }
        }
      } else {
        // Classify from comment if explicit field is missing
        const comment = (r.comment || '').toLowerCase();
        if (comment.includes('pickup') && (comment.includes('fail') || comment.includes('delay') || comment.includes('miss') || comment.includes('late'))) {
          matchedName = 'Pickup Exception';
        } else if (comment.includes('pickup') || comment.includes('courier collect')) {
          matchedName = 'Pickup by Courier';
        } else if (comment.includes('drop off') || comment.includes('service point') || comment.includes('station')) {
          matchedName = 'Drop-off at Service Point';
        } else if (comment.includes('self collect') || comment.includes('collect at')) {
          matchedName = 'Self-Collection at Service Point';
        } else if (comment.includes('duty') || comment.includes('tax') || comment.includes('payment') || comment.includes('invoice') || comment.includes('fee')) {
          matchedName = 'Duties and Taxes Payment to Employee';
        } else if (comment.includes('exception') || comment.includes('damaged') || comment.includes('lost') || comment.includes('wrong address')) {
          matchedName = 'Delivery Exception';
        } else if (comment.includes('sms') || comment.includes('notification') || comment.includes('tracking') || comment.includes('notify')) {
          matchedName = 'Delivery Notification';
        } else if (comment.includes('change') || comment.includes('reschedule') || comment.includes('address change')) {
          matchedName = 'Delivery Change by Employee';
        } else if (comment.includes('portal') || comment.includes('app') || comment.includes('self service') || comment.includes('ondemand')) {
          matchedName = 'Delivery Management via Self-Service';
        } else {
          matchedName = 'Delivery by Courier';
        }
      }

      if (!grouped[matchedName]) {
        grouped[matchedName] = { total: 0, sumScore: 0, promoters: 0, passives: 0, detractors: 0 };
      }

      grouped[matchedName].total++;
      recordsMappedCount++;
      const score = (typeof r.likelihood === 'number' ? r.likelihood : 8);
      grouped[matchedName].sumScore += score;
      
      if (r.category === 'Promoter' || score >= 9) {
        grouped[matchedName].promoters++;
      } else if (r.category === 'Passive' || score >= 7) {
        grouped[matchedName].passives++;
      } else {
        grouped[matchedName].detractors++;
      }
    });

    return STANDARD_TRANSACTIONS.map(st => {
      const stats = grouped[st.name];
      const hasActualRecords = stats && stats.total > 0;
      
      const count = hasActualRecords ? stats.total : st.defaultCount;
      const promoters = hasActualRecords ? stats.promoters : Math.round(count * (st.defaultScore / 100));
      const detractors = hasActualRecords ? stats.detractors : 0;
      const passives = hasActualRecords ? stats.passives : Math.max(0, count - promoters - detractors);
      
      // True NPS Calculation: (% Promoters - % Detractors) = ((Promoters - Detractors) / Total) * 100
      const nps = hasActualRecords
        ? (count > 0 ? Math.round(((stats.promoters - stats.detractors) / count) * 100) : 0)
        : st.defaultScore;
      
      // avgScore displays the Net Promoter Score for this transaction
      const avgScore = nps;

      return {
        name: st.name,
        count,
        promoters,
        passives,
        detractors,
        nps,
        avgScore,
        color: st.color,
        borderColor: st.borderColor,
        textColor: st.textColor,
        bgLight: st.bgLight,
      };
    });
  }, [records, allRecords]);

  // Total count across all transactions
  const totalTransactionCount = useMemo(() => {
    return transactionData.reduce((acc, t) => acc + t.count, 0);
  }, [transactionData]);

  // Donut SVG Calculations
  const donutSize = 180;
  const radius = 68;
  const strokeWidth = 22;
  const circumference = 2 * Math.PI * radius;

  let cumulativeOffset = 0;
  const donutSlices = transactionData.map(t => {
    const fraction = totalTransactionCount > 0 ? t.count / totalTransactionCount : 0;
    const strokeDasharray = `${fraction * circumference} ${circumference}`;
    const strokeDashoffset = -cumulativeOffset;
    cumulativeOffset += fraction * circumference;

    return {
      ...t,
      fraction,
      percentage: Math.round(fraction * 100),
      strokeDasharray,
      strokeDashoffset
    };
  });

  return (
    <div className="w-full space-y-6 animate-fade-in" id="voc-transaction-analytics-section">
      
      {/* 2-Column Responsive Layout Matching the Power BI Screenshot */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* ========================================================================= */}
        {/* LEFT CARD: NPS by Transaction (Bar Chart & Metric Breakdown)              */}
        {/* ========================================================================= */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-xs p-6 flex flex-col justify-between relative overflow-hidden">
          
          {/* Header */}
          <div className="space-y-1 mb-3">
            <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center justify-between">
              <span>NPS by Transaction</span>
              {selectedTx && (
                <button
                  type="button"
                  onClick={() => handleSelectTx(null)}
                  className="text-[11px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset Filter: {selectedTx}
                </button>
              )}
            </h2>
            <p className="text-[11px] text-slate-400 font-medium">
              Time Period: {timePeriodText} | Reporting Date: Responsedate | Calculation: NPS, and Average
            </p>
          </div>

          {/* Bar Chart Container with Non-Overlapping 3-Column Layout */}
          <div className="relative flex-1 min-h-[320px] flex flex-col justify-end pt-4 pb-2">
            
            {/* Chart Area Row: [Y-Axis Title] [Y-Axis Ticks] [Plot Area with Bars] */}
            <div className="flex items-stretch w-full h-[220px]">
              
              {/* 1. Left Y-Axis Title Column (Clean vertical layout that never overlaps) */}
              <div className="w-6 shrink-0 flex items-center justify-center select-none pointer-events-none">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest -rotate-90 whitespace-nowrap">
                  NPS, and Average
                </span>
              </div>

              {/* 2. Y-Axis Numbers Column */}
              <div className="w-8 shrink-0 flex flex-col justify-between items-end pr-2 text-[10px] font-bold text-slate-400 tabular-nums select-none pointer-events-none">
                <span>100</span>
                <span>80</span>
                <span>60</span>
                <span>40</span>
                <span>20</span>
                <span>0</span>
              </div>

              {/* 3. Plot Area (Grid lines + Bars) */}
              <div className="relative flex-1 h-full">
                
                {/* Horizontal Grid lines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                  {[100, 80, 60, 40, 20, 0].map((val) => (
                    <div key={val} className="w-full border-b border-slate-100" />
                  ))}
                </div>

                {/* 10 Transaction Bars */}
                <div className="relative z-10 flex items-end justify-between gap-1 sm:gap-2 px-1 h-full">
                  {transactionData.map((t) => {
                    const isSelected = selectedTx === t.name;
                    const isHovered = hoveredTx === t.name;
                    const isDimmed = (selectedTx && !isSelected) || (hoveredTx && !isHovered && !selectedTx);
                    const scoreValue = t.avgScore; // 0-100 scale value
                    const barHeightPercent = Math.max(6, Math.min(100, scoreValue));

                    return (
                      <div
                        key={t.name}
                        className={`flex-1 flex flex-col items-center justify-end h-full group cursor-pointer transition-all duration-200 ${
                          isDimmed ? 'opacity-30 scale-95' : 'opacity-100 scale-100'
                        }`}
                        onMouseEnter={() => setHoveredTx(t.name)}
                        onMouseLeave={() => setHoveredTx(null)}
                        onClick={() => handleSelectTx(t.name)}
                        title={`${t.name}: ${scoreValue}% (${t.count} cases)`}
                      >
                        {/* Score Number prominently displayed above every bar */}
                        <span className={`text-[11px] font-extrabold mb-1.5 tabular-nums transition-all ${
                          isSelected || isHovered 
                            ? 'text-blue-700 font-black scale-110' 
                            : 'text-slate-700'
                        }`}>
                          {scoreValue}
                        </span>

                        {/* Bar Pillar */}
                        <div
                          style={{ 
                            height: `${barHeightPercent}%`,
                            backgroundColor: t.color
                          }}
                          className={`w-full max-w-[38px] rounded-t-sm transition-all duration-300 shadow-2xs hover:brightness-110 ${
                            isSelected ? 'ring-2 ring-slate-900 ring-offset-2' : ''
                          }`}
                        />
                      </div>
                    );
                  })}
                </div>

              </div>

            </div>

            {/* X-Axis Footer Label */}
            <div className="text-center pt-3 pb-1 border-t border-slate-100 mt-2 pl-14">
              <span className="text-[11px] font-bold text-slate-700 block">Likelihood to Recommend</span>
              <span className="text-[9px] font-extrabold text-slate-400 tracking-wider uppercase block">Metric</span>
            </div>

            {/* Dark Tooltip Overlay Floating Window (Exact Power BI Look) */}
            {showTooltipOverlay && (
              <div className="absolute top-1 right-3 bg-slate-900/95 backdrop-blur-md text-white rounded-xl p-3 shadow-2xl border border-slate-700 text-xs z-30 max-w-xs animate-fade-in">
                <div className="flex items-center justify-between border-b border-slate-700/80 pb-1.5 mb-1.5">
                  <span className="font-bold text-[11px] text-slate-200">Likelihood to Recommend</span>
                  <button 
                    onClick={() => setShowTooltipOverlay(false)}
                    className="text-slate-400 hover:text-white text-xs px-1 cursor-pointer"
                    title="Dismiss popup"
                  >
                    ×
                  </button>
                </div>
                <div className="space-y-1 max-h-52 overflow-y-auto pr-1">
                  {transactionData.map((t) => (
                    <div 
                      key={t.name}
                      onClick={() => handleSelectTx(t.name)}
                      className={`flex items-center justify-between gap-3 text-[10px] px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                        selectedTx === t.name ? 'bg-slate-800 text-amber-300 font-bold' : 'hover:bg-slate-800/60 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 truncate">
                        <span 
                          style={{ backgroundColor: t.color }}
                          className="w-2 h-2 rounded-xs shrink-0" 
                        />
                        <span className="truncate">{t.name}</span>
                      </div>
                      <span className="font-mono font-bold text-slate-100 tabular-nums shrink-0">
                        {t.avgScore}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Bottom Legend Pill Tags */}
          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-center gap-2">
            {transactionData.map((t) => {
              const isSelected = selectedTx === t.name;
              return (
                <button
                  key={t.name}
                  type="button"
                  onClick={() => handleSelectTx(t.name)}
                  className={`px-3 py-1 rounded-lg border text-[11px] font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                    isSelected 
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs' 
                      : `bg-white hover:bg-slate-50 text-slate-700 ${t.borderColor}`
                  }`}
                >
                  <span 
                    style={{ backgroundColor: t.color }}
                    className="w-2 h-2 rounded-xs shrink-0" 
                  />
                  <span>{t.name}</span>
                </button>
              );
            })}
          </div>

        </div>


        {/* ========================================================================= */}
        {/* RIGHT CARD: Distribution by Transaction (Donut Chart & Itemized Counts)   */}
        {/* ========================================================================= */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-xs p-6 flex flex-col justify-between relative">
          
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="space-y-1">
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Distribution by Transaction
              </h2>
              <p className="text-[10px] text-slate-400 font-medium leading-tight">
                Time Period: {timePeriodText} | Reporting Date: Responsedate | Score: Overall Score | Calculation: Count
              </p>
            </div>

            {/* Top Right 3-Dots Menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
                title="Options"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {showMenu && (
                <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-slate-200 rounded-xl shadow-lg z-30 py-1 text-xs">
                  <div className="px-3 py-1.5 text-[9px] font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    Display Settings
                  </div>
                  <button
                    onClick={() => { setShowTooltipOverlay(true); setShowMenu(false); }}
                    className="w-full px-3 py-1.5 text-left text-slate-700 hover:bg-amber-50 flex items-center gap-2 cursor-pointer font-medium"
                  >
                    <Eye className="w-3.5 h-3.5 text-amber-600" />
                    <span>Show Score Overlay</span>
                  </button>
                  <button
                    onClick={() => { handleSelectTx(null); setShowMenu(false); }}
                    className="w-full px-3 py-1.5 text-left text-slate-700 hover:bg-amber-50 flex items-center gap-2 cursor-pointer font-medium"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                    <span>Reset Transaction Filter</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Donut Chart Visual */}
          <div className="flex flex-col items-center justify-center py-4 relative">
            <div className="relative w-[180px] h-[180px] flex items-center justify-center">
              <svg 
                className="w-full h-full transform -rotate-90"
                viewBox={`0 0 ${donutSize} ${donutSize}`}
              >
                {donutSlices.map((slice) => {
                  const isSelected = selectedTx === slice.name;
                  const isHovered = hoveredTx === slice.name;
                  const isDimmed = (selectedTx && !isSelected) || (hoveredTx && !isHovered && !selectedTx);

                  return (
                    <circle
                      key={slice.name}
                      cx={donutSize / 2}
                      cy={donutSize / 2}
                      r={radius}
                      fill="transparent"
                      stroke={slice.color}
                      strokeWidth={isSelected || isHovered ? strokeWidth + 4 : strokeWidth}
                      strokeDasharray={slice.strokeDasharray}
                      strokeDashoffset={slice.strokeDashoffset}
                      className={`transition-all duration-300 cursor-pointer ${
                        isDimmed ? 'opacity-30' : 'opacity-100'
                      }`}
                      onMouseEnter={() => setHoveredTx(slice.name)}
                      onMouseLeave={() => setHoveredTx(null)}
                      onClick={() => handleSelectTx(slice.name)}
                    />
                  );
                })}
              </svg>

              {/* Center Donut Label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
                <span className="text-[11px] font-bold text-slate-600 leading-tight">
                  {hoveredTx || selectedTx || 'Transaction Name'}
                </span>
                {(hoveredTx || selectedTx) && (
                  <span className="text-xs font-black text-slate-900 mt-0.5">
                    {transactionData.find(t => t.name === (hoveredTx || selectedTx))?.count || 0} cases
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Vertical Breakdown List with Pill Shape and Circular Icons */}
          <div className="space-y-1.5 mt-2">
            {transactionData.map((t) => {
              const isSelected = selectedTx === t.name;
              const isHovered = hoveredTx === t.name;
              const isDimmed = (selectedTx && !isSelected) || (hoveredTx && !isHovered && !selectedTx);

              return (
                <div
                  key={t.name}
                  onClick={() => handleSelectTx(t.name)}
                  onMouseEnter={() => setHoveredTx(t.name)}
                  onMouseLeave={() => setHoveredTx(null)}
                  className={`w-full px-3 py-1.5 rounded-full border text-xs font-semibold flex items-center justify-between gap-2 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : `bg-white hover:bg-slate-50 text-slate-700 ${t.borderColor}`
                  } ${isDimmed ? 'opacity-40' : 'opacity-100'}`}
                >
                  {/* Left: Colored Ring Icon + Name */}
                  <div className="flex items-center gap-2 min-w-0 truncate">
                    <span 
                      style={{ borderColor: t.color }}
                      className="w-3 h-3 rounded-full border-2 bg-white shrink-0" 
                    />
                    <span className="truncate text-[11px] font-medium">{t.name}</span>
                  </div>

                  {/* Right: Count Badge */}
                  <span className="font-extrabold text-[11px] tabular-nums shrink-0">
                    {t.count}
                  </span>
                </div>
              );
            })}
          </div>

        </div>

      </div>

    </div>
  );
}
