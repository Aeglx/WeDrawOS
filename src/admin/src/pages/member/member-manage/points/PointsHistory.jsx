import React, { useState, useEffect } from 'react';
import { Input, Button, Table, Pagination, Spin, message, Row, Col } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import './PointsHistory.css';

const { Search } = Input;

// 模拟积分历史数据
const generateMockData = (page, pageSize) => {
  const data = [];
  const baseId = (page - 1) * pageSize + 1;
  
  // 积分变动类型
  const pointTypes = [
    '会员注册',
    '连续签到',
    '邀请好友',
    '购买商品',
    '评论商品',
    '分享商品',
    '活动奖励',
    '积分兑换'
  ];
  
  for (let i = 0; i < pageSize; i++) {
    const randomIndex = Math.floor(Math.random() * pointTypes.length);
    const pointChange = Math.floor(Math.random() * 50);
    const isAdd = Math.random() > 0.3; // 70%概率是增加积分
    const changeAmount = isAdd ? pointChange : -Math.floor(pointChange / 2);
    const currentPoints = Math.floor(Math.random() * 100);
    
    // 生成随机时间（最近一个月内）
    const now = new Date();
    const randomDays = Math.floor(Math.random() * 30);
    const randomHours = Math.floor(Math.random() * 24);
    const randomMinutes = Math.floor(Math.random() * 60);
    const randomSeconds = Math.floor(Math.random() * 60);
    
    now.setDate(now.getDate() - randomDays);
    now.setHours(randomHours, randomMinutes, randomSeconds, 0);
    
    data.push({
      key: baseId + i,
      username: `m${Math.random().toString(36).substring(2, 10)}`,
      reason: `${pointTypes[randomIndex]}，积分${Math.abs(changeAmount)}`,
      addPoints: changeAmount > 0 ? changeAmount : 0,
      reducePoints: changeAmount < 0 ? Math.abs(changeAmount) : 0,
      currentPoints: currentPoints,
      timestamp: now.toLocaleString('zh-CN')
    });
  }
  
  return data;
};

const PointsHistory = () => {
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [dataSource, setDataSource] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 5056 // 总记录数，从图片中获取
  });

  // 加载数据
  const loadData = (page = 1, pageSize = 10) => {
    setLoading(true);
    
    // 模拟API请求延迟
    setTimeout(() => {
      const data = generateMockData(page, pageSize);
      
      // 如果有搜索条件，进行简单的过滤
      const filteredData = searchText
        ? data.filter(item => item.username.includes(searchText))
        : data;
      
      setDataSource(filteredData);
      setLoading(false);
    }, 500);
  };

  // 处理搜索
  const handleSearch = (value) => {
    setSearchText(value);
    setPagination(prev => ({ ...prev, current: 1 }));
    loadData(1, pagination.pageSize);
  };

  // 处理分页变化
  const handlePageChange = (page, pageSize) => {
    setPagination(prev => ({ 
      ...prev, 
      current: page, 
      pageSize 
    }));
    loadData(page, pageSize);
  };

  // 初始加载
  useEffect(() => {
    loadData(pagination.current, pagination.pageSize);
  }, []);

  // 表格列配置
  const columns = [
    {
      title: '会员名称',
      dataIndex: 'username',
      key: 'username',
      width: 180,
      ellipsis: true,
      render: (text) => (
        <span title={text} className="usernameCell">{text}</span>
      )
    },
    {
      title: '变更内容',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true,
      render: (text) => (
        <span title={text} className="reasonCell">{text}</span>
      )
    },
    {
      title: '获得积分',
      dataIndex: 'addPoints',
      key: 'addPoints',
      width: 120,
      align: 'center',
      render: (value) => (
        <span className="addPoints">{value || '-'}</span>
      )
    },
    {
      title: '变动积分',
      key: 'changePoints',
      width: 120,
      align: 'center',
      render: (_, record) => {
        const changeAmount = record.addPoints - record.reducePoints;
        return (
          <span className={changeAmount > 0 ? 'positiveChange' : 'negativeChange'}>
            {changeAmount > 0 ? '+' : ''}{changeAmount}
          </span>
        );
      }
    },
    {
      title: '当前积分',
      dataIndex: 'currentPoints',
      key: 'currentPoints',
      width: 120,
      align: 'center',
      render: (value) => (
        <span className="currentPoints">{value}</span>
      )
    },
    {
      title: '操作时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 180,
      align: 'center',
      render: (text) => (
        <span className="timestamp">{text}</span>
      )
    }
  ];

  return (
    <div className="container">
      {/* 搜索区域 - 按照统一样式优化 */}
      <div className="search-area" style={{ backgroundColor: '#fff', borderBottom: '1px solid #f0f0f0', marginBottom: '16px' }}>
        <Row gutter={16} align="middle">
          <Col>
            <span style={{ marginRight: '8px', color: '#666' }}>会员名称</span>
            <Input
              placeholder="请输入会员名称"
              allowClear
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onPressEnter={() => handleSearch(searchText)}
              style={{ width: 180, height: 32 }}
            />
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={() => handleSearch(searchText)}
              style={{ width: 80, height: 32, backgroundColor: '#ff4d4f', borderColor: '#ff4d4f', color: '#fff' }}
            >
              搜索
            </Button>
          </Col>
        </Row>
      </div>

      {/* 表格区域 */}
      <div className="tableContainer">
        <Table
          columns={columns}
          dataSource={dataSource}
          pagination={false}
          loading={loading}
          rowKey="key"
          scroll={{ y: 500 }}
          locale={{
            emptyText: loading ? <Spin size="small" /> : '暂无积分历史数据'
          }}
        />
      </div>

      {/* 分页区域 */}
      <div className="paginationContainer">
        <Pagination
          current={pagination.current}
          pageSize={pagination.pageSize}
          total={pagination.total}
          onChange={handlePageChange}
          showSizeChanger
          showQuickJumper
          showTotal={(total) => `共${total}条`}
          pageSizeOptions={['10', '20', '50', '100']}
          size="small"
        />
      </div>
    </div>
  );
};

export default PointsHistory;