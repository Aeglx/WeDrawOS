import React, { useState, useEffect } from 'react';
import { Button, Input, message } from 'antd';
import { CloseOutlined, SendOutlined, BotOutlined } from '@ant-design/icons';
import './AIAssistant.css';

const { TextArea } = Input;

// 预设的常见问题和回答
const presetQuestions = [
  'LILISHOP 主要功能有什么？',
  'LILISHOP 如何收费？',
  '需要转人工服务',
  '定时任务',
  '微信支付'
];

const AIAssistant = ({ visible, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 初始化欢迎消息
  useEffect(() => {
    if (visible) {
      setMessages([
        {
          role: 'bot',
          content: '您好，我是 LILISHOP 小助手，您可以向我提出 LILISHOP 使用问题。'
        }
      ]);
    }
  }, [visible]);

  // 模拟AI回复
  const getAIResponse = (question) => {
    const responses = {
      'LILISHOP 主要功能有什么？': 'LILISHOP 系统主要功能分为卖家端和平台管理端两大角色模块，核心功能如下：\n\n1. 商品管理：商品上架、编辑、分类、属性设置等\n2. 订单管理：订单处理、发货、售后等\n3. 会员管理：会员信息、等级、积分等\n4. 促销活动：优惠券、满减、秒杀等\n5. 数据分析：销售报表、流量统计等\n6. 系统设置：权限管理、基础配置等',
      'LILISHOP 如何收费？': 'LILISHOP 提供多种收费模式，包括：\n\n1. 一次性购买：永久使用系统，提供基础技术支持\n2. SaaS订阅：按月或按年付费，包含系统更新和技术支持\n3. 定制开发：根据需求进行定制，费用根据功能复杂度评估\n\n具体价格请联系商务咨询。',
      '需要转人工服务': '正在为您转接人工客服，请稍候...\n\n您也可以拨打客服电话：400-123-4567，或添加客服微信：lilishop_service',
      '定时任务': 'LILISHOP 支持多种定时任务，包括：\n\n1. 商品定时上下架\n2. 促销活动定时开启\n3. 自动发货\n4. 数据备份\n\n您可以在「系统设置-定时任务」中进行配置。',
      '微信支付': '配置微信支付的步骤：\n\n1. 登录微信支付商户平台获取商户号、API密钥\n2. 在 LILISHOP 系统设置-支付设置中填写相关信息\n3. 配置回调URL\n4. 完成签名验证\n\n配置完成后即可使用微信支付功能。'
    };

    return responses[question] || `感谢您的提问！关于"${question}"，我需要查询更多信息，请稍后...`;
  };

  // 发送消息
  const handleSend = () => {
    if (!inputValue.trim()) {
      message.warning('请输入问题');
      return;
    }

    const newUserMessage = { role: 'user', content: inputValue };
    setMessages(prev => [...prev, newUserMessage]);
    setInputValue('');
    setIsLoading(true);

    // 模拟AI思考和回复的延迟
    setTimeout(() => {
      const aiResponse = getAIResponse(inputValue);
      const newAIMessage = { role: 'bot', content: aiResponse };
      setMessages(prev => [...prev, newAIMessage]);
      setIsLoading(false);
    }, 800);
  };

  // 处理预设问题点击
  const handlePresetQuestionClick = (question) => {
    setInputValue(question);
    handleSend();
  };

  // 处理Enter键发送
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!visible) return null;

  return (
    <div className="ai-assistant-overlay">
      <div className="ai-assistant-container">
        {/* 头部 */}
        <div className="ai-assistant-header">
          <div className="ai-assistant-title">
            <BotOutlined className="ai-icon" />
            <span>LILISHOP 小助手</span>
          </div>
          <Button 
            type="text" 
            icon={<CloseOutlined />} 
            onClick={onClose}
            className="close-btn"
          />
        </div>

        {/* 内容区域 */}
        <div className="ai-assistant-content">
          {/* 消息列表 */}
          <div className="messages-container">
            {messages.map((msg, index) => (
              <div key={index} className={`message-item ${msg.role}`}>
                {msg.role === 'bot' && <BotOutlined className="message-icon" />}
                <div className={`message-content ${msg.role}`}>
                  {msg.content.split('\n').map((line, i) => (
                    <div key={i}>{line}</div>
                  ))}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="message-item bot">
                <BotOutlined className="message-icon" />
                <div className="message-content bot loading">
                  <span className="loading-dot"></span>
                  <span className="loading-dot"></span>
                  <span className="loading-dot"></span>
                </div>
              </div>
            )}
          </div>

          {/* 预设问题 */}
          {messages.length === 1 && (
            <div className="preset-questions">
              {presetQuestions.map((question, index) => (
                <div 
                  key={index} 
                  className="preset-question-item"
                  onClick={() => handlePresetQuestionClick(question)}
                >
                  {question}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 输入区域 */}
        <div className="ai-assistant-footer">
          <TextArea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="请输入您的问题..."
            rows={2}
            className="input-area"
            maxLength={500}
          />
          <Button 
            type="primary" 
            icon={<SendOutlined />} 
            onClick={handleSend}
            loading={isLoading}
            className="send-btn"
          />
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;