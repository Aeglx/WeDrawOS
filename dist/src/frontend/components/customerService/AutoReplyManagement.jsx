import React, { useState, useEffect } from 'react';
import AutoReplyRuleForm from './AutoReplyRuleForm';
import './CustomerService.css';

const AutoReplyManagement = () => {
  const [rules, setRules] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRule, setEditingRule] = useState(null);

  useEffect(() => {
    fetchAutoReplyRules();
  }, []);

  const fetchAutoReplyRules = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      // 实际项目中，这里应该调用真实的API
      // const response = await fetch('/api/customer-service/auto-reply/rules');
      // const data = await response.json();
      // setRules(data);
      
      // 模拟数据
      const mockRules = [
        {
          id: '1',
          name: '欢迎问候',
          keywords: ['你好', '您好', 'hi', 'hello', '开始'],
          replyContent: '您好！欢迎使用我们的客服系统。请问有什么可以帮助您的吗？',
          priority: 1,
          active: true,
          createdAt: '2023-06-15T08:30:00Z',
          updatedAt: '2023-06-15T08:30:00Z'
        },
        {
          id: '2',
          name: '订单查询',
          keywords: ['订单', '查询', '单号', '购买记录'],
          replyContent: '请您提供订单号，我们将为您查询订单状态。您也可以在个人中心-我的订单中查看详细信息。',
          priority: 2,
          active: true,
          createdAt: '2023-06-16T10:45:00Z',
          updatedAt: '2023-06-16T10:45:00Z'
        },
        {
          id: '3',
          name: '退款政策',
          keywords: ['退款', '退货', '退钱', '退款政策'],
          replyContent: '根据我们的退款政策，您可以在收到商品后7天内申请无理由退款。请提供订单号，我们将为您处理退款申请。',
          priority: 3,
          active: true,
          createdAt: '2023-06-17T14:20:00Z',
          updatedAt: '2023-06-17T14:20:00Z'
        },
        {
          id: '4',
          name: '联系人工',
          keywords: ['人工', '客服', '转接', '真人'],
          replyContent: '正在为您转接人工客服，请稍等片刻...（系统将在2秒后尝试连接在线客服）',
          priority: 1,
          active: true,
          createdAt: '2023-06-18T09:15:00Z',
          updatedAt: '2023-06-18T16:30:00Z'
        },
        {
          id: '5',
          name: '常见问题',
          keywords: ['常见问题', 'FAQ', '帮助', '指南'],
          replyContent: '您可以访问我们的帮助中心查看常见问题解答：https://example.com/help。如有其他问题，请继续咨询我们。',
          priority: 2,
          active: false,
          createdAt: '2023-06-19T11:00:00Z',
          updatedAt: '2023-06-19T11:00:00Z'
        }
      ];
      
      // 按优先级排序
      mockRules.sort((a, b) => a.priority - b.priority);
      setRules(mockRules);
    } catch (err) {
      setError('获取自动回复规则失败，请稍后重试');
      console.error('Failed to fetch auto-reply rules:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddRule = () => {
    setEditingRule(null);
    setShowAddForm(true);
  };

  const handleEditRule = (rule) => {
    setEditingRule(rule);
    setShowAddForm(true);
  };

  const handleDeleteRule = async (ruleId) => {
    if (!window.confirm('确定要删除这条自动回复规则吗？')) {
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      // 实际项目中，这里应该调用真实的API
      // await fetch(`/api/customer-service/auto-reply/rules/${ruleId}`, {
      //   method: 'DELETE'
      // });
      
      // 模拟删除
      setRules(rules.filter(rule => rule.id !== ruleId));
    } catch (err) {
      setError('删除规则失败，请稍后重试');
      console.error('Failed to delete auto-reply rule:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveRule = async (ruleData) => {
    setIsLoading(true);
    setError('');
    
    try {
      let updatedRules;
      
      if (ruleData.id) {
        // 更新现有规则
        // 实际项目中，这里应该调用真实的API
        // const response = await fetch(`/api/customer-service/auto-reply/rules/${ruleData.id}`, {
        //   method: 'PUT',
        //   headers: {
        //     'Content-Type': 'application/json'
        //   },
        //   body: JSON.stringify(ruleData)
        // });
        // const updatedRule = await response.json();
        
        // 模拟更新
        updatedRules = rules.map(rule => 
          rule.id === ruleData.id ? {
            ...ruleData,
            updatedAt: new Date().toISOString()
          } : rule
        );
      } else {
        // 添加新规则
        // 实际项目中，这里应该调用真实的API
        // const response = await fetch('/api/customer-service/auto-reply/rules', {
        //   method: 'POST',
        //   headers: {
        //     'Content-Type': 'application/json'
        //   },
        //   body: JSON.stringify(ruleData)
        // });
        // const newRule = await response.json();
        
        // 模拟添加
        const newRule = {
          ...ruleData,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        updatedRules = [...rules, newRule];
      }
      
      // 按优先级排序
      updatedRules.sort((a, b) => a.priority - b.priority);
      setRules(updatedRules);
      
      // 重置表单状态
      setShowAddForm(false);
      setEditingRule(null);
    } catch (err) {
      setError(ruleData.id ? '更新规则失败' : '添加规则失败');
      console.error(ruleData.id ? 'Failed to update rule:' : 'Failed to add rule:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingRule(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading && !showAddForm) {
    return (
      <div className="auto-reply-container">
        <div className="cs-loading">
          <div className="cs-loading-spinner"></div>
          <span>加载自动回复规则中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="auto-reply-container">
      {error && (
        <div className="cs-error-banner">
          {error}
          <button onClick={() => setError('')}>×</button>
        </div>
      )}
      
      {showAddForm ? (
        <AutoReplyRuleForm
          rule={editingRule}
          onSubmit={handleSaveRule}
          onCancel={handleCancel}
          isLoading={isLoading}
        />
      ) : (
        <>
          <div className="auto-reply-header">
            <h2>自动回复管理</h2>
            <button 
              className="add-rule-btn"
              onClick={handleAddRule}
              disabled={isLoading}
            >
              添加规则
            </button>
          </div>
          
          <div className="auto-reply-list">
            {rules.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: '#909399' }}>
                <p>暂无自动回复规则</p>
                <button 
                  className="add-rule-btn"
                  onClick={handleAddRule}
                  style={{ marginTop: '16px' }}
                >
                  添加第一条规则
                </button>
              </div>
            ) : (
              rules.map((rule) => (
                <div key={rule.id} className="auto-reply-rule">
                  <div className="auto-reply-rule-header">
                    <div className="auto-reply-rule-name">
                      {rule.name}
                      {!rule.active && (
                        <span style={{ 
                          marginLeft: '8px', 
                          fontSize: '12px', 
                          color: '#909399',
                          padding: '2px 6px',
                          borderRadius: '10px',
                          backgroundColor: '#f0f2f5'
                        }}>
                          已禁用
                        </span>
                      )}
                    </div>
                    <div className="auto-reply-rule-actions">
                      <button
                        className="auto-reply-rule-btn auto-reply-rule-edit"
                        onClick={() => handleEditRule(rule)}
                        disabled={isLoading}
                      >
                        编辑
                      </button>
                      <button
                        className="auto-reply-rule-btn auto-reply-rule-delete"
                        onClick={() => handleDeleteRule(rule.id)}
                        disabled={isLoading}
                      >
                        删除
                      </button>
                    </div>
                  </div>
                  
                  <div className="auto-reply-rule-content">
                    <div className="auto-reply-rule-section">
                      <div className="auto-reply-rule-label">触发关键词</div>
                      <div className="auto-reply-rule-keywords">
                        {rule.keywords.map((keyword, index) => (
                          <span key={index} className="keyword-tag">
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="auto-reply-rule-section">
                      <div className="auto-reply-rule-label">回复内容</div>
                      <div className="auto-reply-rule-reply">
                        {rule.replyContent}
                      </div>
                    </div>
                  </div>
                  
                  <div className="auto-reply-rule-footer">
                    <div>
                      创建时间: {formatDate(rule.createdAt)}
                    </div>
                    <div className="auto-reply-rule-priority">
                      优先级: {rule.priority}
                    </div>
                    <div>
                      更新时间: {formatDate(rule.updatedAt)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default AutoReplyManagement;