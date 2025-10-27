import React, { useState, useEffect } from 'react';
import { Table, Input, DatePicker, Button, Select, Tag, Space, message, Image } from 'antd';
import { 
  SearchOutlined, 
  EyeOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import './AfterSales.css';

const { RangePicker } = DatePicker;
const { Option } = Select;

// 生成模拟数据
const generateMockAfterSales = (count = 1000) => {
  const afterSales = [];
  const statuses = ['pending', 'approved', 'rejected', 'waiting_receipt', 'confirmed_receipt', 'completed', 'seller_cancelled', 'buyer_cancelled', 'waiting_platform_refund'];
  const types = ['refund', 'return', 'exchange'];
  
  for (let i = 1; i <= count; i++) {
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const type = types[Math.floor(Math.random() * types.length)];
    const applyTime = new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000));
    
    afterSales.push({
      id: `A${20250709}${100000 + i}`,
      orderId: `O${20250709}${100000 + i}`,
      // 模拟商品名称 - 使用更真实的商品名
    productName: getRandomProductName(),
      productId: `19430319466291036${i % 100}`,
      memberId: `19381362481${Math.floor(Math.random() * 100000)}`,
      memberName: Math.random() > 0.5 ? 'LAST' : `用户${Math.floor(Math.random() * 10000)}`,
      shopName: `商家${Math.floor(Math.random() * 100)}的店`,
      amount: Math.random() > 0.5 ? '0.00' : (Math.random() * 10000).toFixed(2),
      type,
      status,
      applyTime: applyTime.toISOString(),
      // 不再使用外部图片服务，使用Ant Design图标代替
  productImage: ''
    });
  }
  
  // 确保至少有一个申请中的售后单
  afterSales[0].status = 'pending';
    afterSales[0].productImage = '';
  
  return afterSales;
};

// 获取售后类型显示文本
const getAfterSaleTypeText = (type) => {
  const typeMap = {
    refund: '退款',
    return: '退货',
    exchange: '换货'
  };
  return typeMap[type] || '未知类型';
};

// 获取售后状态显示文本
const getAfterSaleStatusText = (status) => {
  const statusMap = {
    pending: '申请中',
    approved: '通过售后',
    rejected: '拒绝售后',
    waiting_receipt: '待收货',
    confirmed_receipt: '确认收货',
    completed: '完成售后',
    seller_cancelled: '卖家终止售后',
    buyer_cancelled: '买家取消售后',
    waiting_platform_refund: '等待平台退款'
  };
  return statusMap[status] || '未知状态';
};

// 获取售后状态颜色
const getAfterSaleStatusColor = (status) => {
  const colorMap = {
    pending: 'blue',
    approved: 'green',
    rejected: 'red',
    waiting_receipt: 'orange',
    confirmed_receipt: 'cyan',
    completed: 'success',
    seller_cancelled: 'purple',
    buyer_cancelled: 'default',
    waiting_platform_refund: 'lime'
  };
  return colorMap[status] || 'default';
};

// 生成随机的真实商品名称
const getRandomProductName = () => {
  const productNames = [
    '高级数码绘图板 Wacom Intuos Pro',
    '专业手绘屏 XP-PEN Artist22',
    '绘王 Kamvas Pro 16 绘图屏',
    'Apple iPad Pro 12.9英寸平板电脑',
    'Microsoft Surface Pro 9 二合一笔记本',
    '华为MatePad Pro 11英寸平板电脑',
    '联想小新Pad Pro 平板',
    '三星Galaxy Tab S9 Ultra 平板电脑',
    '索尼WH-1000XM5 无线降噪耳机',
    'Apple AirPods Pro 2 无线降噪耳机',
    '小米真无线蓝牙耳机 Air 3 Pro',
    '森海塞尔 Momentum True Wireless 3',
    '戴森V15 Detect 无绳吸尘器',
    '石头扫地机器人 G10S Pro',
    '科沃斯扫地机器人 X1 OMNI',
    '苹果iPhone 15 Pro Max 手机',
    '三星Galaxy S23 Ultra 手机',
    '华为Mate 60 Pro 手机',
    '小米14 Pro 手机',
    'OPPO Find X6 Pro 手机'
  ];
  return productNames[Math.floor(Math.random() * productNames.length)];
};

