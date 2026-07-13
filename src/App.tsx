import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileSpreadsheet, MessageSquare, ShieldAlert, Award, Sparkles, 
  RefreshCw, RotateCcw, Truck, HelpCircle, User, Users, Activity, TrendingUp, Calendar, LogOut,
  Presentation, Bell, Mail
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
import UserProfileModal from './components/UserProfileModal';
import NotificationCenter, { CommentNotification } from './components/NotificationCenter';
import { saveVoCRecord, batchSaveVoCRecords, seedFirestoreIfNeeded, findColleagueByPhoneNumber, clearVoCRecords, deleteVoCRecords } from './utils/firebaseSync';
import { healRecordTimeline } from './utils/parser';

// Helper to sanitize database loaded date fields that might contain Excel serial formats (e.g. "45980")
const sanitizeExcelDateString = (val: string | undefined): string | undefined => {
  if (!val) return val;
  const trimmed = val.trim();
  if (/^\d+(\.\d+)?$/.test(trimmed)) {
    const serial = Number(trimmed);
    if (serial > 1000 && serial < 100000) {
      const date = new Date((serial - 25569) * 86400 * 1000);
      if (!isNaN(date.getTime())) {
        const yyyy = date.getFullYear();
        if (yyyy >= 1970 && yyyy <= 2100) {
          const mm = String(date.getMonth() + 1).padStart(2, '0');
          const dd = String(date.getDate()).padStart(2, '0');
          return `${yyyy}-${mm}-${dd}`;
        }
      }
    }
  }
  return val;
};

