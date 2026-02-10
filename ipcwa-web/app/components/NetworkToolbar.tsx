'use client';

import React from 'react';
import { Monitor, Square, Image as ImageIcon, Server, Globe, Shield } from 'lucide-react';

export const NetworkToolbar = () => {
    const onDragStart = (event: React.DragEvent, nodeType: string, payload?: any) => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        if (payload) {
            event.dataTransfer.setData('application/reactflow/payload', JSON.stringify(payload));
        }
        event.dataTransfer.effectAllowed = 'move';
    };

    return (
        <div className="bg-slate-800 border-r border-slate-700 p-4 flex flex-col gap-4 w-16 items-center shrink-0 z-10 shadow-xl">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 text-center">Tools</div>

            <div
                className="w-10 h-10 bg-slate-700 hover:bg-blue-600 rounded flex items-center justify-center cursor-grab active:cursor-grabbing transition-colors text-slate-300 hover:text-white"
                onDragStart={(event) => onDragStart(event, 'host')}
                draggable
                title="Host Node"
            >
                <Monitor className="w-5 h-5" />
            </div>

            <div
                className="w-10 h-10 bg-slate-700 hover:bg-emerald-600 rounded flex items-center justify-center cursor-grab active:cursor-grabbing transition-colors text-slate-300 hover:text-white"
                onDragStart={(event) => onDragStart(event, 'subnet')}
                draggable
                title="Subnet Container"
            >
                <Square className="w-5 h-5 border-dashed border-2 rounded border-current p-0.5" />
            </div>

            <div className="w-full h-px bg-slate-700 my-2"></div>

            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 text-center font-mono">Icons</div>

            <div
                className="w-8 h-8 hover:bg-slate-700 rounded flex items-center justify-center cursor-grab"
                onDragStart={(event) => onDragStart(event, 'icon', { type: 'server' })}
                draggable
                title="Server Icon"
            >
                <Server className="w-5 h-5 text-indigo-400" />
            </div>

            <div
                className="w-8 h-8 hover:bg-slate-700 rounded flex items-center justify-center cursor-grab"
                onDragStart={(event) => onDragStart(event, 'icon', { type: 'globe' })}
                draggable
                title="Internet Icon"
            >
                <Globe className="w-5 h-5 text-blue-400" />
            </div>

            <div
                className="w-8 h-8 hover:bg-slate-700 rounded flex items-center justify-center cursor-grab"
                onDragStart={(event) => onDragStart(event, 'icon', { type: 'files' })}
                draggable
                title="File Share Icon"
            >
                <ImageIcon className="w-5 h-5 text-yellow-400" />
            </div>

        </div>
    );
};
