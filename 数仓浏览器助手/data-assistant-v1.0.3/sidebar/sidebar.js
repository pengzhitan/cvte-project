/**
 * 侧边栏主脚本
 * 处理侧边栏的交互逻辑
 */
// 用户seesionId
var session_id='';
// 用户AI会话id 
var conversation_id='';

// 当DOM加载完成后执行初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('侧边栏已加载');
    
    // 初始化选项卡功能
    initTabs();
  
    // 初始化SQL转换功能
    initSQLConversion();
  
    // 初始化工作流补数功能
    initWorkflow();
  
    // 初始化AI问答功能
    initAIQA();
  
    // 初始化页面内容选择器
    initPageSelector();
    
    // 设置侧边栏宽度为浏览器宽度的3/20
    setOptimalWidth();
    
    // 监听窗口大小变化，调整侧边栏宽度
    window.addEventListener('resize', setOptimalWidth);
    // 添加获取cookie按钮的事件监听
    //document.getElementById('getSessionBtn').addEventListener('click', getSessionCookie);
  
    // 检查是否已有存储的sessionId
   // checkStoredSessionId();
  });
  

  // 显示cookie值
function displayCookieValue(value) {
    const cookieInfoElement = document.getElementById('cookieInfo');
    const cookieValueElement = document.getElementById('cookieValue');
    
    if (value) {
      session_id=value;
      cookieValueElement.textContent = value;
      cookieInfoElement.style.display = 'block';
    } else {
      session_id='';
      cookieInfoElement.style.display = 'none';
    }
  }
  
  // 获取cookie
  function getAndDisplayCookie() {
    chrome.runtime.sendMessage({ action: "getSessionCookie" }, function(response) {
      if (response && response.success) {
        //showStatus('成功获取SessionIdSaaS cookie!', true);
        session_id=response.value;
        //console.error('cookie:',  response.value);
        storeSessionId(response.value) ;
      } else {
        //showStatus('获取cookie失败: ' + (response ? response.error : '未知错误'), false);
        return null ;
        
      }
    });
  }
  
  // 存储sessionId用于后续使用
function storeSessionId(sessionId) {
    chrome.storage.local.set({ 'sessionIdSaaS': sessionId }, function() {
      console.log('SessionId已保存');
    });
  }


// 从存储中获取sessionId
function getStoredSessionId(callback) {
    chrome.storage.local.get('sessionIdSaaS', function(result) {
      session_id=result.sessionIdSaaS;
      callback(result.sessionIdSaaS);
    });
  }

  // 从存储中加载cookie
  function loadStoredCookie() {
    chrome.storage.local.get('sessionIdSaaS', function(result) {
      if (result.sessionIdSaaS) {
        //displayCookieValue(result.sessionIdSaaS);
        session_id=result.sessionIdSaaS;
        //console.error('sessionIdSaaS',  result.sessionIdSaaS);
        
      }
    });
  }
  
  // 监听来自background的消息
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === "cookieUpdated") {
      showStatus('SessionIdSaaS cookie已更新!', true);
      displayCookieValue(request.value);
    } else if (request.action === "cookieRemoved") {
      showStatus('SessionIdSaaS cookie已删除!', false);
      displayCookieValue(null);
    }
  });
  
  // 在页面加载时初始化
  document.addEventListener('DOMContentLoaded', function() {
    // 加载存储的cookie
    loadStoredCookie();
    
    // 添加刷新按钮事件监听
    const refreshButton = document.getElementById('refreshCookie');
    if (refreshButton) {
      refreshButton.addEventListener('click', getAndDisplayCookie);
    }
    
    // 初始获取cookie
    getAndDisplayCookie();
  });



 // 使用sessionId进行身份认证
function authenticateUser() {
    window.getSessionIdForAuth()
      .then(sessionId => {
        const resultDiv = document.getElementById('result');
        resultDiv.innerHTML += `<p>正在使用SessionID进行身份认证...</p>`;
        
        // 这里可以直接调用API，或者通过background script进行
        browser.runtime.sendMessage({
          action: 'authenticate',
          sessionId: sessionId
        });
      })
      .catch(error => {
        const resultDiv = document.getElementById('result');
        resultDiv.innerHTML += `<p style="color: red;">身份认证失败: ${error.message}</p>`;
      });
  }
  
  // 监听来自background的认证结果
  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'authResult') {
      const resultDiv = document.getElementById('result');
      if (message.success) {
        resultDiv.innerHTML += `<p style="color: green;">身份认证成功!</p>`;
      } else {
        resultDiv.innerHTML += `<p style="color: red;">身份认证失败: ${message.error}</p>`;
      }
    }
  });
  
  // 提供给外部使用的获取sessionId的函数
