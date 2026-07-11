import React, { useState } from 'react';
import { 
  FileSpreadsheet, MessageSquare, ShieldAlert, Award, Sparkles, 
  RefreshCw, RotateCcw, Truck, HelpCircle, User, Activity, TrendingUp, Calendar 
} from 'lucide-react';
import { VoCRecord, ActionOwner } from './types';
import { sampleRecords } from './sampleData';
import ExcelUploader from './components/ExcelUploader';
import ExecutiveOverview from './components/ExecutiveOverview';
import SurveyList from './components/SurveyList';
import CustomerDetail from './components/CustomerDetail';
import CompactSidebarList from './components/CompactSidebarList';
import PowerBiMirror from './components/PowerBiMirror';

// Helper to get time representation of a record's response/creation date
const getRecordTime = (r: VoCRecord): number => {
  const dateStr = r.responseDate || r.creationDate;
  if (!dateStr) return 0;
  try {
    const cleaned = dateStr.replace(/-/g, '/');
    const parsed = Date.parse(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  } catch (e) {
    return 0;
  }
};

export default function App() {
  const [records, setRecords] = useState<VoCRecord[]>(() => {
    const saved = localStorage.getItem('dhl_voc_records');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error loading persistent records:', e);
      }
    }
    return sampleRecords;
  });

  const [currentUser, setCurrentUser] = useState<ActionOwner | null>(() => {
    const saved = localStorage.getItem('dhl_voc_current_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error loading persistent user:', e);
      }
    }
    return null;
  });

  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);

  // Dynamic Date Bounds Extraction
  const dateTimes = React.useMemo(() => {
    return records.map(r => {
      const t = getRecordTime(r);
      return { record: r, time: t };
    }).filter(x => x.time > 0);
  }, [records]);

  const minTime = React.useMemo(() => {
    if (dateTimes.length === 0) return new Date('2026-03-01').getTime();
    return Math.min(...dateTimes.map(x => x.time));
  }, [dateTimes]);

  const maxTime = React.useMemo(() => {
    if (dateTimes.length === 0) return new Date('2026-07-01').getTime();
    return Math.max(...dateTimes.map(x => x.time));
  }, [dateTimes]);

  const safeMin = minTime;
  const safeMax = maxTime === minTime ? minTime + 86400000 : maxTime;

  // Active Slider Ranges
  const [sliderStart, setSliderStart] = useState<number>(safeMin);
  const [sliderEnd, setSliderEnd] = useState<number>(safeMax);
  const [statusFilter, setStatusFilter] = useState<'All' | 'New' | 'In Progress' | 'Completed'>('All');
  const [channelFilter, setChannelFilter] = useState<string>('All');

  // Reset sliders when raw data bounds change (like uploading a new Excel sheet)
  React.useEffect(() => {
    setSliderStart(safeMin);
    setSliderEnd(safeMax);
  }, [safeMin, safeMax]);

  // Extract unique Response Feedback Channels dynamically
  const uniqueChannels = React.useMemo(() => {
    const channels = new Set<string>();
    records.forEach(r => {
      if (r.responseFeedbackChannel) {
        channels.add(r.responseFeedbackChannel);
      }
    });
    return Array.from(channels).sort();
  }, [records]);

  // Dynamic Timeline & Status & Channel Filtering
  const filteredByTimeline = React.useMemo(() => {
    return records.filter(r => {
      const t = getRecordTime(r);
      const inTimeline = t === 0 || (t >= sliderStart && t <= sliderEnd);
      const matchesStatus = statusFilter === 'All' || 
        r.status === statusFilter ||
        (statusFilter === 'Completed' && r.status === 'Closed') ||
        (statusFilter === 'In Progress' && r.status === 'Pending');
      const matchesChannel = channelFilter === 'All' || r.responseFeedbackChannel === channelFilter;
      return inTimeline && matchesStatus && matchesChannel;
    });
  }, [records, sliderStart, sliderEnd, statusFilter, channelFilter]);

  // Synchronize records updates to localStorage
  const handleUpdateRecord = (updatedRecord: VoCRecord) => {
    const nextRecords = records.map(r => r.id === updatedRecord.id ? updatedRecord : r);
    setRecords(nextRecords);
    localStorage.setItem('dhl_voc_records', JSON.stringify(nextRecords));
  };

  // Find the currently selected record
  const selectedRecord = React.useMemo(() => {
    return records.find(r => r.id === selectedRecordId) || null;
  }, [records, selectedRecordId]);

  // Handler for uploading new files
  const handleRecordsLoaded = (newRecords: VoCRecord[]) => {
    setRecords(newRecords);
    localStorage.setItem('dhl_voc_records', JSON.stringify(newRecords));
    setSelectedRecordId(null); // Clear selected
  };

  // Handler for appending files
  const handleAppendRecords = (newRecords: VoCRecord[]) => {
    // Avoid duplicate IDs
    const existingIds = new Set(records.map(r => r.id));
    const uniqueNew = newRecords.filter(r => !existingIds.has(r.id));
    const combined = [...records, ...uniqueNew];
    setRecords(combined);
    localStorage.setItem('dhl_voc_records', JSON.stringify(combined));
  };

  // Reset to original DHL sample records
  const handleResetToSample = () => {
    if (window.confirm('This will clear currently loaded surveys and reset to the premium pre-loaded DHL VoC dataset. Proceed?')) {
      setRecords(sampleRecords);
      localStorage.setItem('dhl_voc_records', JSON.stringify(sampleRecords));
      setSelectedRecordId(null);
    }
  };

  // Sync user session to localStorage
  const handleLogin = (user: ActionOwner) => {
    setCurrentUser(user);
    localStorage.setItem('dhl_voc_current_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('dhl_voc_current_user');
  };

  const formatDateShort = (timestamp: number) => {
    const d = new Date(timestamp);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans antialiased text-slate-900 overflow-hidden h-screen" id="voc-main-container">
      {/* 1. Sleek Navigation Header (Hidden during printing) */}
      <nav className="h-16 flex items-center justify-between px-6 bg-white border-b border-slate-200 shrink-0 print:hidden z-50 shadow-xs">
        <div className="flex items-center gap-3">
          <img 
            src="https://1000logos.net/wp-content/uploads/2018/08/DHL-emblem.jpg" 
            alt="DHL Logo" 
            referrerPolicy="no-referrer"
            className="h-10 w-auto object-contain rounded-md"
          />
          <div>
            <span className="font-extrabold text-lg tracking-tight text-slate-800 uppercase flex items-center gap-1.5">
              DHL Voice Portal - Ops
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Status badge */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-full border border-slate-200 text-xs font-medium text-slate-600 shrink-0">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span>{records.length} surveys</span>
          </div>

          {/* Reset button if records modified */}
          {records.length !== sampleRecords.length && (
            <button
              onClick={handleResetToSample}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-all cursor-pointer shrink-0"
              title="Restore default DHL screenshot sample logs"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden sm:inline">Reset Data</span>
            </button>
          )}

          {/* Home toggle button if record is active */}
          {selectedRecordId && (
            <button
              onClick={() => setSelectedRecordId(null)}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg shadow-sm cursor-pointer transition-all"
            >
              Show KPI Dashboard
            </button>
          )}
        </div>
      </nav>

      {/* 2. Main content layout split */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Left Sidebar: Compact Searchable Table (Visible on desktop, or on mobile when no record selected) */}
        <aside className={`w-[320px] bg-white border-r border-slate-200 flex flex-col shrink-0 overflow-hidden h-full transition-all duration-300 ${
          selectedRecordId ? 'hidden md:flex' : 'flex w-full md:w-[320px]'
        } print:hidden`}>
          <CompactSidebarList 
            records={filteredByTimeline}
            selectedId={selectedRecordId}
            onSelect={(id) => setSelectedRecordId(id)}
            sliderStart={sliderStart}
            setSliderStart={setSliderStart}
            sliderEnd={sliderEnd}
            setSliderEnd={setSliderEnd}
            safeMin={safeMin}
            safeMax={safeMax}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            channelFilter={channelFilter}
            setChannelFilter={setChannelFilter}
            uniqueChannels={uniqueChannels}
          />
        </aside>

        {/* Right Panel: Detail View / Dashboard Portfolios */}
        <main className={`flex-1 bg-slate-50/40 overflow-y-auto flex flex-col h-full ${
          selectedRecordId ? 'flex' : 'hidden md:flex'
        } print:overflow-visible print:h-auto`}>
          
          <div className="p-6 md:p-8 flex flex-col gap-6 max-w-6xl w-full mx-auto print:p-0">
            {selectedRecord ? (
              /* Presentation slide detail view */
              <CustomerDetail 
                record={selectedRecord} 
                onBack={() => setSelectedRecordId(null)} 
                onUpdateRecord={handleUpdateRecord}
                currentUser={currentUser}
                onLogin={handleLogin}
                onLogout={handleLogout}
              />
            ) : (
              /* Welcome block & Uploader & Executive KPI overview portfolio & Power BI Mirror integrated */
              <div className="space-y-6 animate-fade-in print:hidden">
                <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-6 md:p-8 border border-slate-800 shadow-md relative overflow-hidden">
                  <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 opacity-5 pointer-events-none">
                    <Truck className="w-80 h-80 text-white" />
                  </div>
                  
                  <div className="relative z-10 max-w-2xl space-y-3">
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-widest bg-amber-400/10 px-2.5 py-1 rounded-md border border-amber-400/20">
                      Unified Portal
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
                      DHL iCCC Voice & Slide Intelligence Workspace
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
                      Power BI Weekly charts and the executive-ready slide compilation suite integrated in one cohesive dashboard. Instantly review AI-summarized feedback, case status logs, and action details without horizontal scroll.
                    </p>
                  </div>
                </div>

                {/* File ingestion and action portfolio stats */}
                <ExcelUploader 
                  onRecordsLoaded={handleRecordsLoaded}
                  onAppendRecords={handleAppendRecords}
                  currentCount={records.length}
                />

                <ExecutiveOverview records={filteredByTimeline} allRecords={records} />

                {/* Unified Interactive Power BI Mirror Component */}
                <PowerBiMirror 
                  records={filteredByTimeline} 
                  onSelectRecord={(r) => setSelectedRecordId(r.id)} 
                />
              </div>
            )}
          </div>
        </main>

      </div>
    </div>
  );
}

