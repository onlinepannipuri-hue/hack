import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { smsApi } from '../services/api';
import {
  User,
  Shield,
  Trash2,
  Lock,
  LogOut,
  CheckCircle2,
  AlertTriangle,
  Info,
  Smartphone,
} from 'lucide-react';

export const Settings = () => {
  const { user, logout } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleDeleteAllSms = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to permanently delete ALL synchronized SMS messages from the server?\n\nNOTE: This will NOT delete any SMS messages stored on your physical Android phone.'
    );
    if (!confirmed) return;

    setIsDeleting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await smsApi.deleteSms({});
      if (res.data?.success) {
        setSuccessMsg(
          `Successfully deleted ${res.data.data?.deletedCount || 0} messages from the dashboard database.`
        );
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to delete SMS records');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Account & Privacy Settings</h2>
        <p className="text-sm text-gray-400 mt-1">
          Manage your account details, privacy preferences, and server-side data retention.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Account Profile Card */}
      <div className="glass-panel p-6 rounded-2xl border border-gray-800 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <User className="w-4 h-4 text-indigo-400" />
          <span>User Profile</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="bg-gray-900/60 p-4 rounded-xl border border-gray-800">
            <span className="text-xs text-gray-400 uppercase tracking-wider block mb-1">
              Full Name
            </span>
            <span className="font-semibold text-white">{user?.name || 'Authorized User'}</span>
          </div>

          <div className="bg-gray-900/60 p-4 rounded-xl border border-gray-800">
            <span className="text-xs text-gray-400 uppercase tracking-wider block mb-1">
              Email Address
            </span>
            <span className="font-semibold text-white">{user?.email || 'N/A'}</span>
          </div>
        </div>
      </div>

      {/* Privacy & Android Security Disclosure */}
      <div className="glass-panel p-6 rounded-2xl border border-gray-800 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Shield className="w-4 h-4 text-indigo-400" />
          <span>Privacy & Security Commitments</span>
        </h3>

        <div className="space-y-3 text-xs text-gray-300 leading-relaxed bg-gray-900/50 p-4 rounded-xl border border-gray-800/80">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <p>
              <strong>Transparent Permission:</strong> SMS messages are only accessed after you explicitly accept Android's runtime READ_SMS permission dialog.
            </p>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <p>
              <strong>Zero Covert Monitoring:</strong> No background keyloggers, accessibility abuse, or spyware mechanisms are used.
            </p>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <p>
              <strong>Data Isolation:</strong> All synchronized data is indexed strictly under your unique User ID and Device ID with JWT authentication.
            </p>
          </div>
        </div>
      </div>

      {/* Data Management & Deletion */}
      <div className="glass-panel p-6 rounded-2xl border border-rose-500/20 bg-rose-950/5 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-rose-400" />
              <span>Delete Synchronized SMS Records</span>
            </h3>
            <p className="text-xs text-gray-400 mt-1 max-w-xl">
              Permanently wipe all server-side copies of your synchronized SMS messages from the dashboard database.
            </p>
          </div>
        </div>

        <div className="p-3 bg-gray-900/80 border border-gray-800 rounded-xl text-xs text-gray-400 flex items-center gap-2">
          <Info className="w-4 h-4 text-indigo-400 flex-shrink-0" />
          <span>
            <strong>Safe Deletion:</strong> Web deletion only removes server-side copies and will never alter or delete messages stored on your Android hardware.
          </span>
        </div>

        <button
          onClick={handleDeleteAllSms}
          disabled={isDeleting}
          className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-rose-600/20 transition-all flex items-center gap-2 disabled:opacity-50"
        >
          <Trash2 className="w-4 h-4" />
          <span>{isDeleting ? 'Deleting records...' : 'Purge All Server SMS Data'}</span>
        </button>
      </div>

      {/* Session Controls */}
      <div className="pt-4 border-t border-gray-800 flex justify-end">
        <button
          onClick={logout}
          className="px-5 py-2.5 bg-gray-900 hover:bg-gray-800 border border-gray-800 text-rose-400 rounded-xl text-xs font-semibold transition-all flex items-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out of Dashboard</span>
        </button>
      </div>
    </div>
  );
};
