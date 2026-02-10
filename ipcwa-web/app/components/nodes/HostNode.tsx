'use client';

import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Monitor, Terminal } from 'lucide-react';
import clsx from 'clsx';

export const HostNode = memo(({ data, selected }: any) => {
    const isAttacker = data.label.includes('Attacker');

    return (
        <div className="relative flex flex-col items-center group transition-all">
            {/* Visual Container - Transparent by default, only ring on selection */}
            <div className={clsx(
                "p-2 rounded-lg transition-all duration-300",
                selected ? "bg-slate-800 shadow-[0_0_20px_rgba(59,130,246,0.3)] ring-1 ring-blue-500" : "bg-transparent"
            )}>
                {/* Icon */}
                <div className={clsx(
                    "transition-colors",
                    isAttacker ? "text-red-500" : "text-blue-400",
                    selected && !isAttacker && "!text-white"
                )}>
                    {isAttacker ? <Terminal className="w-10 h-10" /> : <Monitor className="w-10 h-10" />}
                </div>

                {/* Evidence Badge */}
                {data.evidence?.length > 0 && (
                    <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-slate-950 shadow-sm z-10">
                        {data.evidence.length}
                    </div>
                )}
            </div>

            {/* Label - Always visible below icon */}
            <div className="text-center mt-1">
                <div className="font-bold text-sm text-slate-200 drop-shadow-md">{data.label}</div>
                <div className="text-[10px] text-slate-500 font-mono tracking-wide">{data.ip}</div>
            </div>

            <Handle type="target" position={Position.Top} className="w-2 h-2 !bg-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            <Handle type="source" position={Position.Bottom} className="w-2 h-2 !bg-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
    );
});

HostNode.displayName = 'HostNode';
