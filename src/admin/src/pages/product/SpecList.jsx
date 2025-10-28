import React, { useState, useEffect } from 'react';
import { Table, Input, Button, Space, Modal, Form, Popconfirm, message } from 'antd';
import { SearchOutlined, PlusOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import './SpecList.css';

const { Search } = Input;

// 模拟规格数据
const mockSpecs = [
  { id: 1, name: 'AAAAAA', value: 'AAAAA' },
  { id: 2, name: 'iPhone13-内存', value: '128G,256G,512G' },
  { id: 3, name: 'iPhone13-颜色', value: '红色,白色,绿色,黑色' },
  { id: 4, name: '11', value: '11,33,44,55' },
  { id: 5, name: '主体', value: '认证号,型号,产品净重' },
  { id: 6, name: '测试规格', value: '测试111' },
  { id: 7, name: '11', value: '11' },
  { id: 8, name: '111', value: '99' },
  { id: 9, name: '颜色', value: '黑色,红色,蓝色' },
  { id: 10, name: '21wraew', value: 'ge,s' },
];

const SpecList = () => {
  const [specs, setSpecs] = useState(mockSpecs);
  const [filteredSpecs, setFilteredSpecs] = useState(mockSpecs);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingSpec, setEditingSpec] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);
  const [form] = Form.useForm();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(212); // 模拟总数

  // 筛选规格列表
  useEffect(() => {
    if (searchTerm) {
      const filtered = specs.filter(spec => 
        spec.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredSpecs(filtered);
    } else {
      setFilteredSpecs(specs);
    }
  }, [searchTerm, specs]);

  // 处理搜索
  const handleSearch = (value) => {
    setSearchTerm(value);
    setCurrentPage(1); // 重置到第一页
  };

  // 打开添加规格模态框
  const handleAddSpec = () => {
    form.resetFields();
    setIsAddModalVisible(true);
  };

  // 打开编辑规格模态框
  const handleEditSpec = (spec) => {
    setEditingSpec(spec);
    form.setFieldsValue({
      name: spec.name,
      value: spec.value,
    });
    setIsEditModalVisible(true);
  };

  // 保存添加/编辑的规格
  const handleSaveSpec = () => {
    form.validateFields().then(values => {
      if (editingSpec) {
        // 编辑规格
        const updatedSpecs = specs.map(spec => 
          spec.id === editingSpec.id ? { ...spec, ...values } : spec
        );
        setSpecs(updatedSpecs);
        message.success('规格更新成功');
        setIsEditModalVisible(false);
      } else {
        // 添加规格
        const newSpec = {
          id: specs.length + 1,
          ...values,
        };
        setSpecs([newSpec, ...specs]);
        message.success('规格添加成功');
        setIsAddModalVisible(false);
      }
    }).catch(info => {
      message.error('表单验证失败');
    });
  };

  // 删除规格
  const handleDeleteSpec = (id) => {
    const updatedSpecs = specs.filter(spec => spec.id !== id);
    setSpecs(updatedSpecs);
    message.success('规格已删除');
  };

  // 批量删除规格
  const handleBatchDelete = () => {
    if (selectedRows.length === 0) {
      message.warning('请选择要删除的规格');
      return;
    }
    const updatedSpecs = specs.filter(spec => 
      !selectedRows.some(row => row.id === spec.id)
    );
    setSpecs(updatedSpecs);
    setSelectedRows([]);
    message.success(`成功删除${selectedRows.length}条规格`);
  };

  // 处理选择行变化
  const handleSelectChange = (newSelectedRows) => {
    setSelectedRows(newSelectedRows);
  };

  // 表格列定义
  const columns = [
    {
      title: '',
      key: 'checkbox',
      type: 'checkbox',
      fixed: 'left',
    },
    {
      title: '规格名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '规格值',
      dataIndex: 'value',
      key: 'value',
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
            onClick={() => handleEditSpec(record)}
            className="edit-button"
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个规格吗?"
            onConfirm={() => handleDeleteSpec(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button 
              type="link" 
              className="delete-button"
              style={{ color: '#ff0000' }}
            >
              <span>删除</span>
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
    <div className="spec-list-container">
      <div className="search-section">
        <Search
          placeholder="请输入规格名称"
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
          onClick={handleAddSpec}
          className="add-button"
        >
          添加
        </Button>
        <Button 
          danger 
          icon={<DeleteOutlined />} 
          onClick={handleBatchDelete}
          className="batch-delete-button"
          disabled={selectedRows.length === 0}
        >
          批量删除
        </Button>
      </div>

      <Table 
        columns={columns} 
        dataSource={filteredSpecs} 
        rowKey="id"
        pagination={pagination}
        className="spec-table"
        rowSelection={{
          onChange: handleSelectChange,
          selectedRowKeys: selectedRows.map(row => row.id),
        }}
      />

      {/* 添加/编辑规格模态框 */}
      <Modal
        title={editingSpec ? "编辑规格" : "添加规格"}
        open={isAddModalVisible || isEditModalVisible}
        onOk={handleSaveSpec}
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
        >
          <Form.Item
            label="规格名称"
            name="name"
            rules={[{ required: true, message: '请输入规格名称' }]}
          >
            <Input />
          </Form.Item>
          
          <Form.Item
            label="规格值"
            name="value"
            rules={[{ required: true, message: '请输入规格值' }]}
            tooltip="多个规格值用逗号分隔"
          >
            <Input placeholder="多个规格值用逗号分隔，例如：红色,白色,蓝色" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SpecList;