const AfterSales = () => {
  const [afterSales, setAfterSales] = useState([]);
  const [filteredAfterSales, setFilteredAfterSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchParams, setSearchParams] = useState({
    memberId: '',
    memberName: '',
    memberNickname: '',
    contact: ''
  });
  const [selectedStatus, setSelectedStatus] = useState('pending');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // 加载售后数据
  const loadAfterSales = () => {
    setLoading(true);
    // 模拟API调用延迟
    setTimeout(() => {
      const mockData = generateMockAfterSales();
      setAfterSales(mockData);
      setFilteredAfterSales(mockData.filter(item => item.status === 'pending'));
      setLoading(false);
    }, 500);
  };

  // 获取筛选后售后单的基础数据（不包含状态筛选部分）
  const getBaseFilteredAfterSales = () => {
    let result = [...afterSales];
    
    // 会员ID搜索
    if (searchParams.memberId) {
      result = result.filter(item => 
        item.memberId.toLowerCase().includes(searchParams.memberId.toLowerCase())
      );
    }
    
    // 会员名称搜索
    if (searchParams.memberName) {
      result = result.filter(item => 
        item.memberName.toLowerCase().includes(searchParams.memberName.toLowerCase())
      );
    }
    
    // 会员昵称搜索
    if (searchParams.memberNickname) {
      // 注意：在实际应用中，这里应该有memberNickname字段，当前数据模型中可能没有
      // 这里做一个简单处理，使用memberName代替
      result = result.filter(item => 
        item.memberName.toLowerCase().includes(searchParams.memberNickname.toLowerCase())
      );
    }
    
    // 联系方式搜索
    if (searchParams.contact) {
      // 注意：在实际应用中，这里应该有联系方式字段，当前数据模型中可能没有
      // 这里做一个简单处理，不进行实际筛选
      console.log('联系方式搜索功能需要数据模型支持');
    }
    
    return result;
  };

  // 筛选售后单 - 支持传入特定状态进行筛选
  const filterAfterSales = (statusToFilter = null) => {
    let result = getBaseFilteredAfterSales();
    
    // 使用传入的状态或当前状态进行筛选
    const status = statusToFilter !== null ? statusToFilter : selectedStatus;
    if (status !== 'all') {
      result = result.filter(item => item.status === status);
    }
    
    setFilteredAfterSales(result);
    setCurrentPage(1);
  };

  // 搜索处理
  const handleSearch = () => {
    filterAfterSales();
  };

  // 重置搜索
  const handleReset = () => {
    setSearchParams({
      memberId: '',
      memberName: '',
      memberNickname: '',
      contact: ''
    });
    setSelectedStatus('all');
    filterAfterSales('all');
  };

  // 查看售后单
  const handleView = (afterSaleId) => {
    message.info(`查看售后单 ${afterSaleId} 详情`);
  };

  // 状态标签切换 - 直接传入新状态到filterAfterSales确保立即使用
  const handleStatusChange = (status) => {
    setSelectedStatus(status);
    filterAfterSales(status);
  };

  // 组件挂载时加载数据
  useEffect(() => {
    loadAfterSales();
  }, []);

  // 表格列配置
  const columns = [
    {
      title: '售后服务单号',
      dataIndex: 'id',
      key: 'id',
      width: 180,
    },
    {
      title: '订单编号',
      dataIndex: 'orderId',
      key: 'orderId',
      width: 150,
    },
    {
      title: '商品',
      key: 'product',
      width: 250,
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* 使用Ant Design图标代替图片 */}
            <div 
              style={{ 
                width: 40, 
                height: 40, 
                backgroundColor: '#f0f0f0',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#999'
              }}
            >
              <FileTextOutlined />
            </div>
          <div style={{ flex: 1 }}>
            <a 
              href="#" 
              onClick={(e) => {
                e.preventDefault();
                // 在实际应用中，这里应该跳转到商品详情页或打开商品详情弹窗
                console.log('查看商品详情:', record.productId, record.productName);
                alert(`查看商品: ${record.productName}\n商品ID: ${record.productId}`);
              }}
              style={{ 
                color: '#1890ff', 
                textDecoration: 'none',
                fontWeight: '500',
                fontSize: '12px',
                display: 'block',
                maxWidth: '200px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
              title={record.productName}
            >
              {record.productName}
            </a>
            <div style={{ fontSize: '12px', color: '#999' }}>商品ID: {record.productId}</div>
          </div>
        </div>
      ),
    },
    {
      title: '会员ID',
      dataIndex: 'memberId',
      key: 'memberId',
      width: 150,
    },
    {
      title: '会员名称',
      dataIndex: 'memberName',
      key: 'memberName',
      width: 120,
    },
    {
      title: '店铺名称',
      dataIndex: 'shopName',
      key: 'shopName',
      width: 120,
    },
    {
      title: '售后金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 100,
      render: (text) => `¥${text}`,
    },
    {
      title: '售后类型',
      dataIndex: 'type',
      key: 'type',
      width: 80,
      render: (text) => (
        <Tag color="orange">
          {getAfterSaleTypeText(text)}
        </Tag>
      ),
    },
    {
      title: '售后状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (text) => (
        <Tag color={getAfterSaleStatusColor(text)}>
          {getAfterSaleStatusText(text)}
        </Tag>
      ),
    },
    {
      title: '申请时间',
      dataIndex: 'applyTime',
      key: 'applyTime',
      width: 180,
      render: (text) => new Date(text).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_, record) => (
        <Space size="middle">
          <Button 
            type="link" 
            icon={<EyeOutlined />} 
            onClick={() => handleView(record.id)}
            style={{ color: '#1890ff' }}
          >
            查看
          </Button>
        </Space>
      ),
    },
  ];

  // 状态标签配置 - 基于当前搜索条件（不含状态筛选）计算数量
  const baseFilteredAfterSales = getBaseFilteredAfterSales();
  const statusTabs = [
    { key: 'all', label: '全部', count: baseFilteredAfterSales.length },
    { key: 'pending', label: '申请售后', count: baseFilteredAfterSales.filter(o => o.status === 'pending').length },
    { key: 'approved', label: '通过售后', count: baseFilteredAfterSales.filter(o => o.status === 'approved').length },
    { key: 'rejected', label: '拒绝售后', count: baseFilteredAfterSales.filter(o => o.status === 'rejected').length },
    { key: 'waiting_receipt', label: '待收货', count: baseFilteredAfterSales.filter(o => o.status === 'waiting_receipt').length },
    { key: 'confirmed_receipt', label: '确认收货', count: baseFilteredAfterSales.filter(o => o.status === 'confirmed_receipt').length },
    { key: 'completed', label: '完成售后', count: baseFilteredAfterSales.filter(o => o.status === 'completed').length },
    { key: 'seller_cancelled', label: '卖家终止售后', count: baseFilteredAfterSales.filter(o => o.status === 'seller_cancelled').length },
    { key: 'buyer_cancelled', label: '买家取消售后', count: baseFilteredAfterSales.filter(o => o.status === 'buyer_cancelled').length },
    { key: 'waiting_platform_refund', label: '等待平台退款', count: baseFilteredAfterSales.filter(o => o.status === 'waiting_platform_refund').length },
  ];

  // 计算分页数据
  const paginatedAfterSales = filteredAfterSales.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="after-sales-container">
      <div className="search-section" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: '16px', padding: '16px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
        <div className="search-item" style={{ flex: '1', minWidth: '200px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>会员ID</label>
          <Input
            placeholder="请输入会员ID"
            value={searchParams.memberId}
            onChange={(e) => setSearchParams({ ...searchParams, memberId: e.target.value })}
            onPressEnter={handleSearch}
          />
        </div>
        <div className="search-item" style={{ flex: '1', minWidth: '200px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>会员名称</label>
          <Input
            placeholder="请输入会员名称"
            value={searchParams.memberName}
            onChange={(e) => setSearchParams({ ...searchParams, memberName: e.target.value })}
            onPressEnter={handleSearch}
          />
        </div>
        <div className="search-item" style={{ flex: '1', minWidth: '200px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>会员昵称</label>
          <Input
            placeholder="请输入会员昵称"
            value={searchParams.memberNickname}
            onChange={(e) => setSearchParams({ ...searchParams, memberNickname: e.target.value })}
            onPressEnter={handleSearch}
          />
        </div>
        <div className="search-item" style={{ flex: '1', minWidth: '200px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>联系方式</label>
          <Input
            placeholder="请输入会员联系方式"
            value={searchParams.contact}
            onChange={(e) => setSearchParams({ ...searchParams, contact: e.target.value })}
            onPressEnter={handleSearch}
          />
        </div>
        <div className="search-actions" style={{ paddingBottom: '0' }}>
          <Button 
            type="primary" 
            icon={<SearchOutlined />} 
            onClick={handleSearch}
            style={{ backgroundColor: '#ff4d4f', borderColor: '#ff4d4f' }}
          >
            搜索
          </Button>
        </div>
        {/* 添加媒体查询样式，确保在小屏幕上自动换行 */}
        <style>{`
          @media (max-width: 1024px) {
            .search-item {
              flex: 0 0 45%;
              min-width: unset;
            }
          }
          
          @media (max-width: 768px) {
            .search-item {
              flex: 0 0 100%;
            }
          }
        `}</style>
      </div>

      <div className="status-tabs">
        {statusTabs.map(tab => (
          <div
            key={tab.key}
            className={`status-tab ${selectedStatus === tab.key ? 'active' : ''}`}
            onClick={() => handleStatusChange(tab.key)}
          >
            <span>{tab.label}</span>
            <span className="tab-count">({tab.count})</span>
          </div>
        ))}
      </div>

      <div className="after-sales-list">
        <Table
          columns={columns}
          dataSource={paginatedAfterSales}
          rowKey="id"
          loading={loading}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: filteredAfterSales.length,
            onChange: (page, size) => {
              setCurrentPage(page);
              setPageSize(size);
            },
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条数据`,
          }}
          scroll={{ x: 'max-content' }}
        />
      </div>
    </div>
  );
};

export default AfterSales;