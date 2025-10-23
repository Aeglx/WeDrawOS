/**
 * 投诉处理消息处理器
 * 处理用户投诉相关的消息
 */

const logger = require('@core/utils/logger');
const { getInstance: getNotificationService } = require('../notification/notificationService');
const { getInstance: getMessageMonitor } = require('../monitoring/messageProcessingMonitor');
const complaintService = require('@api/services/complaintService');
const orderService = require('@api/services/orderService');
const memberService = require('@api/services/memberService');
const staffService = require('@api/services/staffService');

class ComplaintMessageHandler {
  constructor() {
    this.notificationService = getNotificationService();
    this.monitor = getMessageMonitor();
    
    // 投诉处理SLA配置
    this.slaConfig = {
      responseTime: 24 * 60 * 60 * 1000, // 24小时内响应
      resolutionTime: 72 * 60 * 60 * 1000, // 72小时内解决
      highPriorityResponseTime: 2 * 60 * 60 * 1000 // 高优先级2小时内响应
    };
  }

  /**
   * 处理新投诉创建
   * @param {Object} message - 投诉创建消息
   */
  async handleComplaintCreated(message) {
    const messageId = message.id || `complaint_create_${Date.now()}`;
    
    try {
      // 记录处理开始
      this.monitor.recordProcessingStart('complaint.created', messageId);
      
      const { complaintId, userId, orderId, complaintType, priority, content } = message;
      
      logger.info(`处理新投诉: ${complaintId}，用户: ${userId}，类型: ${complaintType}`);
      
      // 获取投诉详情
      const complaintDetails = await complaintService.getComplaintById(complaintId);
      
      // 获取用户信息
      const userInfo = await memberService.getMemberById(userId);
      
      // 分配处理人员
      const assignedStaff = await this._assignStaff(complaintType, priority);
      
      // 更新投诉状态和处理人员
      await complaintService.updateComplaint(complaintId, {
        status: 'assigned',
        assignedTo: assignedStaff.id,
        assignedTime: new Date(),
        expectedResponseTime: this._calculateExpectedResponseTime(priority)
      });
      
      // 发送通知给处理人员
      await this._notifyStaffAboutNewComplaint(assignedStaff, {
        complaintId,
        userId,
        userName: userInfo?.name || '用户',
        complaintType,
        priority,
        content,
        ...complaintDetails
      });
      
      // 发送确认通知给用户
      await this._notifyUserAboutComplaintReceived(userId, complaintId, complaintType);
      
      // 创建处理任务
      await this._createComplaintTask(complaintId, assignedStaff.id, priority);
      
      // 记录处理完成
      this.monitor.recordProcessingComplete('complaint.created', messageId, true, 1);
      
      logger.info(`新投诉处理完成: ${complaintId}，已分配给 ${assignedStaff.name}`);
    } catch (error) {
      logger.error(`处理新投诉失败: ${messageId}`, error);
      
      // 记录错误
      this.monitor.recordProcessingError('complaint.created', messageId, error);
      this.monitor.recordProcessingComplete('complaint.created', messageId, false, 1);
      
      throw error;
    }
  }

  /**
   * 处理投诉状态更新
   * @param {Object} message - 投诉状态更新消息
   */
  async handleComplaintUpdated(message) {
    const messageId = message.id || `complaint_update_${Date.now()}`;
    
    try {
      // 记录处理开始
      this.monitor.recordProcessingStart('complaint.updated', messageId);
      
      const { complaintId, status, staffId, comment, resolutionDetails } = message;
      
      logger.info(`处理投诉状态更新: ${complaintId}，新状态: ${status}`);
      
      // 获取投诉详情
      const complaint = await complaintService.getComplaintById(complaintId);
      
      // 根据状态执行不同的处理逻辑
      switch (status) {
        case 'processing':
          await this._handleComplaintProcessing(complaintId, staffId, comment);
          break;
        case 'awaiting_response':
          await this._handleAwaitingResponse(complaintId, comment);
          break;
        case 'resolved':
          await this._handleComplaintResolved(complaintId, staffId, resolutionDetails);
          break;
        case 'rejected':
          await this._handleComplaintRejected(complaintId, staffId, comment);
          break;
        case 'escalated':
          await this._handleComplaintEscalated(complaintId, staffId, comment);
          break;
      }
      
      // 通知用户投诉状态变更
      await this._notifyUserAboutStatusChange(complaint.userId, complaintId, status, comment);
      
      // 更新投诉统计
      await this._updateComplaintStats(status);
      
      // 记录处理完成
      this.monitor.recordProcessingComplete('complaint.updated', messageId, true, 1);
      
      logger.info(`投诉状态更新处理完成: ${complaintId}`);
    } catch (error) {
      logger.error(`处理投诉状态更新失败: ${messageId}`, error);
      
      // 记录错误
      this.monitor.recordProcessingError('complaint.updated', messageId, error);
      this.monitor.recordProcessingComplete('complaint.updated', messageId, false, 1);
      
      throw error;
    }
  }

