/**
 * 国际化工具
 * 提供多语言支持和本地化功能
 */

const fs = require('fs').promises;
const path = require('path');
const logger = require('../logger');
const { AppError } = require('../../exception/handlers/errorHandler');
const { I18nError } = require('../../exception/handlers/errorHandler');
const { typeUtils } = require('../type');
const { fileUtils } = require('../file');

/**
 * 国际化工具类
 */
class I18nUtils {
  /**
   * 构造函数
   * @param {Object} options - 配置选项
   */
  constructor(options = {}) {
    this.options = {
      defaultLocale: options.defaultLocale || 'en',
      fallbackLocale: options.fallbackLocale || 'en',
      translationsPath: options.translationsPath || path.join(process.cwd(), 'translations'),
      autoReload: options.autoReload || false,
      reloadInterval: options.reloadInterval || 5000,
      missingKeyHandler: options.missingKeyHandler || this.defaultMissingKeyHandler.bind(this),
      ...options
    };

    this.locales = new Set();
    this.translations = {};
    this.loaded = false;
    this.reloadTimer = null;

    this.initialize();
    logger.debug('国际化工具初始化完成', {
      defaultLocale: this.options.defaultLocale,
      fallbackLocale: this.options.fallbackLocale
    });
  }

  /**
   * 初始化
   * @private
   */
  async initialize() {
    try {
      // 加载翻译文件
      await this.loadTranslations();
      
      // 设置自动重载
      if (this.options.autoReload) {
        this.setupAutoReload();
      }
    } catch (error) {
      logger.error('国际化工具初始化失败', {
        error: error.message
      });
    }
  }

  /**
   * 加载翻译文件
   * @param {string} locale - 特定语言（可选）
   * @returns {Promise<boolean>} 是否加载成功
   */
  async loadTranslations(locale = null) {
    try {
      // 确保翻译目录存在
      const translationsDirExists = await fileUtils.exists(this.options.translationsPath);
      if (!translationsDirExists) {
        logger.warn('翻译目录不存在，创建默认结构', {
          path: this.options.translationsPath
        });
        await fileUtils.mkdir(this.options.translationsPath, { recursive: true });
        
        // 创建默认语言文件
        const defaultTranslations = {
          "hello": "Hello",
          "welcome": "Welcome",
          "goodbye": "Goodbye",
          "yes": "Yes",
          "no": "No"
        };
        await this.saveTranslations(this.options.defaultLocale, defaultTranslations);
      }

      if (locale) {
        // 加载特定语言
        await this.loadLocale(locale);
      } else {
        // 加载所有语言
        const files = await fs.readdir(this.options.translationsPath);
        const jsonFiles = files.filter(file => file.endsWith('.json'));
        
        for (const file of jsonFiles) {
          const locale = file.replace('.json', '');
          await this.loadLocale(locale);
        }

        // 确保默认语言和回退语言存在
        if (!this.locales.has(this.options.defaultLocale)) {
          await this.loadLocale(this.options.defaultLocale);
        }
        if (!this.locales.has(this.options.fallbackLocale)) {
          await this.loadLocale(this.options.fallbackLocale);
        }
      }

      this.loaded = true;
      logger.debug('翻译加载完成', {
        loadedLocales: Array.from(this.locales)
      });
      return true;
    } catch (error) {
      logger.error('加载翻译失败', {
        error: error.message,
        locale
      });
      throw new I18nError(`加载翻译失败: ${error.message}`, {
        code: 'LOAD_TRANSLATIONS_ERROR',
        locale,
        cause: error
      });
    }
  }

