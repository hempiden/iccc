import React from 'react';
import { Calendar, User, ArrowRight, MessageSquare, CheckCircle, Clock, AlertTriangle, ShieldCheck } from 'lucide-react';
import { TimelineEvent } from '../types';

interface TimelineProps {
  events: TimelineEvent[];
}

export default function Timeline({ events }: TimelineProps) {
  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-gray-50 border border-dashed border-gray-200 rounded-xl">
        <Clock className="w-8 h-8 text-gray-300 mb-2" />
        <span className="text-sm font-medium text-gray-500">No Action History Found</span>
        <p className="text-xs text-gray-400 mt-1 max-w-xs">
          This record does not contain any timestamped action details in the standard log format.
        </p>
      </div>
    );
  }

  // Helper to categorize log action type for custom badge colors/icons
  const getActionTheme = (action: string) => {
    const lower = action.toLowerCase();
    if (lower.includes('closed')) {
      return {
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dot: 'bg-emerald-500 ring-emerald-100',
        icon: <CheckCircle className="w-3.5 h-3.5" />
      };
    }
    if (lower.includes('assigned') || lower.includes('owner')) {
      return {
        bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        dot: 'bg-indigo-500 ring-indigo-100',
        icon: <User className="w-3.5 h-3.5" />
      };
    }
    if (lower.includes('created') || lower.includes('opened') || lower.includes('alert status set to new')) {
      return {
        bg: 'bg-rose-50 text-rose-700 border-rose-200',
        dot: 'bg-rose-500 ring-rose-100',
        icon: <AlertTriangle className="w-3.5 h-3.5" />
      };
    }
    if (lower.includes('edited') || lower.includes('comment') || lower.includes('details')) {
      return {
        bg: 'bg-blue-50 text-blue-700 border-blue-200',
        dot: 'bg-blue-500 ring-blue-100',
        icon: <MessageSquare className="w-3.5 h-3.5" />
      };
    }
    return {
      bg: 'bg-slate-50 text-slate-700 border-slate-200',
      dot: 'bg-slate-400 ring-slate-100',
      icon: <Clock className="w-3.5 h-3.5" />
    };
  };

  return (
    <div className="relative pl-6 border-l-2 border-slate-100 space-y-6 py-2">
      {events.map((event, index) => {
        const theme = getActionTheme(event.action);
        
        return (
          <div key={index} className="relative group transition-all duration-200">
            {/* Timeline Connector Dot */}
            <span className={`absolute -left-[31px] top-1.5 w-4.5 h-4.5 rounded-full ${theme.dot} ring-4 flex items-center justify-center text-white font-semibold shadow-xs z-10 transition-transform duration-200 group-hover:scale-110`}>
              {theme.icon}
            </span>

            {/* Time / Date Marker */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
              <span className="font-mono text-xs font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100 flex items-center gap-1 w-fit">
                <Calendar className="w-3 h-3 text-slate-400" />
                {event.timestamp}
              </span>
              
              {/* Optional Index counter for clear presentation layout */}
              <span className="text-[10px] font-bold text-slate-400 px-1.5 py-0.5 rounded-full bg-slate-100/60 w-fit">
                Step {index + 1}
              </span>
            </div>

            {/* Action Card */}
            <div className="bg-slate-50/50 hover:bg-slate-50 border border-slate-100/80 hover:border-slate-200 rounded-xl p-3.5 transition-all duration-250">
              <p className="text-sm font-medium text-slate-800 leading-relaxed whitespace-pre-line">
                {event.action}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
