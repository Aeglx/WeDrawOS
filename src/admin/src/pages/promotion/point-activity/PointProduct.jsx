import React, { useState } from 'react';
import { Button, Input, Select, Table, Row, Col } from 'antd';
import { useNavigate } from 'react-router-dom';
import { SearchOutlined } from '@ant-design/icons';

const { Option } = Select;

const PointProduct = () => {
  const navigate = useNavigate();
  // 搜索参数状态
  const [searchParams, setSearchParams] = useState({
    productName: '',
    pointStart: '',
    pointEnd: '',
    status: '',
    skuCode: ''
  });
  
  // 当前选中的标签状态
  const [activeTab, setActiveTab] = useState('all');
  
  // 处理标签点击
  const handleTabClick = (tab) => {
    setActiveTab(tab);
    // 根据标签筛选数据
    console.log('选中标签:', tab);
  };
  
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

  // 处理添加积分商品
  const handleAddPointProduct = () => {
    navigate('/promotion/promotion-manage/point-activity/add-point-product');
  };

  // 处理编辑操作
  const handleEdit = (record) => {
    console.log('编辑商品:', record);
  };

  // 处理删除操作
  const handleDelete = (record) => {
    console.log('删除商品:', record);
  };

  // 处理上下架操作
  const handleStatusChange = (record, status) => {
    console.log('改变状态:', record, status);
  };

  // 表格列配置
  const columns = [
    {
      title: '商品名称',
      dataIndex: 'productName',
      key: 'productName',
      width: 200,
    },
    {
      title: '市场价',
      dataIndex: 'marketPrice',
      key: 'marketPrice',
      width: 100,
    },
    {
      title: '结算价',
      dataIndex: 'settlementPrice',
      key: 'settlementPrice',
      width: 100,
    },
    {
      title: '库存数量',
      dataIndex: 'stockQuantity',
      key: 'stockQuantity',
      width: 100,
    },
    {
      title: '活动剩余库存',
      dataIndex: 'activityStock',
      key: 'activityStock',
      width: 120,
    },
    {
      title: '兑换积分',
      dataIndex: 'exchangePoints',
      key: 'exchangePoints',
      width: 100,
    },
    {
      title: '所属店铺',
      dataIndex: 'shopName',
      key: 'shopName',
      width: 150,
    },
    {
      title: '活动开始时间',
      dataIndex: 'activityStartTime',
      key: 'activityStartTime',
      width: 180,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status) => {
        const statusMap = {
          '0': '未上架',
          '1': '已上架'
        };
        return statusMap[status] || status;
      }
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 100,
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
            onClick={() => handleStatusChange(record, record.status === '0' ? '1' : '0')}
            style={{ padding: 0, marginRight: '8px', color: record.status === '0' ? '#52c41a' : '#ff4d4f' }}
          >
            {record.status === '0' ? '上架' : '下架'}
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
  const mockData = [];

  return (
    <div className="point-product-container">
      {/* 状态标签筛选区域 */}
      <div style={{ marginBottom: '16px', borderBottom: '1px solid #e8e8e8' }}>
        <span 
          onClick={() => handleTabClick('all')}
          style={{
            cursor: 'pointer',
            padding: '8px 16px',
            marginRight: '8px',
            fontSize: '12px',
            color: activeTab === 'all' ? '#ff0000' : '#666',
            borderBottom: activeTab === 'all' ? '2px solid #ff0000' : '2px solid transparent',
            display: 'inline-block'
          }}
        >
          全部
        </span>
        <span 
          onClick={() => handleTabClick('live')}
          style={{
            cursor: 'pointer',
            padding: '8px 16px',
            marginRight: '8px',
            fontSize: '12px',
            color: activeTab === 'live' ? '#ff0000' : '#666',
            borderBottom: activeTab === 'live' ? '2px solid #ff0000' : '2px solid transparent',
            display: 'inline-block'
          }}
        >
          直播中
        </span>
        <span 
          onClick={() => handleTabClick('notStarted')}
          style={{
            cursor: 'pointer',
            padding: '8px 16px',
            marginRight: '8px',
            fontSize: '12px',
            color: activeTab === 'notStarted' ? '#ff0000' : '#666',
            borderBottom: activeTab === 'notStarted' ? '2px solid #ff0000' : '2px solid transparent',
            display: 'inline-block'
          }}
        >
          未开始
        </span>
        <span 
          onClick={() => handleTabClick('ended')}
          style={{
            cursor: 'pointer',
            padding: '8px 16px',
            fontSize: '12px',
            color: activeTab === 'ended' ? '#ff0000' : '#666',
            borderBottom: activeTab === 'ended' ? '2px solid #ff0000' : '2px solid transparent',
            display: 'inline-block'
          }}
        >
          已结束
        </span>
      </div>
      
      {/* 搜索区域 - 积分商品页面样式 */}
      <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginRight: '16px' }}>
          <span style={{ fontSize: '12px', color: '#666666', marginRight: '8px', whiteSpace: 'nowrap' }}>商品名称</span>
          <Input
            placeholder="请输入商品名称"
            value={searchParams.productName}
            onChange={(e) => handleSearchChange('productName', e.target.value)}
            style={{ width: 180, fontSize: '12px', height: 32 }}
            allowClear
          />
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', marginRight: '16px' }}>
          <span style={{ fontSize: '12px', color: '#666666', marginRight: '8px', whiteSpace: 'nowrap' }}>积分区间</span>
          <Input
            placeholder="请输入开始区间"
            value={searchParams.pointStart}
            onChange={(e) => handleSearchChange('pointStart', e.target.value)}
            style={{ width: 120, fontSize: '12px', height: 32, marginRight: '8px' }}
            allowClear
          />
          <span style={{ fontSize: '12px', color: '#666666', marginRight: '8px' }}>-</span>
          <Input
            placeholder="请输入结束区间"
            value={searchParams.pointEnd}
            onChange={(e) => handleSearchChange('pointEnd', e.target.value)}
            style={{ width: 120, fontSize: '12px', height: 32 }}
            allowClear
          />
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', marginRight: '16px' }}>
          <span style={{ fontSize: '12px', color: '#666666', marginRight: '8px', whiteSpace: 'nowrap' }}>状态</span>
          <Select
            placeholder="请选择"
            value={searchParams.status}
            onChange={(value) => handleSearchChange('status', value)}
            style={{ width: 120, fontSize: '12px', height: 32 }}
            allowClear
          >
            <Option value="0">未上架</Option>
            <Option value="1">已上架</Option>
          </Select>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', marginRight: '16px' }}>
          <span style={{ fontSize: '12px', color: '#666666', marginRight: '8px', whiteSpace: 'nowrap' }}>SKU编码</span>
          <Input
            placeholder="请输入SKU编码"
            value={searchParams.skuCode}
            onChange={(e) => handleSearchChange('skuCode', e.target.value)}
            style={{ width: 180, fontSize: '12px', height: 32 }}
            allowClear
          />
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

      {/* 添加积分商品按钮 */}
      <div style={{ marginBottom: '16px' }}>
        <Button 
          type="primary" 
          onClick={handleAddPointProduct}
          style={{ backgroundColor: '#ff0000', borderColor: '#ff0000', fontSize: '12px', height: 32 }}
        >
          添加积分商品
        </Button>
      </div>

      {/* 表格展示区 */}
      <Table
        columns={columns}
        dataSource={mockData}
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

export default PointProduct;