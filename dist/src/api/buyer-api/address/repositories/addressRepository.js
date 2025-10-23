/**
 * 地址数据仓库
 * 处理地址管理相关的数据操作
 */

const logger = require('../../../core/utils/logger');
const BaseRepository = require('../../../core/repositories/baseRepository');

// 模拟地址数据存储
let addresses = [];
let addressIdCounter = 1;

class AddressRepository extends BaseRepository {
  constructor() {
    super();
    logger.info('地址数据仓库初始化');
  }
  
  /**
   * 获取用户地址列表
   * @param {string} userId - 用户ID
   * @returns {Promise<Array>} 地址列表
   */
  async getUserAddresses(userId) {
    try {
      const userAddresses = addresses.filter(address => address.userId === userId);
      // 默认地址排在前面
      return userAddresses.sort((a, b) => b.isDefault - a.isDefault);
    } catch (error) {
      logger.error('获取用户地址列表失败', { userId, error: error.message });
      throw error;
    }
  }
  
  /**
   * 根据ID获取地址
   * @param {string} addressId - 地址ID
   * @returns {Promise<Object|null>} 地址对象或null
   */
  async getAddressById(addressId) {
    try {
      const address = addresses.find(address => address.id === addressId);
      return address || null;
    } catch (error) {
      logger.error('根据ID获取地址失败', { addressId, error: error.message });
      throw error;
    }
  }
  
  /**
   * 创建地址
   * @param {Object} addressData - 地址数据
   * @returns {Promise<Object>} 创建的地址
   */
  async createAddress(addressData) {
    try {
      const address = {
        id: `addr_${addressIdCounter++}`,
        ...addressData
      };
      
      addresses.push(address);
      logger.info('地址创建成功', { addressId: address.id });
      
      return address;
    } catch (error) {
      logger.error('创建地址失败', { error: error.message });
      throw error;
    }
  }
  
  /**
   * 更新地址
   * @param {string} addressId - 地址ID
   * @param {Object} updateData - 更新数据
   * @returns {Promise<Object>} 更新后的地址
   */
  async updateAddress(addressId, updateData) {
    try {
      const addressIndex = addresses.findIndex(address => address.id === addressId);
      
      if (addressIndex === -1) {
        throw new Error('地址不存在');
      }
      
      addresses[addressIndex] = {
        ...addresses[addressIndex],
        ...updateData
      };
      
      logger.info('地址更新成功', { addressId });
      return addresses[addressIndex];
    } catch (error) {
      logger.error('更新地址失败', { addressId, error: error.message });
      throw error;
    }
  }
  
  /**
   * 删除地址
   * @param {string} addressId - 地址ID
   * @returns {Promise<boolean>} 是否删除成功
   */
  async deleteAddress(addressId) {
    try {
      const initialLength = addresses.length;
      addresses = addresses.filter(address => address.id !== addressId);
      
      const deleted = addresses.length < initialLength;
      
      if (deleted) {
        logger.info('地址删除成功', { addressId });
      }
      
      return deleted;
    } catch (error) {
      logger.error('删除地址失败', { addressId, error: error.message });
      throw error;
    }
  }
  
  /**
   * 重置用户的默认地址
   * @param {string} userId - 用户ID
   * @returns {Promise<void>}
   */
  async resetDefaultAddresses(userId) {
    try {
      addresses = addresses.map(address => {
        if (address.userId === userId) {
          return {
            ...address,
            isDefault: false
          };
        }
        return address;
      });
      
      logger.info('默认地址重置成功', { userId });
    } catch (error) {
      logger.error('重置默认地址失败', { userId, error: error.message });
      throw error;
    }
  }
  
  /**
   * 获取用户的默认地址
   * @param {string} userId - 用户ID
   * @returns {Promise<Object|null>} 默认地址或null
   */
  async getDefaultAddress(userId) {
    try {
      const defaultAddress = addresses.find(
        address => address.userId === userId && address.isDefault
      );
      
      return defaultAddress || null;
    } catch (error) {
      logger.error('获取默认地址失败', { userId, error: error.message });
      throw error;
    }
  }
  
  /**
   * 获取地址总数
   * @param {string} userId - 用户ID
   * @returns {Promise<number>} 地址总数
   */
  async getAddressCount(userId) {
    try {
      return addresses.filter(address => address.userId === userId).length;
    } catch (error) {
      logger.error('获取地址总数失败', { userId, error: error.message });
      throw error;
    }
  }
  
  /**
   * 批量删除用户地址
   * @param {string} userId - 用户ID
   * @param {Array<string>} addressIds - 地址ID数组
   * @returns {Promise<number>} 删除的数量
   */
  async batchDeleteAddresses(userId, addressIds) {
    try {
      const initialLength = addresses.length;
      
      addresses = addresses.filter(address => {
        // 只删除属于该用户且在ID列表中的地址
        const shouldDelete = address.userId === userId && addressIds.includes(address.id);
        if (shouldDelete) {
          logger.info('批量删除地址', { addressId: address.id });
        }
        return !shouldDelete;
      });
      
      const deletedCount = initialLength - addresses.length;
      logger.info('批量删除地址完成', { userId, deletedCount });
      
      return deletedCount;
    } catch (error) {
      logger.error('批量删除地址失败', { userId, error: error.message });
      throw error;
    }
  }
  
  /**
   * 初始化模拟数据
   */
  initializeMockData() {
    // 添加一些模拟地址数据
    const mockAddresses = [
      {
        id: `addr_${addressIdCounter++}`,
        userId: 'user_1',
        name: '张三',
        phone: '13800138000',
        province: '北京市',
        city: '北京市',
        district: '朝阳区',
        address: '某某街道123号阳光小区1号楼1单元101室',
        zipCode: '100000',
        isDefault: true,
        createdAt: new Date('2023-11-20T10:00:00'),
        updatedAt: new Date('2023-11-20T10:00:00')
      },
      {
        id: `addr_${addressIdCounter++}`,
        userId: 'user_1',
        name: '张三',
        phone: '13800138000',
        province: '上海市',
        city: '上海市',
        district: '浦东新区',
        address: '某某路456号科技园B栋5楼',
        zipCode: '200120',
        isDefault: false,
        createdAt: new Date('2023-12-01T14:30:00'),
        updatedAt: new Date('2023-12-01T14:30:00')
      }
    ];
    
    addresses = [...addresses, ...mockAddresses];
    logger.info('地址模拟数据初始化完成', { count: mockAddresses.length });
  }
}

// 初始化模拟数据
const repository = new AddressRepository();
repository.initializeMockData();

module.exports = repository;