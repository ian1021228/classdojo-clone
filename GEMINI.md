# Agent Execution Guidelines & Security Policies

## 🔒 Permanent Terminal Execution Policy & DenyList

The agent MUST strictly follow the terminal execution policy and deny list across ALL conversations and tasks without exception:

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

### Strictly Forbidden Commands & Actions
The agent is explicitly prohibited from running, proposing, or scripting any command or sub-command containing:
1. `rm -rf`
2. `del /f /s /q`
3. `format`
4. `rmdir /s /q`
5. `rd /s /q`
6. `shutdown`
7. `reg delete`
8. `bcdedit`
9. `diskpart`

These restrictions are permanent, absolute, and must be adhered to in every turn and conversation.
