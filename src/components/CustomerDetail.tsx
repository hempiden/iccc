import React, { useState, useEffect } from 'react';
import { 
  User, CheckCircle, ShieldAlert, Sparkles, Award, ArrowLeft, 
  Printer, Camera, Maximize2, Minimize2, Palette, Type, Clipboard, Layers,
  Calendar, LogIn, LogOut, Plus, Trash2, Edit3, Send, Users, ShieldCheck, 
  HelpCircle, AlertCircle, Info, RefreshCw, Layout, Table, CheckSquare, Save, Eye, EyeOff, Clock,
  MessageSquare, Mail, Share2, ExternalLink, Check, FileText
} from 'lucide-react';
import { VoCRecord, ActionOwner, TimelineEvent, VoCComment } from '../types';
import { getSurveyUrl } from '../utils/parser';
import { fetchColleagues } from '../utils/firebaseSync';
import MetricCards from './MetricCards';
import Timeline from './Timeline';

interface CustomerDetailProps {
  record: VoCRecord;
  onBack: () => void;
  onUpdateRecord: (record: VoCRecord) => void;
  currentUser: ActionOwner | null;
  onLogin: (user: ActionOwner) => void;
  onLogout: () => void;
}

const PRESET_ACTION_OWNERS: ActionOwner[] = [
  { id: '1', username: 'rothana.art', fullName: 'Rothana Art', role: 'Customer Care Lead', department: 'ICCC Team', avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&fit=crop&q=80' },
  { id: '2', username: 'panha.chhun', fullName: 'Panha Chhun', role: 'Customs Clearance Agent', department: 'Clearance Operations', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&fit=crop&q=80' },
  { id: '3', username: 'sreynich.kong', fullName: 'Sreynich Kong', role: 'Retail Supervisor', department: 'Counter Services', avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&fit=crop&q=80' },
  { id: '4', username: 'thida.sovann', fullName: 'Thida Sovann', role: 'Resolution Specialist', department: 'Escalations Team', avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&fit=crop&q=80' }
];

const getFacilityEmail = (facility: string): string => {
  const clean = facility.trim().toUpperCase();
  if (clean.includes('PNH') || clean.includes('GTW')) return 'facility.pnh@dhl.com';
  if (clean.includes('REP')) return 'facility.rep@dhl.com';
  if (clean.includes('KOS')) return 'facility.kos@dhl.com';
  if (clean.includes('BTB')) return 'facility.btb@dhl.com';
  return 'facility.operations@dhl.com';
};

const getPicEmail = (picName: string, facility: string, loadedColleagues: ActionOwner[] = []): string => {
  if (!picName || picName.trim() === '' || picName.toLowerCase() === 'unassigned') {
    return getFacilityEmail(facility);
  }

  // 1. Check in PRESET_ACTION_OWNERS
  let colleague = PRESET_ACTION_OWNERS.find(c => c.fullName.toLowerCase() === picName.toLowerCase().trim());
  
  // 2. Check in loadedColleagues
  if (!colleague && loadedColleagues) {
    colleague = loadedColleagues.find(c => c.fullName.toLowerCase() === picName.toLowerCase().trim());
  }

  let picEmail = '';
  if (colleague) {
    picEmail = `${colleague.username}@dhl.com`;
  } else {
    // Generate a default email alias from the custom name (e.g., "Rothana Art" -> "rothana.art@dhl.com")
    const cleanName = picName.toLowerCase().trim().replace(/[^a-z0-9\s.-]/g, '').replace(/\s+/g, '.');
    picEmail = cleanName ? `${cleanName}@dhl.com` : '';
  }

  return picEmail || getFacilityEmail(facility);
};

export default function CustomerDetail({ 
  record, 
  onBack, 
  onUpdateRecord, 
  currentUser, 
  onLogin, 
  onLogout 
}: CustomerDetailProps) {
  // Facility and Role-based Access Control
  const recordFacility = (record.interaction || 'PNHGTW').toUpperCase();
  const isSuperAdmin = currentUser?.role === 'superadmin';
  const isHoD = currentUser?.role === 'HoD';
  const isAssignedFacility = currentUser?.facility?.toUpperCase() === recordFacility || currentUser?.facility === 'All';
  const hasEditPermission = isSuperAdmin || isHoD || isAssignedFacility;

  // Presentation frame customizer state controls
  const [commentBoxBg, setCommentBoxBg] = useState<'blue' | 'yellow' | 'slate' | 'white'>('yellow');
  const [commentFontSize, setCommentFontSize] = useState<'md' | 'lg' | 'xl'>('md');
  const [brandColorTheme, setBrandColorTheme] = useState<'dhl' | 'indigo' | 'emerald' | 'monochrome'>('dhl');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Slide style toggle: 'table' (exact match with user's PowerPoint slide!) or 'bento' (visual modern layout)
  const [slideStyle, setSlideStyle] = useState<'table' | 'bento'>('table');
  const [showOriginalFeedback, setShowOriginalFeedback] = useState(false);
  const [showOriginalActions, setShowOriginalActions] = useState(false);

  // Outlook & Facility Dispatch Hub states
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [shareSubject, setShareSubject] = useState('');
  const [copiedEmailText, setCopiedEmailText] = useState(false);
  const [manualReplyText, setManualReplyText] = useState('');
  const [isCopiedLink, setIsCopiedLink] = useState(false);
  const [hasDispatched, setHasDispatched] = useState(false);

  // Collaboration / Action Owner workspace fields
  const [editStatus, setEditStatus] = useState<VoCRecord['status']>(record.status);
  const [editDeadline, setEditDeadline] = useState<string>('');
  const [editOwner, setEditOwner] = useState<string>('');
  const [editCustomSummary, setEditCustomSummary] = useState<string>('');
  const [editActionSummary, setEditActionSummary] = useState<string>('');
  const [editFollowUpComments, setEditFollowUpComments] = useState<string>('');
  const [editTimeline, setEditTimeline] = useState<TimelineEvent[]>([]);
  const [editComments, setEditComments] = useState<VoCComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [isSavedNotify, setIsSavedNotify] = useState(false);

  // Colleague dropdown integration for Superadmins & HoDs
  const [colleagues, setColleagues] = useState<ActionOwner[]>([]);
  const [selectedOwnerValue, setSelectedOwnerValue] = useState<string>('');
  const [isCustomOwner, setIsCustomOwner] = useState<boolean>(false);

  // New action form state
  const [newTimestamp, setNewTimestamp] = useState('');
  const [newAction, setNewAction] = useState('');

  // Register state
  const [regUsername, setRegUsername] = useState('');
  const [regFullName, setRegFullName] = useState('');
  const [regRole, setRegRole] = useState('Case Owner');
  const [regDept, setRegDept] = useState('Customer Experience');
  const [showAuthTab, setShowAuthTab] = useState<'login' | 'register'>('login');

  // Load all registered colleagues for ownership selector
  useEffect(() => {
    let active = true;
    const loadAllColleagues = async () => {
      try {
        const list = await fetchColleagues();
        if (active) {
          setColleagues(list);
        }
      } catch (err) {
        console.error('Failed to load registered colleagues:', err);
      }
    };
    if (isSuperAdmin || isHoD) {
      loadAllColleagues();
    }
    return () => {
      active = false;
    };
  }, [isSuperAdmin, isHoD]);

  // Synchronize parameter form editing states with loaded record strictly when record ID changes
  useEffect(() => {
    setEditStatus(record.status);
    setEditOwner(record.owner || '');
    setEditCustomSummary(record.customSummary || '');
    setEditActionSummary(record.actionSummary || '');
    setEditFollowUpComments(record.followUpComments || '');
    setEditTimeline([...record.timeline]);
    setShowOriginalFeedback(false);
    setShowOriginalActions(false);

    // Infer a default deadline from timeline if exists, else blank
    const inferredDeadline = record.timeline[0]?.deadline || '30 Apr';
    setEditDeadline(inferredDeadline);

    // Sync Outlook dispatch details
    setShareEmail(getPicEmail(record.owner || '', recordFacility, colleagues));
    setShareSubject(`[VoC Action Required] Survey Case ID: ${record.surveyId || record.id} (Facility: ${recordFacility})`);
    setHasDispatched(false);
    setManualReplyText('');
  }, [record.id, recordFacility]);

  // Sync share email recipient dynamically when Assigned Owner (editOwner) changes
  useEffect(() => {
    setShareEmail(getPicEmail(editOwner, recordFacility, colleagues));
  }, [editOwner, recordFacility, colleagues]);

  // Keep comments in sync with database/record changes, independent of other parameter fields
  useEffect(() => {
    setEditComments(record.comments || []);
  }, [record.id, record.comments]);

  // Handle owner selection syncing
  useEffect(() => {
    if (!editOwner) {
      setSelectedOwnerValue('');
      setIsCustomOwner(false);
      return;
    }

    const found = colleagues.some(
      c => c.fullName.trim().toLowerCase() === editOwner.trim().toLowerCase()
    );

    if (found) {
      const colleague = colleagues.find(
        c => c.fullName.trim().toLowerCase() === editOwner.trim().toLowerCase()
      );
      setSelectedOwnerValue(colleague ? colleague.fullName : editOwner);
      setIsCustomOwner(false);
    } else {
      setSelectedOwnerValue('custom');
      setIsCustomOwner(true);
    }
  }, [editOwner, colleagues]);

  // Owner selection dropdown changer
  const handleOwnerSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === 'custom') {
      setIsCustomOwner(true);
      setSelectedOwnerValue('custom');
      setEditOwner('');
    } else {
      setIsCustomOwner(false);
      setSelectedOwnerValue(val);
      setEditOwner(val);
    }
  };

  // Client-side automatic timeline actions summary helper
  const getCondensedTimeline = (id: string, timeline: TimelineEvent[]): TimelineEvent[] => {
    // 1. Curated premium summaries for preloaded cases
    if (id === '263437429') {
      return [
        { timestamp: '10-14 Apr 2026', action: 'Delayed pickup & flight import due to Thai & Cambodian public holidays.', status: 'Completed', pic: 'Rothana Art' },
        { timestamp: '20 Apr 2026', action: 'Arrived in Cambodia; arranged urgent counter self-collection.', status: 'Completed', pic: 'Rothana Art' },
        { timestamp: '21 Apr 2026', action: 'Shared apology for delays and thanked customer for understanding.', status: 'Completed', pic: 'Rothana Art' }
      ];
    }
    if (id === '246896936') {
      return [
        { timestamp: '10 Mar 2026', action: 'Standard apology shared with customer for address spelling errors.', status: 'Completed', pic: 'Rothana Art' },
        { timestamp: '12 Mar 2026', action: 'Escalated to Retail Team Manager to prevent destination misspelling recurrences.', status: 'Completed', pic: 'Rothana Art' }
      ];
    }
    if (id === '28168109') {
      return [
        { timestamp: '02 Jun 2026', action: 'Escalated case to Customs Clearance Specialist Panha Chhun.', status: 'Completed', pic: 'Panha Chhun' },
        { timestamp: '03 Jun 2026', action: 'Confirmed agent already explained self-clearance rules for sample shipments.', status: 'Completed', pic: 'Panha Chhun' },
        { timestamp: '05 Jun 2026', action: 'Customer admitted misunderstanding; clarified formal import regulations.', status: 'Completed', pic: 'Panha Chhun' }
      ];
    }
    if (id === '28172901') {
      return [
        { timestamp: '05 Jun 2026', action: 'Promoter feedback shared with Sophy’s supervisor for performance recognition.', status: 'Completed', pic: 'Sophy Long' }
      ];
    }
    if (id === '28169450') {
      return [
        { timestamp: '03 Jun 2026', action: 'Assigned remote area surcharge case to Rathana Hout.', status: 'In Progress', pic: 'Rathana Hout' },
        { timestamp: '04 Jun 2026', action: 'Contacted customer to clarify postcode surcharge policy & verify coordinates.', status: 'In Progress', pic: 'Rathana Hout' }
      ];
    }
    if (id === '28167332') {
      return [
        { timestamp: '01 Jun 2026', action: 'Assigned hotline detractor case to Sreynich Kong.', status: 'In Progress', pic: 'Sreynich Kong' },
        { timestamp: '02 Jun 2026', action: 'Apologized for hotline delay; explained customs rules and offered pre-check aid.', status: 'In Progress', pic: 'Sreynich Kong' }
      ];
    }
    if (id === '28174411') {
      return [
        { timestamp: '09 Jun 2026', action: 'High-priority alert routed to specialist Thida Sovann for urgent document clearance.', status: 'New', pic: 'Thida Sovann' }
      ];
    }

    // 2. High-fidelity dynamic fallback auto-summarizer for custom or edited timelines
    const meaningfulEvents = timeline.filter(ev => {
      const act = ev.action.toLowerCase();
      if (act.includes('alert created') || act.includes('alert status set') || act.includes('thank-you email') || act.includes('automatically assigned')) {
        return false;
      }
      return true;
    });

    const targetList = meaningfulEvents.length > 0 ? meaningfulEvents : timeline;

    return targetList.map(ev => {
      let simplifiedAction = ev.action;
      
      // Remove prefixes like "1. ", "2. ", "Case Edited: ", "Alert Assigned: "
      simplifiedAction = simplifiedAction.replace(/^(Case Edited:\s*|Alert Assigned:\s*|\d+[\.\)\s]+\s*)/i, '');
      
      // Truncate to first sentence if long
      const dotIndex = simplifiedAction.indexOf('.');
      if (dotIndex > 15 && dotIndex < simplifiedAction.length - 1) {
        simplifiedAction = simplifiedAction.substring(0, dotIndex + 1);
      }
      
      // Limit to 100 chars
      if (simplifiedAction.length > 100) {
        simplifiedAction = simplifiedAction.substring(0, 97) + '...';
      }

      return {
        ...ev,
        action: simplifiedAction
      };
    });
  };

  // Client-side automatic summary helper
  const getAutoSummary = (text: string) => {
    if (text.length <= 130) return text;
    const sentences = text.split(/[.!?]+/);
    if (sentences.length > 0) {
      const firstTwo = sentences.slice(0, 2).join('. ').trim();
      if (firstTwo.length > 15 && firstTwo.length < 220) {
        return firstTwo + '.';
      }
    }
    return text.substring(0, 135).trim() + '...';
  };

  // Client-side automatic comments summary helper
  const getAutoCommentSummary = (comments: VoCComment[]) => {
    if (comments.length === 0) return 'No follow-up comments logged in system.';
    return comments.map(item => `• ${item.timestamp.split(' ')[0]}: ${item.text} (${item.author})`).join('\n');
  };

  const activeSummary = editCustomSummary || record.customSummary || getAutoSummary(record.comment);
  const activeActionSummary = editActionSummary || record.actionSummary || getAutoCommentSummary(editComments);

  const getFormattedDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  // Add Comment to follow-up conversation thread & save immediately
  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !currentUser) return;

    const newComment: VoCComment = {
      id: Date.now().toString(),
      timestamp: getFormattedDateTime(),
      author: currentUser.fullName,
      role: currentUser.role,
      text: commentText.trim()
    };

    const updatedComments = [...editComments, newComment];
    setEditComments(updatedComments);
    setCommentText('');

    // Immediately persist comment update
    onUpdateRecord({
      ...record,
      comments: updatedComments
    });
  };

  // Remove comment & save immediately
  const handleRemoveComment = (id: string) => {
    const updatedComments = editComments.filter(c => c.id !== id);
    setEditComments(updatedComments);

    // Immediately persist comment removal
    onUpdateRecord({
      ...record,
      comments: updatedComments
    });
  };

  // Save changes and publish to management slide
  const handlePublishUpdate = () => {
    const updatedRecord: VoCRecord = {
      ...record,
      status: editStatus,
      owner: editOwner || 'Rothana Art',
      customSummary: editCustomSummary || undefined,
      actionSummary: editActionSummary || undefined,
      followUpComments: editFollowUpComments || undefined,
      timeline: editTimeline.map(t => ({
        ...t,
        pic: editOwner || t.pic || 'Rothana Art',
        deadline: editDeadline || t.deadline || '30 Apr',
        status: editStatus === 'Closed' ? 'Completed' : (t.status || 'In Progress')
      })),
      comments: editComments
    };

    onUpdateRecord(updatedRecord);
    setIsSavedNotify(true);
    setTimeout(() => setIsSavedNotify(false), 3000);
  };

  const generateMailtoLink = () => {
    const bodyText = `Dear Facility Team,

Please assist in checking the progress of the following Voice of the Customer (VoC) feedback:

- Case ID: ${record.surveyId || record.id}
- Facility: ${recordFacility}
- NPS Category: ${record.category} (Score: ${record.likelihood})

Customer Comment:
"${record.comment}"

Management Summary:
"${activeSummary}"

Please click the secure link below to view this case, add updates, or respond directly in the VoC Portal:
${window.location.origin}/?id=${record.id}

Best regards,
${currentUser?.fullName || 'VoC Team'}
${currentUser?.role || ''} (${currentUser?.department || ''})`;

    return `mailto:${encodeURIComponent(shareEmail)}?subject=${encodeURIComponent(shareSubject)}&body=${encodeURIComponent(bodyText)}`;
  };

  const handleDispatchSuccess = () => {
    // 1. Trigger the Mailto link
    const mailLink = generateMailtoLink();
    window.location.href = mailLink;

    // 2. Add an automatic system comment
    const dispatchComment: VoCComment = {
      id: `sys-${Date.now()}`,
      timestamp: getFormattedDateTime(),
      author: currentUser?.fullName || 'VoC Portal',
      role: currentUser?.role || 'System',
      text: `📧 [SYSTEM ALERT] Dispatched case to Facility Team (${shareEmail}). Awaiting feedback.`
    };
    const updatedComments = [...editComments, dispatchComment];
    setEditComments(updatedComments);

    // Also add to the timeline
    const dispatchEvent: TimelineEvent = {
      timestamp: 'Today',
      action: `Email Dispatched to Facility (${shareEmail})`,
      pic: currentUser?.fullName || 'System',
      status: 'In Progress'
    };
    const updatedTimeline = [dispatchEvent, ...editTimeline];
    setEditTimeline(updatedTimeline);

    // Save to Firestore
    onUpdateRecord({
      ...record,
      comments: updatedComments,
      timeline: updatedTimeline
    });

    setHasDispatched(true);
  };

  const handleSyncManualReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualReplyText.trim()) return;

    const replyComment: VoCComment = {
      id: `outlook-sync-${Date.now()}`,
      timestamp: getFormattedDateTime(),
      author: `Outlook Sync [Facility]`,
      role: 'Facility Team Response',
      text: manualReplyText.trim()
    };

    const updatedComments = [...editComments, replyComment];
    setEditComments(updatedComments);
    setManualReplyText('');

    // Update status to In Progress automatically
    onUpdateRecord({
      ...record,
      status: 'In Progress',
      comments: updatedComments
    });

    alert('Email response successfully saved and synchronized into the Conversation History!');
  };

  const handleSimulateFacilityReply = () => {
    const mockReplies = [
      "Hello team, thank you for the dispatch. We have received the request and have assigned our supervisor to investigate this case. We will expedite the resolution and report back shortly.",
      "Hi Customer Care, we checked the AWB records. The shipment was briefly held for customs clearance and duty assessment, but has now been cleared and released to the dispatch courier. Scheduled for delivery tomorrow morning.",
      "Dear Resolution team, we have contacted the customer directly to coordinate a preferred delivery time slot to avoid further inconvenience. Thanks for highlighting this!",
      "Operations Team Note: Warehouse search completed. The package was sorted into the wrong cage, causing a 24-hour delay. Corrective actions taken, and the package is on the way."
    ];
    const randomReply = mockReplies[Math.floor(Math.random() * mockReplies.length)];

    const replyComment: VoCComment = {
      id: `outlook-simulate-${Date.now()}`,
      timestamp: getFormattedDateTime(),
      author: `Facility Team (${recordFacility})`,
      role: 'Facility Operations',
      text: randomReply
    };

    const updatedComments = [...editComments, replyComment];
    setEditComments(updatedComments);

    // Also append to the timeline!
    const updatedTimeline = [
      {
        timestamp: 'Today',
        action: `Facility Team Reply synced via Outlook: "${randomReply.substring(0, 50)}..."`,
        pic: `Facility Team`,
        status: 'In Progress' as const
      },
      ...editTimeline
    ];
    setEditTimeline(updatedTimeline);

    onUpdateRecord({
      ...record,
      status: 'In Progress',
      comments: updatedComments,
      timeline: updatedTimeline
    });

    alert('Mock email response from Facility Team successfully simulated and synchronized as a comment in the VoC Portal!');
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regUsername.trim() || !regFullName.trim()) return;

    const newUser: ActionOwner = {
      id: Date.now().toString(),
      username: regUsername.toLowerCase().trim(),
      fullName: regFullName.trim(),
      role: regRole.trim(),
      department: regDept.trim(),
      avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&fit=crop&q=80'
    };

    onLogin(newUser);
    // Auto-claim the case on registration
    setEditOwner(newUser.fullName);
  };

  // Helper text size classes
  const fontSizes = {
    md: 'text-xs md:text-sm leading-relaxed',
    lg: 'text-sm md:text-base font-medium leading-relaxed',
    xl: 'text-base md:text-lg font-semibold leading-relaxed'
  };

  // Helper background classes for "Voice of the Customer" comment box
  const commentBoxBgs = {
    blue: 'bg-blue-50/70 border-blue-200 text-slate-900 shadow-xs',
    yellow: 'bg-amber-50/70 border-amber-200 text-amber-950 shadow-xs',
    slate: 'bg-slate-50/80 border-slate-200 text-slate-900 shadow-xs',
    white: 'bg-white border-slate-200 text-slate-900 shadow-xs'
  };

  // Helper brand border and title themes
  const brandThemes = {
    dhl: {
      border: 'border-amber-400',
      headerBg: 'bg-amber-500',
      headerText: 'text-red-950 font-extrabold',
      accentColor: 'text-red-600',
      pill: 'bg-red-100 text-red-800 border-red-200'
    },
    indigo: {
      border: 'border-indigo-600',
      headerBg: 'bg-indigo-600',
      headerText: 'text-white font-bold',
      accentColor: 'text-indigo-600',
      pill: 'bg-indigo-50 text-indigo-700 border-indigo-100'
    },
    emerald: {
      border: 'border-emerald-600',
      headerBg: 'bg-emerald-600',
      headerText: 'text-white font-bold',
      accentColor: 'text-emerald-600',
      pill: 'bg-emerald-50 text-emerald-700 border-emerald-100'
    },
    monochrome: {
      border: 'border-slate-800',
      headerBg: 'bg-slate-900',
      headerText: 'text-white font-bold',
      accentColor: 'text-slate-800',
      pill: 'bg-slate-100 text-slate-800 border-slate-200'
    }
  };

  const selectedTheme = brandThemes[brandColorTheme];

  // Action: Print / PDF
  const handlePrint = () => {
    window.print();
  };

  // Action: Copy text outline
  const handleCopyText = () => {
    const textToCopy = `
Survey Case Report - ID: ${record.surveyId || record.id}
Likelihood (NPS): ${record.likelihood} (${record.category})
Case Status: ${record.status}
Follow-up Owner: ${record.owner}
Interaction Code: ${record.interaction || 'N/A'}

Voice of the Customer:
"${record.comment}"

Summary representation:
"${activeSummary}"

Action Resolution Log:
${editTimeline.map((t, idx) => `[${idx + 1}] ${t.timestamp} - ${t.action} (PIC: ${t.pic || record.owner}, Deadline: ${t.deadline || 'N/A'}, Status: ${t.status || 'Completed'})`).join('\n')}
    `;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`w-full ${isFullscreen ? 'max-w-full' : 'max-w-6xl'} mx-auto animate-fade-in`}>
      {/* 1. Header Toolbar (Hidden during printing) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 print:hidden">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-xs transition-colors cursor-pointer w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to List
        </button>

        <div className="flex flex-wrap items-center gap-2">
          {/* Slide Style Layout Selector */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/60 mr-2">
            <button
              onClick={() => setSlideStyle('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${slideStyle === 'table' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
            >
              <Table className="w-3.5 h-3.5" />
              PowerPoint Layout
            </button>
            <button
              onClick={() => setSlideStyle('bento')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${slideStyle === 'bento' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
            >
              <Layout className="w-3.5 h-3.5" />
              Bento Grid Layout
            </button>
          </div>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            Print/Save PDF
          </button>

          <button
            onClick={handleCopyText}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Clipboard className="w-4 h-4 text-slate-500" />
            {copied ? 'Copied!' : 'Copy Raw Report'}
          </button>

          <button
            onClick={() => setShowShareModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Mail className="w-4 h-4 text-amber-500 animate-pulse" />
            Outlook Dispatch
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-slate-800 hover:bg-slate-900 rounded-xl shadow-sm transition-colors cursor-pointer"
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-4 h-4" />
                Exit Presentation Layout
              </>
            ) : (
              <>
                <Maximize2 className="w-4 h-4" />
                Presentation Focus Mode
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. Slide Live Customizer Panel */}
      <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200/60 print:hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Palette className="w-4 h-4 text-slate-500" />
            Slide customizer (Pro-Tip settings)
          </span>
          <p className="text-[11px] text-slate-500">
            Tailor frame colors, feedback formatting, and presentation layout templates.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs">
          {/* Brand Border Theme */}
          <div className="flex flex-col gap-1">
            <span className="font-semibold text-slate-600">Slide Frame Border:</span>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setBrandColorTheme('dhl')} 
                className={`px-2 py-1 rounded border text-[10px] font-bold ${brandColorTheme === 'dhl' ? 'bg-amber-100 border-amber-400 text-amber-800' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'}`}
              >
                DHL Gold
              </button>
              <button 
                onClick={() => setBrandColorTheme('indigo')} 
                className={`px-2 py-1 rounded border text-[10px] font-bold ${brandColorTheme === 'indigo' ? 'bg-indigo-100 border-indigo-400 text-indigo-800' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'}`}
              >
                Corporate Indigo
              </button>
              <button 
                onClick={() => setBrandColorTheme('emerald')} 
                className={`px-2 py-1 rounded border text-[10px] font-bold ${brandColorTheme === 'emerald' ? 'bg-emerald-100 border-emerald-400 text-emerald-800' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'}`}
              >
                Mint Fresh
              </button>
              <button 
                onClick={() => setBrandColorTheme('monochrome')} 
                className={`px-2 py-1 rounded border text-[10px] font-bold ${brandColorTheme === 'monochrome' ? 'bg-slate-100 border-slate-400 text-slate-800' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'}`}
              >
                Slate
              </button>
            </div>
          </div>

          {/* Voice of Customer Box color */}
          <div className="flex flex-col gap-1">
            <span className="font-semibold text-slate-600">Comment Background:</span>
            <div className="flex items-center gap-1">
              {(['blue', 'yellow', 'slate', 'white'] as const).map((color) => (
                <button
                  key={color}
                  onClick={() => setCommentBoxBg(color)}
                  className={`px-2.5 py-1 rounded-md border capitalize text-[10px] font-medium ${
                    commentBoxBg === color 
                      ? 'bg-slate-800 border-slate-800 text-white' 
                      : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  {color}
                </button>
              ))}
            </div>
          </div>

          {/* Comment Text Font Size */}
          <div className="flex flex-col gap-1">
            <span className="font-semibold text-slate-600">Feedback Size:</span>
            <div className="flex items-center gap-1">
              {(['md', 'lg', 'xl'] as const).map((sz) => (
                <button
                  key={sz}
                  onClick={() => setCommentFontSize(sz)}
                  className={`px-2.5 py-1 rounded-md border uppercase text-[10px] font-extrabold ${
                    commentFontSize === sz 
                      ? 'bg-slate-800 border-slate-800 text-white' 
                      : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  {sz}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. The Slide-Ready Document Card Frame */}
      <div 
        id="voc-slide-presentation-card"
        className={`bg-white border-[12px] ${selectedTheme.border} rounded-2xl shadow-xl overflow-hidden print:border-[10px] print:shadow-none print:my-0 transition-all duration-300`}
      >
        {/* Slide Header Bar */}
        <div className={`p-4 ${selectedTheme.headerBg} flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-white`}>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-lg font-black tracking-tight font-sans text-white uppercase print:text-black">
              Key Actions Taken To Address Voice of Customer
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Real Traffic light block */}
            <div className="flex items-center gap-1.5 bg-slate-900/40 px-2.5 py-1 rounded-full border border-white/10" title="Case Status Traffic Lights">
              <div className={`w-3 h-3 rounded-full ${editStatus === 'New' ? 'bg-red-500 shadow-[0_0_8px_#ef4444]' : 'bg-red-950/40'}`}></div>
              <div className={`w-3 h-3 rounded-full ${editStatus === 'In Progress' ? 'bg-yellow-400 shadow-[0_0_8px_#facc15]' : 'bg-yellow-950/40'}`}></div>
              <div className={`w-3 h-3 rounded-full ${editStatus === 'Completed' ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-green-950/40'}`}></div>
            </div>

            <div className="flex items-center gap-2.5 text-xs text-white/95">
              {record.interaction && (
                <span className="px-2 py-0.5 rounded bg-white/15 border border-white/10 font-mono font-semibold">
                  {record.interaction}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Slide Body Panel */}
        <div className="p-6 md:p-8 bg-white text-slate-800">
          
          {/* Render layout based on Style Toggle */}
          {slideStyle === 'table' ? (
            /* 100% PowerPoint Slide layout recreation with yellow headers */
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs font-sans">
              
              {/* Header Row */}
              <div className="grid grid-cols-12 bg-amber-400 border-b border-slate-300 text-slate-900 font-extrabold text-[11px] sm:text-xs uppercase tracking-wider text-center">
                <div className="col-span-3 py-3 border-r border-slate-300/30">VoC</div>
                <div className="col-span-6 py-3 border-r border-slate-300/30">Key Actions Taken</div>
                <div className="col-span-1 py-3 border-r border-slate-300/30">Deadline</div>
                <div className="col-span-1 py-3 border-r border-slate-300/30">PIC</div>
                <div className="col-span-1 py-3">Status</div>
              </div>

              {/* Data Row */}
              <div className="grid grid-cols-12 items-stretch text-slate-800 bg-slate-50/20">
                
                {/* 1. VoC Customer Feedback Cell */}
                <div className="col-span-3 p-4 border-r border-slate-200 flex flex-col justify-between bg-white/70">
                  <div className="space-y-4">
                    <div className={`p-4 rounded-xl border relative overflow-hidden transition-all duration-200 ${commentBoxBgs[commentBoxBg]}`}>
                      <span className="absolute -right-1 -bottom-4 text-slate-300/30 text-5xl font-serif pointer-events-none select-none">“</span>
                      
                      <blockquote className={`${fontSizes[commentFontSize]} text-slate-950 font-sans italic relative z-10 leading-relaxed font-medium whitespace-pre-line`}>
                        "{showOriginalFeedback ? record.comment : activeSummary}"
                      </blockquote>
                    </div>

                    {/* Toggle button to switch summary/full feedback */}
                    {record.comment.length > 130 && (
                      <button
                        onClick={() => setShowOriginalFeedback(!showOriginalFeedback)}
                        className="flex items-center gap-1 text-[10px] font-extrabold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer w-fit uppercase"
                      >
                        {showOriginalFeedback ? (
                          <>
                            <EyeOff className="w-3.5 h-3.5" />
                            Show Condensed Summary
                          </>
                        ) : (
                          <>
                            <Eye className="w-3.5 h-3.5" />
                            Show Full Original Comment
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Core AWB & Survey metadata at the bottom */}
                  <div className="mt-4 pt-3 border-t border-slate-100 text-[10px] space-y-1.5 font-sans font-semibold text-slate-500">
                    <div>
                      <span className="text-slate-400">AWB:</span>{' '}
                      {record.awbNumber ? (
                        <a
                          href={`https://sherloc.dhl.com/link/hwb/${record.awbNumber}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-blue-600 hover:text-blue-800 hover:underline font-bold transition-colors"
                        >
                          {record.awbNumber}
                        </a>
                      ) : (
                        <span className="font-mono text-slate-400">No AWB</span>
                      )}
                    </div>
                    <div className="truncate" title={record.surveyId || record.id}>
                      <span className="text-slate-400">Survey ID:</span>{' '}
                      <a
                        href={getSurveyUrl(record.surveyId || record.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 hover:underline font-bold transition-colors"
                      >
                        {record.surveyId || record.id}
                      </a>
                    </div>
                    <div className="truncate text-slate-700" title={record.customerName}>
                      ({record.customerName || 'Anonymous'})
                    </div>
                  </div>
                </div>

                 {/* 2. Key Actions Taken Cell */}
                <div className="col-span-6 p-5 border-r border-slate-200 bg-white flex flex-col justify-between">
                  <div>
                    {editComments.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full py-8 text-center text-slate-400 text-xs">
                        <Clock className="w-6 h-6 text-slate-300 mb-1" />
                        <span>No follow-up comments registered yet.</span>
                        <span className="text-[10px] text-slate-400 mt-0.5">Use the Action Owner Portal below to post comments.</span>
                      </div>
                    ) : showOriginalActions ? (
                      <ul className="space-y-3 text-xs text-slate-700">
                        {editComments.map((item, idx) => (
                          <li key={item.id || idx} className="flex items-start gap-2.5 leading-relaxed">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-900 mt-1.5 shrink-0"></span>
                            <div>
                              <span className="font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/50 mr-1.5 font-mono text-[10px]">
                                {item.timestamp.split(' ')[0] || item.timestamp}
                              </span>
                              <span className="font-extrabold text-slate-900 mr-1">
                                {item.author} ({item.role}):
                              </span>
                              <span className="font-medium text-slate-800">{item.text}</span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="space-y-2.5">
                        {activeActionSummary.split('\n').map((line, idx) => {
                          const cleanLine = line.replace(/^[•\-\*\s]+/, '').trim();
                          if (!cleanLine) return null;
                          return (
                            <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-800 leading-relaxed font-semibold">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-900 mt-1.5 shrink-0"></span>
                              <span>{cleanLine}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {editComments.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-100/60">
                      <button
                        onClick={() => setShowOriginalActions(!showOriginalActions)}
                        className="flex items-center gap-1.5 text-[10px] font-extrabold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer w-fit uppercase"
                      >
                        {showOriginalActions ? (
                          <>
                            <EyeOff className="w-3.5 h-3.5" />
                            Show Condensed Action Summary
                          </>
                        ) : (
                          <>
                            <Eye className="w-3.5 h-3.5" />
                            Show Raw In-System Followups Thread
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* 3. Deadline Cell */}
                <div className="col-span-1 p-3 border-r border-slate-200 flex items-center justify-center text-center bg-slate-50/20">
                  <span className="text-xs font-extrabold text-slate-800 bg-slate-100 px-2 py-1 rounded border border-slate-200/50">
                    {editDeadline || '30 Apr'}
                  </span>
                </div>

                {/* 4. PIC Cell */}
                <div className="col-span-1 p-3 border-r border-slate-200 flex items-center justify-center text-center bg-slate-50/20">
                  <span className="text-xs font-bold text-slate-800 break-words max-w-full leading-tight">
                    {editOwner || record.owner || 'Rothana Art'}
                  </span>
                </div>

                {/* 5. Status Cell (Colored full-height block) */}
                <div className={`col-span-1 flex flex-col items-center justify-center text-center px-2 py-4 text-white font-extrabold text-xs uppercase select-none tracking-wider ${
                  editStatus === 'Completed' ? 'bg-emerald-600' :
                  editStatus === 'In Progress' ? 'bg-yellow-500' :
                  'bg-rose-500'
                }`}>
                  <span className="rotate-0 md:-rotate-90 md:whitespace-nowrap transition-transform">
                    {editStatus === 'Completed' ? 'Completed' : editStatus === 'In Progress' ? 'In Progress' : 'New Case'}
                  </span>
                </div>

              </div>

            </div>
          ) : (
            /* Modern Interactive Bento Layout with metric panels & timeline graph */
            <div className="space-y-6">
              <MetricCards record={{ ...record, status: editStatus, owner: editOwner || record.owner }} />

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Voice of the Customer */}
                <div className="lg:col-span-5 space-y-6">
                  <div className="flex flex-col rounded-xl border-2 border-slate-200 overflow-hidden shadow-xs bg-white">
                    <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex justify-between items-center">
                      <span className="text-xs font-extrabold uppercase tracking-widest text-slate-500">Customer Feedback Summary</span>
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">verified story</span>
                    </div>
                    
                    <div className={`p-6 relative overflow-hidden transition-all duration-200 ${commentBoxBgs[commentBoxBg]}`}>
                      <span className="absolute -right-3 -bottom-8 text-slate-200/40 text-9xl font-serif pointer-events-none select-none">“</span>
                      
                      <blockquote className={`${fontSizes[commentFontSize]} text-slate-950 font-sans italic relative z-10 leading-relaxed font-medium whitespace-pre-line`}>
                        "{showOriginalFeedback ? record.comment : activeSummary}"
                      </blockquote>
                    </div>

                    {record.comment.length > 130 && (
                      <div className="p-3 bg-slate-50/50 border-t border-slate-100 flex justify-center">
                        <button
                          onClick={() => setShowOriginalFeedback(!showOriginalFeedback)}
                          className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-xs hover:bg-slate-50 cursor-pointer"
                        >
                          {showOriginalFeedback ? (
                            <>
                              <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                              View Simplified Summary
                            </>
                          ) : (
                            <>
                              <Eye className="w-3.5 h-3.5 text-slate-500" />
                              Read Full Original Comment
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Follow up comments / bulletins */}
                  {(editFollowUpComments || record.followUpComments) && (
                    <div className="flex flex-col rounded-xl border-2 border-slate-200 overflow-hidden shadow-xs bg-white">
                      <div className="bg-slate-50 px-5 py-3 border-b border-slate-200">
                        <span className="text-xs font-extrabold uppercase tracking-widest text-slate-500">Additional Details</span>
                      </div>
                      <div className="p-5 text-sm text-slate-700 bg-white leading-relaxed font-sans whitespace-pre-line">
                        {editFollowUpComments || record.followUpComments}
                      </div>
                    </div>
                  )}
                </div>

                {/* Vertical interactive Comments Log */}
                <div className="lg:col-span-7">
                  <div className="flex flex-col rounded-xl border-2 border-slate-200 overflow-hidden shadow-xs bg-white">
                    <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex justify-between items-center">
                      <span className="text-xs font-extrabold uppercase tracking-widest text-slate-500">Conversation History</span>
                      <span className="text-[9px] text-emerald-600 font-bold uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Team
                      </span>
                    </div>

                    <div className="p-6 bg-white max-h-[500px] overflow-y-auto pr-2 space-y-4">
                      {editComments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400 text-xs">
                          <MessageSquare className="w-8 h-8 text-slate-300 mb-2" />
                          <span>No follow-up comments registered yet.</span>
                          <span className="text-[10px] text-slate-400 mt-1 max-w-xs leading-relaxed">
                            Use the Action Owner Collaboration Portal below to ask questions, log milestones, or follow up.
                          </span>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {editComments.map((comment, index) => {
                            const isMe = currentUser?.fullName && comment.author.toLowerCase() === currentUser.fullName.toLowerCase();
                            const isHodRole = comment.role.toLowerCase() === 'hod';
                            const isSuperAdminRole = comment.role.toLowerCase() === 'superadmin';
                            
                            let badgeStyle = "bg-slate-100 text-slate-700 border-slate-200";
                            if (isSuperAdminRole) badgeStyle = "bg-amber-100 text-amber-800 border-amber-300 font-black";
                            else if (isMe) badgeStyle = "bg-blue-100 text-blue-800 border-blue-200 font-bold";
                            else if (isHodRole) badgeStyle = "bg-purple-100 text-purple-800 border-purple-200 font-bold";

                            return (
                              <div key={comment.id || index} className={`flex gap-3 items-start ${isMe ? 'flex-row-reverse' : ''}`}>
                                <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs uppercase shrink-0">
                                  {comment.author.charAt(0)}
                                </div>
                                <div className={`flex flex-col max-w-[80%] ${isMe ? 'items-end' : ''}`}>
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-black text-slate-800">{comment.author}</span>
                                    <span className={`text-[9px] px-1.5 py-0.5 rounded border ${badgeStyle} uppercase scale-90`}>
                                      {comment.role}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-mono">
                                      {comment.timestamp}
                                    </span>
                                  </div>
                                  <div className={`p-3 rounded-2xl text-xs leading-relaxed ${
                                    isMe 
                                      ? 'bg-amber-500 text-slate-950 rounded-tr-none font-medium shadow-xs' 
                                      : 'bg-slate-50 text-slate-800 rounded-tl-none border border-slate-100 shadow-2xs'
                                  }`}>
                                    {comment.text}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Excel Sourced Log Reference Panel */}
      <div className="mt-6 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs print:hidden">
        <details className="group">
          <summary className="flex justify-between items-center p-5 cursor-pointer font-bold text-sm text-slate-800 hover:bg-slate-50/50 select-none">
            <div className="flex items-center gap-2">
              <Clipboard className="w-4 h-4 text-slate-500" />
              <span>📋 Reference: Excel Sourced Timeline Log ({editTimeline.length} events)</span>
            </div>
            <span className="text-xs font-bold text-slate-400 group-open:rotate-180 transition-transform duration-200">
              ▼
            </span>
          </summary>
          <div className="p-6 border-t border-slate-100 bg-slate-50/30">
            <div className="bg-white rounded-xl border border-slate-200/60 p-4 max-h-[350px] overflow-y-auto">
              <Timeline events={editTimeline} />
            </div>
          </div>
        </details>
      </div>

      {/* Save Success Banner */}
      {isSavedNotify && (
        <div className="mt-4 p-3 bg-emerald-500 text-white font-semibold text-sm rounded-xl text-center shadow-md animate-bounce flex items-center justify-center gap-2">
          <CheckSquare className="w-5 h-5" />
          Published update successfully! The PowerPoint slide layout at the top is now updated.
        </div>
      )}

      {/* 4. The Action Owner Collaboration Portal & Workspace */}
      <div className="mt-8 p-6 bg-white rounded-2xl border border-slate-200 shadow-sm print:hidden">
        
        {/* Portal Authentication Check */}
        {!currentUser ? (
          /* Sign-in Section with clean layout */
          <div className="space-y-6">
            <div className="flex items-start gap-3.5 p-4 bg-amber-50 rounded-xl border border-amber-200/50 text-amber-950">
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-extrabold uppercase tracking-wider">Action Owner Workspace Locked</h4>
                <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                  To register resolution bulletins, adjust deadlines, draft concise management summaries, or claim responsibility for this case, please log in as an authorized Action Owner.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
              
              {/* Login Column (Preset select) */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <LogIn className="w-4 h-4 text-slate-500" />
                  <span className="text-xs font-black uppercase tracking-wider text-slate-700">Quick Login (Authorized Owners)</span>
                </div>
                
                <p className="text-xs text-slate-500">
                  Select your profile from the preset authorized DHL case handlers to claim responsibility immediately:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {PRESET_ACTION_OWNERS.map((owner) => (
                    <button
                      key={owner.id}
                      onClick={() => {
                        onLogin(owner);
                        setEditOwner(owner.fullName);
                      }}
                      className="flex items-center gap-3 p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 hover:border-slate-300 rounded-xl transition-all text-left cursor-pointer"
                    >
                      <img
                        src={owner.avatarUrl}
                        alt={owner.fullName}
                        className="w-8 h-8 rounded-full object-cover border border-slate-200"
                        referrerPolicy="no-referrer"
                      />
                      <div className="truncate">
                        <div className="text-xs font-bold text-slate-800 truncate">{owner.fullName}</div>
                        <div className="text-[9px] text-slate-500 font-medium truncate">{owner.role}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Register Column */}
              <div className="space-y-4 border-t md:border-t-0 md:border-l border-slate-100 pt-6 md:pt-0 md:pl-8">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Plus className="w-4 h-4 text-slate-500" />
                  <span className="text-xs font-black uppercase tracking-wider text-slate-700">Register New Handler Profile</span>
                </div>

                <form onSubmit={handleRegister} className="space-y-3.5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Full Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Rothana Art"
                      value={regFullName}
                      onChange={(e) => setRegFullName(e.target.value)}
                      required
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Username / Email Alias</label>
                    <input
                      type="text"
                      placeholder="e.g. rothana.art"
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value)}
                      required
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-amber-500 font-mono"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Role Title</label>
                      <input
                        type="text"
                        value={regRole}
                        onChange={(e) => setRegRole(e.target.value)}
                        required
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Department</label>
                      <input
                        type="text"
                        value={regDept}
                        onChange={(e) => setRegDept(e.target.value)}
                        required
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-lg shadow-sm cursor-pointer transition-all"
                  >
                    Register & Start Editing Case
                  </button>
                </form>
              </div>

            </div>
          </div>
        ) : (
          /* Active Interactive Workspace Suite */
          <div className="space-y-6">
            
            {/* Header profile status */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-amber-400 font-black text-sm uppercase">
                  {currentUser.fullName.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-extrabold text-slate-800">{currentUser.fullName}</span>
                    <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded uppercase">
                      Action Owner
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 font-medium">
                    {currentUser.role} · {currentUser.department}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {editOwner.toLowerCase() !== currentUser.fullName.toLowerCase() && (
                  <button
                    onClick={() => setEditOwner(currentUser.fullName)}
                    disabled={!hasEditPermission}
                    className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 disabled:opacity-50 disabled:cursor-not-allowed text-amber-800 border border-amber-300 text-xs font-bold rounded-lg cursor-pointer transition-all"
                  >
                    Claim Case (Self-Assign as PIC)
                  </button>
                )}
                <button
                  onClick={onLogout}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-all cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            </div>

            {!hasEditPermission && (
              <div className="flex items-start gap-3.5 p-4 bg-rose-50 border border-rose-200/60 rounded-xl text-rose-950">
                <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-rose-800">Read-Only Facility Restricted Access</h4>
                  <p className="text-xs text-rose-700 mt-1 leading-relaxed">
                    This case is assigned to Facility <span className="font-extrabold">{recordFacility}</span>. Your account is assigned to Facility <span className="font-extrabold">{currentUser?.facility || 'None'}</span>. Only colleagues assigned to <span className="font-extrabold">{recordFacility}</span>, Head of Department (HoD), or Superadmin roles can log actions or publish updates for this case.
                  </p>
                </div>
              </div>
            )}

            {/* Editing workspace columns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Left Form: Metadata & Summaries */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Edit3 className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-black uppercase tracking-wider text-slate-700">Case Parameters</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Case Status</label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as VoCRecord['status'])}
                      disabled={!hasEditPermission}
                      className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <option value="New">New</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Case Target Deadline</label>
                    <input
                      type="text"
                      value={editDeadline}
                      onChange={(e) => setEditDeadline(e.target.value)}
                      placeholder="e.g. 30 Apr"
                      disabled={!hasEditPermission}
                      className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Assigned Owner</label>
                  {(isSuperAdmin || isHoD) ? (
                    <div className="space-y-2">
                      <select
                        value={selectedOwnerValue}
                        onChange={handleOwnerSelectChange}
                        disabled={!hasEditPermission}
                        className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden disabled:opacity-60 disabled:cursor-not-allowed font-medium text-slate-800"
                      >
                        <option value="">-- Select Registered Colleague --</option>
                        {colleagues.map((c) => (
                          <option key={c.id} value={c.fullName}>
                            {c.fullName} ({c.role} {c.department ? `· ${c.department}` : ''})
                          </option>
                        ))}
                        <option value="custom">Other / Custom Name...</option>
                      </select>
                      {isCustomOwner && (
                        <div className="animate-fade-in space-y-1">
                          <input
                            type="text"
                            value={editOwner}
                            onChange={(e) => setEditOwner(e.target.value)}
                            placeholder="Type colleague's full name"
                            disabled={!hasEditPermission}
                            className="w-full p-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden disabled:opacity-60 disabled:cursor-not-allowed placeholder-slate-400 font-medium text-slate-800"
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={editOwner}
                      onChange={(e) => setEditOwner(e.target.value)}
                      placeholder="e.g. Rothana Art"
                      disabled={!hasEditPermission}
                      className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden disabled:opacity-60 disabled:cursor-not-allowed font-medium text-slate-800"
                    />
                  )}
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Slide Summary</label>
                  </div>
                  <textarea
                    rows={3}
                    value={editCustomSummary}
                    onChange={(e) => setEditCustomSummary(e.target.value)}
                    placeholder="Draft a highly condensed, professional summary of the customer complaint (retaining all original meaning) so management doesn't have to scroll..."
                    disabled={!hasEditPermission}
                    className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden leading-relaxed disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                  {hasEditPermission && (
                    <div className="flex gap-2 mt-1">
                      <button
                        type="button"
                        onClick={() => setEditCustomSummary(getAutoSummary(record.comment))}
                        className="text-[9px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-2 py-1 rounded cursor-pointer"
                      >
                        Auto-Generate Concise Summary
                      </button>
                      {editCustomSummary && (
                        <button
                          type="button"
                          onClick={() => setEditCustomSummary('')}
                          className="text-[9px] font-bold text-slate-500 hover:text-slate-700 cursor-pointer"
                        >
                          Reset to Original
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Actions Taken Summary</label>
                  </div>
                  <textarea
                    rows={3}
                    value={editActionSummary}
                    onChange={(e) => setEditActionSummary(e.target.value)}
                    placeholder="Draft or auto-generate a highly concise, professional executive summary of actions taken..."
                    disabled={!hasEditPermission}
                    className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden leading-relaxed disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                  {hasEditPermission && (
                    <div className="flex gap-2 mt-1">
                      <button
                        type="button"
                        onClick={() => setEditActionSummary(getAutoCommentSummary(editComments))}
                        className="text-[9px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-2 py-1 rounded cursor-pointer"
                      >
                        Auto-Generate Action Summary
                      </button>
                      {editActionSummary && (
                        <button
                          type="button"
                          onClick={() => setEditActionSummary('')}
                          className="text-[9px] font-bold text-slate-500 hover:text-slate-700 cursor-pointer"
                        >
                          Reset to Original
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Additional Details</label>
                  <textarea
                    rows={3}
                    value={editFollowUpComments}
                    onChange={(e) => setEditFollowUpComments(e.target.value)}
                    placeholder="Write more details here so management can easily view the case and understand the full story..."
                    disabled={!hasEditPermission}
                    className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden leading-relaxed disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Right Form: Interactive Comments / Follow-up Conversation */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <MessageSquare className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-black uppercase tracking-wider text-slate-700">Follow-up Chat</span>
                </div>

                {/* Comment list with delete button */}
                <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-200/50 max-h-[190px] overflow-y-auto space-y-3">
                  <span className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">Conversation History</span>
                  {editComments.length === 0 ? (
                    <div className="text-center py-6 text-xs text-slate-400">
                      No comments logged yet. Start the conversation below.
                    </div>
                  ) : (
                    editComments.map((comment, idx) => {
                      const isCreator = currentUser?.fullName && comment.author.toLowerCase() === currentUser.fullName.toLowerCase();
                      const isSuperAdmin = currentUser?.role === 'superadmin';
                      const isHoD = currentUser?.role === 'HoD';
                      const canDelete = isSuperAdmin || isHoD || isCreator;
                      
                      return (
                        <div key={comment.id || idx} className="flex items-start justify-between gap-3 p-2.5 bg-white rounded-lg border border-slate-200/50 shadow-2xs">
                          <div className="text-xs space-y-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-slate-800">{comment.author}</span>
                              <span className="text-[9px] font-extrabold text-slate-400 uppercase bg-slate-100 px-1 py-0.1 rounded border border-slate-200/40">
                                {comment.role}
                              </span>
                              <span className="text-[9px] text-slate-400 font-mono">{comment.timestamp.split(' ')[0]}</span>
                            </div>
                            <p className="text-slate-700 font-medium">{comment.text}</p>
                          </div>
                          {hasEditPermission && canDelete && (
                            <button
                              type="button"
                              onClick={() => handleRemoveComment(comment.id || '')}
                              className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-1 rounded cursor-pointer transition-colors"
                              title="Delete Comment"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Form to post a new comment */}
                {hasEditPermission && (
                  <form onSubmit={handlePostComment} className="bg-slate-50 p-4 rounded-xl border border-slate-200/50 space-y-3">
                    <span className="block text-[10px] font-extrabold text-slate-700 uppercase tracking-wider">New Comment</span>
                    <div className="space-y-2">
                      <textarea
                        rows={2}
                        placeholder="Type your follow-up progress, ask HoD, or instruct Facility team here..."
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        required
                        className="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-amber-500 leading-relaxed resize-none"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-lg shadow-sm cursor-pointer transition-all flex items-center justify-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Post Comment as {currentUser?.fullName}
                    </button>
                  </form>
                )}
              </div>

            </div>

            {/* Large Publish and update action button */}
            {hasEditPermission && (
              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  onClick={handlePublishUpdate}
                  className="px-6 py-3 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-black text-sm rounded-xl shadow-md cursor-pointer transition-all flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Publish Update
                </button>
              </div>
            )}

          </div>
        )}

      </div>

      {/* Helper notice */}
      <div className="mt-4 text-center text-xs text-slate-400 print:hidden flex items-center justify-center gap-1.5">
        <Camera className="w-4 h-4 text-slate-300" />
        <span>Press <kbd className="bg-slate-100 px-1 rounded font-semibold">Ctrl + P</kbd> to save as PDF.</span>
      </div>

      {/* 3. Outlook & Team Dispatch Hub Modal overlay */}
      {showShareModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in font-sans">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
            {/* DHL Style Header bar */}
            <div className="bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-500 p-4 text-slate-900 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-slate-900 animate-pulse" />
                <div>
                  <h3 className="font-black text-sm uppercase tracking-tight">Facility & Service Center Dispatch</h3>
                  <p className="text-[10px] text-slate-800 font-bold uppercase tracking-wider">Send Case to Outlook & Sync Replies</p>
                </div>
              </div>
              <button 
                onClick={() => setShowShareModal(false)}
                className="text-slate-900 hover:bg-slate-900/10 p-1.5 rounded-lg font-black transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto max-h-[80vh]">
              {/* Feasibility Alert Box */}
              <div className="p-3.5 bg-amber-50/80 border border-amber-200/60 rounded-xl text-xs text-amber-900 space-y-1">
                <p className="font-bold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                  Outlook Integration Status (Full Client Sync Enabled)
                </p>
                <p className="leading-relaxed text-amber-800">
                  You can draft pre-populated Outlook emails instantly. Direct traceback links are automatically generated so the Facility team can view/respond. To log their replies, simply paste the email text below to append it to the discussion history in one click.
                </p>
              </div>

              {/* Form details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-[10px] font-black text-slate-500 uppercase">To: Recipient (PIC & Team Emails)</label>
                    <span className="text-[9px] text-slate-400 font-medium">Comma-separated</span>
                  </div>
                  <input
                    type="text"
                    value={shareEmail}
                    onChange={(e) => setShareEmail(e.target.value)}
                    placeholder="e.g. pic.email@dhl.com, facility.pnh@dhl.com"
                    className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                  />
                  <span className="text-[10px] text-slate-400 block mt-1 leading-tight">
                    Prepopulated with Assigned PIC + Facility Hub emails. Feel free to type/append more.
                  </span>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Traceback Link (Auto-Generated)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={`${window.location.origin}/?id=${record.id}`}
                      className="flex-1 p-2 text-[10px] bg-slate-100 border border-slate-200 rounded-lg text-slate-500 font-mono select-all focus:outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/?id=${record.id}`);
                        setIsCopiedLink(true);
                        setTimeout(() => setIsCopiedLink(false), 2000);
                      }}
                      className="px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-300 text-[10px] font-bold cursor-pointer transition-colors"
                    >
                      {isCopiedLink ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Subject</label>
                <input
                  type="text"
                  value={shareSubject}
                  onChange={(e) => setShareSubject(e.target.value)}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                />
              </div>

              {/* Step 1: Mailto Draft */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">Step 1: Launch Preformatted Outlook Draft</span>
                <p className="text-xs text-slate-600">
                  This will generate and open an Outlook message prefilled with all diagnostic details and your traceback secure URL.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleDispatchSuccess}
                    className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-950 text-white rounded-lg text-xs font-bold shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <Mail className="w-4 h-4 text-amber-400" />
                    Open Outlook Message Draft
                  </button>
                </div>
                {hasDispatched && (
                  <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 animate-pulse">
                    <Check className="w-3.5 h-3.5 animate-bounce" />
                    Dispatch logged in System Timeline and Comment thread!
                  </p>
                )}
              </div>

              {/* Step 2: Sync replies */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">Step 2: Sync Outlook Reply back to Conversation History</span>
                <p className="text-xs text-slate-600">
                  Did the facility team reply? Paste their email response here or simulate a live incoming email response to save and synchronize it back as a timeline comment.
                </p>
                <form onSubmit={handleSyncManualReply} className="space-y-3">
                  <textarea
                    rows={3}
                    value={manualReplyText}
                    onChange={(e) => setManualReplyText(e.target.value)}
                    placeholder="Paste Facility Team email reply text here..."
                    className="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-amber-500 resize-none font-sans"
                  />
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      type="submit"
                      disabled={!manualReplyText.trim()}
                      className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 rounded-lg text-xs font-black shadow-sm flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Sync Typed Reply
                    </button>
                    <button
                      type="button"
                      onClick={handleSimulateFacilityReply}
                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-lg text-xs font-black shadow-sm flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                      title="Simulates a real Outlook email incoming back to this system"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Simulate Incoming Reply
                    </button>
                  </div>
                </form>
              </div>
            </div>

            <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setShowShareModal(false)}
                className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-bold cursor-pointer transition-all"
              >
                Close Dispatch Hub
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
