export type ModuleTag = 'Recon' | 'Exploitation' | 'Post-Exploitation';

export const CPTS_MODULES: Record<ModuleTag, { title: string; checks: string[] }> = {
    'Recon': {
        title: 'Network Enumeration & Footprinting',
        checks: [
            'Run nmap -sC -sV -p- on target',
            'Check for standard web ports (80, 443, 8080)',
            'Run directory busting (gobuster/ffuf)',
            'Check for SMB shares (smbclient -L)',
            'Perform DNS enumeration if hostname known',
        ]
    },
    'Exploitation': {
        title: 'Exploitation & Initial Access',
        checks: [
            'Check for SQL Injection in login forms/parameters',
            'Test for LFI/RFI in file parameters',
            'Check for default credentials on services',
            'Search for public exploits (searchsploit) for identified services',
            'Attempt file upload bypass if upload feature exists'
        ]
    },
    'Post-Exploitation': {
        title: 'Pivoting & Privilege Escalation',
        checks: [
            'Check current user privileges (whoami /priv)',
            'Run LinPEAS/WinPEAS',
            'Check for internal network interfaces',
            'Set up tunneling (Ligolo-ng/Chisel) if internal network found',
            'Dump LSASS or check for stored credentials',
        ]
    }
};
