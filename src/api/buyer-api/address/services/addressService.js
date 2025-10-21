/**
 * 地址服务
 * 处理地址管理相关的业务逻辑
 */

const di = require('@core/di/container');
const addressRepository = di.resolve('addressRepository');
const logger = di.resolve('logger');
const cache = di.resolve('cache');

class AddressService {
  /**
   * 获取用户地址列表
   * @param {string} userId - 用户ID
   * @returns {Promise<Array>} 地址列表
   */
  async getUserAddresses(userId) {
    try {
      // 尝试从缓存获取
      const cacheKey = `user:${userId}:addresses`;
      const cachedAddresses = await cache.get(cacheKey);
      
      if (cachedAddresses) {
        return JSON.parse(cachedAddresses);
      }
      
      const addresses = await addressRepository.getUserAddresses(userId);
      
      // 缓存结果
      await cache.set(cacheKey, JSON.stringify(addresses), 3600); // 1小时缓存
      
      return addresses;
    } catch (error) {
      logger.error('获取用户地址列表失败', { userId, error: error.message });
      throw error;
    }
  }
  
  /**
   * 获取地址详情
   * @param {string} userId - 用户ID
   * @param {string} addressId - 地址ID
   * @returns {Promise<Object>} 地址详情
   */
  async getAddressDetail(userId, addressId) {
    try {
      const address = await addressRepository.getAddressById(addressId);
      
      if (!address) {
        throw new Error('地址不存在');
      }
      
      if (address.userId !== userId) {
        throw new Error('无权访问该地址');
      }
      
      return address;
    } catch (error) {
      logger.error('获取地址详情失败', { userId, addressId, error: error.message });
      throw error;
    }
  }
  
