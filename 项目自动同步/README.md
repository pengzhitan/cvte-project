# 🔄 CVTE 项目自动同步工具

一个功能强大的 PowerShell 项目文件自动同步工具，支持实时监控文件变化并智能提交到 Git 仓库。

## ✨ 功能特性

- 🔄 **智能监控**: 实时监控指定目录的文件变化
- ⚡ **自动同步**: 文件变化时自动执行 Git 提交和推送
- 🎛️ **多种模式**: 支持持续监控、单次同步、交互模式
- ⚙️ **配置驱动**: 通过 JSON 配置文件灵活自定义所有参数
- 📝 **智能日志**: 彩色分级日志，支持控制台和文件双输出
- 🌿 **分支智能**: 自动检测当前分支，支持多分支工作流
- 🔧 **错误恢复**: 智能重试机制，自动处理推送冲突
- 🎨 **美观界面**: 现代化的控制台界面，操作直观简单
- 📊 **状态监控**: 实时显示Git状态、分支信息和提交历史

## 🚀 快速开始

### 方式一：一键启动（推荐）

**双击运行** `一键启动.bat` 文件，或直接运行PowerShell脚本进入交互模式：

- `[1]` ⚡ **执行单次同步** - 立即执行一次完整同步
- `[2]` 🔄 **启动监控模式** - 后台实时监控，自动同步变化
- `[3]` 📊 **查看Git状态** - 显示当前仓库状态和分支信息
- `[4]` 📝 **查看同步日志** - 显示最近的同步操作记录
- `[5]` 🚪 **退出程序** - 安全退出应用程序

### 方式二：命令行启动

```powershell
# 交互模式（默认）
powershell -ExecutionPolicy Bypass -File complete-sync.ps1

# 单次同步
powershell -ExecutionPolicy Bypass -File complete-sync.ps1 -RunOnce

# 监控模式
powershell -ExecutionPolicy Bypass -File complete-sync.ps1 -Monitor

# 自定义检查间隔（秒）
powershell -ExecutionPolicy Bypass -File complete-sync.ps1 -Monitor -Interval 60
```

## 📁 文件结构

- `一键启动.bat` - 主启动器，提供完整菜单选择
- `complete-sync.ps1` - 核心PowerShell同步脚本
- `config.json` - 同步配置文件
- `sync.log` - 同步操作日志文件
- `README.md` - 使用说明文档

## ⚙️ 配置说明

### config.json 配置文件

```json
{
  "projectPath": "D:\\my-project\\CVTE",
  "remoteRepo": "https://github.com/username/repo.git",
  "checkInterval": 180,
  "excludePatterns": [
    "*.tmp",
    "*.log",
    "node_modules/",
    ".git/"
  ],
  "autoCommitMessage": "feat: 自动同步项目文件 - {timestamp} ({fileCount} files)"
}
```

### 配置参数说明

- **projectPath**: 要监控的项目根目录路径
- **remoteRepo**: Git远程仓库地址
- **checkInterval**: 监控模式下的检查间隔（秒）
- **excludePatterns**: 排除的文件模式（支持通配符）
- **autoCommitMessage**: 自动提交的消息模板

## 📋 前置要求

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
