let WidgetErrorMeasureNames=[],WidgetNotusedMeasureNames=[],NotusedWidgets=[];function markPublishedReportWidgetMeasuresInfo(e){for(let[a,l]of Object.entries(e)){console.log("widget_id:",a);var t=document.getElementById("widget-title-"+a);if(t||(t=document.querySelector("div.wId-"+a))){let n=document.createElement("button");n.id="widget-measures-button"+a,n.className="widget-measure-button",n.textContent="查看指标",n.style.transition="background-color 0.3s ease",n.addEventListener("mouseover",()=>{n.style.opacity="0.8"}),n.addEventListener("mouseout",()=>{n.style.opacity="1"}),n.addEventListener("click",e=>{e.stopPropagation();var t=document.getElementById("widget-info-popup-"+a);t&&t.remove();let o=document.createElement("div");o.id="widget-info-popup-"+a,document.body.appendChild(o),o.style.cssText=`
                position: absolute;
                background-color: white;
                border: 2px solid #4CAF50;
                border-radius: 5px;
                padding: 15px;
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                z-index: 10000;
                max-width: 400px;
                font-family: Arial, sans-serif;
                visibility: hidden; // 初始隐藏以计算尺寸
            `;var t=document.createElement("span"),t=(t.textContent="×",t.style.cssText=`
                position: absolute;
                right: 10px;
                top: 5px;
                cursor: pointer;
                font-size: 18px;
                color: #888;
            `,t.addEventListener("click",()=>{o.remove()}),o.appendChild(t),document.createElement("h3")),t=(t.textContent="部件信息",t.style.cssText=`
                margin: 0 0 10px 0;
                color: #4CAF50;
                font-size: 16px;
                border-bottom: 1px solid #eee;
                padding-bottom: 5px;
            `,o.appendChild(t),document.createElement("div")),r=(l.数据集&&((r=document.createElement("div")).innerHTML=`
                    <div style="font-weight: bold; margin: 10px 0 5px 0; color: #333;">数据集</div>
                    <div style="margin-left: 10px; color: #555;">${l.数据集}</div>
                `,t.appendChild(r)),l.使用维度&&0<l.使用维度.length&&((r=document.createElement("div")).innerHTML=`
                    <div style="font-weight: bold; margin: 10px 0 5px 0; color: #333;">使用维度</div>
                    <ul style="margin: 0 0 0 10px; padding-left: 15px; color: #555;">
                        ${l.使用维度.map(e=>`<li>${e}</li>`).join("")}
                    </ul>
                `,t.appendChild(r)),l.使用指标&&0<l.使用指标.length&&((r=document.createElement("div")).innerHTML=`
                    <div style="font-weight: bold; margin: 10px 0 5px 0; color: #333;">使用指标</div>
                    <ul style="margin: 0 0 0 10px; padding-left: 15px; color: #555;">
                        ${l.使用指标.map(e=>`<li>${e}</li>`).join("")}
                    </ul>
                `,t.appendChild(r)),o.appendChild(t),o.offsetWidth),t=o.offsetHeight;let i=e.clientX-r,d=e.clientY;i<0&&(i=0);r=window.innerHeight;d+t>r&&(d=r-t),o.style.cssText=`
            position: absolute;
            left: ${i}px;
            top: ${d}px;
            background-color: white;
            border: 2px solid #4CAF50;
            border-radius: 5px;
            padding: 15px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            z-index: 10000;
            max-width: 400px;
            font-family: Arial, sans-serif;
            visibility: visible;
        `;let s=e=>{o.contains(e.target)||e.target===n||(o.remove(),document.removeEventListener("click",s))};setTimeout(()=>{document.addEventListener("click",s)},100)}),t.appendChild(n)}else console.error(`Widget with ID ${a} not found.`)}}function markWidgetErrorMeasure(){document.querySelector("div.bi-design-widget-detail-fields-tree.bi-virtual-tree-list.bi-virtual-group-list.bi-v").querySelectorAll("div.bi-text-button").forEach(e=>{WidgetErrorMeasureNames.includes(e.textContent)&&(e.style.backgroundColor="#ffb3a7")})}function markWidgetNotusedMeasure(){document.querySelector("div.bi-design-widget-detail-fields-tree.bi-virtual-tree-list.bi-virtual-group-list.bi-v").querySelectorAll("div.bi-text-button").forEach(e=>{WidgetNotusedMeasureNames.includes(e.textContent)&&(e.style.backgroundColor="#ffa631")})}function markNotusedWidget(){document.querySelectorAll("div.bi-basic-button.cursor-pointer.bi-subject-tab-widget-item").forEach(e=>{NotusedWidgets.includes(e.id)&&(e.style.backgroundColor="#ffa631")})}function debounce(t,o){let r;return function(...e){clearTimeout(r),r=setTimeout(()=>{clearTimeout(r),t(...e)},o)}}chrome.runtime.onMessage.addListener((e,t,o)=>{if("markWidgetErrorMeasure"===e.action)try{0<e.data.errorMeasureNames.length&&(WidgetNotusedMeasureNames=[],WidgetErrorMeasureNames=e.data.errorMeasureNames,markWidgetErrorMeasure())}catch(e){console.error("Error:",e)}else if("markWidgetNotusedMeasure"===e.action)try{0<e.data.notusedMeasureNames.length&&(WidgetErrorMeasureNames=[],WidgetNotusedMeasureNames=e.data.notusedMeasureNames,markWidgetNotusedMeasure())}catch(e){console.error("Error:",e)}else"markNotusedWidget"===e.action?0<e.data.notusedWidgets.length&&(NotusedWidgets=e.data.notusedWidgets,markNotusedWidget()):"markPublishedReportWidgetMeasuresInfo"===e.action&&markPublishedReportWidgetMeasuresInfo(e.data.widget_info);return!0});let observer=new MutationObserver(debounce(e=>{e=e.some(e=>Array.from(e.addedNodes).some(e=>1===e.nodeType&&(e.matches(".bi-text-button")||e.querySelector(".bi-text-button"))));e&&0<WidgetErrorMeasureNames.length?markWidgetErrorMeasure():e&&0<WidgetNotusedMeasureNames.length?markWidgetNotusedMeasure():e&&0<NotusedWidgets.length&&markNotusedWidget()},100));observer.observe(document.body,{childList:!0,subtree:!0});