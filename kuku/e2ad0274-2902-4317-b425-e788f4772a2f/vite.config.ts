import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// 获取跨域通信脚本
const getInjectionScript = (): string => {
  return `
<script>
(function() {
  // 元素选择器
  let isSelecting = false;
  let lastHighlighted = null;
  let selectedElement = null;
  
  // 创建高亮样式
  const style = document.createElement('style');
  style.textContent = \`
    .element-selector-highlight {
      outline: 2px solid #007acc !important;
      outline-offset: 2px !important;
      background-color: rgba(0, 122, 204, 0.1) !important;
      cursor: crosshair !important;
      position: relative !important;
    }
    .element-selector-highlight::after {
      content: attr(data-selector-info);
      position: absolute;
      top: -25px;
      left: 0;
      background: #007acc;
      color: white;
      padding: 2px 6px;
      font-size: 12px;
      border-radius: 3px;
      white-space: nowrap;
      z-index: 10000;
      pointer-events: none;
    }
    
    .element-selector-selected {
      outline: 2px solid #22c55e !important;
      outline-offset: 2px !important;
      background-color: rgba(34, 197, 94, 0.1) !important;
      position: relative !important;
      box-shadow: 0 0 0 1px rgba(34, 197, 94, 0.3) !important;
    }
    
    .element-selector-tag {
      position: absolute;
      background: linear-gradient(135deg, #22c55e, #16a34a);
      color: white;
      padding: 4px 8px;
      font-size: 11px;
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      border-radius: 4px;
      white-space: nowrap;
      z-index: 10001;
      pointer-events: none;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      border: 1px solid rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(4px);
      font-weight: 500;
      letter-spacing: 0.5px;
    }
    
    .element-selector-tag::before {
      content: '';
      position: absolute;
      top: 100%;
      left: 8px;
      border: 4px solid transparent;
      border-top-color: #16a34a;
    }
    
    .css-debugger-modified {
      position: relative !important;
    }
    
    .css-debugger-modified::after {
      content: 'CSS调试中';
      position: absolute;
      top: -20px;
      right: 0;
      background: #f59e0b;
      color: white;
      padding: 2px 6px;
      font-size: 10px;
      border-radius: 3px;
      white-space: nowrap;
      z-index: 10002;
      pointer-events: none;
      font-family: sans-serif;
    }
  \`;
  document.head.appendChild(style);
  
  // 生成元素选择器
  function generateSelector(element) {
    // 优先使用data-testid或id
    if (element.getAttribute('data-testid')) {
      return '[data-testid="' + element.getAttribute('data-testid') + '"]';
    }
    
    if (element.id) {
      return '#' + element.id;
    }
    
    let selector = element.tagName.toLowerCase();
    
    // 添加类名，但过滤掉元素选择器相关的类
    if (element.className && typeof element.className === 'string') {
      const classes = element.className.trim().split(/\\s+/).filter(cls => 
        cls && !cls.startsWith('element-selector-') && !cls.includes('css-debugger')
      );
      if (classes.length > 0) {
        // 只使用前3个最具特征的类名
        const selectedClasses = classes.slice(0, 3);
        selector += '.' + selectedClasses.join('.');
      }
    }
    
    // 验证选择器是否唯一
    let elements = document.querySelectorAll(selector);
    if (elements.length > 1) {
      // 尝试添加nth-child
      const parent = element.parentElement;
      if (parent) {
        const siblings = Array.from(parent.children).filter(child => 
          child.tagName === element.tagName
        );
        const index = siblings.indexOf(element) + 1;
        selector += \`:nth-child(\${index})\`;
        
        // 再次验证
        elements = document.querySelectorAll(selector);
        if (elements.length > 1) {
          // 如果还是不唯一，使用更具体的路径
          selector = getFullPath(element);
        }
      }
    }
    
    return selector;
  }
  
  // 生成完整的CSS路径
  function getFullPath(element) {
    const path = [];
    while (element && element.nodeType === Node.ELEMENT_NODE) {
      let selector = element.tagName.toLowerCase();
      
      if (element.id) {
        selector += '#' + element.id;
        path.unshift(selector);
        break;
      } else {
        const parent = element.parentElement;
        if (parent) {
          const siblings = Array.from(parent.children).filter(child => 
            child.tagName === element.tagName
          );
          if (siblings.length > 1) {
            const index = siblings.indexOf(element) + 1;
            selector += \`:nth-child(\${index})\`;
          }
        }
        path.unshift(selector);
      }
      element = element.parentElement;
    }
    return path.join(' > ');
  }
  
  // 高亮元素
  function highlightElement(element) {
    if (lastHighlighted) {
      lastHighlighted.classList.remove('element-selector-highlight');
      lastHighlighted.removeAttribute('data-selector-info');
    }
    
    if (element && element !== document.body && element !== document.documentElement) {
      element.classList.add('element-selector-highlight');
      const selector = generateSelector(element);
      element.setAttribute('data-selector-info', selector);
      lastHighlighted = element;
    }
  }
  
  // 标记已选择的元素（增加持久边框和标签）
  function markSelectedElement(element, index = 0) {
    if (element && element !== document.body && element !== document.documentElement) {
      // 移除临时高亮
      element.classList.remove('element-selector-highlight');
      element.removeAttribute('data-selector-info');
      
      // 添加选中样式
      element.classList.add('element-selector-selected');
      
      // 创建选中标签
      const tag = document.createElement('div');
      tag.className = 'element-selector-tag';
      const tagText = \`<\${element.tagName.toLowerCase()}\${element.id ? '#' + element.id : ''}\${element.className ? '.' + element.className.split(' ').filter(c => c && !c.startsWith('element-selector')).slice(0, 2).join('.') : ''}>\`;
      tag.textContent = index > 0 ? \`\${tagText} (\${index + 1})\` : tagText;
      tag.setAttribute('data-element-id', element.id || element.tagName + '-' + Math.random().toString(36).substr(2, 9));
      
      // 定位标签
      const rect = element.getBoundingClientRect();
      tag.style.left = rect.left + window.scrollX + 'px';
      tag.style.top = (rect.top + window.scrollY - 25) + 'px';
      
      document.body.appendChild(tag);
      
      // 存储标签引用，便于后续清理
      element.setAttribute('data-tag-id', tag.getAttribute('data-element-id'));
    }
  }

  // 选择具有相同className的所有元素
  function selectElementsWithSameClass(clickedElement) {
    const selectedElements = [];
    
    if (clickedElement && clickedElement !== document.body && clickedElement !== document.documentElement) {
      // 获取点击元素的className（排除我们添加的选择器类）
      const originalClasses = clickedElement.className.split(' ')
        .filter(cls => cls.trim() && !cls.startsWith('element-selector') && !cls.startsWith('css-debugger'));
      
      if (originalClasses.length > 0) {
        // 构建选择器，查找具有相同类名的所有元素
        const classSelector = '.' + originalClasses.join('.');
        console.log('查找具有相同className的元素，选择器:', classSelector);
        
        try {
          const elementsWithSameClass = document.querySelectorAll(classSelector);
          console.log('找到', elementsWithSameClass.length, '个具有相同className的元素');
          
          elementsWithSameClass.forEach((element, index) => {
            if (element !== document.body && element !== document.documentElement) {
              markSelectedElement(element, index);
              selectedElements.push(element);
            }
          });
        } catch (error) {
          console.warn('选择器查询失败:', error);
          // 如果选择器查询失败，回退到只选择点击的元素
          markSelectedElement(clickedElement, 0);
          selectedElements.push(clickedElement);
        }
      } else {
        // 如果没有className，只选择点击的元素
        console.log('元素没有className，只选择当前元素');
        markSelectedElement(clickedElement, 0);
        selectedElements.push(clickedElement);
      }
    }
    
    return selectedElements;
  }
  
  // 清理所有选中标记
  function clearSelectedMarks() {
    // 移除所有选中样式
    document.querySelectorAll('.element-selector-selected').forEach(el => {
      el.classList.remove('element-selector-selected');
      el.removeAttribute('data-tag-id');
      
      // 清除原始样式信息，因为元素选择被清除了
      if (el.hasAttribute('data-original-styles')) {
        console.log('清除元素的原始样式信息:', el);
        el.removeAttribute('data-original-styles');
      }
    });
    
    // 移除所有标签
    document.querySelectorAll('.element-selector-tag').forEach(tag => {
      tag.remove();
    });
    
    // 移除所有CSS调试标记
    document.querySelectorAll('.css-debugger-modified').forEach(tag => {
      tag.classList.remove('css-debugger-modified');
    });
  }
  
  // 清除高亮
  function clearHighlight() {
    if (lastHighlighted) {
      lastHighlighted.classList.remove('element-selector-highlight');
      lastHighlighted.removeAttribute('data-selector-info');
      lastHighlighted = null;
    }
  }
  
  // 鼠标移动处理
  function handleMouseMove(e) {
    if (!isSelecting) return;
    e.preventDefault();
    highlightElement(e.target);
  }
  
  // 鼠标点击处理
  function handleClick(e) {
    if (!isSelecting) return;
    e.preventDefault();
    e.stopPropagation();
    
    selectedElement = e.target;
    
    // 选择具有相同className的所有元素
    const selectedElements = selectElementsWithSameClass(selectedElement);
    console.log('选中了', selectedElements.length, '个元素');
    
    // 发送选择结果到父窗口，使用统一的消息格式
    if (window.parent && window.parent !== window && selectedElements.length > 0) {
      // 为所有选中的元素创建信息
      const elementsInfo = selectedElements.map((element, index) => {
        const elementRect = element.getBoundingClientRect();
        const selector = generateSelector(element);
        
        return {
          tag: element.tagName.toLowerCase(),
          id: element.id,
          classes: element.className ? element.className.split(' ').filter(cls => cls.trim() && !cls.startsWith('element-selector') && !cls.startsWith('css-debugger')) : [],
          text: element.textContent?.substring(0, 100) || '',
          attributes: Array.from(element.attributes).reduce((attrs, attr) => {
            attrs[attr.name] = attr.value;
            return attrs;
          }, {}),
          rect: {
            top: elementRect.top,
            left: elementRect.left,
            width: elementRect.width,
            height: elementRect.height
          },
          xpath: selector,
          cssSelector: selector,
          index: index + 1 // 元素序号
        };
      });
      
      // 使用第一个元素的信息作为主要信息，但添加所有元素的数组
      const primaryElement = elementsInfo[0];
      
      window.parent.postMessage({
        type: 'ELEMENT_PICKER_RESPONSE',
        requestId: 'element_selection',
        payload: {
          action: 'element_selected',
          result: {
            elementInfo: primaryElement,
            allElements: elementsInfo, // 所有选中元素的信息
            selectedCount: selectedElements.length, // 选中元素数量
            timestamp: Date.now(),
            id: \`element_\${Date.now()}_\${Math.random().toString(36).substr(2, 9)}\`
          }
        }
      }, '*');
    }
    
    stopSelecting();
  }
  
  // 开始选择
  function startSelecting() {
    fullCleanup();
    isSelecting = true;
    document.addEventListener('mousemove', handleMouseMove, true);
    document.addEventListener('click', handleClick, true);
    document.body.style.cursor = 'crosshair';
  }
  
  // 停止选择
  function stopSelecting() {
    isSelecting = false;
    document.removeEventListener('mousemove', handleMouseMove, true);
    document.removeEventListener('click', handleClick, true);
    document.body.style.cursor = '';
    clearHighlight();
  }
  
  // 完全清理（停止选择并清除所有标记）
  function fullCleanup() {
    stopSelecting();
    clearSelectedMarks();
  }
  
  // CSS调试功能：应用CSS修改（支持多个相同className的元素）
  function applyCSSChanges(elementSelector, cssProperties) {
    try {
      // 查找所有选中的元素（具有element-selector-selected类的元素）
      const selectedElements = document.querySelectorAll('.element-selector-selected');
      let appliedCount = 0;
      
      if (selectedElements.length > 0) {
        console.log('找到', selectedElements.length, '个选中的元素');
        console.log('要应用的CSS:', cssProperties);
        
        selectedElements.forEach((element, index) => {
          try {
            // 保存原始样式（如果还没有保存）
            if (!element.hasAttribute('data-original-styles')) {
              const computedStyles = window.getComputedStyle(element);
              const originalStyles = {};
              
              // 保存需要修改的CSS属性的原始值
              Object.keys(cssProperties).forEach(prop => {
                originalStyles[prop] = computedStyles.getPropertyValue(prop);
              });
              
              element.setAttribute('data-original-styles', JSON.stringify(originalStyles));
              console.log(\`元素\${index + 1}保存原始样式:\`, originalStyles);
            }
            
            // 应用新的CSS样式
            Object.entries(cssProperties).forEach(([property, value]) => {
              element.style.setProperty(property, value, 'important');
            });
            
            // 添加调试标记，但保持选中状态
            element.classList.add('css-debugger-modified');
            
            // 确保保持选中元素的标记（不要移除绿色边框）
            if (!element.classList.contains('element-selector-selected')) {
              element.classList.add('element-selector-selected');
            }
            
            appliedCount++;
            console.log(\`元素\${index + 1}CSS应用成功，当前样式:\`, window.getComputedStyle(element));
          } catch (elementError) {
            console.warn(\`元素\${index + 1}CSS应用失败:\`, elementError);
          }
        });
        
        console.log(\`成功为\${appliedCount}/\${selectedElements.length}个元素应用了CSS\`);
        return appliedCount > 0;
      } else {
        // 回退到原始逻辑：通过选择器查找单个元素
        const element = document.querySelector(elementSelector);
        if (element) {
          console.log('回退到单元素模式，找到元素:', element, '选择器:', elementSelector);
          
          // 保存原始样式（如果还没有保存）
          if (!element.hasAttribute('data-original-styles')) {
            const computedStyles = window.getComputedStyle(element);
            const originalStyles = {};
            
            // 保存需要修改的CSS属性的原始值
            Object.keys(cssProperties).forEach(prop => {
              originalStyles[prop] = computedStyles.getPropertyValue(prop);
            });
            
            element.setAttribute('data-original-styles', JSON.stringify(originalStyles));
            console.log('保存原始样式:', originalStyles);
          }
          
          // 应用新的CSS样式
          Object.entries(cssProperties).forEach(([property, value]) => {
            element.style.setProperty(property, value, 'important');
          });
          
          // 添加调试标记，但保持选中状态
          element.classList.add('css-debugger-modified');
          
          if (!element.classList.contains('element-selector-selected')) {
            element.classList.add('element-selector-selected');
          }
          
          console.log('CSS应用成功，元素当前样式:', window.getComputedStyle(element));
          return true;
        } else {
          console.warn('未找到元素，选择器:', elementSelector);
          return false;
        }
      }
    } catch (error) {
      console.warn('应用CSS修改失败:', error);
      return false;
    }
  }
  
  // CSS调试功能：重置元素样式（支持多个相同className的元素）
  function resetElementCSS(elementSelector) {
    try {
      // 查找所有选中的元素（具有element-selector-selected类的元素）
      const selectedElements = document.querySelectorAll('.element-selector-selected');
      let resetCount = 0;
      
      if (selectedElements.length > 0) {
        console.log('重置', selectedElements.length, '个选中元素的CSS');
        
        selectedElements.forEach((element, index) => {
          try {
            console.log(\`重置元素\${index + 1}的CSS\`);
            
            // 恢复原始样式
            const originalStylesStr = element.getAttribute('data-original-styles');
            if (originalStylesStr) {
              const originalStyles = JSON.parse(originalStylesStr);
              console.log(\`元素\${index + 1}恢复原始样式:\`, originalStyles);
              
              Object.entries(originalStyles).forEach(([property, value]) => {
                if (value && value !== '') {
                  element.style.setProperty(property, value);
                } else {
                  element.style.removeProperty(property);
                }
              });
              
              // 重要：不删除原始样式属性，保留用于下次重置
              console.log(\`元素\${index + 1}原始样式已恢复，保留data-original-styles用于下次重置\`);
            } else {
              // 如果没有保存原始样式，则移除所有内联样式
              console.log(\`元素\${index + 1}没有保存的原始样式，移除所有内联样式\`);
              element.removeAttribute('style');
            }
            
            // 移除调试标记
            element.classList.remove('css-debugger-modified');
            
            resetCount++;
            console.log(\`元素\${index + 1}CSS重置完成，当前样式:\`, window.getComputedStyle(element));
          } catch (elementError) {
            console.warn(\`元素\${index + 1}重置失败:\`, elementError);
          }
        });
        
        console.log(\`成功重置了\${resetCount}/\${selectedElements.length}个元素的CSS\`);
        return resetCount > 0;
      } else {
        // 回退到原始逻辑：通过选择器查找单个元素
        const element = document.querySelector(elementSelector);
        if (element) {
          console.log('回退到单元素模式，重置元素CSS:', elementSelector);
          
          // 恢复原始样式
          const originalStylesStr = element.getAttribute('data-original-styles');
          if (originalStylesStr) {
            const originalStyles = JSON.parse(originalStylesStr);
            console.log('恢复原始样式:', originalStyles);
            
            Object.entries(originalStyles).forEach(([property, value]) => {
              if (value && value !== '') {
                element.style.setProperty(property, value);
              } else {
                element.style.removeProperty(property);
              }
            });
            
            // 重要：不删除原始样式属性，保留用于下次重置
            console.log('原始样式已恢复，保留data-original-styles用于下次重置');
          } else {
            // 如果没有保存原始样式，则移除所有内联样式
            console.log('没有保存的原始样式，移除所有内联样式');
            element.removeAttribute('style');
          }
          
          // 移除调试标记
          element.classList.remove('css-debugger-modified');
          
          console.log('CSS重置完成，元素当前样式:', window.getComputedStyle(element));
          return true;
        }
        console.warn('重置CSS失败：未找到元素', elementSelector);
        return false;
      }
    } catch (error) {
      console.warn('重置CSS样式失败:', error);
      return false;
    }
  }
  
  // CSS调试功能：获取元素当前样式
  function getElementCurrentStyles(elementSelector) {
    try {
      const element = document.querySelector(elementSelector);
      if (element) {
        const computedStyles = window.getComputedStyle(element);
        const styles = {};
        
        // 获取常用的CSS属性
        const cssProperties = [
          'color', 'font-size', 'width', 'height', 'margin', 'padding',
          'background-color', 'border-radius', 'border', 'opacity',
          'display', 'position', 'top', 'left', 'right', 'bottom',
          'z-index', 'overflow', 'text-align', 'line-height'
        ];
        
        cssProperties.forEach(prop => {
          const value = computedStyles.getPropertyValue(prop);
          if (value) {
            styles[prop] = value;
          }
        });
        
        return styles;
      }
      return {};
    } catch (error) {
      console.warn('获取元素样式失败:', error);
      return {};
    }
  }

  // 监听来自父窗口的消息
  window.addEventListener('message', function(event) {
    // 统一处理 CrossOriginElementSelectionService 的消息格式
    if (event.data.type === 'ELEMENT_PICKER_REQUEST') {
      const { payload, requestId } = event.data;
      
      switch (payload?.action) {
        case 'start_selection':
          startSelecting();
          break;
        case 'stop_selection':
          stopSelecting();
          break;
        case 'cleanup':
          fullCleanup();
          break;
        case 'apply_css_changes':
          console.log('收到CSS应用请求:', payload);
          
          // 验证选择器
          const testElement = document.querySelector(payload.elementSelector);
          console.log('选择器验证:', payload.elementSelector, '找到元素:', testElement);
          
          const applied = applyCSSChanges(payload.elementSelector, payload.cssProperties);
          
          // 发送应用结果通知
          if (window.parent && window.parent !== window) {
            window.parent.postMessage({
              type: 'ELEMENT_PICKER_RESPONSE',
              requestId: requestId,
              payload: {
                action: 'css_applied',
                success: applied,
                elementSelector: payload.elementSelector,
                cssProperties: payload.cssProperties,
                elementFound: !!testElement
              }
            }, '*');
          }
          break;
        case 'reset_element_css':
          const reset = resetElementCSS(payload.elementSelector);
          // 发送重置结果通知
          if (window.parent && window.parent !== window) {
            window.parent.postMessage({
              type: 'ELEMENT_PICKER_RESPONSE',
              requestId: requestId,
              payload: {
                action: 'css_reset',
                success: reset,
                elementSelector: payload.elementSelector
              }
            }, '*');
          }
          break;
        case 'get_element_styles':
          const styles = getElementCurrentStyles(payload.elementSelector);
          // 发送样式信息
          if (window.parent && window.parent !== window) {
            window.parent.postMessage({
              type: 'ELEMENT_PICKER_RESPONSE',
              requestId: requestId,
              payload: {
                action: 'element_styles_response',
                styles: styles,
                elementSelector: payload.elementSelector
              }
            }, '*');
          }
          break;
        case 'clear_selected_elements':
          // 清除所有选中元素的标记
          clearSelectedMarks();
          console.log('已清除所有选中元素标记');
          break;
      }
    }
    // 保持向后兼容，也支持旧的消息格式
    else if (event.data.type === 'START_ELEMENT_SELECTION') {
      startSelecting();
    } else if (event.data.type === 'STOP_ELEMENT_SELECTION') {
      fullCleanup();
    }
  });
  
  // 键盘ESC取消选择
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && isSelecting) {
      stopSelecting();
    }
  });
  
  // 页面加载完成后通知父窗口
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({
          type: 'ELEMENT_PICKER_INIT',
          requestId: 'init',
          payload: { success: true }
        }, '*');
      }
    });
  } else {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({
        type: 'ELEMENT_PICKER_INIT',
        requestId: 'init',
        payload: { success: true }
      }, '*');
    }
  }
})();
</script>
`;
};

