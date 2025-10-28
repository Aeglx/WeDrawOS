import React, { useState } from 'react';
import { Table, Button, Input, Space, Select, Tag } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import './ProductList.css';

const { Option } = Select;

// 商品列表页面组件
const ProductList = () => {
  // 状态管理
  const [searchName, setSearchName] = useState('');
  const [searchId, setSearchId] = useState('');
  const [searchPrice, setSearchPrice] = useState('');
  const [saleMode, setSaleMode] = useState('');
  const [productStatus, setProductStatus] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  // 模拟商品数据
  const [products] = useState([
    {
      id: '1',
      productId: '1067624538407650560',
      name: '测试模板',
      price: '100.00',
      sales: 0,
      stock: 4,
      saleMode: '套餐',
      productType: '实物商品',
      status: '上架',
      auditStatus: '通过',
      softCopyright: '空编辑',
      image: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0iI2UxZTFmMiI+CiAgPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMTgiIGZpbGw9Im5vbmUiLz4KICA8dGV4dCB4PSIyMCIgeT0iMjUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+5p2O5o+QPC90ZXh0Pgo8L3N2Zz4='
    },
    {
      id: '2',
      productId: '1187242602596427789',
      name: '11',
      price: '22.00',
      sales: 0,
      stock: 5,
      saleMode: '零售',
      productType: '实物商品',
      status: '上架',
      auditStatus: '通过',
      softCopyright: '空编辑',
      image: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0iI2UxZTFmMiI+CiAgPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMTgiIGZpbGw9Im5vbmUiLz4KICA8dGV4dCB4PSIyMCIgeT0iMjUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+5p2O5o+QPC90ZXh0Pgo8L3N2Zz4='
    },
    {
      id: '3',
      productId: '1186712581066297345',
      name: '4模板',
      price: '100.00',
      sales: 0,
      stock: 500,
      saleMode: '套餐',
      productType: '实物商品',
      status: '上架',
      auditStatus: '通过',
      softCopyright: '空编辑',
      image: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0iI2UxZTFmMiI+CiAgPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMTgiIGZpbGw9Im5vbmUiLz4KICA8dGV4dCB4PSIyMCIgeT0iMjUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+5p2O5o+QPC90ZXh0Pgo8L3N2Zz4='
    },
    {
      id: '4',
      productId: '1186608629341247490',
      name: 'test',
      price: '11.00',
      sales: 0,
      stock: 1,
      saleMode: '零售',
      productType: '实物商品',
      status: '上架',
      auditStatus: '通过',
      softCopyright: '空编辑',
      image: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0iI2UxZTFmMiI+CiAgPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMTgiIGZpbGw9Im5vbmUiLz4KICA8dGV4dCB4PSIyMCIgeT0iMjUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+5p2O5o+QPC90ZXh0Pgo8L3N2Zz4='
    },
    {
      id: '5',
      productId: '1081732964981130246',
      name: 'aaa',
      price: '22.00',
      sales: 0,
      stock: 1,
      saleMode: '套餐',
      productType: '实物商品',
      status: '上架',
      auditStatus: '通过',
      softCopyright: '空编辑',
      image: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0iI2UxZTFmMiI+CiAgPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMTgiIGZpbGw9Im5vbmUiLz4KICA8dGV4dCB4PSIyMCIgeT0iMjUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+5p2O5o+QPC90ZXh0Pgo8L3N2Zz4='
    },
    {
      id: '6',
      productId: '1186124850711131904',
      name: 'ver',
      price: '23.00',
      sales: 0,
      stock: 230,
      saleMode: '零售',
      productType: '虚拟商品',
      status: '上架',
      auditStatus: '通过',
      softCopyright: '空编辑',
      image: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0iI2UxZTFmMiI+CiAgPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMTgiIGZpbGw9Im5vbmUiLz4KICA8dGV4dCB4PSIyMCIgeT0iMjUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+5p2O5o+QPC90ZXh0Pgo8L3N2Zz4='
    },
    {
      id: '7',
      productId: '1186120530330160128',
      name: 'aaaas999',
      price: '1.00',
      sales: 0,
      stock: 2,
      saleMode: '套餐',
      productType: '实物商品',
      status: '下架',
      auditStatus: '通过',
      softCopyright: '空编辑',
      image: 'https://via.placeholder.com/40'
    },
    {
      id: '8',
      productId: '1185119435905832123',
      name: '小小礼包',
      price: '100.00',
      sales: 0,
      stock: 29,
      saleMode: '套餐',
      productType: '实物商品',
      status: '上架',
      auditStatus: '通过',
      softCopyright: '空编辑',
      image: 'https://via.placeholder.com/40'
    }
  ]);

  // 处理搜索
  const handleSearch = () => {
    // 实际项目中这里应该调用API进行搜索
    console.log('搜索条件:', {
      name: searchName,
      id: searchId,
      price: searchPrice,
      saleMode,
      productStatus
    });
  };

  // 处理重置
  const handleReset = () => {
    setSearchName('');
    setSearchId('');
    setSearchPrice('');
    setSaleMode('');
    setProductStatus('');
    setCurrentPage(1);
  };

  // 处理下架操作
  const handleOffline = (record) => {
    // 实际项目中这里应该调用下架API
    console.log('下架商品:', record);
  };

  // 处理查看操作
  const handleView = (record) => {
    // 实际项目中这里应该跳转到商品详情页
    console.log('查看商品:', record);
  };

  // 处理标签页切换
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  // 根据标签页筛选商品
  const getFilteredProducts = () => {
    switch (activeTab) {
      case 'online':
        return products.filter(product => product.status === '上架');
      case 'offline':
        return products.filter(product => product.status === '下架');
      case 'unaudited':
        return products.filter(product => product.auditStatus !== '通过');
      case 'all':
      default:
        return products;
    }
  };

  // 渲染状态标签
  const renderStatusTag = (text, type) => {
    let color = '';
    switch (type) {
      case 'saleMode':
        color = text === '套餐' ? 'blue' : 'orange';
        break;
      case 'status':
        color = text === '上架' ? 'green' : 'red';
        break;
      case 'auditStatus':
        color = 'green';
        break;
      default:
        color = 'blue';
    }
    return <Tag color={color} style={{ fontSize: '12px', padding: '2px 8px' }}>{text}</Tag>;
  };

  // 表格列配置
  const columns = [
    {
      title: '商品ID',
      dataIndex: 'productId',
      key: 'productId',
      width: 180,
    },
    {
      title: '商品图片',
      dataIndex: 'image',
      key: 'image',
      width: 60,
      render: (image) => <img src={image} alt="商品图片" style={{ width: 40, height: 40 }} />
    },
    {
      title: '商品名称',
      dataIndex: 'name',
      key: 'name',
      width: 120,
      ellipsis: true,
    },
    {
      title: '价格',
      dataIndex: 'price',
      key: 'price',
      width: 80,
      render: (price) => <span style={{ color: '#ff0000', fontSize: '12px' }}>¥{price}</span>
    },
    {
      title: '销量',
      dataIndex: 'sales',
      key: 'sales',
      width: 60,
    },
    {
      title: '库存',
      dataIndex: 'stock',
      key: 'stock',
      width: 60,
    },
    {
      title: '销售模式',
      dataIndex: 'saleMode',
      key: 'saleMode',
      width: 80,
      render: (mode) => renderStatusTag(mode, 'saleMode')
    },
    {
      title: '商品类型',
      dataIndex: 'productType',
      key: 'productType',
      width: 100,
      render: (type) => renderStatusTag(type, 'productType')
    },
    {
      title: '软著',
      dataIndex: 'softCopyright',
      key: 'softCopyright',
      width: 80,
    },
    {
      title: '审核状态',
      dataIndex: 'auditStatus',
      key: 'auditStatus',
      width: 80,
      render: (status) => renderStatusTag(status, 'auditStatus')
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 60,
      render: (status) => renderStatusTag(status, 'status')
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Space size={[0, 12]} style={{ fontSize: '12px' }}>
          <a href="#" style={{ color: '#ff0000', fontSize: '12px' }} onClick={() => handleOffline(record)}>下架</a>
          <a href="#" style={{ color: '#1890ff', fontSize: '12px' }} onClick={() => handleView(record)}>查看</a>
        </Space>
      ),
    },
  ];

  return (
    <div className="product-list">
      {/* 搜索区域 */}
      <div className="search-area">
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#666666', marginRight: '8px', width: '80px', display: 'inline-block', whiteSpace: 'nowrap' }}>商品名称</span>
            <Input
              placeholder="请输入商品名称"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              style={{ width: 180, fontSize: '12px', height: 32 }}
              allowClear
            />
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#666666', marginRight: '8px', width: '80px', display: 'inline-block', whiteSpace: 'nowrap' }}>商品编号</span>
            <Input
              placeholder="请输入商品编号"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              style={{ width: 180, fontSize: '12px', height: 32 }}
              allowClear
            />
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#666666', marginRight: '8px', width: '80px', display: 'inline-block', whiteSpace: 'nowrap' }}>测试价格</span>
            <Input
              placeholder="请输入测试价格"
              value={searchPrice}
              onChange={(e) => setSearchPrice(e.target.value)}
              style={{ width: 180, fontSize: '12px', height: 32 }}
              allowClear
            />
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#666666', marginRight: '8px', width: '80px', display: 'inline-block', whiteSpace: 'nowrap' }}>销售模式</span>
            <Select
              placeholder="请选择销售模式"
              value={saleMode}
              onChange={setSaleMode}
              allowClear
              style={{ width: 180, fontSize: '12px', height: 32 }}
            >
              <Option value="零售">零售</Option>
              <Option value="套餐">套餐</Option>
            </Select>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#666666', marginRight: '8px', width: '80px', display: 'inline-block', whiteSpace: 'nowrap' }}>商品状态</span>
            <Select
              placeholder="请选择商品状态"
              value={productStatus}
              onChange={setProductStatus}
              allowClear
              style={{ width: 180, fontSize: '12px', height: 32 }}
            >
              <Option value="上架">上架</Option>
              <Option value="下架">下架</Option>
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

      {/* 标签页 - 动态显示商品数量 */}
      <div style={{ marginBottom: '16px', borderBottom: '1px solid #e8e8e8' }}>
        <Space size={0} style={{ fontSize: '12px' }}>
          <a 
            href="#" 
            onClick={() => handleTabChange('all')}
            style={{
              padding: '8px 16px',
              borderBottom: activeTab === 'all' ? '2px solid #ff0000' : '2px solid transparent',
              color: activeTab === 'all' ? '#ff0000' : '#666666',
              marginRight: '0',
              display: 'inline-block',
              fontSize: '12px'
            }}
          >
            全部({products.length})
          </a>
          <a 
            href="#" 
            onClick={() => handleTabChange('online')}
            style={{
              padding: '8px 16px',
              borderBottom: activeTab === 'online' ? '2px solid #ff0000' : '2px solid transparent',
              color: activeTab === 'online' ? '#ff0000' : '#666666',
              marginRight: '0',
              display: 'inline-block',
              fontSize: '12px'
            }}
          >
            出售中({products.filter(product => product.status === '上架').length})
          </a>
          <a 
            href="#" 
            onClick={() => handleTabChange('offline')}
            style={{
              padding: '8px 16px',
              borderBottom: activeTab === 'offline' ? '2px solid #ff0000' : '2px solid transparent',
              color: activeTab === 'offline' ? '#ff0000' : '#666666',
              marginRight: '0',
              display: 'inline-block',
              fontSize: '12px'
            }}
          >
            仓库中({products.filter(product => product.status === '下架').length})
          </a>
          <a 
            href="#" 
            onClick={() => handleTabChange('unaudited')}
            style={{
              padding: '8px 16px',
              borderBottom: activeTab === 'unaudited' ? '2px solid #ff0000' : '2px solid transparent',
              color: activeTab === 'unaudited' ? '#ff0000' : '#666666',
              marginRight: '0',
              display: 'inline-block',
              fontSize: '12px'
            }}
          >
            审核未通过({products.filter(product => product.auditStatus !== '通过').length})
          </a>
        </Space>
      </div>

      {/* 排序按钮 */}
      <div style={{ marginBottom: '16px', fontSize: '12px' }}>
        <Space size={[8, 0]}>
          <a href="#" style={{ color: '#666666', fontSize: '12px' }}>按销量</a>
          <span style={{ color: '#ccc' }}>|</span>
          <a href="#" style={{ color: '#666666', fontSize: '12px' }}>按库存</a>
        </Space>
      </div>

      {/* 商品表格 */}
      <div className="product-table">
        <Table
          columns={columns}
          dataSource={getFilteredProducts()}
          rowKey="id"
          pagination={false}
          locale={{ emptyText: '暂无数据' }}
          style={{ fontSize: '12px' }}
          className="ant-table"
        />
        
        {/* 分页组件 */}
        <div style={{ margin: '16px 0', textAlign: 'right', fontSize: '12px' }}>
          <span style={{ marginRight: '16px', color: '#666666', fontSize: '12px' }}>共 {getFilteredProducts().length} 条</span>
          <span style={{ marginRight: '8px', fontSize: '12px' }}>上一页</span>
          <span style={{ marginRight: '8px', fontSize: '12px' }}>1</span>
          <span style={{ marginRight: '8px', fontSize: '12px' }}>下一页</span>
          <span style={{ marginRight: '8px', fontSize: '12px' }}>10条/页</span>
          <span style={{ marginRight: '8px', fontSize: '12px' }}>跳至</span>
          <Input 
            type="number" 
            min={1} 
            value={1} 
            onChange={() => {}} 
            style={{ width: 60, height: 28, display: 'inline-block', marginRight: '8px', fontSize: '12px' }}
          />
          <span style={{ fontSize: '12px' }}>页</span>
        </div>
      </div>
    </div>
  );
};

export default ProductList;