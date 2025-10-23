import React, { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

const ChatWindow = ({ session, socket, user, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // 确保session对象存在
  if (!session || !session.id) {
    return null;
  }

  // 加载历史消息
  useEffect(() => {
    loadMessages(currentPage);
  }, [session.id, currentPage]);

  // 监听WebSocket消息
  useEffect(() => {
    if (!socket) return;

    // 加入会话
    socket.emit('join_session', { sessionId: session.id });

    // 监听新消息
    socket.on('new_message', (data) => {
      if (data && data.data && data.data.conversationId === session.id) {
        handleNewMessage(data.data);
      }
    });

    // 监听用户输入状态
    socket.on('typing', (data) => {
      if (data && data.data && data.data.userId !== user?.id) {
        handleUserTyping(data.data.userId, true);
      }
    });

    socket.on('stop_typing', (data) => {
      if (data && data.data && data.data.userId !== user?.id) {
        handleUserTyping(data.data.userId, false);
      }
    });

    // 监听用户加入/离开
    socket.on('user_joined', (data) => {
      console.log('User joined:', data);
    });

    socket.on('user_left', (data) => {
      console.log('User left:', data);
    });

    return () => {
      socket.off('new_message');
      socket.off('typing');
      socket.off('stop_typing');
      socket.off('user_joined');
      socket.off('user_left');
      socket.emit('leave_session', { sessionId: session.id });
    };
  }, [socket, session.id, user?.id]);

  // 加载消息
  const loadMessages = async (page = 1) => {
    if (page === 1) {
      setIsLoadingMessages(true);
    }

    try {
      // 实际应用中应调用API
      const response = await fetch(`/api/customer-service/sessions/${session.id}/messages?page=${page}&pageSize=50`);
      if (!response.ok) throw new Error('获取消息失败');
      const data = await response.json();
      
      // 确保data.data是数组
      const newMessages = Array.isArray(data?.data) ? data.data : [];
      
      if (page === 1) {
        setMessages(newMessages);
      } else {
        // 合并新旧消息，避免重复
        const existingIds = new Set(messages.map(m => m.id));
        const uniqueNewMessages = newMessages.filter(m => !existingIds.has(m.id));
        setMessages(prev => [...uniqueNewMessages, ...prev]);
      }
      
      // 判断是否还有更多消息
      setHasMoreMessages(newMessages.length === 50);
    } catch (error) {
      console.error('Failed to load messages:', error);
      // 使用模拟数据
      setMessages(getMockMessages());
      setHasMoreMessages(false);
    } finally {
      if (page === 1) {
        setIsLoadingMessages(false);
      }
    }
  };

  // 模拟消息数据
  const getMockMessages = () => {
    return [
      {
        id: 'msg_1',
        conversationId: session.id,
        senderId: session.customerInfo?.id || 'customer_1',
        content: '你好，我需要帮助',
        type: 'text',
        createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        isRead: true
      },
      {
        id: 'msg_2',
        conversationId: session.id,
        senderId: 'system',
        content: '您好，请问有什么可以帮助您的吗？',
        type: 'text',
        createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
        isRead: true,
        isAutoReply: true
      }
    ];
  };

  // 处理新消息
  const handleNewMessage = (message) => {
    // 检查消息是否已存在
    const exists = messages.some(m => m.id === message.id);
    if (!exists) {
      setMessages(prev => [...prev, message]);
      
      // 标记为已读
      if (socket && message.senderId !== user?.id) {
        socket.emit('read_receipt', {
          conversationId: session.id,
          messageId: message.id
        });
      }
    }
  };

  // 处理用户输入状态
  const handleUserTyping = (userId, isTyping) => {
    setTypingUsers(prev => {
      if (isTyping) {
        return [...prev.filter(id => id !== userId), userId];
      } else {
        return prev.filter(id => id !== userId);
      }
    });
  };

  // 发送消息
  const sendMessage = () => {
    if (!messageInput.trim() || !socket) return;

    const message = {
      conversationId: session.id,
      content: messageInput.trim(),
      type: 'text'
    };

    // 清空输入框
    setMessageInput('');
    // 停止输入状态
    setIsTyping(false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    socket.emit('stop_typing', {
      conversationId: session.id
    });

    // 发送消息
    socket.emit('message', message);
  };

  // 处理输入变化
  const handleInputChange = (e) => {
    setMessageInput(e.target.value);
    
    // 发送输入状态
    if (socket && !isTyping) {
      setIsTyping(true);
      socket.emit('typing', {
        conversationId: session.id
      });
    }
    
    // 清除之前的超时
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // 设置新的超时，3秒后停止输入状态
    typingTimeoutRef.current = setTimeout(() => {
      if (socket && isTyping) {
        setIsTyping(false);
        socket.emit('stop_typing', {
          conversationId: session.id
        });
      }
    }, 3000);
  };

  // 处理按键事件
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // 加载更多消息
  const loadMoreMessages = () => {
    if (hasMoreMessages && !isLoadingMessages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  // 格式化消息时间
  const formatMessageTime = (dateString) => {
    try {
      return format(new Date(dateString), 'HH:mm', { locale: zhCN });
    } catch {
      return '';
    }
  };

  // 获取消息发送者显示名称
  const getSenderName = (senderId) => {
    if (senderId === user?.id) {
      return '我';
    } else if (senderId === session.customerInfo?.id) {
      return session.customerInfo?.name || '用户';
    } else if (senderId === 'system') {
      return '系统';
    } else {
      return '客服';
    }
  };

  // 获取消息气泡样式类
  const getMessageBubbleClass = (senderId) => {
    if (senderId === user?.id) {
      return 'message-bubble message-bubble-sent';
    } else {
      return 'message-bubble message-bubble-received';
    }
  };

  return (
    <div className="chat-window">
      {/* 聊天窗口头部 */}
      <div className="chat-window-header">
        <div className="chat-header-info">
          <img 
            src={session.customerInfo?.avatar || 'https://i.pravatar.cc/150?img=33'} 
            alt={session.customerInfo?.name}
            className="chat-user-avatar"
          />
          <div className="chat-user-details">
            <div className="chat-user-name">
              {session.customerInfo?.name || '未知用户'}
            </div>
            <div className="chat-session-info">
              <span className={`chat-session-status status-${session.status}`}>
                {getSessionStatusText(session.status)}
              </span>
              <span className="chat-session-time">
                {format(new Date(session.createdAt), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
              </span>
            </div>
          </div>
        </div>
        <div className="chat-header-actions">
          <button className="chat-action-btn chat-info-btn">
            详情
          </button>
          {user?.type === 'customer_service' && (
            <button className="chat-action-btn chat-close-btn">
              关闭会话
            </button>
          )}
          <button className="chat-action-btn chat-close-window-btn" onClick={onClose}>
            ×
          </button>
        </div>
      </div>

      {/* 消息列表 */}
      <div 
        className="chat-messages-container"
        ref={messagesContainerRef}
        onScroll={(e) => {
          if (e.target.scrollTop === 0 && hasMoreMessages) {
            loadMoreMessages();
          }
        }}
      >
        {isLoadingMessages && currentPage === 1 ? (
          <div className="chat-loading">加载中...</div>
        ) : (
          <>
            {currentPage > 1 && hasMoreMessages && (
              <div className="chat-loading-more">加载更多消息...</div>
            )}
            
            <div className="chat-messages">
              {messages.length === 0 ? (
                <div className="chat-empty-state">暂无消息</div>
              ) : (
                messages.map((message) => (
                  <div 
                    key={message.id} 
                    className="message-item"
                    style={{ 
                      justifyContent: message.senderId === user?.id ? 'flex-end' : 'flex-start' 
                    }}
                  >
                    {message.senderId !== user?.id && (
                      <img 
                        src={message.senderId === session.customerInfo?.id 
                          ? (session.customerInfo?.avatar || 'https://i.pravatar.cc/150?img=33')
                          : 'https://i.pravatar.cc/150?img=68'}
                        alt={getSenderName(message.senderId)}
                        className="message-avatar"
                      />
                    )}
                    
                    <div className="message-content-wrapper">
                      <div className="message-info">
                        <span className="message-sender">
                          {message.senderId !== user?.id && getSenderName(message.senderId)}
                        </span>
                        <span className="message-time">
                          {formatMessageTime(message.createdAt)}
                        </span>
                        {message.isAutoReply && (
                          <span className="message-auto-reply-badge">自动回复</span>
                        )}
                      </div>
                      
                      <div className={getMessageBubbleClass(message.senderId)}>
                        <div className="message-text">
                          {message.content}
                        </div>
                        {message.senderId === user?.id && (
                          <div className="message-read-status">
                            {message.isRead ? '已读' : '未读'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {/* 输入状态提示 */}
            {typingUsers.length > 0 && (
              <div className="chat-typing-indicator">
                <span>{typingUsers.length} 人正在输入...</span>
                <div className="typing-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* 消息输入区域 */}
      <div className="chat-input-container">
        <div className="chat-input-toolbar">
          <button className="chat-tool-btn">
            📎
          </button>
          <button className="chat-tool-btn">
            😊
          </button>
          {user?.type === 'customer_service' && (
            <button className="chat-tool-btn">
              📝
            </button>
          )}
        </div>
        
        <textarea
          className="chat-input"
          placeholder="输入消息..."
          value={messageInput}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          rows={3}
        />
        
        <button 
          className="chat-send-btn"
          onClick={sendMessage}
          disabled={!messageInput.trim()}
        >
          发送
        </button>
      </div>
    </div>
  );
};

// 获取会话状态显示文本
const getSessionStatusText = (status) => {
  const statusMap = {
    active: '进行中',
    waiting: '等待中',
    closed: '已关闭',
    transferred: '已转接'
  };
  return statusMap[status] || status;
};

export default ChatWindow;