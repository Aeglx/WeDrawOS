import React, { useState, useEffect } from 'react';
import { Card, Input, Button, Table, Row, Col, message, Modal } from 'antd';
import { SearchOutlined, RedoOutlined, EyeOutlined } from '@ant-design/icons';
import './DistributionProduct.css';

// 模拟分销商品数据
const mockDistributionProducts = [
  {
    key: '1',
    productName: '苹果AirPods Pro 无线降噪耳机',
    productPrice: '¥1699.00',
    stock: 123,
    addTime: '2025-06-01 11:28',
    status: '已分销',
    totalAmount: '¥300.00',
    image: 'https://gw.alipayobjects.com/zos/antfincdn/6rmIv1I44H/KDpgvguMpGfqaHPjicRK.svg'
  },
  {
    key: '2',
    productName: '小米手环7 Pro C1智能手环',
    productPrice: '¥199.00',
    stock: 1,
    addTime: '2025-06-01 09:47',
    status: '已分销',
    totalAmount: '¥15.00',
    image: 'https://gw.alipayobjects.com/zos/antfincdn/9pNnSeOa5V/wecom-todo-logo.svg'
  },
  {
    key: '3',
    productName: '华为Matebook X Pro 笔记本电脑',
    productPrice: '¥8299.00',
    stock: 42,
    addTime: '2025-06-01 08:43',
    status: '已分销',
    totalAmount: '¥100.00',
    image: 'https://gw.alipayobjects.com/zos/antfincdn/QqlhQpK5Q6/antd-logo.svg'
  },
  {
    key: '4',
    productName: '星巴克咖啡券 电子礼品卡200元',
    productPrice: '¥188.00',
    stock: 100,
    addTime: '2025-05-31 13:40',
    status: '已分销',
    totalAmount: '¥11.00',
    image: 'https://gw.alipayobjects.com/zos/antfincdn/6rmIv1I44H/KDpgvguMpGfqaHPjicRK.svg'
  },
  {
    key: '5',
    productName: '小米13 Pro 骁龙8Gen2手机',
    productPrice: '¥4999.00',
    stock: 1,
    addTime: '2025-05-31 11:08',
    status: '已分销',
    totalAmount: '¥100.00',
    image: 'https://gw.alipayobjects.com/zos/antfincdn/9pNnSeOa5V/wecom-todo-logo.svg'
  },
  {
    key: '6',
    productName: '雅诗兰黛Estee Lauder特润修护肌透精华露',
    productPrice: '¥950.00',
    stock: 1000,
    addTime: '2025-05-30 09:12',
    status: '已分销',
    totalAmount: '¥10.00',
    image: 'https://gw.alipayobjects.com/zos/antfincdn/QqlhQpK5Q6/antd-logo.svg'
  },
  {
    key: '7',
    productName: '11.2',
    productPrice: '¥100.00',
    stock: 1,
    addTime: '2025-05-29 08:43',
    status: '已分销',
    totalAmount: '¥100.00',
    image: 'https://gw.alipayobjects.com/zos/antfincdn/6rmIv1I44H/KDpgvguMpGfqaHPjicRK.svg'
  },
  {
    key: '8',
    productName: 'iPhone 15 Pro Max 256GB手机',
    productPrice: '¥9999.00',
    stock: 50,
    addTime: '2025-05-28 15:22',
    status: '已分销',
    totalAmount: '¥800.00',
    image: 'https://gw.alipayobjects.com/zos/antfincdn/9pNnSeOa5V/wecom-todo-logo.svg'
  }
];

