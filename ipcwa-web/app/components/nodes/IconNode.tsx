'use client';

import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Server, Globe, Database, Cloud, FileJson, Image as ImageIcon } from 'lucide-react';

const icons: any = {
    server: Server,
    globe: Globe,
    database: Database,
    cloud: Cloud,
    files: ImageIcon
};

export const IconNode = memo(({ data, selected }: any) => {
    const Icon = icons[data.type] || Server;

    return (
        <div className="relative group flex flex-col items-center">
            <div className={`p-2 rounded-full transition-all ${selected ? 'bg-blue-500/20 ring-2 ring-blue-500' : 'hover:bg-slate-700/50'}`}>
                <Icon className="w-12 h-12 text-slate-400" />
            </div>

            <Handle type="target" position={Position.Top} className="opacity-0 group-hover:opacity-100 transition-opacity !bg-slate-400" />

            <div className="mt-2 text-center">
                <div className="font-bold text-sm text-slate-200 drop-shadow-md">{data.label}</div>
            </div>

            <Handle type="source" position={Position.Bottom} className="opacity-0 group-hover:opacity-100 transition-opacity !bg-slate-400" />
        </div>
    );
});

IconNode.displayName = 'IconNode';
