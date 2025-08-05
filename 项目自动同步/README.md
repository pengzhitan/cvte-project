# 项目自动同步工具

一个基于 PowerShell 的项目文件自动同步工具，支持实时监控文件变化并自动提交到 Git 仓库。

## 功能特性

- 🔄 **实时监控**: 监控指定目录的文件变化
- ⚡ **自动同步**: 文件变化时自动执行 Git 提交和推送
- 🎛️ **多种模式**: 支持持续监控、单次同步、交互模式
- ⚙️ **灵活配置**: 通过 JSON 配置文件自定义监控规则
- 📝 **详细日志**: 完整的操作日志记录
- 🌐 **现代界面**: 提供美观的 HTML 操作界面
- 🚀 **一键启动**: 点击即生效，无需额外操作

## 快速开始

### 🎯 一键启动（推荐）

**双击运行** `一键启动.bat` - 提供完整的菜单界面，选择对应数字即可立即执行：

- `[1]` 持续监控模式 - 实时监控文件变化并自动同步
- `[2]` 单次同步 - 立即执行一次完整同步
- `[3]` 交互模式 - 手动控制同步过程
- `[4]` Web服务器模式 - 启动HTTP服务器，支持点击即运行（推荐）
- `[5]` 打开HTML界面 - 在浏览器中操作（传统模式）
- `[6]` 查看配置 - 编辑同步配置文件

### 🌐 Web服务器模式（推荐）

1. 选择选项4启动Web服务器
2. 在浏览器中访问 `http://localhost:8080`
3. 点击按钮即可直接运行，无需下载文件
4. 按Ctrl+C停止服务器

### 💻 命令行方式

```powershell
# 持续监控模式（推荐用于开发时）
powershell -ExecutionPolicy Bypass -File complete-sync.ps1 -Mode continuous

# 单次同步
powershell -ExecutionPolicy Bypass -File complete-sync.ps1 -Mode once

# 交互模式
powershell -ExecutionPolicy Bypass -File complete-sync.ps1 -Mode interactive
```

## 文件说明

- `一键启动.bat` - 主启动器，提供完整菜单选择
- `complete-sync.ps1` - 核心PowerShell同步脚本
- `config.json` - 同步配置文件
- `sync-launcher.html` - 网页操作界面
- `sync-server.ps1` - HTTP服务器脚本，提供Web API支持点击即运行功能
- `README.md` - 使用说明文档

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