window.getSessionIdForAuth = function() {
    return new Promise((resolve, reject) => {
      browser.storage.local.get(['sessionIdSaaS', 'lastFetchTime'])
        .then(result => {
          const now = Date.now();
          const lastFetch = result.lastFetchTime || 0;
          const SESSION_VALIDITY = 30 * 60 * 1000; // 30分钟
          
          // 如果存储的sessionId存在且未过期
          if (result.sessionIdSaaS && (now - lastFetch < SESSION_VALIDITY)) {
            resolve(result.sessionIdSaaS);
          } else {
            // 需要重新获取
            browser.tabs.query({ active: true, currentWindow: true })
              .then(tabs => {
                if (tabs.length === 0) {
                  reject(new Error('没有活动标签页'));
                  return;
                }
                
                const tab = tabs[0];
                const url = new URL(tab.url);
                const domain = url.hostname;
                
                return browser.cookies.getAll({ domain: domain });
              })
              .then(cookies => {
                const sessionCookie = cookies.find(cookie => cookie.name === 'sessionIdSaaS');
                
                if (sessionCookie) {
                  // 更新存储和时间戳
                  browser.storage.local.set({ 
                    'sessionIdSaaS': sessionCookie.value,
                    'lastFetchTime': now
                  });
                  resolve(sessionCookie.value);
                } else {
                  reject(new Error('未找到sessionIdSaaS cookie'));
                }
              })
              .catch(reject);
          }
        })
        .catch(reject);
    });
  };

  /**
   * 设置最佳宽度
   * 尝试将侧边栏宽度设置为浏览器宽度的3/20
   */
  function setOptimalWidth() {
    // 注意：这个函数在Chrome的Side Panel API中可能不会生效
    // 因为Chrome控制了侧边栏的宽度，但我们可以尝试通过CSS变量来影响它
    const screenWidth = window.screen.width;
    const optimalWidth = Math.floor(screenWidth * 3 / 20);
    
    // 设置CSS变量
    document.documentElement.style.setProperty('--sidebar-width', optimalWidth + 'px');
    
    console.log(`尝试设置侧边栏宽度: ${optimalWidth}px (屏幕宽度的3/20)`);
  }
  
  /**
   * 显示成功提示
   * @param {string} message - 提示消息
   */
  function showSuccessToast(message) {
    const toast = document.getElementById('toast-success');
    const messageElement = document.getElementById('toast-success-message');
    
    messageElement.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
      toast.classList.remove('show');
    }, 30000);
  }
  
  /**
   * 显示错误提示
   * @param {string} message - 错误消息
   */
  function showErrorToast(message) {
    const toast = document.getElementById('toast-error');
    const messageElement = document.getElementById('toast-error-message');
    
    messageElement.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  }
  
  /**
   * 初始化选项卡功能
   */
  function initTabs() {
    const tabs = document.querySelectorAll('.tab');
    const contents = document.querySelectorAll('.content');
    
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const target = tab.getAttribute('data-tab');
        
        // 移除所有选项卡的active类
        tabs.forEach(t => t.classList.remove('active'));
        
        // 移除所有内容区域的active类
        contents.forEach(c => c.classList.remove('active'));
        
        // 为当前选项卡和内容区域添加active类
        tab.classList.add('active');
        document.getElementById(target).classList.add('active');
      });
    });
    
    console.log('选项卡功能已初始化');
  }
  
  /**
   * 初始化SQL转换功能
   */
  function initSQLConversion() {
    const convertBtn = document.getElementById('convert-btn');
    const copyBtn = document.getElementById('copy-result-btn');
    
    // 转换按钮点击事件
    if (convertBtn) {
      convertBtn.addEventListener('click', () => {
        convertSQLAI();
      });
      console.log('SQL转换按钮已初始化');
    } else {
      console.error('未找到转换按钮元素');
    }
    
    // 复制按钮点击事件
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        copyResult();
      });
      console.log('复制按钮已初始化');
    } else {
      console.error('未找到复制按钮元素');
    }
  }
  
  /**
   * SQL转换功能
   */
  async function convertSQLAI() {
    const source_type = document.getElementById('source-dialect').value;
    const target_type = document.getElementById('target-dialect').value;
    const sourceSQL = document.getElementById('source-sql').value.trim();
    const resultElement = document.getElementById('conversion-result');
   

    //const user_account='daiqiufang';
    const conversation_id='';
   // console.error(sourceSQL.length)
    //if(sourceSQL.length>256){
     // showErrorToast('输入的字符超过256个!请减少字符！');
     // return;
    //}
    // 验证输入
    if (!sourceSQL) {
      showErrorToast('请输入源SQL语句');
      return;
    }

    if(session_id===''){
      showErrorToast('未登录!请登录源象平台!');
      return;
    }
    
    console.log(`开始转换SQL: 从 ${source_type} 到 ${target_type}`);
    console.log(`源SQL: ${sourceSQL.substring(0, 100)}${sourceSQL.length > 100 ? '...' : ''}`);
    
    // 显示加载状态
    resultElement.innerHTML = '<div class="loading">AI正在思考中，大概需要30秒到3分钟，请耐心等待...</div>';
    
    // 调用API进行转换
    try {
      // 这里使用模拟API调用，实际项目中应替换为真实API
      // 模拟API延迟
        try {
          let result;
          const result_api = await convertSQL(sourceSQL, source_type, target_type,session_id,conversation_id);
          //console.error(JSON.stringify(result_api)); 
          const answer=parseAndGetValue(JSON.stringify(result_api),'data.answer')
          if(answer==='功能开发中...'){
            result=answer
            resultElement.textContent = result;
            showSuccessToast('功能开发中...');
          }
          else {
            result=extractTripleQuotesContentRegex(answer)
            // 显示结果
            resultElement.textContent = result;
            showSuccessToast('SQL转换成功');
          }        
          
          console.log('SQL转换成功');
        } catch (error) {
          console.error('session_id:',  session_id);
          resultElement.textContent = '转换失败，请检查SQL语法或选择正确的目标及来源。';
          showErrorToast(`转换失败: ${error.message}`);
          console.error('SQL转换错误:', error);
        }
    } catch (error) {
      resultElement.textContent = '转换请求发送失败，请检查网络连接。';
      showErrorToast(`请求失败: ${error.message}`);
      console.error('API请求错误:', error);
    }
  }
  /**
   * 复制转换结果
   */
  function copyResult() {
    const resultElement = document.getElementById('conversion-result');
    const result = resultElement.textContent;
    
    if (!result || result === '转换结果将显示在这里...') {
      showErrorToast('没有可复制的内容');
      return;
    }
    
    try {
      // 使用Clipboard API复制文本
      navigator.clipboard.writeText(result).then(() => {
        showSuccessToast('已复制到剪贴板');
        console.log('内容已复制到剪贴板');
      }).catch(err => {
        showErrorToast('复制失败，请手动复制');
        console.error('复制失败:', err);
      });
    } catch (error) {
      // 回退方法：创建临时文本区域
      const textarea = document.createElement('textarea');
      textarea.value = result;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      
      try {
        const successful = document.execCommand('copy');
        if (successful) {
          showSuccessToast('已复制到剪贴板');
        } else {
          showErrorToast('复制失败，请手动复制');
        }
      } catch (err) {
        showErrorToast('复制失败，请手动复制');
        console.error('复制失败:', err);
      }
      
      document.body.removeChild(textarea);
    }
  }
  
  /**
   * 初始化工作流补数功能
   */
  function initWorkflow() {
    const addDateBtn = document.getElementById('add-date-btn');
    const removeDateBtn = document.getElementById('remove-date-btn');
    const submitBtn = document.getElementById('submit-workflow-btn');
    //const taskNameInput = document.getElementById('task-name');
    if (addDateBtn) {
      addDateBtn.addEventListener('click', () => {
        addDateInput();
      });
      console.log('添加日期按钮已初始化');
    } else {
      console.error('未找到添加日期按钮元素');
    }
    
    if (removeDateBtn) {
      removeDateBtn.addEventListener('click', () => {
        removeDateInput();
      });
      console.log('删除日期按钮已初始化');
    } else {
      console.error('未找到删除日期按钮元素');
    }
    
    if (submitBtn) {
      submitBtn.addEventListener('click', () => {
        // 禁用按钮，防止重复点击
        submitBtn.disabled = true;
        submitBtn.textContent = '提交中...';
        
        // 调用提交函数，完成后恢复按钮状态
        submitWorkflow().finally(() => {
          submitBtn.disabled = false;
          submitBtn.textContent = '提交';
        });
      });
      console.log('提交工作流按钮已初始化');
    } else {
      console.error('未找到提交工作流按钮元素');
    }
    
    // 设置默认日期为今天
    const dateInputs = document.querySelectorAll('input[name="workflow-date"]');
    const today = new Date().toISOString().split('T')[0];
    
    dateInputs.forEach(input => {
      input.value = today;
      // 设置最大日期为今天
      input.max = today;
      // 添加change事件监听，检查是否存在重复日期
      input.addEventListener('change', (e) => {
        checkDuplicateDates();
      });
    });
  }
  
  /**
   * 添加日期输入框
   */
  function addDateInput() {
    const dateInputs = document.getElementById('date-inputs');
    const dateCount = document.getElementById('date-count');
    const currentCount = parseInt(dateCount.textContent);
    
    if (currentCount >= 10) {
      showErrorToast('最多添加10个日期');
      return;
    }
    
    const dateInput = document.createElement('div');
    dateInput.className = 'date-input';
    
    const input = document.createElement('input');
    input.type = 'date';
    input.className = 'form-control';
    input.name = 'workflow-date';
    input.value = new Date().toISOString().split('T')[0];
    
    // 设置日期最大值为今天，禁止选择未来日期
    const today = new Date().toISOString().split('T')[0];
    input.max = today;
    
    // 添加change事件监听，检查是否存在重复日期
    input.addEventListener('change', (e) => {
      checkDuplicateDates();
    });
    
    dateInput.appendChild(input);
    dateInputs.appendChild(dateInput);
    
    dateCount.textContent = currentCount + 1;
    console.log(`日期输入框已添加，当前共 ${currentCount + 1} 个`);
  }
  
  /**
   * 检查是否存在重复日期
   */
  function checkDuplicateDates() {
    const dateInputs = document.querySelectorAll('input[name="workflow-date"]');
    const dateValues = Array.from(dateInputs).map(input => input.value);
    
    // 检查重复
    const uniqueDates = new Set(dateValues);
    if (uniqueDates.size < dateValues.length) {
      showErrorToast('存在重复日期，请修改！');
      return false;
    }
    
    return true;
  }
  
  /**
   * 删除日期输入框
   */
  function removeDateInput() {
    const dateInputs = document.getElementById('date-inputs');
    const dateCount = document.getElementById('date-count');
    const currentCount = parseInt(dateCount.textContent);
    
    if (currentCount <= 1) {
      showErrorToast('至少保留1个日期');
      return;
    }
    
    dateInputs.removeChild(dateInputs.lastChild);
    dateCount.textContent = currentCount - 1;
    console.log(`日期输入框已删除，当前共 ${currentCount - 1} 个`);
  }
  
  /**
   * 提交工作流补数任务
   */
  async function submitWorkflow() {
    const projectName = document.getElementById('project-name').value.trim();
    const workflowName = document.getElementById('workflow-name').value.trim();
    const taskName = document.getElementById('task-name').value.trim();
    const dateInputs = document.querySelectorAll('input[name="workflow-date"]');
    const dates = Array.from(dateInputs).map(input => input.value);
    
    // 验证输入
    if (!projectName) {
      showErrorToast('请输入项目名称');
      return;
    }
    
    if (!workflowName) {
      showErrorToast('请输入工作流名称');
      return;
    }
    
    if (dates.some(date => !date)) {
      showErrorToast('请选择所有日期');
      return;
    }
    
    // 验证没有重复日期
    if (!checkDuplicateDates()) {
      return;
    }
    
    // 验证没有未来日期
    const today = new Date().toISOString().split('T')[0];
    if (dates.some(date => date > today)) {
      showErrorToast('不能选择未来日期');
      return;
    }
    
    console.log('提交工作流补数任务:');
    console.log('- 项目名称:', projectName);
    console.log('- 工作流名称:', workflowName);
    console.log('- 任务名称:', taskName);
    console.log('- 补数日期:', dates);
    
    try {
      const response = await submitWorkflowtask(projectName, workflowName, taskName, dates,session_id);
      const flag=parseAndGetValue(JSON.stringify(response),'data.flag')
      const answer=parseAndGetValue(JSON.stringify(response),'data.answer')
      if(flag){
        showSuccessToast(`${answer}`);
        console.log(answer);
      }else{
        showErrorToast(`${answer}`);
        console.log(answer);
      }   
    } catch (error) {
      showErrorToast(`请求失败: ${error.message}`);
      console.error('API请求错误:', error);
    }
  }
  /**
 * 初始化AI问答功能
 */
