'use client';

import React, { memo } from 'react';
import { NodeResizer } from 'reactflow';

export const SubnetNode = memo(({ data, selected }: any) => {
    return (
        <div
            className="group relative"
            style={{
                width: '100%',
                height: '100%',
                minWidth: '200px',
                minHeight: '200px'
            }}
        >
            <NodeResizer
                minWidth={200}
                minHeight={200}
                isVisible={selected}
                lineClassName="border-blue-500/50"
                handleClassName="h-3 w-3 bg-blue-500 border-2 border-white rounded"
            />

            {/* 
                Main Container 
                - width/height 100% to fill the node area defined by React Flow
                - pointer-events-none ensures clicks passed through to nodes behind/inside 
                - Border is CONSTANTLY visible 
                - bg-transparent to not hide grid/other nodes
            */}
            <div
                className="absolute inset-0 rounded-lg pointer-events-none"
                style={{
                    width: '100%',
                    height: '100%',
                    border: '2px solid rgba(0, 0, 0, 0.8)',
                    backgroundColor: selected ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
                    zIndex: -1, // Ensure the visual layer is behind content if possible, though React Flow handles node z-index
                }}
            >
                {/* 
                    Label 
                    - positioned top-left
                    - pointer-events-auto allows selecting the subnet by clicking the label 
                */}
                <div className="absolute -top-3 left-4 bg-slate-900 px-2 text-xs font-bold text-slate-300 uppercase tracking-widest pointer-events-auto select-none border border-slate-700 rounded">
                    {data.label}
                </div>
            </div>
        </div>
    );
});

SubnetNode.displayName = 'SubnetNode';