  /**
   * 处理投诉SLA即将过期
   * @param {Object} message - SLA提醒消息
   */
  async handleComplaintSlaWarning(message) {
    const messageId = message.id || `complaint_sla_${Date.now()}`;
    
    try {
      // 记录处理开始
      this.monitor.recordProcessingStart('complaint.sla_warning', messageId);
      
      const { complaintId, warningType, timeRemaining } = message;
      
      logger.info(`处理投诉SLA警告: ${complaintId}，类型: ${warningType}`);
      
      // 获取投诉详情
      const complaint = await complaintService.getComplaintById(complaintId);
      
      // 获取处理人员信息
      const staff = await staffService.getStaffById(complaint.assignedTo);
      
      // 发送SLA警告通知
      await this._notifyStaffAboutSlaWarning(staff, complaint, warningType, timeRemaining);
      
      // 如果是高优先级或剩余时间很少，通知主管
      if (complaint.priority === 'high' || timeRemaining < 60 * 60 * 1000) { // 小于1小时
        const supervisor = await staffService.getStaffSupervisor(staff.id);
        if (supervisor) {
          await this._notifySupervisorAboutSlaWarning(supervisor, complaint, warningType, timeRemaining);
        }
      }
      
      // 记录处理完成
      this.monitor.recordProcessingComplete('complaint.sla_warning', messageId, true, 1);
    } catch (error) {
      logger.error(`处理投诉SLA警告失败: ${messageId}`, error);
      
      // 记录错误
      this.monitor.recordProcessingError('complaint.sla_warning', messageId, error);
      this.monitor.recordProcessingComplete('complaint.sla_warning', messageId, false, 1);
      
      throw error;
    }
  }

  /**
   * 分配投诉处理人员
   * @private
   */
  async _assignStaff(complaintType, priority) {
    try {
      // 根据投诉类型和优先级分配合适的处理人员
      // 优先选择处理该类型投诉经验丰富且当前工作量较少的人员
      const availableStaff = await staffService.getAvailableStaffByExpertise(complaintType);
      
      if (availableStaff.length === 0) {
        // 如果没有特定类型的专家，获取所有可用客服
        const allStaff = await staffService.getAvailableCustomerService();
        if (allStaff.length === 0) {
          throw new Error('没有可用的投诉处理人员');
        }
        return allStaff[0];
      }
      
      // 按照当前工作量排序，选择最空闲的
      availableStaff.sort((a, b) => a.currentWorkload - b.currentWorkload);
      return availableStaff[0];
    } catch (error) {
      logger.error('分配投诉处理人员失败:', error);
      throw error;
    }
  }

  /**
   * 计算期望响应时间
   * @private
   */
  _calculateExpectedResponseTime(priority) {
    const now = new Date();
    if (priority === 'high') {
      return new Date(now.getTime() + this.slaConfig.highPriorityResponseTime);
    }
    return new Date(now.getTime() + this.slaConfig.responseTime);
  }

  /**
   * 通知处理人员新投诉
   * @private
   */
  async _notifyStaffAboutNewComplaint(staff, complaintInfo) {
    const { complaintId, userName, complaintType, priority, content } = complaintInfo;
    
    const priorityText = priority === 'high' ? '【高优先级】' : 
                        priority === 'medium' ? '【中优先级】' : '【低优先级】';
    
    const title = `${priorityText} 新投诉待处理 #${complaintId}`;
    const messageContent = `您有一条新的投诉需要处理：\n用户：${userName}\n类型：${complaintType}\n内容：${content}\n请尽快响应处理。`;
    
    try {
      await this.notificationService.sendNotification({
        userId: staff.id,
        title,
        content: messageContent,
        type: 'complaint_assigned',
        channels: ['app', 'email'],
        data: {
          complaintId,
          priority,
          complaintType,
          assignedTime: new Date().toISOString()
        },
        // 高优先级发送短信提醒
        additionalChannels: priority === 'high' ? ['sms'] : []
      });
    } catch (error) {
      logger.error(`通知处理人员失败: ${staff.id}`, error);
    }
  }

