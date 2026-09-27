# 全域終端機執行限制與禁止指令清單 (Terminal Execution Policy & DenyList)

```json
{
  "agent": {
    "terminalExecutionPolicy": "turbo",
    "denyList": [
      "rm -rf",
      "del /f /s /q",
      "format",
      "rmdir /s /q",
      "rd /s /q",
      "shutdown",
      "reg delete",
      "bcdedit",
      "diskpart"
    ]
  }
}
```

## 永久限制清單
在任何情況與對話中，嚴禁提出或執行包含以下危險指令的任何操作：
1. `rm -rf`
2. `del /f /s /q`
3. `format`
4. `rmdir /s /q`
5. `rd /s /q`
6. `shutdown`
7. `reg delete`
8. `bcdedit`
9. `diskpart`
