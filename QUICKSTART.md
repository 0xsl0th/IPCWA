# IPCWA Quickstart Guide

**"Situational Awareness Tool."**

## 1. Start the Infrastructure 
Open a terminal and run the "Active State Monitor". This will track your tunnels (Ligolo/Chisel) automatically.
```bash
# In ~/Code/IPCWA
python3 t2e_bridge.py --monitor
```

Open a second terminal to start the Visualization Engine.
```bash
# In ~/Code/IPCWA/ipcwa-web
npm run dev
```
> Access Dashboard at: http://localhost:3000

## 2. Capture Evidence (The Loop)
When you find something or run a critical command, use the T2E Bridge.
**Crucial:** Copy the command output to your clipboard BEFORE running this command!

```bash
# Basic Capture
python3 t2e_bridge.py "Nmap Scan" -c 10

# Capture WITH Clipboard Output (Required for Evidence Trap)
python3 t2e_bridge.py "Exploit Output" -c 5 -k
```
* `-c`: Number of history commands to grab.
* `-k`: Grabs current clipboard content (stdout).

## 3. Manage the Graph (The Story)
1. **Add Host**: Click "Add Host" in the Web UI.
2. **Link Evidence**: Select the host, then click the "Link" icon on new evidence items in the sidebar.
3. **Tag & Checklist**: Set the tag (Recon/Exploitation/Post-Exploitation) and follow the CPTS checklist detailed in the sidebar.
4. **CVSS**: If it's a vulnerability, use the built-in calculator to set the vector.

## 4. Generate Report (The Deliverable)
Click **"Generate Report"** in the top right.
This will produce a Markdown file with two distinct sections:
1. **Walkthrough**: The chronological story of your attack path (Timestamp-Based Path Replay).
2. **Findings**: The technical audit of vulnerabilities founded (CVSS-ranked).
