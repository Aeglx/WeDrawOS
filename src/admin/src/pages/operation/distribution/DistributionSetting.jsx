import React, { useState, useEffect } from 'react';
import { Card, Switch, Input, Button, message } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import './DistributionSetting.css';

const DistributionSetting = () => {
  // 状态管理
  const [distributionEnabled, setDistributionEnabled] = useState(true);
  const [distributionRatio, setDistributionRatio] = useState('0');
  const [isEditing, setIsEditing] = useState(false);
  const [originalRatio, setOriginalRatio] = useState('0');

  // 初始化数据（模拟从后端获取）
  useEffect(() => {
    // 这里应该调用API获取实际的分销设置数据
    // 模拟数据：分销功能开启，分销比例为0%
    setDistributionEnabled(true);
    setDistributionRatio('0');
    setOriginalRatio('0');
  }, []);

  // 处理分销功能开关变化
  const handleSwitchChange = (checked) => {
    setDistributionEnabled(checked);
    // 实际项目中应该调用API更新设置
    message.info(checked ? '已开启分销功能' : '已关闭分销功能');
  };

  // 开始编辑分销比例
  const handleEdit = () => {
    setOriginalRatio(distributionRatio);
    setIsEditing(true);
  };

  // 取消编辑
  const handleCancel = () => {
    setDistributionRatio(originalRatio);
    setIsEditing(false);
  };

  // 保存分销比例
  const handleSave = () => {
    // 验证输入
    const ratio = parseFloat(distributionRatio);
    if (isNaN(ratio) || ratio < 0 || ratio > 100) {
      message.error('请输入有效的分销比例（0-100）');
      return;
    }
    
    // 实际项目中应该调用API更新设置
    message.success('分销比例保存成功');
    setOriginalRatio(distributionRatio);
    setIsEditing(false);
  };

  // 处理分销比例输入变化
  const handleRatioChange = (e) => {
    const value = e.target.value;
    // 只允许输入数字和小数点
    if (/^\d*\.?\d*$/.test(value) || value === '') {
      setDistributionRatio(value);
    }
  };

  return (
    <div className="distribution-setting-container">
      <Card className="distribution-setting-card">
        
        <div className="setting-item">
          <div className="setting-label">
            <span>是否开启分销</span>
          </div>
          <div className="setting-control">
            <Switch 
              checked={distributionEnabled} 
              onChange={handleSwitchChange}
              checkedChildren="开启"
              unCheckedChildren="关闭"
            />
          </div>
        </div>
        
        <div className="setting-item">
          <div className="setting-label">
            <span>分销比例（%）</span>
          </div>
          <div className="setting-control">
            {isEditing ? (
              <div className="edit-controls">
                <Input
                  type="text"
                  value={distributionRatio}
                  onChange={handleRatioChange}
                  placeholder="请输入分销比例"
                  style={{ width: 150, marginRight: 16 }}
                  onPressEnter={handleSave}
                />
                <Button 
                  type="primary" 
                  onClick={handleSave}
                  style={{ marginRight: 8 }}
                >
                  保存
                </Button>
                <Button onClick={handleCancel}>
                  取消
                </Button>
              </div>
            ) : (
              <div className="display-controls">
                <span className="ratio-value">{distributionRatio}</span>
                <Button 
                  type="text" 
                  icon={<EditOutlined />} 
                  onClick={handleEdit}
                  disabled={!distributionEnabled}
                >
                  编辑
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default DistributionSetting;