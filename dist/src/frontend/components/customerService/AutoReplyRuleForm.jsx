import React, { useState, useEffect } from 'react';
import './CustomerService.css';

const AutoReplyRuleForm = ({ rule = null, onSubmit, onCancel, isLoading }) => {
  const [name, setName] = useState('');
  const [keywords, setKeywords] = useState([]);
  const [newKeyword, setNewKeyword] = useState('');
  const [replyContent, setReplyContent] = useState('');
  const [priority, setPriority] = useState(1);
  const [active, setActive] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (rule) {
      setName(rule.name || '');
      setKeywords(rule.keywords || []);
      setReplyContent(rule.replyContent || '');
      setPriority(rule.priority || 1);
      setActive(rule.active !== undefined ? rule.active : true);
    }
  }, [rule]);

  const handleAddKeyword = () => {
    if (newKeyword.trim() && !keywords.includes(newKeyword.trim())) {
      setKeywords([...keywords, newKeyword.trim()]);
      setNewKeyword('');
      setError('');
    }
  };

  const handleRemoveKeyword = (keywordToRemove) => {
    setKeywords(keywords.filter(keyword => keyword !== keywordToRemove));
  };

  const handleKeywordKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddKeyword();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 表单验证
    if (!name.trim()) {
      setError('规则名称不能为空');
      return;
    }
    
    if (keywords.length === 0) {
      setError('请至少添加一个关键词');
      return;
    }
    
    if (!replyContent.trim()) {
      setError('回复内容不能为空');
      return;
    }
    
    // 构建规则数据
    const ruleData = {
      name: name.trim(),
      keywords,
      replyContent: replyContent.trim(),
      priority: parseInt(priority, 10),
      active
    };
    
    if (rule) {
      ruleData.id = rule.id;
    }
    
    setError('');
    onSubmit(ruleData);
  };

  return (
    <div className="auto-reply-form">
      <h3>{rule ? '编辑自动回复规则' : '添加自动回复规则'}</h3>
      
      {error && (
        <div className="cs-error-banner" style={{ marginBottom: '16px' }}>
          {error}
          <button onClick={() => setError('')}>×</button>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">规则名称 *</label>
          <input
            type="text"
            className="form-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="请输入规则名称"
            disabled={isLoading}
          />
        </div>
        
        <div className="form-group">
          <label className="form-label">关键词 *</label>
          <div style={{ marginBottom: '8px' }}>
            <input
              type="text"
              className="form-input"
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              onKeyPress={handleKeywordKeyPress}
              placeholder="输入关键词后按Enter添加"
              disabled={isLoading}
            />
          </div>
          <div className="form-tags">
            {keywords.map((keyword, index) => (
              <span key={index} className="keyword-tag">
                {keyword}
                <button
                  type="button"
                  onClick={() => handleRemoveKeyword(keyword)}
                  disabled={isLoading}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'inherit',
                    marginLeft: '6px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
        
        <div className="form-group">
          <label className="form-label">回复内容 *</label>
          <textarea
            className="form-textarea"
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder="请输入自动回复内容"
            rows={4}
            disabled={isLoading}
          />
        </div>
        
        <div className="form-group">
          <label className="form-label">优先级</label>
          <select
            className="form-input"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            disabled={isLoading}
          >
            {[1, 2, 3, 4, 5].map((level) => (
              <option key={level} value={level}>
                {level} - {level === 1 ? '最高' : level === 5 ? '最低' : '中等'}
              </option>
            ))}
          </select>
        </div>
        
        <div className="form-group">
          <label className="form-label">状态</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="radio"
              id="active"
              name="status"
              value="active"
              checked={active}
              onChange={() => setActive(true)}
              disabled={isLoading}
            />
            <label htmlFor="active">启用</label>
            <input
              type="radio"
              id="inactive"
              name="status"
              value="inactive"
              checked={!active}
              onChange={() => setActive(false)}
              disabled={isLoading}
            />
            <label htmlFor="inactive">禁用</label>
          </div>
        </div>
        
        <div className="form-actions">
          <button
            type="button"
            className="cancel-btn"
            onClick={onCancel}
            disabled={isLoading}
          >
            取消
          </button>
          <button
            type="submit"
            className="submit-btn"
            disabled={isLoading}
          >
            {isLoading ? '保存中...' : '保存'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AutoReplyRuleForm;