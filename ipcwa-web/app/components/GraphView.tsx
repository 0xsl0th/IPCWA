'use client';

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import ReactFlow, {
    Controls,
    Background,
    applyNodeChanges,
    applyEdgeChanges,
    addEdge,
    Node,
    Edge,
    OnNodesChange,
    OnEdgesChange,
    OnConnect,
    Panel,
    useNodesState,
    useEdgesState,
    ReactFlowProvider,
    ConnectionMode,
    MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Terminal, FileJson, Share2, Shield, AlertTriangle, Download, Plus, Wifi, Monitor, Save } from 'lucide-react';
import clsx from 'clsx';
import { CPTS_MODULES, ModuleTag } from '../lib/cpts_data';
import CvssCalculator from './CvssCalculator';
import { NetworkToolbar } from './NetworkToolbar';
import { HostNode } from './nodes/HostNode';
import { SubnetNode } from './nodes/SubnetNode';
import { IconNode } from './nodes/IconNode';

interface Evidence {
    filename: string;
    metadata: {
        timestamp: string;
        description: string;
        user: string;
        hostname: string;
        os: string;
    };
    parsed: any;
    tag?: ModuleTag;
    cvss?: string;
    cvssVector?: string;
    command_output?: string;
}

const initialNodes: Node[] = [
    {
        id: '1',
        type: 'host',
        data: { label: 'Attacker Machine (Kali)', ip: '10.10.14.x' },
        position: { x: 50, y: 50 },
    },
];

