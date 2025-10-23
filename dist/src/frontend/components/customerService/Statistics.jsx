import React, { useState, useEffect } from 'react';
import './CustomerService.css';

const Statistics = ({ userRole, userId }) => {
  const [statistics, setStatistics] = useState({
    summary: {
      totalSessions: 0,
      activeSessions: 0,
      waitingSessions: 0,
      closedSessions: 0,
      averageResponseTime: 0,
      totalMessages: 0,
      autoRepliesCount: 0
    },
    trends: [],
    performance: [],
    sessionTypeDistribution: []
  });
  const [timeRange, setTimeRange] = useState('today');
  const [customDateRange, setCustomDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStatistics();
  }, [timeRange, customDateRange, userRole, userId]);

  const fetchStatistics = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      // 构建API参数
      const params = new URLSearchParams();
      params.append('timeRange', timeRange);
      if (timeRange === 'custom') {
        params.append('startDate', customDateRange.startDate);
        params.append('endDate', customDateRange.endDate);
      }
      if (userRole === 'customer_service') {
        params.append('agentId', userId);
      }

      // 实际项目中，这里应该调用真实的API
      // const response = await fetch(`/api/customer-service/stats?${params.toString()}`);
      // const data = await response.json();
      
      // 模拟数据
      const mockData = generateMockStatistics(timeRange, userRole);
      setStatistics(mockData);
    } catch (err) {
      setError('获取统计数据失败，请稍后重试');
      console.error('Failed to fetch statistics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 生成模拟数据（实际项目中应删除）
  const generateMockStatistics = (range, role) => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    // 根据时间范围生成不同的数据量
    let multiplier = range === 'today' ? 1 : range === 'week' ? 5 : range === 'month' ? 20 : 10;
    
    // 生成趋势数据
    const trends = [];
    const daysToGenerate = range === 'today' ? 24 : range === 'week' ? 7 : 30;
    
    for (let i = daysToGenerate - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * (range === 'today' ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000));
      const dateStr = range === 'today' 
        ? date.getHours() + ':00'
        : date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
      
      trends.push({
        date: dateStr,
        sessions: Math.floor(Math.random() * 15) + 5,
        messages: Math.floor(Math.random() * 50) + 20
      });
    }
    
    // 生成客服绩效数据（如果是客服角色）
    const performance = role === 'customer_service' ? [
      {
        name: '今天',
        completedSessions: 12,
        averageResponseTime: Math.floor(Math.random() * 40) + 10,
        satisfactionRate: (Math.random() * 0.2 + 0.8).toFixed(2)
      },
      {
        name: '本周',
        completedSessions: 65,
        averageResponseTime: Math.floor(Math.random() * 40) + 10,
        satisfactionRate: (Math.random() * 0.2 + 0.8).toFixed(2)
      },
      {
        name: '本月',
        completedSessions: 245,
        averageResponseTime: Math.floor(Math.random() * 40) + 10,
        satisfactionRate: (Math.random() * 0.2 + 0.8).toFixed(2)
      }
    ] : [];
    
    // 生成会话类型分布
    const sessionTypeDistribution = [
      { type: '咨询', count: Math.floor(Math.random() * 60) + 40 },
      { type: '投诉', count: Math.floor(Math.random() * 20) + 10 },
      { type: '建议', count: Math.floor(Math.random() * 30) + 20 },
      { type: '其他', count: Math.floor(Math.random() * 20) + 5 }
    ];
    
    return {
      summary: {
        totalSessions: Math.floor(Math.random() * 100) * multiplier + 50 * multiplier,
        activeSessions: Math.floor(Math.random() * 20) + 10,
        waitingSessions: Math.floor(Math.random() * 10) + 2,
        closedSessions: Math.floor(Math.random() * 80) * multiplier + 40 * multiplier,
        averageResponseTime: Math.floor(Math.random() * 40) + 10,
        totalMessages: Math.floor(Math.random() * 500) * multiplier + 300 * multiplier,
        autoRepliesCount: Math.floor(Math.random() * 100) * multiplier + 50 * multiplier
      },
      trends,
      performance,
      sessionTypeDistribution
    };
  };

  const renderMiniChart = (data, color) => {
    const maxValue = Math.max(...data.map(d => d.sessions), ...data.map(d => d.messages));
    const chartHeight = 40;
    
    return (
      <div style={{ height: chartHeight, display: 'flex', alignItems: 'flex-end', gap: '2px', marginTop: '8px' }}>
        {data.slice(-24).map((item, index) => {
          const sessionsHeight = (item.sessions / maxValue) * chartHeight * 0.7;
          return (
            <div key={index} style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: '1px' }}>
              <div
                style={{
                  width: '50%',
                  height: `${sessionsHeight}px`,
                  backgroundColor: color,
                  borderRadius: '1px 1px 0 0'
                }}
              />
            </div>
          );
        })}
      </div>
    );
  };

  const formatChange = (value) => {
    const change = value || Math.random() * 20 - 10; // 模拟变化率
    const sign = change >= 0 ? '+' : '';
    const className = change >= 0 ? 'positive' : 'negative';
    return (
      <span className={`stat-card-change ${className}`}>
        {sign}{change.toFixed(1)}%
        <span>{change >= 0 ? '↑' : '↓'}</span>
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="statistics-container">
        <div className="cs-loading">
          <div className="cs-loading-spinner"></div>
          <span>加载统计数据中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="statistics-container">
      {error && (
        <div className="cs-error-banner">
          {error}
          <button onClick={() => setError('')}>×</button>
        </div>
      )}
      
      <div className="statistics-header">
        <h2>客服统计报表</h2>
        <div className="statistics-filters">
          <select
            className="stat-period-select"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <option value="today">今日</option>
            <option value="week">本周</option>
            <option value="month">本月</option>
            <option value="custom">自定义</option>
          </select>
          
          {timeRange === 'custom' && (
            <>
              <input
                type="date"
                className="stat-date-picker"
                value={customDateRange.startDate}
                onChange={(e) => setCustomDateRange({...customDateRange, startDate: e.target.value})}
                max={customDateRange.endDate || new Date().toISOString().split('T')[0]}
              />
              <span>至</span>
              <input
                type="date"
                className="stat-date-picker"
                value={customDateRange.endDate}
                onChange={(e) => setCustomDateRange({...customDateRange, endDate: e.target.value})}
                min={customDateRange.startDate}
                max={new Date().toISOString().split('T')[0]}
              />
            </>
          )}
        </div>
      </div>
      
      {/* 统计卡片 */}
      <div className="stat-cards">
        <div className="stat-card">
          <div className="stat-card-title">总会话数</div>
          <div className="stat-card-value">{statistics.summary.totalSessions}</div>
          {formatChange(Math.random() * 30 - 10)}
        </div>
        
        <div className="stat-card">
          <div className="stat-card-title">活跃会话</div>
          <div className="stat-card-value">{statistics.summary.activeSessions}</div>
          {formatChange(Math.random() * 20 - 5)}
        </div>
        
        <div className="stat-card">
          <div className="stat-card-title">等待会话</div>
          <div className="stat-card-value">{statistics.summary.waitingSessions}</div>
          {formatChange(Math.random() * 15 - 10)}
        </div>
        
        <div className="stat-card">
          <div className="stat-card-title">平均响应时间</div>
          <div className="stat-card-value">{statistics.summary.averageResponseTime}s</div>
          {formatChange(Math.random() * 25 - 15)}
        </div>
      </div>
      
      {/* 图表区域 */}
      <div className="stat-charts">
        {/* 会话趋势图 */}
        <div className="stat-chart-container">
          <div className="stat-chart-title">会话与消息趋势</div>
          {renderMiniChart(statistics.trends, '#409eff')}
          <div style={{ marginTop: '8px', fontSize: '12px', color: '#909399' }}>
            最近{timeRange === 'today' ? '24小时' : timeRange === 'week' ? '7天' : '30天'}
          </div>
        </div>
        
        {/* 会话类型分布 */}
        <div className="stat-chart-container">
          <div className="stat-chart-title">会话类型分布</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
            {statistics.sessionTypeDistribution.map((item, index) => {
              const total = statistics.sessionTypeDistribution.reduce((sum, type) => sum + type.count, 0);
              const percentage = ((item.count / total) * 100).toFixed(1);
              const colors = ['#409eff', '#67c23a', '#e6a23c', '#f56c6c'];
              
              return (
                <div key={index}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '14px', color: '#606266' }}>{item.type}</span>
                    <span style={{ fontSize: '14px', color: '#909399' }}>{percentage}%</span>
                  </div>
                  <div style={{ height: '8px', backgroundColor: '#f0f2f5', borderRadius: '4px', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${percentage}%`,
                        backgroundColor: colors[index % colors.length],
                        borderRadius: '4px'
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* 绩效表格（仅对客服显示） */}
      {userRole === 'customer_service' && statistics.performance.length > 0 && (
        <div className="stat-table">
          <div className="stat-table-header" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr' }}>
            <div>时间段</div>
            <div>完成会话</div>
            <div>平均响应时间</div>
            <div>满意度</div>
          </div>
          <div className="stat-table-content">
            {statistics.performance.map((item, index) => (
              <div key={index} className="stat-table-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr' }}>
                <div style={{ fontWeight: '500', color: '#303133' }}>{item.name}</div>
                <div>{item.completedSessions}个</div>
                <div>{item.averageResponseTime}秒</div>
                <div>
                  <span style={{ color: item.satisfactionRate >= 0.9 ? '#67c23a' : item.satisfactionRate >= 0.8 ? '#e6a23c' : '#f56c6c' }}>
                    {(item.satisfactionRate * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* 系统概览数据 */}
      <div className="stat-table" style={{ marginTop: '24px' }}>
        <div className="stat-table-header">
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>系统概览</h3>
        </div>
        <div className="stat-table-content">
          <div className="stat-table-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
            <div>已关闭会话</div>
            <div style={{ fontWeight: '500' }}>{statistics.summary.closedSessions}个</div>
          </div>
          <div className="stat-table-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
            <div>消息总数</div>
            <div style={{ fontWeight: '500' }}>{statistics.summary.totalMessages}条</div>
          </div>
          <div className="stat-table-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
            <div>自动回复数</div>
            <div style={{ fontWeight: '500' }}>{statistics.summary.autoRepliesCount}条</div>
          </div>
          <div className="stat-table-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
            <div>自动回复率</div>
            <div style={{ fontWeight: '500' }}>
              {statistics.summary.totalMessages > 0 
                ? ((statistics.summary.autoRepliesCount / statistics.summary.totalMessages) * 100).toFixed(1) 
                : '0.0'
              }%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Statistics;