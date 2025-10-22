/**
 * 公众号用户管理控制器
 * 处理公众号用户管理与标签的API请求
 */

const logger = require('../../../core/logger');
const userService = require('../services/userService');

/**
 * 公众号用户管理控制器类
 */
class UserController {
  /**
   * 获取用户列表
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express中间件回调函数
   */
  async getUserList(req, res, next) {
    try {
      const { page = 1, pageSize = 20, tagId, status } = req.query;
      const result = await userService.getUserList({
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        tagId: tagId ? parseInt(tagId) : null,
        status
      });
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('获取用户列表失败:', error);
      next(error);
    }
  }

  /**
   * 获取用户详情
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express中间件回调函数
   */
  async getUserDetail(req, res, next) {
    try {
      const { openId } = req.params;
      const userInfo = await userService.getUserDetail(openId);
      if (!userInfo) {
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        });
      }
      res.json({
        success: true,
        data: userInfo
      });
    } catch (error) {
      logger.error('获取用户详情失败:', error);
      next(error);
    }
  }

  /**
   * 同步用户信息
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express中间件回调函数
   */
  async syncUserInfo(req, res, next) {
    try {
      const { openId } = req.params;
      const userInfo = await userService.syncUserInfoFromWechat(openId);
      res.json({
        success: true,
        message: '用户信息同步成功',
        data: userInfo
      });
    } catch (error) {
      logger.error('同步用户信息失败:', error);
      next(error);
    }
  }

  /**
   * 批量同步用户信息
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express中间件回调函数
   */
  async batchSyncUsers(req, res, next) {
    try {
      const syncResult = await userService.batchSyncUsers();
      res.json({
        success: true,
        message: '批量同步用户信息成功',
        data: syncResult
      });
    } catch (error) {
      logger.error('批量同步用户信息失败:', error);
      next(error);
    }
  }

  /**
   * 获取标签列表
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express中间件回调函数
   */
  async getTags(req, res, next) {
    try {
      const tags = await userService.getTags();
      res.json({
        success: true,
        data: tags
      });
    } catch (error) {
      logger.error('获取标签列表失败:', error);
      next(error);
    }
  }

  /**
   * 创建标签
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express中间件回调函数
   */
  async createTag(req, res, next) {
    try {
      const { name } = req.body;
      const tag = await userService.createTag(name);
      res.status(201).json({
        success: true,
        message: '标签创建成功',
        data: tag
      });
    } catch (error) {
      logger.error('创建标签失败:', error);
      next(error);
    }
  }

  /**
   * 更新标签
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express中间件回调函数
   */
  async updateTag(req, res, next) {
    try {
      const { id } = req.params;
      const { name } = req.body;
      const tag = await userService.updateTag(parseInt(id), name);
      res.json({
        success: true,
        message: '标签更新成功',
        data: tag
      });
    } catch (error) {
      logger.error('更新标签失败:', error);
      next(error);
    }
  }

  /**
   * 删除标签
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express中间件回调函数
   */
  async deleteTag(req, res, next) {
    try {
      const { id } = req.params;
      await userService.deleteTag(parseInt(id));
      res.json({
        success: true,
        message: '标签删除成功'
      });
    } catch (error) {
      logger.error('删除标签失败:', error);
      next(error);
    }
  }

  /**
   * 为用户打标签
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express中间件回调函数
   */
  async tagUsers(req, res, next) {
    try {
      const { tagId, openIds } = req.body;
      await userService.tagUsers(parseInt(tagId), openIds);
      res.json({
        success: true,
        message: '用户打标签成功'
      });
    } catch (error) {
      logger.error('为用户打标签失败:', error);
      next(error);
    }
  }

  /**
   * 移除用户标签
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express中间件回调函数
   */
  async untagUsers(req, res, next) {
    try {
      const { tagId, openIds } = req.body;
      await userService.untagUsers(parseInt(tagId), openIds);
      res.json({
        success: true,
        message: '移除用户标签成功'
      });
    } catch (error) {
      logger.error('移除用户标签失败:', error);
      next(error);
    }
  }

  /**
   * 获取用户身上的标签
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express中间件回调函数
   */
  async getUserTags(req, res, next) {
    try {
      const { openId } = req.params;
      const tags = await userService.getUserTags(openId);
      res.json({
        success: true,
        data: tags
      });
    } catch (error) {
      logger.error('获取用户标签失败:', error);
      next(error);
    }
  }

  /**
   * 获取标签下的用户列表
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express中间件回调函数
   */
  async getUsersByTag(req, res, next) {
    try {
      const { tagId } = req.params;
      const { page = 1, pageSize = 20 } = req.query;
      const result = await userService.getUsersByTag(parseInt(tagId), {
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      });
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('获取标签下用户列表失败:', error);
      next(error);
    }
  }

  /**
   * 设置用户备注名
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express中间件回调函数
   */
  async setUserRemark(req, res, next) {
    try {
      const { openId } = req.params;
      const { remark } = req.body;
      await userService.setUserRemark(openId, remark);
      res.json({
        success: true,
        message: '用户备注设置成功'
      });
    } catch (error) {
      logger.error('设置用户备注失败:', error);
      next(error);
    }
  }

  /**
   * 拉黑用户
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express中间件回调函数
   */
  async blockUsers(req, res, next) {
    try {
      const { openIds } = req.body;
      await userService.blockUsers(openIds);
      res.json({
        success: true,
        message: '用户拉黑成功'
      });
    } catch (error) {
      logger.error('拉黑用户失败:', error);
      next(error);
    }
  }

  /**
   * 取消拉黑用户
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {Function} next - Express中间件回调函数
   */
  async unblockUsers(req, res, next) {
    try {
      const { openIds } = req.body;
      await userService.unblockUsers(openIds);
      res.json({
        success: true,
        message: '取消拉黑用户成功'
      });
    } catch (error) {
      logger.error('取消拉黑用户失败:', error);
      next(error);
    }
  }
}

module.exports = new UserController();