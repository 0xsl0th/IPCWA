import argparse
import os
import sys
import json
import time
import datetime
import subprocess
from capture import take_screenshot
from bundle import create_bundle, save_bundle

def monitor_heartbeat(interval=5):
    """
     Continuously checks for active tunnel processes and writes status to heartbeat.json.
    """
    evidence_dir = "./evidence"
    if not os.path.exists(evidence_dir):
        os.makedirs(evidence_dir)
    
    heartbeat_file = os.path.join(evidence_dir, "heartbeat.json")
    # Processes to watch
    targets = ["ligolo", "chisel", "ssh", "proxychains", "nmap"]
    
    print(f"[*] Starting Heartbeat Monitor (Interval: {interval}s)")
    print(f"[*] Watching for: {', '.join(targets)}")
    
    try:
        while True:
            active_procs = []
            # Simple check using ps/pgrep logic
            # For cross-platform simplicity in Python, we can iterate /proc or use ps
            # Using 'ps -A' is generally safe on Mac/Linux
            try:
                # Get list of running process names
                ps_output = subprocess.check_output(["ps", "-A", "-o", "command"], text=True)
                for line in ps_output.splitlines():
                    for target in targets:
                        if target in line and "t2e_bridge.py" not in line and target not in active_procs:
                            # Avoid false positive of the grep/ps itself
                            active_procs.append(target)
            except Exception as e:
                print(f"[!] Error checking processes: {e}")

            heartbeat_data = {
                "timestamp": datetime.datetime.now().isoformat(),
                "active_tunnels": active_procs
            }
            
            with open(heartbeat_file, "w") as f:
                json.dump(heartbeat_data, f)
            
            time.sleep(interval)
    except KeyboardInterrupt:
        print("\n[*] Stopping Heartbeat Monitor.")

def main():
    parser = argparse.ArgumentParser(description="IPCWA T2E Bridge - Flight Recorder")
    
    # Subcommands? Or just flags. Let's stick to easy flags suitable for "hotkey" usage 
    # but allow a specific --monitor mode
    
    # Check if the first argument is "!log" and remove it if so
    if len(sys.argv) > 1 and sys.argv[1] == "!log":
        sys.argv.pop(1)

    parser.add_argument("description", nargs="?", default="Auto Capture", help="Description of the evidence captured")
    parser.add_argument("-c", "--count", type=int, default=10, help="Number of history commands to capture (default: 10)")
    parser.add_argument("-k", "--clipboard", action="store_true", help="Capture clipboard content as command output")
    parser.add_argument("--output", default="./evidence", help="Directory to save evidence bundles")
    parser.add_argument("--monitor", action="store_true", help="Start the active state heartbeat monitor")
    
    args = parser.parse_args()

    if args.monitor:
        monitor_heartbeat()
        return

    # Normal Capture Mode
    print(f"[*] Starting T2E Capture...")
    print(f"    - Description: {args.description}")
    print(f"    - Command History Count: {args.count}")
    
    # 1. Capture Screenshot
    print(f"[*] Taking screenshot...")
    screenshot_dir = os.path.join(args.output, "screenshots")
    if not os.path.exists(screenshot_dir):
        os.makedirs(screenshot_dir)
        
    screenshot_name = f"screen_{int(time.time())}.png"
    screenshot_path = os.path.join(screenshot_dir, screenshot_name)
    
    success = take_screenshot(screenshot_path)
    if success:
        print(f"    + Screenshot saved to {screenshot_path}")
    else:
        print(f"    ! Screenshot failed (continuing anyway)")
        screenshot_path = None

    # 2. Capture Clipboard (Optional)
    clipboard_content = ""
    if args.clipboard:
        print(f"[*] Capturing clipboard...")
        from capture import get_clipboard_content
        clipboard_content = get_clipboard_content()
        if len(clipboard_content) > 50:
            print(f"    + Captured {len(clipboard_content)} chars from clipboard.")
        else:
            print(f"    + Captured: {clipboard_content}")

    # 3. Bundle Evidence
    print(f"[*] Bundling evidence...")
    bundle = create_bundle(args.description, args.count, screenshot_path, clipboard_content)
    
    # 4. Save to Disk
    json_path = save_bundle(bundle, args.output)
    print(f"    + Evidence Bundle saved to {json_path}")
    print("[*] Capture Complete.")

if __name__ == "__main__":
    main()
