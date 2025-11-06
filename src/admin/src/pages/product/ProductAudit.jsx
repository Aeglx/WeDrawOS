import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Space, Select, Tag, Modal, message } from 'antd';
import { SearchOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { Spin } from 'antd';
import './ProductList.css';

// 导入产品API
const api = {
  // 获取产品列表
  getProducts: async (params) => {
    const response = await fetch(`/api/admin/product/list?${new URLSearchParams(params)}`);
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || '获取产品列表失败');
    }
    return data;
  },
  
  // 审核产品
  auditProduct: async (productId, result, remark) => {
    const response = await fetch(`/api/admin/product/audit/${productId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ result, remark })
    });
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || '审核产品失败');
    }
    return data;
  },
  
  // 获取产品详情
  getProductDetail: async (productId) => {
    const response = await fetch(`/api/admin/product/detail/${productId}`);
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || '获取产品详情失败');
    }
    return data;
  }
};

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
  const [products, setProducts] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [loading, setLoading] = useState(false);

  // 获取产品列表
  const fetchProducts = async (page = 1, refresh = false) => {
    try {
      setLoading(true);
      const result = await api.getProducts({
        name: searchName,
        id: searchId,
        auditStatus,
        page,
        pageSize
      });
      
      // 确保正确处理API返回的数据结构
      setProducts(result.data || []);
      setTotalProducts(result.total || 0);
      if (refresh) {
        setCurrentPage(page);
      }
    } catch (error) {
      console.error('获取产品列表失败:', error);
      message.error(error.message || '获取产品列表失败');
      setProducts([]);
      setTotalProducts(0);
    } finally {
      setLoading(false);
    }
  };

  // 组件挂载时获取数据
  useEffect(() => {
    fetchProducts(currentPage);
  }, []); // 仅在组件挂载时执行一次

  // 处理搜索
  const handleSearch = () => {
    fetchProducts(1, true);
  };

  // 处理重置
  const handleReset = () => {
    setSearchName('');
    setSearchId('');
    setAuditStatus('');
    setCurrentPage(1);
    fetchProducts(1, true);
  };

  // 处理页码变化
  const handlePageChange = (page) => {
    fetchProducts(page, true);
  };

  // 处理审核操作
  const handleAudit = (record) => {
    setCurrentProduct(record);
    setAuditResult('');
    setAuditRemark('');
    setAuditModalVisible(true);
  };

  // 处理查看操作
  const handleView = async (record) => {
    try {
      setLoading(true);
      const result = await api.getProductDetail(record.id);
      console.log('商品详情:', result.data);
      message.success('获取商品详情成功');
    } catch (error) {
      console.error('获取商品详情失败:', error);
      message.error(error.message || '获取商品详情失败');
    } finally {
      setLoading(false);
    }
  };

  // 处理审核提交
  const handleAuditSubmit = async () => {
    if (!auditResult) {
      message.error('请选择审核结果');
      return;
    }
    
    try {
      setLoading(true);
      await api.auditProduct(currentProduct.id, auditResult, auditRemark);
      
      // 关闭弹窗并提示
      setAuditModalVisible(false);
      message.success(`商品${auditResult === 'pass' ? '审核通过' : '审核驳回'}成功`);
      
      // 重新获取产品列表
      fetchProducts(currentPage);
    } catch (error) {
      console.error('审核商品失败:', error);
      message.error(error.message || '审核商品失败');
    } finally {
      setLoading(false);
    }
  };

  // 计算总页数
  const getTotalPages = () => {
    return Math.ceil(totalProducts / pageSize);
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
        <Spin spinning={loading} tip="加载中...">
          <Table
            columns={columns}
            dataSource={products}
            rowKey="id"
            pagination={false}
            locale={{ emptyText: '暂无数据' }}
            style={{ fontSize: '12px' }}
            className="ant-table"
          />
        </Spin>
        
        {/* 分页组件 */}
        <div style={{ margin: '16px 0', textAlign: 'right', fontSize: '12px' }}>
          <span style={{ marginRight: '16px', color: '#666666', fontSize: '12px' }}>共 {totalProducts} 条</span>
          <span 
            style={{ 
              marginRight: '8px', 
              fontSize: '12px', 
              cursor: currentPage > 1 ? 'pointer' : 'not-allowed',
              color: currentPage > 1 ? '#1890ff' : '#ccc'
            }}
            onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
          >
            上一页
          </span>
          <span style={{ marginRight: '8px', fontSize: '12px' }}>{currentPage}</span>
          <span 
            style={{ 
              marginRight: '8px', 
              fontSize: '12px', 
              cursor: currentPage < getTotalPages() ? 'pointer' : 'not-allowed',
              color: currentPage < getTotalPages() ? '#1890ff' : '#ccc'
            }}
            onClick={() => currentPage < getTotalPages() && handlePageChange(currentPage + 1)}
          >
            下一页
          </span>
          <span style={{ marginRight: '8px', fontSize: '12px' }}>{pageSize}条/页</span>
          <span style={{ marginRight: '8px', fontSize: '12px' }}>跳至</span>
          <Input 
            type="number" 
            min={1} 
            max={getTotalPages()}
            value={currentPage} 
            onChange={(e) => {
              const page = parseInt(e.target.value);
              if (page && page >= 1 && page <= getTotalPages()) {
                handlePageChange(page);
              }
            }} 
            onPressEnter={(e) => {
              const page = parseInt(e.target.value);
              if (page && page >= 1 && page <= getTotalPages()) {
                handlePageChange(page);
              }
            }}
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