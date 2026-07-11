import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, MessageSquare, ShieldAlert, Award, Sparkles, 
  RefreshCw, RotateCcw, Truck, HelpCircle, User, Users, Activity, TrendingUp, Calendar, LogOut
} from 'lucide-react';
import { VoCRecord, ActionOwner } from './types';
import { sampleRecords } from './sampleData';
import ExcelUploader from './components/ExcelUploader';
import ExecutiveOverview from './components/ExecutiveOverview';
import SurveyList from './components/SurveyList';
import CustomerDetail from './components/CustomerDetail';
import CompactSidebarList from './components/CompactSidebarList';
import PowerBiMirror from './components/PowerBiMirror';
import PhoneAuthLogin from './components/PhoneAuthLogin';
import ColleagueManager from './components/ColleagueManager';
import { saveVoCRecord, batchSaveVoCRecords, seedFirestoreIfNeeded, findColleagueByPhoneNumber } from './utils/firebaseSync';

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
  const [records, setRecords] = useState<VoCRecord[]>([]);
  const [loadingDb, setLoadingDb] = useState(true);

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
  const [showColleagueManager, setShowColleagueManager] = useState(false);

  // Load and seed records from shared Cloud Firestore on authentication
  useEffect(() => {
    if (!currentUser) return;
    
    setLoadingDb(true);
    seedFirestoreIfNeeded(sampleRecords)
      .then((data) => {
        setRecords(data);
        setLoadingDb(false);
      })
      .catch((err) => {
        console.error('Error seeding/fetching shared Firestore database:', err);
        // Resilient fallback to local sample data
        setRecords(sampleRecords);
        setLoadingDb(false);
      });
  }, [currentUser]);

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

  // Synchronize records updates to Firestore and LocalState
  const handleUpdateRecord = async (updatedRecord: VoCRecord) => {
    const nextRecords = records.map(r => r.id === updatedRecord.id ? updatedRecord : r);
    setRecords(nextRecords);
    
    try {
      await saveVoCRecord(updatedRecord);
    } catch (e) {
      console.error('Failed to sync updated record to Firestore:', e);
    }
  };

  // Find the currently selected record
  const selectedRecord = React.useMemo(() => {
    return records.find(r => r.id === selectedRecordId) || null;
  }, [records, selectedRecordId]);

  // Handler for uploading new files to Cloud Firestore
  const handleRecordsLoaded = async (newRecords: VoCRecord[]) => {
    setRecords(newRecords);
    setSelectedRecordId(null); // Clear selected
    
    try {
      setLoadingDb(true);
      await batchSaveVoCRecords(newRecords);
    } catch (e) {
      console.error('Failed to batch save loaded records to Firestore:', e);
    } finally {
      setLoadingDb(false);
    }
  };

  // Handler for appending files to Cloud Firestore
  const handleAppendRecords = async (newRecords: VoCRecord[]) => {
    const existingIds = new Set(records.map(r => r.id));
    const uniqueNew = newRecords.filter(r => !existingIds.has(r.id));
    const combined = [...records, ...uniqueNew];
    setRecords(combined);

    try {
      setLoadingDb(true);
      await batchSaveVoCRecords(uniqueNew);
    } catch (e) {
      console.error('Failed to batch save appended records to Firestore:', e);
    } finally {
      setLoadingDb(false);
    }
  };

  // Reset to original DHL sample records in shared Firestore
  const handleResetToSample = async () => {
    if (window.confirm('This will restore the default DHL VoC sample dataset in the shared cloud Firestore database, overwriting changes. Proceed?')) {
      try {
        setLoadingDb(true);
        setRecords(sampleRecords);
        setSelectedRecordId(null);
        await batchSaveVoCRecords(sampleRecords);
      } catch (e) {
        console.error('Failed to reset Firestore database:', e);
      } finally {
        setLoadingDb(false);
      }
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

  // Render pending approval wall if user exists but is not approved yet
  const [checkingApproval, setCheckingApproval] = useState(false);
  const [approvalMessage, setApprovalMessage] = useState<string | null>(null);

  const handleCheckApproval = async () => {
    if (!currentUser || !currentUser.phoneNumber) return;
    setCheckingApproval(true);
    setApprovalMessage(null);
    try {
      const freshProfile = await findColleagueByPhoneNumber(currentUser.phoneNumber);
      if (freshProfile) {
        if (freshProfile.status === 'approved' || !freshProfile.status) {
          handleLogin(freshProfile);
          setApprovalMessage('Your registration has been approved! Redirecting...');
        } else {
          setApprovalMessage('Your registration is still pending Superadmin approval. Please try again later.');
        }
      } else {
        setApprovalMessage('Colleague profile not found in database. Please log in again.');
      }
    } catch (err) {
      console.error('Error checking approval status:', err);
      setApprovalMessage('Failed to query database. Please check your internet connection.');
    } finally {
      setCheckingApproval(false);
    }
  };

  // If no user is authenticated, block with Phone Auth SMS login wall
  if (!currentUser) {
    return <PhoneAuthLogin onLoginSuccess={(user) => handleLogin(user)} />;
  }

  // Block users who are awaiting superadmin approval
  if (currentUser.status === 'pending') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans relative overflow-hidden">
        {/* Background graphics */}
        <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-400 via-slate-900 to-slate-900" />
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />

        <div className="w-full max-w-md bg-slate-800/80 backdrop-blur-md rounded-2xl border border-slate-700 shadow-2xl relative z-10 overflow-hidden text-center p-6 sm:p-8">
          {/* DHL Highlight strip */}
          <div className="h-2 bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-400 absolute top-0 left-0 right-0" />

          {/* Logo & Header */}
          <div className="flex flex-col items-center text-center mb-6 mt-4">
            <img 
              src="https://1000logos.net/wp-content/uploads/2018/08/DHL-emblem.jpg" 
              alt="DHL Logo" 
              referrerPolicy="no-referrer"
              className="h-8 sm:h-10 w-auto object-contain rounded-md mb-3"
            />
            <h1 className="text-xl font-black text-white uppercase tracking-tight">
              DHL Voice Workspace
            </h1>
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-1">
              Awaiting Superadmin Approval
            </p>
          </div>

          <div className="p-4 bg-amber-400/10 border border-amber-400/20 rounded-xl text-amber-200 text-xs text-left mb-6 space-y-2">
            <div className="font-extrabold text-white text-sm">Registration Received!</div>
            <p>Welcome, <span className="font-bold text-amber-300">{currentUser.fullName}</span>.</p>
            <p>Your profile is registered as <span className="font-bold text-white">Facility Agent</span> for the <span className="font-bold text-white">{currentUser.facility || 'PNHGTW'}</span> team.</p>
            <p className="text-slate-300">To maintain the highest level of workspace security, a DHL Superadmin must review and approve your registration before you can access surveys and case follow-ups.</p>
          </div>

          {approvalMessage && (
            <div className={`text-xs p-3 rounded-lg mb-5 border text-left ${
              approvalMessage.includes('approved') 
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' 
                : 'bg-slate-900/60 border-slate-700 text-slate-300'
            }`}>
              {approvalMessage}
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={handleCheckApproval}
              disabled={checkingApproval}
              className="w-full bg-amber-400 hover:bg-amber-500 disabled:bg-slate-700 disabled:text-slate-500 text-slate-900 text-xs font-black uppercase tracking-wider py-3 rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
            >
              {checkingApproval ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Checking Status...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  <span>Check Approval Status</span>
                </>
              )}
            </button>

            <button
              onClick={handleLogout}
              className="w-full border border-slate-700 hover:bg-slate-700/40 text-slate-300 text-xs font-bold py-2.5 rounded-lg text-center cursor-pointer transition-colors"
            >
              Log Out / Use Different Phone
            </button>
          </div>

          {/* Secure details footer */}
          <div className="mt-6 flex items-center gap-2 text-[9px] text-slate-400/80 border-t border-slate-700/50 pt-4 w-full justify-center text-center">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-500/70 shrink-0" />
            <span>Notify your local DHL Superadmin to approve your registration instantly.</span>
          </div>
        </div>
      </div>
    );
  }

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
          {/* Cloud Sync Database Status Badge */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-full border border-slate-200 text-xs font-semibold text-slate-600 shrink-0 select-none">
            {loadingDb ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 text-amber-500 animate-spin" />
                <span>Syncing Cloud...</span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span>{records.length} Shared Surveys</span>
              </>
            )}
          </div>

          {/* Reset button if records modified */}
          {records.length !== sampleRecords.length && (
            <button
              onClick={handleResetToSample}
              disabled={loadingDb}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-all cursor-pointer shrink-0 disabled:opacity-55"
              title="Restore default DHL sample dataset in shared cloud"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden sm:inline">Reset Shared DB</span>
            </button>
          )}

          {/* Manage Colleagues button for superadmin */}
          {currentUser.role === 'superadmin' && (
            <button
              onClick={() => setShowColleagueManager(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-all cursor-pointer shrink-0"
              title="Manage colleague roles & assigned facilities"
            >
              <Users className="w-3.5 h-3.5 text-emerald-500" />
              <span className="hidden sm:inline">Manage Colleagues</span>
            </button>
          )}

          {/* Home toggle button if record is active */}
          {selectedRecordId && (
            <button
              onClick={() => setSelectedRecordId(null)}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg shadow-sm cursor-pointer transition-all shrink-0"
            >
              Show KPI Dashboard
            </button>
          )}

          {/* User profile & Logout */}
          <div className="flex items-center gap-2.5 border-l border-slate-200 pl-4 shrink-0">
            <img 
              src={currentUser.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(currentUser.fullName)}`}
              alt={currentUser.fullName}
              className="w-8 h-8 rounded-full border border-slate-200 shadow-2xs select-none"
            />
            <div className="hidden lg:block text-left leading-tight">
              <span className="text-[11px] font-black text-slate-800 block">{currentUser.fullName}</span>
              <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">{currentUser.role}</span>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              title="Sign Out of Portal"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
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
                {currentUser?.role === 'superadmin' && (
                  <ExcelUploader 
                    onRecordsLoaded={handleRecordsLoaded}
                    onAppendRecords={handleAppendRecords}
                    currentCount={records.length}
                  />
                )}

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
      {showColleagueManager && (
        <ColleagueManager onClose={() => setShowColleagueManager(false)} />
      )}

    </div>
  );
}

