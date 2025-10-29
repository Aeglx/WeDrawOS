import React, { useState, useEffect, useRef } from 'react';
import { Layout, Menu, Avatar, Dropdown, Button, Input, Divider } from 'antd';
import { Outlet, useNavigate } from 'react-router-dom';
import {
  HomeOutlined, 
  UserOutlined, 
  ShopOutlined, 
  ShoppingCartOutlined, 
  BarChartOutlined,
  SettingOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  GiftOutlined,
  DollarOutlined,
  ShopOutlined as ShoppingBagOutlined,
  FileTextOutlined,
  StarOutlined,
  WalletOutlined,
  DeleteOutlined,
  MessageOutlined,
  UnorderedListOutlined,
  CarOutlined,
  TagOutlined,
  ThunderboltOutlined,
  ShoppingOutlined,
  PieChartOutlined,
  MenuOutlined,
  ApartmentOutlined,
  CodeOutlined,
  FlagOutlined,
  EditOutlined,
  CommentOutlined,
  PhoneOutlined,
  WechatOutlined,
  CompassOutlined,
  MonitorOutlined,
  CheckCircleOutlined,
  SendOutlined,
  CommentOutlined as BotOutlined,
  CloseOutlined
} from '@ant-design/icons';
import './MainLayout.css';

const { Header, Sider, Content } = Layout;

