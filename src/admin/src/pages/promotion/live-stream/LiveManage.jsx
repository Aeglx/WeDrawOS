import React, { useState } from 'react';
import { Button, Input, Select, Table } from 'antd';
import { SearchOutlined, PlusOutlined } from '@ant-design/icons';

const { Option } = Select;

const LiveManage = () => {
  // 搜索参数状态
  const [searchParams, setSearchParams] = useState({
    name: '',
    status: '',
  });
  
  // 当前选中的标签状态
  const [activeTab, setActiveTab] = useState('all');
  
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const totalItems = 0; // 暂无数据时设置为0
  
  // 处理搜索参数变化
  const handleSearchChange = (param, value) => {
    setSearchParams(prev => ({
      ...prev,
      [param]: value
    }));
  };

  // 处理搜索提交
  const handleSearch = () => {
    console.log('搜索参数:', searchParams);
  };

  // 处理添加活动
  const handleAddActivity = () => {
    console.log('添加直播活动');
  };

  // 处理编辑操作
  const handleEdit = (record) => {
    console.log('编辑活动:', record);
  };

  // 处理查看操作
  const handleView = (record) => {
    console.log('查看活动:', record);
  };

  // 处理删除操作
  const handleDelete = (record) => {
    console.log('删除活动:', record);
  };

  // 处理标签点击
  const handleTabClick = (tab) => {
    setActiveTab(tab);
    // 根据标签筛选数据
    console.log('选中标签:', tab);
  };

  // 表格列配置
  const columns = [
    {
      title: '直播活动',
      dataIndex: 'name',
      key: 'name',
      width: 200,
    },
    {
      title: '主播昵称',
      dataIndex: 'anchor',
      key: 'anchor',
      width: 120,
    },
    {
      title: '直播开始时间',
      dataIndex: 'startTime',
      key: 'startTime',
      width: 180,
    },
    {
      title: '直播结束时间',
      dataIndex: 'endTime',
      key: 'endTime',
      width: 180,
    },
    {
      title: '起始观看人数',
      dataIndex: 'viewCount',
      key: 'viewCount',
      width: 120,
    },
    {
      title: '互动情况',
      dataIndex: 'interaction',
      key: 'interaction',
      width: 120,
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <span className="action-buttons">
          <Button 
            type="link" 
            onClick={() => handleEdit(record)}
            style={{ padding: 0, marginRight: '8px', color: '#666' }}
          >
            编辑
          </Button>
          <Button 
            type="link" 
            onClick={() => handleView(record)}
            style={{ padding: 0, marginRight: '8px', color: '#666' }}
          >
            查看
          </Button>
          <Button 
            type="link" 
            onClick={() => handleDelete(record)}
            style={{ padding: 0, color: '#ff4d4f' }}
          >
            删除
          </Button>
        </span>
      ),
    },
  ];

  // 模拟数据
  const mockLiveData = [];

  return (
    <div className="live-manage-container">
      {/* 状态标签筛选区域 */}
      <div style={{ marginBottom: '16px' }}>
        <span 
          onClick={() => handleTabClick('all')}
          style={{
            cursor: 'pointer',
            padding: '4px 12px',
            marginRight: '16px',
            fontSize: '12px',
            color: activeTab === 'all' ? '#ff0000' : '#666',
            borderBottom: activeTab === 'all' ? '2px solid #ff0000' : '2px solid transparent'
          }}
        >
          全部
        </span>
        <span 
          onClick={() => handleTabClick('live')}
          style={{
            cursor: 'pointer',
            padding: '4px 12px',
            marginRight: '16px',
            fontSize: '12px',
            color: activeTab === 'live' ? '#ff0000' : '#666',
            borderBottom: activeTab === 'live' ? '2px solid #ff0000' : '2px solid transparent'
          }}
        >
          直播中
        </span>
        <span 
          onClick={() => handleTabClick('notStarted')}
          style={{
            cursor: 'pointer',
            padding: '4px 12px',
            marginRight: '16px',
            fontSize: '12px',
            color: activeTab === 'notStarted' ? '#ff0000' : '#666',
            borderBottom: activeTab === 'notStarted' ? '2px solid #ff0000' : '2px solid transparent'
          }}
        >
          未开始
        </span>
        <span 
          onClick={() => handleTabClick('ended')}
          style={{
            cursor: 'pointer',
            padding: '4px 12px',
            fontSize: '12px',
            color: activeTab === 'ended' ? '#ff0000' : '#666',
            borderBottom: activeTab === 'ended' ? '2px solid #ff0000' : '2px solid transparent'
          }}
        >
          已结束
        </span>
      </div>

      {/* 搜索区域 */}
      <div style={{ backgroundColor: '#f5f5f5', padding: '16px', borderRadius: '4px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#666666', marginRight: '8px', width: '80px', display: 'inline-block', whiteSpace: 'nowrap' }}>直播活动名称</span>
            <Input
              placeholder="请输入直播活动名称"
              value={searchParams.name}
              onChange={(e) => handleSearchChange('name', e.target.value)}
              style={{ width: 180, fontSize: '12px', height: 32 }}
              allowClear
            />
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#666666', marginRight: '8px', width: '80px', display: 'inline-block', whiteSpace: 'nowrap' }}>直播状态</span>
            <Select
              placeholder="请选择直播状态"
              value={searchParams.status}
              onChange={(value) => handleSearchChange('status', value)}
              style={{ width: 180, fontSize: '12px', height: 32 }}
              allowClear
            >
              <Option value="">全部</Option>
              <Option value="0">未开始</Option>
              <Option value="1">进行中</Option>
              <Option value="2">已结束</Option>
            </Select>
          </div>
          
          <Button 
            type="primary" 
            icon={<SearchOutlined />}
            onClick={handleSearch}
            style={{ height: 32, fontSize: '12px', backgroundColor: '#ff0000', borderColor: '#ff0000' }}
          >
            搜索
          </Button>
        </div>
      </div>

      {/* 表格展示区 */}
      <Table
        columns={columns}
        dataSource={mockLiveData}
        pagination={{
          current: currentPage,
          pageSize: pageSize,
          total: totalItems,
          onChange: (page) => setCurrentPage(page),
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`,
          showQuickJumper: true,
          pageSizeOptions: ['10', '20', '50', '100'],
          style: { textAlign: 'right' }
        }}
        rowKey="key"
        scroll={{ x: 'max-content' }}
        locale={{
          emptyText: '暂无数据'
        }}
        bordered
      />
    </div>
  );
};

export default LiveManage;