function initAIQA() {
    const sendBtn = document.getElementById('send-question-btn');
    const questionInput = document.getElementById('question-input');
    const qaTypeSelect = document.getElementById('qa_type');
    
    if (sendBtn && questionInput) {
      sendBtn.addEventListener('click', () => {
        sendQuestion();
      });
      
      questionInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          sendQuestion();
        }
      });
      
      // 问答类型变更时更新欢迎消息
      if (qaTypeSelect) {
        qaTypeSelect.addEventListener('change', () => {
          updateWelcomeMessage(qaTypeSelect.value);
        });
      }
      
      console.log('AI问答功能已初始化');
    } else {
      console.error('未找到AI问答相关元素');
    }
    
    // 调整聊天容器高度
    adjustChatContainerHeight();
  }
  
  /**
   * 更新欢迎消息
   * @param {string} qaType - 问答类型
   */
  function updateWelcomeMessage(qaType) {
    const chatMessages = document.getElementById('chat-messages');
    
    // 清空现有消息
    chatMessages.innerHTML = '';
    
    // 创建新的欢迎消息
    const welcomeMessage = document.createElement('div');
    welcomeMessage.className = 'message ai-message';
    
    // 根据问答类型设置不同的欢迎消息
    let messageContent = '';
    let typeTag = '';
    
    switch(qaType) {
      case 'data-asset':
        typeTag = '<span class="message-type-tag data-asset">数据资产</span>';
        messageContent = '您好，我是数据资产问答助手。您可以查询表注释来查询来表，您也可以在这里查询数据资产：<a href="http://datameta.gz.cvte.cn" target="_blank">openmata查询数据资产</a> <a href="https://bi.cvte.com/cbi/decision#/directory?activeTab=ece22a04-fcf7-45f8-9015-92b89a656e1b" target="_blank">BI查询数据资产</a>';
        break;
      case 'task-search':
        typeTag = '<span class="message-type-tag task-search">任务搜索</span>';
        messageContent = '您好，我是任务搜索助手。您可以输入代码片断，搜索API接口、离线作业、同步作业、BI数据集，您也可以通过hive.dma.dma_comm_meta_relation_info 这张表来查询任务';
        break;
      case 'dev-guide':
        typeTag = '<span class="message-type-tag dev-guide">开发指南</span>';
        messageContent = '您好，我是数仓开发指南助手。您可以询问关于数仓开发规范、最佳实践和流程的问题，例如"如何创建一个新的数据模型？"或"数据质量检查的流程是什么？"您也可以直接查询kb文档：<a href="https://kb.cvte.com/pages/viewpage.action?pageId=437463542" target="_blank">工作指南</a>';
        break;
      case 'lineage-analysis':
        typeTag = '<span class="message-type-tag lineage-analysis">血缘分析</span>';
        messageContent = '您好，我是血缘影响分析助手。您可以询问数据血缘关系和影响分析，例如"表A的上游依赖有哪些？"或"如果修改字段B会影响哪些下游报表？"您也可以在这里查询：<a href="http://datameta.gz.cvte.cn" target="_blank">openmata血缘分析</a>';
        break;
      default:
        messageContent = '您好，我是数仓开发助手，有什么可以帮您解答的问题吗？您也直接去问<a href="https://dify.cvte.com/explore/installed/9621a4ec-acb8-418c-a5cd-3a29771b9ff7" target="_blank">C厂秘书长</a>';
    }
    
    welcomeMessage.innerHTML = typeTag + messageContent;
    
    const messageTime = document.createElement('div');
    messageTime.className = 'message-time';
    //messageTime.textContent = '刚刚';
    
    welcomeMessage.appendChild(messageTime);
    chatMessages.appendChild(welcomeMessage);
    
    // 滚动到底部
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
  
  /**
   * 发送问题
   */
  async function sendQuestion() {
    const questionInput = document.getElementById('question-input');
    const chatMessages = document.getElementById('chat-messages');
    const qaTypeSelect = document.getElementById('qa_type');
    const question = questionInput.value.trim();
    const qaType = qaTypeSelect ? qaTypeSelect.value : 'general';
    
    if (!question) {
      showErrorToast('请输入问题');
      return;
    }
    
    // 添加用户消息
    const userMessage = document.createElement('div');
    userMessage.className = 'message user-message';
    userMessage.textContent = question;
    
    const messageTime = document.createElement('div');
    messageTime.className = 'message-time';
   // messageTime.textContent = '刚刚';
    
    userMessage.appendChild(messageTime);
    chatMessages.appendChild(userMessage);
    
    // 清空输入框
    questionInput.value = '';
    
    // 滚动到底部
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    console.log(`发送${qaType}类型问题:`, question);
    
    // 添加AI思考中消息
    const thinkingMessage = document.createElement('div');
    thinkingMessage.className = 'message ai-message thinking';
    thinkingMessage.innerHTML = '<div class="thinking-dots"><span>.</span><span>.</span><span>.</span></div>';
    chatMessages.appendChild(thinkingMessage);
    
    // 滚动到底部
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    try {
        try {
          // 移除思考中消息
          chatMessages.removeChild(thinkingMessage);
          const answer = await getAIResponse(question, qaType);
         // console.error('answer:',answer);
          // 添加AI回复消息
          const aiMessage = document.createElement('div');
          aiMessage.className = 'message ai-message';
          
          // 添加类型标签
          let typeTag = '';
          switch(qaType) {
            case 'data-asset':
              typeTag = '<span class="message-type-tag data-asset">数据资产</span>';
              break;
            case 'task-search':
              typeTag = '<span class="message-type-tag task-search">任务搜索</span><br>';
              break;
            case 'dev-guide':
              typeTag = '<span class="message-type-tag dev-guide">开发指南</span>';
              break;
            case 'lineage-analysis':
              typeTag = '<span class="message-type-tag lineage-analysis">血缘分析</span>';
              break;
          }
          
          aiMessage.innerHTML = typeTag + answer;
          
          const aiMessageTime = document.createElement('div');
          aiMessageTime.className = 'message-time';
          //aiMessageTime.textContent = '刚刚';
          
          aiMessage.appendChild(aiMessageTime);
          chatMessages.appendChild(aiMessage);
          
          // 滚动到底部
          chatMessages.scrollTop = chatMessages.scrollHeight;
          
          console.log('AI回复:', answer.substring(0, 100) + (answer.length > 100 ? '...' : ''));
        } catch (error) {
          // 移除思考中消息
          chatMessages.removeChild(thinkingMessage);
          
          // 添加错误消息
          const errorMessage = document.createElement('div');
          errorMessage.className = 'message ai-message error';
          errorMessage.textContent = '抱歉，处理您的问题时出现错误，请重试。';
          
          const errorMessageTime = document.createElement('div');
          errorMessageTime.className = 'message-time';
         // errorMessageTime.textContent = '刚刚';
          
          errorMessage.appendChild(errorMessageTime);
          chatMessages.appendChild(errorMessage);
          
          // 滚动到底部
          chatMessages.scrollTop = chatMessages.scrollHeight;
          
          showErrorToast(`AI回复失败: ${error.message}`);
          console.error('AI回复处理错误:', error);
        }
      
    } catch (error) {
      // 移除思考中消息
      chatMessages.removeChild(thinkingMessage);
      
      // 添加错误消息
      const errorMessage = document.createElement('div');
      errorMessage.className = 'message ai-message error';
      errorMessage.textContent = '抱歉，发送请求时出现错误，请检查网络连接。';
      
      const errorMessageTime = document.createElement('div');
      errorMessageTime.className = 'message-time';
      //errorMessageTime.textContent = '刚刚';
      
      errorMessage.appendChild(errorMessageTime);
      chatMessages.appendChild(errorMessage);
      
      // 滚动到底部
      chatMessages.scrollTop = chatMessages.scrollHeight;
      
      showErrorToast(`请求失败: ${error.message}`);
      console.error('API请求错误:', error);
    }
  }
  
  /**
   * 获取AI回复
   * @param {string} question - 用户问题
   * @param {string} qaType - 问答类型
   * @returns {string} - AI回复
   */
  async function getAIResponse(question, qaType) {

    // 简单的关键词匹配
    const lowerQuestion = question.toLowerCase();
    //const conversation_id=get_conversation_id();
    
    let result;
    result = await askAI(lowerQuestion, qaType,session_id,conversation_id);
    //console.error('qaType:',qaType);
    if(qaType==='task-search'){

      // 创建表格元素
      const table = document.createElement('table');
      table.className = 'data-table';

      // 创建表头
      const thead = document.createElement('thead');
      thead.innerHTML = `
        <tr>
          <th>任务名称</th>
          <th>工作流名称</th>
          <th>任务类型</th>
          <th>数据分类</th>
          <th>工作空间</th>
        </tr>
      `;
      table.appendChild(thead);

      // 创建表体并填充数据
      const tbody = document.createElement('tbody');
      result.data.answer.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${item.task_name || '-'}</td>
          <td>${item.flow_name || '-'}</td>
          <td>${item.tasktype_name || '-'}</td>
          <td>${item.data_class || '-'}</td>
          <td>${item.ws_name || '-'}</td>
        `;
        tbody.appendChild(row);
      });
      table.appendChild(tbody);
      const tableHtml = table.outerHTML.toString();
      //console.error('table:',tableHtml.toString());
      return tableHtml;
    }else if(qaType==='data-asset'){
      // 创建表格元素
      const table = document.createElement('table');
      table.className = 'data-table';

      // 创建表头
      const thead = document.createElement('thead');
      thead.innerHTML = `
        <tr>
          <th>表名</th>
          <th>表注释</th>
          <th>备注</th> 
          <th>数据分级</th>           
          <th>标签</th>  
        </tr>
      `;
      table.appendChild(thead);

      // 创建表体并填充数据
      const tbody = document.createElement('tbody');
      result.data.answer.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${item.db_name || '-'}.${item.tbl_name_en || '-'}</td>
          <td>${item.tbl_comment || '-'}</td>
          <td>${item.asset_remark || '-'}</td>
          <td>${item.tag_data_class || '-'}</td>
          <td>${item.tag_keywords || '-'}</td>
        `;
        tbody.appendChild(row);
      });
      table.appendChild(tbody);
      const tableHtml = table.outerHTML.toString();
      return tableHtml;
    }else{
      answer=parseAndGetValue(JSON.stringify(result),'data.answer')
      console.error('answer:',answer);
      return answer;
    }
  }
  
  /**
   * 调整聊天容器高度
   */
  function adjustChatContainerHeight() {
    const chatContainer = document.querySelector('.chat-container');
    const chatMessages = document.querySelector('.chat-messages');
    
    if (chatContainer && chatMessages) {
      // 获取可用高度
      const availableHeight = window.innerHeight - 200; // 减去其他元素的高度
      
      // 设置聊天容器的高度
      chatContainer.style.height = `${Math.max(500, availableHeight)}px`;
      
      // 设置消息区域的高度
      chatMessages.style.maxHeight = `${Math.max(350, availableHeight - 150)}px`;
      
      console.log('聊天容器高度已调整');
    }
  }


  
  
  /**
   * 初始化页面内容选择器
   */
  function initPageSelector() {
    const toggleBtn = document.getElementById('page-selector-toggle');
    const cancelBtn = document.getElementById('cancel-selection-btn');
    const confirmBtn = document.getElementById('confirm-selection-btn');
    
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        activatePageSelector();
      });
      console.log('页面选择器按钮已初始化');
    } else {
      console.error('未找到页面选择器按钮元素');
    }
    
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        cancelPageSelection();
      });
    }
    
    if (confirmBtn) {
      confirmBtn.addEventListener('click', () => {
        confirmPageSelection();
      });
    }
    
    // 监听来自内容脚本的消息
    chrome.runtime.onMessage.addListener(handleContentScriptMessage);
  }
  
  /**
   * 激活页面内容选择器
   */
  function activatePageSelector() {
    console.log('激活页面内容选择器');
    
    // 向内容脚本发送消息，激活选择模式
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs && tabs[0]) {
        try {
          chrome.tabs.sendMessage(tabs[0].id, {action: 'activateSelector'}, function(response) {
            if (chrome.runtime.lastError) {
              console.error('发送消息错误:', chrome.runtime.lastError);
              showErrorToast('无法连接到页面，请刷新页面后重试');
            } else if (response && response.success) {
              console.log('选择模式已激活');
              
              // 显示预览区域和操作按钮
              const previewElement = document.getElementById('page-selector-preview');
              const actionsElement = document.getElementById('page-selector-actions');
              
              if (previewElement) previewElement.classList.add('active');
              if (actionsElement) actionsElement.style.display = 'flex';
            } else {
              console.error('激活选择模式失败:', response);
              showErrorToast('激活选择模式失败，请刷新页面后重试');
            }
          });
        } catch (error) {
          console.error('发送消息异常:', error);
          showErrorToast(`发送消息异常: ${error.message}`);
        }
      } else {
        console.error('未找到活动标签页');
        showErrorToast('未找到活动标签页，请确保您已打开网页');
      }
    });
  }
  
  /**
   * 处理来自内容脚本的消息
   */
  function handleContentScriptMessage(message, sender, sendResponse) {
    console.log('收到内容脚本消息:', message);
    
    if (message.action === 'selectionUpdate') {
      // 更新预览内容
      const previewElement = document.getElementById('page-selector-preview');
      
      if (previewElement) {
        if (message.text) {
          previewElement.textContent = message.text.length > 200 
            ? message.text.substring(0, 200) + '...' 
            : message.text;
        } else {
          previewElement.textContent = '未选择任何内容';
        }
      }
      
      // 发送响应
      sendResponse({received: true});
    }
    
    return true; // 保持消息通道开放，以便异步响应
  }
  
  /**
   * 确认页面选择
   */
  function confirmPageSelection() {
    console.log('确认页面选择');
    
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs && tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {action: 'getSelection'}, function(response) {
          if (chrome.runtime.lastError) {
            console.error('获取选择内容错误:', chrome.runtime.lastError);
            showErrorToast('无法获取选择内容，请重试');
          } else if (response && response.text) {
            // 将选择的内容填入源SQL文本框
            const sourceSqlElement = document.getElementById('source-sql');
            if (sourceSqlElement) {
              sourceSqlElement.value = response.text;
              showSuccessToast('已使用选中内容');
            }
            
            // 清理选择状态
            cleanupPageSelection();
          } else {
            console.error('获取选择内容失败:', response);
            showErrorToast('获取选择内容失败，请重新选择');
          }
        });
      }
    });
  }
  
  /**
   * 取消页面选择
   */
  function cancelPageSelection() {
    console.log('取消页面选择');
    
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs && tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {action: 'cancelSelection'}, function(response) {
          if (chrome.runtime.lastError) {
            console.error('取消选择错误:', chrome.runtime.lastError);
          }
          
          // 清理选择状态
          cleanupPageSelection();
        });
      }
    });
  }
  
  /**
   * 清理页面选择状态
   */
  function cleanupPageSelection() {
    // 隐藏预览区域和操作按钮
    const previewElement = document.getElementById('page-selector-preview');
    const actionsElement = document.getElementById('page-selector-actions');
    
    if (previewElement) previewElement.classList.remove('active');
    if (actionsElement) actionsElement.style.display = 'none';
  }

// 禁用未来日期
const disableFutureDates = (time) => {
  return time.getTime() > Date.now()
}