  /**
   * 通知用户投诉已接收
   * @private
   */
  async _notifyUserAboutComplaintReceived(userId, complaintId, complaintType) {
    const title = '您的投诉已收到';
    const content = `尊敬的用户，您关于${complaintType}的投诉(#${complaintId})已成功提交。我们会尽快处理并给您回复，感谢您的反馈！`;
    
    try {
      await this.notificationService.sendNotification({
        userId,
        title,
        content,
        type: 'complaint_received',
        channels: ['app', 'sms']
      });
    } catch (error) {
      logger.error(`通知用户投诉接收失败: ${userId}`, error);
    }
  }

  /**
   * 创建投诉处理任务
   * @private
   */
  async _createComplaintTask(complaintId, staffId, priority) {
    try {
      await complaintService.createComplaintTask({
        complaintId,
        staffId,
        taskType: 'process_complaint',
        priority,
        status: 'pending',
        createdAt: new Date(),
        dueTime: this._calculateExpectedResponseTime(priority)
      });
    } catch (error) {
      logger.error(`创建投诉处理任务失败: ${complaintId}`, error);
    }
  }

  /**
   * 处理投诉开始处理
   * @private
   */
  async _handleComplaintProcessing(complaintId, staffId, comment) {
    try {
      await complaintService.updateComplaint(complaintId, {
        status: 'processing',
        processingStartTime: new Date(),
        lastUpdatedBy: staffId,
        latestComment: comment
      });
    } catch (error) {
      logger.error(`更新投诉为处理中失败: ${complaintId}`, error);
    }
  }

  /**
   * 处理等待用户响应
   * @private
   */
  async _handleAwaitingResponse(complaintId, comment) {
    try {
      await complaintService.updateComplaint(complaintId, {
        status: 'awaiting_response',
        waitingSince: new Date(),
        latestComment: comment
      });
    } catch (error) {
      logger.error(`更新投诉为等待响应失败: ${complaintId}`, error);
    }
  }

  /**
   * 处理投诉已解决
   * @private
   */
  async _handleComplaintResolved(complaintId, staffId, resolutionDetails) {
    try {
      // 计算处理时间
      const complaint = await complaintService.getComplaintById(complaintId);
      const processingTime = new Date() - new Date(complaint.createdAt);
      
      await complaintService.updateComplaint(complaintId, {
        status: 'resolved',
        resolutionTime: new Date(),
        resolutionDetails,
        resolvedBy: staffId,
        processingTime,
        latestComment: resolutionDetails.summary || ''
      });
      
      // 更新处理人员工作量
      await staffService.updateStaffWorkload(staffId, -1);
    } catch (error) {
      logger.error(`更新投诉为已解决失败: ${complaintId}`, error);
    }
  }

  /**
   * 处理投诉被驳回
   * @private
   */
  async _handleComplaintRejected(complaintId, staffId, comment) {
    try {
      await complaintService.updateComplaint(complaintId, {
        status: 'rejected',
        rejectionTime: new Date(),
        rejectionReason: comment,
        rejectedBy: staffId
      });
      
      // 更新处理人员工作量
      await staffService.updateStaffWorkload(staffId, -1);
    } catch (error) {
      logger.error(`更新投诉为已驳回失败: ${complaintId}`, error);
    }
  }

  /**
   * 处理投诉升级
   * @private
   */
  async _handleComplaintEscalated(complaintId, staffId, comment) {
    try {
      // 获取更高级别的处理人员
      const manager = await staffService.getComplaintManager();
      
      await complaintService.updateComplaint(complaintId, {
        status: 'escalated',
        escalatedTime: new Date(),
        escalatedBy: staffId,
        escalatedReason: comment,
        assignedTo: manager.id,
        priority: 'high' // 升级后自动设为高优先级
      });
      
      // 通知经理有投诉升级
      await this._notifyManagerAboutEscalation(manager, complaintId, comment);
    } catch (error) {
      logger.error(`处理投诉升级失败: ${complaintId}`, error);
    }
  }

