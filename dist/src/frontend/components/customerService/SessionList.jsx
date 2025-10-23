import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

const SessionList = ({ sessions = [], selectedSession, onSelectSession, onCreateSession, userType }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showNewSessionForm, setShowNewSessionForm] = useState(false);
  const [newSessionMessage, setNewSessionMessage] = useState('');
  const [sortOrder, setSortOrder] = useState('updatedAt'); // 'updatedAt' or 'createdAt'
  const [sortDirection, setSortDirection] = useState('desc'); // 'asc' or 'desc'

  // 确保sessions是数组
  const safeSessions = Array.isArray(sessions) ? sessions : [];

  // 过滤和排序会话
  const filteredAndSortedSessions = React.useMemo(() => {
    let filtered = safeSessions.filter(session => {
      // 搜索过滤
      const matchesSearch = searchTerm === '' || 
        (session.customerInfo?.name?.toLowerCase()?.includes(searchTerm.toLowerCase()) || 
         session.lastMessage?.content?.toLowerCase()?.includes(searchTerm.toLowerCase()));
      
      // 状态过滤
      const matchesStatus = filterStatus === 'all' || session.status === filterStatus;
      
      return matchesSearch && matchesStatus;
    });

    // 排序
    filtered.sort((a, b) => {
      const dateA = new Date(a[sortOrder] || a.updatedAt || 0);
      const dateB = new Date(b[sortOrder] || b.updatedAt || 0);
      return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
    });

    return filtered;
  }, [safeSessions, searchTerm, filterStatus, sortOrder, sortDirection]);

  // 处理新建会话
  const handleCreateNewSession = () => {
    if (newSessionMessage.trim()) {
      onCreateSession(newSessionMessage.trim());
      setNewSessionMessage('');
      setShowNewSessionForm(false);
    }
  };

  // 格式化时间
  const formatTime = (dateString) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) {
        return format(date, 'HH:mm');
      } else if (diffDays === 1) {
        return '昨天 ' + format(date, 'HH:mm');
      } else if (diffDays < 7) {
        return format(date, 'EEE HH:mm', { locale: zhCN });
      } else {
        return format(date, 'yyyy-MM-dd HH:mm');
      }
    } catch {
      return '未知时间';
    }
  };

  // 获取会话状态显示文本
  const getStatusText = (status) => {
    const statusMap = {
      active: '进行中',
      waiting: '等待中',
      closed: '已关闭',
      transferred: '已转接'
    };
    return statusMap[status] || status;
  };

  // 获取会话状态类名
  const getStatusClassName = (status) => {
    return `session-status session-status-${status}`;
  };

  return (
    <div className="session-list">
      <div className="session-list-header">
        <div className="session-list-title">
          <h2>会话列表</h2>
          {userType === 'customer' && (
            <button 
              className="new-session-btn"
              onClick={() => setShowNewSessionForm(!showNewSessionForm)}
            >
              {showNewSessionForm ? '取消' : '开始新会话'}
            </button>
          )}
        </div>
        
        {/* 搜索框 */}
        <div className="session-list-search">
          <input
            type="text"
            placeholder="搜索会话..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="session-search-input"
          />
        </div>
        
        {/* 过滤器 */}
        <div className="session-list-filters">
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            className="session-filter-select"
          >
            <option value="all">全部状态</option>
            <option value="active">进行中</option>
            <option value="waiting">等待中</option>
            <option value="closed">已关闭</option>
          </select>
          
          <div className="session-sort-controls">
            <button 
              className={`sort-btn ${sortOrder === 'updatedAt' ? 'active' : ''}`}
              onClick={() => {
                if (sortOrder === 'updatedAt') {
                  setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                } else {
                  setSortOrder('updatedAt');
                  setSortDirection('desc');
                }
              }}
            >
              最近更新
              <span className="sort-icon">
                {sortOrder === 'updatedAt' ? 
                  (sortDirection === 'asc' ? '↑' : '↓') : 
                  '↕'
                }
              </span>
            </button>
          </div>
        </div>
      </div>
      
      {/* 新建会话表单 */}
      {showNewSessionForm && (
        <div className="new-session-form">
          <textarea
            placeholder="请输入您的问题或需求..."
            value={newSessionMessage}
            onChange={(e) => setNewSessionMessage(e.target.value)}
            rows={3}
            className="new-session-message"
          />
          <div className="new-session-actions">
            <button 
              className="cancel-btn"
              onClick={() => {
                setShowNewSessionForm(false);
                setNewSessionMessage('');
              }}
            >
              取消
            </button>
            <button 
              className="submit-btn"
              onClick={handleCreateNewSession}
              disabled={!newSessionMessage.trim()}
            >
              开始会话
            </button>
          </div>
        </div>
      )}
      
      {/* 会话列表内容 */}
      <div className="session-list-content">
        {filteredAndSortedSessions.length === 0 ? (
          <div className="session-list-empty">
            <p>{searchTerm || filterStatus !== 'all' ? '没有找到匹配的会话' : '暂无会话'}</p>
            {userType === 'customer' && !showNewSessionForm && (
              <button 
                className="empty-create-btn"
                onClick={() => setShowNewSessionForm(true)}
              >
                开始新会话
              </button>
            )}
          </div>
        ) : (
          filteredAndSortedSessions.map(session => {
            const isSelected = selectedSession?.id === session.id;
            
            return (
              <div 
                key={session.id}
                className={`session-item ${isSelected ? 'selected' : ''}`}
                onClick={() => onSelectSession(session)}
              >
                <div className="session-item-header">
                  <div className="session-user-info">
                    <img 
                      src={session.customerInfo?.avatar || 'https://i.pravatar.cc/150?img=33'} 
                      alt={session.customerInfo?.name}
                      className="session-user-avatar"
                    />
                    <div className="session-user-details">
                      <div className="session-user-name">
                        {session.customerInfo?.name || '未知用户'}
                        {session.unreadCount > 0 && (
                          <span className="unread-badge">{session.unreadCount}</span>
                        )}
                      </div>
                      <div className="session-time">
                        {formatTime(session.updatedAt || session.createdAt)}
                      </div>
                    </div>
                  </div>
                  <div className={getStatusClassName(session.status)}>
                    {getStatusText(session.status)}
                  </div>
                </div>
                
                {session.lastMessage && (
                  <div className="session-last-message">
                    <div className="session-message-content">
                      {session.lastMessage.content.length > 50 
                        ? session.lastMessage.content.substring(0, 50) + '...' 
                        : session.lastMessage.content
                      }
                    </div>
                  </div>
                )}
                
                {/* 会话操作按钮 */}
                <div className="session-item-actions">
                  {userType === 'customer_service' && (
                    <>
                      <button className="session-action-btn session-assign-btn">
                        转接
                      </button>
                      <button className="session-action-btn session-close-btn">
                        关闭
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
      
      {/* 会话统计 */}
      <div className="session-list-footer">
        <div className="session-stats">
          <span>总会话: {safeSessions.length}</span>
          <span>活跃: {safeSessions.filter(s => s.status === 'active').length}</span>
          <span>等待: {safeSessions.filter(s => s.status === 'waiting').length}</span>
        </div>
      </div>
    </div>
  );
};

export default SessionList;