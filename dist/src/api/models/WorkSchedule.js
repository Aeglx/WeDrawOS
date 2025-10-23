import { DataTypes, Model } from 'sequelize';

/**
 * 工作时间管理模型
 * 记录和管理客服的工作时间和排班信息
 */
class WorkSchedule extends Model {
  /**
   * 初始化工作时间管理模型
   * @param {Object} sequelize - Sequelize实例
   */
  static init(sequelize) {
    return super.init(
      {
        // 基本字段
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
          allowNull: false
        },
        
        // 关联字段
        userId: {
          type: DataTypes.UUID,
          allowNull: false,
          references: {
            model: 'users',
            key: 'id'
          },
          onDelete: 'CASCADE'
        },
        
        // 班次信息
        shiftId: {
          type: DataTypes.STRING(50),
          allowNull: true,
          comment: '班次标识'
        },
        
        // 日期信息
        scheduleDate: {
          type: DataTypes.DATEONLY,
          allowNull: false
        },
        
        // 开始时间
        startTime: {
          type: DataTypes.TIME,
          allowNull: false
        },
        
        // 结束时间
        endTime: {
          type: DataTypes.TIME,
          allowNull: false
        },
        
        // 休息时间（分钟）
        breakTime: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
          comment: '休息时间（分钟）'
        },
        
        // 班次类型
        shiftType: {
          type: DataTypes.ENUM(
            'morning',
            'afternoon',
            'evening',
            'night',
            'graveyard',
            'full_day',
            'part_time',
            'on_call',
            'flexible'
          ),
          allowNull: false,
          defaultValue: 'full_day'
        },
        
        // 工作状态
        status: {
          type: DataTypes.ENUM(
            'scheduled',
            'confirmed',
            'clocked_in',
            'on_break',
            'clocked_out',
            'absent',
            'late',
            'completed',
            'cancelled',
            'modified'
          ),
          allowNull: false,
          defaultValue: 'scheduled'
        },
        
        // 迟到情况
        isLate: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false
        },
        
        // 迟到时长（分钟）
        lateMinutes: {
          type: DataTypes.INTEGER,
          allowNull: true
        },
        
        // 实际打卡时间
        actualClockInTime: {
          type: DataTypes.DATE,
          allowNull: true
        },
        
        // 实际下班时间
        actualClockOutTime: {
          type: DataTypes.DATE,
          allowNull: true
        },
        
        // 实际工作时长（分钟）
        actualWorkMinutes: {
          type: DataTypes.INTEGER,
          allowNull: true,
          comment: '实际工作时长（分钟）'
        },
        
        // 备注信息
        notes: {
          type: DataTypes.TEXT,
          allowNull: true
        },
        
        // 工作区域/站点
        workLocation: {
          type: DataTypes.STRING(100),
          allowNull: true
        },
        
