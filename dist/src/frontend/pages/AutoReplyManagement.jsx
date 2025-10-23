import React, { useState, useEffect } from 'react';
import { Card, Button, Table, Input, Form, Modal, Tag, Space, Divider, message, Select } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Search } = Input;
const { Option: SelectOption } = Select;

/**
 * 自动回复规则管理页面
 */
const AutoReplyManagement = () => {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [form] = Form.useForm();
  const [selectedKeys, setSelectedKeys] = useState([]);

  // 初始化加载规则列表
  useEffect(() => {
    fetchRules();
  }, []);

  // 获取自动回复规则列表
  const fetchRules = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/customer-service/auto-reply/rules');
      setRules(response.data.rules || []);
    } catch (error) {
      console.error('获取规则列表失败:', error);
      message.error('获取规则列表失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 处理搜索
  const handleSearch = async (value) => {
    setSearchText(value);
    try {
      setLoading(true);
      const response = await axios.get('/api/customer-service/auto-reply/rules', {
        params: { search: value }
      });
      setRules(response.data.rules || []);
    } catch (error) {
      console.error('搜索规则失败:', error);
      message.error('搜索规则失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 打开添加/编辑规则模态框
  const openModal = (rule = null) => {
    setEditingRule(rule);
    if (rule) {
      form.setFieldsValue({
        name: rule.name,
        keywords: rule.keywords ? rule.keywords.join(', ') : '',
        replyContent: rule.replyContent,
        priority: rule.priority,
        status: rule.status,
        matchType: rule.matchType || 'any',
        replyType: rule.replyType || 'text',
        delay: rule.delay || 0
      });
    } else {
      form.resetFields();
      form.setFieldsValue({
        priority: 5, // 默认优先级
        status: 'active',
        matchType: 'any',
        replyType: 'text',
        delay: 0
      });
    }
    setModalVisible(true);
  };

  // 关闭模态框
  const closeModal = () => {
    setModalVisible(false);
    setEditingRule(null);
    form.resetFields();
  };

  // 保存规则
  const handleSaveRule = async () => {
    try {
      const values = await form.validateFields();
      // 将关键词字符串转换为数组
      const processedValues = {
        ...values,
        keywords: values.keywords ? values.keywords.split(',').map(k => k.trim()).filter(k => k) : []
      };

      if (editingRule) {
        // 更新规则
        await axios.put(`/api/customer-service/auto-reply/rules/${editingRule.id}`, processedValues);
        message.success('规则更新成功');
      } else {
        // 创建新规则
        await axios.post('/api/customer-service/auto-reply/rules', processedValues);
        message.success('规则创建成功');
      }
      closeModal();
      fetchRules();
    } catch (error) {
      console.error('保存规则失败:', error);
      message.error('保存规则失败，请稍后重试');
    }
  };

  // 删除规则
  const handleDeleteRule = (ruleId) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除此规则吗？',
      onOk: async () => {
        try {
          await axios.delete(`/api/customer-service/auto-reply/rules/${ruleId}`);
          message.success('规则删除成功');
          fetchRules();
        } catch (error) {
          console.error('删除规则失败:', error);
          message.error('删除规则失败，请稍后重试');
        }
      }
    });
  };

  // 批量删除规则
  const handleBatchDelete = () => {
    if (selectedKeys.length === 0) {
      message.warning('请选择要删除的规则');
      return;
    }

    Modal.confirm({
      title: '确认批量删除',
      content: `确定要删除选中的 ${selectedKeys.length} 条规则吗？`,
      onOk: async () => {
        try {
          await axios.post('/api/customer-service/auto-reply/rules/batch-delete', {
            ids: selectedKeys
          });
          message.success('批量删除成功');
          setSelectedKeys([]);
          fetchRules();
        } catch (error) {
          console.error('批量删除规则失败:', error);
          message.error('批量删除规则失败，请稍后重试');
        }
      }
    });
  };

  // 更新规则状态
  const handleToggleStatus = async (ruleId, currentStatus) => {
    try {
      await axios.put(`/api/customer-service/auto-reply/rules/${ruleId}/status`, {
        status: currentStatus === 'active' ? 'inactive' : 'active'
      });
      message.success('状态更新成功');
      fetchRules();
    } catch (error) {
      console.error('更新状态失败:', error);
      message.error('更新状态失败，请稍后重试');
    }
  };

  // 表格列配置
  const columns = [
    {
      title: '规则名称',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <a onClick={() => openModal(record)}>{text}</a>
      )
    },
    {
      title: '关键词',
      dataIndex: 'keywords',
      key: 'keywords',
      render: (keywords) => {
        if (!keywords || keywords.length === 0) return '无';
        return (
          <Space>
            {keywords.slice(0, 3).map((keyword, index) => (
              <Tag key={index}>{keyword}</Tag>
            ))}
            {keywords.length > 3 && <Tag>+{keywords.length - 3}个</Tag>}
          </Space>
        );
      }
    },
    {
      title: '回复类型',
      dataIndex: 'replyType',
      key: 'replyType',
      render: (type) => (
        <Tag color={type === 'text' ? 'blue' : 'green'}>
          {type === 'text' ? '文本' : '富文本'}
        </Tag>
      )
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      sorter: (a, b) => a.priority - b.priority,
      render: (priority) => (
        <span>
          {Array(priority).fill(0).map((_, i) => (
            <span key={i}>⭐</span>
          ))}
        </span>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status, record) => (
        <Tag 
          color={status === 'active' ? 'green' : 'gray'} 
          onClick={() => handleToggleStatus(record.id, status)}
          style={{ cursor: 'pointer' }}
        >
          {status === 'active' ? '启用' : '禁用'}
        </Tag>
      )
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (time) => new Date(time).toLocaleString()
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button type="link" icon={<EditOutlined />} onClick={() => openModal(record)}>编辑</Button>
          <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleDeleteRule(record.id)}>删除</Button>
        </Space>
      )
    }
  ];

  // 处理表格选择
  const onSelectChange = (newSelectedKeys) => {
    setSelectedKeys(newSelectedKeys);
  };

  const rowSelection = {
    selectedRowKeys: selectedKeys,
    onChange: onSelectChange,
  };

  return (
    <div className="auto-reply-management">
      <Card
        title="自动回复规则管理"
        extra={
          <Space>
            {selectedKeys.length > 0 && (
              <Button danger onClick={handleBatchDelete}>
                批量删除 ({selectedKeys.length})
              </Button>
            )}
            <Search
              placeholder="搜索规则"
              allowClear
              enterButton={<SearchOutlined />}
              size="small"
              style={{ width: 200 }}
              onSearch={handleSearch}
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>
              添加规则
            </Button>
          </Space>
        }
      >
        <Table
          rowSelection={rowSelection}
          columns={columns}
          dataSource={rules}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* 添加/编辑规则模态框 */}
      <Modal
        title={editingRule ? "编辑自动回复规则" : "添加自动回复规则"}
        visible={modalVisible}
        onOk={handleSaveRule}
        onCancel={closeModal}
        okText="保存"
        cancelText="取消"
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            name="name"
            label="规则名称"
            rules={[{ required: true, message: '请输入规则名称' }]}
          >
            <Input placeholder="请输入规则名称" />
          </Form.Item>

          <Form.Item
            name="keywords"
            label="关键词"
            tooltip="多个关键词用逗号分隔"
            rules={[{ required: true, message: '请输入至少一个关键词' }]}
          >
            <Input placeholder="请输入关键词，多个关键词用逗号分隔" />
          </Form.Item>

          <Form.Item
            name="matchType"
            label="匹配类型"
            rules={[{ required: true, message: '请选择匹配类型' }]}
          >
            <Select placeholder="请选择匹配类型">
              <SelectOption value="any">包含任一关键词</SelectOption>
              <SelectOption value="all">包含所有关键词</SelectOption>
              <SelectOption value="exact">完全匹配</SelectOption>
            </Select>
          </Form.Item>

          <Form.Item
            name="replyType"
            label="回复类型"
            rules={[{ required: true, message: '请选择回复类型' }]}
          >
            <Select placeholder="请选择回复类型">
              <SelectOption value="text">文本</SelectOption>
              <SelectOption value="rich">富文本</SelectOption>
            </Select>
          </Form.Item>

          <Form.Item
            name="replyContent"
            label="回复内容"
            rules={[{ required: true, message: '请输入回复内容' }]}
          >
            <Input.TextArea rows={4} placeholder="请输入回复内容" />
          </Form.Item>

          <Form.Item
            name="priority"
            label="优先级"
            tooltip="数字越大，优先级越高"
            rules={[{ required: true, type: 'number', min: 1, max: 10 }]}
          >
            <Input.Number min={1} max={10} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="delay"
            label="延迟回复(秒)"
            tooltip="设置自动回复的延迟时间"
            rules={[{ type: 'number', min: 0 }]}
          >
            <Input.Number min={0} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="status"
            label="状态"
          >
            <Select placeholder="请选择状态">
              <SelectOption value="active">启用</SelectOption>
              <SelectOption value="inactive">禁用</SelectOption>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AutoReplyManagement;