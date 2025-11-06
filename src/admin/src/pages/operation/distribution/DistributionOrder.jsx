import React, { useState } from 'react';
import { Card, Input, Button, Table, Row, Col, Select, DatePicker, Modal, message } from 'antd';
import { SearchOutlined, RedoOutlined, EyeOutlined } from '@ant-design/icons';
import './DistributionOrder.css';

const { Option } = Select;
const { RangePicker } = DatePicker;

// 模拟分销订单数据
const mockDistributionOrders = [
  {
    key: '1',
    orderNo: '0202501519759303198712631',
    productImage: 'https://gw.alipayobjects.com/zos/antfincdn/6rmIv1I44H/KDpgvguMpGfqaHPjicRK.svg',
    productName: '11.2',
    distributor: '测试账号 Jason',
    storeName: '京东自营',
    status: '已完成',
    commissionAmount: '¥100.00',
    createTime: '2025-06-01 15:31',
    productPrice: '¥100.00',
    orderAmount: '¥200.00',
    orderStatus: '已完成',
    distributionTime: '2025-06-01 10:30',
    settlementStatus: '已结算'
  },
  {
    key: '2',
    orderNo: '0202501148934629743096344',
    productImage: 'https://gw.alipayobjects.com/zos/antfincdn/9pNnSeOa5V/wecom-todo-logo.svg',
    productName: '小米手环 7 Pro 绿色',
    distributor: '微信用户',
    storeName: '京东自营',
    status: '已完成',
    commissionAmount: '¥20.00',
    createTime: '2025-06-01 14:52',
    productPrice: '¥199.00',
    orderAmount: '¥199.00',
    orderStatus: '已完成',
    distributionTime: '2025-06-01 10:25',
    settlementStatus: '未结算'
  },
  {
    key: '3',
    orderNo: '0202501198104663191891999',
    productImage: 'https://gw.alipayobjects.com/zos/antfincdn/QqlhQpK5Q6/antd-logo.svg',
    productName: '拉梅奇方形碗',
    distributor: '特殊',
    storeName: '京东自营',
    status: '已完成',
    commissionAmount: '¥0.00',
    createTime: '2025-05-31 17:58',
    productPrice: '¥99.00',
    orderAmount: '¥198.00',
    orderStatus: '已完成',
    distributionTime: '2025-05-31 16:30',
    settlementStatus: '已结算'
  },
  {
    key: '4',
    orderNo: '0202501148357784657159355',
    productImage: 'https://gw.alipayobjects.com/zos/antfincdn/6rmIv1I44H/KDpgvguMpGfqaHPjicRK.svg',
    productName: 'PS5主机 slim版 黑色',
    distributor: '微信用户',
    storeName: '京东自营',
    status: '已完成',
    commissionAmount: '¥100.00',
    createTime: '2025-05-31 16:30',
    productPrice: '¥3899.00',
    orderAmount: '¥3899.00',
    orderStatus: '已完成',
    distributionTime: '2025-05-31 15:20',
    settlementStatus: '已结算'
  },
  {
    key: '5',
    orderNo: '0202501194362405099995841',
    productImage: 'https://gw.alipayobjects.com/zos/antfincdn/9pNnSeOa5V/wecom-todo-logo.svg',
    productName: '二手书 20',
    distributor: '微信用户',
    storeName: '阿里巴巴小店',
    status: '已完成',
    commissionAmount: '¥30.00',
    createTime: '2025-05-31 16:36',
    productPrice: '¥50.00',
    orderAmount: '¥100.00',
    orderStatus: '已完成',
    distributionTime: '2025-05-31 14:25',
    settlementStatus: '已结算'
  },
  {
    key: '6',
    orderNo: '0202501198435309912000091',
    productImage: 'https://gw.alipayobjects.com/zos/antfincdn/QqlhQpK5Q6/antd-logo.svg',
    productName: '123 1',
    distributor: '微信用户',
    storeName: '京东自营',
    status: '已完成',
    commissionAmount: '¥10.00',
    createTime: '2025-05-31 16:32',
    productPrice: '¥100.00',
    orderAmount: '¥100.00',
    orderStatus: '已完成',
    distributionTime: '2025-05-31 13:30',
    settlementStatus: '已结算'
  },
  {
    key: '7',
    orderNo: '0202501197545569187654249',
    productImage: 'https://gw.alipayobjects.com/zos/antfincdn/6rmIv1I44H/KDpgvguMpGfqaHPjicRK.svg',
    productName: '毛衣外套 蓝色 L',
    distributor: '微信用户',
    storeName: '京东自营',
    status: '已完成',
    commissionAmount: '¥10.00',
    createTime: '2025-05-31 14:36',
    productPrice: '¥199.00',
    orderAmount: '¥199.00',
    orderStatus: '已完成',
    distributionTime: '2025-05-31 12:45',
    settlementStatus: '已结算'
  },
  {
    key: '8',
    orderNo: '0202501198416480099900577',
    productImage: 'https://gw.alipayobjects.com/zos/antfincdn/9pNnSeOa5V/wecom-todo-logo.svg',
    productName: '二手书 20',
    distributor: 'LAST',
    storeName: '阿里巴巴小店',
    status: '已取消',
    commissionAmount: '¥30.00',
    createTime: '2025-05-30 08:29',
    productPrice: '¥50.00',
    orderAmount: '¥100.00',
    orderStatus: '已取消',
    distributionTime: '2025-05-30 07:30',
    settlementStatus: '未结算'
  },
  {
    key: '9',
    orderNo: '0202501198430597899674061',
    productImage: 'https://gw.alipayobjects.com/zos/antfincdn/QqlhQpK5Q6/antd-logo.svg',
    productName: '二手书 20',
    distributor: 'LAST',
    storeName: '阿里巴巴小店',
    status: '已完成',
    commissionAmount: '¥30.00',
    createTime: '2025-05-30 08:15',
    productPrice: '¥50.00',
    orderAmount: '¥100.00',
    orderStatus: '已完成',
    distributionTime: '2025-05-30 06:45',
    settlementStatus: '未结算'
  },
  {
    key: '10',
    orderNo: '0202501197834777639784081',
    productImage: 'https://gw.alipayobjects.com/zos/antfincdn/6rmIv1I44H/KDpgvguMpGfqaHPjicRK.svg',
    productName: '二手书 20',
    distributor: 'LAST',
    storeName: '阿里巴巴小店',
    status: '已完成',
    commissionAmount: '¥30.00',
    createTime: '2025-05-29 07:15',
    productPrice: '¥50.00',
    orderAmount: '¥100.00',
    orderStatus: '已完成',
    distributionTime: '2025-05-29 06:30',
    settlementStatus: '已结算'
  }
];

