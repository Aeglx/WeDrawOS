import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import SessionList from './SessionList';
import ChatWindow from './ChatWindow';
import CSStatistics from './CSStatistics';
import AutoReplyManager from './AutoReplyManager';
import './CustomerService.css';

const CustomerService = () => {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('sessions');
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);

  // 初始化用户信息
  useEffect(() => {
    const initUser = async () => {
      try {
        // 从本地存储获取用户信息或调用API
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        } else {
          // 模拟用户数据，实际应用中应从API获取
          const mockUser = {
            id: 'mock_user_' + Math.random().toString(36).substr(2, 9),
            type: Math.random() > 0.5 ? 'customer' : 'customer_service',
            name: Math.random() > 0.5 ? '普通用户' : '客服小李',
            avatar: 'https://i.pravatar.cc/150?img=' + Math.floor(Math.random() * 70)
          };
          setUser(mockUser);
          localStorage.setItem('user', JSON.stringify(mockUser));
        }
      } catch (err) {
        setError('获取用户信息失败');
        console.error('Failed to init user:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initUser();

    return () => {
      // 清理
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  // 连接WebSocket
  useEffect(() => {
    if (!user) return;

    const connectSocket = () => {
      try {
        // 实际应用中应使用真实的WebSocket URL
        const socketUrl = process.env.REACT_APP_WS_URL || 'http://localhost:3000';
        
        socketRef.current = io(socketUrl, {
          path: '/api/socket.io',
          auth: {
            userId: user.id,
            userType: user.type
          },
          reconnectionAttempts: 5,
          reconnectionDelay: 1000
        });

        socketRef.current.on('connect', () => {
          console.log('WebSocket connected');
          setIsConnected(true);
          setError(null);
          reconnectAttemptsRef.current = 0;
          
          // 发送用户信息进行初始化
          socketRef.current.emit('initialize', {
            user
          });
        });

        socketRef.current.on('disconnect', () => {
          console.log('WebSocket disconnected');
          setIsConnected(false);
        });

        socketRef.current.on('error', (error) => {
          console.error('WebSocket error:', error);
          setError('连接出错');
        });

        // 消息处理
        socketRef.current.on('message', (data) => {
          handleSocketMessage(data);
        });

      } catch (err) {
        console.error('Failed to connect WebSocket:', err);
        setError('连接失败');
        handleReconnect();
      }
    };

    connectSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [user]);

  // 重连逻辑
  const handleReconnect = () => {
    if (reconnectAttemptsRef.current >= 5) {
      setError('重连失败，请刷新页面');
      return;
    }

    reconnectAttemptsRef.current++;
    const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
    
    reconnectTimeoutRef.current = setTimeout(() => {
      if (socketRef.current) {
        socketRef.current.connect();
      }
    }, delay);
  };

  // 处理WebSocket消息
  const handleSocketMessage = (data) => {
    const { type, data: messageData } = data;
    
    switch (type) {
      case 'connection_established':
        fetchUserSessions();
        break;
      case 'session_created':
        setSelectedSession(messageData);
        fetchUserSessions();
        break;
      case 'new_message':
        // 消息会在ChatWindow组件中处理
        break;
      case 'user_joined':
      case 'user_left':
      case 'typing':
      case 'stop_typing':
        // 这些事件会在ChatWindow组件中处理
        break;
      case 'error':
        setError(messageData.message || '未知错误');
        break;
      default:
        console.log('Unhandled socket message:', type);
    }
  };

  // 获取用户会话列表
  const fetchUserSessions = async () => {
    try {
      // 实际应用中应调用API
      const response = await fetch('/api/customer-service/sessions');
      if (!response.ok) throw new Error('获取会话列表失败');
      const data = await response.json();
      setSessions(data);
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
      // 使用模拟数据
      setSessions(getMockSessions());
    }
  };

  // 模拟会话数据
  const getMockSessions = () => {
    return [
      {
        id: 'session_1',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        unreadCount: 2,
        customerInfo: {
          id: 'customer_1',
          name: '张三',
          avatar: 'https://i.pravatar.cc/150?img=1'
        },
        lastMessage: {
          content: '请问能帮我解决这个问题吗？',
          createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString()
        }
      },
      {
        id: 'session_2',
        status: 'waiting',
        createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        unreadCount: 1,
        customerInfo: {
          id: 'customer_2',
          name: '李四',
          avatar: 'https://i.pravatar.cc/150?img=2'
        },
        lastMessage: {
          content: '我需要退款',
          createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString()
        }
      }
    ];
  };

  // 创建新会话
  const createNewSession = async (initialMessage) => {
    if (!user || !socketRef.current) return;

    try {
      socketRef.current.emit('create_session', {
        initialMessage,
        metadata: {
          userAgent: navigator.userAgent,
          timestamp: new Date()
        }
      });
    } catch (err) {
      console.error('Failed to create session:', err);
      setError('创建会话失败');
    }
  };

  // 渲染内容区域
  const renderContent = () => {
    switch (activeTab) {
      case 'sessions':
        return (
          <div className="cs-content-wrapper">
            <SessionList 
              sessions={sessions}
              selectedSession={selectedSession}
              onSelectSession={setSelectedSession}
              onCreateSession={createNewSession}
              userType={user?.type}
            />
            {selectedSession && (
              <ChatWindow
                session={selectedSession}
                socket={socketRef.current}
                user={user}
                onClose={() => setSelectedSession(null)}
              />
            )}
          </div>
        );
      case 'statistics':
        return (
          <div className="cs-content-wrapper">
            <CSStatistics 
              user={user}
              socket={socketRef.current}
            />
          </div>
        );
      case 'auto-replies':
        return (
          <div className="cs-content-wrapper">
            <AutoReplyManager 
              socket={socketRef.current}
              user={user}
            />
          </div>
        );
      default:
        return <div className="cs-empty-state">请选择一个功能</div>;
    }
  };

  if (isLoading) {
    return (
      <div className="cs-loading">
        <div className="cs-loading-spinner"></div>
        <p>加载中...</p>
      </div>
    );
  }

  return (
    <div className="customer-service">
      <header className="cs-header">
        <div className="cs-header-left">
          <h1>客服系统</h1>
          <div className={`cs-connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
            <span className="cs-status-dot"></span>
            <span>{isConnected ? '已连接' : '未连接'}</span>
          </div>
        </div>
        
        <div className="cs-header-right">
          <div className="cs-user-info">
            <img src={user?.avatar} alt={user?.name} className="cs-user-avatar" />
            <span className="cs-user-name">{user?.name}</span>
            <span className={`cs-user-type ${user?.type}`}>
              {user?.type === 'customer_service' ? '客服' : '用户'}
            </span>
          </div>
          
          <button 
            className="cs-logout-btn"
            onClick={() => {
              localStorage.removeItem('user');
              window.location.reload();
            }}
          >
            退出
          </button>
        </div>
      </header>

      {error && (
        <div className="cs-error-banner">
          <span>{error}</span>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      <nav className="cs-nav">
        <button 
          className={`cs-nav-item ${activeTab === 'sessions' ? 'active' : ''}`}
          onClick={() => setActiveTab('sessions')}
        >
          <span className="cs-nav-icon">💬</span>
          <span>会话</span>
        </button>
        
        {user?.type === 'customer_service' && (
          <>
            <button 
              className={`cs-nav-item ${activeTab === 'statistics' ? 'active' : ''}`}
              onClick={() => setActiveTab('statistics')}
            >
              <span className="cs-nav-icon">📊</span>
              <span>统计</span>
            </button>
            
            <button 
              className={`cs-nav-item ${activeTab === 'auto-replies' ? 'active' : ''}`}
              onClick={() => setActiveTab('auto-replies')}
            >
              <span className="cs-nav-icon">🤖</span>
              <span>自动回复</span>
            </button>
          </>
        )}
      </nav>

      <main className="cs-main">
        {renderContent()}
      </main>

      <footer className="cs-footer">
        <p>&copy; 2024 客服系统 - WeDrawOS</p>
      </footer>
    </div>
  );
};

export default CustomerService;