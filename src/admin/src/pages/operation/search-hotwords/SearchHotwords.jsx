import React, { useState, useEffect } from 'react';
import './SearchHotwords.css';

const SearchHotwords = () => {
  const [activeTab, setActiveTab] = useState('今日热词');
  const [todayHotwords, setTodayHotwords] = useState([]);
  const [historyHotwords, setHistoryHotwords] = useState([]);
  const [statisticsData, setStatisticsData] = useState([]);
  const [loading, setLoading] = useState(true);

  const tabs = ['今日热词', '历史热词', '热词统计', '设置热词'];

  // 模拟数据加载
  useEffect(() => {
    const loadData = () => {
      // 模拟API请求延迟
      setTimeout(() => {
        // 模拟今日热词数据
        setTodayHotwords([
          { id: 1, word: '薯条', score: 98 },
          { id: 2, word: '电脑', score: 95 },
          { id: 3, word: '没可爱', score: 88 },
          { id: 4, word: '杂货铺', score: 82 },
          { id: 5, word: '手机', score: 78 },
          { id: 6, word: '平板电脑', score: 75 },
          { id: 7, word: '口红', score: 70 }
        ]);
        
        // 模拟历史热词数据
        setHistoryHotwords([
          { id: 101, word: '笔记本', score: 90, date: '2024-01-15' },
          { id: 102, word: '耳机', score: 85, date: '2024-01-15' },
          { id: 103, word: '手机壳', score: 80, date: '2024-01-15' }
        ]);
        
        // 模拟热词统计数据
        setStatisticsData([
          { id: 201, word: '手机', count: 1523 },
          { id: 202, word: '电脑', count: 1256 },
          { id: 203, word: '耳机', count: 986 }
        ]);
        
        setLoading(false);
      }, 500);
    };
    
    loadData();
  }, []);

  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  const handleDeleteHotword = (id) => {
    // 模拟删除操作
    setTodayHotwords(todayHotwords.filter(item => item.id !== id));
    // 这里应该调用API删除热词
    console.log('删除热词:', id);
  };

  const handleSetTodayHotwords = () => {
    // 模拟设置今日热词操作
    console.log('设置今日热词');
    alert('设置今日热词功能将在后续实现');
  };

  // 根据当前标签渲染内容
  const renderContent = () => {
    if (loading) {
      return <div className="loading">加载中...</div>;
    }

    switch (activeTab) {
      case '今日热词':
        return (
          <div>
            <button className="set-today-button" onClick={handleSetTodayHotwords}>设置今日热词</button>
            <div className="description-box">
              <p>这里展示今日系统中搜索前一百的搜索热词，分数为热词在排序系统中的分数，分数越高，可以在用户获取热词时进行优先展示（首页商城搜索栏下方推荐位）（分数可以填写负数，会降低推荐度）</p>
            </div>
            <div className="hotwords-list">
              {todayHotwords.map((item) => (
                <div key={item.id} className="hotword-item">
                  <div className="hotword-text">{item.word}</div>
                  <button 
                    className="delete-button" 
                    onClick={() => handleDeleteHotword(item.id)}
                    aria-label="删除"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      case '历史热词':
        return (
          <div className="history-hotwords">
            <h3>历史热词记录</h3>
            <div className="hotwords-list">
              {historyHotwords.map((item) => (
                <div key={item.id} className="hotword-item">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className="hotword-text">{item.word}</span>
                    <span className="hotword-date">({item.date})</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case '热词统计':
        return (
          <div className="statistics-container">
            <h3>热词搜索统计</h3>
            <div className="hotwords-list">
              {statisticsData.map((item) => (
                <div key={item.id} className="hotword-item">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className="hotword-text">{item.word}</span>
                    <span className="hotword-count">搜索次数: {item.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case '设置热词':
        return (
          <div className="setting-container">
            <h3>热词设置</h3>
            <div className="description-box">
              <p>在这里可以配置热词的权重和推荐规则</p>
            </div>
          </div>
        );
      default:
        return <div>请选择一个标签查看内容</div>;
    }
  };

  return (
    <div className="search-hotwords-container">
      {/* 标签页导航 */}
      <div className="tabs-container">
        {tabs.map((tab) => (
          <button
            key={tab}
            className={`tab-button ${activeTab === tab ? 'active' : ''}`}
            onClick={() => handleTabClick(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* 内容区域 */}
      <div className="content-container">
        {renderContent()}
      </div>
    </div>
  );
};

export default SearchHotwords;