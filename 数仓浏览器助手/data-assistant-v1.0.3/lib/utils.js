/**
 * 工具函数库
 * 提供通用的辅助功能
 */

/**
 * 格式化日期
 * @param {Date} date - 日期对象
 * @param {string} format - 格式字符串，例如 'YYYY-MM-DD'
 * @returns {string} - 格式化后的日期字符串
 */
function formatDate(date, format = 'YYYY-MM-DD') {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return format
      .replace('YYYY', year)
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds);
  }
  
  /**
   * 防抖函数
   * @param {Function} func - 要执行的函数
   * @param {number} wait - 等待时间（毫秒）
   * @returns {Function} - 防抖处理后的函数
   */
  function debounce(func, wait = 300) {
    let timeout;
    
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
  
  /**
   * 节流函数
   * @param {Function} func - 要执行的函数
   * @param {number} limit - 时间限制（毫秒）
   * @returns {Function} - 节流处理后的函数
   */
  function throttle(func, limit = 300) {
    let inThrottle;
    
    return function executedFunction(...args) {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => {
          inThrottle = false;
        }, limit);
      }
    };
  }
  
  /**
   * 深拷贝对象
   * @param {Object} obj - 要拷贝的对象
   * @returns {Object} - 拷贝后的新对象
   */
  function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }
    
    if (obj instanceof Date) {
      return new Date(obj.getTime());
    }
    
    if (obj instanceof Array) {
      return obj.map(item => deepClone(item));
    }
    
    if (obj instanceof Object) {
      const copy = {};
      Object.keys(obj).forEach(key => {
        copy[key] = deepClone(obj[key]);
      });
      return copy;
    }
    
    throw new Error('无法复制对象');
  }
  
  /**
   * 生成唯一ID
   * @returns {string} - 唯一ID
   */
  function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  }
  
  /**
   * 格式化文件大小
   * @param {number} bytes - 字节数
   * @returns {string} - 格式化后的文件大小
   */
  function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
  
  /**
   * 检查是否为空对象
   * @param {Object} obj - 要检查的对象
   * @returns {boolean} - 是否为空对象
   */
  function isEmptyObject(obj) {
    return Object.keys(obj).length === 0 && obj.constructor === Object;
  }
  
  /**
   * 从URL获取查询参数
   * @param {string} name - 参数名
   * @param {string} url - URL，默认为当前页面URL
   * @returns {string|null} - 参数值
   */
  function getQueryParam(name, url = window.location.href) {
    name = name.replace(/[$$$$]/g, '\\$&');
    const regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)');
    const results = regex.exec(url);
    
    if (!results) return null;
    if (!results[2]) return '';
    
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
  }

  function parseAndGetValue(jsonString, path) {
    try {
      // 将JSON字符串解析为JavaScript对象
      const data = JSON.parse(jsonString);
      
      // 使用点号或方括号表示法访问属性
      return path.split('.').reduce((obj, key) => obj && obj[key], data);
    } catch (error) {
      console.error("JSON解析错误:", error);
      return null;
    }
  }
// 提取三引号 ``` 之间的内容
  function extractTripleQuotesContentRegex(text) {
    const pattern = /```sql\n([\s\S]*?)\n```/;
    const match = text.match(pattern);
    
    if (match && match[1] !== undefined) {
      return match[1]; // 返回第一个捕获组
    }
    return null;
  }

  /**
 * 使用正则表达式获取指定cookie值
 * @param {string} name - cookie名称
 * @return {string|null} - cookie值或null
 */
function getCookieWithRegex(name) {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
  }
  
  // 获取sessionIdSaaS
 //const sessionId = getCookieWithRegex('sessionIdSaaS');
 //console.log('使用正则获取的sessionIdSaaS:', sessionId);

/**
 * 获取指定网站的Cookie值
 * @param {string} url - 要获取Cookie的URL
 * @param {string} cookieName - Cookie名称
 * @param {function} callback - 回调函数，参数为(error, cookieValue)
 */
function getCookieValue(url, cookieName, callback) {
    if (!url) {
      callback(new Error('URL不能为空'), null);
      return;
    }
    
    if (!cookieName) {
      callback(new Error('Cookie名称不能为空'), null);
      return;
    }
    
    try {
      chrome.cookies.get({
        url: url,
        name: cookieName
      }, function(cookie) {
        if (cookie && cookie.value) {
          callback(null, cookie.value);
        } else {
          callback(new Error(`未找到名为${cookieName}的Cookie`), null);
        }
      });
    } catch (error) {
      callback(error, null);
    }
  }
  
  /**
   * 获取当前活动标签页的sessionIdSaaS Cookie值
   * @param {function} callback - 回调函数，参数为(error, sessionId)
   */
  function getSessionIdSaaS(callback) {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (!tabs || tabs.length === 0) {
        callback(new Error('无法获取当前标签页'), null);
        return;
      }
      
      const currentUrl = tabs[0].url;
      getCookieValue(currentUrl, 'sessionIdSaaS', callback);
    });
  }
  
  /**
   * 获取指定URL的sessionIdSaaS Cookie值
   * @param {string} url - 要获取Cookie的URL
   * @param {function} callback - 回调函数，参数为(error, sessionId)
   */
  function getSessionIdSaaSForUrl(url, callback) {
    getCookieValue(url, 'sessionIdSaaS', callback);
  }
  
  /**
   * Promise版本的获取当前标签页sessionIdSaaS
   * @returns {Promise<string>} 返回sessionIdSaaS值的Promise
   */
  function getSessionIdSaaSPromise() {
    return new Promise((resolve, reject) => {
      getSessionIdSaaS((error, sessionId) => {
        if (error) {
          reject(error);
        } else {
          resolve(sessionId);
        }
      });
    });
  }
  
  /**
   * 获取所有匹配的Cookie
   * @param {string} domain - 域名（可选）
   * @param {string} name - Cookie名称（可选）
   * @param {function} callback - 回调函数，参数为(error, cookies)
   */
  function getAllCookies(domain, name, callback) {
    let details = {};
    
    if (domain) {
      details.domain = domain;
    }
    
    if (name) {
      details.name = name;
    }
    
    try {
      chrome.cookies.getAll(details, function(cookies) {
        if (cookies && cookies.length > 0) {
          callback(null, cookies);
        } else {
          callback(new Error('未找到匹配的Cookie'), []);
        }
      });
    } catch (error) {
      callback(error, []);
    }
  }

  
  // 导出工具函数
  window.Utils = {
    formatDate,
    debounce,
    throttle,
    deepClone,
    generateUniqueId,
    formatFileSize,
    isEmptyObject,
    getQueryParam
  };
  // 导出工具函数
window.cookieUtils = {
    getCookieValue,
    getSessionIdSaaS,
    getSessionIdSaaSForUrl,
    getSessionIdSaaSPromise,
    getAllCookies
  };