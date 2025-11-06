/**
 * 产品管理仓库
 * 处理产品相关的数据访问操作
 */

const logger = require('../../../../utils/logger');

// 模拟产品数据
const mockProducts = [
  {
    id: '1',
    productId: '1067624538407650560',
    name: '测试模板',
    price: '100.00',
    sales: 0,
    stock: 4,
    saleMode: '套餐',
    productType: '实物商品',
    status: '待审核',
    auditStatus: '待审核',
    softCopyright: '空编辑',
    image: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0iI2UxZTFmMiI+CiAgPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMTgiIGZpbGw9Im5vbmUiLz4KICA8dGV4dCB4PSIyMCIgeT0iMjUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+5p2O5o+QPC90ZXh0Pgo8L3N2Zz4='
  },
  {
    id: '2',
    productId: '1187242602596427789',
    name: '11',
    price: '22.00',
    sales: 0,
    stock: 5,
    saleMode: '零售',
    productType: '实物商品',
    status: '待审核',
    auditStatus: '待审核',
    softCopyright: '空编辑',
    image: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0iI2UxZTFmMiI+CiAgPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMTgiIGZpbGw9Im5vbmUiLz4KICA8dGV4dCB4PSIyMCIgeT0iMjUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+5p2O5o+QPC90ZXh0Pgo8L3N2Zz4='
  },
  {
    id: '3',
    productId: '1186712581066297345',
    name: '4模板',
    price: '100.00',
    sales: 0,
    stock: 500,
    saleMode: '套餐',
    productType: '实物商品',
    status: '审核失败',
    auditStatus: '未通过',
    softCopyright: '空编辑',
    image: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0iI2UxZTFmMiI+CiAgPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMTgiIGZpbGw9Im5vbmUiLz4KICA8dGV4dCB4PSIyMCIgeT0iMjUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+5p2O5o+QPC90ZXh0Pgo8L3N2Zz4='
  }
];

/**
 * 查找产品列表
 * @param {Object} query - 查询条件
 * @param {number} page - 页码
 * @param {number} pageSize - 每页数量
 * @returns {Promise<Array>} 产品列表
 */
exports.findProducts = async (query, page = 1, pageSize = 10) => {
  try {
    logger.info('查找产品列表', { query, page, pageSize });
    
    // 筛选产品
    let filteredProducts = [...mockProducts];
    
    if (query.name) {
      filteredProducts = filteredProducts.filter(product => 
        product.name.toLowerCase().includes(query.name.toLowerCase())
      );
    }
    
    if (query.id) {
      filteredProducts = filteredProducts.filter(product => 
        product.id === query.id || product.productId === query.id
      );
    }
    
    if (query.auditStatus) {
      filteredProducts = filteredProducts.filter(product => 
        product.auditStatus === query.auditStatus
      );
    }
    
    // 分页
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedProducts = filteredProducts.slice(startIndex, endIndex);
    
    return paginatedProducts;
  } catch (error) {
    logger.error('查找产品列表失败:', error);
    throw error;
  }
};

/**
 * 统计产品数量
 * @param {Object} query - 查询条件
 * @returns {Promise<number>} 产品数量
 */
exports.countProducts = async (query) => {
  try {
    logger.info('统计产品数量', { query });
    
    // 筛选产品
    let filteredProducts = [...mockProducts];
    
    if (query.name) {
      filteredProducts = filteredProducts.filter(product => 
        product.name.toLowerCase().includes(query.name.toLowerCase())
      );
    }
    
    if (query.id) {
      filteredProducts = filteredProducts.filter(product => 
        product.id === query.id || product.productId === query.id
      );
    }
    
    if (query.auditStatus) {
      filteredProducts = filteredProducts.filter(product => 
        product.auditStatus === query.auditStatus
      );
    }
    
    return filteredProducts.length;
  } catch (error) {
    logger.error('统计产品数量失败:', error);
    throw error;
  }
};

/**
 * 根据ID查找产品
 * @param {string} id - 产品ID
 * @returns {Promise<Object|null>} 产品信息或null
 */
exports.findProductById = async (id) => {
  try {
    logger.info('根据ID查找产品', { id });
    
    return mockProducts.find(product => 
      product.id === id || product.productId === id
    ) || null;
  } catch (error) {
    logger.error(`根据ID查找产品失败 (ID: ${id}):`, error);
    throw error;
  }
};

/**
 * 更新产品信息
 * @param {string} id - 产品ID
 * @param {Object} data - 更新数据
 * @returns {Promise<Object>} 更新后的产品信息
 */
exports.updateProduct = async (id, data) => {
  try {
    logger.info('更新产品信息', { id, data });
    
    const productIndex = mockProducts.findIndex(product => 
      product.id === id || product.productId === id
    );
    
    if (productIndex === -1) {
      throw new Error('产品不存在');
    }
    
    // 更新产品信息
    mockProducts[productIndex] = {
      ...mockProducts[productIndex],
      ...data
    };
    
    return mockProducts[productIndex];
  } catch (error) {
    logger.error(`更新产品信息失败 (ID: ${id}):`, error);
    throw error;
  }
};