  /**
   * 创建新地址
   * @param {string} userId - 用户ID
   * @param {Object} addressData - 地址数据
   * @returns {Promise<Object>} 创建的地址
   */
  async createAddress(userId, addressData) {
    try {
      // 验证地址数据
      this.validateAddressData(addressData);
      
      // 检查用户地址数量限制（例如最多20个）
      const userAddresses = await addressRepository.getUserAddresses(userId);
      if (userAddresses.length >= 20) {
        throw new Error('地址数量已达上限，请删除部分地址后再添加');
      }
      
      // 如果是第一个地址或设置为默认，则将其他地址的默认状态取消
      if (userAddresses.length === 0 || addressData.isDefault) {
        await addressRepository.resetDefaultAddresses(userId);
      }
      
      // 构建地址数据
      const address = {
        userId,
        name: addressData.name,
        phone: addressData.phone,
        province: addressData.province,
        city: addressData.city,
        district: addressData.district,
        address: addressData.address,
        zipCode: addressData.zipCode || '',
        isDefault: userAddresses.length === 0 || !!addressData.isDefault,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // 创建地址
      const createdAddress = await addressRepository.createAddress(address);
      
      // 清除缓存
      await cache.delete(`user:${userId}:addresses`);
      await cache.delete(`user:${userId}:defaultAddress`);
      
      logger.info('地址创建成功', { addressId: createdAddress.id, userId });
      
      return createdAddress;
    } catch (error) {
      logger.error('创建地址失败', { userId, error: error.message });
      throw error;
    }
  }
  
  /**
   * 更新地址
   * @param {string} userId - 用户ID
   * @param {string} addressId - 地址ID
   * @param {Object} addressData - 更新的地址数据
   * @returns {Promise<Object>} 更新后的地址
   */
  async updateAddress(userId, addressId, addressData) {
    try {
      // 验证地址是否存在且属于该用户
      await this.getAddressDetail(userId, addressId);
      
      // 验证地址数据
      this.validateAddressData(addressData);
      
      // 构建更新数据
      const updateData = {
        ...addressData,
        updatedAt: new Date()
      };
      
      // 如果设置为默认地址，先重置其他默认地址
      if (addressData.isDefault) {
        await addressRepository.resetDefaultAddresses(userId);
      }
      
      // 更新地址
      const updatedAddress = await addressRepository.updateAddress(addressId, updateData);
      
      // 清除缓存
      await cache.delete(`user:${userId}:addresses`);
      await cache.delete(`user:${userId}:defaultAddress`);
      
      logger.info('地址更新成功', { addressId, userId });
      
      return updatedAddress;
    } catch (error) {
      logger.error('更新地址失败', { userId, addressId, error: error.message });
      throw error;
    }
  }
  
  /**
   * 删除地址
   * @param {string} userId - 用户ID
   * @param {string} addressId - 地址ID
   * @returns {Promise<boolean>} 是否删除成功
   */
  async deleteAddress(userId, addressId) {
    try {
      // 验证地址是否存在且属于该用户
      const address = await this.getAddressDetail(userId, addressId);
      
      // 删除地址
      const deleted = await addressRepository.deleteAddress(addressId);
      
      if (deleted) {
        // 如果删除的是默认地址，且用户还有其他地址，则将第一个地址设为默认
        if (address.isDefault) {
          const remainingAddresses = await addressRepository.getUserAddresses(userId);
          if (remainingAddresses.length > 0) {
            await addressRepository.updateAddress(remainingAddresses[0].id, {
              isDefault: true,
              updatedAt: new Date()
            });
          }
        }
        
        // 清除缓存
        await cache.delete(`user:${userId}:addresses`);
        await cache.delete(`user:${userId}:defaultAddress`);
        
        logger.info('地址删除成功', { addressId, userId });
      }
      
      return deleted;
    } catch (error) {
      logger.error('删除地址失败', { userId, addressId, error: error.message });
      throw error;
    }
  }
  
  /**
   * 设置默认地址
   * @param {string} userId - 用户ID
   * @param {string} addressId - 地址ID
   * @returns {Promise<Object>} 设置后的默认地址
   */
  async setDefaultAddress(userId, addressId) {
    try {
      // 验证地址是否存在且属于该用户
      await this.getAddressDetail(userId, addressId);
      
      // 重置所有默认地址
      await addressRepository.resetDefaultAddresses(userId);
      
      // 设置新的默认地址
      const updatedAddress = await addressRepository.updateAddress(addressId, {
        isDefault: true,
        updatedAt: new Date()
      });
      
      // 清除缓存
      await cache.delete(`user:${userId}:addresses`);
      await cache.delete(`user:${userId}:defaultAddress`);
      
      logger.info('默认地址设置成功', { addressId, userId });
      
      return updatedAddress;
    } catch (error) {
      logger.error('设置默认地址失败', { userId, addressId, error: error.message });
      throw error;
    }
  }
  
  /**
   * 获取默认地址
   * @param {string} userId - 用户ID
   * @returns {Promise<Object|null>} 默认地址或null
   */
  async getDefaultAddress(userId) {
    try {
      // 尝试从缓存获取
      const cacheKey = `user:${userId}:defaultAddress`;
      const cachedAddress = await cache.get(cacheKey);
      
      if (cachedAddress) {
        return JSON.parse(cachedAddress);
      }
      
      const address = await addressRepository.getDefaultAddress(userId);
      
      // 缓存结果
      if (address) {
        await cache.set(cacheKey, JSON.stringify(address), 3600); // 1小时缓存
      }
      
      return address;
    } catch (error) {
      logger.error('获取默认地址失败', { userId, error: error.message });
      throw error;
    }
  }
  
  /**
   * 验证地址数据
   * @param {Object} addressData - 地址数据
   */
  validateAddressData(addressData) {
    // 验证必填字段
    const requiredFields = ['name', 'phone', 'province', 'city', 'district', 'address'];
    
    for (const field of requiredFields) {
      if (!addressData[field] || addressData[field].trim() === '') {
        throw new Error(`${this.getFieldName(field)}不能为空`);
      }
    }
    
    // 验证手机号格式
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(addressData.phone)) {
      throw new Error('请输入有效的手机号');
    }
    
    // 验证姓名长度
    if (addressData.name.length > 20) {
      throw new Error('姓名长度不能超过20个字符');
    }
    
    // 验证详细地址长度
    if (addressData.address.length > 100) {
      throw new Error('详细地址长度不能超过100个字符');
    }
  }
  
  /**
   * 获取字段的中文名称
   * @param {string} field - 字段名
   * @returns {string} 中文名称
   */
  getFieldName(field) {
    const fieldMap = {
      name: '收货人姓名',
      phone: '联系电话',
      province: '省份',
      city: '城市',
      district: '区县',
      address: '详细地址'
    };
    
    return fieldMap[field] || field;
  }
}

module.exports = new AddressService();