  /**
   * 通知用户状态变更
   * @private
   */
  async _notifyUserAboutStatusChange(userId, complaintId, status, comment) {
    let title, content;
    
    switch (status) {
      case 'processing':
        title = '您的投诉正在处理中';
        content = `您的投诉(#${complaintId})已开始处理，我们会尽快给您答复。${comment ? `\n处理人员留言：${comment}` : ''}`;
        break;
      case 'awaiting_response':
        title = '请回复您的投诉';
        content = `我们需要您的进一步信息来处理投诉(#${complaintId})。${comment ? `\n问题：${comment}` : ''}`;
        break;
      case 'resolved':
        title = '您的投诉已解决';
        content = `您的投诉(#${complaintId})已成功解决。感谢您的反馈，如有其他问题请随时联系我们。`;
        break;
      case 'rejected':
        title = '您的投诉处理结果';
        content = `很抱歉，您的投诉(#${complaintId})未能通过审核。${comment ? `\n原因：${comment}` : ''}`;
        break;
      default:
        return; // 其他状态不需要通知
    }
    
    try {
      await this.notificationService.sendNotification({
        userId,
        title,
        content,
        type: 'complaint_status_update',
        channels: ['app', 'sms']
      });
    } catch (error) {
      logger.error(`通知用户投诉状态变更失败: ${userId}`, error);
    }
  }

  /**
   * 通知处理人员SLA警告
   * @private
   */
  async _notifyStaffAboutSlaWarning(staff, complaint, warningType, timeRemaining) {
    const hoursRemaining = Math.ceil(timeRemaining / (1000 * 60 * 60));
    const minutesRemaining = Math.ceil(timeRemaining / (1000 * 60));
    
    let timeText;
    if (hoursRemaining >= 1) {
      timeText = `${hoursRemaining}小时`;
    } else {
      timeText = `${minutesRemaining}分钟`;
    }
    
    const title = '【SLA警告】投诉处理时间即将到期';
    const content = `警告：您负责的投诉(#${complaint.id})${warningType === 'response' ? '响应' : '解决'}时间还剩${timeText}，请尽快处理以避免违反服务承诺。`;
    
    try {
      await this.notificationService.sendNotification({
        userId: staff.id,
        title,
        content,
        type: 'complaint_sla_warning',
        channels: ['app', 'sms', 'email'], // SLA警告发送多渠道通知
        data: {
          complaintId: complaint.id,
          warningType,
          timeRemaining
        }
      });
    } catch (error) {
      logger.error(`发送SLA警告通知失败: ${staff.id}`, error);
    }
  }

  /**
   * 通知主管SLA警告
   * @private
   */
  async _notifySupervisorAboutSlaWarning(supervisor, complaint, warningType, timeRemaining) {
    const minutesRemaining = Math.ceil(timeRemaining / (1000 * 60));
    
    const title = '【紧急】投诉处理SLA即将违反';
    const content = `紧急通知：投诉(#${complaint.id})${warningType === 'response' ? '响应' : '解决'}时间仅剩${minutesRemaining}分钟，当前负责人可能无法及时处理，请您介入协调。`;
    
    try {
      await this.notificationService.sendNotification({
        userId: supervisor.id,
        title,
        content,
        type: 'complaint_supervisor_alert',
        channels: ['app', 'sms']
      });
    } catch (error) {
      logger.error(`通知主管SLA警告失败: ${supervisor.id}`, error);
    }
  }

  /**
   * 通知经理投诉升级
   * @private
   */
  async _notifyManagerAboutEscalation(manager, complaintId, reason) {
    const title = '【投诉升级】需要您的处理';
    const content = `有一条投诉(#${complaintId})已升级至您处理。\n升级原因：${reason}\n请尽快处理此高优先级投诉。`;
    
    try {
      await this.notificationService.sendNotification({
        userId: manager.id,
        title,
        content,
        type: 'complaint_escalated',
        channels: ['app', 'sms', 'email']
      });
    } catch (error) {
      logger.error(`通知经理投诉升级失败: ${manager.id}`, error);
    }
  }

  /**
   * 更新投诉统计
   * @private
   */
  async _updateComplaintStats(status) {
    try {
      await complaintService.updateComplaintStats(status);
    } catch (error) {
      logger.error('更新投诉统计失败:', error);
    }
  }

  /**
   * 注册投诉消息处理器
   * @param {Object} messageQueue - 消息队列实例
   */
  static registerHandlers(messageQueue) {
    logger.info('注册投诉处理消息处理器');
    
    const handler = new ComplaintMessageHandler();
    messageQueue.subscribe('complaint.created', handler.handleComplaintCreated.bind(handler));
    messageQueue.subscribe('complaint.updated', handler.handleComplaintUpdated.bind(handler));
    messageQueue.subscribe('complaint.sla_warning', handler.handleComplaintSlaWarning.bind(handler));
  }
}

module.exports = ComplaintMessageHandler;