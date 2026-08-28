import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  MessageSquare,
  Smartphone,
  Settings,
  ShieldCheck,
  Search,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

export const Sidebar = ({ isOpen, onClose }) => {
  const navItems = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
      desc: 'Overview & Stats',
    },
    {
      label: 'Conversations',
      path: '/conversations',
      icon: MessageSquare,
      desc: 'SMS Threads & Chat',
    },
    {
      label: 'Devices',
      path: '/devices',
      icon: Smartphone,
      desc: 'Linked Android Phones',
    },
    {
      label: 'Settings',
      path: '/settings',
      icon: Settings,
      desc: 'Privacy & Data Controls',
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 w-64 border-r border-gray-800 bg-[#0B0F19] transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } flex flex-col justify-between p-4`}
      >
        <div className="space-y-6">
          <div className="space-y-1">
            <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              Navigation
            </p>
            <nav className="space-y-1 mt-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 shadow-sm'
                          : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60'
                      }`
                    }
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 opacity-50" />
                  </NavLink>
                );
              })}
            </nav>
          </div>

          <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-900/40">
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Zero Surveillance</span>
            </div>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              SMS messages are read strictly with your explicit Android runtime permission on your own device.
            </p>
          </div>
        </div>

        <div className="border-t border-gray-800/80 pt-3">
          <div className="flex items-center justify-between text-[11px] text-gray-400 px-2">
            <span>Secure SMS v1.0</span>
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
          </div>
        </div>
      </aside>
    </>
  );
};
