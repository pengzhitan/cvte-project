# CVTE项目自动同步工具

## 功能说明

这是一个用于CVTE项目的自动同步工具，能够监控项目文件变化并自动提交到Git仓库。

## 文件说明

- `启动同步工具.vbs`: 启动脚本，提供用户友好的菜单界面
- `complete-sync.ps1`: 核心PowerShell脚本，实现自动同步功能
- `sync-config.json`: 配置文件，可自定义同步参数
- `README.md`: 本说明文档

## 使用方法

### 🌟 推荐方式 - HTML界面
双击运行 `启动工具.bat` 文件，会在浏览器中打开现代化的同步工具界面。

### 📋 功能说明
- **持续监控模式**：实时监控文件变化并自动同步
- **单次同步**：立即执行一次完整同步
- **交互模式**：手动控制同步过程
- **配置设置**：查看和修改同步配置

### 🔧 命令行方式
如果需要直接使用命令行：
```bash
# 单次同步
powershell -ExecutionPolicy Bypass -File complete-sync.ps1 -Mode once

# 持续监控
powershell -ExecutionPolicy Bypass -File complete-sync.ps1 -Mode continuous

# 交互模式
powershell -ExecutionPolicy Bypass -File complete-sync.ps1 -Mode interactive
```

### 命令行方式

```powershell
# 单次同步
powershell -ExecutionPolicy Bypass -File "complete-sync.ps1" -RunOnce

# 持续监控（每30秒检查一次）
powershell -ExecutionPolicy Bypass -File "complete-sync.ps1" -Monitor

# 自定义监控间隔（每10秒检查一次）
powershell -ExecutionPolicy Bypass -File "complete-sync.ps1" -Monitor -Interval 10

# 交互模式
powershell -ExecutionPolicy Bypass -File "complete-sync.ps1"
```

## 前置要求

1. **Git环境**：确保系统已安装Git并配置好用户信息
2. **PowerShell**：Windows 10/11自带，确保执行策略允许运行脚本
3. **网络连接**：能够访问GitHub或其他Git远程仓库
4. **仓库权限**：确保有目标仓库的推送权限

## 注意事项

1. **首次使用前**，建议先手动测试Git推送功能
2. **监控模式下**，按 `Ctrl+C` 可停止监控
3. **文件冲突**时，脚本会尝试先拉取再推送
4. **网络异常**时，脚本会自动重试

## 故障排除

### 常见问题

1. **PowerShell执行策略错误**

   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```
2. **Git推送失败**

   - 检查网络连接
   - 确认Git用户名和邮箱配置
   - 验证仓库推送权限

### 日志查看

脚本运行时会在控制台显示详细日志，包括：

- 文件变化检测结果
- Git操作执行状态
- 错误信息和解决建议
