import React, { useState } from 'react';
import { Table, Button, Input, Space, Select, Tag, Modal, message } from 'antd';
import { SearchOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import './ProductList.css';

const { Option } = Select;

// 商品审核页面组件
const ProductAudit = () => {
  // 状态管理
  const [searchName, setSearchName] = useState('');
  const [searchId, setSearchId] = useState('');
  const [auditStatus, setAuditStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [auditModalVisible, setAuditModalVisible] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [auditResult, setAuditResult] = useState('');
  const [auditRemark, setAuditRemark] = useState('');

  // 模拟待审核商品数据
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
      status: '待审核',
      auditStatus: '待审核',
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
      status: '待审核',
      auditStatus: '待审核',
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
      status: '审核失败',
      auditStatus: '未通过',
      softCopyright: '空编辑',
      image: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0iI2UxZTFmMiI+CiAgPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMTgiIGZpbGw9Im5vbmUiLz4KICA8dGV4dCB4PSIyMCIgeT0iMjUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+5p2O5o+QPC90ZXh0Pgo8L3N2Zz4='
    }
  ]);

  // 处理搜索
  const handleSearch = () => {
    // 实际项目中这里应该调用API进行搜索
    console.log('搜索条件:', {
      name: searchName,
      id: searchId,
      auditStatus
    });
  };

  // 处理重置
  const handleReset = () => {
    setSearchName('');
    setSearchId('');
    setAuditStatus('');
    setCurrentPage(1);
  };

  // 处理审核操作
  const handleAudit = (record) => {
    setCurrentProduct(record);
    setAuditResult('');
    setAuditRemark('');
    setAuditModalVisible(true);
  };

  // 处理查看操作
  const handleView = (record) => {
    // 实际项目中这里应该跳转到商品详情页
    console.log('查看商品:', record);
  };

  // 处理审核提交
  const handleAuditSubmit = () => {
    if (!auditResult) {
      message.error('请选择审核结果');
      return;
    }
    
    // 实际项目中这里应该调用审核API
    console.log('审核结果:', { productId: currentProduct.id, result: auditResult, remark: auditRemark });
    
    // 关闭弹窗并提示
    setAuditModalVisible(false);
    message.success(`商品${auditResult === 'pass' ? '审核通过' : '审核拒绝'}成功`);
  };

  // 根据审核状态筛选商品
  const getFilteredProducts = () => {
    if (!auditStatus) {
      return products;
    }
    return products.filter(product => product.auditStatus === auditStatus);
  };

  // 渲染状态标签
  const renderStatusTag = (text, type) => {
    let color = '';
    switch (type) {
      case 'saleMode':
        color = text === '套餐' ? 'blue' : 'orange';
        break;
      case 'status':
        color = text === '上架' ? 'green' : text === '待审核' ? 'orange' : 'red';
        break;
      case 'auditStatus':
        color = text === '通过' ? 'green' : text === '待审核' ? 'orange' : 'red';
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
      width: 150,
      render: (_, record) => (
        <Space size="middle" style={{ fontSize: '12px' }}>
          {record.auditStatus !== '通过' && (
            <a href="#" style={{ color: '#1890ff', fontSize: '12px' }} onClick={() => handleAudit(record)}>审核</a>
          )}
          <a href="#" style={{ color: '#1890ff', fontSize: '12px' }} onClick={() => handleView(record)}>查看</a>
        </Space>
      ),
    },
  ];

  return (
    <div className="product-audit">
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
            <span style={{ fontSize: '12px', color: '#666666', marginRight: '8px', width: '80px', display: 'inline-block', whiteSpace: 'nowrap' }}>审核状态</span>
            <Select
              placeholder="请选择审核状态"
              value={auditStatus}
              onChange={setAuditStatus}
              allowClear
              style={{ width: 180, fontSize: '12px', height: 32 }}
            >
              <Option value="待审核">待审核</Option>
              <Option value="通过">通过</Option>
              <Option value="未通过">未通过</Option>
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

      {/* 审核弹窗 */}
      <Modal
        title="商品审核"
        open={auditModalVisible}
        onOk={handleAuditSubmit}
        onCancel={() => setAuditModalVisible(false)}
        okText="提交"
        cancelText="取消"
        width={600}
      >
        {currentProduct && (
          <div>
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ marginBottom: '10px', fontSize: '14px' }}>商品信息</h4>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                <img 
                  src={currentProduct.image} 
                  alt={currentProduct.name} 
                  style={{ width: 80, height: 80, marginRight: '16px' }}
                />
                <div>
                  <div style={{ fontSize: '14px', marginBottom: '8px' }}>{currentProduct.name}</div>
                  <div style={{ fontSize: '12px', color: '#666' }}>商品ID: {currentProduct.productId}</div>
                </div>
              </div>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ marginBottom: '10px', fontSize: '14px' }}>审核结果</h4>
              <Space>
                <Button 
                  type={auditResult === 'pass' ? 'primary' : 'default'}
                  icon={<CheckCircleOutlined />}
                  onClick={() => setAuditResult('pass')}
                >
                  审核通过
                </Button>
                <Button 
                  type={auditResult === 'reject' ? 'primary' : 'default'}
                  icon={<CloseCircleOutlined />}
                  onClick={() => setAuditResult('reject')}
                  danger={auditResult === 'reject'}
                >
                  审核拒绝
                </Button>
              </Space>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ marginBottom: '10px', fontSize: '14px' }}>审核备注</h4>
              <Input.TextArea
                rows={4}
                value={auditRemark}
                onChange={(e) => setAuditRemark(e.target.value)}
                placeholder={auditResult === 'reject' ? '请填写拒绝原因' : '请填写审核备注（可选）'}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ProductAudit;