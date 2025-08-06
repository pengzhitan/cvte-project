/**
 * 后台脚本
 * 处理插件的后台逻辑
 */

// 监听插件安装事件
chrome.runtime.onInstalled.addListener(function() {
    console.log('数仓开发提效工具已安装');
    
    // 设置侧边栏默认显示
    if (chrome.sidePanel) {
      chrome.sidePanel.setOptions({
        enabled: true,
        path: 'sidebar/sidebar.html'
      });
    }
  });
  
  // 监听插件图标点击事件
  chrome.action.onClicked.addListener((tab) => {
    // 打开侧边栏
    if (chrome.sidePanel) {
      chrome.sidePanel.open({tabId: tab.id});
    }
  });
  
  // 监听来自内容脚本的消息
  chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    // 处理特定消息
    if (message.action === "logEvent") {
      console.log('事件日志:', message.data);
      sendResponse({received: true});
    }
    return true; // 保持消息通道开放，以便异步响应
  });

  // background.js

// 定义允许使用侧边栏的网站列表 - 使用精确的URL前缀
const ALLOWED_ORIGINS = [
    "https://dp.gz.cvte.cn/",
    "https://newdp.gz.cvte.cn/",
  ];
  
  // 默认禁用所有标签页的侧边栏
  chrome.runtime.onInstalled.addListener(() => {
    // 设置默认侧边栏状态为禁用
    chrome.sidePanel.setOptions({
      enabled: false
    });
    console.log('数仓开发提效工具已安装，默认禁用侧边栏');
  });
  
  // 监听标签页更新事件
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    // 当页面完成加载且有URL时
    if (changeInfo.status === 'complete' && tab.url) {
      // 检查当前URL是否在允许列表中
      const isAllowed = ALLOWED_ORIGINS.some(origin => 
        tab.url.startsWith(origin)
      );
      
      console.log(`标签页 ${tabId} 更新: ${tab.url}, 允许状态: ${isAllowed}`);
      
      // 设置侧边栏状态
      chrome.sidePanel.setOptions({
        tabId: tabId,
        path: 'sidebar/sidebar.html',
        enabled: isAllowed
      }).catch(err => {
        console.error(`设置侧边栏选项失败: ${err.message}`);
      });
    }
  });
  
  // 监听标签页激活事件
  chrome.tabs.onActivated.addListener(async (activeInfo) => {
    try {
      // 获取当前激活的标签页
      const tab = await chrome.tabs.get(activeInfo.tabId);
      
      if (tab.url) {
        // 检查当前URL是否在允许列表中
        const isAllowed = ALLOWED_ORIGINS.some(origin => 
          tab.url.startsWith(origin)
        );
        
        console.log(`标签页 ${tab.id} 激活: ${tab.url}, 允许状态: ${isAllowed}`);
        
        // 设置侧边栏状态
        chrome.sidePanel.setOptions({
          tabId: tab.id,
          path: 'sidebar/sidebar.html',
          enabled: isAllowed
        }).catch(err => {
          console.error(`设置侧边栏选项失败: ${err.message}`);
        });
      }
    } catch (error) {
      console.error(`处理标签页激活事件失败: ${error.message}`);
    }
  });

  // 监听cookie变化
chrome.cookies.onChanged.addListener(function(changeInfo) {
  if (changeInfo.cookie.name === "sessionIdSaaS") {
    console.log("sessionIdSaaS cookie已更改:", changeInfo);
    
    if (!changeInfo.removed) {
      // cookie被添加或修改
      chrome.storage.local.set({ 'sessionIdSaaS': changeInfo.cookie.value });
      
      // 通知sidebar和popup
      chrome.runtime.sendMessage({
        action: "cookieUpdated",
        value: changeInfo.cookie.value
      });
    } else {
      // cookie被删除
      chrome.storage.local.remove('sessionIdSaaS');
      
      // 通知sidebar和popup
      chrome.runtime.sendMessage({
        action: "cookieRemoved"
      });
    }
  }
});

// 处理来自sidebar或popup的消息
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "getSessionCookie") {
    // 获取当前活动标签页
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (tabs.length === 0) {
        sendResponse({ success: false, error: "没有活动标签页" });
        return;
      }
      
      const currentTab = tabs[0];
      
      // 获取cookie
      chrome.cookies.get({
        url: currentTab.url,
        name: "sessionIdSaaS"
      }, function(cookie) {
        if (cookie) {
          console.log("获取到sessionIdSaaS:", cookie.value);
          // 存储cookie值
          chrome.storage.local.set({ 'sessionIdSaaS': cookie.value });
          sendResponse({ success: true, value: cookie.value });
        } else {
          console.log("未找到sessionIdSaaS cookie");
          sendResponse({ success: false, error: "未找到cookie" });
        }
        sendResponse({ success: false, value: cookie.value });
      });
    });
    
    // 返回true表示将异步发送响应
    return true;
  }
});

