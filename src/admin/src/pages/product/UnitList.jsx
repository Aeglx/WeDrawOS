import React, { useState } from 'react';
import { Table, Button, Input, Space, Modal, Form, message, Checkbox } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import './UnitList.css';

const { confirm } = Modal;

// 计量单位页面组件
const UnitList = () => {
  // 状态管理
  const [units, setUnits] = useState([
    { id: '1', name: '1', createTime: '2025-10-01 14:59:47', updateTime: '', operator: 'admin' },
    { id: '2', name: '小时', createTime: '2025-09-26 09:33:58', updateTime: '', operator: 'admin' },
    { id: '3', name: '天', createTime: '2025-09-26 09:33:24', updateTime: '', operator: 'admin' },
    { id: '4', name: '次', createTime: '2025-09-26 09:33:11', updateTime: '', operator: 'admin' },
    { id: '5', name: '瓶', createTime: '2025-09-23 19:40:04', updateTime: '', operator: 'admin' },
    { id: '6', name: '个', createTime: '2025-09-22 16:38:04', updateTime: '', operator: 'admin' },
    { id: '7', name: '公斤', createTime: '2025-08-13 10:08:21', updateTime: '2025-09-29 19:49:09', operator: 'admin' },
    { id: '8', name: '件', createTime: '2025-08-13 10:08:08', updateTime: '', operator: 'admin' },
    { id: '9', name: '¥', createTime: '2025-08-13 10:07:56', updateTime: '', operator: 'admin' }
  ]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [currentUnit, setCurrentUnit] = useState(null);
  const [addForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  // 处理全选/取消全选
  const handleSelectAll = (selected, selectedRows) => {
    setSelectedRows(selectedRows);
  };

  // 处理选择行
  const handleSelect = (selectedRowKeys, selectedRows) => {
    setSelectedRows(selectedRows);
  };

  // 打开添加模态框
  const showAddModal = () => {
    addForm.resetFields();
    setIsAddModalVisible(true);
  };

  // 打开编辑模态框
  const showEditModal = (record) => {
    setCurrentUnit(record);
    editForm.setFieldsValue({ name: record.name });
    setIsEditModalVisible(true);
  };

  // 处理添加计量单位
  const handleAddUnit = () => {
    addForm.validateFields().then(values => {
      // 检查是否已存在相同名称的计量单位
      const exists = units.some(unit => unit.name === values.name);
      if (exists) {
        message.error('该计量单位已存在');
        return;
      }

      const newUnit = {
        id: Date.now().toString(),
        name: values.name,
        createTime: new Date().toLocaleString('zh-CN'),
        updateTime: '',
        operator: 'admin'
      };

      setUnits([...units, newUnit]);
      setIsAddModalVisible(false);
      message.success('添加成功');
    });
  };

  // 处理编辑计量单位
  const handleEditUnit = () => {
    editForm.validateFields().then(values => {
      // 检查是否已存在相同名称的计量单位（排除当前编辑的记录）
      const exists = units.some(unit => unit.name === values.name && unit.id !== currentUnit.id);
      if (exists) {
        message.error('该计量单位已存在');
        return;
      }

      const updatedUnits = units.map(unit => {
        if (unit.id === currentUnit.id) {
          return {
            ...unit,
            name: values.name,
            updateTime: new Date().toLocaleString('zh-CN')
          };
        }
        return unit;
      });

      setUnits(updatedUnits);
      setIsEditModalVisible(false);
      message.success('修改成功');
    });
  };

  // 处理删除单个计量单位
  const handleDeleteUnit = (record) => {
    confirm({
      title: '确认删除',
      content: `确定要删除计量单位 "${record.name}" 吗？`,
      onOk() {
        setUnits(units.filter(unit => unit.id !== record.id));
        message.success('删除成功');
      }
    });
  };

  // 处理批量删除
  const handleBatchDelete = () => {
    if (selectedRows.length === 0) {
      message.warning('请选择要删除的计量单位');
      return;
    }

    confirm({
      title: '确认批量删除',
      content: `确定要删除选中的 ${selectedRows.length} 个计量单位吗？`,
      onOk() {
        const idsToDelete = selectedRows.map(row => row.id);
        setUnits(units.filter(unit => !idsToDelete.includes(unit.id)));
        setSelectedRows([]);
        message.success(`成功删除 ${selectedRows.length} 个计量单位`);
      }
    });
  };

  // 表格列配置
  const columns = [
    {
      title: <Checkbox style={{ margin: 0 }} />,
      key: 'selection',
      width: 40,
      render: (_, record) => (
        <Checkbox 
          checked={selectedRows.some(row => row.id === record.id)} 
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedRows([...selectedRows, record]);
            } else {
              setSelectedRows(selectedRows.filter(row => row.id !== record.id));
            }
          }}
        />
      )
    },
    {
      title: '计量单位',
      dataIndex: 'name',
      key: 'name',
      width: 180,
      style: { fontSize: '12px' },
      onHeaderCell: () => ({ style: { fontSize: '12px' } })
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 180,
      style: { fontSize: '12px' },
      onHeaderCell: () => ({ style: { fontSize: '12px' } })
    },
    {
      title: '更新时间',
      dataIndex: 'updateTime',
      key: 'updateTime',
      width: 180,
      style: { fontSize: '12px' },
      onHeaderCell: () => ({ style: { fontSize: '12px' } })
    },
    {
      title: '操作人',
      dataIndex: 'operator',
      key: 'operator',
      width: 100,
      style: { fontSize: '12px' },
      onHeaderCell: () => ({ style: { fontSize: '12px' } })
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      style: { fontSize: '12px' },
      onHeaderCell: () => ({ style: { fontSize: '12px' } }),
      render: (_, record) => (
        <Space size="middle">
          <Button 
            type="primary" 
            size="small"
            icon={<EditOutlined />}
            className="edit-button"
            onClick={() => showEditModal(record)}
          >
            修改
          </Button>
          <Button 
            size="small" 
            danger 
            icon={<DeleteOutlined />}
            className="delete-button"
            onClick={() => handleDeleteUnit(record)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  // 分页配置
  const pagination = {
    current: currentPage,
    pageSize: pageSize,
    total: units.length,
    onChange: (page) => setCurrentPage(page),
    showTotal: (total) => `共 ${total} 条`,
    showQuickJumper: true,
    showSizeChanger: true,
    pageSizeOptions: ['10', '20', '50'],
    size: 'small',
    style: { fontSize: '12px', marginRight: 0, textAlign: 'right' }
  };

  // Checkbox组件已从antd直接导入

  return (
    <div className="unit-list">
      {/* 顶部操作栏 */}
      <div className="top-actions" style={{ marginBottom: '16px', padding: '16px 0', borderBottom: '1px solid #f0f0f0' }}>
        <Space>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={showAddModal}
            style={{ backgroundColor: '#ff0000', borderColor: '#ff0000' }}
          >
            添加
          </Button>
          <Button 
            danger 
            icon={<DeleteOutlined />}
            onClick={handleBatchDelete}
            disabled={selectedRows.length === 0}
          >
            批量删除
          </Button>
        </Space>
      </div>

      {/* 计量单位表格 */}
      <Table
        columns={columns}
        dataSource={units}
        rowKey="id"
        pagination={pagination}
        style={{ fontSize: '12px' }}
        className="ant-table"
      />

      {/* 添加计量单位模态框 */}
      <Modal
        title="添加计量单位"
        open={isAddModalVisible}
        onOk={handleAddUnit}
        onCancel={() => setIsAddModalVisible(false)}
        okText="确定"
        cancelText="取消"
        okButtonProps={{ style: { backgroundColor: '#ff0000', borderColor: '#ff0000' } }}
      >
        <Form form={addForm} layout="vertical">
          <Form.Item
            name="name"
            label="计量单位名称"
            rules={[{ required: true, message: '请输入计量单位名称' }]}
          >
            <Input placeholder="请输入计量单位名称" style={{ fontSize: '12px' }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 编辑计量单位模态框 */}
      <Modal
        title="修改计量单位"
        open={isEditModalVisible}
        onOk={handleEditUnit}
        onCancel={() => setIsEditModalVisible(false)}
        okText="确定"
        cancelText="取消"
        okButtonProps={{ style: { backgroundColor: '#ff0000', borderColor: '#ff0000' } }}
      >
        <Form form={editForm} layout="vertical">
          <Form.Item
            name="name"
            label="计量单位名称"
            rules={[{ required: true, message: '请输入计量单位名称' }]}
          >
            <Input placeholder="请输入计量单位名称" style={{ fontSize: '12px' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UnitList;