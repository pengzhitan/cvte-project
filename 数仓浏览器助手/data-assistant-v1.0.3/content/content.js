/**
 * 内容脚本
 * 处理与页面内容的交互
 */

// 选择器状态
let selectorActive = false;
let selectedText = '';

// 监听来自扩展的消息
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  console.log('内容脚本收到消息:', message);
  
  if (message.action === 'activateSelector') {
    // 激活选择器模式
    activateSelector();
    sendResponse({success: true});
  } else if (message.action === 'getSelection') {
    // 获取选中内容
    sendResponse({text: selectedText});
  } else if (message.action === 'cancelSelection') {
    // 取消选择
    deactivateSelector();
    sendResponse({success: true});
  }
  
  return true; // 保持消息通道开放，以便异步响应
});

/**
 * 激活选择器模式
 */
function activateSelector() {
  if (selectorActive) return;
  
  selectorActive = true;
  selectedText = '';
  
  // 添加选择器样式
  const style = document.createElement('style');
  style.id = 'sql-selector-style';
  style.textContent = `
    body.sql-selecting {
      cursor: crosshair !important;
    }
    
    body.sql-selecting * {
      cursor: crosshair !important;
    }
    
    .sql-highlight {
      background-color: rgba(24, 144, 255, 0.2) !important;
      outline: 2px solid rgba(24, 144, 255, 0.5) !important;
    }
  `;
  document.head.appendChild(style);
  
  // 添加选择器类
  document.body.classList.add('sql-selecting');
  
  // 添加选择事件监听器
  document.addEventListener('mouseup', handleSelection);
  
  console.log('选择器模式已激活');
}

/**
 * 处理选择事件
 */
function handleSelection() {
  if (!selectorActive) return;
  
  const selection = window.getSelection();
  selectedText = selection.toString().trim();
  
  // 移除之前的高亮
  const highlights = document.querySelectorAll('.sql-highlight');
  highlights.forEach(el => el.classList.remove('sql-highlight'));
  
  // 添加新的高亮
  if (selectedText && selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    const span = document.createElement('span');
    span.className = 'sql-highlight';
    
    try {
      range.surroundContents(span);
    } catch (e) {
      console.error('无法高亮选中内容:', e);
    }
  }
  
  // 向扩展发送选中内容
  chrome.runtime.sendMessage({
    action: 'selectionUpdate',
    text: selectedText
  }, function(response) {
    if (chrome.runtime.lastError) {
      console.error('发送选中内容错误:', chrome.runtime.lastError);
    }
  });
}

/**
 * 停用选择器模式
 */
function deactivateSelector() {
  if (!selectorActive) return;
  
  selectorActive = false;
  
  // 移除选择器样式
  const style = document.getElementById('sql-selector-style');
  if (style) style.remove();
  
  // 移除选择器类
  document.body.classList.remove('sql-selecting');
  
  // 移除高亮
  const highlights = document.querySelectorAll('.sql-highlight');
  highlights.forEach(el => {
    const parent = el.parentNode;
    while (el.firstChild) {
      parent.insertBefore(el.firstChild, el);
    }
    parent.removeChild(el);
  });
  
  // 移除选择事件监听器
  document.removeEventListener('mouseup', handleSelection);
  
  console.log('选择器模式已停用');
}


function getSessionIdSaaSFromDocument() {
    // 对于非HttpOnly的cookie，可以直接从document.cookie获取
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'sessionIdSaaS') {
        return value;
      }
    }
    return null;
  }

// 从document.cookie获取sessionIdSaaS
function getSessionIdFromPage() {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'sessionIdSaaS') {
        return value;
      }
    }
    return null;
  }
  
  // 从存储中获取sessionId
function getStoredSessionId(callback) {
    chrome.storage.local.get('sessionIdSaaS', function(result) {
      callback(result.sessionIdSaaS);
    });
  }

  
  // 获取cookie并发送到sidebar/background
  function checkAndSendSessionId() {
    const sessionId = getSessionIdFromPage();
    if (sessionId) {
      console.log('从页面获取到sessionIdSaaS:', sessionId);
      
      // 发送消息到background/sidebar
      chrome.runtime.sendMessage({ 
        action: 'sessionIdFromPage', 
        sessionId: sessionId,
        url: window.location.href,
        timestamp: Date.now()
      });
      
      return true;
    }
    return false;
  }
  
  // 页面加载完成后检查cookie
  window.addEventListener('load', () => {
    // 延迟一点执行，确保cookie已设置
    setTimeout(checkAndSendSessionId, 1000);
  });
  
  // 监听来自background的消息
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "getPageInfo") {
    // 获取页面信息
    sendResponse({
      url: window.location.href,
      title: document.title
    });
  } else if (request.action === "useSessionId") {
    // 使用sessionId进行操作
    getStoredSessionId(function(sessionId) {
      if (sessionId) {
        console.log("使用存储的sessionId:", sessionId);
        // 这里可以添加使用sessionId进行身份验证的代码
        sendResponse({ success: true });
      } else {
        console.log("未找到存储的sessionId");
        sendResponse({ success: false });
      }
    });
    return true; // 异步响应
  }
});

// 初始化时可以执行的操作
getStoredSessionId(function(sessionId) {
  if (sessionId) {
    console.log("内容脚本已获取到存储的sessionId");
    // 可以在这里添加初始化代码
  }
});