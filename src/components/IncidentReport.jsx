import React, { useState, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { Link } from 'react-router-dom';
import ReactFlow, {
    Controls,
    Background,
    applyNodeChanges,
    applyEdgeChanges,
    addEdge,
    MiniMap,
    MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { FaFileAlt, FaUser, FaNetworkWired, FaServer, FaKey, FaTerminal, FaBolt, FaSkull, FaShieldAlt, FaCrosshairs, FaArrowLeft, FaRegClock } from 'react-icons/fa';

const EVENT_NODE_WIDTH = 380;
const EVENT_NODE_BASE_HEIGHT = 100; // For title and time
const ENTITY_NODE_WIDTH = 180;
const ENTITY_NODE_HEIGHT = 45;
const VERTICAL_GAP_EVENT = 150; // Increased gap between main events
const HORIZONTAL_OFFSET_ENTITY = EVENT_NODE_WIDTH / 2 + 40; // How far entities are from event center line
const VERTICAL_SPACING_ENTITY = 15;

// Styling for different node types - clean and professional
const NODE_STYLES = {
    EVENT: {
        background: '#ffffff',
        color: '#1f2937',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        width: EVENT_NODE_WIDTH,
        padding: '15px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
        fontSize: '13px',
    },
    ENTITY_BASE: {
        borderRadius: '6px',
        padding: '6px 10px',
        fontSize: '10px',
        color: '#ffffff',
        borderWidth: '1px',
        borderStyle: 'solid',
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
        height: ENTITY_NODE_HEIGHT,
        width: ENTITY_NODE_WIDTH,
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
        overflow: 'hidden',
    },
    USER: (label) => ({ ...NODE_STYLES.ENTITY_BASE, background: '#3b82f6', borderColor: '#1d4ed8', label: <><FaUser className="mr-1.5 flex-shrink-0" /> <span className="truncate" title={label}>{label}</span></> }),
    HOST: (label) => ({ ...NODE_STYLES.ENTITY_BASE, background: '#ef4444', borderColor: '#b91c1c', label: <><FaServer className="mr-1.5 flex-shrink-0" /> <span className="truncate" title={label}>{label}</span></> }),
    PROCESS: (label) => ({ ...NODE_STYLES.ENTITY_BASE, background: '#10b981', borderColor: '#047857', label: <><FaBolt className="mr-1.5 flex-shrink-0" /> <span className="truncate" title={label}>{label}</span></> }),
    FILE: (label) => ({ ...NODE_STYLES.ENTITY_BASE, background: '#8b5cf6', borderColor: '#6d28d9', label: <><FaFileAlt className="mr-1.5 flex-shrink-0" /> <span className="truncate" title={label}>{label}</span></> }),
    IP_ADDRESS: (label) => ({ ...NODE_STYLES.ENTITY_BASE, background: '#f97316', borderColor: '#c2410c', label: <><FaNetworkWired className="mr-1.5 flex-shrink-0" /> <span className="truncate" title={label}>{label}</span></> }),
    REG_KEY: (label) => ({ ...NODE_STYLES.ENTITY_BASE, background: '#eab308', borderColor: '#a16207', label: <><FaKey className="mr-1.5 flex-shrink-0" /> <span className="truncate" title={label}>{label}</span></> }),
    COMMAND: (label) => ({ ...NODE_STYLES.ENTITY_BASE, background: '#06b6d4', borderColor: '#0e7490', width: 240, label: <><FaTerminal className="mr-1.5 flex-shrink-0" /> <span className="truncate" title={label}>{label.substring(0,50)}{label.length>50?'...':''}</span></>}),
    DEFAULT_ENTITY: (label) => ({ ...NODE_STYLES.ENTITY_BASE, background: '#6b7280', borderColor: '#4b5563', label: <span className="truncate" title={label}>{label}</span> }),
};

const extractEntitiesFromEventText = (text) => {
    const entities = [];
    const patterns = {
        USER: /User `([^`]+)`/g,
        HOST: /host `([^`]+)`/g,
        IP_ADDRESS: /(\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}(?::[0-9]{1,5})?\b)/g,
        FILE: /(\b[A-Za-z]:\\[^\s:`*?"<>|(),]+(?:\.[a-zA-Z0-9]+)?\b)|(\b\/[^\s:`*?"<>|(),]+\b)/g,
        PROCESS: /(\b[a-zA-Z0-9_-]+\.exe\b)/g,
        REG_KEY: /(HK[LMU]{1,2}\\[^\s(),;:!"]+)/g,
        COMMAND: /(powershell\.exe|cmd\.exe)[^\n]*(?:\n(?!\s*[-*>]))*/ig, 
    };
    const addedValues = new Set();
    for (const type in patterns) {
        let match;
        while ((match = patterns[type].exec(text)) !== null) {
            const value = (type === 'FILE' ? (match[1] || match[2]) : match[1] || match[0]).trim();
            if (value.length < 4 && type !== 'USER' && type !== 'IP_ADDRESS') continue;
            if (addedValues.has(value + type)) continue; 
            entities.push({ type, value });
            addedValues.add(value + type);
        }
    }
    return entities.slice(0, 3); // Limit to 3 entities per sub-event node for even more clarity
};

const createTimelineFlow = (markdownContent) => {
    const nodes = [];
    const edges = [];
    let nodeIdCounter = 1;
    let yPosition = 80;
    let lastActionNodeId = null; 
    const xPositionMain = 350;
    const xOffsetEntity = EVENT_NODE_WIDTH / 2 + 30; // Place entities next to the action node

    const timelineSectionMatch = markdownContent.match(/## Timeline of Events([\s\S]*?)## Technical Analysis/);
    if (!timelineSectionMatch || !timelineSectionMatch[1]) return { nodes, edges };

    const timelineText = timelineSectionMatch[1];
    const mainEventBlocks = timelineText.trim().split(/\r?\n###\s+/); // Split by H3 Date sections

    mainEventBlocks.forEach(blockText => {
        if (!blockText.trim()) return;

        const lines = blockText.trim().split(/\r?\n/);
        // const dateTitle = lines[0]; // e.g., "May 17, 2025" - not used as a node for now
        const contentUnderDate = lines.slice(1).join('\n');

        // Split by H4 Event Groups (e.g., "#### Initial Compromise (15:16:40 UTC)")
        const eventGroupSections = contentUnderDate.trim().split(/\r?\n####\s+/).filter(s => s.trim());

        eventGroupSections.forEach(groupSection => {
            const groupLines = groupSection.trim().split(/\r?\n/);
            const groupTitleLine = groupLines[0];
            const groupContent = groupLines.slice(1).join('\n').trim();

            const groupTimestampMatch = groupTitleLine.match(/\(([^\)]+)\)/);
            const groupTimestampFallback = groupTimestampMatch ? groupTimestampMatch[1].trim() : 'N/A';
            const groupTitleForContext = groupTitleLine.replace(/\s*\(([^\)]+)\)/, '').trim();

            // Regex to find lines starting with "- **Action Title** [(timestamp)]"
            // This regex will try to capture each action block separately.
            const actionMatches = [...groupContent.matchAll(/^- \*\*([^*]+)\*\*(?:\s*\(([^\)]+)\))?([\s\S]*?)(?=\r?\n- \*\*|\r?\n####|$)/gm)];
            
            let currentGroupActions = [];
            if (actionMatches.length > 0) {
                currentGroupActions = actionMatches.map(match => ({
                    title: match[1].trim(),
                    timestamp: match[2] ? match[2].trim() : groupTimestampFallback,
                    details: match[3] ? match[3].trim().replace(/^- /gm, '  ').split(/\r?\n\r?\n/)[0] : '',
                }));
            } else if (groupTitleForContext) {
                // If no sub-actions, treat the H4 group itself as an action
                currentGroupActions.push({
                    title: groupTitleForContext,
                    timestamp: groupTimestampFallback,
                    details: groupContent.split(/\r?\n\r?\n/)[0],
                });
            }

            currentGroupActions.forEach(action => {
                const summary = action.details.substring(0, 160) + (action.details.length > 160 ? '...' : '');
                const actionNodeId = `action-${nodeIdCounter++}`;
                const actionNodeHeight = EVENT_NODE_BASE_HEIGHT + Math.max(0, Math.ceil(summary.length / 48) -1) * 16;

                nodes.push({
                    id: actionNodeId,
                    type: 'default',
                    position: { x: xPositionMain, y: yPosition },
                    data: { 
                        label: (
                            <div className="p-2.5 text-left">
                                <div className="flex items-center mb-1.5">
                                    <FaRegClock className="text-slate-400 mr-1.5 flex-shrink-0" size="0.75em" />
                                    <span className="text-2xs text-slate-500 font-medium tracking-wide">{action.timestamp}</span>
                                </div>
                                <h3 className="text-xs font-semibold text-slate-700 mb-1.5 leading-tight" title={action.title}>{action.title.length > 50 ? action.title.substring(0,47)+'...':action.title}</h3>
                                <p className="text-2xs text-slate-600 leading-snug overflow-y-auto" style={{maxHeight: '45px'}}>{summary}</p>
                            </div>
                        )
                    },
                    style: { ...NODE_STYLES.EVENT, height: actionNodeHeight, width: EVENT_NODE_WIDTH - 100 },
                });

                if (lastActionNodeId) {
                    edges.push({
                        id: `edge-${lastActionNodeId}-to-${actionNodeId}`,
                        source: lastActionNodeId,
                        target: actionNodeId,
                        type: 'smoothstep',
                        animated: true,
                        style: { stroke: '#e11d48', strokeWidth: 2, filter: 'drop-shadow(0 0 2px #e11d48)' },
                        markerEnd: { type: MarkerType.ArrowClosed, color: '#e11d48', width: 15, height: 15 },
                    });
                }
                lastActionNodeId = actionNodeId;

                const extractedEntities = extractEntitiesFromEventText(action.details);
                extractedEntities.forEach((entity, entityIdx) => {
                    const entityNodeId = `entity-${nodeIdCounter++}`;
                    const styleFn = NODE_STYLES[entity.type] || NODE_STYLES.DEFAULT_ENTITY;
                    const nodeStyle = styleFn(entity.value);
                    
                    // Position entities to the left and right, alternating
                    const entityX = xPositionMain + ((entityIdx % 2 === 0) ? -xOffsetEntity : xOffsetEntity );
                    // Stagger Y positions for entities to prevent direct overlap
                    let entityY = yPosition + (actionNodeHeight / 2) - (ENTITY_NODE_HEIGHT / 2);
                    if(extractedEntities.length > 1){
                        const staggerAmount = (ENTITY_NODE_HEIGHT + VERTICAL_SPACING_ENTITY) * 0.6;
                        entityY += (Math.floor(entityIdx/2)) * staggerAmount * ( (entityIdx%2 === 0) ? -1 : 1 ) - ( (extractedEntities.length % 2 === 0 && entityIdx >= extractedEntities.length -2) ? staggerAmount/2 : 0) ;
                    }

                    nodes.push({
                        id: entityNodeId,
                        data: { label: nodeStyle.label }, 
                        position: { x: entityX, y: entityY },
                        style: { ...nodeStyle, label: undefined },
                        type: 'default',
                    });
                    edges.push({
                        id: `edge-${actionNodeId}-to-${entityNodeId}`,
                        source: actionNodeId,
                        target: entityNodeId,
                        type: 'smoothstep',
                        style: { stroke: '#b0b8c5', strokeWidth: 1.2, opacity: 0.9 },
                        markerEnd: { type: MarkerType.ArrowClosed, color: '#b0b8c5', width:10, height:10 },
                    });
                });
                yPosition += actionNodeHeight + (VERTICAL_GAP_EVENT / 2); 
            });
        });
    });
    return { nodes, edges };
};

const IncidentReport = () => {
    const [markdown, setMarkdown] = useState('');
    const [nodes, setNodes] = useState([]);
    const [edges, setEdges] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const onNodesChange = useCallback((changes) => setNodes((nds) => applyNodeChanges(changes, nds)), []);
    const onEdgesChange = useCallback((changes) => setEdges((eds) => applyEdgeChanges(changes, eds)), []);
    const onConnect = useCallback((connection) => setEdges((eds) => addEdge({ 
        ...connection, 
        type: 'smoothstep',
        style: { stroke: '#9ca3af', strokeWidth: 1.5 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#9ca3af' }
    }, eds)), []);

    useEffect(() => {
        fetch('/incident/signal_analysis_2025_05_17_to_19.md')
            .then(res => {
                if (!res.ok) throw new Error(`Failed to load: ${res.status}`);
                return res.text();
            })
            .then(text => {
                setMarkdown(text);
                const { nodes: flowNodes, edges: flowEdges } = createTimelineFlow(text);
                setNodes(flowNodes);
                setEdges(flowEdges);
                setIsLoading(false);
            })
            .catch(err => {
                console.error("Error:", err);
                setError(err.message);
                setIsLoading(false);
            });
    }, []);

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="text-center p-8 border border-red-300 rounded-lg bg-red-100 shadow-md">
                    <FaSkull className="text-red-500 text-5xl mx-auto mb-4" />
                    <h2 className="text-red-700 text-xl font-semibold mb-2">SYSTEM ERROR</h2>
                    <p className="text-red-600 text-sm">Details: {error}</p>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <h2 className="text-gray-700 text-xl font-semibold mb-2">Analyzing Threat Data</h2>
                    <p className="text-gray-500 text-sm">Reconstructing attack patterns...</p>
                </div>
            </div>
        );
    }

    const sections = markdown.split('## Timeline of Events');
    const preTimelineContent = sections[0];
    const timelineEventsMarkdown = sections[1] ? sections[1].split('## Technical Analysis')[0] : '';
    const technicalAnalysisText = sections[1] ? sections[1].split('## Technical Analysis')[1]?.split('## MITRE ATT&CK Mapping')[0] : '';

    return (
        <div className="min-h-screen bg-gray-100 text-gray-800 font-sans">
            <style>{`
                body { font-family: 'Inter', sans-serif; background-color: #f3f4f6; /* gray-100 */ }
                .prose h1, .prose h2, .prose h3 {
                    font-family: 'Inter', sans-serif;
                    font-weight: 600;
                    color: #1f2937; 
                }
                .prose h1 { font-size: 1.875rem; margin-bottom: 1rem; }
                .prose h2 { font-size: 1.5rem; margin-top: 2rem; margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 1px solid #e5e7eb; }
                .prose h3 { font-size: 1.25rem; margin-top: 1.5rem; margin-bottom: 0.75rem; }
                .prose p, .prose li {
                    color: #4b5563; 
                    line-height: 1.65;
                }
                .prose strong { color: #111827; font-weight: 600; }
                .prose code { 
                    background-color: #e5e7eb; 
                    color: #be123c; /* rose-700 for code */
                    padding: 0.2em 0.4em;
                    margin: 0;
                    font-size: 0.85em;
                    border-radius: 4px;
                }
                .prose pre code { background-color: transparent; color: inherit; padding: 0; font-size: inherit; }
                .prose pre {
                    background-color: #f3f4f6; 
                    border: 1px solid #d1d5db; 
                    border-radius: 6px;
                    padding: 1em;
                    overflow-x: auto;
                }
                .react-flow__attribution { display: none; }
                .react-flow__controls {
                    background: white; border: 1px solid #e5e7eb; border-radius: 6px;
                    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
                }
                .react-flow__controls-button { background: white !important; border-color: #e5e7eb !important; fill: #6b7280 !important; }
                .react-flow__controls-button:hover { background: #f9fafb !important; }
                .react-flow__minimap { background: white !important; border: 1px solid #e5e7eb !important; border-radius: 6px !important; }
                 .react-flow__node:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 4px 10px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.05);
                }
            `}</style>

            {/* Header Section */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
                <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <div className="flex items-center">
                            <FaShieldAlt className="text-red-600 h-7 w-7 mr-2.5" />
                            <h1 className="text-xl font-semibold text-gray-800">Security Incident Timeline Analysis</h1>
                        </div>
                        <div className="flex items-center space-x-3">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                                Severity: CRITICAL
                            </span>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-800">
                                Priority: HIGH
                            </span>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-12 gap-6">
                    {/* Left Sidebar - Summary & Overview */}
                    <div className="col-span-12 lg:col-span-3 space-y-6">
                        <div className="bg-white shadow rounded-lg p-5">
                            <h2 className="text-base font-semibold text-gray-700 mb-3">Executive Summary</h2>
                            <div className="prose prose-sm max-w-none">
                                <ReactMarkdown>{preTimelineContent.split('## Executive Summary')[1]?.split('## Timeline of Events')[0] || preTimelineContent}</ReactMarkdown>
                            </div>
                        </div>
                        <div className="bg-white shadow rounded-lg p-5">
                            <h2 className="text-base font-semibold text-gray-700 mb-3">Incident Overview</h2>
                            <div className="space-y-1.5 text-xs">
                                <div className="flex justify-between py-1"><span>Date Range:</span><span className="font-medium text-gray-600">May 17-19, 2025</span></div>
                                <div className="flex justify-between py-1"><span>Target Host:</span><span className="font-medium text-gray-600 font-mono">EC2AMAZ-OSH4IUQ</span></div>
                                <div className="flex justify-between py-1"><span>User:</span><span className="font-medium text-gray-600 font-mono">jl.picard</span></div>
                                <div className="flex justify-between py-1"><span>Attack Vector:</span><span className="font-medium text-gray-600">ClickFix</span></div>
                                <div className="flex justify-between py-1"><span>C2:</span><span className="font-medium text-gray-600 font-mono">172.31.7.63:4444</span></div>
                            </div>
                        </div>
                        <div className="bg-white shadow rounded-lg p-5">
                             <h2 className="text-base font-semibold text-gray-700 mb-4 text-center">Risk Assessment</h2>
                            <div className="space-y-3">
                                <div className="text-center"><span className="text-xs text-gray-500">Severity</span><div className="mt-1 px-3 py-1.5 text-sm font-semibold text-red-700 bg-red-100 rounded-full inline-block">CRITICAL</div></div>
                                <div className="text-center"><span className="text-xs text-gray-500">Scope</span><div className="mt-1 px-3 py-1.5 text-sm font-semibold text-orange-700 bg-orange-100 rounded-full inline-block">HIGH</div></div>
                                <div className="text-center"><span className="text-xs text-gray-500">Impact</span><div className="mt-1 px-3 py-1.5 text-sm font-semibold text-orange-700 bg-orange-100 rounded-full inline-block">HIGH</div></div>
                                <div className="text-center"><span className="text-xs text-gray-500">Sophistication</span><div className="mt-1 px-3 py-1.5 text-sm font-semibold text-yellow-700 bg-yellow-100 rounded-full inline-block">HIGH</div></div>
                                <div className="mt-3 pt-3 border-t border-gray-200 text-center"><span className="text-xs text-gray-500">Overall Risk</span><div className="mt-1 px-4 py-2 text-base font-bold text-white bg-red-600 rounded-lg inline-block">CRITICAL</div></div>
                            </div>
                        </div>
                    </div>

                    {/* Right Side - Timeline Visualization */}
                    <div className="col-span-12 lg:col-span-9">
                        <div className="bg-white shadow rounded-lg">
                             <div className="p-5 border-b border-gray-200">
                                <h2 className="text-lg font-semibold text-gray-800 text-center">Attack Timeline Reconstruction</h2>
                            </div>
                            <div style={{ height: '1500px' }}> 
                                <ReactFlow
                                    nodes={nodes}
                                    edges={edges}
                                    onNodesChange={onNodesChange}
                                    onEdgesChange={onEdgesChange}
                                    onConnect={onConnect}
                                    fitView
                                    fitViewOptions={{ padding: 0.2, duration: 0 }}
                                    minZoom={0.1}
                                    maxZoom={1.8}
                                    defaultZoom={0.7}
                                >
                                    <Controls position="bottom-right" />
                                    <MiniMap position="bottom-left" nodeStrokeWidth={2} zoomable pannable nodeColor="#e5e7eb" maskColor="rgba(0,0,0,0.05)"/>
                                    <Background color="#e5e7eb" gap={24} size={0.8} />
                                </ReactFlow>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Full Timeline Text & Technical Analysis Text (Below the flow chart) */}
                {(timelineEventsMarkdown || technicalAnalysisText) && (
                    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                        {timelineEventsMarkdown && (
                            <div className="bg-white shadow rounded-lg p-6">
                                <div className="prose prose-sm max-w-none">
                                    <h2 className="text-lg font-semibold text-gray-800 mb-3">Detailed Timeline of Events</h2>
                                    <ReactMarkdown>{timelineEventsMarkdown}</ReactMarkdown>
                                </div>
                            </div>
                        )}
                        {technicalAnalysisText && (
                             <div className="bg-white shadow rounded-lg p-6">
                                <div className="prose prose-sm max-w-none">
                                    <h2 className="text-lg font-semibold text-gray-800 mb-3">Technical Analysis Details</h2>
                                    <ReactMarkdown>{technicalAnalysisText}</ReactMarkdown>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <footer className="text-center py-10 mt-8 border-t border-gray-200">
                    <Link 
                        to="/" 
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 hover:text-gray-800 rounded-md font-medium transition-colors duration-150 text-sm"
                    >
                        <FaArrowLeft />
                        Return to Main Dashboard
                    </Link>
                </footer>
            </main>
        </div>
    );
};

export default IncidentReport; 