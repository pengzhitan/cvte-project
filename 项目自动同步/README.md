# CVTE项目自动同步工具

## 📋 功能概述

本工具集提供了完整的Git自动同步解决方案，能够：

- ✅ **自动监控文件变化**：实时检测项目文件的新增、修改、删除
- ✅ **智能文件过滤**：支持排除临时文件、日志文件等不需要同步的内容
- ✅ **自动提交推送**：检测到变化后自动执行 `git add` → `git commit` → `git push`
- ✅ **冲突处理**：自动处理简单的合并冲突（先拉取再推送）
- ✅ **配置化管理**：通过JSON配置文件灵活调整同步参数
- ✅ **多种运行模式**：支持持续监控和单次同步两种模式

## 📁 文件结构

```
项目自动同步/
├── auto-sync.ps1          # 基础自动同步脚本
├── enhanced-sync.ps1      # 增强版同步脚本（推荐）
├── sync-config.json       # 配置文件
├── start-sync.bat         # 启动器（图形化菜单）
└── README.md             # 使用说明（本文件）
```

## 🚀 快速开始

### 方法一：使用启动器（推荐新手）

1. 双击 `start-sync.bat` 文件
2. 根据菜单提示选择运行模式：
   - **选项1**：持续监控模式（适合开发时使用）
   - **选项2**：单次同步模式（适合手动触发）
   - **选项3**：查看详细帮助

### 方法二：直接运行脚本

```powershell
# 持续监控模式（推荐）
.\enhanced-sync.ps1

# 单次同步模式
.\enhanced-sync.ps1 -RunOnce

# 详细输出模式
.\enhanced-sync.ps1 -Verbose

# 使用自定义配置文件
.\enhanced-sync.ps1 -ConfigPath "./my-config.json"
```

## ⚙️ 配置说明

编辑 `sync-config.json` 文件来自定义同步行为：

```json
{
  "projectPath": "D:\\my-project\\CVTE",           // 项目根目录
  "remoteRepo": "https://github.com/pengzhitan/cvte-project.git",  // 远程仓库地址
  "checkInterval": 30,                              // 检查间隔（秒）
  "gitConfig": {
    "userName": "pengzhitan",                       // Git用户名
    "userEmail": "pzt_china@163.com"               // Git邮箱
  },
  "excludePatterns": [                             // 排除文件模式
    "*.tmp", "*.log", "node_modules/", ".DS_Store"
  ],
  "autoCommitMessage": {
    "prefix": "feat: 自动同步项目文件",              // 提交信息前缀
    "includeTimestamp": true,                       // 包含时间戳
    "includeFileCount": true                        // 包含文件数量
  },
  "notifications": {
    "enabled": true,                                // 启用通知
    "showSuccess": true,                           // 显示成功通知
    "showErrors": true                             // 显示错误通知
  }
}
```

### 配置项详解

| 配置项 | 说明 | 默认值 | 示例 |
|--------|------|--------|------|
| `projectPath` | 项目根目录路径 | 必填 | `"D:\\my-project\\CVTE"` |
| `remoteRepo` | Git远程仓库地址 | 必填 | `"https://github.com/user/repo.git"` |
| `checkInterval` | 文件检查间隔（秒） | 30 | `60`（1分钟检查一次） |
| `excludePatterns` | 排除文件的通配符模式 | 见配置文件 | `["*.bak", "temp/"]` |
| `includeTimestamp` | 提交信息是否包含时间戳 | true | `false` |
| `includeFileCount` | 提交信息是否包含文件数量 | true | `false` |

## 📊 运行模式对比

| 特性 | 持续监控模式 | 单次同步模式 |
|------|-------------|-------------|
| **适用场景** | 开发过程中自动同步 | 手动触发同步 |
| **资源占用** | 持续运行，占用内存 | 运行完即退出 |
| **实时性** | 高（30秒内检测） | 立即执行 |
| **推荐用途** | 日常开发工作 | 临时同步、测试 |

