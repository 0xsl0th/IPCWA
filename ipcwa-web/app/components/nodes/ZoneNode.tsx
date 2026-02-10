'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeResizer } from 'reactflow';

export const ZoneNode = memo(({ data, selected }: any) => {
    return (
        <>
            <NodeResizer minWidth={100} minHeight={100} isVisible={selected} lineClassName="border-blue-500" handleClassName="h-3 w-3 bg-white border-2 border-blue-500 rounded" />
            <div className="h-full w-full border-2 border-dashed border-slate-600 rounded-lg bg-slate-800/20 backdrop-blur-sm p-2 relative group transition-colors hover:border-slate-500">
                <div className="absolute -top-3 left-2 bg-slate-800 px-2 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    {data.label}
                </div>
                {/* Transparent content area for creating groups */}
            </div>
        </>
    );
});

ZoneNode.displayName = 'ZoneNode';