const GraphContent = () => {
    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
    const [evidenceList, setEvidenceList] = useState<Evidence[]>([]);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [activeTunnels, setActiveTunnels] = useState<string[]>([]);

    const nodeTypes = useMemo(() => ({
        host: HostNode,
        subnet: SubnetNode,
        icon: IconNode
    }), []);

    // Fetch Evidence
    useEffect(() => {
        fetch('/api/evidence')
            .then(res => res.json())
            .then(data => {
                if (data.files) {
                    setEvidenceList(data.files.map((e: any) => ({
                        ...e,
                        tag: e.parsed.ipcwa_metadata?.tag || 'Recon',
                        cvss: e.parsed.ipcwa_metadata?.cvss || '',
                        cvssVector: e.parsed.ipcwa_metadata?.cvssVector || ''
                    })));
                }
            });
    }, []);

    // Heartbeat Polling
    useEffect(() => {
        const interval = setInterval(() => {
            fetch('/api/heartbeat')
                .then(res => res.json())
                .then(data => {
                    if (data.active_tunnels) {
                        setActiveTunnels(data.active_tunnels);
                    }
                })
                .catch(err => console.error(err));
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    // Update Edges based on Active Tunnels
    useEffect(() => {
        setEdges(eds => eds.map(e => {
            return e;
        }));
    }, [activeTunnels]);

    const onConnect: OnConnect = useCallback(
        (params) => setEdges((eds) => addEdge({ ...params, type: 'default', markerEnd: { type: MarkerType.ArrowClosed } }, eds)),
        [setEdges],
    );

    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback(
        (event: React.DragEvent) => {
            event.preventDefault();

            const type = event.dataTransfer.getData('application/reactflow');
            const payloadStr = event.dataTransfer.getData('application/reactflow/payload');
            const payload = payloadStr ? JSON.parse(payloadStr) : {};

            if (typeof type === 'undefined' || !type) {
                return;
            }

            const position = reactFlowInstance.screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });

            // Name mapping logic
            let label = `${type} ${nodes.length + 1}`;

            if (type === 'icon') {
                if (payload.type === 'globe') label = 'Internet';
                if (payload.type === 'server') label = 'Server';
                if (payload.type === 'files') label = 'File Share';
            } else if (type === 'host') {
                label = `Host ${nodes.length + 1}`;
                if (!payload.ip) {
                    payload.ip = `10.10.10.${nodes.length + 1}`;
                }
            } else if (type === 'subnet') {
                label = 'New Subnet';
            }

            // Z-Ordering: Subnets behind everything (-1), Hosts/Icons above (10)
            const zIndex = type === 'subnet' ? -1 : 10;

            const newNode: Node = {
                id: `${type}-${nodes.length + 1}-${Date.now()}`,
                type,
                position,
                zIndex,
                data: { label, ...payload },
                style: type === 'subnet' ? { width: 300, height: 200 } : undefined
            };

            setNodes((nds) => nds.concat(newNode));
        },
        [reactFlowInstance, nodes, setNodes],
    );

    const onNodeClick = useCallback((_: any, node: Node) => {
        setSelectedNodeId(node.id);
    }, []);

    const onPaneClick = useCallback(() => {
        setSelectedNodeId(null);
    }, []);

    const linkEvidence = (file: Evidence) => {
        if (!selectedNodeId) return;
        setNodes((nds) => nds.map((node) => {
            if (node.id === selectedNodeId) {
                const currentEvidence = node.data.evidence || [];
                if (currentEvidence.find((e: Evidence) => e.filename === file.filename)) return node;

                const newEvidence = [...currentEvidence, file];
                return {
                    ...node,
                    data: {
                        ...node.data,
                        evidence: newEvidence
                    }
                };
            }
            return node;
        }));
    };

    const updateEvidence = async (filename: string, updates: Partial<Evidence>) => {
        setEvidenceList(prev => prev.map(e => e.filename === filename ? { ...e, ...updates } : e));

        try {
            await fetch('/api/evidence/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filename, ...updates })
            });
        } catch (err) {
            console.error("Failed to update evidence", err);
        }
    };

    const generateNarrativeReport = () => {
        console.log("Generating report...");
        const report = `
# Engagement Report

**Generated by IPCWA**
**Date:** ${new Date().toISOString().split('T')[0]}

## Executive Summary
During this engagement, ${nodes.length} hosts were identified...

## Findings
${evidenceList.filter(e => e.cvss).map(e => `### ${e.metadata.description}\n**CVSS:** ${e.cvss}\n`).join('\n')}
         `;

        const blob = new Blob([report], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `IPCWA_Report_${Date.now()}.md`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const updateNodeLabel = (newLabel: string) => {
        if (!selectedNodeId) return;
        setNodes((nds) => nds.map((node) => {
            if (node.id === selectedNodeId) {
                return { ...node, data: { ...node.data, label: newLabel } };
            }
            return node;
        }));
    };

    const selectedNode = nodes.find(n => n.id === selectedNodeId);

    // Flexible label extraction
    const selectedNodeLabel = selectedNode
        ? (typeof selectedNode.data.label === 'string' ? selectedNode.data.label : 'Node')
        : '';

    const activeChecklists = selectedNode?.data.evidence
        ? Array.from(new Set((selectedNode.data.evidence as Evidence[]).map(e => e.tag))).filter(Boolean) as ModuleTag[]
        : [];

    return (
        <div className="flex h-screen w-screen bg-slate-950 text-slate-100 font-sans">
            <NetworkToolbar />

            {/* Sidebar */}
            <div className="w-[420px] border-r border-slate-800 flex flex-col bg-slate-900/95 backdrop-blur-sm shrink-0 shadow-xl z-10">
                {/* Header */}
                <div className="p-5 border-b border-slate-800/60 bg-slate-900 sticky top-0 z-20">
                    <h2 className="text-lg font-bold flex items-center justify-between text-slate-100">
                        <span className="flex items-center gap-2 tracking-tight">
                            <Terminal className="w-5 h-5 text-blue-500" />
                            Evidence Locker
                        </span>
                        {activeTunnels.length > 0 && (
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-800/60 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                                <Wifi className="w-3 h-3" />
                                <span>TUNNEL ACTIVE</span>
                            </div>
                        )}
                    </h2>
                </div>

                {/* Evidence List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px]">
                    {evidenceList.length === 0 && (
                        <div className="text-center py-10 text-slate-500 border-2 border-dashed border-slate-800 rounded-xl">
                            <p className="text-sm">No evidence captured yet.</p>
                            <p className="text-xs mt-1 text-slate-600">Run T2E Bridge to populate.</p>
                        </div>
                    )}

                    {evidenceList.map((file) => (
                        <div key={file.filename} className="bg-slate-800/40 hover:bg-slate-800/80 transition-all duration-200 p-4 rounded-xl border border-slate-700/50 hover:border-slate-600 group shadow-sm">
                            <div
                                onClick={() => linkEvidence(file)}
                                className={clsx(
                                    "cursor-pointer flex items-center gap-3 mb-3",
                                    selectedNodeId ? "text-blue-200 group-hover:text-blue-100" : "text-slate-400 opacity-70"
                                )}
                                title={selectedNodeId ? "Click to link to selected node" : "Select a node to link"}
                            >
                                <div className={clsx("p-2 rounded-lg", selectedNodeId ? "bg-blue-500/10 text-blue-400" : "bg-slate-700/50 text-slate-500")}>
                                    <FileJson className="w-5 h-5" />
                                </div>
                                <span className="font-medium text-sm truncate w-full">{file.metadata.description}</span>
                                {selectedNodeId && <div className="ml-auto text-xs bg-blue-600 text-white px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">Link</div>}
                            </div>

                            <div className="space-y-3 pt-3 border-t border-slate-700/50">
                                <div className="grid grid-cols-[auto_1fr] items-center gap-3">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tag</label>
                                    <select
                                        value={file.tag}
                                        onChange={(e) => updateEvidence(file.filename, { tag: e.target.value as ModuleTag })}
                                        className="bg-slate-900 text-xs text-slate-200 border border-slate-700 rounded-md px-2 py-1.5 w-full focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                                    >
                                        {Object.keys(CPTS_MODULES).map(tag => (
                                            <option key={tag} value={tag}>{tag}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* CVSS Calculator Integrated */}
                                <div className="bg-slate-900/50 rounded-lg p-2 border border-slate-800/50">
                                    <CvssCalculator
                                        initialVector={file.cvssVector || file.cvss?.startsWith('CVSS') ? (file.cvssVector || file.cvss) : undefined}
                                        onChange={(score, vector) => updateEvidence(file.filename, { cvss: score, cvssVector: vector })}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Selected Node Details - Bottom Panel */}
                <div className="h-[45%] border-t border-slate-800 bg-slate-900/90 flex flex-col shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.3)]">
                    <div className="p-4 border-b border-slate-800/60 sticky top-0 bg-slate-900/95 backdrop-blur z-10 flex items-center justify-between">
                        <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                            Target Controls
                        </h3>
                        {selectedNode && (
                            <span className="text-xs font-mono text-slate-500">{selectedNode.id}</span>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto p-5">
                        {selectedNode ? (
                            <div className="space-y-6">
                                <div>
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Target Name</label>
                                    <input
                                        type="text"
                                        value={selectedNodeLabel}
                                        onChange={(e) => updateNodeLabel(e.target.value)}
                                        className="bg-slate-800/50 text-white border border-slate-700 rounded-lg px-3 py-2 w-full focus:border-blue-500 focus:bg-slate-800 outline-none transition-all font-medium text-sm"
                                        placeholder="e.g. DC01, Web-Prod"
                                    />
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Methodology Checklists</label>
                                        <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">{selectedNode.data.evidence?.length || 0} Artifacts Linked</span>
                                    </div>

                                    <div className="space-y-4">
                                        {activeChecklists.length === 0 && (
                                            <p className="text-xs text-slate-600 italic border border-slate-800 rounded p-3 text-center">
                                                Link evidence with tags (Recon, Exploitation) to reveal methodology checklists.
                                            </p>
                                        )}
                                        {activeChecklists.map(tag => (
                                            <div key={tag} className="bg-slate-800/30 rounded-lg border border-slate-700/50 overflow-hidden">
                                                <div className="bg-slate-800/60 px-3 py-2 border-b border-slate-700/50">
                                                    <h4 className="text-blue-400 font-bold text-[11px] uppercase tracking-wide">{CPTS_MODULES[tag].title}</h4>
                                                </div>
                                                <ul className="p-3 space-y-2.5">
                                                    {CPTS_MODULES[tag].checks.map((check, i) => (
                                                        <li key={i} className="flex items-start gap-2.5 text-xs text-slate-300 hover:text-slate-100 transition-colors group">
                                                            <input type="checkbox" className="mt-0.5 w-3.5 h-3.5 rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-offset-slate-900 focus:ring-blue-500 cursor-pointer" />
                                                            <span className="leading-relaxed decoration-slate-600 group-hover:decoration-slate-400">{check}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-3 opacity-60">
                                <Monitor className="w-12 h-12 stroke-[1.5]" />
                                <p className="text-sm">Select a host in the graph to view details.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Graph Area */}
            <div className="flex-1 relative bg-slate-950" ref={reactFlowWrapper}>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onNodeClick={onNodeClick}
                    onPaneClick={onPaneClick}
                    nodeTypes={nodeTypes}
                    onInit={setReactFlowInstance}
                    onDrop={onDrop}
                    onDragOver={onDragOver}
                    connectionMode={ConnectionMode.Loose}
                    fitView
                    className="bg-slate-950"
                >
                    <Background color="#1e293b" gap={24} size={1} />
                    <Controls className="bg-slate-800 border-slate-700 fill-slate-300 stroke-slate-300 text-slate-300 rounded-lg overflow-hidden shadow-xl" />
                    <Panel position="top-right" className="flex flex-col gap-3 m-4">
                        <div className="flex gap-3">
                            <button
                                onClick={generateNarrativeReport}
                                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white px-5 py-2.5 rounded-lg shadow-lg shadow-emerald-900/20 transition-all font-medium text-sm border border-emerald-500/50"
                            >
                                <Download className="w-4 h-4" /> Generate Report
                            </button>
                        </div>
                    </Panel>
                </ReactFlow>
            </div>
        </div>
    );
};

export default function GraphView() {
    return (
        <ReactFlowProvider>
            <GraphContent />
        </ReactFlowProvider>
    );
}
