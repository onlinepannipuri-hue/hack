import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { connectSocket, disconnectSocket } from '../services/socket';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { token, user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [latestSms, setLatestSms] = useState(null);
  const [lastSyncEvent, setLastSyncEvent] = useState(null);

  useEffect(() => {
    if (token && user) {
      const s = connectSocket(token);
      setSocket(s);

      s.on('connect', () => setIsConnected(true));
      s.on('disconnect', () => setIsConnected(false));

      s.on('sms:new', (message) => {
        setLatestSms(message);
      });

      s.on('sms:sync_complete', (summary) => {
        setLastSyncEvent({ ...summary, receivedAt: new Date() });
      });

      return () => {
        disconnectSocket();
        setIsConnected(false);
      };
    } else {
      disconnectSocket();
      setSocket(null);
      setIsConnected(false);
    }
  }, [token, user]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        latestSms,
        lastSyncEvent,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