const DistributionOrder = () => {
  // 状态管理
  const [distributionOrders, setDistributionOrders] = useState(mockDistributionOrders);
  const [filteredOrders, setFilteredOrders] = useState(mockDistributionOrders);
  const [searchParams, setSearchParams] = useState({
    orderNo: '',
    distributor: '',
    storeName: '',
    orderTime: null,
    status: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);

  // 处理搜索
  const handleSearch = () => {
    let filtered = [...distributionOrders];
    
    // 订单号搜索
    if (searchParams.orderNo) {
      filtered = filtered.filter(order => 
        order.orderNo.includes(searchParams.orderNo)
      );
    }
    
    // 分销商搜索
    if (searchParams.distributor) {
      filtered = filtered.filter(order => 
        order.distributor.toLowerCase().includes(searchParams.distributor.toLowerCase())
      );
    }
    
    // 店铺名称搜索
    if (searchParams.storeName) {
      filtered = filtered.filter(order => 
        order.storeName.toLowerCase().includes(searchParams.storeName.toLowerCase())
      );
    }
    
    // 状态筛选
    if (searchParams.status) {
      filtered = filtered.filter(order => 
        order.status === searchParams.status
      );
    }
    
    // 时间范围筛选
    if (searchParams.orderTime && searchParams.orderTime.length === 2) {
      const startTime = searchParams.orderTime[0].format('YYYY-MM-DD');
      const endTime = searchParams.orderTime[1].format('YYYY-MM-DD');
      
      filtered = filtered.filter(order => {
        const orderDate = order.createTime.split(' ')[0];
        return orderDate >= startTime && orderDate <= endTime;
      });
    }
    
    setFilteredOrders(filtered);
    setCurrentPage(1);
  };

  // 处理重置
  const handleReset = () => {
    setSearchParams({
      orderNo: '',
      distributor: '',
      storeName: '',
      orderTime: null,
      status: ''
    });
    setFilteredOrders(distributionOrders);
    setCurrentPage(1);
  };

  // 处理查看
  const handleView = (record) => {
    setCurrentOrder(record);
    setIsViewModalVisible(true);
  };

  // 处理分页变化
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // 计算分页数据
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // 表格列配置
  const columns = [
    {
      title: '订单编号',
      dataIndex: 'orderNo',
      key: 'orderNo',
      width: 200,
      ellipsis: true
    },
    {
      title: '商品信息',
      dataIndex: 'productImage',
      key: 'productImage',
      width: 250,
      render: (image, record) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <img 
            src={image} 
            alt={record.productName} 
            style={{ width: 40, height: 40, objectFit: 'cover', marginRight: 8 }} 
          />
          <span className="product-name" title={record.productName}>{record.productName}</span>
        </div>
      )
    },
    {
      title: '分销商',
      dataIndex: 'distributor',
      key: 'distributor',
      width: 120
    },
    {
      title: '店铺名称',
      dataIndex: 'storeName',
      key: 'storeName',
      width: 100
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status) => (
        <span className={status === '已完成' ? 'status-completed' : 'status-cancelled'}>
          {status}
        </span>
      )
    },
    {
      title: '佣金金额',
      dataIndex: 'commissionAmount',
      key: 'commissionAmount',
      width: 100,
      render: (amount) => (
        <span className="commission-amount">{amount}</span>
      )
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 150
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_, record) => (
        <Button 
          type="link" 
          icon={<EyeOutlined />}
          onClick={() => handleView(record)}
          style={{ color: '#ff0000' }}
        >
          查看
        </Button>
      )
    }
  ];

  return (
    <div className="distribution-order-container">
      <Card className="distribution-order-card">
        {/* 搜索区域 - 平台商品页面风格 */}
        <div className="search-area">
          <Row gutter={16} align="middle">
            <Col>
              <span style={{ marginRight: '8px', color: '#666' }}>订单编号</span>
              <Input
                placeholder="请输入订单编号"
                value={searchParams.orderNo}
                onChange={(e) => setSearchParams({ ...searchParams, orderNo: e.target.value })}
                onPressEnter={handleSearch}
                style={{ width: 180, height: 32 }}
              />
            </Col>
            <Col>
              <span style={{ marginRight: '8px', color: '#666' }}>分销商</span>
              <Input
                placeholder="请输入分销商名称"
                value={searchParams.distributor}
                onChange={(e) => setSearchParams({ ...searchParams, distributor: e.target.value })}
                onPressEnter={handleSearch}
                style={{ width: 180, height: 32 }}
              />
            </Col>
            <Col>
              <span style={{ marginRight: '8px', color: '#666' }}>店铺名称</span>
              <Select
                placeholder="全部"
                value={searchParams.storeName || undefined}
                onChange={(value) => setSearchParams({ ...searchParams, storeName: value })}
                style={{ width: 180, height: 32 }}
              >
                <Option value="京东自营">京东自营</Option>
                <Option value="阿里巴巴小店">阿里巴巴小店</Option>
              </Select>
            </Col>
            <Col>
              <span style={{ marginRight: '8px', color: '#666' }}>订单时间</span>
              <RangePicker
                value={searchParams.orderTime}
                onChange={(date) => setSearchParams({ ...searchParams, orderTime: date })}
                style={{ height: 32 }}
              />
            </Col>
            <Col>
              <Button 
                type="primary" 
                icon={<SearchOutlined />}
                onClick={handleSearch}
                style={{ 
                  backgroundColor: '#ff0000', 
                  borderColor: '#ff0000',
                  height: 32,
                  fontSize: 12
                }}
              >
                搜索
              </Button>
            </Col>
          </Row>
        </div>

        {/* 表格区域 */}
        <Table
          columns={columns}
          dataSource={paginatedOrders}
          rowKey="key"
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: filteredOrders.length,
            pageSizeOptions: ['10'],
            showSizeChanger: false,
            showTotal: (total) => `共 ${total} 条`,
            onChange: handlePageChange,
            // 自定义分页器，确保与图片一致
            itemRender: (page, type, originalElement) => {
              if (type === 'page') {
                return (
                  <a 
                    href="#" 
                    onClick={(e) => { e.preventDefault(); handlePageChange(page); }}
                    style={{ 
                      margin: '0 4px', 
                      padding: '2px 8px',
                      color: currentPage === page ? '#ff0000' : '#333',
                      border: currentPage === page ? '1px solid #ff0000' : '1px solid #d9d9d9',
                      borderRadius: '2px'
                    }}
                  >
                    {page}
                  </a>
                );
              }
              return originalElement;
            }
          }}
          className="distribution-order-table"
        />
      </Card>

      {/* 查看订单详情模态框 */}
      <Modal
        title="订单详情"
        open={isViewModalVisible}
        onCancel={() => setIsViewModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsViewModalVisible(false)}>
            关闭
          </Button>
        ]}
        width={600}
      >
        {currentOrder && (
          <div className="order-detail">
            <div className="detail-section">
              <h3>订单信息</h3>
              <div className="detail-item">
                <span className="detail-label">订单编号：</span>
                <span>{currentOrder.orderNo}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">订单状态：</span>
                <span className={currentOrder.status === '已完成' ? 'status-completed' : 'status-cancelled'}>
                  {currentOrder.status}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">创建时间：</span>
                <span>{currentOrder.createTime}</span>
              </div>
            </div>
            
            <div className="detail-section">
              <h3>商品信息</h3>
              <div style={{ display: 'flex', marginBottom: 12 }}>
                <img 
                  src={currentOrder.productImage} 
                  alt={currentOrder.productName} 
                  style={{ width: 80, height: 80, objectFit: 'cover', marginRight: 16 }} 
                />
                <div>
                  <div className="detail-item">
                    <span className="detail-label">商品名称：</span>
                    <span>{currentOrder.productName}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">商品价格：</span>
                    <span>{currentOrder.productPrice}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">订单金额：</span>
                    <span>{currentOrder.orderAmount}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="detail-section">
              <h3>分销信息</h3>
              <div className="detail-item">
                <span className="detail-label">分销商：</span>
                <span>{currentOrder.distributor}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">店铺名称：</span>
                <span>{currentOrder.storeName}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">分销时间：</span>
                <span>{currentOrder.distributionTime}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">佣金金额：</span>
                <span className="commission-amount" style={{ fontWeight: 'bold' }}>
                  {currentOrder.commissionAmount}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">结算状态：</span>
                <span>{currentOrder.settlementStatus}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DistributionOrder;