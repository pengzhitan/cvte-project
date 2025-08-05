' CVTE 自动同步工具启动器
' 此VBS脚本提供菜单选择并启动PowerShell同步工具

Dim objShell, scriptPath, psPath, choice
Set objShell = CreateObject("WScript.Shell")

' 获取脚本所在目录
scriptPath = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)
psPath = scriptPath & "\complete-sync.ps1"

' 显示菜单并获取用户选择
choice = InputBox("请选择运行模式:" & vbCrLf & vbCrLf & _
                  "1 - 持续监控模式 (每30秒自动同步)" & vbCrLf & _
                  "2 - 单次同步模式 (执行一次后退出)" & vbCrLf & _
                  "3 - 交互模式 (完整菜单)" & vbCrLf & vbCrLf & _
                  "请输入选项 (1-3):", "CVTE 自动同步工具", "1")

' 根据选择启动对应模式
Select Case choice
    Case "1"
        objShell.Run "powershell.exe -ExecutionPolicy Bypass -File """ & psPath & """ -Monitor", 1, False
    Case "2"
        objShell.Run "powershell.exe -ExecutionPolicy Bypass -File """ & psPath & """ -RunOnce", 1, False
    Case "3"
        objShell.Run "powershell.exe -ExecutionPolicy Bypass -File """ & psPath & """", 1, False
    Case Else
        MsgBox "已取消操作或选择无效", vbInformation, "CVTE 自动同步工具"
End Select

Set objShell = Nothing