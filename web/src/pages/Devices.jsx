import React, { useState, useEffect } from 'react';
import { deviceApi } from '../services/api';
import { Smartphone, Trash2, Clock, ShieldCheck, PlusCircle, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

export const Devices = () => {
  const [devices, setDevices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const loadDevices = async () => {
    setIsLoading(true);
    try {
      const res = await deviceApi.getDevices();
      if (res.data?.success) {
        setDevices(res.data.data.devices || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load devices');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDevices();
  }, []);

  const handleRevokeDevice = async (deviceId, deviceName) => {
    const shouldDeleteSms = window.confirm(
      `Revoke device "${deviceName}"?\n\nClick OK to revoke device. Synced messages will remain unless deleted separately in Settings.`
    );
    if (!shouldDeleteSms) return;

    try {
      await deviceApi.deleteDevice(deviceId, false);
      setSuccessMsg(`Device "${deviceName}" revoked successfully.`);
      loadDevices();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to revoke device');
      setTimeout(() => setError(''), 4000);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Connected Devices</h2>
        <p className="text-sm text-gray-400 mt-1">
          Manage authorized Android phones permitted to synchronize SMS to your account.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
          <ShieldCheck className="w-4 h-4" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isLoading ? (
          <div className="col-span-full py-16 text-center">
            <div className="inline-block w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-gray-400 mt-2">Loading authorized devices...</p>
          </div>
        ) : devices.length === 0 ? (
          <div className="col-span-full py-16 text-center glass-panel rounded-2xl border border-gray-800 p-8 space-y-3">
            <Smartphone className="w-12 h-12 text-gray-600 mx-auto" />
            <h3 className="text-base font-semibold text-gray-300">No Authorized Devices</h3>
            <p className="text-xs text-gray-400 max-w-md mx-auto">
              Install the Secure SMS Reader Flutter app on your Android phone, grant runtime SMS permission, and log in to link your phone.
            </p>
          </div>
        ) : (
          devices.map((device) => (
            <div
              key={device.deviceId}
              className="glass-panel p-5 rounded-2xl border border-gray-800 flex flex-col justify-between space-y-4 hover:border-gray-700 transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400">
                    <Smartphone className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white">{device.deviceName}</h4>
                    <span className="text-xs text-indigo-400 font-medium">{device.platform}</span>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Authorized
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-gray-400 bg-gray-900/60 p-3 rounded-xl border border-gray-800/80">
                <div className="flex items-center justify-between">
                  <span>Device Identifier:</span>
                  <span className="font-mono text-gray-300 text-[11px] truncate max-w-[180px]">
                    {device.deviceId}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>First Registered:</span>
                  <span className="text-gray-300">
                    {format(new Date(device.createdAt), 'MMM d, yyyy')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Last Active:</span>
                  <span className="text-gray-300">
                    {format(new Date(device.lastSeen), 'MMM d, h:mm a')}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-800 flex justify-end">
                <button
                  onClick={() => handleRevokeDevice(device.deviceId, device.deviceName)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Revoke Device</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-900/30 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-gray-400 leading-relaxed">
          <strong className="text-gray-200 block mb-1">Device Authorization Security</strong>
          Only devices registered to your user account are permitted to push SMS payloads. If a device is revoked, its future sync requests will be automatically rejected.
        </div>
      </div>
    </div>
  );
};
