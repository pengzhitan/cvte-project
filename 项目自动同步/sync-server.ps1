# HTTP Server for Project Sync Tool
# Provides web API for one-click sync functionality

param(
    [int]$Port = 8080
)

# Function to write log messages
function Write-Log {
    param(
        [string]$Message,
        [string]$Level = "INFO"
    )
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[$timestamp] [$Level] $Message"
}

# Function to start sync process
function Start-SyncProcess {
    param(
        [string]$Mode = "once"
    )
    try {
        $scriptPath = Join-Path $PSScriptRoot "complete-sync.ps1"
        if (Test-Path $scriptPath) {
            Write-Log "Starting sync process with mode: $Mode"
            $arguments = "-ExecutionPolicy Bypass -File `"$scriptPath`" -Mode $Mode"
            $process = Start-Process -FilePath "powershell.exe" -ArgumentList $arguments -PassThru -WindowStyle Hidden
            return @{ success = $true; message = "Sync process started successfully with mode: $Mode"; processId = $process.Id }
        } else {
            return @{ success = $false; message = "Sync script not found: $scriptPath" }
        }
    } catch {
        Write-Log "Error starting sync process: $($_.Exception.Message)" "ERROR"
        return @{ success = $false; message = "Error: $($_.Exception.Message)" }
    }
}

# Function to get config content
function Get-ConfigContent {
    try {
        $configPath = Join-Path $PSScriptRoot "config.json"
        if (Test-Path $configPath) {
            $content = Get-Content $configPath -Raw -Encoding UTF8
            return @{ success = $true; content = $content }
        } else {
            return @{ success = $false; message = "Config file not found" }
        }
    } catch {
        return @{ success = $false; message = "Error reading config: $($_.Exception.Message)" }
    }
}

# Function to handle HTTP requests
function Handle-Request {
    param($context)
    
    $request = $context.Request
    $response = $context.Response
    
    # Set CORS headers
    $response.Headers.Add("Access-Control-Allow-Origin", "*")
    $response.Headers.Add("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    $response.Headers.Add("Access-Control-Allow-Headers", "Content-Type")
    
    $url = $request.Url.AbsolutePath
    Write-Log "Request: $($request.HttpMethod) $url"
    
    try {
        if ($request.HttpMethod -eq "OPTIONS") {
            $response.StatusCode = 200
            $response.Close()
            return
        }
        
        switch ($url) {
            "/" {
                $htmlContent = @"
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>项目自动同步工具</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Microsoft YaHei', Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #333;
        }
        
        .container {
            background: white;
            border-radius: 15px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            padding: 40px;
            max-width: 500px;
            width: 90%;
            text-align: center;
        }
        
        .title {
            font-size: 28px;
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 10px;
        }
        
        .subtitle {
            color: #7f8c8d;
            margin-bottom: 30px;
            font-size: 16px;
        }
        
        .button-group {
            display: flex;
            flex-direction: column;
            gap: 15px;
        }
        
        .btn {
            padding: 15px 25px;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.3s ease;
            text-decoration: none;
            display: inline-block;
        }
        
        .btn-primary {
            background: linear-gradient(45deg, #3498db, #2980b9);
            color: white;
        }
        
        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(52, 152, 219, 0.3);
        }
        
        .btn-success {
            background: linear-gradient(45deg, #27ae60, #229954);
            color: white;
        }
        
        .btn-success:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(39, 174, 96, 0.3);
        }
        
        .btn-warning {
            background: linear-gradient(45deg, #f39c12, #e67e22);
            color: white;
        }
        
        .btn-warning:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(243, 156, 18, 0.3);
        }
        
        .btn-info {
            background: linear-gradient(45deg, #17a2b8, #138496);
            color: white;
        }
        
        .btn-info:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(23, 162, 184, 0.3);
        }
        
        .status {
            margin-top: 20px;
            padding: 15px;
            border-radius: 8px;
            display: none;
        }
        
        .status.success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        
        .status.error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        
        .status.info {
            background: #d1ecf1;
            color: #0c5460;
            border: 1px solid #bee5eb;
        }
        
        .loading {
            display: none;
            margin-top: 20px;
        }
        
        .spinner {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #3498db;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .description {
            font-size: 14px;
            color: #6c757d;
            margin-top: 5px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1 class="title">🔄 项目自动同步工具</h1>
        <p class="subtitle">选择同步模式开始工作</p>
        
        <div class="button-group">
            <button class="btn btn-primary" onclick="runSync('monitor')">
                📡 持续监控模式
                <div class="description">实时监控文件变化并自动同步</div>
            </button>
            
            <button class="btn btn-success" onclick="runSync('once')">
                ⚡ 单次同步
                <div class="description">立即执行一次完整同步</div>
            </button>
            
            <button class="btn btn-warning" onclick="runSync('interactive')">
                🎛️ 交互模式
                <div class="description">手动控制同步过程</div>
            </button>
            
            <button class="btn btn-info" onclick="openConfig()">
                ⚙️ 配置设置
                <div class="description">查看和修改同步配置</div>
            </button>
        </div>
        
        <div class="loading" id="loading">
            <div class="spinner"></div>
            <p>正在执行同步操作...</p>
        </div>
        
        <div class="status" id="status"></div>
    </div>
    
    <script>
        function showStatus(message, type = 'info') {
            const statusDiv = document.getElementById('status');
            statusDiv.className = `status `+type;
            statusDiv.textContent = message;
            statusDiv.style.display = 'block';
            
            // 3秒后自动隐藏状态信息
            setTimeout(() => {
                statusDiv.style.display = 'none';
            }, 3000);
        }
        
        function showLoading(show = true) {
            const loadingDiv = document.getElementById('loading');
            loadingDiv.style.display = show ? 'block' : 'none';
        }
        
        function runSync(mode) {
            showLoading(true);
            
            const modes = {
                'monitor': { cmd: 'continuous', desc: '持续监控模式' },
                'once': { cmd: 'once', desc: '单次同步' },
                'interactive': { cmd: 'interactive', desc: '交互模式' }
            };
            
            const modeInfo = modes[mode];
            
            // 通过API直接启动同步进程
            fetch('/api/sync', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ mode: modeInfo.cmd })
            })
            .then(response => response.json())
            .then(data => {
                showLoading(false);
                if (data.success) {
                    showStatus(modeInfo.desc + '已启动！进程ID: ' + data.processId, 'success');
                } else {
                    showStatus('启动失败: ' + data.message, 'error');
                }
            })
            .catch(error => {
                showLoading(false);
                showStatus('网络错误: ' + error.message, 'error');
            });
        }
        
        function openConfig() {
            // 通过API获取配置文件内容
            fetch('/api/config')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // 创建新窗口显示配置内容
                    const newWindow = window.open('', '_blank');
                    newWindow.document.write(`
                        <html>
                        <head>
                            <title>同步工具配置</title>
                            <style>
                                body { font-family: 'Segoe UI', sans-serif; margin: 20px; }
                                pre { background: #f5f5f5; padding: 15px; border-radius: 5px; overflow: auto; }
                                .note { color: #666; margin-top: 10px; }
                            </style>
                        </head>
                        <body>
                            <h2>同步工具配置文件 (config.json)</h2>
                            <pre>' + data.content + '</pre>
                            <div class="note">注意：要修改配置，请直接编辑项目目录下的 config.json 文件</div>
                        </body>
                        </html>
                    `);
                    showStatus('配置文件已在新窗口中打开', 'success');
                } else {
                    showStatus('无法读取配置文件: ' + data.message, 'error');
                }
            })
            .catch(error => {
                showStatus('获取配置失败: ' + error.message, 'error');
            });
        }
        
        // 页面加载完成后的初始化
        document.addEventListener('DOMContentLoaded', function() {
            showStatus('同步工具已就绪，请选择运行模式', 'success');
        });
    </script>
</body>
</html>
"@
                $buffer = [System.Text.Encoding]::UTF8.GetBytes($htmlContent)
                $response.ContentType = "text/html; charset=utf-8"
                $response.ContentLength64 = $buffer.Length
                $response.OutputStream.Write($buffer, 0, $buffer.Length)
            }
            "/api/sync" {
                if ($request.HttpMethod -eq "POST") {
                    # 读取请求体中的JSON数据
                    $requestBody = ""
                    if ($request.HasEntityBody) {
                        $reader = New-Object System.IO.StreamReader($request.InputStream)
                        $requestBody = $reader.ReadToEnd()
                        $reader.Close()
                    }
                    
                    # 解析JSON并提取模式参数
                    $mode = "once"  # 默认模式
                    if ($requestBody) {
                        try {
                            $jsonData = $requestBody | ConvertFrom-Json
                            if ($jsonData.mode) {
                                $mode = $jsonData.mode
                            }
                        } catch {
                            Write-Log "Error parsing JSON request body: $($_.Exception.Message)" "WARN"
                        }
                    }
                    
                    $result = Start-SyncProcess -Mode $mode
                    $jsonResponse = $result | ConvertTo-Json
                    $buffer = [System.Text.Encoding]::UTF8.GetBytes($jsonResponse)
                    $response.ContentType = "application/json; charset=utf-8"
                    $response.ContentLength64 = $buffer.Length
                    $response.OutputStream.Write($buffer, 0, $buffer.Length)
                } else {
                    $response.StatusCode = 405
                }
            }
            
            "/api/config" {
                if ($request.HttpMethod -eq "GET") {
                    $result = Get-ConfigContent
                    $jsonResponse = $result | ConvertTo-Json
                    $buffer = [System.Text.Encoding]::UTF8.GetBytes($jsonResponse)
                    $response.ContentType = "application/json; charset=utf-8"
                    $response.ContentLength64 = $buffer.Length
                    $response.OutputStream.Write($buffer, 0, $buffer.Length)
                } else {
                    $response.StatusCode = 405
                }
            }
            
            default {
                $response.StatusCode = 404
                $errorMsg = "Page not found"
                $buffer = [System.Text.Encoding]::UTF8.GetBytes($errorMsg)
                $response.ContentLength64 = $buffer.Length
                $response.OutputStream.Write($buffer, 0, $buffer.Length)
            }
        }
    } catch {
        Write-Log "Error handling request: $($_.Exception.Message)" "ERROR"
        try {
            $response.StatusCode = 500
            $errorMsg = "Internal server error"
            $buffer = [System.Text.Encoding]::UTF8.GetBytes($errorMsg)
            $response.ContentLength64 = $buffer.Length
            $response.OutputStream.Write($buffer, 0, $buffer.Length)
        } catch {
            Write-Log "Error sending error response: $($_.Exception.Message)" "ERROR"
        }
    } finally {
        try {
            $response.Close()
        } catch {
            Write-Log "Error closing response: $($_.Exception.Message)" "ERROR"
        }
    }
}

# Main server loop
try {
    $listener = New-Object System.Net.HttpListener
    $listener.Prefixes.Add("http://localhost:$Port/")
    $listener.Start()
    
    Write-Log "HTTP server started on port: $Port"
    Write-Log "Access URL: http://localhost:$Port"
    Write-Log "Press Ctrl+C to stop server"
    
    # Handle Ctrl+C gracefully
    $null = Register-ObjectEvent -InputObject ([System.Console]) -EventName CancelKeyPress -Action {
        Write-Log "Received stop signal, shutting down server..."
        $listener.Stop()
        $listener.Close()
        Write-Log "HTTP server stopped"
        exit 0
    }
    
    while ($listener.IsListening) {
        try {
            # Use async method with timeout to prevent blocking
            $contextTask = $listener.GetContextAsync()
            
            # Wait for request with timeout
            $timeout = 1000 # 1 second
            if ($contextTask.Wait($timeout)) {
                $context = $contextTask.Result
                Handle-Request $context
            }
            
            # Small delay to prevent high CPU usage
            Start-Sleep -Milliseconds 10
            
        } catch [System.ObjectDisposedException] {
            # Listener was disposed, exit gracefully
            break
        } catch {
            Write-Log "Error in server loop: $($_.Exception.Message)" "ERROR"
            Start-Sleep -Milliseconds 100
        }
    }
    
} catch {
    Write-Log "Server startup error: $($_.Exception.Message)" "ERROR"
    exit 1
} finally {
    if ($listener -and $listener.IsListening) {
        $listener.Stop()
        $listener.Close()
        Write-Log "HTTP server stopped"
    }
}