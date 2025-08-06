/**
 * API接口封装
 * 处理与后端服务的通信
 */

// API基础URL
//const API_BASE_URL = 'http://localhost:5000/api';
const API_BASE_URL = 'http://10.21.46.212:5000/api';

/**
 * 发送HTTP请求
 * @param {string} url - 请求URL
 * @param {string} method - 请求方法 (GET, POST, PUT, DELETE)
 * @param {Object} data - 请求数据
 * @returns {Promise} - 返回Promise对象
 */
async function sendRequest(url, method = 'GET', data = null) {
  try {
    const options = {
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    if (data && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(data);
    }
    
    console.log(`发送${method}请求到: ${url}`);
    if (data) console.log('请求数据:', data);
    
    const response = await fetch(url, options);
    
    // 检查响应状态
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP错误 ${response.status}: ${errorText}`);
    }
    
    // 解析JSON响应
    const result = await response.json();
    console.log('API响应:', result);
    return result;
  } catch (error) {
    console.error('API请求错误:', error);
    throw error;
  }
}

/**
 * SQL转换API
 * @param {string} sourceSQL - 源SQL
 * @param {string} source_type - 源方言
 * @param {string} targetDialect - 目标方言
 * @param {string} session_id - seesionId
 * @param {string} conversation_id - 会话id 
 * @returns {Promise} - 返回Promise对象
 */
async function convertSQL(sourceSQL, source_type, target_type,session_id,conversation_id) {
  const url = `${API_BASE_URL}/sql/convert`;
  const data = {
    sql: sourceSQL,
    source_type: source_type,
    target_type: target_type,
    session_id: session_id,
    conversation_id:conversation_id
  };
  
  return await sendRequest(url, 'POST', data);
}

/**
 * 提交工作流补数任务API
 * @param {string} projectName - 项目名称
 * @param {string} workflowName - 工作流名称
 * @param {string} taskName - 任务名称
 * @param {Array} dates - 补数日期数组
 * @returns {Promise} - 返回Promise对象
 */
async function submitWorkflowtask(projectName, workflowName, taskName, dates,session_id) {
  const url = `${API_BASE_URL}/workflow/submit`;
  const data = {
    ws_name: projectName,
    flow_name: workflowName,
    task_name: taskName,
    session_id: session_id,
    dates: dates  
  };
  console.log('提交工作流补数任务:', data);
  return await sendRequest(url, 'POST', data);
}

/**
 * AI问答API
 * @param {string} question - 用户问题
 * @param {string} qa_type - 问答类型
 * @param {string} session_id - seesionId
 * @param {string} conversation_id - 会话id 
 * @returns {Promise} - 返回Promise对象
 */
async function askAI(question, qa_type,session_id,conversation_id) {
  const url = `${API_BASE_URL}/ai/ask`;
  const data = {
    question: question,
    qa_type:qa_type,
    session_id: session_id,
    conversation_id:conversation_id
  };
  //console.error(JSON.stringify(data)); 
  return await sendRequest(url, 'POST', data);
}

// 导出API函数
window.API = {
  convertSQL,
  submitWorkflowtask,
  askAI
};