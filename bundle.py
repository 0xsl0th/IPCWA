import json
import os
import platform
import socket
import datetime
from capture import get_shell_history

def create_bundle(description, command_count, screenshot_path, clipboard_content=""):
    """
    Creates a dictionary representing the Evidence Bundle.
    """
    hostname = socket.gethostname()
    system = platform.system()
    user = os.environ.get("USER", "unknown")
    timestamp = datetime.datetime.now().isoformat()
    
    commands = get_shell_history(command_count)
    
    bundle = {
        "metadata": {
            "timestamp": timestamp,
            "hostname": hostname,
            "os": system,
            "user": user,
            "description": description
        },
        "captured_commands": commands,
        "command_output": clipboard_content,
        "screenshot_path": screenshot_path
    }
    return bundle

def save_bundle(bundle, output_dir):
    """
    Saves the bundle to a JSON file in the output directory.
    """
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        
    filename = f"evidence_{int(datetime.datetime.now().timestamp())}.json"
    filepath = os.path.join(output_dir, filename)
    
    with open(filepath, 'w') as f:
        json.dump(bundle, f, indent=4)
        
    return filepath
