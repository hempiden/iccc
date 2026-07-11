import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Shield, Trash2, X, RefreshCw, Save, CheckCircle, HelpCircle, Phone, Smartphone } from 'lucide-react';
import { ActionOwner } from '../types';
import { fetchColleagues, saveColleague } from '../utils/firebaseSync';

interface ColleagueManagerProps {
  onClose: () => void;
}

// Inline helper component to add secondary phone numbers in a secure & clean layout
function AddPhoneNumberForm({ onAdd }: { onAdd: (num: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [val, setVal] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (val.trim()) {
      onAdd(val.trim());
      setVal('');
      setIsOpen(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="text-[9px] font-bold text-amber-600 hover:text-amber-700 hover:underline cursor-pointer ml-1.5 bg-amber-50 hover:bg-amber-100/60 px-1.5 py-0.5 rounded border border-amber-200"
      >
        + Add Secondary Number
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-1 ml-1.5 animate-fade-in">
      <input
        type="tel"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        placeholder="+855..."
        required
        autoFocus
        className="p-1 bg-white border border-slate-300 rounded text-[10px] font-mono focus:outline-hidden focus:ring-1 focus:ring-amber-400"
      />
      <button
        type="submit"
        className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-[9px] px-1.5 py-1 rounded cursor-pointer transition-colors"
      >
        Add
      </button>
      <button
        type="button"
        onClick={() => setIsOpen(false)}
        className="text-slate-400 hover:text-slate-600 text-[10px] px-1 cursor-pointer"
      >
        Cancel
      </button>
    </form>
  );
}

export default function ColleagueManager({ onClose }: ColleagueManagerProps) {
  const [colleagues, setColleagues] = useState<ActionOwner[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [saveSuccessId, setSaveSuccessId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state for adding new colleague
  const [newFullName, setNewFullName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRole, setNewRole] = useState('Facility Agent');
  const [newFacility, setNewFacility] = useState('PNHGTW');

  useEffect(() => {
    loadColleagues();
  }, []);

  const loadColleagues = async () => {
    try {
      setLoading(true);
      const data = await fetchColleagues();
      setColleagues(data);
    } catch (err: any) {
      console.error('Error loading colleagues:', err);
      setError('Failed to load colleague list.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateColleague = async (colleague: ActionOwner, fields: Partial<ActionOwner>) => {
    try {
      setSavingId(colleague.id);
      const updatedColleague = { ...colleague, ...fields };
      await saveColleague(updatedColleague);
      
      // Update local state
      setColleagues(prev => prev.map(c => c.id === colleague.id ? updatedColleague : c));
      
      setSaveSuccessId(colleague.id);
      setTimeout(() => setSaveSuccessId(null), 2000);
    } catch (err) {
      console.error('Error updating colleague:', err);
      setError('Failed to update colleague.');
    } finally {
      setSavingId(null);
    }
  };

  const handleAddColleague = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFullName.trim() || !newPhone.trim()) {
      setError('Please provide both name and phone number.');
      return;
    }

    try {
      setLoading(true);
      const cleanPhone = newPhone.trim().replace(/\s+/g, '');
      const username = newFullName.toLowerCase().replace(/\s+/g, '.');
      
      const newColleague: ActionOwner = {
        id: username + '-' + Math.floor(Math.random() * 1000),
        username,
        fullName: newFullName.trim(),
        role: newRole,
        department: newRole === 'superadmin' ? 'Management' : newRole === 'HoD' ? 'Quality Assurance' : 'Operations',
        phoneNumber: cleanPhone,
        phoneNumbers: [cleanPhone], // Initialize array with primary phone
        facility: newFacility,
        status: 'approved',
        avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(newFullName)}`
      };

      await saveColleague(newColleague);
      setColleagues(prev => [...prev, newColleague]);
      
      // Reset form
      setNewFullName('');
      setNewPhone('');
      setNewRole('Facility Agent');
      setNewFacility('PNHGTW');
      setError(null);
    } catch (err) {
      console.error('Error pre-registering colleague:', err);
      setError('Failed to register new colleague.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in font-sans">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header strip */}
        <div className="h-1.5 bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-400" />
        
        {/* Title area */}
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-2.5">
            <Users className="w-5 h-5 text-amber-500" />
            <div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">
                Colleagues & Facility Assignment Console
              </h3>
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                Superadmin Dashboard Access Control
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content area */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3 rounded-lg flex items-center gap-2">
              <span>{error}</span>
            </div>
          )}

          {/* Form to Pre-register a colleague */}
          <form onSubmit={handleAddColleague} className="p-4 bg-slate-50 rounded-xl border border-slate-200/60 space-y-4">
            <div className="flex items-center gap-2 text-xs font-black uppercase text-slate-700 tracking-wider">
              <UserPlus className="w-4 h-4 text-emerald-500" />
              <span>Pre-Authorize New Colleague</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sok Chea"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  className="w-full p-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Phone (Primary)</label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. +85512345678"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full p-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Access Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full p-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden"
                >
                  <option value="Facility Agent">Facility Agent</option>
                  <option value="HoD">Head of Department (HoD)</option>
                  <option value="superadmin">Superadmin</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Assigned Facility</label>
                <select
                  value={newFacility}
                  onChange={(e) => setNewFacility(e.target.value)}
                  disabled={newRole === 'superadmin' || newRole === 'HoD'}
                  className="w-full p-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden disabled:bg-slate-100 disabled:opacity-60"
                >
                  <option value="PNHGTW">PNHGTW (Gateway)</option>
                  <option value="PNHASC">PNHASC (ASC)</option>
                  <option value="PNHSVC">PNHSVC (SVC)</option>
                  <option value="All">All Facilities</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5 text-emerald-400" />
              <span>Pre-register Colleague Profile</span>
            </button>
          </form>

          {/* Colleague database list */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-black uppercase tracking-wider text-slate-700">Registered Colleagues ({colleagues.length})</span>
              <button
                onClick={loadColleagues}
                className="text-[10px] text-slate-500 hover:text-slate-800 flex items-center gap-1 font-semibold"
              >
                <RefreshCw className="w-3 h-3 animate-spin" style={{ animationDuration: loading ? '1s' : '0s' }} />
                Refresh DB
              </button>
            </div>

            {loading && colleagues.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">Loading DB records...</div>
            ) : colleagues.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                No custom profiles registered yet. When colleagues log in with their phone number for the first time, they will automatically appear here!
              </div>
            ) : (
              <div className="space-y-3">
                {colleagues.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col p-4 bg-slate-50/50 hover:bg-slate-50 border border-slate-200/60 rounded-xl transition-all space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(item.fullName)}`}
                          alt={item.fullName}
                          className="w-9 h-9 rounded-full object-cover border border-slate-200 shadow-3xs shrink-0"
                        />
                        <div>
                          <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5 flex-wrap">
                            <span>{item.fullName}</span>
                            {item.role === 'superadmin' && (
                              <span className="text-[9px] font-black text-amber-700 bg-amber-100 border border-amber-200 px-1.5 py-0.2 rounded-md uppercase">
                                Superadmin
                              </span>
                            )}
                            {item.role === 'HoD' && (
                              <span className="text-[9px] font-black text-blue-700 bg-blue-100 border border-blue-200 px-1.5 py-0.2 rounded-md uppercase">
                                HOD
                              </span>
                            )}
                            {item.status === 'pending' ? (
                              <span className="text-[9px] font-black text-rose-700 bg-rose-100 border border-rose-200 px-1.5 py-0.2 rounded-md uppercase animate-pulse">
                                Pending Approval
                              </span>
                            ) : (
                              <span className="text-[9px] font-black text-emerald-700 bg-emerald-100 border border-emerald-200 px-1.5 py-0.2 rounded-md uppercase">
                                Approved
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                            ID: <span className="font-mono">{item.id}</span>
                          </div>
                        </div>
                      </div>

                      {/* Editor controls for role & facility */}
                      <div className="flex items-center gap-2">
                        {item.status === 'pending' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateColleague(item, { status: 'approved' })}
                            disabled={savingId === item.id}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-[10px] uppercase tracking-wider px-2.5 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-all shrink-0"
                            title="Approve registration"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            Approve
                          </button>
                        )}
                        <div>
                          <select
                            value={item.role}
                            onChange={(e) => handleUpdateColleague(item, { 
                              role: e.target.value,
                              facility: (e.target.value === 'superadmin' || e.target.value === 'HoD') ? 'All' : item.facility 
                            })}
                            disabled={savingId === item.id}
                            className="p-1.5 bg-white border border-slate-200 rounded-lg text-[11px] font-bold focus:outline-hidden"
                          >
                            <option value="Facility Agent">Facility Agent</option>
                            <option value="HoD">Head of Department (HoD)</option>
                            <option value="superadmin">Superadmin</option>
                          </select>
                        </div>

                        <div>
                          <select
                            value={item.facility || 'PNHGTW'}
                            onChange={(e) => handleUpdateColleague(item, { facility: e.target.value })}
                            disabled={savingId === item.id || item.role === 'superadmin' || item.role === 'HoD'}
                            className="p-1.5 bg-white border border-slate-200 rounded-lg text-[11px] font-bold focus:outline-hidden disabled:bg-slate-100 disabled:opacity-60"
                          >
                            <option value="PNHGTW">PNHGTW (Gateway)</option>
                            <option value="PNHASC">PNHASC (ASC)</option>
                            <option value="PNHSVC">PNHSVC (SVC)</option>
                            <option value="All">All Facilities</option>
                          </select>
                        </div>

                        <div className="w-8 flex items-center justify-center">
                          {savingId === item.id ? (
                            <RefreshCw className="w-3.5 h-3.5 text-slate-400 animate-spin" />
                          ) : saveSuccessId === item.id ? (
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                          ) : null}
                        </div>
                      </div>
                    </div>

                    {/* Associated Phone Numbers section - solving "one user can add multiple phone number" */}
                    <div className="pt-2.5 border-t border-slate-200/50 pl-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Associated Numbers:</span>
                        
                        {/* Render all primary and secondary numbers */}
                        {(item.phoneNumbers || [item.phoneNumber || 'N/A']).map((num, nidx) => (
                          <span 
                            key={num + '-' + nidx} 
                            className="inline-flex items-center gap-1 text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono font-bold px-2 py-0.5 rounded-md border border-slate-200 transition-colors"
                          >
                            <span>{num}</span>
                            {/* Allow deleting secondary numbers if there's more than one number total */}
                            {(item.phoneNumbers && item.phoneNumbers.length > 1) && (
                              <button
                                type="button"
                                onClick={() => {
                                  const updatedList = item.phoneNumbers?.filter(p => p !== num) || [];
                                  handleUpdateColleague(item, { 
                                    phoneNumbers: updatedList,
                                    phoneNumber: item.phoneNumber === num ? updatedList[0] || '' : item.phoneNumber 
                                  });
                                }}
                                className="text-rose-500 hover:text-rose-700 font-bold ml-1.5 cursor-pointer text-xs leading-none"
                                title="Remove associated phone number"
                              >
                                &times;
                              </button>
                            )}
                          </span>
                        ))}

                        {/* Button/form to add more phone numbers */}
                        <AddPhoneNumberForm 
                          onAdd={(newNum) => {
                            const cleanNew = newNum.trim().replace(/\s+/g, '');
                            const existingList = item.phoneNumbers || [item.phoneNumber || ''];
                            if (!existingList.includes(cleanNew)) {
                              handleUpdateColleague(item, { 
                                phoneNumbers: [...existingList, cleanNew]
                              });
                            } else {
                              setError(`Number ${cleanNew} is already associated with this colleague.`);
                              setTimeout(() => setError(null), 3000);
                            }
                          }}
                        />
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Footer strip bar details */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-1 text-[10px] text-slate-400 font-semibold">
            <Shield className="w-3.5 h-3.5 text-emerald-500/70" />
            <span>Colleague assignments synchronized instantly to Firebase database</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-lg cursor-pointer transition-all"
          >
            Close Dashboard
          </button>
        </div>

      </div>
    </div>
  );
}
