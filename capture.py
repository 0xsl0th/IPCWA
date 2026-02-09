import os
import subprocess
import platform
import datetime
import shutil

def get_shell_history(count=10):
    """
    Reads the last 'count' commands from the user's shell history file.
    Supports zsh (.zsh_history) and bash (.bash_history).
    """
    shell = os.environ.get('SHELL', '').split('/')[-1]
    home = os.path.expanduser('~')
    history_file = None

    if shell == 'zsh':
        history_file = os.path.join(home, '.zsh_history')
    elif shell == 'bash':
        history_file = os.path.join(home, '.bash_history')
    
    if not history_file or not os.path.exists(history_file):
        return [f"Error: Could not find history file for {shell}"]

    try:
        # Handling potential encoding errors
        with open(history_file, 'r', errors='replace') as f:
            lines = f.readlines()
            # zsh history format ": 1678900000:0;command" needs parsing
            # bash is just "command" usually
            
            clean_commands = []
            for line in reversed(lines):
                line = line.strip()
                if not line: continue
                
                if shell == 'zsh' and ';' in line:
                    parts = line.split(';', 1)
                    if len(parts) == 2:
                        command = parts[1]
                        clean_commands.append(command)
                    else:
                        clean_commands.append(line)
                else:
                    clean_commands.append(line)
                    
                if len(clean_commands) >= count:
                    break
            
            return list(reversed(clean_commands)) # Return in chronological order
            
    except Exception as e:
        return [f"Error reading history: {str(e)}"]

def get_clipboard_content():
    """
    Attempts to read text from the system clipboard.
    Supports macOS (pbpaste), Linux (xclip/xsel), and WSL/Windows.
    """
    system = platform.system()
    try:
        if system == "Darwin":
            return subprocess.check_output(["pbpaste"], text=True).strip()
        elif system == "Linux":
            # Try xclip then xsel
            try:
                return subprocess.check_output(["xclip", "-selection", "clipboard", "-o"], text=True).strip()
            except FileNotFoundError:
                try:
                    return subprocess.check_output(["xsel", "--clipboard", "--output"], text=True).strip()
                except FileNotFoundError:
                    return "" # tool not found
        # Add basic Windows/WSL support if needed, but keeping it simple for now
    except Exception as e:
        print(f"[!] Warning: Could not read clipboard: {e}")
        return ""
    return ""

def take_screenshot(output_path):
    """
    Takes a screenshot of the active screen/window.
    Uses 'screencapture' on macOS and 'scrot' on Linux.
    """
    system = platform.system()
    
    try:
        if system == 'Darwin':  # macOS
            # -x: mute sound, -m: main monitor (or active window with -w if we wanted)
            # User likely wants full context, maybe full screen is safer for now.
            subprocess.run(['screencapture', '-x', output_path], check=True)
            return True
        elif system == 'Linux':
            if shutil.which('scrot'):
                subprocess.run(['scrot', output_path], check=True)
                return True
            elif shutil.which('import'): # ImageMagick
                subprocess.run(['import', '-window', 'root', output_path], check=True)
                return True
            else:
                print("Error: neither 'scrot' nor 'import' found.")
                return False
        else:
            print(f"Error: Unsupported OS {system}")
            return False
    except Exception as e:
        print(f"Screenshot failed: {e}")
        return False
