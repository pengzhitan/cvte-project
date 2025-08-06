function getAllCookies(domain) {
    return new Promise((resolve, reject) => {
      chrome.cookies.getAll({ domain: domain }, (cookies) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(cookies);
        }
      });
    });
  }
  
  // 使用示例
  async function displayCookies() {
    try {
      // 获取当前标签页URL
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const url = new URL(tabs[0].url);
      const domain = url.hostname;
      
      // 获取所有Cookie
      const cookies = await getAllCookies(domain);
      
      // 处理Cookie
      cookies.forEach(cookie => {
        console.log(`名称: ${cookie.name}, 值: ${cookie.value}`);
        console.log(`域: ${cookie.domain}, 路径: ${cookie.path}`);
        console.log(`过期时间: ${new Date(cookie.expirationDate * 1000)}`);
        console.log(`HttpOnly: ${cookie.httpOnly}, 安全: ${cookie.secure}`);
        console.log('-------------------');
      });
    } catch (error) {
      console.error('获取Cookie失败:', error);
    }
  }
  
  displayCookies();