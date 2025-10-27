import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Space, Select, message, Checkbox, Row, Col } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import './ProductList.css';

const { Option } = Select;
const { Search } = Input;

const ProductList = () => {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  // 搜索参数状态
  const [searchParams, setSearchParams] = useState({
    productName: '',
    productCode: '',
    shopName: '',
    salesMode: '',
    productType: ''
  });

  // 生成模拟数据
  const generateMockProducts = () => {
    const productStatuses = ['待审核', '审核未通过', '上架', '下架'];
    const salesModes = ['零售'];
    const productTypes = ['实物商品'];
    const auditStatuses = ['待审核', '审核通过', '审核未通过'];
    
    const mockProducts = [];
    for (let i = 0; i < 4; i++) {
      const id = 190000000000000000 + Math.floor(Math.random() * 10000000000000000);
      mockProducts.push({
        id: id.toString(),
        productId: id.toString(),
        name: ['测试商品', '11', 'test', '王只松鼠-手撕面包1kg整箱 休闲零食蛋糕'][i],
        price: [1.00, 22.00, 11.00, 299.00][i],
        stock: [4, 6, 1, 6][i],
        sales: [0, 0, 0, 39][i],
        salesMode: salesModes[0],
        productType: productTypes[0],
        status: '上架',
        auditStatus: '待审核',
        image: i === 0 ? 'https://picsum.photos/seed/product1/40/40' : 
               i === 1 ? 'https://picsum.photos/seed/product2/40/40' :
               i === 2 ? 'https://picsum.photos/seed/product3/40/40' :
               'https://picsum.photos/seed/product4/40/40'
      });
    }
    return mockProducts;
  };

  // 加载商品列表
  const loadProducts = async () => {
    setLoading(true);
    try {
      // 模拟API请求延迟
      await new Promise(resolve => setTimeout(resolve, 500));
      const mockProducts = generateMockProducts();
      setProducts(mockProducts);
    } catch (error) {
      console.error('Load products error:', error);
      message.error('加载商品列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // 处理搜索
  const handleSearch = () => {
    message.info('搜索功能开发中');
    // 这里可以实现搜索逻辑
  };

  // 处理批量操作
  const handleBatchOperation = (type) => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择商品');
      return;
    }
    
    switch (type) {
      case 'shelf':
        message.success(`已将选中的${selectedRowKeys.length}个商品上架`);
        break;
      case 'unshelf':
        message.success(`已将选中的${selectedRowKeys.length}个商品下架`);
        break;
      case 'audit':
        message.success(`已将选中的${selectedRowKeys.length}个商品提交审核`);
        break;
      default:
        break;
    }
    setSelectedRowKeys([]);
  };

  // 处理审核操作
  const handleAudit = (record) => {
    message.info(`审核商品 ${record.name}`);
  };

  // 处理查看操作
  const handleView = (record) => {
    message.info(`查看商品 ${record.name}`);
  };

  // 处理标签切换
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    // 这里可以根据标签筛选商品
  };

  // 表格列配置
  const columns = [
    {
      title: '',
      dataIndex: 'checkbox',
      key: 'checkbox',
      width: 40,
      render: (_, record) => (
        <Checkbox 
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedRowKeys([...selectedRowKeys, record.productId]);
            } else {
              setSelectedRowKeys(selectedRowKeys.filter(id => id !== record.productId));
            }
          }}
        />
      )
    },
    {
      title: '商品ID',
      dataIndex: 'productId',
      key: 'productId',
      width: 150
    },
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
      dataIndex: 'name',
      key: 'name',
      ellipsis: true
    },
    {
      title: '价格',
      dataIndex: 'price',
      key: 'price',
      width: 100,
      render: (price) => <span style={{ color: '#ff4d4f' }}>¥{price.toFixed(2)}</span>
    },
    {
      title: '销量',
      dataIndex: 'sales',
      key: 'sales',
      width: 80
    },
    {
      title: '库存',
      dataIndex: 'stock',
      key: 'stock',
      width: 80
    },
    {      title: '销售模式',      dataIndex: 'salesMode',      key: 'salesMode',      width: 80,      render: (mode) => <span style={{ padding: '2px 8px', backgroundColor: '#fff2e8', color: '#fa8c16', borderRadius: '2px', fontSize: '12px', display: 'inline-block' }}>{mode}</span>    },    {      title: '商品类型',      dataIndex: 'productType',      key: 'productType',      width: 100,      render: (type) => <span style={{ padding: '2px 8px', backgroundColor: '#f6ffed', color: '#52c41a', borderRadius: '2px', fontSize: '12px', display: 'inline-block' }}>{type}</span>    },    {      title: '状态',      dataIndex: 'status',      key: 'status',      width: 80,      render: (status) => <span style={{ padding: '2px 8px', backgroundColor: '#f6ffed', color: '#52c41a', borderRadius: '2px', fontSize: '12px', display: 'inline-block' }}>{status}</span>    },    {      title: '审核状态',      dataIndex: 'auditStatus',      key: 'auditStatus',      width: 100,      render: (status) => <span style={{ padding: '2px 8px', backgroundColor: '#fff2e8', color: '#fa8c16', borderRadius: '2px', fontSize: '12px', display: 'inline-block' }}>{status}</span>    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Space size="middle">
          <Button type="link" onClick={() => handleAudit(record)}>审核</Button>
          <Button type="link" onClick={() => handleView(record)}>查看</Button>
        </Space>
      )
    }
  ];

  return (
    <div className="product-list">
      {/* 搜索区域 - 严格按照参考截图样式，使用Row和Col实现响应式布局 */}
      <div className="search-area" style={{ padding: '20px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: '24px' }}>
        <Row gutter={24} align="middle" wrap>
          <Col>
            <span style={{ marginRight: '8px', color: '#666' }}>商品名称</span>
            <Input 
              placeholder="请输入商品名称" 
              value={searchParams.productName}
              onChange={(e) => setSearchParams({...searchParams, productName: e.target.value})}
              style={{ width: 180, height: 32, fontSize: '14px' }}
            />
          </Col>
          <Col>
            <span style={{ marginRight: '8px', color: '#666' }}>商品编号</span>
            <Input 
              placeholder="请输入商品编号" 
              value={searchParams.productCode}
              onChange={(e) => setSearchParams({...searchParams, productCode: e.target.value})}
              style={{ width: 150, height: 28 }}
            />
          </Col>
          <Col>
            <span style={{ marginRight: '8px', color: '#666' }}>店铺名称</span>
            <Input 
              placeholder="请输入店铺名称" 
              value={searchParams.shopName}
              onChange={(e) => setSearchParams({...searchParams, shopName: e.target.value})}
              style={{ width: 150, height: 28 }}
            />
          </Col>
          <Col>
            <span style={{ marginRight: '8px', color: '#666' }}>销售模式</span>
            <Select 
              placeholder="全部" 
              style={{ width: 120, height: 32, fontSize: '14px' }}
              value={searchParams.salesMode}
              onChange={(value) => setSearchParams({...searchParams, salesMode: value})}
            >
              <Option value="">全部</Option>
              <Option value="retail">零售</Option>
              <Option value="wholesale">批发</Option>
            </Select>
          </Col>
          <Col>
            <span style={{ marginRight: '8px', color: '#666' }}>商品类型</span>
            <Select 
              placeholder="全部" 
              style={{ width: 120, height: 28 }}
              value={searchParams.productType}
              onChange={(value) => setSearchParams({...searchParams, productType: value})}
            >
              <Option value="">全部</Option>
              <Option value="physical">实物商品</Option>
              <Option value="digital">虚拟商品</Option>
            </Select>
          </Col>
          <Col>
            <Button 
              type="primary" 
              icon={<SearchOutlined />} 
              onClick={handleSearch}
              style={{ backgroundColor: '#ff0000', borderColor: '#ff0000', color: '#ffffff', marginRight: 8, height: 32, padding: '0 16px', fontSize: '14px', fontWeight: '500' }}
            >
              搜索
            </Button>
            <Button 
              onClick={() => setSearchParams({ productName: '', productCode: '', shopName: '', salesMode: '', productType: '' })}
              style={{ height: 32, padding: '0 16px', fontSize: '14px' }}
            >
              重置
            </Button>
          </Col>
        </Row>
      </div>

      {/* 状态标签区域 */}
      <div className="status-tabs">
        <div 
          className={`status-tab ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => handleTabChange('all')}
        >
          全部
        </div>
        <div 
          className={`status-tab ${activeTab === 'selling' ? 'active' : ''}`}
          onClick={() => handleTabChange('selling')}
        >
          出售中(17580)
        </div>
        <div 
          className={`status-tab ${activeTab === 'warehouse' ? 'active' : ''}`}
          onClick={() => handleTabChange('warehouse')}
        >
          仓库中
        </div>
        <div 
          className={`status-tab ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => handleTabChange('pending')}
        >
          待审核(4)
        </div>
        <div 
          className={`status-tab ${activeTab === 'rejected' ? 'active' : ''}`}
          onClick={() => handleTabChange('rejected')}
        >
          审核未通过(809)
        </div>
      </div>

      {/* 批量操作区域 */}
      <div className="batch-operations">
        <Button 
          onClick={() => handleBatchOperation('shelf')}
          disabled={selectedRowKeys.length === 0}
          style={{ marginRight: 8 }}
        >
          批量上架
        </Button>
        <Button 
          onClick={() => handleBatchOperation('unshelf')}
          disabled={selectedRowKeys.length === 0}
          style={{ marginRight: 8 }}
        >
          批量下架
        </Button>
        <Button 
          onClick={() => handleBatchOperation('audit')}
          disabled={selectedRowKeys.length === 0}
        >
          批量审核
        </Button>
      </div>

      {/* 商品表格 */}
      <Table
        columns={columns}
        dataSource={products}
        rowKey="productId"
        loading={loading}
        pagination={{
          pageSize: 20,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条`
        }}
        className="product-table"
      />
    </div>
  );
};

export default ProductList;