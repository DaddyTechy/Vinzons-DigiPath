import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI, createWebSocket } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [ws, setWs] = useState(null);

  const addNotification = useCallback((notif) => {
    const id = Date.now() + Math.random();
    setNotifications((prev) => [...prev, { ...notif, id }]);
    // Auto-remove after 8 seconds
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 8000);
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  // Connect WebSocket
  const connectWS = useCallback((officeId) => {
    try {
      const socket = createWebSocket(officeId);
      socket.onopen = () => {
        console.log('WebSocket connected');
        // Keep alive ping
        const pingInterval = setInterval(() => {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send('ping');
          } else {
            clearInterval(pingInterval);
          }
        }, 30000);
        socket._pingInterval = pingInterval;
      };

      socket.onmessage = (event) => {
        if (event.data === 'pong') return;
        try {
          const data = JSON.parse(event.data);
          addNotification(data);
        } catch (e) {
          console.error('WS message parse error:', e);
        }
      };

      socket.onclose = () => {
        console.log('WebSocket disconnected');
        // Reconnect after 3 seconds
        setTimeout(() => {
          if (localStorage.getItem('token')) {
            connectWS(officeId);
          }
        }, 3000);
      };

      socket.onerror = (err) => {
        console.error('WebSocket error:', err);
      };

      setWs(socket);
      return socket;
    } catch (e) {
      console.error('Failed to connect WS:', e);
    }
  }, [addNotification]);

  useEffect(() => {
    const init = async () => {
      if (token) {
        try {
          const res = await authAPI.me();
          setUser(res.data);
          connectWS(res.data.office_id);
        } catch {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setToken(null);
        }
      }
      setLoading(false);
    };
    init();
    return () => {
      if (ws) {
        if (ws._pingInterval) clearInterval(ws._pingInterval);
        ws.close();
      }
    };
  }, []);

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    const { token: newToken, user: userData } = res.data;
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
    connectWS(userData.office_id);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    if (ws) {
      if (ws._pingInterval) clearInterval(ws._pingInterval);
      ws.close();
    }
    setWs(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      login,
      logout,
      notifications,
      addNotification,
      removeNotification,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