## 🔧 高级用法

### 1. 自定义排除规则

在 `sync-config.json` 中添加更多排除模式：

```json
"excludePatterns": [
  "*.tmp",           // 临时文件
  "*.log",           // 日志文件
  "node_modules/",   // Node.js依赖
  ".vscode/",        // VS Code配置
  "dist/",           // 构建输出
  "*.cache",         // 缓存文件
  "Thumbs.db",       // Windows缩略图
  ".DS_Store"        // macOS系统文件
]
```

### 2. 自定义提交信息格式

```json
"autoCommitMessage": {
  "prefix": "docs: 更新项目文档",
  "includeTimestamp": true,
  "includeFileCount": false
}
```

生成的提交信息示例：`docs: 更新项目文档 - 2024-01-15 14:30:25`

### 3. 调整检查频率

```json
"checkInterval": 60  // 改为每分钟检查一次，减少系统负载
```

## 🛠️ 故障排除

### 常见问题

#### 1. "Repository not found" 错误

**原因**：Git仓库配置问题或网络连接问题

**解决方案**：
```powershell
# 检查远程仓库配置
cd "D:\my-project\CVTE"
git remote -v

# 测试连接
git fetch origin
```

#### 2. "Permission denied" 错误

**原因**：没有推送权限或需要身份验证

**解决方案**：
- 确保GitHub账号有仓库推送权限
- 配置SSH密钥或使用Personal Access Token
- 检查Git凭据管理器

#### 3. 脚本执行策略错误

**错误信息**：`无法加载文件，因为在此系统上禁止运行脚本`

**解决方案**：
```powershell
# 临时允许脚本执行
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process

# 或者使用启动器（推荐）
.\start-sync.bat
```

#### 4. 文件冲突处理

**现象**：推送失败，提示有冲突

**自动处理**：脚本会自动尝试 `git pull --rebase` 然后重新推送

**手动处理**：
```powershell
# 如果自动处理失败，手动解决冲突
cd "D:\my-project\CVTE"
git status
git pull origin master
# 解决冲突后
git add .
git commit -m "解决合并冲突"
git push origin master
```

### 调试模式

使用详细输出模式查看更多信息：

```powershell
.\enhanced-sync.ps1 -Verbose
```

这会显示：
- 每个检测到的文件变化
- 详细的Git操作过程
- 更多的状态信息

## 📈 性能优化建议

1. **调整检查间隔**：如果项目文件变化不频繁，可以将 `checkInterval` 设置为更大的值（如60秒或120秒）

2. **优化排除规则**：添加更多不需要同步的文件类型到 `excludePatterns`

3. **使用SSD存储**：将项目放在SSD上可以提高文件检测速度

4. **网络优化**：使用稳定的网络连接，考虑配置Git代理

## 🔒 安全注意事项

1. **敏感信息**：确保不要将包含密码、API密钥等敏感信息的文件同步到公共仓库

2. **访问权限**：定期检查GitHub仓库的访问权限设置

3. **备份策略**：虽然Git本身就是版本控制，但建议定期备份重要数据

4. **网络安全**：在公共网络环境下使用时，建议使用VPN

## 📞 技术支持

如果遇到问题，请按以下步骤排查：

1. 查看本文档的故障排除部分
2. 使用 `-Verbose` 参数运行脚本获取详细日志
3. 检查Git配置和网络连接
4. 联系项目维护者：pengzhitan (pzt_china@163.com)

## 📝 更新日志

### v2.0 (2024-01-15)
- ✨ 新增增强版同步脚本
- ✨ 支持配置文件管理
- ✨ 添加文件排除功能
- ✨ 改进错误处理和通知
- ✨ 新增图形化启动器

### v1.0 (2024-01-15)
- 🎉 初始版本发布
- ✅ 基础自动同步功能
- ✅ 持续监控和单次同步模式

---

**祝您使用愉快！** 🎉