// 创建脚本注入器
const createScriptInjector = () => {
  const injectionScript = getInjectionScript();
  
  const hasScript = (htmlContent: string): boolean => {
    return htmlContent.includes('CROSS_ORIGIN_READY') || 
           htmlContent.includes('element-selector-highlight');
  };
  
  const injectScript = (htmlContent: string): string => {
    if (hasScript(htmlContent)) {
      return htmlContent;
    }
    
    // 在 </body> 标签前插入脚本
    if (htmlContent.includes('</body>')) {
      return htmlContent.replace('</body>', injectionScript + '\n</body>');
    }
    
    // 如果没有 </body> 标签，在 </html> 前插入
    if (htmlContent.includes('</html>')) {
      return htmlContent.replace('</html>', injectionScript + '\n</html>');
    }
    
    // 如果都没有，直接追加到末尾
    return htmlContent + injectionScript;
  };
  
  const processHtmlFile = async (filePath: string): Promise<boolean> => {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      
      if (hasScript(content)) {
        return false; // 已经注入过了
      }
      
      const modifiedContent = injectScript(content);
      fs.writeFileSync(filePath, modifiedContent, 'utf-8');
      return true;
    } catch (error) {
      console.warn(`处理HTML文件失败: ${filePath}`, error);
      return false;
    }
  };
  
  const autoInject = async (targetDir: string): Promise<void> => {
    const htmlFiles = findHtmlFiles(targetDir);
    let injectedCount = 0;
    
    for (const file of htmlFiles) {
      const injected = await processHtmlFile(file);
      if (injected) {
        injectedCount++;
        console.log(`已注入跨域脚本到: ${file}`);
      }
    }
    
    if (injectedCount > 0) {
      console.log(`跨域元素选择脚本注入完成，共处理 ${injectedCount} 个文件`);
    }
  };
  
  const findHtmlFiles = (dir: string): string[] => {
    const htmlFiles: string[] = [];
    
    const scanDirectory = (currentDir: string) => {
      try {
        const files = fs.readdirSync(currentDir);
        
        for (const file of files) {
          const fullPath = path.join(currentDir, file);
          const stat = fs.statSync(fullPath);
          
          if (stat.isDirectory()) {
            scanDirectory(fullPath);
          } else if (file.endsWith('.html')) {
            htmlFiles.push(fullPath);
          }
        }
      } catch (error) {
        console.warn(`扫描目录失败: ${currentDir}`, error);
      }
    };
    
    scanDirectory(dir);
    return htmlFiles;
  };
  
  return {
    autoInject,
    injectScript,
    hasScript
  };
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // 开发环境脚本注入插件
    {
      name: 'dev-html-injector',
      enforce: 'pre' as const,
      transformIndexHtml: {
        enforce: 'pre' as const,
        transform: (html: string) => {
          const { injectScript, hasScript } = createScriptInjector();
          if (!hasScript(html)) {
            return injectScript(html);
          }
          return html;
        }
      },
      apply: 'serve'
    },
    // 生产环境脚本注入插件
    {
      name: 'build-script-injector',
      enforce: 'post' as const,
      writeBundle() {
        const { autoInject } = createScriptInjector();
        autoInject('./dist');
      },
      apply: 'build'
    }
  ],
  server: {
    cors: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control'
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  },
  base: '/corporate_homepage_IA92QX/'
})
