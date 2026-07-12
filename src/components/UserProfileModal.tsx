import React, { useState } from 'react';
import { X, User, Phone, Smartphone, Save, CheckCircle, ShieldCheck, RefreshCw, AlertCircle } from 'lucide-react';
import { ActionOwner } from '../types';
import { saveColleague } from '../utils/firebaseSync';

interface UserProfileModalProps {
  currentUser: ActionOwner;
  onUpdateCurrentUser: (updatedUser: ActionOwner) => void;
  onClose: () => void;
}

export default function UserProfileModal({ currentUser, onUpdateCurrentUser, onClose }: UserProfileModalProps) {
  const [fullName, setFullName] = useState(currentUser.fullName);
  const [primaryPhone, setPrimaryPhone] = useState(currentUser.phoneNumber || '');
  const [phoneNumbers, setPhoneNumbers] = useState<string[]>(currentUser.phoneNumbers || [currentUser.phoneNumber || '']);
  const [newSecondaryPhone, setNewSecondaryPhone] = useState('');
  const [isAddingPhone, setIsAddingPhone] = useState(false);
  
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddSecondaryPhone = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNum = newSecondaryPhone.trim().replace(/\s+/g, '');
    if (!cleanNum) return;

    if (phoneNumbers.includes(cleanNum)) {
      setError('This phone number is already linked to your profile.');
      return;
    }

    setPhoneNumbers(prev => [...prev, cleanNum]);
    setNewSecondaryPhone('');
    setIsAddingPhone(false);
    setError(null);
  };

  const handleRemovePhone = (phoneToRemove: string) => {
    if (phoneToRemove === primaryPhone) {
      setError('You cannot remove your primary phone number. Please set a different primary phone number first.');
      return;
    }
    setPhoneNumbers(prev => prev.filter(p => p !== phoneToRemove));
    setError(null);
  };

  const handleSetAsPrimary = (phone: string) => {
    setPrimaryPhone(phone);
    setError(null);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError('Full name is required.');
      return;
    }
    if (!primaryPhone.trim()) {
      setError('Primary phone number is required.');
      return;
    }

    setSaving(true);
    setError(null);

    // Prepare updated phone numbers list ensuring primary is always included
    const cleanPrimary = primaryPhone.trim().replace(/\s+/g, '');
    let updatedList = phoneNumbers.map(p => p.trim().replace(/\s+/g, ''));
    if (!updatedList.includes(cleanPrimary)) {
      updatedList = [cleanPrimary, ...updatedList];
    }

    const updatedUser: ActionOwner = {
      ...currentUser,
      fullName: fullName.trim(),
      phoneNumber: cleanPrimary,
      phoneNumbers: updatedList,
      avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName.trim())}`
    };

    try {
      // Persist to Cloud Firestore
      await saveColleague(updatedUser);
      
      // Update app state & localStorage
      onUpdateCurrentUser(updatedUser);
      
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error('Error saving profile changes:', err);
      setError('Failed to save profile changes to Firestore. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in font-sans">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        
        {/* DHL Branding top accent */}
        <div className="h-1.5 bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-400" />
        
        {/* Header Title Bar */}
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-amber-100 rounded-lg">
              <User className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">
                Profile Account Settings
              </h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                Manage your DHL Workspace Identity
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

        {/* Modal Main Form Content */}
        <form onSubmit={handleSaveProfile} className="p-6 space-y-5">
          
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3 rounded-lg flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span className="leading-normal">{error}</span>
            </div>
          )}

          {success && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3 rounded-lg flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-bold">Profile changes saved and synchronized successfully!</span>
            </div>
          )}

          {/* Quick Info Bar */}
          <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200/60">
            <img
              src={currentUser.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName)}`}
              alt={fullName}
              className="w-14 h-14 rounded-full border-2 border-slate-200 shadow-sm shrink-0"
            />
            <div className="text-left">
              <div className="text-xs font-black text-slate-800 uppercase tracking-tight flex items-center gap-1.5">
                <span>{currentUser.username}</span>
                <span className="text-[9px] font-black text-slate-500 bg-slate-200/60 px-1.5 py-0.5 rounded uppercase">
                  {currentUser.role}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">
                Department: {currentUser.department}
              </p>
              <p className="text-[10px] text-slate-400 font-bold uppercase">
                Facility: {currentUser.facility === 'All' ? 'All Facilities' : currentUser.facility}
              </p>
            </div>
          </div>

          {/* Edit Colleague Name */}
          <div className="space-y-1.5 text-left">
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">
              Colleague Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter full name (e.g. John Doe)"
                className="w-full bg-white text-slate-800 text-xs pl-9 pr-3.5 py-2.5 rounded-lg border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-colors"
              />
            </div>
            <p className="text-[9px] text-slate-400 font-medium">
              This name will be displayed in case comments, timeline logs, and executive assignments.
            </p>
          </div>

          {/* Linked Phone Numbers Area */}
          <div className="space-y-2.5 text-left">
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">
              Linked Account Phone Numbers
            </label>
            
            {/* List of associated numbers */}
            <div className="space-y-1.5 max-h-40 overflow-y-auto border border-slate-100 rounded-lg p-2 bg-slate-50/50">
              {phoneNumbers.map((num, index) => {
                const isPrimary = num === primaryPhone;
                return (
                  <div 
                    key={num + '-' + index} 
                    className={`flex items-center justify-between p-2 rounded-lg border text-xs font-mono font-bold transition-all ${
                      isPrimary 
                        ? 'bg-amber-500/10 border-amber-300 text-amber-900' 
                        : 'bg-white border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Phone className={`w-3.5 h-3.5 ${isPrimary ? 'text-amber-500' : 'text-slate-400'}`} />
                      <span>{num}</span>
                      {isPrimary && (
                        <span className="text-[8px] font-black uppercase tracking-wider text-amber-700 bg-amber-400/30 px-1.5 py-0.5 rounded-sm">
                          Primary Login
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {!isPrimary && (
                        <button
                          type="button"
                          onClick={() => handleSetAsPrimary(num)}
                          className="text-[9px] font-black uppercase tracking-wider text-slate-500 hover:text-amber-700 hover:bg-amber-50 px-1.5 py-0.5 rounded transition-colors"
                          title="Set as primary login phone number"
                        >
                          Set Primary
                        </button>
                      )}
                      {phoneNumbers.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemovePhone(num)}
                          className="text-xs text-rose-500 hover:text-rose-700 px-1"
                          title="Unlink this phone number"
                        >
                          &times;
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add New Linked Phone Number button / form */}
            {!isAddingPhone ? (
              <button
                type="button"
                onClick={() => setIsAddingPhone(true)}
                className="w-full py-2 border border-dashed border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                <span>+ Link Another Phone Number</span>
              </button>
            ) : (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 animate-fade-in">
                <span className="block text-[9px] font-black uppercase tracking-widest text-slate-400">
                  Link New Secondary Number
                </span>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    value={newSecondaryPhone}
                    onChange={(e) => setNewSecondaryPhone(e.target.value)}
                    placeholder="e.g. +85512345678"
                    className="flex-1 bg-white border border-slate-200 rounded-lg text-xs p-2 focus:outline-hidden font-mono font-bold"
                  />
                  <button
                    type="button"
                    onClick={handleAddSecondaryPhone}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-xs rounded-lg transition-colors cursor-pointer"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewSecondaryPhone('');
                      setIsAddingPhone(false);
                    }}
                    className="px-3 py-1.5 border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Form Action Controls */}
          <div className="flex gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="w-1/3 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-lg transition-colors text-center cursor-pointer"
            >
              Cancel
            </button>
            
            <button
              type="submit"
              disabled={saving}
              className="w-2/3 py-2.5 bg-amber-400 hover:bg-amber-500 disabled:bg-slate-200 disabled:text-slate-400 text-slate-900 text-xs font-black uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving to Cloud...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5 text-slate-800" />
                  <span>Save Profile changes</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
