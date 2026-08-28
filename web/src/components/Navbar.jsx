import React from 'react';
import { useAuth } from '../context/AuthContext';
import { SyncStatusBadge } from './SyncStatusBadge';
import { Shield, LogOut, User, Smartphone, Menu } from 'lucide-react';

export const Navbar = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-gray-800 bg-[#0B0F19]/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 -ml-2 text-gray-400 hover:text-white rounded-lg lg:hidden hover:bg-gray-800 focus:outline-none"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent leading-none">
              Secure SMS
            </h1>
            <span className="text-[10px] tracking-wider uppercase text-indigo-400 font-semibold">
              Android Dashboard
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        <SyncStatusBadge />

        <div className="h-5 w-px bg-gray-800 hidden sm:block" />

        {user && (
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-900 border border-gray-800 text-xs">
              <User className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-gray-200 font-medium">{user.name}</span>
            </div>

            <button
              onClick={logout}
              title="Log out"
              className="p-2 text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg border border-transparent hover:border-rose-500/20 transition-all text-xs flex items-center gap-1.5"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
