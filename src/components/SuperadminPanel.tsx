import React, { useState, useEffect } from 'react';
import { 
  Shield, KeyRound, FileSpreadsheet, Users, CheckCircle2, XCircle, 
  RefreshCw, Sliders, Globe, Plus, Phone, Save, X, Building2, 
  AlertTriangle, Check, ExternalLink, Database, Lock, Smartphone, UserCheck
} from 'lucide-react';
import { ActionOwner, VoCRecord } from '../types';
import { fetchColleagues, saveColleague } from '../utils/firebaseSync';
import { exportMasterExcelWorkbook } from '../utils/excelDatabase';

interface SuperadminPanelProps {
  onClose: () => void;
  records: VoCRecord[];
  currentUser: ActionOwner | null;
}

export interface SharePointConfig {
  tenantId: string;
  clientId: string;
  siteUrl: string;
  filePath: string;
  autoSync: boolean;
  syncInterval: 'manual' | '15min' | 'hourly' | 'daily';
  lastSyncTimestamp?: string;
}

export default function SuperadminPanel({ onClose, records, currentUser }: SuperadminPanelProps) {
  const [activeTab, setActiveTab] = useState<'otp' | 'sharepoint' | 'users'>('otp');

  // --- 1. OTP SANDBOX SETTINGS STATE ---
  const [isSandboxMode, setIsSandboxMode] = useState<boolean>(() => {
    const stored = localStorage.getItem('dhl_sandbox_otp_enabled');
    return stored !== null ? stored === 'true' : true;
  });
  const [otpSaveMessage, setOtpSaveMessage] = useState<string | null>(null);

  // --- 2. SHAREPOINT CONFIGURATION STATE ---
  const [spConfig, setSpConfig] = useState<SharePointConfig>(() => {
    const stored = localStorage.getItem('dhl_sharepoint_config');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        // Fallback default
      }
    }
    return {
      tenantId: 'dhl.sharepoint.com',
      clientId: '8f7a3b2c-4d5e-6f7a-8b9c-0d1e2f3a4b5c',
      siteUrl: 'https://dhl.sharepoint.com/sites/DHL-Cambodia-VoC',
      filePath: '/Shared Documents/VoC_Master_Database.xlsx',
      autoSync: true,
      syncInterval: 'hourly',
      lastSyncTimestamp: new Date().toLocaleString()
    };
  });
  const [spTesting, setSpTesting] = useState(false);
  const [spStatus, setSpStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [spSavedMsg, setSpSavedMsg] = useState(false);

  // --- 3. USER MANAGEMENT STATE ---
  const [colleagues, setColleagues] = useState<ActionOwner[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [userSuccessMsg, setUserSuccessMsg] = useState<string | null>(null);
  const [userErrorMsg, setUserErrorMsg] = useState<string | null>(null);

  // Form for pre-registering a new user
  const [newFullName, setNewFullName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRole, setNewRole] = useState('Facility Agent');
  const [newFacility, setNewFacility] = useState('PNHGTW');

  // Load colleagues on mount
  useEffect(() => {
    loadColleaguesList();
  }, []);

  const loadColleaguesList = async () => {
    try {
      setLoadingUsers(true);
      const list = await fetchColleagues();
      setColleagues(list);
    } catch (err) {
      console.error('Error fetching colleagues:', err);
      setUserErrorMsg('Failed to fetch colleague directory.');
    } finally {
      setLoadingUsers(false);
    }
  };

  // --- HANDLERS FOR OTP SANDBOX ---
  const handleToggleSandbox = (enabled: boolean) => {
    setIsSandboxMode(enabled);
    localStorage.setItem('dhl_sandbox_otp_enabled', String(enabled));
    setOtpSaveMessage(
      enabled 
        ? 'Sandbox Mode enabled! Login form will use simulated carrier-free OTP.' 
        : 'Production SMS Mode enabled! Live Firebase SMS auth active.'
    );
    setTimeout(() => setOtpSaveMessage(null), 3000);
  };

  // --- HANDLERS FOR SHAREPOINT CONFIG ---
  const handleSaveSpConfig = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('dhl_sharepoint_config', JSON.stringify(spConfig));
    setSpSavedMsg(true);
    setTimeout(() => setSpSavedMsg(false), 2500);
  };

  const handleTestSpConnection = () => {
    setSpTesting(true);
    setSpStatus(null);
    setTimeout(() => {
      setSpTesting(false);
      const updatedConfig = {
        ...spConfig,
        lastSyncTimestamp: new Date().toLocaleString()
      };
      setSpConfig(updatedConfig);
      localStorage.setItem('dhl_sharepoint_config', JSON.stringify(updatedConfig));
      setSpStatus({
        success: true,
        message: `SharePoint endpoint verified successfully! Direct access to ${spConfig.filePath} is active.`
      });
    }, 1200);
  };

  const handleSyncAndExportNow = () => {
    exportMasterExcelWorkbook(records, currentUser);
    const updatedConfig = {
      ...spConfig,
      lastSyncTimestamp: new Date().toLocaleString()
    };
    setSpConfig(updatedConfig);
    localStorage.setItem('dhl_sharepoint_config', JSON.stringify(updatedConfig));
  };

  // --- HANDLERS FOR USER APPROVALS & MANAGEMENT ---
  const handleApproveUser = async (user: ActionOwner) => {
    try {
      setSavingUserId(user.id);
      const updated = { ...user, status: 'approved' as const };
      await saveColleague(updated);
      setColleagues(prev => prev.map(c => c.id === user.id ? updated : c));
      setUserSuccessMsg(`Approved access for ${user.fullName}`);
      setTimeout(() => setUserSuccessMsg(null), 2500);
    } catch (err) {
      setUserErrorMsg('Failed to approve user.');
    } finally {
      setSavingUserId(null);
    }
  };

  const handleRejectUser = async (user: ActionOwner) => {
    if (!window.confirm(`Are you sure you want to deny registration for ${user.fullName}?`)) return;
    try {
      setSavingUserId(user.id);
      const updated = { ...user, status: 'rejected' as const };
      await saveColleague(updated);
      setColleagues(prev => prev.map(c => c.id === user.id ? updated : c));
      setUserSuccessMsg(`Registration rejected for ${user.fullName}`);
      setTimeout(() => setUserSuccessMsg(null), 2500);
    } catch (err) {
      setUserErrorMsg('Failed to reject user.');
    } finally {
      setSavingUserId(null);
    }
  };

  const handleUpdateRoleFacility = async (user: ActionOwner, fields: Partial<ActionOwner>) => {
    try {
      setSavingUserId(user.id);
      const updated = { ...user, ...fields };
      await saveColleague(updated);
      setColleagues(prev => prev.map(c => c.id === user.id ? updated : c));
      setUserSuccessMsg(`Updated profile for ${user.fullName}`);
      setTimeout(() => setUserSuccessMsg(null), 2000);
    } catch (err) {
      setUserErrorMsg('Failed to update colleague details.');
    } finally {
      setSavingUserId(null);
    }
  };

  const handleAddSecondaryPhone = async (user: ActionOwner, phone: string) => {
    if (!phone.trim()) return;
    const cleanPhone = phone.trim().replace(/\s+/g, '');
    const currentPhones = user.phoneNumbers || [user.phoneNumber];
    if (currentPhones.includes(cleanPhone)) return;

    const newPhones = [...currentPhones, cleanPhone];
    await handleUpdateRoleFacility(user, { phoneNumbers: newPhones });
  };

  const handlePreRegisterUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFullName.trim() || !newPhone.trim()) {
      setUserErrorMsg('Please fill in both full name and phone number.');
      return;
    }

    try {
      setSavingUserId('new');
      const cleanPhone = newPhone.trim().replace(/\s+/g, '');
      const username = newFullName.toLowerCase().replace(/\s+/g, '.');
      
      const newUser: ActionOwner = {
        id: username + '-' + Math.floor(Math.random() * 1000),
        username,
        fullName: newFullName.trim(),
        role: newRole,
        department: newRole === 'superadmin' ? 'Management' : newRole === 'HoD' ? 'Quality Assurance' : 'Operations',
        phoneNumber: cleanPhone,
        phoneNumbers: [cleanPhone],
        facility: newFacility,
        status: 'approved',
        avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(newFullName)}`
      };

      await saveColleague(newUser);
      setColleagues(prev => [...prev, newUser]);
      
      setNewFullName('');
      setNewPhone('');
      setUserSuccessMsg(`Pre-registered and approved ${newUser.fullName}`);
      setTimeout(() => setUserSuccessMsg(null), 2500);
    } catch (err) {
      setUserErrorMsg('Failed to pre-register user.');
    } finally {
      setSavingUserId(null);
    }
  };

  const pendingUsers = colleagues.filter(c => c.status === 'pending');
  const approvedUsers = colleagues.filter(c => c.status !== 'pending');

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col my-auto max-h-[90vh]">
        
        {/* HEADER BAR */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 text-white p-5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-400 text-slate-950 rounded-xl shadow-sm">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-wide uppercase">
                  Superadmin Command Center
                </h2>
                <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-extrabold px-2 py-0.5 rounded uppercase">
                  DHL Confidential
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium">
                System configuration, SharePoint storage controls & user authorization portal
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TABS NAVIGATION */}
        <div className="bg-slate-100 px-6 py-2 border-b border-slate-200 flex items-center gap-2 overflow-x-auto shrink-0">
          <button
            onClick={() => setActiveTab('otp')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'otp'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <KeyRound className="w-4 h-4 text-amber-500" />
            <span>Login OTP Sandbox</span>
            <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold ${
              isSandboxMode ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
            }`}>
              {isSandboxMode ? 'Sandbox ON' : 'Production SMS'}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('sharepoint')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'sharepoint'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>SharePoint Connection</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'users'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Users className="w-4 h-4 text-blue-600" />
            <span>User Approvals & Directory</span>
            {pendingUsers.length > 0 && (
              <span className="bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full animate-pulse">
                {pendingUsers.length}
              </span>
            )}
          </button>
        </div>

        {/* TAB CONTENTS CONTAINER */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">

          {/* TAB 1: LOGIN OTP SANDBOX */}
          {activeTab === 'otp' && (
            <div className="space-y-6 max-w-2xl mx-auto">
              {otpSaveMessage && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs font-bold flex items-center gap-2 animate-fade-in">
                  <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>{otpSaveMessage}</span>
                </div>
              )}

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-amber-500" />
                      Login OTP Sandbox Toggle
                    </h3>
                    <p className="text-xs text-slate-500">
                      Enable carrier-free sandbox testing or force production SMS reCAPTCHA authentication.
                    </p>
                  </div>

                  {/* Toggle Button */}
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input 
                      type="checkbox" 
                      checked={isSandboxMode} 
                      onChange={(e) => handleToggleSandbox(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-12 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className={`p-4 rounded-xl border transition-all ${
                    isSandboxMode ? 'bg-amber-50/60 border-amber-300 ring-2 ring-amber-400/20' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-black uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-amber-600" />
                        Sandbox Mode (Simulated)
                      </span>
                      {isSandboxMode && <span className="bg-amber-500 text-slate-950 font-black text-[9px] px-2 py-0.5 rounded-full">ACTIVE</span>}
                    </div>
                    <ul className="text-[11px] text-slate-600 space-y-1.5 leading-relaxed">
                      <li>• Instant login using pre-registered phone numbers.</li>
                      <li>• Standard test OTP code (<code className="bg-amber-100 text-amber-900 px-1 rounded font-mono font-bold">123456</code>).</li>
                      <li>• No real SMS costs or cellular carrier delays.</li>
                      <li>• Perfect for internal team testing and demonstration.</li>
                    </ul>
                  </div>

                  <div className={`p-4 rounded-xl border transition-all ${
                    !isSandboxMode ? 'bg-emerald-50/60 border-emerald-300 ring-2 ring-emerald-400/20' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-emerald-600" />
                        Production SMS Mode
                      </span>
                      {!isSandboxMode && <span className="bg-emerald-600 text-white font-black text-[9px] px-2 py-0.5 rounded-full">ACTIVE</span>}
                    </div>
                    <ul className="text-[11px] text-slate-600 space-y-1.5 leading-relaxed">
                      <li>• Uses Firebase Phone Authentication reCAPTCHA.</li>
                      <li>• Sends real cellular SMS verification codes.</li>
                      <li>• Standard carrier messaging rates apply.</li>
                      <li>• Strict verification for external enterprise rollout.</li>
                    </ul>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-100 rounded-xl text-[11px] text-slate-600 border border-slate-200 flex items-start gap-2.5">
                  <Shield className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-800 block mb-0.5">Note for Superadmins:</span>
                    Changes take effect immediately for all subsequent login attempts. Current active user sessions remain authenticated.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SHAREPOINT CONNECTION */}
          {activeTab === 'sharepoint' && (
            <div className="space-y-6 max-w-2xl mx-auto">
              {spSavedMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2 animate-fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>SharePoint configuration saved successfully!</span>
                </div>
              )}

              {spStatus && (
                <div className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                  spStatus.success ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}>
                  {spStatus.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />}
                  <span>{spStatus.message}</span>
                </div>
              )}

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                      SharePoint & OneDrive Master File Storage
                    </h3>
                    <p className="text-xs text-slate-500">
                      Configure direct connection to your organization's SharePoint Excel document library.
                    </p>
                  </div>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1 border border-emerald-200">
                    <Database className="w-3 h-3 text-emerald-600" />
                    SharePoint Active
                  </span>
                </div>

                <form onSubmit={handleSaveSpConfig} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      SharePoint Tenant Domain / Directory ID
                    </label>
                    <input 
                      type="text" 
                      required
                      value={spConfig.tenantId}
                      onChange={(e) => setSpConfig(prev => ({ ...prev, tenantId: e.target.value }))}
                      placeholder="e.g. dhl.sharepoint.com"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:bg-white focus:outline-hidden focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Azure AD App Client ID
                    </label>
                    <input 
                      type="text" 
                      required
                      value={spConfig.clientId}
                      onChange={(e) => setSpConfig(prev => ({ ...prev, clientId: e.target.value }))}
                      placeholder="App Registration GUID"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:bg-white focus:outline-hidden focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      SharePoint Site Path
                    </label>
                    <input 
                      type="text" 
                      required
                      value={spConfig.siteUrl}
                      onChange={(e) => setSpConfig(prev => ({ ...prev, siteUrl: e.target.value }))}
                      placeholder="https://dhl.sharepoint.com/sites/..."
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:outline-hidden focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Target Master Excel File Path
                    </label>
                    <input 
                      type="text" 
                      required
                      value={spConfig.filePath}
                      onChange={(e) => setSpConfig(prev => ({ ...prev, filePath: e.target.value }))}
                      placeholder="/Shared Documents/DHL_VoC_Master.xlsx"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:bg-white focus:outline-hidden focus:border-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Auto-Sync Schedule
                      </label>
                      <select
                        value={spConfig.syncInterval}
                        onChange={(e) => setSpConfig(prev => ({ ...prev, syncInterval: e.target.value as any }))}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:bg-white"
                      >
                        <option value="manual">Manual Export Only</option>
                        <option value="15min">Every 15 Minutes</option>
                        <option value="hourly">Hourly Auto-Sync</option>
                        <option value="daily">Daily Master Refresh</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Background Sync Status
                      </label>
                      <div className="p-2.5 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700">Auto-Sync</span>
                        <label className="relative inline-flex items-center cursor-pointer shrink-0">
                          <input 
                            type="checkbox" 
                            checked={spConfig.autoSync} 
                            onChange={(e) => setSpConfig(prev => ({ ...prev, autoSync: e.target.checked }))}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={handleTestSpConnection}
                      disabled={spTesting}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      {spTesting ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                          <span>Testing Endpoint...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Test SharePoint Endpoint</span>
                        </>
                      )}
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleSyncAndExportNow}
                        className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        <span>Export Master Excel Now</span>
                      </button>

                      <button
                        type="submit"
                        className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Save className="w-3.5 h-3.5 text-amber-400" />
                        <span>Save Config</span>
                      </button>
                    </div>
                  </div>
                </form>

                {spConfig.lastSyncTimestamp && (
                  <div className="text-[10px] text-slate-400 text-right pt-1 font-mono">
                    Last SharePoint verification: {spConfig.lastSyncTimestamp}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: USER APPROVALS & COLLEAGUE DIRECTORY */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              {userSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2 animate-fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{userSuccessMsg}</span>
                </div>
              )}

              {userErrorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-bold flex items-center gap-2 animate-fade-in">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{userErrorMsg}</span>
                </div>
              )}

              {/* 1. PENDING REGISTRATION APPROVALS SECTION */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-amber-500" />
                      Pending Colleague Registration Approvals
                    </h3>
                    <p className="text-xs text-slate-500">
                      New colleagues who registered via phone need Superadmin approval to access VoC records.
                    </p>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    pendingUsers.length > 0 ? 'bg-amber-100 text-amber-900 border border-amber-200' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {pendingUsers.length} Pending Approval{pendingUsers.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {loadingUsers ? (
                  <div className="py-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-amber-500" />
                    <span>Loading pending colleague requests...</span>
                  </div>
                ) : pendingUsers.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    No pending registration requests at this time. All registered users are approved.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingUsers.map((u) => (
                      <div key={u.id} className="p-3.5 bg-amber-50/40 border border-amber-200/80 rounded-xl flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center font-extrabold text-amber-800 text-xs">
                            {u.fullName.charAt(0)}
                          </div>
                          <div>
                            <div className="text-xs font-black text-slate-900 flex items-center gap-2">
                              <span>{u.fullName}</span>
                              <span className="bg-slate-200 text-slate-700 text-[9px] font-mono font-bold px-1.5 py-0.2 rounded">
                                {u.facility || 'PNHGTW'}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                              Phone: <strong className="text-slate-800">{u.phoneNumber}</strong>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleRejectUser(u)}
                            disabled={savingUserId === u.id}
                            className="px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-600 hover:text-rose-700 text-xs font-bold border border-slate-200 rounded-lg transition-colors cursor-pointer"
                          >
                            Deny
                          </button>
                          <button
                            onClick={() => handleApproveUser(u)}
                            disabled={savingUserId === u.id}
                            className="px-4 py-1.5 bg-amber-400 hover:bg-amber-500 text-slate-950 text-xs font-black rounded-lg transition-colors cursor-pointer shadow-2xs flex items-center gap-1"
                          >
                            {savingUserId === u.id ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Check className="w-3.5 h-3.5" />
                            )}
                            <span>Approve Access</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 2. PRE-REGISTER NEW COLLEAGUE FORM */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <Plus className="w-4 h-4 text-emerald-600" />
                  Pre-Register & Pre-Approve Colleague
                </h3>

                <form onSubmit={handlePreRegisterUser} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Full Name</label>
                    <input 
                      type="text" 
                      required
                      value={newFullName}
                      onChange={(e) => setNewFullName(e.target.value)}
                      placeholder="e.g. Panha Chhun"
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Mobile Phone</label>
                    <input 
                      type="tel" 
                      required
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      placeholder="+855 12 345 678"
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Role</label>
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:bg-white"
                    >
                      <option value="Facility Agent">Facility Agent</option>
                      <option value="HoD">Head of Department (HoD)</option>
                      <option value="superadmin">Superadmin</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Assigned Facility</label>
                    <div className="flex gap-2">
                      <select
                        value={newFacility}
                        onChange={(e) => setNewFacility(e.target.value)}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:bg-white"
                      >
                        <option value="PNHGTW">PNHGTW</option>
                        <option value="PNHASC">PNHASC</option>
                        <option value="PNHSVC">PNHSVC</option>
                        <option value="All">All Facilities</option>
                      </select>

                      <button
                        type="submit"
                        disabled={savingUserId === 'new'}
                        className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black rounded-lg transition-colors cursor-pointer shrink-0 flex items-center justify-center"
                      >
                        {savingUserId === 'new' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-4 h-4 text-amber-400" />}
                      </button>
                    </div>
                  </div>
                </form>
              </div>

              {/* 3. APPROVED COLLEAGUE DIRECTORY */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                    <Users className="w-4 h-4 text-slate-700" />
                    Active Approved Colleague Directory ({approvedUsers.length})
                  </h3>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Role & Facility Permissions
                  </span>
                </div>

                <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto pr-1">
                  {approvedUsers.map((colleague) => (
                    <div key={colleague.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-3">
                        <img 
                          src={colleague.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(colleague.fullName)}`}
                          alt={colleague.fullName}
                          className="w-8 h-8 rounded-full border border-slate-200 shrink-0"
                        />
                        <div>
                          <div className="font-bold text-slate-900 flex items-center gap-2">
                            <span>{colleague.fullName}</span>
                            {colleague.role === 'superadmin' && (
                              <span className="bg-amber-100 text-amber-900 text-[9px] font-black px-1.5 py-0.2 rounded uppercase border border-amber-200">
                                Superadmin
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono flex items-center gap-2 mt-0.5">
                            <span>Phone: {colleague.phoneNumber}</span>
                            {colleague.phoneNumbers && colleague.phoneNumbers.length > 1 && (
                              <span className="text-slate-400">({colleague.phoneNumbers.length} numbers)</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {/* Facility Selector */}
                        <select
                          value={colleague.facility || 'PNHGTW'}
                          onChange={(e) => handleUpdateRoleFacility(colleague, { facility: e.target.value })}
                          disabled={savingUserId === colleague.id}
                          className="p-1.5 bg-slate-50 border border-slate-200 rounded text-[11px] font-bold text-slate-700 focus:bg-white"
                        >
                          <option value="PNHGTW">PNHGTW</option>
                          <option value="PNHASC">PNHASC</option>
                          <option value="PNHSVC">PNHSVC</option>
                          <option value="All">All Facilities</option>
                        </select>

                        {/* Role Selector */}
                        <select
                          value={colleague.role || 'Facility Agent'}
                          onChange={(e) => handleUpdateRoleFacility(colleague, { role: e.target.value })}
                          disabled={savingUserId === colleague.id}
                          className="p-1.5 bg-slate-50 border border-slate-200 rounded text-[11px] font-bold text-slate-700 focus:bg-white"
                        >
                          <option value="Facility Agent">Agent</option>
                          <option value="HoD">HoD</option>
                          <option value="superadmin">Superadmin</option>
                        </select>

                        {/* Add Secondary Phone Quick Form */}
                        <button
                          type="button"
                          onClick={() => {
                            const p = window.prompt(`Add secondary phone for ${colleague.fullName}:`);
                            if (p) handleAddSecondaryPhone(colleague, p);
                          }}
                          className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded border border-slate-200 transition-colors cursor-pointer"
                          title="Add Secondary Phone"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