// Helper to get time representation of a record's response/creation date
const getRecordTime = (r: VoCRecord): number => {
  let dateStr = r.responseDate || r.creationDate;
  if (!dateStr) return 0;
  
  const trimmed = dateStr.trim();
  if (/^\d+(\.\d+)?$/.test(trimmed)) {
    const serial = Number(trimmed);
    if (serial > 1000 && serial < 100000) {
      return (serial - 25569) * 86400 * 1000;
    }
  }

  try {
    const cleaned = dateStr.replace(/-/g, '/');
    const parsed = Date.parse(cleaned);
    if (isNaN(parsed)) return 0;
    
    const year = new Date(parsed).getFullYear();
    if (year < 1970 || year > 2100) {
      return 0;
    }
    return parsed;
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
  const [showUserProfileModal, setShowUserProfileModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'presentation' | 'upload'>('dashboard');

  // Notifications states and handlers
  const [readNotifications, setReadNotifications] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('dhl_voc_read_notifications');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const notifications = useMemo(() => {
    if (!currentUser) return [];
    const list: CommentNotification[] = [];
    const lowerUser = currentUser.username.toLowerCase();
    const lowerName = currentUser.fullName.toLowerCase();
    const lowerRole = currentUser.role.toLowerCase();

    records.forEach(r => {
      if (r.comments) {
        r.comments.forEach(c => {
          // Do not notify of own comments
          if (c.author.toLowerCase() === lowerName || c.author.toLowerCase() === lowerUser) {
            return;
          }

          const txt = c.text.toLowerCase();
          const isOwner = r.owner && (r.owner.toLowerCase() === lowerUser || r.owner.toLowerCase() === lowerName);
          const hasMention = txt.includes('@' + lowerUser) || 
                            txt.includes('@' + lowerName.replace(/\s+/g, '')) || 
                            txt.includes(lowerName) ||
                            txt.includes(lowerRole);

          if (isOwner || hasMention) {
            list.push({
              id: `${r.id}-${c.id}`,
              recordId: r.id,
              recordOwner: r.owner,
              awbNumber: r.awbNumber,
              customerName: r.customerName,
              commentId: c.id,
              commentAuthor: c.author,
              commentRole: c.role,
              commentText: c.text,
              timestamp: c.timestamp,
              isMention: hasMention
            });
          }
        });
      }
    });

    // Sort by timestamp descending
    return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [records, currentUser]);

  const unreadCount = useMemo(() => {
    return notifications.filter(n => !readNotifications.includes(n.id)).length;
  }, [notifications, readNotifications]);

  const handleMarkAsRead = (id: string) => {
    setReadNotifications(prev => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      localStorage.setItem('dhl_voc_read_notifications', JSON.stringify(next));
      return next;
    });
  };

  const handleMarkAllAsRead = () => {
    const ids = notifications.map(n => n.id);
    setReadNotifications(ids);
    localStorage.setItem('dhl_voc_read_notifications', JSON.stringify(ids));
  };

  // Load and seed records from shared Cloud Firestore on authentication
  useEffect(() => {
    if (!currentUser) return;
    
    setLoadingDb(true);
    seedFirestoreIfNeeded(sampleRecords)
      .then((data) => {
        const sanitized = data.map(r => {
          const healed = healRecordTimeline(r);
          return {
            ...healed,
            responseDate: sanitizeExcelDateString(healed.responseDate),
            creationDate: sanitizeExcelDateString(healed.creationDate)
          };
        });
        setRecords(sanitized);
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
  const [presentationMode, setPresentationMode] = useState<boolean>(false);
  const [categoryFilter, setCategoryFilter] = useState<'All' | 'Promoter' | 'Passive' | 'Detractor'>('All');

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

  // Dynamic Timeline & Channel Filtering (No Status Filtering) - used for Charts
  const filteredByTimelineAndChannel = React.useMemo(() => {
    return records.filter(r => {
      const t = getRecordTime(r);
      const inTimeline = t === 0 || (t >= sliderStart && t <= sliderEnd);
      const matchesChannel = channelFilter === 'All' || r.responseFeedbackChannel === channelFilter;
      
      return inTimeline && matchesChannel;
    });
  }, [records, sliderStart, sliderEnd, channelFilter]);

  // Dynamic Timeline & Status & Channel Filtering - used for Lists, Sidebars and Tables
  const filteredByTimeline = React.useMemo(() => {
    return filteredByTimelineAndChannel.filter(r => {
      const matchesStatus = statusFilter === 'All' || 
        r.status === statusFilter ||
        (statusFilter === 'Completed' && r.status === 'Closed') ||
        (statusFilter === 'In Progress' && r.status === 'Pending');
      
      return matchesStatus;
    });
  }, [filteredByTimelineAndChannel, statusFilter]);

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

  // Delete records from Firestore and local state
  const handleDeleteRecords = async (idsToDelete: string[]) => {
    try {
      setLoadingDb(true);
      await deleteVoCRecords(idsToDelete);
      setRecords(prev => prev.filter(r => !idsToDelete.includes(r.id)));
      if (selectedRecordId && idsToDelete.includes(selectedRecordId)) {
        setSelectedRecordId(null);
      }
    } catch (e) {
      console.error('Failed to delete selected records:', e);
      alert('Failed to delete selected surveys. Please try again.');
    } finally {
      setLoadingDb(false);
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
      await clearVoCRecords();
      await batchSaveVoCRecords(newRecords);
    } catch (e) {
      console.error('Failed to batch save loaded records to Firestore:', e);
      throw e;
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
      throw e;
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

  // Deep-linking support to directly select a survey case on startup/URL change
  useEffect(() => {
    if (records.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const targetId = params.get('id') || params.get('caseId');
      if (targetId) {
        const found = records.find(r => r.id === targetId || r.surveyId === targetId);
        if (found) {
          setSelectedRecordId(found.id);
        }
      }
    }
  }, [records]);

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
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5">
            <img 
              src="https://1000logos.net/wp-content/uploads/2018/08/DHL-emblem.jpg" 
              alt="DHL Logo" 
              referrerPolicy="no-referrer"
              className="h-8 w-auto object-contain rounded-md"
            />
            <div>
              <span className="font-extrabold text-base tracking-tight text-slate-800 uppercase">
                Voice Portal
              </span>
            </div>
          </div>

          {/* Navigation Tabs for Superadmin */}
          {currentUser?.role === 'superadmin' && (
            <div className="hidden sm:flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => {
                  setActiveTab('dashboard');
                  setSelectedRecordId(null);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'dashboard'
                    ? 'bg-white text-slate-800 shadow-xs border border-slate-200/40'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Activity className="w-3.5 h-3.5 text-amber-500" />
                <span>Dashboard</span>
              </button>
              <button
                onClick={() => {
                  setActiveTab('presentation');
                  setSelectedRecordId(null);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'presentation'
                    ? 'bg-white text-slate-800 shadow-xs border border-slate-200/40'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Presentation className="w-3.5 h-3.5 text-amber-500 animate-none" />
                <span>Presentation Deck</span>
              </button>
              <button
                onClick={() => {
                  setActiveTab('upload');
                  setSelectedRecordId(null);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'upload'
                    ? 'bg-white text-slate-800 shadow-xs border border-slate-200/40'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-amber-500" />
                <span>Upload Center</span>
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Reset button to clear uploaded data and restore original sample records */}
          <button
            onClick={handleResetToSample}
            disabled={loadingDb}
            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-slate-50 border border-slate-200 rounded-lg transition-all cursor-pointer shrink-0 disabled:opacity-55"
            title="Reset Database to Default Samples"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Manage Colleagues button for superadmin */}
          {currentUser.role === 'superadmin' && (
            <button
              onClick={() => setShowColleagueManager(true)}
              className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-all cursor-pointer shrink-0"
              title="Manage Colleagues"
            >
              <Users className="w-3.5 h-3.5 text-slate-500" />
              <span>Colleagues</span>
            </button>
          )}

          {/* Home toggle button if record is active */}
          {selectedRecordId && (
            <button
              onClick={() => setSelectedRecordId(null)}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-900 text-white text-[11px] font-bold rounded-lg cursor-pointer transition-all shrink-0"
            >
              Dashboard
            </button>
          )}

          {/* User profile, Notifications & Logout */}
          <div className="flex items-center gap-2 border-l border-slate-200 pl-3 shrink-0">
            {currentUser && (
              <NotificationCenter
                notifications={notifications}
                unreadCount={unreadCount}
                onSelectRecord={(recordId) => setSelectedRecordId(recordId)}
                onMarkAsRead={handleMarkAsRead}
                onMarkAllAsRead={handleMarkAllAsRead}
              />
            )}

            {currentUser && (
              <button
                onClick={() => setShowUserProfileModal(true)}
                className="flex items-center hover:bg-slate-50 p-0.5 rounded-full transition-all cursor-pointer group"
                title={`Profile: ${currentUser.fullName} (${currentUser.role})`}
              >
                <img 
                  src={currentUser.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(currentUser.fullName)}`}
                  alt={currentUser.fullName}
                  className="w-7 h-7 rounded-full border border-slate-200 shadow-2xs select-none group-hover:scale-105 transition-transform"
                />
              </button>
            )}
            <button
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              title="Sign Out"
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
          activeTab === 'upload' ? 'hidden' : (selectedRecordId ? 'hidden md:flex' : 'flex w-full md:w-[320px]')
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
            categoryFilter={categoryFilter}
            setCategoryFilter={setCategoryFilter}
          />
        </aside>
 
        {/* Right Panel: Detail View / Dashboard Portfolios */}
        <main className={`flex-1 bg-slate-50/40 overflow-y-auto flex flex-col h-full ${
          selectedRecordId ? 'flex' : (activeTab === 'upload' ? 'flex' : 'hidden md:flex')
        } print:overflow-visible print:h-auto`}>
          
          <div className="p-6 md:p-8 flex flex-col gap-6 max-w-6xl w-full mx-auto print:p-0">
            {/* Mobile Tab Navigation for Superadmin */}
            {!selectedRecordId && currentUser?.role === 'superadmin' && (
              <div className="sm:hidden flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('dashboard');
                    setSelectedRecordId(null);
                  }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'dashboard'
                      ? 'bg-white text-slate-800 shadow-xs border border-slate-200/40'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5 text-amber-500" />
                  <span>Dashboard</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('presentation');
                    setSelectedRecordId(null);
                  }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'presentation'
                      ? 'bg-white text-slate-800 shadow-xs border border-slate-200/40'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Presentation className="w-3.5 h-3.5 text-amber-500" />
                  <span>Presentation</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('upload');
                    setSelectedRecordId(null);
                  }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'upload'
                      ? 'bg-white text-slate-800 shadow-xs border border-slate-200/40'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-amber-500" />
                  <span>Upload</span>
                </button>
              </div>
            )}

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
            ) : activeTab === 'upload' && currentUser?.role === 'superadmin' ? (
              /* Dedicated Upload Ingestion Page */
              <div className="space-y-6 animate-fade-in print:hidden">
                <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-6 md:p-8 border border-slate-800 shadow-md relative overflow-hidden">
                  <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 opacity-5 pointer-events-none">
                    <FileSpreadsheet className="w-80 h-80 text-white opacity-5" />
                  </div>
                  
                  <div className="relative z-10 max-w-2xl space-y-3">
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-widest bg-amber-400/10 px-2.5 py-1 rounded-md border border-amber-400/20">
                      Administrative Tool
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
                      DHL VoC Data Ingestion Center
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
                      Upload your weekly Customer Experience Voice of Customer survey results from Excel sheets or CSV logs. This interface allows you to append new weekly surveys dynamically or fully overwrite the existing shared Firestore database.
                    </p>
                  </div>
                </div>

                {/* Uploader Component */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
                  <ExcelUploader 
                    onRecordsLoaded={async (recs) => {
                      await handleRecordsLoaded(recs);
                      setActiveTab('dashboard');
                    }}
                    onAppendRecords={async (recs) => {
                      await handleAppendRecords(recs);
                      setActiveTab('dashboard');
                    }}
                    currentCount={records.length}
                  />
                </div>

                {/* Database Health & Column Mapping Guide */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Card 1: Data Schema Rules */}
                  <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-amber-500" />
                      Smart Column Auto-Mapping
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Our ingestion engine uses smart keyword search to locate relevant data columns in your Excel files automatically. For optimal results, ensure your Excel headers match any of these synonyms:
                    </p>
                    <ul className="space-y-2.5 text-xs">
                      <li className="flex justify-between items-center py-1 border-b border-slate-100">
                        <span className="font-bold text-slate-700">Survey ID</span>
                        <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-md font-mono text-slate-600">Survey ID, ID, Interaction ID</span>
                      </li>
                      <li className="flex justify-between items-center py-1 border-b border-slate-100">
                        <span className="font-bold text-slate-700">NPS Score</span>
                        <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-md font-mono text-slate-600">Likelihood, NPS, Score, Rating</span>
                      </li>
                      <li className="flex justify-between items-center py-1 border-b border-slate-100">
                        <span className="font-bold text-slate-700">Customer Feedback</span>
                        <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-md font-mono text-slate-600">Comment, Feedback, Primary Comment</span>
                      </li>
                      <li className="flex justify-between items-center py-1 border-b border-slate-100">
                        <span className="font-bold text-slate-700">Action Logs / Description</span>
                        <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-md font-mono text-slate-600">Action Details, Logs, Timeline</span>
                      </li>
                      <li className="flex justify-between items-center py-1">
                        <span className="font-bold text-slate-700">Follow-up Owner</span>
                        <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-md font-mono text-slate-600">Owner, Staff, Followup Owner</span>
                      </li>
                    </ul>
                  </div>

                  {/* Card 2: Database Summary Metrics */}
                  <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <Activity className="w-4 h-4 text-emerald-500" />
                      Live Database Status
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Surveys</span>
                        <span className="text-2xl font-black text-slate-800 block mt-1">{records.length}</span>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Channels</span>
                        <span className="text-2xl font-black text-slate-800 block mt-1">{uniqueChannels.length || 3}</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed pt-2">
                      Need to reset the system database? You can instantly wipe custom uploads and restore the default DHL VoC sample set using the <strong className="text-slate-700">Reset Button (↻)</strong> in the top navigation bar.
                    </p>
                  </div>
                </div>
              </div>
            ) : activeTab === 'presentation' ? (
              /* Executive Presentation Dashboard Portfolios */
              <div className="space-y-6 animate-fade-in print:hidden">
                <div className="bg-gradient-to-r from-red-700 to-red-900 text-white rounded-2xl p-6 md:p-8 border border-red-800 shadow-md relative overflow-hidden">
                  <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 opacity-5 pointer-events-none select-none">
                    <Presentation className="w-80 h-80 text-white opacity-5" />
                  </div>
                  
                  <div className="relative z-10 max-w-2xl space-y-3">
                    <span className="text-xs font-bold text-yellow-300 bg-yellow-400/10 px-2.5 py-1 rounded-md border border-yellow-400/20 uppercase tracking-widest">
                      Executive Showcase
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight uppercase">
                      DHL iCCC Voice of Customer Presentation Deck
                    </h2>
                    <p className="text-xs sm:text-sm text-red-100 leading-relaxed font-medium">
                      Curated slides presenting action plans and key resolutions for customer escalations. Perfect for presentation, executive reviews, and stakeholder showcases.
                    </p>
                  </div>
                </div>

                <ExecutiveOverview records={filteredByTimelineAndChannel} allRecords={records} />

                {/* Unified Interactive Power BI Mirror Component (Presentation Style) */}
                <PowerBiMirror 
                  records={filteredByTimelineAndChannel} 
                  onSelectRecord={(r) => setSelectedRecordId(r.id)} 
                  onDeleteRecords={handleDeleteRecords}
                  presentationMode={true}
                  isPresentationPage={true}
                  statusFilter={statusFilter}
                  categoryFilter={categoryFilter}
                  setCategoryFilter={setCategoryFilter}
                />
              </div>
            ) : (
              /* Welcome block & Executive KPI overview portfolio & Power BI Mirror integrated */
              <div className="space-y-6 animate-fade-in print:hidden">
                <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-6 md:p-8 border border-slate-800 shadow-md relative overflow-hidden">
                  <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 opacity-5 pointer-events-none select-none">
                    <Truck className="w-80 h-80 text-white opacity-5" />
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

                <ExecutiveOverview records={filteredByTimelineAndChannel} allRecords={records} />

                {/* Unified Interactive Power BI Mirror Component */}
                <PowerBiMirror 
                  records={filteredByTimelineAndChannel} 
                  onSelectRecord={(r) => setSelectedRecordId(r.id)} 
                  onDeleteRecords={handleDeleteRecords}
                  presentationMode={presentationMode}
                  onTogglePresentationMode={setPresentationMode}
                  statusFilter={statusFilter}
                  categoryFilter={categoryFilter}
                  setCategoryFilter={setCategoryFilter}
                />
              </div>
            )}
          </div>
        </main>

      </div>
      {showColleagueManager && (
        <ColleagueManager onClose={() => setShowColleagueManager(false)} />
      )}
      {showUserProfileModal && currentUser && (
        <UserProfileModal 
          currentUser={currentUser} 
          onUpdateCurrentUser={(updatedUser) => {
            setCurrentUser(updatedUser);
            localStorage.setItem('dhl_voc_current_user', JSON.stringify(updatedUser));
          }}
          onClose={() => setShowUserProfileModal(false)}
        />
      )}

    </div>
  );
}

