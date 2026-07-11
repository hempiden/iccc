import React from 'react';
import { Award, ShieldAlert, Sparkles, AlertCircle, HelpCircle, CheckCircle2, RefreshCw, User, Globe, Briefcase, FileText, ArrowRight, ThumbsUp } from 'lucide-react';
import { VoCRecord } from '../types';

interface MetricCardsProps {
  record: VoCRecord;
}

export default function MetricCards({ record }: MetricCardsProps) {
  const { likelihood, category, status } = record;

  // NPS color configuration (Red for 0-6, Yellow 7-8, Green 9-10)
  const getNpsColorClasses = (score: number) => {
    if (score >= 9) {
      return {
        text: 'text-emerald-600',
        bg: 'border-emerald-200 bg-emerald-50/10'
      };
    }
    if (score >= 7) {
      return {
        text: 'text-amber-600',
        bg: 'border-amber-200 bg-amber-50/10'
      };
    }
    return {
      text: 'text-rose-600',
      bg: 'border-rose-200 bg-rose-50/10'
    };
  };

  const colors = getNpsColorClasses(likelihood);

  const getStatusColor = (currentStatus: string) => {
    switch (currentStatus) {
      case 'Completed':
      case 'Closed':
        return 'text-emerald-600';
      case 'In Progress':
        return 'text-blue-600';
      case 'Pending':
        return 'text-amber-600';
      default:
        return 'text-rose-600';
    }
  };

  const statusColor = getStatusColor(status);

  // Formatted Score to double-digits (e.g. 09, 10, 04)
  const formattedScore = likelihood < 10 ? `0${likelihood}` : `${likelihood}`;

  return (
    <div className="space-y-6 mb-8">
      {/* Primary KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* 1. NPS Score Card */}
        <div className="p-6 rounded-xl border border-slate-200 bg-white shadow-xs flex flex-col items-center justify-center transition-all duration-200">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">NPS Score</span>
          <div className={`text-7xl font-black ${colors.text} tabular-nums tracking-tight`}>
            {formattedScore}
          </div>
        </div>

        {/* 2. NPS Category Card */}
        <div className="p-6 rounded-xl border border-slate-200 bg-white shadow-xs flex flex-col items-center justify-center transition-all duration-200">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">NPS Category</span>
          <div className="text-3xl font-bold text-slate-800 uppercase tracking-tight text-center">
            {category}
          </div>
        </div>

        {/* 3. Case Status Card */}
        <div className="p-6 rounded-xl border border-slate-200 bg-white shadow-xs flex flex-col items-center justify-center transition-all duration-200">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Case Status</span>
          <div className={`text-3xl font-bold ${statusColor} uppercase tracking-tight text-center`}>
            {status}
          </div>
        </div>
      </div>

      {/* Secondary Detailed Attributes Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Customer Profile Info */}
        <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/40 space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <User className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Customer Profile</span>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Account Name:</span>
              <span className="font-bold text-slate-800 text-right truncate max-w-[150px]">{record.customerName || record.accountName || 'Anonymous Account'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Contact:</span>
              <span className="font-semibold text-slate-800 text-right truncate max-w-[150px]">{record.contactEmail || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Industry:</span>
              <span className="font-semibold text-slate-700 text-right">{record.industry || 'General Logistics'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Region/Country:</span>
              <span className="font-bold text-slate-800 text-right flex items-center gap-1">
                <Globe className="w-3 h-3 text-slate-400" />
                {record.countryName || 'Global'} {record.region ? `(${record.region})` : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Transaction & Journey Detail */}
        <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/40 space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <FileText className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Journey Touchpoint</span>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Transaction:</span>
              <span className="font-bold text-slate-800 text-right truncate max-w-[150px]" title={record.transactionName}>{record.transactionName || 'Shipment Delivery'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Air Waybill (AWB):</span>
              {record.awbNumber ? (
                <a
                  href={`https://sherloc.dhl.com/link/hwb/${record.awbNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono font-bold text-blue-600 hover:text-blue-800 hover:underline bg-blue-50 hover:bg-blue-100/80 px-1.5 py-0.5 rounded text-[10px] transition-colors"
                >
                  {record.awbNumber}
                </a>
              ) : (
                <span className="font-mono font-bold text-slate-400 bg-slate-100 px-1 py-0.5 rounded text-[10px]">
                  No AWB Attached
                </span>
              )}
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Journey:</span>
              <span className="font-semibold text-slate-700 text-right text-[11px] truncate max-w-[150px]" title={record.journeyName}>{record.journeyName || 'Import / Export'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Moment of Truth:</span>
              <span className="font-semibold text-slate-600 text-right text-[10px] truncate max-w-[150px]" title={record.momentOfTruthName}>{record.momentOfTruthName || 'Standard Delivery'}</span>
            </div>
          </div>
        </div>

        {/* Sentiment & Service Metric */}
        <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/40 space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <ThumbsUp className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Service Metrics</span>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Ease of Use (EoU):</span>
              {record.easeOfUse !== undefined ? (
                <div className="flex items-center gap-1.5 font-bold">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-extrabold ${record.easeOfUse >= 7 ? 'bg-emerald-100 text-emerald-800' : record.easeOfUse >= 5 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'}`}>
                    {record.easeOfUse}
                  </span>
                  <span className="text-[10px] text-slate-500">/ 10</span>
                </div>
              ) : (
                <span className="font-semibold text-slate-400">Not Scored</span>
              )}
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Auto Theme:</span>
              <span className="font-extrabold text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded text-[10px] uppercase">
                {record.topic || 'General'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Sentiment:</span>
              <span className={`font-extrabold px-2 py-0.5 rounded text-[10px] border uppercase ${
                record.sentiment === 'POSITIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                record.sentiment === 'NEGATIVE' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                'bg-slate-50 text-slate-600 border-slate-100'
              }`}>
                {record.sentiment || 'NEUTRAL'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Date Received:</span>
              <span className="font-semibold text-slate-600">
                {record.responseDate ? new Date(record.responseDate).toLocaleDateString() : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
