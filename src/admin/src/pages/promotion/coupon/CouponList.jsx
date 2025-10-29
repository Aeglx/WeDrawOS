import React, { useState, useEffect } from 'react';
import { Button, Input, Select, DatePicker, Table, Space, Checkbox, Tag, Card, Row, Col } from 'antd';
import { SearchOutlined, EditOutlined, DeleteOutlined, EyeOutlined, FileTextOutlined } from '@ant-design/icons';
import './CouponList.css';

const { Option } = Select;
const { RangePicker } = DatePicker;

const CouponList = () => {
  // 状态管理
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [couponName, setCouponName] = useState('');
  const [acquisitionMethod, setAcquisitionMethod] = useState('');
  const [activityStatus, setActivityStatus] = useState('');
  const [activityTime, setActivityTime] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // 模拟数据
  const mockData = [
    {
      key: '1',
      couponName: '测试优惠券',
      faceValue: '¥30.00',
      claimedQuantity: '0/不限',
      usedQuantity: '0/0',
      acquisitionMethod: '活动获取',
      couponType: '减免现金',
      categoryRange: '指定商品',
      activityTime: '长期有效',
      status: '已关闭',
    },
    {
      key: '2',
      couponName: '0',
      faceValue: '¥9,999.00',
      claimedQuantity: '0/10000',
      usedQuantity: '0/0',
      acquisitionMethod: '活动获取',
      couponType: '减免现金',
      categoryRange: '全品类',
      activityTime: '长期有效',
      status: '已关闭',
    },
    {
      key: '3',
      couponName: '100',
      faceValue: '9.9折',
      claimedQuantity: '0/1000000',
      usedQuantity: '0/0',
      acquisitionMethod: '免费获取',
      couponType: '打折',
      categoryRange: '全品类',
      activityTime: '',
      status: '已关闭',
    },
    {
      key: '4',
      couponName: '00',
      faceValue: '¥666.00',
      claimedQuantity: '0/100',
      usedQuantity: '0/0',
      acquisitionMethod: '免费获取',
      couponType: '减免现金',
      categoryRange: '全品类',
      activityTime: '',
      status: '已关闭',
    },
    {
      key: '5',
      couponName: 'zidongf',
      faceValue: '¥5,454.00',
      claimedQuantity: '22/不限',
      usedQuantity: '0/22',
      acquisitionMethod: '免费获取',
      couponType: '减免现金',
      categoryRange: '全品类',
      activityTime: '2025-10-21 00:00:00 - 2025-10-22 00:00:00',
      status: '已结束',
    },
    {
      key: '6',
      couponName: 'ceshi',
      faceValue: '¥11.00',
      claimedQuantity: '45/100',
      usedQuantity: '2/45',
      acquisitionMethod: '免费获取',
      couponType: '减免现金',
      categoryRange: '全品类',
      activityTime: '2025-10-21 00:00:00 - 2025-10-22 00:00:00',
      status: '已结束',
    },
    {
      key: '7',
      couponName: '测试',
      faceValue: '¥5.00',
      claimedQuantity: '3/不限',
      usedQuantity: '0/3',
      acquisitionMethod: '活动获取',
      couponType: '减免现金',
      categoryRange: '全品类',
      activityTime: '长期有效',
      status: '已关闭',
    },
    {
      key: '8',
      couponName: '冰糖先生手机优惠券',
      faceValue: '¥1.00',
      claimedQuantity: '5/1000',
      usedQuantity: '0/5',
      acquisitionMethod: '免费获取',
      couponType: '减免现金',
      categoryRange: '指定商品',
      activityTime: '2025-10-13 00:00:00 - 2025-10-15 00:00:00',
      status: '已结束',
    },
    {
      key: '9',
      couponName: '1',
      faceValue: '¥1.00',
      claimedQuantity: '1/1',
      usedQuantity: '0/1',
      acquisitionMethod: '免费获取',
      couponType: '减免现金',
      categoryRange: '指定商品',
      activityTime: '',
      status: '已关闭',
    },
    {
      key: '10',
      couponName: 'dafd11',
      faceValue: '¥12.00',
      claimedQuantity: '0/10',
      usedQuantity: '0/0',
      acquisitionMethod: '免费获取',
      couponType: '减免现金',
      categoryRange: '全品类',
      activityTime: '',
      status: '已关闭',
    },
  ];

  // 获取状态对应的标签颜色
  const getStatusTagColor = (status) => {
    const colorMap = {
      '已关闭': 'red',
      '已结束': 'orange',
      '进行中': 'green',
      '未开始': 'blue',
    };
    return colorMap[status] || 'default';
  };

  // 获取获取方式对应的标签颜色
  const getAcquisitionTagColor = (method) => {
    const colorMap = {
      '活动获取': 'orange',
      '免费获取': 'red',
      '付费获取': 'purple',
    };
    return colorMap[method] || 'default';
  };

  // 获取优惠券类型对应的标签颜色
  const getCouponTypeTagColor = (type) => {
    const colorMap = {
      '减免现金': 'blue',
      '打折': 'green',
      '满减': 'red',
    };
    return colorMap[type] || 'default';
  };

  // 获取品类范围对应的标签颜色
  const getCategoryRangeTagColor = (range) => {
    return range === '指定商品' ? 'pink' : 'blue';
  };

  // 处理搜索
  const handleSearch = () => {
    // 这里应该调用API进行搜索
    console.log('搜索条件:', { couponName, acquisitionMethod, activityStatus, activityTime });
  };

  // 处理重置
  const handleReset = () => {
    setCouponName('');
    setAcquisitionMethod('');
    setActivityStatus('');
    setActivityTime([]);
  };

  // 处理添加优惠券
  const handleAddCoupon = () => {
    // 跳转到添加优惠券页面
    console.log('添加优惠券');
  };

  // 处理批量关闭
  const handleBatchClose = () => {
    console.log('批量关闭优惠券:', selectedRowKeys);
  };

  // 处理查看领取记录
  const handleViewRecords = () => {
    console.log('查看领取记录');
  };

  // 处理编辑优惠券
  const handleEdit = (record) => {
    console.log('编辑优惠券:', record);
  };

  // 处理查看领取记录
  const handleViewCouponRecords = (record) => {
    console.log('查看优惠券领取记录:', record);
  };

  // 处理查看优惠券详情
  const handleViewDetail = (record) => {
    console.log('查看优惠券详情:', record);
  };

  // 表格列配置
  const columns = [
    {
      title: '',
      dataIndex: '',
      key: 'selection',
      width: 40,
      render: (_, record) => (
        <Checkbox 
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedRowKeys([...selectedRowKeys, record.key]);
            } else {
              setSelectedRowKeys(selectedRowKeys.filter(key => key !== record.key));
            }
          }}
          checked={selectedRowKeys.includes(record.key)}
        />
      ),
    },
    {
      title: '优惠券名称',
      dataIndex: 'couponName',
      key: 'couponName',
    },
    {
      title: '面额/折扣',
      dataIndex: 'faceValue',
      key: 'faceValue',
    },
    {
      title: '已领取数量/总数量',
      dataIndex: 'claimedQuantity',
      key: 'claimedQuantity',
    },
    {
      title: '已使用/已领取数量',
      dataIndex: 'usedQuantity',
      key: 'usedQuantity',
    },
    {
      title: '获取方式',
      dataIndex: 'acquisitionMethod',
      key: 'acquisitionMethod',
      render: (text) => (
        <Tag color={getAcquisitionTagColor(text)}>{text}</Tag>
      ),
    },
    {
      title: '优惠券类型',
      dataIndex: 'couponType',
      key: 'couponType',
      render: (text) => (
        <Tag color={getCouponTypeTagColor(text)}>{text}</Tag>
      ),
    },
    {
      title: '品类描述',
      dataIndex: 'categoryRange',
      key: 'categoryRange',
      render: (text) => (
        <Tag color={getCategoryRangeTagColor(text)}>{text}</Tag>
      ),
    },
    {
      title: '活动时间',
      dataIndex: 'activityTime',
      key: 'activityTime',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (text) => (
        <Tag color={getStatusTagColor(text)}>{text}</Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          {record.status === '已结束' ? (
            <Button 
              size="small" 
              type="link" 
              icon={<EyeOutlined />}
              onClick={() => handleViewDetail(record)}
            >
              查看
            </Button>
          ) : (
            <Button 
              size="small" 
              type="link" 
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            >
              编辑
            </Button>
          )}
          <Button 
            size="small" 
            type="link" 
            icon={<FileTextOutlined />}
            onClick={() => handleViewCouponRecords(record)}
          >
            领取记录
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="coupon-list-container">
      {/* 搜索区域 */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#666666', marginRight: '8px', width: '80px', display: 'inline-block', whiteSpace: 'nowrap' }}>优惠券名称</span>
            <Input 
              placeholder="请输入优惠券名称" 
              value={couponName}
              onChange={(e) => setCouponName(e.target.value)}
              style={{ width: 180, fontSize: '12px', height: 32 }}
              allowClear
            />
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#666666', marginRight: '8px', width: '80px', display: 'inline-block', whiteSpace: 'nowrap' }}>获取方式</span>
            <Select 
              placeholder="请选择获取方式" 
              value={acquisitionMethod}
              onChange={setAcquisitionMethod}
              style={{ width: 180, fontSize: '12px', height: 32 }}
              allowClear
            >
              <Option value="活动获取">活动获取</Option>
              <Option value="免费获取">免费获取</Option>
              <Option value="付费获取">付费获取</Option>
            </Select>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#666666', marginRight: '8px', width: '80px', display: 'inline-block', whiteSpace: 'nowrap' }}>活动状态</span>
            <Select 
              placeholder="请选择活动状态" 
              value={activityStatus}
              onChange={setActivityStatus}
              style={{ width: 180, fontSize: '12px', height: 32 }}
              allowClear
            >
              <Option value="进行中">进行中</Option>
              <Option value="已关闭">已关闭</Option>
              <Option value="已结束">已结束</Option>
              <Option value="未开始">未开始</Option>
            </Select>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#666666', marginRight: '8px', width: '80px', display: 'inline-block', whiteSpace: 'nowrap' }}>活动时间</span>
            <RangePicker 
              value={activityTime}
              onChange={setActivityTime}
              style={{ width: 260, fontSize: '12px', height: 32 }}
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
          
          <Button 
            onClick={handleReset}
            style={{ height: 32, fontSize: '12px' }}
          >
            重置
          </Button>
        </div>
      </Card>

      <div className="operation-bar">
        <Button type="primary" onClick={handleAddCoupon}>
          添加优惠券
        </Button>
        <Button onClick={handleBatchClose} disabled={selectedRowKeys.length === 0}>
          批量关闭
        </Button>
        <Button onClick={handleViewRecords}>
          优惠券领取记录
        </Button>
      </div>

      <Table 
        columns={columns} 
        dataSource={mockData} 
        pagination={{
          current: currentPage,
          pageSize: pageSize,
          total: 990,
          onChange: (page, size) => {
            setCurrentPage(page);
            setPageSize(size);
          },
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条`,
        }}
        rowKey="key"
      />
    </div>
  );
};

export default CouponList;