  /**
   * 加载单个语言文件
   * @param {string} locale - 语言代码
   * @private
   */
  async loadLocale(locale) {
    try {
      const filePath = path.join(this.options.translationsPath, `${locale}.json`);
      
      try {
        const fileContent = await fs.readFile(filePath, 'utf8');
        const translations = JSON.parse(fileContent);
        
        this.translations[locale] = translations;
        this.locales.add(locale);
        
        logger.debug('语言文件加载成功', {
          locale,
          filePath,
          translationCount: Object.keys(translations).length
        });
      } catch (error) {
        if (error.code === 'ENOENT') {
          // 文件不存在，创建空对象
          logger.warn('语言文件不存在，创建默认空对象', {
            locale,
            filePath
          });
          this.translations[locale] = {};
          this.locales.add(locale);
          await this.saveTranslations(locale, {});
        } else {
          throw error;
        }
      }
    } catch (error) {
      logger.error('加载语言文件失败', {
        locale,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * 保存翻译
   * @param {string} locale - 语言代码
   * @param {Object} translations - 翻译对象
   * @returns {Promise<boolean>} 是否保存成功
   */
  async saveTranslations(locale, translations) {
    try {
      const filePath = path.join(this.options.translationsPath, `${locale}.json`);
      
      await fs.writeFile(
        filePath,
        JSON.stringify(translations, null, 2),
        'utf8'
      );
      
      logger.debug('翻译保存成功', {
        locale,
        filePath
      });
      
      // 更新内存中的翻译
      this.translations[locale] = translations;
      this.locales.add(locale);
      
      return true;
    } catch (error) {
      logger.error('保存翻译失败', {
        locale,
        error: error.message
      });
      throw new I18nError(`保存翻译失败: ${error.message}`, {
        code: 'SAVE_TRANSLATIONS_ERROR',
        locale,
        cause: error
      });
    }
  }

  /**
   * 翻译文本
   * @param {string} key - 翻译键
   * @param {Object} options - 翻译选项
   * @param {string} options.locale - 目标语言
   * @param {Object} options.values - 替换值
   * @returns {string} 翻译后的文本
   */
  t(key, options = {}) {
    const { 
      locale = this.options.defaultLocale,
      values = {}
    } = options;

    // 确保key有效
    if (!key || typeof key !== 'string') {
      return key || '';
    }

    // 尝试从指定语言获取翻译
    let translation = this.getValueFromPath(locale, key);

    // 如果未找到，尝试回退语言
    if (translation === null && locale !== this.options.fallbackLocale) {
      translation = this.getValueFromPath(this.options.fallbackLocale, key);
    }

    // 如果仍然未找到，使用missingKeyHandler
    if (translation === null) {
      return this.options.missingKeyHandler(key, locale, options);
    }

    // 替换变量
    return this.replaceVariables(translation, values);
  }

  /**
   * 从嵌套路径获取值
   * @param {string} locale - 语言代码
   * @param {string} path - 键路径（支持点号分隔）
   * @private
   */
  getValueFromPath(locale, path) {
    if (!this.translations[locale]) {
      return null;
    }

    const keys = path.split('.');
    let value = this.translations[locale];

    for (const key of keys) {
      if (value === null || value === undefined) {
        return null;
      }
      value = value[key];
    }

    return value !== undefined ? String(value) : null;
  }

  /**
   * 替换变量
   * @param {string} text - 原始文本
   * @param {Object} values - 变量值
   * @private
   */
  replaceVariables(text, values) {
    if (!values || typeUtils.isObject(values)) {
      return text;
    }

    let result = text;

    // 支持 {variable} 和 {{variable}} 格式
    Object.entries(values).forEach(([key, value]) => {
      const regex1 = new RegExp(`\\{${key}\\}`, 'g');
      const regex2 = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      
      result = result.replace(regex1, String(value));
      result = result.replace(regex2, String(value));
    });

    return result;
  }

  /**
   * 默认的缺失键处理器
   * @param {string} key - 缺失的键
   * @param {string} locale - 语言代码
   * @param {Object} options - 选项
   * @private
   */
  defaultMissingKeyHandler(key, locale, options) {
    logger.warn('翻译键未找到', {
      key,
      locale
    });
    return key;
  }

  /**
   * 添加翻译
   * @param {string} locale - 语言代码
   * @param {string} key - 翻译键
   * @param {string} value - 翻译值
   * @param {Object} options - 选项
   * @param {boolean} options.save - 是否保存到文件
   * @returns {Promise<boolean>|boolean} 是否添加成功
   */
  addTranslation(locale, key, value, options = {}) {
    const { save = false } = options;

    if (!this.translations[locale]) {
      this.translations[locale] = {};
      this.locales.add(locale);
    }

    // 处理嵌套键
    const keys = key.split('.');
    let current = this.translations[locale];

    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (!current[k]) {
        current[k] = {};
      }
      current = current[k];
    }

    current[keys[keys.length - 1]] = value;

    logger.debug('翻译添加成功', {
      locale,
      key
    });

    if (save) {
      return this.saveTranslations(locale, this.translations[locale]);
    }

    return true;
  }

  /**
   * 批量添加翻译
   * @param {string} locale - 语言代码
   * @param {Object} translations - 翻译对象
   * @param {Object} options - 选项
   * @returns {Promise<boolean>|boolean} 是否添加成功
   */
  addTranslations(locale, translations, options = {}) {
    const { save = false, merge = true } = options;

    if (!merge || !this.translations[locale]) {
      this.translations[locale] = {};
    }

    // 深度合并
    this.translations[locale] = this.deepMerge(
      this.translations[locale],
      translations
    );

    this.locales.add(locale);

    logger.debug('批量翻译添加成功', {
      locale,
      count: Object.keys(translations).length
    });

    if (save) {
      return this.saveTranslations(locale, this.translations[locale]);
    }

    return true;
  }

  /**
   * 深度合并对象
   * @param {Object} target - 目标对象
   * @param {Object} source - 源对象
   * @private
   */
  deepMerge(target, source) {
    const output = { ...target };

    if (typeUtils.isPlainObject(target) && typeUtils.isPlainObject(source)) {
      Object.keys(source).forEach(key => {
        if (typeUtils.isPlainObject(source[key])) {
          if (!(key in target)) {
            output[key] = source[key];
          } else {
            output[key] = this.deepMerge(target[key], source[key]);
          }
        } else {
          output[key] = source[key];
        }
      });
    }

    return output;
  }

  /**
   * 删除翻译
   * @param {string} locale - 语言代码
   * @param {string} key - 翻译键
   * @param {Object} options - 选项
   * @returns {Promise<boolean>|boolean} 是否删除成功
   */
  removeTranslation(locale, key, options = {}) {
    const { save = false } = options;

    if (!this.translations[locale]) {
      return false;
    }

    const keys = key.split('.');
    let current = this.translations[locale];
    let parent = null;
    let lastKey = null;

    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      if (!current[k]) {
        return false;
      }
      
      if (i === keys.length - 1) {
        parent = current;
        lastKey = k;
      } else {
        parent = current;
        current = current[k];
        lastKey = k;
      }
    }

    if (parent && lastKey !== null) {
      delete parent[lastKey];
      
      logger.debug('翻译删除成功', {
        locale,
        key
      });

      if (save) {
        return this.saveTranslations(locale, this.translations[locale]);
      }

      return true;
    }

    return false;
  }

  /**
   * 获取所有支持的语言
   * @returns {Array<string>} 语言代码数组
   */
  getLocales() {
    return Array.from(this.locales);
  }

  /**
   * 检查语言是否支持
   * @param {string} locale - 语言代码
   * @returns {boolean} 是否支持
   */
  hasLocale(locale) {
    return this.locales.has(locale);
  }

  /**
   * 设置默认语言
   * @param {string} locale - 语言代码
   * @returns {boolean} 是否设置成功
   */
  setDefaultLocale(locale) {
    if (!locale || typeof locale !== 'string') {
      return false;
    }

    this.options.defaultLocale = locale;
    
    // 确保语言已加载
    if (!this.hasLocale(locale)) {
      this.loadLocale(locale).catch(error => {
        logger.error('加载默认语言失败', {
          locale,
          error: error.message
        });
      });
    }

    logger.debug('默认语言设置成功', {
      locale
    });
    return true;
  }

  /**
   * 设置回退语言
   * @param {string} locale - 语言代码
   * @returns {boolean} 是否设置成功
   */
  setFallbackLocale(locale) {
    if (!locale || typeof locale !== 'string') {
      return false;
    }

    this.options.fallbackLocale = locale;
    
    // 确保语言已加载
    if (!this.hasLocale(locale)) {
      this.loadLocale(locale).catch(error => {
        logger.error('加载回退语言失败', {
          locale,
          error: error.message
        });
      });
    }

    logger.debug('回退语言设置成功', {
      locale
    });
    return true;
  }

  /**
   * 设置自定义缺失键处理器
   * @param {Function} handler - 处理器函数
   */
  setMissingKeyHandler(handler) {
    if (typeUtils.isFunction(handler)) {
      this.options.missingKeyHandler = handler;
      logger.debug('缺失键处理器设置成功');
    }
  }

  /**
   * 设置自动重载
   * @param {boolean} enabled - 是否启用
   * @param {number} interval - 重载间隔（毫秒）
   * @private
   */
  setupAutoReload(enabled = true, interval = null) {
    // 清除现有定时器
    if (this.reloadTimer) {
      clearInterval(this.reloadTimer);
      this.reloadTimer = null;
    }

    if (enabled) {
      const reloadInterval = interval || this.options.reloadInterval;
      this.reloadTimer = setInterval(() => {
        this.loadTranslations().catch(error => {
          logger.error('自动重载翻译失败', {
            error: error.message
          });
        });
      }, reloadInterval);

      logger.debug('自动重载已启用', {
        interval: reloadInterval
      });
    } else {
      logger.debug('自动重载已禁用');
    }
  }

  /**
   * 重新加载翻译
   * @returns {Promise<boolean>} 是否重新加载成功
   */
  reload() {
    return this.loadTranslations();
  }

  /**
   * 格式化日期
   * @param {Date|string|number} date - 日期
   * @param {Object} options - 格式化选项
   * @returns {string} 格式化后的日期字符串
   */
  formatDate(date, options = {}) {
    const { 
      locale = this.options.defaultLocale,
      format = 'YYYY-MM-DD'
    } = options;

    const dateObj = typeUtils.isDate(date) ? date : new Date(date);

    if (isNaN(dateObj.getTime())) {
      return '';
    }

    // 简单的日期格式化
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    const hours = String(dateObj.getHours()).padStart(2, '0');
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    const seconds = String(dateObj.getSeconds()).padStart(2, '0');

    return format
      .replace('YYYY', year)
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds);
  }

  /**
   * 格式化数字
   * @param {number} number - 数字
   * @param {Object} options - 格式化选项
   * @returns {string} 格式化后的数字字符串
   */
  formatNumber(number, options = {}) {
    const { 
      locale = this.options.defaultLocale,
      decimals = 2,
      thousandsSeparator = ',',
      decimalSeparator = '.'
    } = options;

    if (isNaN(number)) {
      return '0';
    }

    const parts = number.toFixed(decimals).split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSeparator);
    
    if (decimals > 0) {
      return parts.join(decimalSeparator);
    }
    
    return parts[0];
  }

  /**
   * 销毁实例
   */
  destroy() {
    // 清除定时器
    if (this.reloadTimer) {
      clearInterval(this.reloadTimer);
      this.reloadTimer = null;
    }

    // 清空翻译
    this.translations = {};
    this.locales.clear();
    this.loaded = false;

    logger.debug('国际化工具实例已销毁');
  }

  /**
   * 静态实例
   * @private
   */
  static _instance = null;

  /**
   * 获取单例实例
   * @returns {I18nUtils} 国际化工具实例
   */
  static getInstance() {
    if (!I18nUtils._instance) {
      I18nUtils._instance = new I18nUtils();
    }
    return I18nUtils._instance;
  }

  /**
   * 创建新的国际化工具实例
   * @returns {I18nUtils} 国际化工具实例
   */
  static create() {
    return new I18nUtils();
  }
}

// 创建默认实例
const defaultI18nUtils = I18nUtils.getInstance();

module.exports = {
  I18nUtils,
  i18nUtils: defaultI18nUtils
};