import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { smsApi, deviceApi } from '../services/api';
import { StatCard } from '../components/StatCard';
import {
  MessageSquare,
  Smartphone,
  Users,
  Radio,
  ArrowRight,
  Clock,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  Search,
} from 'lucide-react';
import { format } from 'date-fns';

export const Dashboard = () => {
  const { isConnected, latestSms, lastSyncEvent } = useSocket();
  const [conversations, setConversations] = useState([]);
  const [devices, setDevices] = useState([]);
  const [recentMessages, setRecentMessages] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [convRes, devRes, smsRes] = await Promise.all([
        smsApi.getConversations(),
        deviceApi.getDevices(),
        smsApi.getSms({ limit: 5 }),
      ]);

      if (convRes.data?.success) {
        setConversations(convRes.data.data.conversations || []);
      }
      if (devRes.data?.success) {
        setDevices(devRes.data.data.devices || []);
      }
      if (smsRes.data?.success) {
        setRecentMessages(smsRes.data.data.messages || []);
        setTotalCount(smsRes.data.data.pagination?.total || 0);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Update real-time state when new SMS is received via Socket.IO
  useEffect(() => {
    if (latestSms || lastSyncEvent) {
      fetchDashboardData();
    }
  }, [latestSms, lastSyncEvent]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top Banner / Hero */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Overview Dashboard</h2>
          <p className="text-sm text-gray-400 mt-1">
            Real-time status of your synchronized Android SMS threads and connected devices.
          </p>
        </div>

        <button
          onClick={fetchDashboardData}
          className="self-start sm:self-auto px-4 py-2 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-xl text-xs font-semibold text-gray-300 transition-all flex items-center gap-2"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Real-time alert pill if recently synchronized */}
      {latestSms && (
        <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 flex items-center justify-between gap-4 animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-600 text-white">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-indigo-300">Live SMS Just Received!</p>
              <p className="text-xs text-gray-300">
                From <span className="font-semibold">{latestSms.sender}</span>: "{latestSms.body?.slice(0, 60)}"
              </p>
            </div>
          </div>
          <Link
            to={`/conversations?sender=${encodeURIComponent(latestSms.sender)}`}
            className="text-xs font-semibold text-indigo-400 hover:underline flex items-center gap-1 whitespace-nowrap"
          >
            <span>View Thread</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Synced SMS"
          value={totalCount}
          subtitle="Idempotent records"
          icon={MessageSquare}
          color="indigo"
        />
        <StatCard
          title="Active Contacts"
          value={conversations.length}
          subtitle="Distinct senders"
          icon={Users}
          color="emerald"
        />
        <StatCard
          title="Registered Phones"
          value={devices.length}
          subtitle="Authorized devices"
          icon={Smartphone}
          color="purple"
        />
        <StatCard
          title="WebSocket Stream"
          value={isConnected ? 'Connected' : 'Offline'}
          subtitle={isConnected ? 'Listening for sms:new' : 'Attempting reconnect'}
          icon={Radio}
          color={isConnected ? 'emerald' : 'amber'}
        />
      </div>

      {/* Split Section: Recent Activity & Linked Devices */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent SMS Snippets */}
        <div className="lg:col-span-2 glass-panel rounded-2xl border border-gray-800 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-indigo-400" />
              <span>Recent Messages</span>
            </h3>
            <Link
              to="/conversations"
              className="text-xs font-semibold text-indigo-400 hover:underline flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentMessages.length === 0 ? (
            <div className="py-12 text-center text-gray-500 space-y-2">
              <MessageSquare className="w-8 h-8 mx-auto opacity-40" />
              <p className="text-sm">No SMS synchronized yet</p>
              <p className="text-xs text-gray-400">
                Grant permission in the Flutter Android app and tap "Sync Now"
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-800/60">
              {recentMessages.map((msg) => (
                <Link
                  key={msg._id}
                  to={`/conversations?sender=${encodeURIComponent(msg.sender)}`}
                  className="py-3.5 flex items-start justify-between gap-4 hover:bg-gray-800/30 rounded-xl px-2 -mx-2 transition-all block group"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-gray-200 group-hover:text-indigo-400 transition-colors">
                        {msg.sender}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          msg.type === 'sent'
                            ? 'bg-indigo-500/10 text-indigo-400'
                            : 'bg-emerald-500/10 text-emerald-400'
                        }`}
                      >
                        {msg.type}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 truncate">{msg.body}</p>
                  </div>
                  <span className="text-[11px] text-gray-400 whitespace-nowrap">
                    {format(new Date(Number(msg.timestamp)), 'MMM d, h:mm a')}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Linked Devices Status */}
        <div className="glass-panel rounded-2xl border border-gray-800 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-indigo-400" />
              <span>Registered Devices</span>
            </h3>
            <Link to="/devices" className="text-xs font-semibold text-indigo-400 hover:underline">
              Manage
            </Link>
          </div>

          {devices.length === 0 ? (
            <div className="py-12 text-center text-gray-500 space-y-2">
              <Smartphone className="w-8 h-8 mx-auto opacity-40" />
              <p className="text-sm">No phone connected</p>
              <p className="text-xs text-gray-400">
                Log into the mobile app from your Android device to register it.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {devices.map((d) => (
                <div
                  key={d.deviceId}
                  className="p-3.5 rounded-xl bg-gray-900/80 border border-gray-800 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-white">{d.deviceName}</h4>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                      Active
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-400 flex items-center justify-between">
                    <span>ID: {d.deviceId.slice(0, 14)}...</span>
                    <span>{d.platform}</span>
                  </div>
                  <div className="text-[10px] text-gray-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>Last sync: {format(new Date(d.lastSeen), 'MMM d, h:mm a')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Privacy reminder note */}
          <div className="p-3 rounded-xl bg-gray-900/50 border border-gray-800/80 text-[11px] text-gray-400 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
            <span>Only devices explicitly authenticated with your credentials can synchronize SMS.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
