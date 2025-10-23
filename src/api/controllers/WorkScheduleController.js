const { validationResult } = require('express-validator');
const db = require('../models/index.js');
const {
    BadRequestError,
    UnauthorizedError,
    ForbiddenError,
    NotFoundError,
    ConflictError,
    InternalServerError
  } = require('../utils/errors.js');

const { WorkSchedule, User } = db.models;

/**
 * 工作时间控制器
 * 处理客服系统中的工作时间管理相关业务逻辑
 */
class WorkScheduleController {
  /**
   * 创建排班安排（管理员/主管功能）
   */
  static async createSchedule(req, res, next) {
    try {
      // 验证请求数据
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new BadRequestError('请求数据验证失败', errors.array());
      }

      const { agentIds, date, startTime, endTime, shiftType, note } = req.body;
      const createdBy = req.user.userId;

      // 检查权限：只有管理员和主管可以创建排班
      if (req.user.role !== 'admin' && req.user.role !== 'supervisor') {
        throw new ForbiddenError('无权创建排班安排');
      }

      if (!agentIds || !Array.isArray(agentIds) || agentIds.length === 0) {
        throw new BadRequestError('请提供有效的客服ID列表');
      }

      // 验证时间
      if (new Date(startTime) >= new Date(endTime)) {
        throw new BadRequestError('开始时间必须早于结束时间');
      }

      // 验证日期
      if (new Date(date) < new Date().setHours(0, 0, 0, 0)) {
        throw new BadRequestError('不能为过去的日期创建排班');
      }

      // 开始事务
      const transaction = await db.sequelize.transaction();
      
      try {
        const schedules = [];
        
        for (const agentId of agentIds) {
          // 检查客服是否存在
          const agent = await User.findByPk(agentId);
          if (!agent || agent.role !== 'agent') {
            throw new NotFoundError(`ID为${agentId}的客服不存在`);
          }

          // 检查是否已有排班
          const existingSchedule = await WorkSchedule.findOne({
            where: {
              userId: agentId,
              date: new Date(date).toISOString().split('T')[0]
            }
          });

          if (existingSchedule) {
            throw new ConflictError(`${agent.username}在${date}已有排班安排`);
          }

          // 创建排班
          const schedule = await WorkSchedule.create({
            userId: agentId,
            date: new Date(date).toISOString().split('T')[0],
            startTime,
            endTime,
            shiftType,
            note,
            status: 'scheduled',
            createdBy
          }, { transaction });

          schedules.push(schedule);

          // 创建通知
          await db.models.Notification.create({
            userId: agentId,
            type: 'schedule_assigned',
            title: '排班安排通知',
            message: `您被安排在${date}的${shiftType}班次，工作时间${new Date(startTime).toLocaleTimeString()}至${new Date(endTime).toLocaleTimeString()}`,
            metadata: { scheduleId: schedule.id, date, shiftType }
          }, { transaction });
        }

        // 提交事务
        await transaction.commit();

        // 记录操作日志
        await db.models.WorkLog.logScheduleCreated({
          userId: createdBy,
          scheduleIds: schedules.map(s => s.id),
          agentCount: agentIds.length,
          date
        });

        res.status(201).json({
          success: true,
          message: `成功创建${schedules.length}个排班安排`,
          data: { schedules: schedules.map(s => s.toResponseObject()) }
        });
      } catch (error) {
        // 回滚事务
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取排班列表
   */
  static async getSchedules(req, res, next) {
    try {
      const {
        page = 1,
        limit = 20,
        userId,
        startDate,
        endDate,
        status,
        shiftType,
        includeFuture = true,
        includePast = false
      } = req.query;
      
      const currentUserId = req.user.userId;

      // 构建查询条件
      const where = {};
      
      // 根据权限过滤
      if (req.user.role === 'agent') {
        where.userId = currentUserId;
      } else if (userId) {
        where.userId = userId;
      }
      
      // 日期范围过滤
      const today = new Date().setHours(0, 0, 0, 0);
      if (includeFuture || includePast) {
        if (includeFuture && !includePast) {
          where.date = { [db.Sequelize.Op.gte]: new Date(today).toISOString().split('T')[0] };
        } else if (!includeFuture && includePast) {
          where.date = { [db.Sequelize.Op.lt]: new Date(today).toISOString().split('T')[0] };
        }
      }
      
      if (startDate) {
        where.date = { ...where.date, [db.Sequelize.Op.gte]: startDate };
      }
      
      if (endDate) {
        where.date = { ...where.date, [db.Sequelize.Op.lte]: endDate };
      }
      
      if (status) {
        where.status = status;
      }
      
      if (shiftType) {
        where.shiftType = shiftType;
      }

      // 计算偏移量
      const offset = (page - 1) * limit;

      // 查询排班
      const { count, rows } = await WorkSchedule.findAndCountAll({
        where,
        offset,
        limit: parseInt(limit),
        order: [['date', 'desc'], ['startTime', 'asc']],
        include: [{
          model: User,
          attributes: ['id', 'username', 'firstName', 'lastName', 'email']
        }]
      });

      res.status(200).json({
        success: true,
        data: {
          schedules: rows.map(schedule => schedule.toResponseObject()),
          pagination: {
            total: count,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(count / limit)
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取单个排班详情
   */
  static async getScheduleById(req, res, next) {
    try {
      const { scheduleId } = req.params;
      const currentUserId = req.user.userId;

      // 查找排班
      const schedule = await WorkSchedule.findByPk(scheduleId, {
        include: [{
          model: User,
          attributes: ['id', 'username', 'firstName', 'lastName', 'email']
        }]
      });

      if (!schedule) {
        throw new NotFoundError('排班安排不存在');
      }

      // 检查权限：只有管理员、主管或排班对象本人可以查看
      if (req.user.role !== 'admin' && 
          req.user.role !== 'supervisor' && 
          schedule.userId !== currentUserId) {
        throw new ForbiddenError('无权查看此排班安排');
      }

      res.status(200).json({
        success: true,
        data: { schedule: schedule.toResponseObject() }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 更新排班安排
   */
  static async updateSchedule(req, res, next) {
    try {
      // 验证请求数据
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new BadRequestError('请求数据验证失败', errors.array());
      }

      const { scheduleId } = req.params;
      const { startTime, endTime, shiftType, note, status } = req.body;
      const updatedBy = req.user.userId;

      // 查找排班
      const schedule = await WorkSchedule.findByPk(scheduleId);
      if (!schedule) {
        throw new NotFoundError('排班安排不存在');
      }

      // 检查权限：只有管理员、主管可以更新
      if (req.user.role !== 'admin' && req.user.role !== 'supervisor') {
        throw new ForbiddenError('无权更新排班安排');
      }

      // 验证时间
      if (startTime && endTime && new Date(startTime) >= new Date(endTime)) {
        throw new BadRequestError('开始时间必须早于结束时间');
      }

      // 构建更新数据
      const updateData = {
        updatedBy,
        updatedAt: new Date()
      };
      
      if (startTime !== undefined) updateData.startTime = startTime;
      if (endTime !== undefined) updateData.endTime = endTime;
      if (shiftType !== undefined) updateData.shiftType = shiftType;
      if (note !== undefined) updateData.note = note;
      if (status !== undefined) updateData.status = status;

      // 更新排班
      await schedule.update(updateData);

      // 记录操作日志
      await db.models.WorkLog.logScheduleUpdated({
        userId: updatedBy,
        scheduleId: schedule.id,
        agentId: schedule.userId,
        changes: updateData
      });

      // 创建通知（如果是重要变更）
      if (startTime || endTime || shiftType || status) {
        await db.models.Notification.create({
          userId: schedule.userId,
          type: 'schedule_updated',
          title: '排班安排已更新',
          message: `您在${schedule.date}的排班安排已更新，请查看详情`,
          metadata: { scheduleId: schedule.id }
        });
      }

      // 重新获取排班（包含关联数据）
      const updatedSchedule = await WorkSchedule.findByPk(scheduleId, {
        include: [{
          model: User,
          attributes: ['id', 'username', 'firstName', 'lastName', 'email']
        }]
      });

      res.status(200).json({
        success: true,
        message: '排班安排更新成功',
        data: { schedule: updatedSchedule.toResponseObject() }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 删除排班安排
   */
  static async deleteSchedule(req, res, next) {
    try {
      const { scheduleId } = req.params;
      const deletedBy = req.user.userId;

      // 检查权限：只有管理员和主管可以删除
      if (req.user.role !== 'admin' && req.user.role !== 'supervisor') {
        throw new ForbiddenError('无权删除排班安排');
      }

      // 查找排班
      const schedule = await WorkSchedule.findByPk(scheduleId);
      if (!schedule) {
        throw new NotFoundError('排班安排不存在');
      }

      // 检查是否已开始工作
      if (schedule.actualStartTime) {
        throw new ConflictError('不能删除已开始工作的排班安排');
      }

      // 记录删除前信息
      const scheduleInfo = {
        id: schedule.id,
        userId: schedule.userId,
        date: schedule.date,
        shiftType: schedule.shiftType
      };

      // 删除排班
      await schedule.destroy();

      // 创建通知
      await db.models.Notification.create({
        userId: schedule.userId,
        type: 'schedule_deleted',
        title: '排班安排已取消',
        message: `您在${schedule.date}的排班安排已取消`,
        metadata: { scheduleId: schedule.id }
      });

      // 记录操作日志
      await db.models.WorkLog.logScheduleDeleted({
        userId: deletedBy,
        scheduleInfo
      });

      res.status(200).json({
        success: true,
        message: '排班安排已删除'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 签到打卡
   */
  static async checkIn(req, res, next) {
    try {
      const currentUserId = req.user.userId;
      const now = new Date();
      const today = now.toISOString().split('T')[0];

      // 查找今天的排班
      const schedule = await WorkSchedule.findOne({
        where: {
          userId: currentUserId,
          date: today
        }
      });

      if (!schedule) {
        throw new NotFoundError('今天没有排班安排');
      }

      // 检查是否已签到
      if (schedule.actualStartTime) {
        throw new ConflictError('已经签到打卡');
      }

      // 计算迟到时间
      const scheduledStart = new Date(`${today}T${schedule.startTime}`);
      const isLate = now > scheduledStart;
      const lateMinutes = isLate ? Math.floor((now - scheduledStart) / (1000 * 60)) : 0;

      // 更新签到信息
      await schedule.update({
        actualStartTime: now,
        isLate,
        lateMinutes,
        status: 'working',
        updatedAt: now
      });

      // 更新用户状态为在线
      await User.update(
        { availabilityStatus: 'online', lastActive: now },
        { where: { id: currentUserId } }
      );

      // 记录操作日志
      await db.models.WorkLog.logCheckIn({
        userId: currentUserId,
        scheduleId: schedule.id,
        isLate,
        lateMinutes
      });

      res.status(200).json({
        success: true,
        message: isLate ? `签到成功，迟到${lateMinutes}分钟` : '签到成功',
        data: {
          scheduleId: schedule.id,
          checkInTime: now,
          isLate,
          lateMinutes
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 签退打卡
   */
  static async checkOut(req, res, next) {
    try {
      const currentUserId = req.user.userId;
      const now = new Date();
      const today = now.toISOString().split('T')[0];

      // 查找今天的排班
      const schedule = await WorkSchedule.findOne({
        where: {
          userId: currentUserId,
          date: today
        }
      });

      if (!schedule) {
        throw new NotFoundError('今天没有排班安排');
      }

      // 检查是否已签到
      if (!schedule.actualStartTime) {
        throw new ConflictError('请先签到打卡');
      }

      // 检查是否已签退
      if (schedule.actualEndTime) {
        throw new ConflictError('已经签退打卡');
      }

      // 检查是否正在休息
      if (schedule.status === 'resting' && !schedule.restEndTime) {
        throw new ConflictError('请先结束休息');
      }

      // 计算工作时间
      const totalWorkMinutes = Math.floor((now - new Date(schedule.actualStartTime)) / (1000 * 60));
      const totalRestMinutes = schedule.totalRestMinutes || 0;
      const netWorkMinutes = totalWorkMinutes - totalRestMinutes;
      
      // 计算早退时间
      const scheduledEnd = new Date(`${today}T${schedule.endTime}`);
      const isEarly = now < scheduledEnd;
      const earlyMinutes = isEarly ? Math.floor((scheduledEnd - now) / (1000 * 60)) : 0;

      // 更新签退信息
      await schedule.update({
        actualEndTime: now,
        totalWorkMinutes,
        netWorkMinutes,
        isEarly,
        earlyMinutes,
        status: 'completed',
        updatedAt: now
      });

      // 更新用户状态为离线
      await User.update(
        { availabilityStatus: 'offline' },
        { where: { id: currentUserId } }
      );

      // 记录操作日志
      await db.models.WorkLog.logCheckOut({
        userId: currentUserId,
        scheduleId: schedule.id,
        totalWorkMinutes,
        netWorkMinutes,
        isEarly,
        earlyMinutes
      });

      res.status(200).json({
        success: true,
        message: isEarly ? `签退成功，提前${earlyMinutes}分钟` : '签退成功',
        data: {
          scheduleId: schedule.id,
          checkOutTime: now,
          totalWorkMinutes,
          netWorkMinutes,
          isEarly,
          earlyMinutes
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 开始休息
   */
  static async startRest(req, res, next) {
    try {
      const currentUserId = req.user.userId;
      const now = new Date();
      const today = now.toISOString().split('T')[0];

      // 查找今天的排班
      const schedule = await WorkSchedule.findOne({
        where: {
          userId: currentUserId,
          date: today
        }
      });

      if (!schedule) {
        throw new NotFoundError('今天没有排班安排');
      }

      // 检查是否已签到
      if (!schedule.actualStartTime) {
        throw new ConflictError('请先签到打卡');
      }

      // 检查是否已签退
      if (schedule.actualEndTime) {
        throw new ConflictError('已经签退打卡');
      }

      // 检查是否正在休息
      if (schedule.status === 'resting' && !schedule.restEndTime) {
        throw new ConflictError('已经开始休息');
      }

      // 更新休息状态
      await schedule.update({
        restStartTime: now,
        status: 'resting',
        updatedAt: now
      });

      // 更新用户状态为休息中
      await User.update(
        { availabilityStatus: 'away', lastActive: now },
        { where: { id: currentUserId } }
      );

      // 记录操作日志
      await db.models.WorkLog.logRestStarted({
        userId: currentUserId,
        scheduleId: schedule.id,
        startTime: now
      });

      res.status(200).json({
        success: true,
        message: '开始休息',
        data: {
          scheduleId: schedule.id,
          restStartTime: now
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 结束休息
   */
  static async endRest(req, res, next) {
    try {
      const currentUserId = req.user.userId;
      const now = new Date();
      const today = now.toISOString().split('T')[0];

      // 查找今天的排班
      const schedule = await WorkSchedule.findOne({
        where: {
          userId: currentUserId,
          date: today
        }
      });

      if (!schedule) {
        throw new NotFoundError('今天没有排班安排');
      }

      // 检查是否在休息中
      if (schedule.status !== 'resting' || !schedule.restStartTime || schedule.restEndTime) {
        throw new ConflictError('未开始休息或已结束休息');
      }

      // 计算休息时间
      const restMinutes = Math.floor((now - new Date(schedule.restStartTime)) / (1000 * 60));
      const totalRestMinutes = (schedule.totalRestMinutes || 0) + restMinutes;

      // 更新休息状态
      await schedule.update({
        restEndTime: now,
        totalRestMinutes,
        status: 'working',
        updatedAt: now
      });

      // 更新用户状态为在线
      await User.update(
        { availabilityStatus: 'online', lastActive: now },
        { where: { id: currentUserId } }
      );

      // 记录操作日志
      await db.models.WorkLog.logRestEnded({
        userId: currentUserId,
        scheduleId: schedule.id,
        endTime: now,
        restMinutes
      });

      res.status(200).json({
        success: true,
        message: `休息结束，共休息${restMinutes}分钟`,
        data: {
          scheduleId: schedule.id,
          restEndTime: now,
          restMinutes,
          totalRestMinutes
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取工作统计
   */
  static async getWorkStats(req, res, next) {
    try {
      const {
        userId,
        startDate,
        endDate,
        groupBy = 'day'
      } = req.query;

      // 检查权限：只有管理员、主管或查看自己的统计
      const currentUserId = req.user.userId;
      if (req.user.role !== 'admin' && 
          req.user.role !== 'supervisor' && 
          userId && userId !== currentUserId) {
        throw new ForbiddenError('无权查看其他用户的工作统计');
      }

      // 构建查询条件
      const where = {};
      
      if (userId) {
        where.userId = userId;
      } else if (req.user.role === 'agent') {
        where.userId = currentUserId;
      }
      
      if (startDate) {
        where.date = { ...where.date, [db.Sequelize.Op.gte]: startDate };
      }
      
      if (endDate) {
        where.date = { ...where.date, [db.Sequelize.Op.lte]: endDate };
      }

      // 获取总体统计
      const completedSchedules = await WorkSchedule.count({
        where: { ...where, status: 'completed' }
      });
      
      const totalSchedules = await WorkSchedule.count({ where });
      
      const workStats = await WorkSchedule.findOne({
        where,
        attributes: [
          [db.Sequelize.fn('SUM', db.Sequelize.col('totalWorkMinutes')), 'totalMinutes'],
          [db.Sequelize.fn('AVG', db.Sequelize.col('totalWorkMinutes')), 'avgMinutes'],
          [db.Sequelize.fn('SUM', db.Sequelize.col('lateMinutes')), 'totalLateMinutes'],
          [db.Sequelize.fn('AVG', db.Sequelize.col('lateMinutes')), 'avgLateMinutes'],
          [db.Sequelize.fn('SUM', db.Sequelize.col('isLate')), 'lateCount'],
          [db.Sequelize.fn('SUM', db.Sequelize.col('totalRestMinutes')), 'totalRestMinutes']
        ]
      });

      // 获取按客服分组的统计
      const agentStats = await WorkSchedule.findAll({
        where,
        attributes: [
          'userId',
          [db.Sequelize.fn('COUNT', 'id'), 'totalSchedules'],
          [db.Sequelize.fn('SUM', db.Sequelize.col('totalWorkMinutes')), 'totalMinutes'],
          [db.Sequelize.fn('AVG', db.Sequelize.col('totalWorkMinutes')), 'avgMinutes'],
          [db.Sequelize.fn('SUM', db.Sequelize.col('isLate')), 'lateCount'],
          [db.Sequelize.fn('SUM', db.Sequelize.col('isEarly')), 'earlyCount']
        ],
        group: ['userId'],
        include: [{
          model: User,
          attributes: ['username', 'firstName', 'lastName']
        }]
      });

      // 获取时间趋势统计
      let trendQuery = '';
      
      switch (groupBy) {
        case 'day':
          trendQuery = `
            SELECT 
              date as period,
              COUNT(*) as scheduleCount,
              SUM(totalWorkMinutes) as totalMinutes,
              AVG(totalWorkMinutes) as avgMinutes,
              SUM(isLate) as lateCount,
              SUM(isEarly) as earlyCount
            FROM work_schedules
            WHERE ${Object.keys(where).map(key => {
              if (key === 'date') {
                return Object.keys(where[key]).map(op => {
                  return `date ${op === db.Sequelize.Op.gte ? '>=' : '<='} :${key}_${op}`;
                }).join(' AND ');
              }
              return `${key} = :${key}`;
            }).join(' AND ')}
            GROUP BY date
            ORDER BY date ASC
          `;
          break;
        case 'week':
        case 'month':
          const interval = groupBy === 'week' ? 'week' : 'month';
          trendQuery = `
            SELECT 
              DATE_TRUNC(\'${interval}\, date) as period,
              COUNT(*) as scheduleCount,
              SUM(totalWorkMinutes) as totalMinutes,
              AVG(totalWorkMinutes) as avgMinutes,
              SUM(isLate) as lateCount,
              SUM(isEarly) as earlyCount
            FROM work_schedules
            WHERE ${Object.keys(where).map(key => {
              if (key === 'date') {
                return Object.keys(where[key]).map(op => {
                  return `date ${op === db.Sequelize.Op.gte ? '>=' : '<='} :${key}_${op}`;
                }).join(' AND ');
              }
              return `${key} = :${key}`;
            }).join(' AND ')}
            GROUP BY period
            ORDER BY period ASC
          `;
          break;
        default:
          trendQuery = `
            SELECT 
              date as period,
              COUNT(*) as scheduleCount,
              SUM(totalWorkMinutes) as totalMinutes,
              AVG(totalWorkMinutes) as avgMinutes,
              SUM(isLate) as lateCount,
              SUM(isEarly) as earlyCount
            FROM work_schedules
            WHERE ${Object.keys(where).map(key => {
              if (key === 'date') {
                return Object.keys(where[key]).map(op => {
                  return `date ${op === db.Sequelize.Op.gte ? '>=' : '<='} :${key}_${op}`;
                }).join(' AND ');
              }
              return `${key} = :${key}`;
            }).join(' AND ')}
            GROUP BY date
            ORDER BY date ASC
          `;
      }

      const replacements = { ...where };
      if (where.date) {
        if (where.date[db.Sequelize.Op.gte]) {
          replacements['date_' + db.Sequelize.Op.gte] = where.date[db.Sequelize.Op.gte];
        }
        if (where.date[db.Sequelize.Op.lte]) {
          replacements['date_' + db.Sequelize.Op.lte] = where.date[db.Sequelize.Op.lte];
        }
      }

      const trends = await db.sequelize.query(trendQuery, {
        replacements,
        type: db.sequelize.QueryTypes.SELECT
      });

      // 计算统计数据
      const totalMinutes = parseInt(workStats.dataValues.totalMinutes) || 0;
      const avgMinutes = parseFloat(workStats.dataValues.avgMinutes) || 0;
      const totalLateMinutes = parseInt(workStats.dataValues.totalLateMinutes) || 0;
      const avgLateMinutes = parseFloat(workStats.dataValues.avgLateMinutes) || 0;
      const lateCount = parseInt(workStats.dataValues.lateCount) || 0;
      const totalRestMinutes = parseInt(workStats.dataValues.totalRestMinutes) || 0;

      res.status(200).json({
        success: true,
        data: {
          summary: {
            totalSchedules,
            completedSchedules,
            completionRate: totalSchedules > 0 ? 
              (completedSchedules / totalSchedules * 100).toFixed(2) : 0,
            totalWorkHours: Math.floor(totalMinutes / 60),
            totalWorkMinutes: totalMinutes % 60,
            avgWorkHours: Math.floor(avgMinutes / 60),
            avgWorkMinutes: Math.floor(avgMinutes % 60),
            totalLateMinutes,
            avgLateMinutes,
            lateCount,
            lateRate: totalSchedules > 0 ? (lateCount / totalSchedules * 100).toFixed(2) : 0,
            totalRestMinutes
          },
          agentStats: agentStats.map(stat => ({
            agentId: stat.userId,
            agentName: stat.User ? `${stat.User.firstName} ${stat.User.lastName}` : '未知',
            username: stat.User?.username,
            totalSchedules: parseInt(stat.totalSchedules),
            totalWorkHours: Math.floor(parseInt(stat.totalMinutes) / 60),
            totalWorkMinutes: parseInt(stat.totalMinutes) % 60,
            avgWorkHours: Math.floor(parseFloat(stat.avgMinutes) / 60),
            avgWorkMinutes: Math.floor(parseFloat(stat.avgMinutes) % 60),
            lateCount: parseInt(stat.lateCount),
            earlyCount: parseInt(stat.earlyCount)
          })),
          trends: trends.map(trend => ({
            period: trend.period,
            scheduleCount: parseInt(trend.scheduleCount),
            totalWorkHours: Math.floor(parseInt(trend.totalMinutes) / 60),
            totalWorkMinutes: parseInt(trend.totalMinutes) % 60,
            avgWorkMinutes: parseFloat(trend.avgMinutes),
            lateCount: parseInt(trend.lateCount),
            earlyCount: parseInt(trend.earlyCount)
          }))
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 获取当前工作状态
   */
  static async getCurrentWorkStatus(req, res, next) {
    try {
      const currentUserId = req.user.userId;
      const today = new Date().toISOString().split('T')[0];

      // 查找今天的排班
      const schedule = await WorkSchedule.findOne({
        where: {
          userId: currentUserId,
          date: today
        }
      });

      let status = 'no_schedule';
      let data = {};

      if (schedule) {
        if (!schedule.actualStartTime) {
          status = 'scheduled';
          data = {
            scheduleId: schedule.id,
            scheduledStartTime: schedule.startTime,
            scheduledEndTime: schedule.endTime,
            shiftType: schedule.shiftType
          };
        } else if (!schedule.actualEndTime) {
          if (schedule.status === 'resting' && !schedule.restEndTime) {
            status = 'resting';
            data = {
              scheduleId: schedule.id,
              restStartTime: schedule.restStartTime,
              totalWorkMinutes: Math.floor((new Date() - new Date(schedule.actualStartTime)) / (1000 * 60)),
              totalRestMinutes: schedule.totalRestMinutes || 0
            };
          } else {
            status = 'working';
            data = {
              scheduleId: schedule.id,
              checkInTime: schedule.actualStartTime,
              totalWorkMinutes: Math.floor((new Date() - new Date(schedule.actualStartTime)) / (1000 * 60)),
              totalRestMinutes: schedule.totalRestMinutes || 0,
              isLate: schedule.isLate,
              lateMinutes: schedule.lateMinutes
            };
          }
        } else {
          status = 'completed';
          data = {
            scheduleId: schedule.id,
            checkInTime: schedule.actualStartTime,
            checkOutTime: schedule.actualEndTime,
            totalWorkMinutes: schedule.totalWorkMinutes,
            netWorkMinutes: schedule.netWorkMinutes,
            totalRestMinutes: schedule.totalRestMinutes,
            isLate: schedule.isLate,
            lateMinutes: schedule.lateMinutes,
            isEarly: schedule.isEarly,
            earlyMinutes: schedule.earlyMinutes
          };
        }
      }

      res.status(200).json({
        success: true,
        data: {
          status,
          ...data
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 批量操作排班
   */
  static async batchScheduleOperations(req, res, next) {
    try {
      // 验证请求数据
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new BadRequestError('请求数据验证失败', errors.array());
      }

      const { scheduleIds, operation, data } = req.body;
      const currentUserId = req.user.userId;

      // 检查权限：只有管理员和主管可以批量操作
      if (req.user.role !== 'admin' && req.user.role !== 'supervisor') {
        throw new ForbiddenError('无权批量操作排班');
      }

      // 验证参数
      if (!scheduleIds || !Array.isArray(scheduleIds) || scheduleIds.length === 0) {
        throw new BadRequestError('请提供有效的排班ID列表');
      }

      const validOperations = ['update_status', 'update_shift', 'delete'];
      if (!validOperations.includes(operation)) {
        throw new BadRequestError(`无效的操作类型，必须是以下之一: ${validOperations.join(', ')}`);
      }

      // 开始事务
      const transaction = await db.sequelize.transaction();
      
      try {
        let affectedCount = 0;

        switch (operation) {
          case 'update_status':
            if (!data?.status) {
              throw new BadRequestError('更新状态操作需要提供status参数');
            }
            affectedCount = await WorkSchedule.update(
              { status: data.status, updatedBy: currentUserId },
              { where: { id: scheduleIds }, transaction }
            );
            break;

          case 'update_shift':
            if (!data?.shiftType) {
              throw new BadRequestError('更新班次操作需要提供shiftType参数');
            }
            affectedCount = await WorkSchedule.update(
              { 
                shiftType: data.shiftType,
                startTime: data.startTime,
                endTime: data.endTime,
                updatedBy: currentUserId 
              },
              { where: { id: scheduleIds }, transaction }
            );
            break;

          case 'delete':
            // 只能删除未开始工作的排班
            affectedCount = await WorkSchedule.destroy({
              where: { 
                id: scheduleIds,
                actualStartTime: null
              },
              transaction
            });
            break;
        }

        // 提交事务
        await transaction.commit();

        // 记录操作日志
        await db.models.WorkLog.logScheduleBatchOperation({
          userId: currentUserId,
          operation,
          scheduleIds,
          affectedCount: affectedCount[0]
        });

        res.status(200).json({
          success: true,
          message: `成功${operation}操作 ${affectedCount[0]} 个排班`,
          data: { affectedCount: affectedCount[0] }
        });
      } catch (error) {
        // 回滚事务
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * 导入排班数据
   */
  static async importSchedules(req, res, next) {
    try {
      // 检查权限：只有管理员和主管可以导入
      if (req.user.role !== 'admin' && req.user.role !== 'supervisor') {
        throw new ForbiddenError('无权导入排班数据');
      }

      // 这里应该有文件解析逻辑，示例中直接使用请求体数据
      const { schedules } = req.body;
      const createdBy = req.user.userId;

      if (!schedules || !Array.isArray(schedules) || schedules.length === 0) {
        throw new BadRequestError('请提供有效的排班数据');
      }

      // 开始事务
      const transaction = await db.sequelize.transaction();
      
      try {
        const importedSchedules = [];
        const errors = [];

        for (const scheduleData of schedules) {
          try {
            // 验证数据
            const { userId, date, startTime, endTime, shiftType } = scheduleData;
            
            if (!userId || !date || !startTime || !endTime || !shiftType) {
              throw new BadRequestError('缺少必要的排班信息');
            }

            // 检查客服是否存在
            const agent = await User.findByPk(userId);
            if (!agent || agent.role !== 'agent') {
              throw new NotFoundError(`ID为${userId}的客服不存在`);
            }

            // 检查是否已有排班
            const existingSchedule = await WorkSchedule.findOne({
              where: {
                userId,
                date: new Date(date).toISOString().split('T')[0]
              },
              transaction
            });

            if (existingSchedule) {
              // 更新现有排班
              await existingSchedule.update({
                startTime,
                endTime,
                shiftType,
                note: scheduleData.note,
                updatedBy: createdBy
              }, { transaction });
              importedSchedules.push(existingSchedule);
            } else {
              // 创建新排班
              const schedule = await WorkSchedule.create({
                userId,
                date: new Date(date).toISOString().split('T')[0],
                startTime,
                endTime,
                shiftType,
                note: scheduleData.note,
                status: 'scheduled',
                createdBy
              }, { transaction });
              importedSchedules.push(schedule);
            }
          } catch (error) {
            errors.push({
              data: scheduleData,
              error: error.message
            });
          }
        }

        // 提交事务
        await transaction.commit();

        // 记录操作日志
        await db.models.WorkLog.logScheduleImported({
          userId: createdBy,
          totalCount: schedules.length,
          importedCount: importedSchedules.length,
          errorCount: errors.length
        });

        res.status(200).json({
          success: true,
          message: `成功导入${importedSchedules.length}个排班，失败${errors.length}个`,
          data: {
            importedCount: importedSchedules.length,
            errorCount: errors.length,
            errors: errors.length > 0 ? errors : undefined
          }
        });
      } catch (error) {
        // 回滚事务
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      next(error);
    }
  }
}

module.exports = WorkScheduleController;