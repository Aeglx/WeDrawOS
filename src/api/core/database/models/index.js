/**
 * 模型加载器
 * 负责加载和初始化所有数据库模型
 */

const fs = require('fs');
const path = require('path');
const { Logger } = require('../../logging/logger');
const logger = Logger.getInstance();

/**
 * 加载所有模型
 * @param {Object} sequelize - Sequelize实例
 * @returns {Object} 模型集合
 */
function loadModels(sequelize) {
  const models = {};
  const modelFiles = [];
  
  try {
    // 获取当前目录中的所有模型文件
    const files = fs.readdirSync(__dirname);
    
    // 过滤出JavaScript文件，排除index.js
    const jsFiles = files.filter(file => {
      return file.endsWith('.js') && file !== 'index.js';
    });
    
    logger.info(`Found ${jsFiles.length} model files`);
    
    // 加载每个模型
    jsFiles.forEach(file => {
      const modelName = file.split('.')[0];
      const modelPath = path.join(__dirname, file);
      
      logger.debug(`Loading model: ${modelName} from ${modelPath}`);
      
      // 加载模型定义函数
      const modelDefinition = require(modelPath);
      
      // 初始化模型
      const model = modelDefinition(sequelize, sequelize.Sequelize.DataTypes);
      
      // 存储模型
      models[modelName] = model;
      modelFiles.push({ name: modelName, path: modelPath });
      
      logger.debug(`Model ${modelName} loaded successfully`);
    });
    
    // 设置模型关联
    Object.keys(models).forEach(modelName => {
      if (models[modelName].associate) {
        try {
          models[modelName].associate(models);
          logger.debug(`Associations set for model: ${modelName}`);
        } catch (error) {
          logger.error(`Error setting associations for model ${modelName}:`, error);
        }
      }
    });
    
    logger.info(`Successfully loaded ${Object.keys(models).length} models`);
    
    // 添加模型加载器的元信息
    models._meta = {
      loadedModels: modelFiles,
      loadedAt: new Date(),
      sequelizeVersion: sequelize.Sequelize.version
    };
    
    return models;
  } catch (error) {
    logger.error('Error loading models:', error);
    throw error;
  }
}

/**
 * 检查模型关系
 * @param {Object} models - 模型集合
 * @returns {Object} 关系信息
 */
function checkModelRelations(models) {
  const relations = {};
  
  try {
    Object.keys(models).forEach(modelName => {
      if (modelName === '_meta') return;
      
      const model = models[modelName];
      relations[modelName] = {
        belongsTo: [],
        hasMany: [],
        hasOne: [],
        belongsToMany: []
      };
      
      // 检查模型关联
      if (model.associations) {
        Object.keys(model.associations).forEach(associationName => {
          const association = model.associations[associationName];
          const targetModelName = association.target.name;
          
          switch (association.associationType) {
            case 'BelongsTo':
              relations[modelName].belongsTo.push({
                as: association.as,
                target: targetModelName,
                foreignKey: association.foreignKey
              });
              break;
            case 'HasMany':
              relations[modelName].hasMany.push({
                as: association.as,
                target: targetModelName,
                foreignKey: association.foreignKey
              });
              break;
            case 'HasOne':
              relations[modelName].hasOne.push({
                as: association.as,
                target: targetModelName,
                foreignKey: association.foreignKey
              });
              break;
            case 'BelongsToMany':
              relations[modelName].belongsToMany.push({
                as: association.as,
                target: targetModelName,
                through: association.through.model ? association.through.model.name : association.through
              });
              break;
          }
        });
      }
    });
    
    return relations;
  } catch (error) {
    logger.error('Error checking model relations:', error);
    return {};
  }
}

/**
 * 获取模型信息
 * @param {Object} models - 模型集合
 * @returns {Object} 模型信息
 */
function getModelInfo(models) {
  const info = {};
  
  try {
    Object.keys(models).forEach(modelName => {
      if (modelName === '_meta') return;
      
      const model = models[modelName];
      const attributes = {};
      
      // 获取模型属性
      Object.keys(model.rawAttributes).forEach(attrName => {
        const attr = model.rawAttributes[attrName];
        attributes[attrName] = {
          type: attr.type.toString(),
          allowNull: attr.allowNull,
          primaryKey: attr.primaryKey,
          unique: attr.unique,
          defaultValue: attr.defaultValue
        };
      });
      
      // 获取模型索引
      const indexes = model.options.indexes || [];
      
      info[modelName] = {
        tableName: model.tableName,
        timestamps: model.options.timestamps,
        paranoid: model.options.paranoid,
        underscored: model.options.underscored,
        attributes,
        indexesCount: indexes.length
      };
    });
    
    return info;
  } catch (error) {
    logger.error('Error getting model info:', error);
    return {};
  }
}

/**
 * 验证所有模型
 * @param {Object} models - 模型集合
 * @returns {Object} 验证结果
 */
async function validateModels(models) {
  const validationResults = {};
  let allValid = true;
  
  try {
    for (const modelName of Object.keys(models)) {
      if (modelName === '_meta') continue;
      
      const model = models[modelName];
      
      try {
        // 执行模型验证
        await model.sync({ alter: false });
        validationResults[modelName] = { valid: true, message: 'Model validation passed' };
      } catch (error) {
        validationResults[modelName] = { valid: false, message: error.message };
        allValid = false;
        logger.error(`Model validation failed for ${modelName}:`, error);
      }
    }
    
    return { allValid, validationResults };
  } catch (error) {
    logger.error('Error validating models:', error);
    return { allValid: false, validationResults: {} };
  }
}

/**
 * 模型加载器模块
 */
module.exports = {
  loadModels,
  checkModelRelations,
  getModelInfo,
  validateModels
};