const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [aiAssistantVisible, setAiAssistantVisible] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  // 预设问题列表
  const presetQuestions = [
    { id: 1, text: '系统主要功能有什么？' },
    { id: 2, text: '如何管理商品？' },
    { id: 3, text: '如何处理订单？' },
    { id: 4, text: '会员管理功能介绍' },
    { id: 5, text: '如何设置促销活动？' }
  ];

  // 初始化欢迎消息
  useEffect(() => {
    if (aiAssistantVisible && messages.length === 0) {
      setMessages([
        {
          id: Date.now(),
          role: 'ai',
          content: '您好，我是WeDrawOS智能助手。我可以帮您解答系统使用相关问题，请输入您的问题或选择下方的常见问题。'
        }
      ]);
    }
  }, [aiAssistantVisible, messages.length]);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 模拟AI回复
  const getAIResponse = (question) => {
    const responses = {
      '系统主要功能有什么？': 'WeDrawOS系统是一个电商管理平台，主要功能包括：商品管理、订单处理、会员管理、店铺管理、促销活动、运营管理、数据分析统计、系统设置等模块。系统支持PC端和移动端，为电商运营提供全方位的管理工具。',
      '如何管理商品？': '商品管理模块允许您添加、编辑、删除商品，设置商品分类、品牌、规格等属性。您可以通过【商品】→【商品管理】→【平台商品】进入商品列表，点击【添加商品】创建新商品，或对现有商品进行编辑操作。',
      '如何处理订单？': '订单管理在【订单】模块中，您可以查看所有订单状态、处理支付、发货、退款等操作。通过【订单】→【商品订单】进入订单列表，使用筛选功能查找特定订单，点击订单详情进行处理。',
      '会员管理功能介绍': '会员管理模块位于【会员】→【会员管理】下，您可以查看会员信息、积分记录、预存款、会员评价等。系统支持会员等级设置、积分管理、充值提现审核等功能，帮助您维护客户关系。',
      '如何设置促销活动？': '促销活动在【促销】模块中管理，支持优惠券、满额活动、秒杀、拼团、砍价等多种促销方式。选择您需要的促销类型，点击【添加活动】设置活动规则、时间、参与商品等信息。'
    };
    
    return responses[question] || '抱歉，我暂时无法回答这个问题。请尝试换一种方式提问或者联系技术支持。';
  };

  // 发送消息
  const sendMessage = (text) => {
    if (!text.trim() || isLoading) return;

    // 添加用户消息
    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: text
    };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // 模拟AI思考延迟
    setTimeout(() => {
      const aiResponse = {
        id: Date.now() + 1,
        role: 'ai',
        content: getAIResponse(text)
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsLoading(false);
    }, 1000);
  };

  // 处理预设问题点击
  const handlePresetQuestionClick = (question) => {
    sendMessage(question);
  };

  // 处理输入框变化
  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  // 处理回车键发送
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputValue);
    }
  };

  // 处理菜单点击
  const handleMenuClick = (e) => {
    navigate(e.key);
  };

  // 处理登出
  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminInfo');
    navigate('/login');
  };

  // 头像下拉菜单
  const userMenuItems = [
    {
      key: '1',
      label: (
        <a onClick={() => navigate('/profile')}>个人设置</a>
      ),
    },
    {
      key: '2',
      label: (
        <a onClick={handleLogout}>退出登录</a>
      ),
    },
  ];

  // 获取管理员信息
  const getAdminInfo = () => {
    const adminInfo = localStorage.getItem('adminInfo');
    return adminInfo ? JSON.parse(adminInfo) : { username: '管理员' };
  };

  const adminInfo = getAdminInfo();
  
  // 菜单配置项
  const menuItems = [
    {
      key: '/',
      label: '仪表盘',
      icon: <HomeOutlined />
    },
    {
      key: '/member',
      label: '会员',
      icon: <UserOutlined />,
      children: [
        {
          key: '/member/member-manage',
          label: '会员管理',
          children: [
            {
              key: '/member/member-manage/member-list',
              label: '会员列表'
            },
            {
              key: '/member/member-manage/recycle-bin',
              label: '回收站'
            },
            {
              key: '/member/member-manage/comment',
              label: '评价',
              children: [
                {
                  key: '/member/member-manage/comment/member-comment',
                  label: '会员评价'
                }
              ]
            },
            {
              key: '/member/member-manage/points',
              label: '积分',
              children: [
                {
                  key: '/member/member-manage/points/points-history',
                  label: '积分历史'
                }
              ]
            },
            {
              key: '/member/member-manage/deposit',
              label: '预存款',
              children: [
                {
                  key: '/member/member-manage/deposit/member-fund',
                  label: '会员资金'
                },
                {
                  key: '/member/member-manage/deposit/recharge-record',
                  label: '充值记录'
                },
                {
                  key: '/member/member-manage/deposit/withdraw-apply',
                  label: '提现申请'
                }
              ]
            }
          ]
        }
      ]
    },
    {
      key: '/order',
      label: '订单',
      icon: <ShoppingCartOutlined />,
      children: [
        {
          key: '/order/product-order',
          label: '商品订单'
        },
        {
          key: '/order/virtual-order',
          label: '虚拟订单'
        },
        {
          key: '/order/after-sale',
          label: '售后',
          children: [
            {
              key: '/order/after-sale/after-sale-manage',
              label: '售后管理'
            },
            {
              key: '/order/after-sale/trade-complaint',
              label: '交易投诉'
            },
            {
              key: '/order/after-sale/after-sale-reason',
              label: '售后原因'
            }
          ]
        },
        {
          key: '/order/flow',
          label: '流水',
          children: [
            {
              key: '/order/flow/collection-record',
              label: '收款记录'
            },
            {
              key: '/order/flow/refund-flow',
              label: '退款流水'
            }
          ]
        }
      ]
    },
    {
      key: '/product',
      label: '商品',
      icon: <ShopOutlined />,
      children: [
        {
          key: '/product/product-manage',
          label: '商品管理',
          children: [
            {
              key: '/product/product-manage/platform-product',
              label: '平台商品'
            },
            {
              key: '/product/product-manage/product-audit',
              label: '商品审核'
            }
          ]
        },
        {
          key: '/product/relation-manage',
          label: '关联管理',
          children: [
            {
              key: '/product/relation-manage/product-category',
              label: '商品分类'
            },
            {
              key: '/product/relation-manage/brand-list',
              label: '品牌列表'
            },
            {
              key: '/product/relation-manage/spec-list',
              label: '规格列表'
            },
            {
              key: '/product/relation-manage/unit',
              label: '计量单位'
            }
          ]
        }
      ]
    },
    {
      key: '/promotion',
      label: '促销',
      icon: <GiftOutlined />,
      children: [
        {
          key: '/promotion/promotion-manage',
          label: '促销管理',
          children: [
            {
              key: '/promotion/promotion-manage/coupon',
              label: '优惠券'
            },
            {
              key: '/promotion/promotion-manage/coupon-activity',
              label: '券活动'
            },
            {
              key: '/promotion/promotion-manage/full-discount',
              label: '满额活动'
            },
            {
              key: '/promotion/promotion-manage/flash-sale',
              label: '秒杀活动'
            },
            {
              key: '/promotion/promotion-manage/group-buy',
              label: '拼团活动'
            },
            {
              key: '/promotion/promotion-manage/bargain',
              label: '砍价活动'
            },
            {
              key: '/promotion/promotion-manage/live-stream',
              label: '直播管理',
              children: [
                {
                  key: '/promotion/promotion-manage/live-stream/live-manage',
                  label: '直播管理'
                }
              ]
            },
            {
              key: '/promotion/promotion-manage/point-activity',
              label: '积分活动',
              children: [
                {
                  key: '/promotion/promotion-manage/point-activity/point-product',
                  label: '积分商品'
                },
                {
                  key: '/promotion/promotion-manage/point-activity/point-category',
                  label: '积分分类'
                }
              ]
            }
          ]
        }
      ]
    },
    {
      key: '/shop',
      label: '店铺',
      icon: <ShoppingBagOutlined />,
      children: [
        {
          key: '/shop/shop-manage',
          label: '店铺管理',
          children: [
            {
              key: '/shop/shop-manage/shop-list',
              label: '店铺列表'
            },
            {
              key: '/shop/shop-manage/shop-audit',
              label: '店铺审核'
            },
            {
              key: '/shop/shop-manage/shop-settlement',
              label: '店铺结算',
              children: [
                {
                  key: '/shop/shop-manage/shop-settlement/shop-settlement',
                  label: '店铺结算'
                },
                {
                  key: '/shop/shop-manage/shop-settlement/merchant-reconciliation',
                  label: '商家对账'
                }
              ]
            }
          ]
        }
      ]
    },
    {
      key: '/operation',
      label: '运营',
      icon: <DollarOutlined />,
      children: [
        {
          key: '/operation/floor-decoration',
          label: '楼层装修',
          children: [
            {
              key: '/operation/floor-decoration/pc',
              label: 'PC端'
            },
            {
              key: '/operation/floor-decoration/mobile',
              label: '移动端'
            }
          ]
        },
        {
          key: '/operation/privacy-policy',
          label: '隐私协议',
          children: [
            {
              key: '/operation/privacy-policy/privacy-policy',
              label: '隐私协议'
            }
          ]
        },
        {
          key: '/operation/distribution',
          label: '分销管理',
          children: [
            {
              key: '/operation/distribution/distribution-setting',
              label: '分销设置'
            },
            {
              key: '/operation/distribution/distribution-apply',
              label: '分销申请'
            },
            {
              key: '/operation/distribution/distributor',
              label: '分销员'
            },
            {
              key: '/operation/distribution/distribution-product',
              label: '分销商品'
            },
            {
              key: '/operation/distribution/distribution-order',
              label: '分销订单'
            },
            {
              key: '/operation/distribution/distribution-withdraw',
              label: '分销提现'
            }
          ]
        },
        {
          key: '/operation/article',
          label: '文章管理',
          children: [
            {
              key: '/operation/article/article-manage',
              label: '文章管理'
            },
            {
              key: '/operation/article/hot-search',
              label: '搜索热词'
            },
            {
              key: '/operation/article/article-category',
              label: '文章分类'
            },
            {
              key: '/operation/article/es-segment',
              label: 'ES分词'
            }
          ]
        },
        {
          key: '/operation/feedback',
          label: '意见反馈',
          children: [
            {
              key: '/operation/feedback/feedback',
              label: '意见反馈'
            }
          ]
        },
        {
          key: '/operation/站内信',
          label: '站内信',
          children: [
            {
              key: '/operation/站内信/站内信',
              label: '站内信'
            }
          ]
        },
        {
          key: '/operation/sms',
          label: '短信管理',
          children: [
            {
              key: '/operation/sms/sms',
              label: '短信'
            }
          ]
        },
        {
          key: '/operation/wechat-official',
          label: '公众号管理',
          children: [
            {
              key: '/operation/wechat-official/basic',
              label: '公众号基础管理',
              children: [
                {
                  key: '/operation/wechat-official/basic/account-info',
                  label: '账号信息'
                },
                {
                  key: '/operation/wechat-official/basic/fan-manage',
                  label: '粉丝管理'
                },
                {
                  key: '/operation/wechat-official/basic/material-manage',
                  label: '素材管理'
                }
              ]
            },
            {
              key: '/operation/wechat-official/message',
              label: '公众号消息管理',
              children: [
                {
                  key: '/operation/wechat-official/message/template-message',
                  label: '模板消息'
                },
                {
                  key: '/operation/wechat-official/message/subscription-notice',
                  label: '订阅通知'
                },
                {
                  key: '/operation/wechat-official/message/chat-manage',
                  label: '对话管理'
                },
                {
                  key: '/operation/wechat-official/message/custom-menu',
                  label: '自定义菜单管理'
                }
              ]
            }
          ]
        },
        {
          key: '/operation/wechat-work',
          label: '企业微信管理',
          children: [
            {
              key: '/operation/wechat-work/external-group',
              label: '企业微信外部群群发'
            },
            {
              key: '/operation/wechat-work/material-manage',
              label: '企业微信素材管理'
            },
            {
              key: '/operation/wechat-work/send-statistics',
              label: '企业微信发送统计'
            }
          ]
        }
      ]
    },
    {
      key: '/statistics',
      label: '统计',
      icon: <BarChartOutlined />,
      children: [
        {
          key: '/statistics/member',
          label: '会员统计'
        },
        {
          key: '/statistics/order',
          label: '订单统计'
        },
        {
          key: '/statistics/product',
          label: '商品统计'
        },
        {
          key: '/statistics/traffic',
          label: '流量统计'
        }
      ]
    },
    {
      key: '/settings',
      label: '设置',
      icon: <SettingOutlined />,
      children: [
        {
          key: '/settings/user-manage',
          label: '用户管理',
          children: [
            {
              key: '/settings/user-manage/user-manage',
              label: '用户管理'
            }
          ]
        },
        {
          key: '/settings/menu-manage',
          label: '菜单管理'
        },
        {
          key: '/settings/department-manage',
          label: '部门管理'
        },
        {
          key: '/settings/role-permission',
          label: '角色权限'
        },
        {
          key: '/settings/system-setting',
          label: '系统设置',
          children: [
            {
              key: '/settings/system-setting/system-setting',
              label: '系统设置'
            },
            {
              key: '/settings/system-setting/oss',
              label: 'OSS资源'
            },
            {
              key: '/settings/system-setting/region',
              label: '行政地区'
            },
            {
              key: '/settings/system-setting/logistics',
              label: '物流公司'
            },
            {
              key: '/settings/system-setting/wechat-message',
              label: '微信消息'
            },
            {
              key: '/settings/system-setting/oauth',
              label: '信任登录'
            },
            {
              key: '/settings/system-setting/payment',
              label: '支付设置'
            },
            {
              key: '/settings/system-setting/captcha',
              label: '验证码'
            },
            {
              key: '/settings/system-setting/sensitive-word',
              label: '敏感词'
            },
            {
              key: '/settings/system-setting/app-version',
              label: 'APP版本'
            }
          ]
        }
      ]
    },
    {
      key: '/logs',
      label: '日志',
      icon: <FileTextOutlined />,
      children: [
        {
          key: '/logs/system-monitor',
          label: '系统监控'
        },
        {
          key: '/logs/log-manage',
          label: '日志管理'
        }
      ]
    }
  ];

  return (
    <>
      <Layout className="main-layout">
        <Sider trigger={null} collapsible collapsed={collapsed} width={128}>
          <div className="logo-container">
            <h1 className={`logo-title ${collapsed ? 'collapsed' : ''}`}>
              WeDrawOS
            </h1>
          </div>
          <Menu
              mode="inline"
              theme="dark"
              selectedKeys={[window.location.pathname]}
              onClick={handleMenuClick}
              inlineCollapsed={collapsed}
              inlineIndent={20}
              items={menuItems}
            >
          </Menu>
        </Sider>
        <Layout className={collapsed ? 'sider-collapsed' : ''}>
          <Header className="header">
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              className="trigger"
            />
            <div className="header-right">
              <Button 
                type="text" 
                icon={<MessageOutlined />}
                className="header-btn"
                title="AI机器人"
                onClick={() => setAiAssistantVisible(true)}
              />
              <Button 
                type="text" 
                icon={<MessageOutlined />} 
                className="header-btn"
                title="站内信"
                onClick={() => navigate('/messages')}
              />
              <Dropdown menu={{ items: userMenuItems }}>
                <div className="user-info">
                  <Avatar className="user-avatar">{adminInfo.username.charAt(0).toUpperCase()}</Avatar>
                  <span>{adminInfo.username}</span>
                </div>
              </Dropdown>
            </div>
          </Header>
          <Content>
            <div className="content-wrapper">
              <Outlet />
            </div>
          </Content>
        </Layout>
      </Layout>
      {aiAssistantVisible && (
        <div className="ai-assistant-overlay" onClick={() => setAiAssistantVisible(false)}>
          <div className="ai-assistant-container" onClick={(e) => e.stopPropagation()}>
            <div className="ai-assistant-header">
              <div className="header-info">
              <MessageOutlined className="ai-icon" />
              <span className="ai-title">WeDrawOS智能助手</span>
            </div>
              <Button 
                type="text" 
                icon={<CloseOutlined />}
                onClick={() => setAiAssistantVisible(false)}
                className="close-btn"
              />
            </div>
            <div className="ai-assistant-content">
              <div className="messages-container">
                {messages.map(message => (
                  <div 
                    key={message.id} 
                    className={`message-item ${message.role === 'ai' ? 'ai-message' : 'user-message'}`}
                  >
                    {message.role === 'ai' && <MessageOutlined className="message-icon" />}
                    <div className="message-content">{message.content}</div>
                  </div>
                ))}
                {isLoading && (
                  <div className="message-item ai-message">
                  <MessageOutlined className="message-icon" />
                  <div className="message-content typing">正在回复...</div>
                </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              {messages.length <= 1 && (
                <div className="preset-questions">
                  <div className="preset-title">常见问题：</div>
                  <div className="preset-list">
                    {presetQuestions.map(question => (
                      <div 
                        key={question.id} 
                        className="preset-item"
                        onClick={() => handlePresetQuestionClick(question.text)}
                      >
                        <MessageOutlined className="preset-icon" />
                        {question.text}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="ai-assistant-footer">
              <Input
                value={inputValue}
                onChange={handleInputChange}
                onPressEnter={handleKeyPress}
                placeholder="请输入您的问题..."
                disabled={isLoading}
                className="ai-input"
                suffix={
                  <Button
                    type="text"
                    icon={<SendOutlined />}
                    onClick={() => sendMessage(inputValue)}
                    disabled={!inputValue.trim() || isLoading}
                  />
                }
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MainLayout;