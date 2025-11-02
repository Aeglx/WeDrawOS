import React, { useState, useEffect } from 'react';
import { Button, Layout, Menu, Input, message, Empty, Card, Radio } from 'antd';
import { useLocation } from 'react-router-dom';
import './FloorDesigner.css';

const { Header, Sider, Content } = Layout;
const { Search } = Input;
const { Group } = Radio;

const FloorDesigner = () => {
  const location = useLocation();
  const [selectedMenuItem, setSelectedMenuItem] = useState('1');
  const [pageName, setPageName] = useState('');
  const [pageId, setPageId] = useState('');
  const [moduleStyles, setModuleStyles] = useState({});

  // 从URL参数中获取页面信息
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const id = params.get('id');
    const name = params.get('name');
    
    if (id) setPageId(id);
    if (name) setPageName(decodeURIComponent(name));
  }, [location.search]);

  // 处理菜单项点击
  const handleMenuClick = (e) => {
    const moduleId = e.key;
    setSelectedMenuItem(moduleId);
    
    // 通过key从menuItems数组中查找对应的标签文本
    const selectedItem = menuItems.find(item => item.key === moduleId);
    if (selectedItem) {
      message.info(`选择了${selectedItem.label}模块`);
    }
    
    // 如果是支持样式选择的模块，且当前没有选择样式，设置默认样式
    if (moduleConfigMap[moduleId]?.hasStyleSelector && !moduleStyles[moduleId]) {
      const moduleStyleConfig = getCurrentModuleStyles();
      if (moduleStyleConfig.options && moduleStyleConfig.options.length > 0) {
        const defaultStyle = moduleStyleConfig.options[0].value;
        handleStyleChange(moduleId, defaultStyle);
      }
    }
  };

  // 处理样式变更
  const handleStyleChange = (moduleId, styleValue) => {
    setModuleStyles(prev => ({
      ...prev,
      [moduleId]: styleValue
    }));
  };

  // 模块配置映射表
  const moduleConfigMap = {
    '1': { name: '基础设置', hasStyleSelector: false },
    '2': { name: '面包屑设置', hasStyleSelector: true },
    '3': { name: '商城广告', hasStyleSelector: true },
    '4': { name: '商城活动', hasStyleSelector: true },
    '5': { name: '推广广告', hasStyleSelector: true },
    '6': { name: '官方推荐', hasStyleSelector: true },
    '7': { name: '热门活动', hasStyleSelector: true },
    '8': { name: '商品推荐', hasStyleSelector: true },
    '9': { name: '限时秒杀', hasStyleSelector: true },
    '10': { name: '为你推荐', hasStyleSelector: true },
    '11': { name: '商品榜单', hasStyleSelector: true },
    '12': { name: '底部导航', hasStyleSelector: true }
  };

  // 获取模块配置和样式
  const getCurrentModuleConfig = () => {
    return moduleConfigMap[selectedMenuItem] || { name: '未知模块', hasStyleSelector: false };
  };

  // 内联样式选择器组件
  const InlineStyleSelector = ({ moduleName, styleOptions, selectedStyle, onStyleChange }) => {
    // 处理样式选择变更
    const handleStyleSelect = (e) => {
      const newStyle = e.target.value;
      onStyleChange(newStyle);
      message.success(`已选择${moduleName}的${styleOptions.find(option => option.value === newStyle)?.label}样式`);
    };

    return (
      <Card 
        title={`${moduleName}样式选择`} 
        className="style-selector-card"
        variant="outlined"
      >
        <Group 
          value={selectedStyle} 
          onChange={handleStyleSelect}
          className="style-radio-group"
        >
          {styleOptions.map((option) => (
            <div key={option.value} className="style-option-container">
              <Radio value={option.value} className="style-radio">
                <div className="style-preview">
                  <div className={`style-demo ${option.previewClass}`}>
                    {option.previewContent}
                  </div>
                  <span className="style-label">{option.label}</span>
                </div>
              </Radio>
            </div>
          ))}
        </Group>
      </Card>
    );
  };

  // 获取当前模块的样式配置
  const getCurrentModuleStyles = () => {
    const styleConfigs = {
      '2': {
        moduleName: '面包屑',
        options: [
          {
            value: 'breadcrumb-1',
            label: '经典灰色',
            previewClass: 'breadcrumb-style-1',
            previewContent: (
              <div>
                <span className="breadcrumb-item">首页</span>
                <span className="breadcrumb-separator">/</span>
                <span className="breadcrumb-item">商品分类</span>
                <span className="breadcrumb-separator">/</span>
                <span className="breadcrumb-item breadcrumb-active">商品详情</span>
              </div>
            )
          },
          {
            value: 'breadcrumb-2',
            label: '蓝色主题',
            previewClass: 'breadcrumb-style-2',
            previewContent: (
              <div>
                <span className="breadcrumb-item">首页</span>
                <span className="breadcrumb-separator">→</span>
                <span className="breadcrumb-item">商品分类</span>
                <span className="breadcrumb-separator">→</span>
                <span className="breadcrumb-item breadcrumb-active">商品详情</span>
              </div>
            )
          },
          {
            value: 'breadcrumb-3',
            label: '简约白底',
            previewClass: 'breadcrumb-style-3',
            previewContent: (
              <div>
                <span className="breadcrumb-item">首页</span>
                <span className="breadcrumb-separator">»</span>
                <span className="breadcrumb-item">商品分类</span>
                <span className="breadcrumb-separator">»</span>
                <span className="breadcrumb-item breadcrumb-active">商品详情</span>
              </div>
            )
          }
        ]
      },
      '3': {
        moduleName: '商城广告',
        options: [
          {
            value: 'ad-1',
            label: '热情红橙渐变',
            previewClass: 'ad-style-1',
            previewContent: (
              <div>
                <div className="ad-title">限时特惠</div>
                <div className="ad-desc">全场商品低至5折</div>
              </div>
            )
          },
          {
            value: 'ad-2',
            label: '科技蓝渐变',
            previewClass: 'ad-style-2',
            previewContent: (
              <div>
                <div className="ad-title">新品上市</div>
                <div className="ad-desc">抢先体验 品质保证</div>
              </div>
            )
          },
          {
            value: 'ad-3',
            label: '简约虚线边框',
            previewClass: 'ad-style-3',
            previewContent: (
              <div>
                <div className="ad-title">会员专享</div>
                <div className="ad-desc">会员购物享双重优惠</div>
              </div>
            )
          }
        ]
      }
    };
    
    return styleConfigs[selectedMenuItem] || {
      moduleName: '未知模块',
      options: []
    };
  };

  // 预览组件 - 根据当前选择的模块和样式显示预览效果
  const PreviewComponent = () => {
    const moduleId = selectedMenuItem;
    const currentStyle = moduleStyles[moduleId] || '';
    const moduleStyleConfig = getCurrentModuleStyles();
    
    // 如果没有样式或模块不支持样式预览，显示提示信息
    if (!currentStyle || !moduleStyleConfig.options.length) {
      if (moduleConfigMap[moduleId]?.hasStyleSelector) {
        return (
          <div className="preview-empty">
            <p>请选择一个样式以查看预览效果</p>
          </div>
        );
      }
      return null;
    }
    
    // 查找当前选中样式的配置
    const selectedStyleConfig = moduleStyleConfig.options.find(option => option.value === currentStyle);
    
    if (!selectedStyleConfig) return null;
    
    // 根据模块ID和样式渲染不同的预览内容
    switch (moduleId) {
      case '2': // 面包屑
        return (
          <div className={`breadcrumb-preview ${selectedStyleConfig.previewClass}`}>
            {selectedStyleConfig.previewContent}
          </div>
        );
      case '3': // 商城广告
        return (
          <div className={`ad-preview ${selectedStyleConfig.previewClass}`}>
            {selectedStyleConfig.previewContent}
          </div>
        );
      default:
        return (
          <div className={`module-preview ${selectedStyleConfig.previewClass}`}>
            {selectedStyleConfig.previewContent}
          </div>
        );
    }
  };

  const menuItems = [
    { key: '1', label: '基础设置', className: 'menu-item' },
    { key: '2', label: '面包屑设置', className: 'menu-item' },
    { key: '3', label: '商城广告', className: 'menu-item' },
    { key: '4', label: '商城活动', className: 'menu-item' },
    { key: '5', label: '推广广告', className: 'menu-item' },
    { key: '6', label: '官方推荐', className: 'menu-item' },
    { key: '7', label: '热门活动', className: 'menu-item' },
    { key: '8', label: '商品推荐', className: 'menu-item' },
    { key: '9', label: '限时秒杀', className: 'menu-item' },
    { key: '10', label: '为你推荐', className: 'menu-item' },
    { key: '11', label: '商品榜单', className: 'menu-item' },
    { key: '12', label: '底部导航', className: 'menu-item' },
  ];

  // 处理保存装修
  const handleSaveDesign = () => {
    message.success('装修保存成功');
  };

  // 处理发布装修
  const handlePublishDesign = () => {
    message.success('装修发布成功');
  };

  return (
    <Layout className="floor-designer-container">
      {/* 顶部导航栏 */}
      <Header className="designer-header">
        <div className="header-content">
          <div className="header-left">
            <span className="title">正在装修: {pageName || '首页'}</span>
          </div>
          <div className="header-right">
            <Button 
              type="primary" 
              className="save-button"
              onClick={handleSaveDesign}
            >
              保存
            </Button>
            <Button 
              type="primary" 
              danger 
              className="publish-button"
              onClick={handlePublishDesign}
            >
              立即发布
            </Button>
          </div>
        </div>
      </Header>

      <Layout>
        {/* 左侧工具栏 */}
        <Sider width={180} className="designer-sider">
          <Menu
            mode="inline"
            selectedKeys={[selectedMenuItem]}
            onClick={handleMenuClick}
            style={{ height: '100%', borderRight: 0 }}
            className="designer-menu"
            items={menuItems}
          />
        </Sider>

        {/* 右侧预览区域 */}
        <Content className="designer-content">
          <div className="preview-container">
            {/* 店铺顶部区域 */}
            <div className="shop-header">
              <div className="shop-logo">
                <img src="/logo.png" alt="LILISHOP" className="logo-img" />
              </div>
              <div className="search-container">
                <Search 
                  placeholder="输入关键词搜索商品"
                  enterButton="搜索"
                  size="middle"
                  className="shop-search"
                />
              </div>
              <div className="header-links">
                <a href="#" className="header-link">立即注册</a>
                <a href="#" className="header-link">请登录</a>
                <a href="#" className="header-link">我的订单</a>
                <a href="#" className="header-link">帮助中心</a>
                <a href="#" className="header-link">下载APP</a>
                <a href="#" className="header-link">店铺入驻</a>
              </div>
            </div>

            {/* 商品分类和导航 */}
            <div className="category-nav">
              <Button 
                type="primary" 
                danger 
                className="category-button"
              >
                全部商品分类
              </Button>
              <div className="nav-menu">
                <a href="#" className="nav-link">秒杀</a>
                <a href="#" className="nav-link">闪购</a>
                <a href="#" className="nav-link">优惠券</a>
                <a href="#" className="nav-link">拍卖</a>
                <a href="#" className="nav-link">聚装城</a>
              </div>
            </div>

            {/* 实时预览区域 */}
            <div className="live-preview-section">
              <div className="preview-title">实时预览</div>
              <div className="preview-display">
                <PreviewComponent />
              </div>
            </div>

            {/* 主要内容区域 - 这里是装修预览的主要部分 */}
            <div className="main-content">
              {(() => {
                const moduleConfig = getCurrentModuleConfig();
                
                if (moduleConfig.hasStyleSelector) {
                  const moduleStyleConfig = getCurrentModuleStyles();
                  const currentStyle = moduleStyles[selectedMenuItem] || (moduleStyleConfig.options[0]?.value || '');
                  
                  return (
                    <InlineStyleSelector
                      moduleName={moduleStyleConfig.moduleName}
                      styleOptions={moduleStyleConfig.options}
                      selectedStyle={currentStyle}
                      onStyleChange={(style) => handleStyleChange(selectedMenuItem, style)}
                    />
                  );
                } else {
                  // 对于没有样式选择器的模块，显示空状态或其他配置界面
                  return (
                    <div className="content-placeholder">
                      <Empty 
                        description={`${moduleConfig.name}模块配置区域`} 
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                      />
                    </div>
                  );
                }
              })()}
            </div>
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default FloorDesigner;