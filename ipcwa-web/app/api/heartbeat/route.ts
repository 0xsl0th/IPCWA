import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
    try {
        const evidenceDir = path.join(process.cwd(), '..', 'evidence');
        const heartbeatFile = path.join(evidenceDir, 'heartbeat.json');

        if (!fs.existsSync(heartbeatFile)) {
            // Return default inactive state if file doesn't exist yet
            return NextResponse.json({ active_tunnels: [] });
        }

        const content = fs.readFileSync(heartbeatFile, 'utf-8');
        const data = JSON.parse(content);

        // Optional: Check timestamp freshness (e.g., if older than 30s, consider everything down)
        const lastUpdate = new Date(data.timestamp).getTime();
        const now = new Date().getTime();
        if (now - lastUpdate > 30000) {
            return NextResponse.json({ active_tunnels: [] });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error("Error reading heartbeat:", error);
        return NextResponse.json({ error: "Failed to read heartbeat" }, { status: 500 });
    }
}
