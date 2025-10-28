import React, { useState, useEffect } from 'react';
import { Table, Input, Button, Space, Switch, Popconfirm, Modal, Form, Upload, message } from 'antd';
import { SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { UploadOutlined } from '@ant-design/icons';
import './BrandList.css';

const { Search } = Input;
const { TextArea } = Input;

// 模拟品牌数据
const mockBrands = [
  { id: 1, name: 'HUAWEI', logo: 'HUAWEI', status: 'enabled', logoUrl: null },
  { id: 2, name: '通义', logo: '', status: 'enabled', logoUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSI+CiAgPHBhdGggZD0iTTAgMGg0MHY0MEgwVjB6bTcgN0g5di0ySDF2Mkg3ek00IDhIMXYySDJWMTRoMnYtMkg0VjhoMHpNMTEgOEgxMFYxNGgydi00aC0xdi0ySDEwek0yMCA0aDJWMTRoLTJWNEgyMHpNMjkgNEgyN1YxNGgydi00aC0yVjRoMHpNMTUgMWgzVjVoLTJ2LTJoMnptMCA0aC0ydjJoMnYtMnpNMjQgMWgzVjVoLTJ2LTJoMnptMCA0aC0ydjJoMnYtMnpNMTUgMTJoMnYyaC0ydjJ6TTIzIDEyaDJ2MmgtMnYyek0zMiAxMmgxdjJoLTF2LTJ6bS0zIDEyaDJ2MmgtMnYyek0xNSAxOGgydjJoLTJ2LTJ6TTIzIDE4aDJ2MmgtMnYyek0zMiAxOGgydjJoLTJ2LTJ6IiBmaWxsPSIjMkE2NkYxIiAvPgogIDxwYXRoIGQ9Ik0xMCAyMmgyMHYxaC0yMFYyMnpNMSA0djRoMnYxaC0ydjEwaDJ2MWgtMlY1aDJWMTRoLTJWNHptMjQgMHY0aDJ2MWgtMlYxNGgyVjVoLTJWMTRoLTJWNHptLTcgN2gyMnYxaC0yMlYxNHoiIGZpbGw9IiMxNkI5NTQiLz4KPC9zdmc+CiAg' },
  { id: 3, name: 'Holdoumen', logo: 'IIOLJOUMEN', status: 'enabled', logoUrl: null },
  { id: 4, name: '9组牌', logo: '', status: 'enabled', logoUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSI+CiAgPHBhdGggZD0iTTkgMkgyVjEyaDJWNUg1VjE0aDJ2Mkg0VjJIN1Y2aDJ2NGg0djJoMnYyaDJ2NGgtMnYyaDJ2MkgxN1YxNmgyVjE0aDJWOGgxdi0yaDJ2LTRoLTJWNGgydi0ySDIyVjBIMTh2MnptMCAxNmgyVjIwSDIwdi0yaDJ2LTJoLTRWMThIMTR2LTJoMnYtMmgyVjE4aDJ2LTJoLTJWNGgtMnY2aDJ2MmgtMnYyaDJ2MnptLTkgMmgzdi0yaC0zdjJ6TTE2IDIyaDJ2LTJoLTJ2MnptLTIgMGgydi0yaC0ydjJ6IiBmaWxsPSIjRUU2NTM3Ii8+Cjwvc3ZnPg==' },
  { id: 5, name: '农夫山泉', logo: '农夫山泉 NONGFU SPRING', status: 'enabled', logoUrl: null },
  { id: 6, name: '织道丝', logo: '织 织道丝', status: 'enabled', logoUrl: null },
];

const BrandList = () => {
  const [brands, setBrands] = useState(mockBrands);
  const [filteredBrands, setFilteredBrands] = useState(mockBrands);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  const [form] = Form.useForm();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(471); // 模拟总数

  // 筛选品牌列表
  useEffect(() => {
    if (searchTerm) {
      const filtered = brands.filter(brand => 
        brand.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredBrands(filtered);
    } else {
      setFilteredBrands(brands);
    }
  }, [searchTerm, brands]);

  // 处理搜索
  const handleSearch = (value) => {
    setSearchTerm(value);
    setCurrentPage(1); // 重置到第一页
  };

  // 打开添加品牌模态框
  const handleAddBrand = () => {
    form.resetFields();
    setIsAddModalVisible(true);
  };

  // 打开编辑品牌模态框
  const handleEditBrand = (brand) => {
    setEditingBrand(brand);
    form.setFieldsValue({
      name: brand.name,
      logo: brand.logo,
      status: brand.status === 'enabled',
    });
    setIsEditModalVisible(true);
  };

  // 保存添加/编辑的品牌
  const handleSaveBrand = () => {
    form.validateFields().then(values => {
      if (editingBrand) {
        // 编辑品牌
        const updatedBrands = brands.map(brand => 
          brand.id === editingBrand.id 
            ? { ...brand, ...values, status: values.status ? 'enabled' : 'disabled' }
            : brand
        );
        setBrands(updatedBrands);
        message.success('品牌更新成功');
        setIsEditModalVisible(false);
      } else {
        // 添加品牌
        const newBrand = {
          id: brands.length + 1,
          ...values,
          status: values.status ? 'enabled' : 'disabled',
          logo: values.logo || '',
          logoUrl: null,
        };
        setBrands([newBrand, ...brands]);
        message.success('品牌添加成功');
        setIsAddModalVisible(false);
      }
    }).catch(info => {
      message.error('表单验证失败');
    });
  };

  // 禁用/启用品牌
  const handleToggleStatus = (id) => {
    const updatedBrands = brands.map(brand => 
      brand.id === id 
        ? { ...brand, status: brand.status === 'enabled' ? 'disabled' : 'enabled' }
        : brand
    );
    setBrands(updatedBrands);
    message.success('品牌状态已更新');
  };

  // 删除品牌
  const handleDeleteBrand = (id) => {
    const updatedBrands = brands.filter(brand => brand.id !== id);
    setBrands(updatedBrands);
    message.success('品牌已删除');
  };

  // 处理上传
  const handleUpload = ({ file }) => {
    // 这里只是模拟上传，实际项目中需要实现真实的上传逻辑
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          status: 'done',
          url: URL.createObjectURL(file.originFileObj),
        });
      }, 1000);
    });
  };

  // 表格列定义
  const columns = [
    {
      title: '品牌名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '品牌图标',
      dataIndex: 'logo',
      key: 'logo',
      render: (text, record) => {
        if (record.logoUrl) {
          return <img src={record.logoUrl} alt={record.name} style={{ width: 40, height: 40 }} />;
        }
        return (
          <div className="logo-text" style={{ 
            display: 'inline-block',
            padding: '4px 8px',
            border: '1px solid #d9d9d9',
            borderRadius: '4px',
            fontSize: '12px',
            backgroundColor: '#f5f5f5'
          }}>
            {text}
          </div>
        );
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <span className={`status-${status}`}>
          {status === 'enabled' ? '启用' : '禁用'}
        </span>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button 
            type="primary" 
            size="small" 
            icon={<EditOutlined />} 
            onClick={() => handleEditBrand(record)}
            className="edit-button"
          >
            编辑
          </Button>
          <Button 
            size="small" 
            onClick={() => handleToggleStatus(record.id)}
            className={record.status === 'enabled' ? 'disable-button' : 'enable-button'}
          >
            {record.status === 'enabled' ? '禁用' : '启用'}
          </Button>
          <Popconfirm
            title="确定要删除这个品牌吗?"
            onConfirm={() => handleDeleteBrand(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button 
              size="small" 
              danger 
              icon={<DeleteOutlined />}
              className="delete-button"
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 分页配置
  const pagination = {
    current: currentPage,
    pageSize: pageSize,
    total: total,
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (total) => `共 ${total} 条`,
    onChange: (page, size) => {
      setCurrentPage(page);
      setPageSize(size);
    },
  };

  return (
    <div className="brand-list-container">
      <div className="search-section">
        <Search
          placeholder="请输入品牌名称"
          allowClear
          enterButton="搜索"
          size="large"
          onSearch={handleSearch}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      <div className="action-section">
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={handleAddBrand}
          className="add-button"
        >
          添加
        </Button>
      </div>

      <Table 
        columns={columns} 
        dataSource={filteredBrands} 
        rowKey="id"
        pagination={pagination}
        className="brand-table"
      />

      {/* 添加/编辑品牌模态框 */}
      <Modal
        title={editingBrand ? "编辑品牌" : "添加品牌"}
        open={isAddModalVisible || isEditModalVisible}
        onOk={handleSaveBrand}
        onCancel={() => {
          setIsAddModalVisible(false);
          setIsEditModalVisible(false);
        }}
        okText="保存"
        cancelText="取消"
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            status: true,
          }}
        >
          <Form.Item
            label="品牌名称"
            name="name"
            rules={[{ required: true, message: '请输入品牌名称' }]}
          >
            <Input />
          </Form.Item>
          
          <Form.Item
            label="品牌图标"
            name="logo"
          >
            <Input placeholder="可以上传图标或输入文字标识" />
          </Form.Item>
          
          <Form.Item
            label="上传图标"
          >
            <Upload
              beforeUpload={() => false}
              customRequest={handleUpload}
              showUploadList={false}
              className="logo-upload"
            >
              <Button icon={<UploadOutlined />}>上传图标</Button>
            </Upload>
          </Form.Item>

          <Form.Item
            label="状态"
            name="status"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default BrandList;