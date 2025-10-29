import React, { useState } from 'react';
import { Button, Input, Table, Select, DatePicker, message, Radio, Checkbox } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';

const { Option } = Select;
const { RangePicker } = DatePicker;
const { TextArea } = Input;

const DesignatedPointProduct = () => {
  // 选中的商品列表
  const [selectedProducts, setSelectedProducts] = useState([]);
  // 活动名称
  const [activityName, setActivityName] = useState('');
  // 兑换积分
  const [exchangePoints, setExchangePoints] = useState({
    // 这里可以存储每个商品的兑换积分
  });
  // 活动时间范围
  const [activityTimeRange, setActivityTimeRange] = useState([]);
  // 活动库存
  const [activityStock, setActivityStock] = useState({
    // 这里可以存储每个商品的活动库存
  });
  // 活动状态
  const [activityStatus, setActivityStatus] = useState('1'); // 1表示启用，0表示禁用

  // 模拟已有的积分商品数据
  const mockPointProducts = [
    {
      key: '1',
      productName: '积分商品1',
      skuCode: 'POINT001',
      originalPrice: '199.00',
      exchangePoints: '1990',
      stock: '50',
      activityStock: '20',
      shopName: '测试店铺',
      category: '电子产品',
      status: '1' // 1表示启用，0表示禁用
    },
    {
      key: '2',
      productName: '积分商品2',
      skuCode: 'POINT002',
      originalPrice: '299.00',
      exchangePoints: '2990',
      stock: '100',
      activityStock: '30',
      shopName: '测试店铺',
      category: '家居用品',
      status: '1'
    },
    {
      key: '3',
      productName: '积分商品3',
      skuCode: 'POINT003',
      originalPrice: '99.00',
      exchangePoints: '990',
      stock: '150',
      activityStock: '50',
      shopName: '测试店铺',
      category: '生活用品',
      status: '0'
    }
  ];

  // 商品选择表格列配置
  const productColumns = [
    {
      title: '选择',
      dataIndex: 'select',
      key: 'select',
      width: 60,
      render: (_, record) => (
        <Checkbox
          checked={selectedProducts.some(p => p.key === record.key)}
          onChange={(e) => handleProductSelect(e, record)}
        />
      )
    },
    {
      title: '商品名称',
      dataIndex: 'productName',
      key: 'productName',
      width: 200,
    },
    {
      title: 'SKU编码',
      dataIndex: 'skuCode',
      key: 'skuCode',
      width: 120,
    },
    {
      title: '原始价格',
      dataIndex: 'originalPrice',
      key: 'originalPrice',
      width: 100,
    },
    {
      title: '兑换积分',
      dataIndex: 'exchangePoints',
      key: 'exchangePoints',
      width: 100,
    },
    {
      title: '库存',
      dataIndex: 'stock',
      key: 'stock',
      width: 80,
    },
    {
      title: '店铺',
      dataIndex: 'shopName',
      key: 'shopName',
      width: 120,
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 100,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status) => (
        <span style={{ color: status === '1' ? '#52c41a' : '#d9d9d9' }}>
          {status === '1' ? '启用' : '禁用'}
        </span>
      )
    }
  ];

  // 处理商品选择
  const handleProductSelect = (e, product) => {
    if (e.target.checked) {
      // 添加商品到已选列表
      setSelectedProducts([...selectedProducts, product]);
      // 初始化活动库存（默认使用商品现有的活动库存或设置为空）
      setActivityStock(prev => ({ ...prev, [product.key]: product.activityStock || '' }));
    } else {
      // 从已选列表移除商品
      setSelectedProducts(selectedProducts.filter(p => p.key !== product.key));
      // 删除对应的活动库存
      const newActivityStock = { ...activityStock };
      delete newActivityStock[product.key];
      setActivityStock(newActivityStock);
    }
  };

  // 处理活动库存变化
  const handleActivityStockChange = (productKey, value) => {
    setActivityStock(prev => ({ ...prev, [productKey]: value }));
  };

  // 处理保存
  const handleSave = () => {
    // 验证表单
    if (!activityName.trim()) {
      message.error('请输入活动名称');
      return;
    }
    
    if (activityTimeRange.length === 0) {
      message.error('请选择活动时间范围');
      return;
    }
    
    if (selectedProducts.length === 0) {
      message.error('请至少选择一个商品');
      return;
    }
    
    // 验证每个选中商品的活动库存
    for (const product of selectedProducts) {
      if (!activityStock[product.key] || isNaN(parseInt(activityStock[product.key]))) {
        message.error(`请为商品"${product.productName}"设置有效的活动库存`);
        return;
      }
    }
    
    // 保存数据
    console.log('保存指定商品活动数据:', {
      activityName,
      activityTimeRange,
      activityStatus,
      selectedProducts: selectedProducts.map(p => ({
        ...p,
        activityStock: activityStock[p.key]
      }))
    });
    
    message.success('保存成功');
  };

  return (
    <div className="designated-point-product-container">


      {/* 标签页 */}
      <div style={{ borderBottom: '1px solid #e8e8e8', marginBottom: '20px' }}>
        <Link 
          to="/promotion/promotion-manage/point-activity/add-point-product"
          style={{ 
            display: 'inline-block', 
            padding: '8px 16px', 
            fontSize: '14px', 
            color: '#666', 
            marginRight: '24px',
            cursor: 'pointer',
            textDecoration: 'none'
          }}
        >
          添加商品
        </Link>
        <span 
          style={{ 
            display: 'inline-block', 
            padding: '8px 16px', 
            fontSize: '14px', 
            color: '#ff0000', 
            borderBottom: '2px solid #ff0000', 
            marginRight: '24px',
            cursor: 'pointer'
          }}
        >
          指定商品
        </span>
      </div>

      {/* 活动信息 */}
      <div style={{ border: '1px solid #e8e8e8', padding: '20px', marginBottom: '20px' }}>
        <h3 style={{ marginBottom: '20px', fontSize: '16px' }}>活动信息</h3>
        
        <div style={{ marginBottom: '16px' }}>
          <span style={{ display: 'inline-block', width: '100px', textAlign: 'right', marginRight: '10px' }}>活动名称：</span>
          <Input
            value={activityName}
            onChange={(e) => setActivityName(e.target.value)}
            placeholder="请输入活动名称"
            style={{ width: 300 }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <span style={{ display: 'inline-block', width: '100px', textAlign: 'right', marginRight: '10px' }}>活动时间：</span>
          <RangePicker
            value={activityTimeRange}
            onChange={(dates) => setActivityTimeRange(dates)}
            style={{ width: 300 }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <span style={{ display: 'inline-block', width: '100px', textAlign: 'right', marginRight: '10px' }}>活动状态：</span>
          <Radio.Group 
            value={activityStatus} 
            onChange={(e) => setActivityStatus(e.target.value)}
          >
            <Radio value="1">启用</Radio>
            <Radio value="0">禁用</Radio>
          </Radio.Group>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <span style={{ display: 'inline-block', width: '100px', textAlign: 'right', marginRight: '10px', verticalAlign: 'top' }}>活动说明：</span>
          <TextArea
            rows={4}
            placeholder="请输入活动说明"
            style={{ width: 300 }}
          />
        </div>
      </div>

      {/* 商品选择 */}
      <div style={{ border: '1px solid #e8e8e8', padding: '20px', marginBottom: '20px' }}>
        <h3 style={{ marginBottom: '20px', fontSize: '16px' }}>商品选择</h3>
        
        <Table
          columns={productColumns}
          dataSource={mockPointProducts}
          pagination={{ pageSize: 10 }}
          rowKey="key"
          style={{ marginBottom: '20px' }}
        />
      </div>

      {/* 已选商品配置 */}
      {selectedProducts.length > 0 && (
        <div style={{ border: '1px solid #e8e8e8', padding: '20px', marginBottom: '20px' }}>
          <h3 style={{ marginBottom: '20px', fontSize: '16px' }}>已选商品配置</h3>
          
          <Table
            columns={[
              {
                title: '商品名称',
                dataIndex: 'productName',
                key: 'productName',
                width: 200,
              },
              {
                title: 'SKU编码',
                dataIndex: 'skuCode',
                key: 'skuCode',
                width: 120,
              },
              {
                title: '原始价格',
                dataIndex: 'originalPrice',
                key: 'originalPrice',
                width: 100,
              },
              {
                title: '兑换积分',
                dataIndex: 'exchangePoints',
                key: 'exchangePoints',
                width: 120,
              },
              {
                title: '活动库存',
                key: 'activityStock',
                width: 120,
                render: (_, record) => (
                  <Input
                    value={activityStock[record.key] || ''}
                    onChange={(e) => handleActivityStockChange(record.key, e.target.value)}
                    placeholder="请输入"
                    type="number"
                    style={{ width: 100 }}
                  />
                )
              },
              {
                title: '操作',
                key: 'action',
                width: 80,
                render: (_, record) => (
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleProductSelect({ target: { checked: false } }, record)}
                  />
                )
              }
            ]}
            dataSource={selectedProducts}
            pagination={false}
            rowKey="key"
          />
        </div>
      )}

      {/* 按钮组 */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <Button 
          type="primary" 
          onClick={handleSave}
          style={{ backgroundColor: '#ff0000', borderColor: '#ff0000', marginRight: '16px' }}
        >
          保存
        </Button>
        <Button onClick={() => window.history.back()}>
          返回
        </Button>
      </div>
    </div>
  );
};

export default DesignatedPointProduct;