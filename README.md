# Integrated Pivot-Chain and Walkthrough Architect (IPCWA)

**A "Force-Multiplier" for Offensive Security Workflow Orchestration.**

## 🔍 Overview
IPCWA is a custom-built workflow orchestration tool designed to bridge the gap between "Terminal Action" and "Narrative Reporting" in high-stakes penetration testing environments (specifically targeted at the CPTS certification).

Unlike standard note-taking apps, IPCWA treats a penetration test as a **Graph Theory problem**, linking Evidence directly to Network Nodes and Tunnels to ensure technical continuity and prevent "Pivot Fatigue."

## ⚠️ The Problem
Research into high-attrition exams (like HTB CPTS) identifies three primary failure modes:
1.  **Evidence Fragmentation:** Critical outputs lost between terminal, screenshots, and notes.
2.  **Pivot Fatigue:** Losing situational awareness of active tunnels in multi-segment networks.
3.  **Reporting Disconnect:** Inability to reconstruct the chronological "Path of Least Resistance" for commercial-grade reporting.

## 🛠️ The Solution: IPCWA
This application solves these problems via three core modules:

### 1. T2E (Terminal-to-Evidence) Bridge 🐍
* **Tech:** Python, Shell Integration
* **Function:** Acts as a "Flight Recorder" for the exam.
* **Feature:** Captures Command, Output (Clipboard), and Screenshot simultaneously.
* **Result:** Zero "re-hacking" required; evidence is immutable and timestamped.

### 2. Graph Visualization Engine 🕸️
* **Tech:** Next.js, React Flow
* **Function:** Visualizes the "Attack Path" in real-time.
* **Feature:** **Active Heartbeat Monitoring** for Ligolo/Chisel tunnels.
* **Result:** Immediate visual feedback if a pivot tunnel drops.

### 3. Automated Commercial Reporting 📝
* **Tech:** Markdown Generation Algorithms
* **Function:** Decouples "Findings" from "Narrative."
* **Feature:** **Timestamp-Based Path Replay** generates a chronological walkthrough automatically.
* **Result:** Generates a 90+ page commercial-grade report structure in seconds.

## 🚀 Quick Start
For the operational guide used during engagements, see [QUICKSTART.md](./QUICKSTART.md).

## 💻 Tech Stack
* **Frontend:** Next.js, React Flow, Tailwind CSS
* **Backend/Scripting:** Python 3
* **Data:** JSON-based flat-file storage (for portability and speed)

---
*Disclaimer: This tool was developed as a "Portfolio of Competency" project demonstrating the application of software engineering principles to offensive security methodology.*
