# Integrated Pivot-Chain and Walkthrough Architect (IPCWA)

### A "Force-Multiplier" for Offensive Security Workflow Orchestration.

## 🔍 Overview

IPCWA is a custom-built workflow orchestration tool designed to bridge the gap between **"Terminal Action"** and **"Narrative Reporting"** in complex, multi-segmented network engagements.

Unlike standard note-taking apps, IPCWA treats a penetration test as a **Graph Theory** problem, linking Evidence directly to Network Nodes and Tunnels to ensure technical continuity and prevent "Pivot Fatigue" during extended operations.

## ⚠️ The Problem

Operational fatigue during high-intensity engagements (such as Red Team operations or multi-day assessments) often leads to three primary failure modes:

1.  **Evidence Fragmentation:** Critical outputs are lost between terminal sessions, screenshots, and scattered text notes.
2.  **Pivot Fatigue:** Losing situational awareness of active tunnels and routes in deep, multi-hop networks.
3.  **Reporting Disconnect:** The inability to accurately reconstruct the chronological "Path of Least Resistance" for executive and technical reporting after the fact.

## 🛠️ The Solution: IPCWA

This application solves these problems via three core modules:

### 1. T2E (Terminal-to-Evidence) Bridge 🐍
* **Tech:** Python, Shell Integration
* **Function:** Acts as a "Flight Recorder" for the engagement.
* **Feature:** Captures **Command**, **Output (Clipboard)**, and **Screenshot** simultaneously in a single action.
* **Result:** Zero "re-hacking" required; evidence is immutable, structured, and timestamped.

### 2. Graph Visualization Engine 🕸️
* **Tech:** Next.js, React Flow
* **Function:** Visualizes the **"Attack Path"** in real-time using an infinite canvas.
* **Feature:** **Active Heartbeat Monitoring** for background pivots (Ligolo/Chisel) to visually indicate tunnel health.
* **Result:** Immediate visual feedback if a pivot tunnel drops or a route becomes unreachable.

### 3. Automated Commercial Reporting 📝
* **Tech:** Markdown Generation Algorithms
* **Function:** Decouples "Technical Findings" from the "Narrative."
* **Feature:** **Timestamp-Based Path Replay** automatically constructs a chronological walkthrough of the compromise.
* **Result:** Generates a commercial-grade report structure in seconds, significantly reducing post-engagement documentation time.

## 🚀 Quick Start

For the operational guide used during engagements, see [QUICKSTART.md](QUICKSTART.md).

## 💻 Tech Stack

* **Frontend:** Next.js, React Flow, Tailwind CSS
* **Backend/Scripting:** Python 3
* **Data:** JSON-based flat-file storage (for portability and speed)

---
*Disclaimer: This tool was developed as a "Portfolio of Competency" project demonstrating the application of software engineering principles to offensive security methodology.*