        // 是否远程工作
        isRemote: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false
        },
        
        // 工作类型
        workType: {
          type: DataTypes.ENUM(
            'chat',
            'voice',
            'email',
            'video',
            'mixed',
            'support',
            'sales',
            'technical',
            'manager'
          ),
          allowNull: false,
          defaultValue: 'chat'
        },
        
        // 最大并发会话数
        maxConcurrentSessions: {
          type: DataTypes.INTEGER,
          allowNull: true,
          defaultValue: 5
        },
        
        // 超时设置（秒）
        sessionTimeout: {
          type: DataTypes.INTEGER,
          allowNull: true,
          defaultValue: 300
        },
        
        // 自动分配
        autoAssign: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true
        },
        
        // 排班人
        scheduledBy: {
          type: DataTypes.UUID,
          allowNull: true,
          references: {
            model: 'users',
            key: 'id'
          },
          onDelete: 'SET NULL'
        },
        
        // 审批状态
        approvalStatus: {
          type: DataTypes.ENUM('pending', 'approved', 'rejected'),
          allowNull: true,
          defaultValue: 'approved'
        },
        
        // 审批人
        approvedBy: {
          type: DataTypes.UUID,
          allowNull: true,
          references: {
            model: 'users',
            key: 'id'
          },
          onDelete: 'SET NULL'
        },
        
        // 审批时间
        approvedAt: {
          type: DataTypes.DATE,
          allowNull: true
        },
        
        // 替代人员ID
        substituteId: {
          type: DataTypes.UUID,
          allowNull: true,
          references: {
            model: 'users',
            key: 'id'
          },
          onDelete: 'SET NULL'
        },
        
        // 工作统计
        workStats: {
          type: DataTypes.JSONB,
          allowNull: true,
          defaultValue: {
            totalSessions: 0,
            resolvedSessions: 0,
            averageResponseTime: 0,
            averageResolutionTime: 0,
            customerSatisfaction: 0
          }
        },
        
        // 元数据
        metadata: {
          type: DataTypes.JSONB,
          allowNull: true,
          defaultValue: {}
        }
      },
      {
        sequelize,
        modelName: 'WorkSchedule',
        tableName: 'work_schedules',
        timestamps: true,
        paranoid: true,
        indexes: [
          { fields: ['userId'] },
          { fields: ['scheduleDate'] },
          { fields: ['status'] },
          { fields: ['shiftType'] },
          { fields: ['workType'] },
          { fields: ['createdAt'] },
          {
            fields: ['userId', 'scheduleDate'],
            name: 'idx_user_date',
            unique: true
          },
          {
            fields: ['status', 'scheduleDate'],
            name: 'idx_status_date'
          },
          {
            fields: ['scheduleDate', 'shiftType'],
            name: 'idx_date_shift'
          },
          {
            fields: ['userId', 'status'],
            name: 'idx_user_status'
          },
          {
            fields: ['userId', 'createdAt'],
            name: 'idx_user_created'
          }
        ],
        hooks: {
          beforeCreate: (schedule) => {
            // 验证开始时间和结束时间
            if (schedule.startTime && schedule.endTime) {
              const start = new Date(`2000-01-01T${schedule.startTime}`);
              const end = new Date(`2000-01-01T${schedule.endTime}`);
              
              if (start >= end) {
                throw new Error('结束时间必须晚于开始时间');
              }
            }
          },
          beforeUpdate: (schedule) => {
            // 如果状态变更为已打卡下班，计算实际工作时长
            if (schedule.changed('status') && schedule.status === 'completed' && 
                schedule.actualClockInTime && schedule.actualClockOutTime) {
              const workTimeMs = schedule.actualClockOutTime - schedule.actualClockInTime;
              const workMinutes = Math.floor(workTimeMs / (1000 * 60)) - schedule.breakTime;
              schedule.actualWorkMinutes = Math.max(0, workMinutes);
            }
            
            // 检查是否迟到
            if (schedule.actualClockInTime && schedule.startTime) {
              const scheduledStart = new Date(`2000-01-01T${schedule.startTime}`);
              const actualStart = new Date(schedule.actualClockInTime);
              const startOfDay = new Date(actualStart);
              startOfDay.setHours(0, 0, 0, 0);
              
              const scheduledTime = new Date(startOfDay);
              scheduledTime.setHours(scheduledStart.getHours(), scheduledStart.getMinutes());
              
              const diffMinutes = Math.floor((actualStart - scheduledTime) / (1000 * 60));
              
              if (diffMinutes > 5) { // 5分钟以上算迟到
                schedule.isLate = true;
                schedule.lateMinutes = diffMinutes;
              } else {
                schedule.isLate = false;
                schedule.lateMinutes = null;
              }
            }
          }
        }
      }
    );
  }
  
  /**
   * 关联模型
   */
  static associate(models) {
    // 关联用户
    this.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
    
    // 关联排班人
    this.belongsTo(models.User, {
      foreignKey: 'scheduledBy',
      as: 'scheduler'
    });
    
    // 关联审批人
    this.belongsTo(models.User, {
      foreignKey: 'approvedBy',
      as: 'approver'
    });
    
    // 关联替代人员
    this.belongsTo(models.User, {
      foreignKey: 'substituteId',
      as: 'substitute'
    });
    
    // 一对多关系（一个工作安排可能有多个工作记录）
    this.hasMany(models.WorkLog, {
      foreignKey: 'scheduleId',
      as: 'workLogs'
    });
  }
  
  /**
   * 打卡签到
   * @param {Object} location - 位置信息（可选）
   */
  async clockIn(location = null) {
    if (this.status !== 'scheduled' && this.status !== 'confirmed') {
      throw new Error('当前状态不允许打卡签到');
    }
    
    this.status = 'clocked_in';
    this.actualClockInTime = new Date();
    
    if (location) {
      this.metadata = {
        ...this.metadata,
        clockInLocation: location
      };
    }
    
    await this.save();
    return this;
  }
  
  /**
   * 开始休息
   * @returns {Object} 休息记录
   */
  async startBreak() {
    if (this.status !== 'clocked_in') {
      throw new Error('当前状态不允许开始休息');
    }
    
    this.status = 'on_break';
    
    // 记录休息开始时间
    this.metadata = {
      ...this.metadata,
      breakStartTime: new Date()
    };
    
    await this.save();
    return this;
  }
  
  /**
   * 结束休息
   * @returns {Object} 更新后的排班
   */
  async endBreak() {
    if (this.status !== 'on_break') {
      throw new Error('当前状态不是休息中');
    }
    
    this.status = 'clocked_in';
    
    // 计算休息时长
    const breakStartTime = this.metadata?.breakStartTime;
    if (breakStartTime) {
      const breakEndTime = new Date();
      const breakDuration = Math.floor((breakEndTime - new Date(breakStartTime)) / (1000 * 60));
      
      // 更新休息总时长
      this.breakTime += breakDuration;
      
      // 记录休息历史
      const breaks = this.metadata?.breaks || [];
      breaks.push({
        start: breakStartTime,
        end: breakEndTime,
        duration: breakDuration
      });
      
      this.metadata = {
        ...this.metadata,
        breaks,
        breakStartTime: null
      };
    }
    
    await this.save();
    return this;
  }
  
  /**
   * 打卡签退
   * @param {Object} location - 位置信息（可选）
   */
  async clockOut(location = null) {
    if (this.status !== 'clocked_in' && this.status !== 'on_break') {
      throw new Error('当前状态不允许打卡签退');
    }
    
    // 如果正在休息，先结束休息
    if (this.status === 'on_break') {
      await this.endBreak();
    }
    
    this.status = 'completed';
    this.actualClockOutTime = new Date();
    
    // 计算实际工作时长
    if (this.actualClockInTime) {
      const workTimeMs = this.actualClockOutTime - this.actualClockInTime;
      const workMinutes = Math.floor(workTimeMs / (1000 * 60)) - this.breakTime;
      this.actualWorkMinutes = Math.max(0, workMinutes);
    }
    
    if (location) {
      this.metadata = {
        ...this.metadata,
        clockOutLocation: location
      };
    }
    
    await this.save();
    return this;
  }
  
  /**
   * 更新工作统计数据
   * @param {Object} stats - 统计数据
   */
  async updateWorkStats(stats) {
    this.workStats = {
      ...this.workStats,
      ...stats
    };
    await this.save();
    return this;
  }
  
  /**
   * 审批排班
   * @param {boolean} approved - 是否批准
   * @param {string} userId - 审批人ID
   * @param {string} notes - 审批备注
   */
  async approveSchedule(approved, userId, notes = '') {
    this.approvalStatus = approved ? 'approved' : 'rejected';
    this.approvedBy = userId;
    this.approvedAt = new Date();
    
    if (notes) {
      this.notes = this.notes ? `${this.notes}\n${notes}` : notes;
    }
    
    await this.save();
    return this;
  }
  
  /**
   * 查找用户在指定日期范围的排班
   * @param {string} userId - 用户ID
   * @param {Date} startDate - 开始日期
   * @param {Date} endDate - 结束日期
   * @returns {Array} 排班列表
   */
  static async findByUserAndDateRange(userId, startDate, endDate) {
    return await this.findAll({
      where: {
        userId,
        scheduleDate: {
          [this.sequelize.Op.between]: [startDate, endDate]
        }
      },
      order: [['scheduleDate', 'ASC']]
    });
  }
  
  /**
   * 获取指定日期在职的客服列表
   * @param {Date} date - 日期
   * @param {Array<string>} statuses - 状态列表
   * @returns {Array} 客服列表
   */
  static async findWorkingAgentsByDate(date, statuses = ['clocked_in', 'on_break']) {
    const dateOnly = date.toISOString().split('T')[0];
    
    return await this.findAll({
      where: {
        scheduleDate: dateOnly,
        status: {
          [this.sequelize.Op.in]: statuses
        }
      },
      include: ['user']
    });
  }
  
  /**
   * 获取用户当月工作统计
   * @param {string} userId - 用户ID
   * @param {number} year - 年份
   * @param {number} month - 月份（1-12）
   * @returns {Object} 统计数据
   */
  static async getUserMonthlyStats(userId, year, month) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    const schedules = await this.findAll({
      where: {
        userId,
        scheduleDate: {
          [this.sequelize.Op.between]: [startDate, endDate]
        },
        status: {
          [this.sequelize.Op.in]: ['completed', 'clocked_out']
        }
      }
    });
    
    let totalWorkMinutes = 0;
    let totalSessions = 0;
    let resolvedSessions = 0;
    let totalLateMinutes = 0;
    let lateCount = 0;
    
    schedules.forEach(schedule => {
      if (schedule.actualWorkMinutes) {
        totalWorkMinutes += schedule.actualWorkMinutes;
      }
      
      if (schedule.isLate && schedule.lateMinutes) {
        totalLateMinutes += schedule.lateMinutes;
        lateCount++;
      }
      
      if (schedule.workStats) {
        totalSessions += schedule.workStats.totalSessions || 0;
        resolvedSessions += schedule.workStats.resolvedSessions || 0;
      }
    });
    
    return {
      totalWorkHours: Math.round((totalWorkMinutes / 60) * 100) / 100,
      totalSessions,
      resolvedSessions,
      resolutionRate: totalSessions > 0 ? Math.round((resolvedSessions / totalSessions) * 100) / 100 : 0,
      totalLateMinutes,
      lateCount,
      scheduleCount: schedules.length
    };
  }
  
  /**
   * 转换为响应对象
   * @returns {Object} 响应对象
   */
  toResponseObject() {
    return {
      id: this.id,
      userId: this.userId,
      shiftId: this.shiftId,
      scheduleDate: this.scheduleDate,
      startTime: this.startTime,
      endTime: this.endTime,
      breakTime: this.breakTime,
      shiftType: this.shiftType,
      status: this.status,
      isLate: this.isLate,
      lateMinutes: this.lateMinutes,
      actualClockInTime: this.actualClockInTime,
      actualClockOutTime: this.actualClockOutTime,
      actualWorkMinutes: this.actualWorkMinutes,
      notes: this.notes,
      workLocation: this.workLocation,
      isRemote: this.isRemote,
      workType: this.workType,
      maxConcurrentSessions: this.maxConcurrentSessions,
      sessionTimeout: this.sessionTimeout,
      autoAssign: this.autoAssign,
      scheduledBy: this.scheduledBy,
      approvalStatus: this.approvalStatus,
      approvedBy: this.approvedBy,
      approvedAt: this.approvedAt,
      substituteId: this.substituteId,
      workStats: this.workStats,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      // 关联信息会在查询时包含
      user: this.user ? this.user.toSafeObject() : null,
      scheduler: this.scheduler ? this.scheduler.toSafeObject() : null,
      approver: this.approver ? this.approver.toSafeObject() : null,
      substitute: this.substitute ? this.substitute.toSafeObject() : null
    };
  }
  
  /**
   * 获取摘要信息
   * @returns {Object} 摘要信息
   */
  toSummary() {
    const scheduledHours = this.startTime && this.endTime ? {
      start: this.startTime,
      end: this.endTime
    } : null;
    
    const actualHours = this.actualClockInTime && this.actualClockOutTime ? {
      start: this.actualClockInTime,
      end: this.actualClockOutTime,
      duration: this.actualWorkMinutes
    } : null;
    
    return {
      id: this.id,
      date: this.scheduleDate,
      shiftType: this.shiftType,
      status: this.status,
      scheduledHours,
      actualHours,
      isLate: this.isLate,
      workType: this.workType,
      totalSessions: this.workStats?.totalSessions || 0,
      resolvedSessions: this.workStats?.resolvedSessions || 0
    };
  }