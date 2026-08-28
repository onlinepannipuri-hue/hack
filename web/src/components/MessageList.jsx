import React, { useEffect, useRef, useState } from 'react';
import { format, isToday, isYesterday } from 'date-fns';
import {
  User,
  ArrowLeft,
  Copy,
  Check,
  Smartphone,
  ShieldAlert,
  KeyRound,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react';

export const MessageList = ({
  sender,
  messages = [],
  isLoading,
  onBack,
  onDeleteConversation,
}) => {
  const scrollRef = useRef(null);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatBubbleTime = (ts) => {
    if (!ts) return '';
    const date = new Date(Number(ts));
    if (isNaN(date.getTime())) return '';
    return format(date, 'h:mm a');
  };

  // Group messages by human readable calendar date
  const groupMessagesByDate = (msgs) => {
    const groups = {};
    msgs.forEach((msg) => {
      const date = new Date(Number(msg.timestamp));
      let dateKey = 'Unknown Date';
      if (!isNaN(date.getTime())) {
        if (isToday(date)) dateKey = 'Today';
        else if (isYesterday(date)) dateKey = 'Yesterday';
        else dateKey = format(date, 'MMMM d, yyyy');
      }

      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(msg);
    });
    return groups;
  };

  if (!sender) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-[#0B0F19]">
        <div className="w-16 h-16 rounded-2xl bg-gray-900 border border-gray-800 flex items-center justify-center text-gray-600 mb-4">
          <User className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-semibold text-gray-300">Select a Conversation</h3>
        <p className="text-sm text-gray-400 max-w-sm mt-1">
          Choose a sender from the conversation list on the left to view the chronological SMS thread.
        </p>
      </div>
    );
  }

  const grouped = groupMessagesByDate(messages);

  return (
    <div className="flex flex-col h-full bg-[#0B0F19]">
      {/* Thread Header */}
      <div className="h-16 px-4 sm:px-6 border-b border-gray-800 flex items-center justify-between bg-gray-900/60 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 -ml-1 text-gray-400 hover:text-white rounded-lg lg:hidden hover:bg-gray-800"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-400 text-white font-bold flex items-center justify-center text-sm shadow-md shadow-indigo-500/20">
            {sender.replace(/[^a-zA-Z0-9]/g, '').slice(0, 2).toUpperCase() || <User className="w-5 h-5" />}
          </div>

          <div>
            <h3 className="text-sm font-bold text-gray-100 flex items-center gap-2">
              {sender}
            </h3>
            <p className="text-xs text-gray-400">
              {messages.length} {messages.length === 1 ? 'message' : 'messages'} synchronized
            </p>
          </div>
        </div>

        {onDeleteConversation && (
          <button
            onClick={() => onDeleteConversation(sender)}
            title="Delete synchronized server copy"
            className="text-xs text-gray-400 hover:text-rose-400 px-3 py-1.5 rounded-lg border border-transparent hover:border-rose-500/20 hover:bg-rose-500/10 transition-all"
          >
            Clear server copy
          </button>
        )}
      </div>

      {/* Messages Scroll Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {isLoading ? (
          <div className="py-12 text-center">
            <div className="inline-block w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-gray-400 mt-2">Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="py-12 text-center text-gray-400">
            <p className="text-sm">No messages in this conversation yet</p>
          </div>
        ) : (
          Object.entries(grouped).map(([dateLabel, msgs]) => (
            <div key={dateLabel} className="space-y-4">
              {/* Date Separator Badge */}
              <div className="flex items-center justify-center">
                <span className="px-3 py-1 rounded-full text-[11px] font-medium bg-gray-900 border border-gray-800 text-gray-400">
                  {dateLabel}
                </span>
              </div>

              {/* Messages in this date */}
              <div className="space-y-3">
                {msgs.map((msg, index) => {
                  const isSent = msg.type === 'sent' || msg.type === 'outbox';
                  const isCopied = copiedId === (msg._id || index);

                  // Quick detection for OTP / auth codes
                  const otpMatch = msg.body?.match(/\b\d{4,8}\b/);

                  return (
                    <div
                      key={msg._id || `${msg.deviceMessageId}-${index}`}
                      className={`flex flex-col ${isSent ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`group relative max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-3 shadow-md transition-all ${
                          isSent
                            ? 'bg-indigo-600 text-white rounded-br-none'
                            : 'bg-gray-800/90 text-gray-100 border border-gray-700/50 rounded-bl-none'
                        }`}
                      >
                        {/* Direction & Device Label */}
                        <div className="flex items-center gap-1.5 text-[10px] mb-1 opacity-70">
                          {isSent ? (
                            <>
                              <ArrowUpRight className="w-3 h-3 text-indigo-200" />
                              <span>Sent</span>
                            </>
                          ) : (
                            <>
                              <ArrowDownLeft className="w-3 h-3 text-emerald-400" />
                              <span>Received</span>
                            </>
                          )}
                          {msg.deviceId && (
                            <span className="truncate max-w-[120px]">
                              • {msg.deviceId}
                            </span>
                          )}
                        </div>

                        {/* Message Text */}
                        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                          {msg.body}
                        </p>

                        {/* Quick OTP Copy Chip */}
                        {otpMatch && (
                          <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between gap-2">
                            <span className="text-[11px] font-mono font-bold tracking-wider bg-white/10 px-2 py-0.5 rounded">
                              Code: {otpMatch[0]}
                            </span>
                            <button
                              onClick={() => handleCopy(msg._id || index, otpMatch[0])}
                              className="text-[10px] hover:underline flex items-center gap-1 opacity-90"
                            >
                              {isCopied ? <Check className="w-3 h-3 text-emerald-300" /> : <KeyRound className="w-3 h-3" />}
                              <span>{isCopied ? 'Copied' : 'Copy Code'}</span>
                            </button>
                          </div>
                        )}

                        {/* Timestamp and copy trigger */}
                        <div
                          className={`mt-1.5 flex items-center justify-end gap-2 text-[10px] ${
                            isSent ? 'text-indigo-200' : 'text-gray-400'
                          }`}
                        >
                          <span>{formatBubbleTime(msg.timestamp)}</span>
                          <button
                            onClick={() => handleCopy(msg._id || index, msg.body)}
                            title="Copy message body"
                            className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-white"
                          >
                            {isCopied ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
