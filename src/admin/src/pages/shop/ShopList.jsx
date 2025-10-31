import React, { useState } from 'react';
import { Table, Button, Input, Select, DatePicker, Space, Tag } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import './ShopList.css';

const { Option } = Select;
const { RangePicker } = DatePicker;

// 店铺列表页面组件
const ShopList = () => {
  // 状态管理
  const [memberName, setMemberName] = useState('');
  const [shopName, setShopName] = useState('');
  const [shopStatus, setShopStatus] = useState('');
  const [createTime, setCreateTime] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [total] = useState(1119);

  // 模拟店铺数据
  const [shops] = useState([
    {
      id: '1',
      shopName: 'bhw 测试店铺',
      memberName: 'okE4i3G1WZ1i+bsC1DH4OJA+b4',
      shopAddress: '安徽省合肥市肥西县',
      isSelfOperated: '非自营',
      status: '开启中',
      createTime: '2025-10-18 15:57:30'
    },
    {
      id: '2',
      shopName: '西西',
      memberName: '长相',
      shopAddress: '上海市上海城区崇明区绿华镇',
      isSelfOperated: '非自营',
      status: '开启中',
      createTime: '2025-10-19 17:21:19'
    },
    {
      id: '3',
      shopName: '测试',
      memberName: '吃烧烤',
      shopAddress: '内蒙古自治区',
      isSelfOperated: '非自营',
      status: '开启中',
      createTime: '2025-10-18 17:48:36'
    },
    {
      id: '4',
      shopName: '壹铭心意',
      memberName: '姚润昊',
      shopAddress: '广东省佛山市三水区',
      isSelfOperated: '非自营',
      status: '开启中',
      createTime: '2025-10-12 15:55:40'
    },
    {
      id: '5',
      shopName: '刺猬阅读器材',
      memberName: '5b59bd24ba33cbc69b959e45ca52be99',
      shopAddress: '福建省厦门市翔安区马巷镇',
      isSelfOperated: '非自营',
      status: '开启中',
      createTime: '2025-09-27 14:31:37'
    },
    {
      id: '6',
      shopName: '朴树店',
      memberName: 'm18638752597',
      shopAddress: '河南省郑州市上街区中心路街道',
      isSelfOperated: '非自营',
      status: '开启中',
      createTime: '2025-09-27 13:18:33'
    },
    {
      id: '7',
      shopName: '123',
      memberName: 'cbe9e078e484e8d761bf40062e91c322',
      shopAddress: '北京市北京城区平谷区马坊镇',
      isSelfOperated: '非自营',
      status: '开启中',
      createTime: '2025-09-24 21:34:21'
    },
    {
      id: '8',
      shopName: '1111',
      memberName: '1881468186',
      shopAddress: '辽宁省大连市庄河市城山镇',
      isSelfOperated: '非自营',
      status: '开启中',
      createTime: '2025-09-23 20:00:26'
    },
    {
      id: '9',
      shopName: '1',
      memberName: '15268519112',
      shopAddress: '辽宁省大连市庄河市城山镇',
      isSelfOperated: '非自营',
      status: '开启中',
      createTime: '2025-09-23 16:55:30'
    },
    {
      id: '10',
      shopName: '吴大药房',
      memberName: 'okE4iw7ulKUTD1aLhUe7xJvJ5O',
      shopAddress: '广东省汕头市潮阳区和平镇',
      isSelfOperated: '非自营',
      status: '开启中',
      createTime: '2025-09-20 10:30:09'
    }
  ]);

  // 处理搜索
  const handleSearch = () => {
    // 实际项目中这里应该调用API进行搜索
    console.log('搜索条件:', {
      memberName,
      shopName,
      shopStatus,
      createTime: createTime.map(time => time ? time.format('YYYY-MM-DD') : null)
    });
  };

  // 处理重置
  const handleReset = () => {
    setMemberName('');
    setShopName('');
    setShopStatus('');
    setCreateTime([]);
    setCurrentPage(1);
  };

  // 处理分页变化
  const handlePageChange = (page) => {
    setCurrentPage(page);
    // 实际项目中这里应该根据页码加载对应的数据
    console.log('切换到页码:', page);
  };

  // 处理运营操作
  const handleOperate = (record) => {
    console.log('运营店铺:', record);
  };

  // 处理修改操作
  const handleEdit = (record) => {
    console.log('修改店铺:', record);
  };

  // 处理关闭操作
  const handleClose = (record) => {
    console.log('关闭店铺:', record);
  };

  // 渲染店铺状态标签
  const renderStatusTag = (status) => {
    if (status === '开启中') {
      return (
        <Tag color="green" className="status-tag-green">
          {status}
        </Tag>
      );
    } else if (status === '已关闭') {
      return (
        <Tag color="red" className="status-tag-red">
          {status}
        </Tag>
      );
    }
    return (
      <Tag color="default">
        {status}
      </Tag>
    );
  };

  // 表格列定义
  const columns = [
    {
      title: '店铺名称',
      dataIndex: 'shopName',
      key: 'shopName',
      ellipsis: true,
      width: 150
    },
    {
      title: '会员名称',
      dataIndex: 'memberName',
      key: 'memberName',
      ellipsis: true,
      width: 200
    },
    {
      title: '店铺地址',
      dataIndex: 'shopAddress',
      key: 'shopAddress',
      ellipsis: true,
      width: 180
    },
    {
      title: '是否自营',
      dataIndex: 'isSelfOperated',
      key: 'isSelfOperated',
      ellipsis: true,
      width: 100
    },
    {
      title: '店铺状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (text) => renderStatusTag(text)
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
      width: 150,
      render: (_, record) => (
        <Space size="middle">
          <a href="#" className="operate-btn" onClick={() => handleOperate(record)}>运营</a>
          <a href="#" className="edit-btn" onClick={() => handleEdit(record)}>修改</a>
          <a href="#" className="close-btn" onClick={() => handleClose(record)}>关闭</a>
        </Space>
      )
    }
  ];

  return (
    <div className="shop-list">
      {/* 搜索区域 */}
      <div className="search-area">
        <div className="search-row">
          <div className="search-item">
            <label>会员名称</label>
            <Input
              placeholder="请输入会员名称"
              value={memberName}
              onChange={(e) => setMemberName(e.target.value)}
              style={{ width: 180 }}
            />
          </div>
          
          <div className="search-item">
            <label>店铺名称</label>
            <Input
              placeholder="请输入店铺名称"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              style={{ width: 180 }}
            />
          </div>
          
          <div className="search-item">
            <label>店铺状态</label>
            <Select
              placeholder="请选择"
              value={shopStatus}
              onChange={(value) => setShopStatus(value)}
              style={{ width: 120 }}
            >
              <Option value="开启中">开启中</Option>
              <Option value="已关闭">已关闭</Option>
            </Select>
          </div>
          
          <div className="search-item">
            <label>创建时间</label>
            <RangePicker
              value={createTime}
              onChange={(dates) => setCreateTime(dates)}
              style={{ width: 240 }}
            />
          </div>
          
          <div className="search-item">
            <Button 
              type="primary" 
              icon={<SearchOutlined />}
              onClick={handleSearch}
              className="search-btn"
            >
              搜索
            </Button>
          </div>
        </div>
        
        <div className="search-row">
          <Button onClick={handleReset} className="add-btn">
            添加
          </Button>
        </div>
      </div>

      {/* 表格区域 */}
      <div className="shop-table">
        <Table
          columns={columns}
          dataSource={shops}
          rowKey="id"
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: total,
            onChange: handlePageChange,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
            pageSizeOptions: ['10条', '20条', '50条', '100条']
          }}
          scroll={{ x: 1200 }}
        />
      </div>
    </div>
  );
};

export default ShopList;