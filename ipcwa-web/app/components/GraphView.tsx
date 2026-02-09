'use client';

import { useState, useCallback, useEffect } from 'react';
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
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Plus, Terminal, Activity, FileJson, Download, Wifi } from 'lucide-react';
import clsx from 'clsx';
import { CPTS_MODULES, ModuleTag } from '../lib/cpts_data';
import CvssCalculator from './CvssCalculator';

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
    command_output?: string; // Phase 6 addition
}

const initialNodes: Node[] = [
    {
        id: '1',
        data: { label: 'Attacker Machine (Kali)' },
        position: { x: 50, y: 50 },
        type: 'input',
        style: { background: '#1e293b', color: '#fff', border: '1px solid #94a3b8', padding: '10px', borderRadius: '5px' },
    },
];

export default function GraphView() {
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [evidenceList, setEvidenceList] = useState<Evidence[]>([]);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [activeTunnels, setActiveTunnels] = useState<string[]>([]);

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
        }, 3000); // 3s polling
        return () => clearInterval(interval);
    }, []);

    // Update Edges based on Active Tunnels
    // Simplistic mapping: If "ligolo" is active, find edges labeled "ligolo" or just update all "Tunnel" edges
    // For this MVP, if ANY tunnel is active, we'll animate ALL edges to show "flow". 
    // In a real implementation, we'd map specific tunnel IDs.
    useEffect(() => {
        setEdges(eds => eds.map(e => {
            // If we have any active tunnel process, animate connection between Attacker (id 1) and others?
            // Or just update the heartbeat indicator.
            return e;
        }));
    }, [activeTunnels]);

    const onConnect: OnConnect = useCallback(
        (params) => setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: '#22c55e', strokeWidth: 2 } }, eds)),
        [setEdges],
    );

    const onEdgeClick = (_: any, edge: Edge) => {
        setEdges((eds) => eds.map((e) => {
            if (e.id === edge.id) {
                const matchesTunnel = activeTunnels.some(t => t.toLowerCase().includes('ligolo') || t.toLowerCase().includes('chisel'));
                const isUp = e.style?.stroke === '#22c55e';

                // Manual toggle still required if heartbeat doesn't map 1:1, but heartbeat can override
                return {
                    ...e,
                    animated: !isUp,
                    style: {
                        ...e.style,
                        stroke: isUp ? '#ef4444' : '#22c55e',
                        strokeDasharray: isUp ? '5,5' : undefined
                    },
                };
            }
            return e;
        }));
    };

    const addNode = () => {
        const id = (nodes.length + 1).toString();
        const newNode: Node = {
            id,
            data: { label: `Target Host ${id}`, evidence: [] },
            position: { x: Math.random() * 400 + 100, y: Math.random() * 400 + 100 },
            type: 'default',
            style: { background: '#334155', color: '#fff', border: '1px solid #cbd5e1', padding: '10px', borderRadius: '5px', width: 180 },
        };
        setNodes((nds) => nds.concat(newNode));
    };

    const onNodeClick = (_: any, node: Node) => {
        setSelectedNodeId(node.id);
    };

    const updateEvidence = async (filename: string, updates: Partial<Evidence>) => {
        setEvidenceList(prev => prev.map(e => e.filename === filename ? { ...e, ...updates } : e));

        setNodes(nds => nds.map(node => {
            if (!node.data.evidence) return node;
            const newEvidence = node.data.evidence.map((e: Evidence) => e.filename === filename ? { ...e, ...updates } : e);
            return { ...node, data: { ...node.data, evidence: newEvidence } };
        }));

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

    const linkEvidence = (evidence: Evidence) => {
        if (!selectedNodeId) return;

        setNodes((nds) => nds.map((node) => {
            if (node.id === selectedNodeId) {
                const currentEvidence = node.data.evidence || [];
                if (currentEvidence.find((e: Evidence) => e.filename === evidence.filename)) {
                    return node;
                }
                const newEvidence = [...currentEvidence, evidence];
                return {
                    ...node,
                    data: {
                        ...node.data,
                        evidence: newEvidence,
                        label: (
                            <div className="flex flex-col">
                                <span className="font-bold cursor-pointer">{typeof node.data.label === 'string' ? node.data.label : node.data.label.props.children[0].props.children}</span>
                                <span className="text-xs text-slate-300 mt-1 flex items-center gap-1">
                                    <FileJson className="w-3 h-3" /> {newEvidence.length} Evidence items
                                </span>
                            </div>
                        )
                    }
                };
            }
            return node;
        }));
    };

    // NARRATIVE GENERATION: Phase 6 Refinement - Timestamp-Based Path Replay
    const generateNarrativeReport = () => {
        const startNode = nodes.find(n => n.id === '1'); // Assuming 1 is Attacker
        if (!startNode) return;

        let report = `# Penetration Test Report\n\n`;
        report += `**Date**: ${new Date().toLocaleDateString()}  \n`;
        report += `**Status**: ${activeTunnels.length > 0 ? "Active Tunnels Detected (" + activeTunnels.join(', ') + ")" : "Assessment Complete"}\n\n`;

        report += `## Executive Summary\n`;
        report += `This report documents the penetration test conducted using IPCWA. It details the attack path taken and highlights critical vulnerabilities discovered.\n\n`;

        // --- PART 1: WALKTHROUGH (The Story) ---
        report += `## 1. Attack Path Walkthrough\n`;
        report += `> This section chronicles the chain of compromise in chronological order.\n\n`;

        // Sort nodes by the timestamp of their EARLIEST evidence
        const nodesWithEvidence = nodes.filter(n => n.data.evidence && n.data.evidence.length > 0);

        // If Attacker machine has no evidence but is start, include it first? 
        // Or just tell the story based on evidence. 
        // Let's include all nodes but sort them. Nodes without evidence go last or based on creation if tracked.
        // For simplicity: We will focus on nodes WITH evidence for the narrative, plus the start node.

        const sortedNodes = nodes.sort((a, b) => {
            if (a.id === '1') return -1; // Always start with attacker
            if (b.id === '1') return 1;

            const aEvidence = (a.data.evidence as Evidence[]) || [];
            const bEvidence = (b.data.evidence as Evidence[]) || [];

            if (aEvidence.length === 0) return 1; // Push to end
            if (bEvidence.length === 0) return -1;

            // Get earliest timestamp for A
            const aMin = Math.min(...aEvidence.map(e => new Date(e.metadata.timestamp).getTime()));
            const bMin = Math.min(...bEvidence.map(e => new Date(e.metadata.timestamp).getTime()));

            return aMin - bMin;
        });

        const traversalOrder = sortedNodes.map(n => n.id);

        traversalOrder.forEach((nodeId, index) => {
            const node = nodes.find(n => n.id === nodeId);
            if (!node) return;

            // Skip nodes without evidence unless it's the start node
            if (node.id !== '1' && (!node.data.evidence || node.data.evidence.length === 0)) return;

            const nodeLabel = typeof node.data.label === 'string'
                ? node.data.label
                : node.data.label.props.children[0].props.children;

            report += `### Step ${index + 1}: ${nodeLabel}\n`;

            if (index === 0) {
                report += `*Entry point of the assessment.*\n\n`;
            }

            const evidenceItems = (node.data.evidence || []) as Evidence[];
            if (evidenceItems.length > 0) {
                const sortedEvidence = [...evidenceItems].sort((a, b) => new Date(a.metadata.timestamp).getTime() - new Date(b.metadata.timestamp).getTime());

                sortedEvidence.forEach(e => {
                    report += `**Action**: ${e.metadata.description}\n`;
                    report += `\`${new Date(e.metadata.timestamp).toLocaleTimeString()}\`\n\n`;

                    // Display Command String AND Output (if available)
                    if (e.parsed.captured_commands && e.parsed.captured_commands.length > 0) {
                        report += `**Command Executed**:\n`;
                        report += `\`\`\`bash\n${e.parsed.captured_commands.join('\n')}\n\`\`\`\n`;
                    }

                    if (e.parsed.command_output) {
                        report += `**Command Output**:\n`;
                        report += `\`\`\`\n${e.parsed.command_output}\n\`\`\`\n`;
                    } else if (e.parsed.screenshot_path) {
                        report += `*(See attached screenshot for output: ${e.parsed.screenshot_path})*\n`;
                    }

                    report += `\n`;
                });
            } else if (node.id === '1') {
                report += `*Infrastructure initialized.*\n\n`;
            } else {
                report += `No specific evidence recorded for this hop.\n\n`;
            }

            if (index < traversalOrder.length - 1) {
                // Check if next node has evidence to see if it's a real step
                const nextNode = nodes.find(n => n.id === traversalOrder[index + 1]);
                if (nextNode && (nextNode.data.evidence?.length > 0))
                    report += `⬇ *Moving to next target...*\n\n`;
            }
        });

        // --- PART 2: FINDINGS (The Technical Details) ---
        report += `\n---\n\n## 2. Technical Findings\n`;
        report += `> Detailed analysis of identified vulnerabilities.\n\n`;

        const allEvidence = nodes.flatMap(n => n.data.evidence || []) as Evidence[];
        // Filter for items with CVSS or Exploit tags
        const vulnerabilities = allEvidence.filter(e => e.cvss || e.tag === 'Exploitation' || e.tag === 'Post-Exploitation');

        if (vulnerabilities.length === 0) {
            report += `No specific vulnerabilities with CVSS scores recorded.\n`;
        } else {
            vulnerabilities.forEach((v, i) => {
                report += `### 2.${i + 1} [${v.cvss ? "CVSS " + v.cvss : "Unscored"}] ${v.metadata.description}\n`;
                if (v.cvssVector) report += `**Vector**: \`${v.cvssVector}\`\n\n`;

                // Find host
                const hostNode = nodes.find(n => (n.data.evidence as Evidence[]).some(e => e.filename === v.filename));
                const hostName = hostNode ? (typeof hostNode.data.label === 'string' ? hostNode.data.label : hostNode.data.label.props.children[0].props.children) : "Unknown Host";

                report += `**Affected Asset**: ${hostName}\n`;
                report += `**Category**: ${v.tag}\n\n`;
                report += `**Description/Proof**:\nRefer to Step in Walkthrough for full execution details.\n\n`;
            });
        }

        const blob = new Blob([report], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `IPCWA_Exam_Report_${new Date().toISOString().split('T')[0]}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const selectedNode = nodes.find(n => n.id === selectedNodeId);

    const activeChecklists = selectedNode?.data.evidence
        ? Array.from(new Set((selectedNode.data.evidence as Evidence[]).map(e => e.tag))).filter(Boolean) as ModuleTag[]
        : [];

    return (
        <div className="flex h-screen w-screen bg-slate-900 text-white">
            {/* Sidebar */}
            <div className="w-80 border-r border-slate-700 p-4 flex flex-col gap-4 overflow-y-auto bg-slate-800 shrink-0">
                <h2 className="text-xl font-bold mb-2 flex items-center justify-between">
                    <span className="flex items-center gap-2"><Terminal className="w-5 h-5" /> Evidence</span>
                    {activeTunnels.length > 0 && (
                        <div className="flex items-center gap-1 text-[10px] text-green-400 bg-green-900/30 px-2 py-1 rounded border border-green-800 animate-pulse">
                            <Wifi className="w-3 h-3" />
                            <span>TUNNEL ACTIVE</span>
                        </div>
                    )}
                </h2>
                <div className="space-y-2 flex-1 overflow-y-auto min-h-[200px] max-h-[40vh]">
                    {evidenceList.length === 0 && <p className="text-slate-400 text-sm">No evidence found.</p>}
                    {evidenceList.map((file) => (
                        <div key={file.filename} className="bg-slate-700 p-3 rounded border border-slate-600">
                            <div
                                onClick={() => linkEvidence(file)}
                                className={clsx(
                                    "cursor-pointer hover:bg-slate-600 transition-colors p-1 -m-1 rounded mb-2",
                                    selectedNodeId ? "hover:border-blue-500 border border-transparent" : "opacity-50"
                                )}
                                title={selectedNodeId ? "Click to link to selected node" : "Select a node to link"}
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    <FileJson className="w-4 h-4 text-blue-400" />
                                    <span className="font-semibold text-sm truncate w-full">{file.metadata.description}</span>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2 mt-2 border-t border-slate-600 pt-2">
                                <div className="flex items-center gap-2">
                                    <label className="text-xs text-slate-400 w-8">Tag:</label>
                                    <select
                                        value={file.tag}
                                        onChange={(e) => updateEvidence(file.filename, { tag: e.target.value as ModuleTag })}
                                        className="bg-slate-800 text-xs text-white border border-slate-600 rounded px-1 py-0.5 w-full"
                                    >
                                        {Object.keys(CPTS_MODULES).map(tag => (
                                            <option key={tag} value={tag}>{tag}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* CVSS Calculator Integrated */}
                                <div className="mt-1">
                                    <CvssCalculator
                                        initialVector={file.cvssVector || file.cvss?.startsWith('CVSS') ? (file.cvssVector || file.cvss) : undefined}
                                        onChange={(score, vector) => updateEvidence(file.filename, { cvss: score, cvssVector: vector })}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-auto pt-4 border-t border-slate-700 flex-1 overflow-y-auto">
                    <h3 className="font-bold mb-2 text-sm text-slate-300">Selected Node Details</h3>
                    {selectedNode ? (
                        <div className="text-sm bg-slate-900 p-3 rounded border border-slate-700">
                            <div className="font-bold mb-1 text-lg">{selectedNode.id}</div>
                            <div className="text-slate-400 mb-2">Linked Evidence: {selectedNode.data.evidence?.length || 0}</div>

                            <div className="space-y-4 mt-4">
                                {activeChecklists.map(tag => (
                                    <div key={tag} className="border-t border-slate-700 pt-2">
                                        <h4 className="text-blue-400 font-bold text-xs uppercase mb-1">{CPTS_MODULES[tag].title}</h4>
                                        <ul className="space-y-1">
                                            {CPTS_MODULES[tag].checks.map((check, i) => (
                                                <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                                                    <input type="checkbox" className="mt-0.5 accent-blue-500" />
                                                    <span>{check}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="text-sm text-slate-500 italic">Select a node to view details or link evidence.</div>
                    )}
                </div>
            </div>

            {/* Graph Area */}
            <div className="flex-1 relative">
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onNodeClick={onNodeClick}
                    onEdgeClick={onEdgeClick}
                    fitView
                    className="bg-slate-900"
                >
                    <Background color="#475569" gap={20} />
                    <Controls className="bg-slate-700 border-slate-600 fill-white stroke-white text-white" />
                    <Panel position="top-right" className="flex flex-col gap-2 items-end">
                        <div className="flex gap-2">
                            <button
                                onClick={addNode}
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded shadow-lg transition-colors"
                            >
                                <Plus className="w-4 h-4" /> Add Host
                            </button>
                            <button
                                onClick={generateNarrativeReport}
                                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded shadow-lg transition-colors"
                            >
                                <Download className="w-4 h-4" /> Generate Report
                            </button>
                        </div>
                    </Panel>
                </ReactFlow>
            </div>
        </div>
    );
}