const DistributionProduct = () => {
  // 状态管理
  const [distributionProducts, setDistributionProducts] = useState(mockDistributionProducts);
  const [filteredProducts, setFilteredProducts] = useState(mockDistributionProducts);
  const [searchParams, setSearchParams] = useState({
    productName: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);

  // 处理搜索
  const handleSearch = () => {
    const filtered = distributionProducts.filter(product => 
      product.productName.toLowerCase().includes(searchParams.productName.toLowerCase())
    );
    setFilteredProducts(filtered);
    setCurrentPage(1);
  };

  // 处理重置
  const handleReset = () => {
    setSearchParams({ productName: '' });
    setFilteredProducts(distributionProducts);
    setCurrentPage(1);
  };

  // 处理查看
  const handleView = (record) => {
    setCurrentProduct(record);
    setIsViewModalVisible(true);
  };

  // 处理分页变化
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // 计算分页数据
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // 表格列配置
  const columns = [
    {
      title: '商品图片',
      dataIndex: 'image',
      key: 'image',
      width: 60,
      render: (image) => (
        <img src={image} alt="商品图片" style={{ width: 40, height: 40, objectFit: 'cover' }} />
      )
    },
    {
      title: '商品名称',
      dataIndex: 'productName',
      key: 'productName',
      width: 250,
      ellipsis: true
    },
    {
      title: '商品价格',
      dataIndex: 'productPrice',
      key: 'productPrice',
      width: 100
    },
    {
      title: '库存',
      dataIndex: 'stock',
      key: 'stock',
      width: 80
    },
    {
      title: '添加时间',
      dataIndex: 'addTime',
      key: 'addTime',
      width: 150
    },
    {
      title: '分销状态',
      dataIndex: 'status',
      key: 'status',
      width: 100
    },
    {
      title: '佣金金额',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 100
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
    <div className="distribution-product-container">
      <Card className="distribution-product-card">
        {/* 搜索区域 - 平台商品页面风格 */}
        <div className="search-area">
          <Row gutter={16} align="middle">
            <Col>
              <span style={{ marginRight: '8px', color: '#666' }}>商品名称</span>
              <Input
                placeholder="请输入商品名称"
                value={searchParams.productName}
                onChange={(e) => setSearchParams({ ...searchParams, productName: e.target.value })}
                onPressEnter={handleSearch}
                style={{ width: 180, height: 32 }}
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
                查询
              </Button>
              <Button 
                icon={<RedoOutlined />}
                onClick={handleReset}
                style={{ 
                  marginLeft: 8,
                  height: 32,
                  fontSize: 12
                }}
              >
                重置
              </Button>
            </Col>
          </Row>
        </div>

        {/* 表格区域 */}
        <Table
          columns={columns}
          dataSource={paginatedProducts}
          rowKey="key"
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: filteredProducts.length,
            pageSizeOptions: ['10'],
            showSizeChanger: false,
            showTotal: (total) => `共 ${total} 条`,
            onChange: handlePageChange
          }}
          className="distribution-product-table"
        />
      </Card>

      {/* 查看商品详情模态框 */}
      <Modal
        title="商品详情"
        open={isViewModalVisible}
        onCancel={() => setIsViewModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsViewModalVisible(false)}>
            关闭
          </Button>
        ]}
        width={600}
      >
        {currentProduct && (
          <div className="product-detail">
            <Row gutter={20}>
              <Col span={8}>
                <img 
                  src={currentProduct.image} 
                  alt={currentProduct.productName} 
                  style={{ width: '100%', height: 180, objectFit: 'contain' }}
                />
              </Col>
              <Col span={16}>
                <div className="detail-item">
                  <span className="detail-label">商品名称：</span>
                  <span>{currentProduct.productName}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">商品价格：</span>
                  <span style={{ color: '#ff0000', fontWeight: 'bold' }}>{currentProduct.productPrice}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">库存：</span>
                  <span>{currentProduct.stock}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">添加时间：</span>
                  <span>{currentProduct.addTime}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">分销状态：</span>
                  <span>{currentProduct.status}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">佣金金额：</span>
                  <span style={{ color: '#ff0000', fontWeight: 'bold' }}>{currentProduct.totalAmount}</span>
                </div>
              </Col>
            </Row>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DistributionProduct;