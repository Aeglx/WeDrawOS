/**
 * 测试工具
 * 提供测试辅助和断言功能
 */

const assert = require('assert');
const sinon = require('sinon');
const { typeUtils } = require('../type');
const { fileUtils } = require('../file');
const { timerUtils } = require('../timer');
const { stringUtils } = require('../string');
const { LogContext } = require('../logger/LogContext');

/**
 * 测试工具类
 * 提供各种测试辅助函数，包括断言、模拟、测试数据生成等
 */
class TestUtils {
  /**
   * 构造函数
   */
  constructor() {
    // 测试计数器
    this.testStats = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      startTime: null,
      endTime: null
    };

    // 测试上下文
    this.currentTest = null;
    this.currentSuite = null;
    this.suites = [];

    // Sinon沙盒管理
    this.sandboxes = new Map();
  }

  /**
   * 开始测试套件
   * @param {string} name - 套件名称
   * @param {Function} fn - 套件函数
   */
  describe(name, fn) {
    const suite = {
      name,
      tests: [],
      beforeHooks: [],
      afterHooks: [],
      beforeEachHooks: [],
      afterEachHooks: []
    };

    // 保存旧的套件引用
    const oldSuite = this.currentSuite;
    this.currentSuite = suite;
    this.suites.push(suite);

    try {
      // 执行套件函数
      fn();
    } catch (error) {
      console.error(`Error in suite "${name}":`, error);
    } finally {
      // 恢复旧的套件
      this.currentSuite = oldSuite;
    }
  }

  /**
   * 定义测试用例
   * @param {string} name - 测试名称
   * @param {Function} fn - 测试函数
   */
  it(name, fn) {
    if (!this.currentSuite) {
      throw new Error('Test must be inside a describe block');
    }

    const test = {
      name,
      fn,
      status: 'pending',
      error: null,
      duration: null
    };

    this.currentSuite.tests.push(test);
  }

  /**
   * 跳过测试用例
   * @param {string} name - 测试名称
   * @param {Function} fn - 测试函数（可选）
   */
  xit(name, fn) {
    if (!this.currentSuite) {
      throw new Error('Skipped test must be inside a describe block');
    }

    const test = {
      name,
      fn,
      status: 'skipped',
      error: null,
      duration: null
    };

    this.currentSuite.tests.push(test);
  }

  /**
   * 套件前钩子
   * @param {Function} fn - 钩子函数
   */
  before(fn) {
    if (!this.currentSuite) {
      throw new Error('Hook must be inside a describe block');
    }
    this.currentSuite.beforeHooks.push(fn);
  }

  /**
   * 套件后钩子
   * @param {Function} fn - 钩子函数
   */
  after(fn) {
    if (!this.currentSuite) {
      throw new Error('Hook must be inside a describe block');
    }
    this.currentSuite.afterHooks.push(fn);
  }

  /**
   * 每个测试前钩子
   * @param {Function} fn - 钩子函数
   */
  beforeEach(fn) {
    if (!this.currentSuite) {
      throw new Error('Hook must be inside a describe block');
    }
    this.currentSuite.beforeEachHooks.push(fn);
  }

  /**
   * 每个测试后钩子
   * @param {Function} fn - 钩子函数
   */
  afterEach(fn) {
    if (!this.currentSuite) {
      throw new Error('Hook must be inside a describe block');
    }
    this.currentSuite.afterEachHooks.push(fn);
  }

  /**
   * 运行测试
   * @returns {Promise<Object>} 测试结果
   */
  async run() {
    this.testStats.startTime = Date.now();

    try {
      for (const suite of this.suites) {
        await this.runSuite(suite);
      }
    } finally {
      this.testStats.endTime = Date.now();
      
      // 清理所有沙盒
      this.cleanupAllSandboxes();
    }

    return this.getResults();
  }

  /**
   * 运行单个测试套件
   * @param {Object} suite - 测试套件
   * @private
   */
  async runSuite(suite) {
    console.log(`\nRunning suite: ${suite.name}`);

    try {
      // 运行套件前钩子
      for (const hook of suite.beforeHooks) {
        await this.runHook(hook, 'before');
      }

      // 运行测试
      for (const test of suite.tests) {
        if (test.status === 'skipped') {
          this.testStats.skipped++;
          console.log(`  - ${test.name}: SKIPPED`);
          continue;
        }

        await this.runTest(test, suite);
      }
    } finally {
      // 运行套件后钩子
      for (const hook of suite.afterHooks) {
        try {
          await this.runHook(hook, 'after');
        } catch (error) {
          console.error(`Error in after hook:`, error);
        }
      }
    }
  }

  /**
   * 运行单个测试
   * @param {Object} test - 测试对象
   * @param {Object} suite - 测试套件
   * @private
   */
  async runTest(test, suite) {
    this.currentTest = test;
    const startTime = Date.now();

    try {
      // 运行每个测试前钩子
      for (const hook of suite.beforeEachHooks) {
        await this.runHook(hook, 'beforeEach');
      }

      // 运行测试函数
      await test.fn();

      // 更新测试状态
      test.status = 'passed';
      this.testStats.passed++;

      console.log(`  ✓ ${test.name}: PASSED`);
    } catch (error) {
      // 捕获测试错误
      test.status = 'failed';
      test.error = error;
      this.testStats.failed++;

      console.log(`  ✗ ${test.name}: FAILED`);
      console.error(`    Error: ${error.message}`);
      if (error.stack) {
        console.error(`    ${error.stack.split('\n').slice(1, 3).join('\n    ')}`);
      }
    } finally {
      // 计算持续时间
      test.duration = Date.now() - startTime;
      this.testStats.total++;

      // 运行每个测试后钩子
      for (const hook of suite.afterEachHooks) {
        try {
          await this.runHook(hook, 'afterEach');
        } catch (error) {
          console.error(`Error in afterEach hook:`, error);
        }
      }

      this.currentTest = null;
    }
  }

  /**
   * 运行钩子函数
   * @param {Function} hook - 钩子函数
   * @param {string} type - 钩子类型
   * @private
   */
  async runHook(hook, type) {
    try {
      const result = hook();
      if (result instanceof Promise) {
        await result;
      }
    } catch (error) {
      throw new Error(`Error in ${type} hook: ${error.message}`);
    }
  }

  /**
   * 获取测试结果
   * @returns {Object} 测试结果对象
   */
  getResults() {
    return {
      stats: {
        ...this.testStats,
        duration: this.testStats.endTime - this.testStats.startTime
      },
      suites: this.suites.map(suite => ({
        name: suite.name,
        tests: suite.tests.map(test => ({
          name: test.name,
          status: test.status,
          duration: test.duration,
          error: test.error ? {
            message: test.error.message,
            stack: test.error.stack
          } : null
        }))
      }))
    };
  }

  /**
   * 清理所有沙盒
   * @private
   */
  cleanupAllSandboxes() {
    for (const [key, sandbox] of this.sandboxes.entries()) {
      try {
        sandbox.restore();
      } catch (error) {
        console.error(`Error restoring sandbox ${key}:`, error);
      }
    }
    this.sandboxes.clear();
  }

  /**
   * 创建新的Sinon沙盒
   * @param {string} name - 沙盒名称
   * @returns {Object} Sinon沙盒实例
   */
  createSandbox(name = 'default') {
    const sandbox = sinon.createSandbox();
    this.sandboxes.set(name, sandbox);
    return sandbox;
  }

  /**
   * 获取沙盒
   * @param {string} name - 沙盒名称
   * @returns {Object|null} Sinon沙盒实例
   */
  getSandbox(name = 'default') {
    return this.sandboxes.get(name) || null;
  }

  /**
   * 恢复沙盒
   * @param {string} name - 沙盒名称
   */
  restoreSandbox(name = 'default') {
    const sandbox = this.sandboxes.get(name);
    if (sandbox) {
      sandbox.restore();
      this.sandboxes.delete(name);
    }
  }

  /**
   * 断言工具
   */
  get asserts() {
    return {
      /**
       * 断言相等
       * @param {*} actual - 实际值
       * @param {*} expected - 期望值
       * @param {string} message - 错误消息
       */
      equal: (actual, expected, message) => {
        assert.strictEqual(actual, expected, message);
      },

      /**
       * 断言不相等
       * @param {*} actual - 实际值
       * @param {*} expected - 期望值
       * @param {string} message - 错误消息
       */
      notEqual: (actual, expected, message) => {
        assert.notStrictEqual(actual, expected, message);
      },

      /**
       * 断言深度相等
       * @param {*} actual - 实际值
       * @param {*} expected - 期望值
       * @param {string} message - 错误消息
       */
      deepEqual: (actual, expected, message) => {
        assert.deepStrictEqual(actual, expected, message);
      },

      /**
       * 断言深度不相等
       * @param {*} actual - 实际值
       * @param {*} expected - 期望值
       * @param {string} message - 错误消息
       */
      notDeepEqual: (actual, expected, message) => {
        assert.notDeepStrictEqual(actual, expected, message);
      },

      /**
       * 断言为真
       * @param {*} value - 值
       * @param {string} message - 错误消息
       */
      ok: (value, message) => {
        assert.ok(value, message);
      },

      /**
       * 断言为假
       * @param {*} value - 值
       * @param {string} message - 错误消息
       */
      notOk: (value, message) => {
        assert.ok(!value, message);
      },

      /**
       * 断言为null
       * @param {*} value - 值
       * @param {string} message - 错误消息
       */
      isNull: (value, message) => {
        assert.strictEqual(value, null, message);
      },

      /**
       * 断言不为null
       * @param {*} value - 值
       * @param {string} message - 错误消息
       */
      isNotNull: (value, message) => {
        assert.notStrictEqual(value, null, message);
      },

      /**
       * 断言为undefined
       * @param {*} value - 值
       * @param {string} message - 错误消息
       */
      isUndefined: (value, message) => {
        assert.strictEqual(value, undefined, message);
      },

      /**
       * 断言不为undefined
       * @param {*} value - 值
       * @param {string} message - 错误消息
       */
      isDefined: (value, message) => {
        assert.notStrictEqual(value, undefined, message);
      },

      /**
       * 断言是函数
       * @param {*} value - 值
       * @param {string} message - 错误消息
       */
      isFunction: (value, message) => {
        assert.strictEqual(typeof value, 'function', message);
      },

      /**
       * 断言是对象
       * @param {*} value - 值
       * @param {string} message - 错误消息
       */
      isObject: (value, message) => {
        assert.strictEqual(typeof value, 'object', message);
        assert.notStrictEqual(value, null, message);
      },

      /**
       * 断言是数组
       * @param {*} value - 值
       * @param {string} message - 错误消息
       */
      isArray: (value, message) => {
        assert.ok(Array.isArray(value), message);
      },

      /**
       * 断言是字符串
       * @param {*} value - 值
       * @param {string} message - 错误消息
       */
      isString: (value, message) => {
        assert.strictEqual(typeof value, 'string', message);
      },

      /**
       * 断言是数字
       * @param {*} value - 值
       * @param {string} message - 错误消息
       */
      isNumber: (value, message) => {
        assert.strictEqual(typeof value, 'number', message);
        assert.ok(!isNaN(value), message);
      },

      /**
       * 断言是布尔值
       * @param {*} value - 值
       * @param {string} message - 错误消息
       */
      isBoolean: (value, message) => {
        assert.strictEqual(typeof value, 'boolean', message);
      },

      /**
       * 断言抛出错误
       * @param {Function} fn - 要执行的函数
       * @param {RegExp|Function|Error} expectedError - 期望的错误
       * @param {string} message - 错误消息
       */
      throws: (fn, expectedError, message) => {
        assert.throws(fn, expectedError, message);
      },

      /**
       * 断言不抛出错误
       * @param {Function} fn - 要执行的函数
       * @param {string} message - 错误消息
       */
      doesNotThrow: (fn, message) => {
        assert.doesNotThrow(fn, message);
      },

      /**
       * 断言包含
       * @param {*} actual - 实际值
       * @param {*} expected - 期望值
       * @param {string} message - 错误消息
       */
      includes: (actual, expected, message) => {
        if (Array.isArray(actual)) {
          assert.ok(actual.includes(expected), message);
        } else if (typeof actual === 'string') {
          assert.ok(actual.includes(expected), message);
        } else {
          throw new TypeError('actual must be an array or string');
        }
      },

      /**
       * 断言不包含
       * @param {*} actual - 实际值
       * @param {*} expected - 期望值
       * @param {string} message - 错误消息
       */
      notIncludes: (actual, expected, message) => {
        if (Array.isArray(actual)) {
          assert.ok(!actual.includes(expected), message);
        } else if (typeof actual === 'string') {
          assert.ok(!actual.includes(expected), message);
        } else {
          throw new TypeError('actual must be an array or string');
        }
      },

      /**
       * 断言属性存在
       * @param {Object} obj - 对象
       * @param {string} prop - 属性名
       * @param {string} message - 错误消息
       */
      hasProperty: (obj, prop, message) => {
        assert.ok(Object.prototype.hasOwnProperty.call(obj, prop), message);
      },

      /**
       * 断言属性不存在
       * @param {Object} obj - 对象
       * @param {string} prop - 属性名
       * @param {string} message - 错误消息
       */
      notHasProperty: (obj, prop, message) => {
        assert.ok(!Object.prototype.hasOwnProperty.call(obj, prop), message);
      },

      /**
       * 断言近似相等（用于浮点数）
       * @param {number} actual - 实际值
       * @param {number} expected - 期望值
       * @param {number} delta - 允许的误差
       * @param {string} message - 错误消息
       */
      approximately: (actual, expected, delta, message) => {
        assert.ok(Math.abs(actual - expected) <= delta, message);
      }
    };
  }

  /**
   * 模拟工具
   */
  get mocks() {
    const defaultSandbox = this.getSandbox() || this.createSandbox();

    return {
      /**
       * 创建间谍函数
       * @param {Object} obj - 对象
       * @param {string} method - 方法名
       * @returns {Function} 间谍函数
       */
      spy: (obj, method) => {
        if (obj && method) {
          return defaultSandbox.spy(obj, method);
        }
        return defaultSandbox.spy();
      },

      /**
       * 创建存根函数
       * @param {Object} obj - 对象
       * @param {string} method - 方法名
       * @param {*} returns - 返回值
       * @returns {Function} 存根函数
       */
      stub: (obj, method, returns) => {
        if (obj && method) {
          const stub = defaultSandbox.stub(obj, method);
          if (returns !== undefined) {
            stub.returns(returns);
          }
          return stub;
        }
        const stub = defaultSandbox.stub();
        if (returns !== undefined) {
          stub.returns(returns);
        }
        return stub;
      },

      /**
       * 创建模拟对象
       * @param {Object} expectations - 期望对象
       * @returns {Object} 模拟对象
       */
      mock: (expectations) => {
        return defaultSandbox.mock(expectations);
      },

      /**
       * 创建定时器
       * @returns {Object} 定时器控制器
       */
      useFakeTimers: () => {
        return defaultSandbox.useFakeTimers();
      },

      /**
       * 验证所有模拟
       */
      verify: () => {
        defaultSandbox.verify();
      },

      /**
       * 恢复所有模拟
       */
      restore: () => {
        defaultSandbox.restore();
      }
    };
  }

  /**
   * 测试数据生成器
   */
  get generators() {
    return {
      /**
       * 生成随机字符串
       * @param {number} length - 长度
       * @returns {string} 随机字符串
       */
      randomString: (length = 10) => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
          result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
      },

      /**
       * 生成随机数字
       * @param {number} min - 最小值
       * @param {number} max - 最大值
       * @returns {number} 随机数字
       */
      randomNumber: (min = 0, max = 100) => {
        return Math.floor(Math.random() * (max - min + 1)) + min;
      },

      /**
       * 生成随机布尔值
       * @returns {boolean} 随机布尔值
       */
      randomBoolean: () => {
        return Math.random() > 0.5;
      },

      /**
       * 生成随机数组
       * @param {Function} generator - 生成器函数
       * @param {number} length - 长度
       * @returns {Array} 随机数组
       */
      randomArray: (generator = this.generators.randomNumber, length = 5) => {
        const result = [];
        for (let i = 0; i < length; i++) {
          result.push(generator());
        }
        return result;
      },

      /**
       * 生成随机对象
       * @param {Object} schema - 对象结构
       * @returns {Object} 随机对象
       */
      randomObject: (schema) => {
        const result = {};
        
        Object.entries(schema).forEach(([key, type]) => {
          if (type === 'string') {
            result[key] = this.generators.randomString();
          } else if (type === 'number') {
            result[key] = this.generators.randomNumber();
          } else if (type === 'boolean') {
            result[key] = this.generators.randomBoolean();
          } else if (Array.isArray(type)) {
            result[key] = this.generators.randomArray(() => this.generators.randomString());
          } else if (typeof type === 'object') {
            result[key] = this.generators.randomObject(type);
          } else if (typeof type === 'function') {
            result[key] = type();
          }
        });
        
        return result;
      },

      /**
       * 生成随机日期
       * @param {Date} start - 开始日期
       * @param {Date} end - 结束日期
       * @returns {Date} 随机日期
       */
      randomDate: (start = new Date(2000, 0, 1), end = new Date()) => {
        return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
      },

      /**
       * 生成随机邮箱
       * @returns {string} 随机邮箱
       */
      randomEmail: () => {
        const username = this.generators.randomString(8);
        const domain = this.generators.randomString(6) + '.com';
        return `${username}@${domain}`;
      },

      /**
       * 生成随机手机号
       * @returns {string} 随机手机号
       */
      randomPhone: () => {
        return '1' + Math.random().toString().slice(2, 11);
      },

      /**
       * 生成随机UUID
       * @returns {string} 随机UUID
       */
      randomUUID: () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0;
          const v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      }
    };
  }

  /**
   * HTTP测试工具
   */
  get http() {
    return {
      /**
       * 创建模拟请求对象
       * @param {Object} options - 请求选项
       * @returns {Object} 模拟请求对象
       */
      mockRequest: (options = {}) => {
        return {
          method: options.method || 'GET',
          url: options.url || '/',
          path: options.path || '/',
          originalUrl: options.originalUrl || '/',
          headers: options.headers || {},
          query: options.query || {},
          params: options.params || {},
          body: options.body || {},
          session: options.session || {},
          user: options.user || null,
          connection: {
            remoteAddress: options.clientIp || '127.0.0.1'
          },
          ...options
        };
      },

      /**
       * 创建模拟响应对象
       * @param {Object} options - 响应选项
       * @returns {Object} 模拟响应对象
       */
      mockResponse: (options = {}) => {
        const res = {
          statusCode: 200,
          headers: {},
          send: function(body) {
            this.body = body;
            return this;
          },
          json: function(body) {
            this.body = JSON.stringify(body);
            this.headers['content-type'] = 'application/json';
            return this;
          },
          status: function(code) {
            this.statusCode = code;
            return this;
          },
          setHeader: function(name, value) {
            this.headers[name] = value;
            return this;
          },
          getHeader: function(name) {
            return this.headers[name];
          },
          removeHeader: function(name) {
            delete this.headers[name];
            return this;
          },
          redirect: function(url) {
            this.statusCode = 302;
            this.headers['location'] = url;
            return this;
          },
          ...options
        };

        // 模拟事件
        res.on = this.mocks.spy();
        
        return res;
      },

      /**
       * 创建模拟next函数
       * @returns {Function} 模拟next函数
       */
      mockNext: () => {
        return this.mocks.spy();
      },

      /**
       * 测试中间件
       * @param {Function} middleware - 中间件函数
       * @param {Object} req - 请求对象
       * @param {Object} res - 响应对象
       * @param {Function} next - next函数
       * @returns {Promise<void>}
       */
      testMiddleware: async (middleware, req, res, next) => {
        const request = req || this.http.mockRequest();
        const response = res || this.http.mockResponse();
        const nextFn = next || this.http.mockNext();

        try {
          await middleware(request, response, nextFn);
        } catch (error) {
          nextFn(error);
        }

        return { request, response, next: nextFn };
      }
    };
  }

  /**
   * 创建临时测试文件
   * @param {string} content - 文件内容
   * @param {Object} options - 选项
   * @returns {Promise<string>} 文件路径
   */
  async createTempFile(content = '', options = {}) {
    const { extension = '.txt', prefix = 'test-' } = options;
    const tempDir = await fileUtils.createTempDir();
    const filename = `${prefix}${Date.now()}${extension}`;
    const filePath = `${tempDir}/${filename}`;

    await fileUtils.writeFile(filePath, content);
    return filePath;
  }

  /**
   * 清理测试资源
   * @param {Array<string>} files - 要删除的文件列表
   * @returns {Promise<void>}
   */
  async cleanup(files = []) {
    for (const file of files) {
      try {
        await fileUtils.deleteFile(file);
      } catch (error) {
        console.error(`Error cleaning up ${file}:`, error);
      }
    }
  }

  /**
   * 创建测试日志上下文
   * @returns {LogContext} 日志上下文实例
   */
  createLogContext() {
    return new LogContext();
  }

  /**
   * 执行延迟测试
   * @param {number} ms - 延迟毫秒数
   * @returns {Promise<void>}
   */
  delay(ms) {
    return timerUtils.delay(ms);
  }

  /**
   * 重试函数
   * @param {Function} fn - 要重试的函数
   * @param {Object} options - 重试选项
   * @returns {Promise<*>}
   */
  async retry(fn, options = {}) {
    const { retries = 3, delay = 1000 } = options;
    let lastError;

    for (let i = 0; i < retries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        if (i < retries - 1) {
          await this.delay(delay);
        }
      }
    }

    throw lastError;
  }

  /**
   * 静态实例
   * @private
   */
  static _instance = null;

  /**
   * 获取单例实例
   * @returns {TestUtils} 测试工具实例
   */
  static getInstance() {
    if (!TestUtils._instance) {
      TestUtils._instance = new TestUtils();
    }
    return TestUtils._instance;
  }

  /**
   * 创建新的测试工具实例
   * @returns {TestUtils} 测试工具实例
   */
  static create() {
    return new TestUtils();
  }
}

// 创建默认实例
const defaultTestUtils = TestUtils.getInstance();

// 导出测试API
const { describe, it, xit, before, after, beforeEach, afterEach } = defaultTestUtils;
const { asserts, mocks, generators, http } = defaultTestUtils;

module.exports = {
  TestUtils,
  testUtils: defaultTestUtils,
  describe,
  it,
  xit,
  before,
  after,
  beforeEach,
  afterEach,
  asserts,
  mocks,
  generators,
  http
};