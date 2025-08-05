# CVTE项目自动同步工具

## 功能说明

这是一个用于CVTE项目的自动同步工具，能够监控项目文件变化并自动提交到Git仓库。

## 文件说明

- `start-sync.bat`: 启动脚本，提供用户友好的菜单界面
- `complete-sync.ps1`: 核心PowerShell脚本，实现自动同步功能
- `sync-config.json`: 配置文件，可自定义同步参数
- `README.md`: 本说明文档

## 使用方法

### 方法一：使用启动脚本（推荐）

1. 双击运行 `start-sync.bat`
2. 根据菜单提示选择运行模式：
   - **持续监控模式**：每30秒检查一次文件变化，自动同步
   - **单次同步模式**：立即执行一次同步操作
   - **交互模式**：进入交互式菜单，可查看Git状态和日志

### 方法二：直接运行PowerShell脚本

```powershell
# 持续监控模式
powershell -ExecutionPolicy Bypass -File "complete-sync.ps1" -Monitor

# 单次同步模式
powershell -ExecutionPolicy Bypass -File "complete-sync.ps1" -RunOnce

# 交互模式
powershell -ExecutionPolicy Bypass -File "complete-sync.ps1"

# 自定义监控间隔（10秒）
powershell -ExecutionPolicy Bypass -File "complete-sync.ps1" -Monitor -Interval 10
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