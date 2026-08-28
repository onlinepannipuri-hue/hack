import React from 'react';
import { format, isToday, isYesterday } from 'date-fns';
import { Search, User, MessageSquare, Smartphone, ArrowDownLeft, ArrowUpRight } from 'lucide-react';

export const ConversationList = ({
  conversations = [],
  selectedSender,
  onSelectConversation,
  searchQuery,
  onSearchChange,
  isLoading,
  devices = [],
  selectedDevice,
  onSelectDevice,
}) => {
  const formatTime = (ts) => {
    if (!ts) return '';
    const date = new Date(Number(ts));
    if (isNaN(date.getTime())) return '';

    if (isToday(date)) {
      return format(date, 'h:mm a');
    }
    if (isYesterday(date)) {
      return 'Yesterday';
    }
    return format(date, 'MMM d');
  };

  return (
    <div className="flex flex-col h-full bg-[#0E1322] border-r border-gray-800">
      {/* Search and Filters Header */}
      <div className="p-4 border-b border-gray-800 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search sender, message, OTP..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-900/90 border border-gray-700/60 rounded-xl text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
          />
        </div>

        {devices.length > 0 && (
          <div className="flex items-center gap-2">
            <Smartphone className="w-3.5 h-3.5 text-gray-400" />
            <select
              value={selectedDevice}
              onChange={(e) => onSelectDevice(e.target.value)}
              aria-label="Filter conversations by registered device"
              className="bg-gray-900 border border-gray-800 rounded-lg text-xs text-gray-300 px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 flex-1"
            >
              <option value="">All Devices ({devices.length})</option>
              {devices.map((d) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.deviceName} ({d.platform})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Conversations Scrollable List */}
      <div className="flex-1 overflow-y-auto divide-y divide-gray-800/40">
        {isLoading ? (
          <div className="p-8 text-center space-y-3">
            <div className="inline-block w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-gray-400">Loading conversations...</p>
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <MessageSquare className="w-8 h-8 text-gray-600 mx-auto" />
            <p className="text-sm font-medium text-gray-400">No conversations found</p>
            <p className="text-xs text-gray-400">
              {searchQuery
                ? 'Try a different search keyword'
                : 'Synchronize SMS from your Android app to see messages here'}
            </p>
          </div>
        ) : (
          conversations.map((conv) => {
            const isSelected = selectedSender === conv.sender;
            const isInbox = conv.lastType === 'inbox' || !conv.lastType;

            return (
              <button
                key={conv.sender}
                onClick={() => onSelectConversation(conv.sender)}
                className={`w-full text-left p-3.5 transition-all flex items-start gap-3 hover:bg-gray-800/50 ${
                  isSelected ? 'bg-indigo-600/15 border-l-4 border-indigo-500' : 'border-l-4 border-transparent'
                }`}
              >
                {/* Avatar Icon */}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                      : 'bg-gray-800 text-gray-300'
                  }`}
                >
                  {conv.sender.replace(/[^a-zA-Z0-9]/g, '').slice(0, 2).toUpperCase() || <User className="w-5 h-5" />}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <h4
                      className={`text-sm font-semibold truncate ${
                        isSelected ? 'text-indigo-300' : 'text-gray-100'
                      }`}
                    >
                      {conv.sender}
                    </h4>
                    <span className="text-[11px] text-gray-400 whitespace-nowrap">
                      {formatTime(conv.lastTimestamp)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-gray-400 truncate flex items-center gap-1">
                      {isInbox ? (
                        <ArrowDownLeft className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                      ) : (
                        <ArrowUpRight className="w-3 h-3 text-indigo-400 flex-shrink-0" />
                      )}
                      <span className="truncate">{conv.lastMessage || 'No preview'}</span>
                    </p>
                    {conv.messageCount > 1 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-gray-800 text-[10px] font-medium text-gray-400 flex-shrink-0">
                        {conv.messageCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
