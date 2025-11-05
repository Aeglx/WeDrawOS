import React, { useState } from 'react';
import { Card, Table, Button, Space, message } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import './PrivacyPolicy.css';
import EditProtocol from './EditProtocol';

const PrivacyPolicy = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // 模拟数据
  const [policies, setPolicies] = useState([
    {
      id: '1',
      name: '用户协议',
      key: 'USER_AGREEMENT',
    },
    {
      id: '2',
      name: '隐私协议',
      key: 'PRIVACY_POLICY',
    },
    {
      id: '3',
      name: '服务条款',
      key: 'TERMS_OF_SERVICE',
    },
    {
      id: '4',
      name: '关于我们',
      key: 'ABOUT',
    },
  ]);

  // 处理编辑
  const handleEdit = (record) => {
    setEditingItem(record);
    setIsModalVisible(true);
  };

  // 处理保存
  const handleSave = (data) => {
    setPolicies(policies.map(policy => 
      policy.id === editingItem.id ? { ...policy, ...data } : policy
    ));
    setIsModalVisible(false);
    setEditingItem(null);
  };

  // 处理取消
  const handleCancel = () => {
    setIsModalVisible(false);
    setEditingItem(null);
  };

  // 表格列配置
  const columns = [
    {
      title: '协议名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '协议类型',
      dataIndex: 'key',
      key: 'key',
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button 
            type="text" 
            icon={<EditOutlined />} 
            onClick={() => handleEdit(record)}
            style={{ color: '#ff4d4f' }}
          >
            编辑
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="privacy-policy-container">
      <Card>
        <Table
          columns={columns}
          dataSource={policies}
          rowKey="id"
          pagination={false}
          className="policy-table"
        />
      </Card>

      {/* 富文本编辑协议模态框 */}
      <EditProtocol
        visible={isModalVisible}
        onCancel={handleCancel}
        onSave={handleSave}
        initialData={editingItem}
      />
    </div>
  );
};

export default PrivacyPolicy;