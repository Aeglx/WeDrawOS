import React, { useState } from 'react';
import { Button, Input, Select, Table, Card } from 'antd';
import { SearchOutlined, PlusOutlined } from '@ant-design/icons';

const { Option } = Select;

const GroupBuy = () => {
  // 搜索参数状态
  const [searchParams, setSearchParams] = useState({
    name: '',
    status: '',
    minGroup: '',
  });
  
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const totalItems = 100; // 模拟数据总数
  
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
    console.log('添加拼团活动');
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

  // 表格列配置
  const columns = [
    {
      title: '活动名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => {
        const statusConfig = {
          0: { color: '#999', text: '未开始' },
          1: { color: '#52c41a', text: '进行中' },
          2: { color: '#ff4d4f', text: '已结束' },
        };
        const config = statusConfig[status] || { color: '#666', text: status };
        return (
          <span style={{ color: config.color }}>
            {config.text}
          </span>
        );
      },
    },
    {
      title: '所属店铺',
      dataIndex: 'shop',
      key: 'shop',
      width: 150,
      render: () => '全部店铺'
    },
    {
      title: '活动开始时间',
      dataIndex: 'startTime',
      key: 'startTime',
      width: 180,
    },
    {
      title: '活动结束时间',
      dataIndex: 'endTime',
      key: 'endTime',
      width: 180,
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
  const mockGroupBuyData = [];

  return (
    <div className="group-buy-container">
      {/* 搜索区域 */}
      <div style={{ backgroundColor: '#f5f5f5', padding: '16px', borderRadius: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#666666', marginRight: '8px', width: '80px', display: 'inline-block', whiteSpace: 'nowrap' }}>活动名称</span>
            <Input
              placeholder="请输入活动名称"
              value={searchParams.name}
              onChange={(e) => handleSearchChange('name', e.target.value)}
              style={{ width: 180, fontSize: '12px', height: 32 }}
              allowClear
            />
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#666666', marginRight: '8px', width: '80px', display: 'inline-block', whiteSpace: 'nowrap' }}>活动状态</span>
            <Select
              placeholder="请选择活动状态"
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
          
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#666666', marginRight: '8px', width: '80px', display: 'inline-block', whiteSpace: 'nowrap' }}>成团人数</span>
            <Select
              placeholder="请选择成团人数"
              value={searchParams.minGroup}
              onChange={(value) => handleSearchChange('minGroup', value)}
              style={{ width: 180, fontSize: '12px', height: 32 }}
              allowClear
            >
              <Option value="">全部</Option>
              <Option value="2">2人团</Option>
              <Option value="3">3人团</Option>
              <Option value="5">5人团</Option>
              <Option value="10">10人团</Option>
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

      {/* 操作按钮和表格区域 */}
      <div style={{ marginTop: '16px' }}>
        <Button 
          type="primary" 
          onClick={handleAddActivity}
          style={{ backgroundColor: '#ff0000', borderColor: '#ff0000', marginBottom: '16px' }}
        >
          <PlusOutlined /> 添加活动
        </Button>

        {/* 表格展示区 */}
        <Table
          columns={columns}
          dataSource={mockGroupBuyData}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: totalItems,
            onChange: (page) => setCurrentPage(page),
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
            showQuickJumper: true,
            pageSizeOptions: ['10', '20', '50', '100'],
          }}
          rowKey="key"
          scroll={{ x: 'max-content' }}
          locale={{
            emptyText: '暂无数据'
          }}
          bordered
        />
      </div>
    </div>
  );
};

export default GroupBuy;