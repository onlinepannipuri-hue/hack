import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { smsApi, deviceApi } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { useDebounce } from '../hooks/useDebounce';
import { ConversationList } from '../components/ConversationList';
import { MessageList } from '../components/MessageList';

export const Conversations = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSender = searchParams.get('sender') || '';

  const { latestSms } = useSocket();
  const [conversations, setConversations] = useState([]);
  const [selectedSender, setSelectedSender] = useState(initialSender);
  const [messages, setMessages] = useState([]);
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingConv, setIsLoadingConv] = useState(false);
  const [isLoadingMsg, setIsLoadingMsg] = useState(false);

  const debouncedSearch = useDebounce(searchQuery, 350);

  // Fetch registered devices
  useEffect(() => {
    const loadDevices = async () => {
      try {
        const res = await deviceApi.getDevices();
        if (res.data?.success) {
          setDevices(res.data.data.devices || []);
        }
      } catch (err) {
        console.error('Failed to load devices', err);
      }
    };
    loadDevices();
  }, []);

  // Fetch conversations list or search results
  const loadConversations = useCallback(async () => {
    setIsLoadingConv(true);
    try {
      if (debouncedSearch.trim()) {
        const res = await smsApi.search(debouncedSearch.trim());
        if (res.data?.success) {
          // Group search results into pseudo-conversations
          const grouped = {};
          (res.data.data.results || []).forEach((msg) => {
            if (!grouped[msg.sender]) {
              grouped[msg.sender] = {
                sender: msg.sender,
                lastMessage: msg.body,
                lastTimestamp: msg.timestamp,
                lastType: msg.type,
                deviceId: msg.deviceId,
                messageCount: 1,
              };
            } else {
              grouped[msg.sender].messageCount += 1;
            }
          });
          setConversations(Object.values(grouped));
        }
      } else {
        const res = await smsApi.getConversations(selectedDevice || undefined);
        if (res.data?.success) {
          const list = res.data.data.conversations || [];
          setConversations(list);

          // Auto-select first conversation on desktop if none selected
          if (!selectedSender && list.length > 0 && window.innerWidth >= 1024) {
            setSelectedSender(list[0].sender);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
    } finally {
      setIsLoadingConv(false);
    }
  }, [debouncedSearch, selectedDevice, selectedSender]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Load message thread for the selected sender
  const loadMessages = useCallback(async (sender) => {
    if (!sender) {
      setMessages([]);
      return;
    }
    setIsLoadingMsg(true);
    try {
      const res = await smsApi.getConversationMessages(sender, selectedDevice || undefined);
      if (res.data?.success) {
        setMessages(res.data.data.messages || []);
      }
    } catch (err) {
      console.error('Error loading conversation messages:', err);
    } finally {
      setIsLoadingMsg(false);
    }
  }, [selectedDevice]);

  useEffect(() => {
    if (selectedSender) {
      loadMessages(selectedSender);
      setSearchParams({ sender: selectedSender });
    }
  }, [selectedSender, loadMessages, setSearchParams]);

  // Real-time listener: When a new SMS is received
  useEffect(() => {
    if (latestSms) {
      // If the incoming message belongs to the current open conversation, append it
      if (selectedSender && latestSms.sender === selectedSender) {
        setMessages((prev) => {
          // Prevent UI duplicates if already present
          if (prev.some((m) => m.timestamp === latestSms.timestamp && m.body === latestSms.body)) {
            return prev;
          }
          return [...prev, latestSms];
        });
      }
      // Refresh the conversations list so preview and order update immediately
      loadConversations();
    }
  }, [latestSms, selectedSender, loadConversations]);

  const handleSelectConversation = (sender) => {
    setSelectedSender(sender);
  };

  const handleBackToConversations = () => {
    setSelectedSender('');
    setSearchParams({});
  };

  const handleDeleteConversation = async (sender) => {
    if (
      window.confirm(
        `Are you sure you want to delete synchronized server records for ${sender}? (Your phone's SMS will NOT be touched).`
      )
    ) {
      try {
        await smsApi.deleteSms({ sender });
        setSelectedSender('');
        loadConversations();
      } catch (err) {
        alert('Failed to delete server copy: ' + err.message);
      }
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex overflow-hidden">
      {/* Left Column: Conversation List (Hidden on mobile if a conversation is selected) */}
      <div
        className={`w-full lg:w-96 flex-shrink-0 h-full ${
          selectedSender ? 'hidden lg:block' : 'block'
        }`}
      >
        <ConversationList
          conversations={conversations}
          selectedSender={selectedSender}
          onSelectConversation={handleSelectConversation}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          isLoading={isLoadingConv}
          devices={devices}
          selectedDevice={selectedDevice}
          onSelectDevice={setSelectedDevice}
        />
      </div>

      {/* Right Column: Chat Message Stream (Hidden on mobile if no conversation is selected) */}
      <div
        className={`flex-1 h-full ${
          selectedSender ? 'block' : 'hidden lg:block'
        }`}
      >
        <MessageList
          sender={selectedSender}
          messages={messages}
          isLoading={isLoadingMsg}
          onBack={handleBackToConversations}
          onDeleteConversation={handleDeleteConversation}
        />
      </div>
    </div>
  );
};
