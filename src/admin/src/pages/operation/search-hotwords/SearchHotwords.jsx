import React, { useState, useEffect } from 'react';
import './SearchHotwords.css';

const SearchHotwords = () => {
  const [activeTab, setActiveTab] = useState('今日热词');
  const [todayHotwords, setTodayHotwords] = useState([]);
  const [historyHotwords, setHistoryHotwords] = useState([]);
  const [statisticsData, setStatisticsData] = useState([]);
  const [loading, setLoading] = useState(true);
  // 历史热词页日期选择
  const [selectedDate, setSelectedDate] = useState('2025-11-12');
  // 热词统计页筛选
  const [statisticFilter, setStatisticFilter] = useState('过去7天');
  // 设置热词页表单数据
  const [hotwordSettings, setHotwordSettings] = useState({ dailyUpdateCount: 1 });
const [isModalVisible, setIsModalVisible] = useState(false);
const [modalHotword, setModalHotword] = useState('');
const [modalScore, setModalScore] = useState(1);
const [modalPurpose, setModalPurpose] = useState('setting'); // 'setting' 或 'today'
  const [hotwordList, setHotwordList] = useState([]);

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
          { id: 101, word: '笔记本', score: 90, date: '2025-11-12' },
          { id: 102, word: '耳机', score: 85, date: '2025-11-12' },
          { id: 103, word: '手机壳', score: 80, date: '2025-11-12' },
          { id: 104, word: '平板电脑', score: 75, date: '2025-11-11' },
          { id: 105, word: '口红', score: 70, date: '2025-11-10' },
          { id: 106, word: '音箱', score: 65, date: '2025-11-09' },
          { id: 107, word: '键盘', score: 60, date: '2025-11-08' },
          { id: 108, word: '鼠标', score: 55, date: '2025-11-07' },
          { id: 109, word: '显示器', score: 50, date: '2025-11-06' },
          { id: 110, word: '摄像头', score: 45, date: '2025-11-05' }
        ]);
        
        // 模拟热词统计数据
        setStatisticsData([
          { word: '平板笔记本', count: 100 },
          { word: '彩妆', count: 80 },
          { word: '音箱', count: 60 },
          { word: '平板电脑t10', count: 50 },
          { word: '数码', count: 45 },
          { word: 'AA88', count: 35 },
          { word: 'aa商品', count: 30 },
          { word: '口红', count: 28 },
          { word: '国家可见宽宏大量', count: 25 },
          { word: '国际特种兵', count: 20 },
          { word: '设计', count: 18 },
        ]);
        
        // 模拟设置热词数据
        setHotwordList([
          { id: 1, word: '手机', score: 54 },
          { id: 2, word: '口红', score: 34 },
          { id: 3, word: '平板电脑', score: 20 },
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

  // 设置今日热词按钮事件处理函数
  const handleSetTodayHotwords = () => {
    setModalPurpose('today');
    setIsModalVisible(true);
  };

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  const handleStatisticFilterChange = (filter) => {
    setStatisticFilter(filter);
  };

  // 打开添加热词模态框的按钮事件处理函数
  const showModal = () => {
    setModalPurpose('setting');
    setIsModalVisible(true);
  };

  // 处理模态框提交
  const handleModalSubmit = () => {
    if (modalHotword) {
      const newHotword = { id: Date.now(), word: modalHotword, score: modalScore };
      
      if (modalPurpose === 'today') {
        // 设置今日热词
        setTodayHotwords([...todayHotwords, newHotword]);
      } else {
        // 添加到设置热词列表
        setHotwordList([...hotwordList, newHotword]);
      }
      
      setModalHotword('');
      setModalScore(1);
      setIsModalVisible(false);
    }
  };

  const handleSaveSettings = () => {
    console.log('保存设置:', hotwordSettings);
    console.log('热词列表:', hotwordList);
    alert('保存设置功能将在后续实现');
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
        const filteredHistoryHotwords = historyHotwords.filter(word => word.date === selectedDate);
        return (
          <div className="history-hotwords">
            <div className="date-picker-container">
              <input 
                type="date" 
                value={selectedDate} 
                onChange={handleDateChange}
                className="date-picker"
              />
            </div>
            <div className="description-box">
              <p>这是展示历史一天的热词数据统计，可根据日期查看每日热词搜索次数表现</p>
            </div>
            <div className="bar-chart-container">
              {statisticsData.map((item, index) => (
                <div key={item.word || index} className="bar-item">
                  <div className="bar-label">{item.word}</div>
                  <div className="bar-wrapper">
                    <div 
                      className="bar" 
                      style={{ height: `${(item.count / 100) * 100}%` }}
                    ></div>
                  </div>
                  <div className="bar-value">{item.count}</div>
                </div>
              ))}
            </div>
            <div className="hotwords-list">
              {filteredHistoryHotwords.map((item) => (
                <div key={item.id} className="hotword-item">
                  <div className="hotword-text">{item.word}</div>
                  <div className="hotword-date">{item.date}</div>
                  <div className="hotword-count">分数: {item.score}</div>
                </div>
              ))}
            </div>
          </div>
        );
      case '热词统计':
        return (
          <div className="statistics-container">
            <div className="statistic-filters">
              <button 
                className={`filter-button ${statisticFilter === '今天' ? 'active' : ''}`}
                onClick={() => handleStatisticFilterChange('今天')}
              >
                今天
              </button>
              <button 
                className={`filter-button ${statisticFilter === '昨天' ? 'active' : ''}`}
                onClick={() => handleStatisticFilterChange('昨天')}
              >
                昨天
              </button>
              <button 
                className={`filter-button ${statisticFilter === '过去7天' ? 'active' : ''}`}
                onClick={() => handleStatisticFilterChange('过去7天')}
              >
                过去7天
              </button>
              <button 
                className={`filter-button ${statisticFilter === '过去30天' ? 'active' : ''}`}
                onClick={() => handleStatisticFilterChange('过去30天')}
              >
                过去30天
              </button>
              <div className="filter-group">
                <select className="select-filter">
                  <option>年月周词</option>
                  <option>周</option>
                  <option>月</option>
                  <option>年</option>
                </select>
                <input type="number" defaultValue="50" className="number-filter" />
                <button className="search-filter-button">搜索</button>
              </div>
            </div>
            <div className="bar-chart-container">
              {statisticsData.map((item, index) => (
                <div key={item.word || index} className="bar-item">
                  <div className="bar-label">{item.word}</div>
                  <div className="bar-wrapper">
                    <div 
                      className="bar" 
                      style={{ height: `${(item.count / 100) * 100}%` }}
                    ></div>
                  </div>
                  <div className="bar-value">{item.count}</div>
                </div>
              ))}
            </div>
            <div className="statistics-table">
              <table>
                <thead>
                  <tr>
                    <th>热词名称</th>
                    <th>搜索次数</th>
                  </tr>
                </thead>
                <tbody>
                  {statisticsData.map((item, index) => (
                    <tr key={index} className="table-row">
                      <td>{item.word}</td>
                      <td>{item.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      case '设置热词':
        return (
          <div className="setting-container">
            <div className="settings-section">
              <div className="setting-row">
                <button className="add-button" onClick={showModal}>添加热词</button>
              </div>
              <div className="setting-row">
                <label className="setting-label">每日持久化词增加数量:</label>
                <input 
                  type="number" 
                  value={hotwordSettings.dailyUpdateCount}
                  onChange={(e) => setHotwordSettings({...hotwordSettings, dailyUpdateCount: parseInt(e.target.value)})}
                  min="1"
                  className="number-input"
                />
              </div>
            </div>
            <div className="settings-section">
              <h4 className="setting-section-title">已有热词</h4>
              <div className="hotwords-list">
                {hotwordList.map((item) => (
                  <div key={item.id} className="hotword-item">
                    <div className="hotword-text">{item.word}</div>
                    <div className="hotword-count">分数: {item.score}</div>
                    <button 
                      className="delete-button"
                      onClick={() => setHotwordList(hotwordList.filter(hotword => hotword.id !== item.id))}
                      aria-label="删除"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="settings-actions">
              <button className="save-button" onClick={handleSaveSettings}>保存</button>
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
      
      {/* 热词设置模态框 */}
      {isModalVisible && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>{modalPurpose === 'today' ? '设置今日热词' : '添加热词'}</h3>
              <button className="modal-close" onClick={() => setIsModalVisible(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="modal-form-group">
                <label className="modal-label">*热词:</label>
                <input 
                  type="text" 
                  value={modalHotword}
                  onChange={(e) => setModalHotword(e.target.value)}
                  placeholder="请输入热词"
                  className="modal-input"
                />
              </div>
              <div className="modal-form-group">
                <label className="modal-label">*分数:</label>
                <input 
                  type="number" 
                  value={modalScore}
                  onChange={(e) => setModalScore(parseInt(e.target.value))}
                  min="1"
                  className="modal-input"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="modal-cancel" onClick={() => setIsModalVisible(false)}>取消</button>
              <button className="modal-submit" onClick={handleModalSubmit}>提交</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchHotwords;