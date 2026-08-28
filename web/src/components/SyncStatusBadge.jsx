import React from 'react';
import { useSocket } from '../context/SocketContext';
import { Wifi, WifiOff } from 'lucide-react';

export const SyncStatusBadge = () => {
  const { isConnected } = useSocket();

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
        isConnected
          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
          : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
      }`}
      title={isConnected ? 'Real-time WebSocket connected' : 'WebSocket disconnected'}
    >
      <span className="relative flex h-2 w-2">
        {isConnected && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        )}
        <span
          className={`relative inline-flex rounded-full h-2 w-2 ${
            isConnected ? 'bg-emerald-500' : 'bg-rose-500'
          }`}
        ></span>
      </span>
      <span className="hidden sm:inline">
        {isConnected ? 'Live Sync Active' : 'Offline'}
      </span>
      {isConnected ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
    </div>
  );
};
