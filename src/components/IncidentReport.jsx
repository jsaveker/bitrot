import React, { useState, useEffect, useCallback, useLayoutEffect } from 'react';
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
import { FaFileAlt, FaUser, FaNetworkWired, FaServer, FaKey, FaTerminal, FaBolt, FaSkull, FaShieldAlt, FaCrosshairs } from 'react-icons/fa';
import dagre from 'dagre';

const NODE_WIDTH_EVENT = 380;
const NODE_HEIGHT_EVENT_BASE = 140;
const NODE_WIDTH_ENTITY = 220;
const NODE_HEIGHT_ENTITY = 60;

const NODE_TYPE_STYLES = {
    EVENT_STAGE: {
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.95) 100%)',
        color: '#e2e8f0',
        border: '2px solid #f72585',
        borderRadius: '12px',
        boxShadow: `
            0 0 20px rgba(247, 37, 133, 0.8),
            0 0 40px rgba(247, 37, 133, 0.4),
            0 0 4px rgba(247, 37, 133, 0.9) inset,
            0 0 1px rgba(255, 255, 255, 0.3) inset
        `,
        padding: '18px',
        width: NODE_WIDTH_EVENT,
        textAlign: 'left',
        fontSize: '1rem',
        position: 'relative',
        overflow: 'hidden',
    },
    ENTITY_BASE: {
        borderRadius: '8px',
        padding: '8px 12px',
        fontSize: '0.75rem',
        color: 'white',
        borderWidth: '2px',
        borderStyle: 'solid',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        height: NODE_HEIGHT_ENTITY,
        width: NODE_WIDTH_ENTITY,
        whiteSpace: 'normal',
        wordBreak: 'break-word',
        justifyContent: 'flex-start',
        position: 'relative',
        overflow: 'hidden',
        fontWeight: '500',
    },
    USER: (label) => ({ 
        ...NODE_TYPE_STYLES.ENTITY_BASE, 
        background: 'linear-gradient(135deg, #3182CE 0%, #2B6CB0 100%)', 
        borderColor: '#60A5FA',
        boxShadow: '0 0 15px rgba(96, 165, 250, 0.6), 0 0 3px rgba(96, 165, 250, 0.8) inset',
        label: <><FaUser className="mr-1 flex-shrink-0 text-blue-200" /> <span className="truncate font-semibold" title={label}>{label}</span></>
    }),
    HOST: (label) => ({ 
        ...NODE_TYPE_STYLES.ENTITY_BASE, 
        background: 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)', 
        borderColor: '#F87171',
        boxShadow: '0 0 15px rgba(248, 113, 113, 0.6), 0 0 3px rgba(248, 113, 113, 0.8) inset',
        label: <><FaServer className="mr-1 flex-shrink-0 text-red-200" /> <span className="truncate font-semibold" title={label}>{label}</span></>
    }),
    PROCESS: (label) => ({ 
        ...NODE_TYPE_STYLES.ENTITY_BASE, 
        background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', 
        borderColor: '#34D399',
        boxShadow: '0 0 15px rgba(52, 211, 153, 0.6), 0 0 3px rgba(52, 211, 153, 0.8) inset',
        label: <><FaBolt className="mr-1 flex-shrink-0 text-green-200" /> <span className="truncate font-semibold" title={label}>{label}</span></>
    }),
    FILE: (label) => ({ 
        ...NODE_TYPE_STYLES.ENTITY_BASE, 
        background: 'linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)', 
        borderColor: '#A78BFA',
        boxShadow: '0 0 15px rgba(167, 139, 250, 0.6), 0 0 3px rgba(167, 139, 250, 0.8) inset',
        label: <><FaFileAlt className="mr-1 flex-shrink-0 text-purple-200" /> <span className="truncate font-semibold" title={label}>{label}</span></>
    }),
    IP_ADDRESS: (label) => ({ 
        ...NODE_TYPE_STYLES.ENTITY_BASE, 
        background: 'linear-gradient(135deg, #EA580C 0%, #C2410C 100%)', 
        borderColor: '#FB923C',
        boxShadow: '0 0 15px rgba(251, 146, 60, 0.6), 0 0 3px rgba(251, 146, 60, 0.8) inset',
        label: <><FaNetworkWired className="mr-1 flex-shrink-0 text-orange-200" /> <span className="truncate font-semibold" title={label}>{label}</span></>
    }),
    REG_KEY: (label) => ({ 
        ...NODE_TYPE_STYLES.ENTITY_BASE, 
        background: 'linear-gradient(135deg, #CA8A04 0%, #A16207 100%)', 
        borderColor: '#FDE047',
        boxShadow: '0 0 15px rgba(253, 224, 71, 0.6), 0 0 3px rgba(253, 224, 71, 0.8) inset',
        label: <><FaKey className="mr-1 flex-shrink-0 text-yellow-200" /> <span className="truncate font-semibold" title={label}>{label}</span></>
    }),
    COMMAND: (label) => ({ 
        ...NODE_TYPE_STYLES.ENTITY_BASE, 
        background: 'linear-gradient(135deg, #0891B2 0%, #0E7490 100%)', 
        borderColor: '#22D3EE',
        boxShadow: '0 0 15px rgba(34, 211, 238, 0.6), 0 0 3px rgba(34, 211, 238, 0.8) inset',
        width: 300, 
        label: <><FaTerminal className="mr-1 flex-shrink-0 text-cyan-200" /> <span className="truncate font-semibold" title={label}>{label.substring(0, 65)}{label.length > 65 ? '...' : ''}</span></>
    }),
    DEFAULT_ENTITY: (label) => ({ 
        ...NODE_TYPE_STYLES.ENTITY_BASE, 
        background: 'linear-gradient(135deg, #4B5563 0%, #374151 100%)', 
        borderColor: '#9CA3AF',
        boxShadow: '0 0 10px rgba(156, 163, 175, 0.4), 0 0 2px rgba(156, 163, 175, 0.6) inset',
        label: <span className="truncate font-semibold" title={label}>{label}</span>
    }),
};

const extractEntities = (textBlock) => {
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
        while ((match = patterns[type].exec(textBlock)) !== null) {
            const value = (type === 'FILE' ? (match[1] || match[2]) : match[1] || match[0]).trim();
            if (value.length < 4 && type !== 'USER' && type !== 'IP_ADDRESS') continue;
            if (addedValues.has(value + type)) continue;
            
            entities.push({ type, value });
            addedValues.add(value + type);
        }
    }
    return entities;
};

const getLayoutedElements = (nodes, edges, direction = 'TB') => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    dagreGraph.setGraph({ rankdir: direction, nodesep: 80, ranksep: 100 });

    nodes.forEach((node) => {
        dagreGraph.setNode(node.id, { 
            width: node.style?.width || NODE_WIDTH_ENTITY, 
            height: node.style?.height || NODE_HEIGHT_ENTITY 
        });
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    return nodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        return { ...node, position: { x: nodeWithPosition.x - node.style.width / 2, y: nodeWithPosition.y - node.style.height / 2 } };
    });
};

const parseTimelineToFlow = (markdownContent) => {
    const rfNodes = [];
    const rfEdges = [];
    let nodeIdCounter = 1;
    let lastEventStageNodeId = null;

    const timelineSectionMatch = markdownContent.match(/### May 17, 2025([\s\S]*?)### May 18-19, 2025/);

    if (timelineSectionMatch && timelineSectionMatch[1]) {
        const may17EventsText = timelineSectionMatch[1];
        const eventBlocks = may17EventsText.trim().split(/\r?\n#### /);

        eventBlocks.forEach((eventBlockText, index) => {
            if (!eventBlockText.trim()) return;
            const currentEventBlock = index === 0 && !eventBlockText.startsWith('####') && eventBlocks.length > 1 ? eventBlockText : eventBlockText;
            const lines = currentEventBlock.trim().split(/\r?\n/);
            const titleLine = lines[0].replace(/^####\s*/, '');
            const detailsFull = lines.slice(1).join('\n').trim();
            const summaryText = detailsFull.substring(0, 200) + (detailsFull.length > 200 ? '...' : '');

            const titleMatch = titleLine.match(/^([^\(]+)\(([^\)]+)\)/);
            let eventTitle = titleLine;
            let eventTime = '';
            if (titleMatch) {
                eventTitle = titleMatch[1].trim();
                try {
                    eventTime = new Date(Date.UTC(2025, 4, 17, ...titleMatch[2].match(/(\d+)/g).map(Number)))
                                .toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'UTC' });
                } catch (e) { console.warn("Error parsing time:", titleMatch[2], e); }
            }

            const eventStageNodeId = `event-stage-${nodeIdCounter++}`;
            const eventNodeHeight = NODE_HEIGHT_EVENT_BASE + Math.max(0, Math.ceil(summaryText.length / 40) - 2) * 20;

            rfNodes.push({
                id: eventStageNodeId,
                data: { label: (<div><strong>{eventTitle}</strong><br/><span className="text-xs text-gray-400 mt-1">{eventTime}</span><hr className="my-2 border-cyberpunk-accent/40"/><p className="text-sm font-normal whitespace-pre-wrap" style={{maxHeight: '100px', overflowY: 'auto'}}>{summaryText}</p></div>) },
                style: { ...NODE_TYPE_STYLES.EVENT_STAGE, height: eventNodeHeight },
                type: 'default',
            });

            const extractedEntities = extractEntities(detailsFull);
            extractedEntities.forEach((entity) => {
                const entityNodeId = `entity-${nodeIdCounter++}`;
                const styleFn = NODE_TYPE_STYLES[entity.type] || NODE_TYPE_STYLES.DEFAULT_ENTITY;
                const nodeStyle = styleFn(entity.value);
                rfNodes.push({
                    id: entityNodeId,
                    data: { label: nodeStyle.label }, 
                    style: { ...nodeStyle, label: undefined, width: nodeStyle.width || NODE_WIDTH_ENTITY, height: nodeStyle.height || NODE_HEIGHT_ENTITY },
                    type: 'default',
                });
                rfEdges.push({
                    id: `edge-${eventStageNodeId}-to-${entityNodeId}`,
                    source: eventStageNodeId,
                    target: entityNodeId,
                    type: 'smoothstep',
                    style: { stroke: '#667292', strokeWidth: 1.5, opacity: 0.9 },
                    markerEnd: { type: MarkerType.ArrowClosed, width: 15, height: 15, color: '#667292' },
                });
            });

            if (lastEventStageNodeId) {
                rfEdges.push({
                    id: `edge-event-${lastEventStageNodeId}-to-${eventStageNodeId}`,
                    source: lastEventStageNodeId,
                    target: eventStageNodeId,
                    type: 'smoothstep',
                    animated: true,
                    style: { stroke: '#f72585', strokeWidth: 3, filter: 'drop-shadow(0 0 4px #f72585)' },
                    markerEnd: { type: MarkerType.ArrowClosed, color: '#f72585', width: 20, height: 20 },
                });
            }
            lastEventStageNodeId = eventStageNodeId;
        });
    }

    // Simplified May 18-19 section
    const may1819SectionMatch = markdownContent.match(/### May 18-19, 2025([\s\S]*?)## Technical Analysis/s);
    if (may1819SectionMatch && may1819SectionMatch[1] && lastEventStageNodeId) {
        const detailsFull = may1819SectionMatch[1].trim().replace(/^- /gm, '');
        const summaryText = detailsFull.substring(0, 200) + (detailsFull.length > 200 ? '...' : '');
        const eventStageNodeId = `event-stage-${nodeIdCounter++}`;
        const eventNodeHeight = NODE_HEIGHT_EVENT_BASE + Math.max(0, Math.ceil(summaryText.length / 40) - 2) * 20;

        rfNodes.push({
            id: eventStageNodeId,
            data: { label: (<div><strong>Continued Activity (May 18-19)</strong><hr className="my-2 border-cyberpunk-accent/40"/><p className="text-sm font-normal whitespace-pre-wrap" style={{maxHeight: '100px', overflowY: 'auto'}}>{summaryText}</p></div>) },
            style: { ...NODE_TYPE_STYLES.EVENT_STAGE, height: eventNodeHeight },
            type: 'default',
        });
        const extractedEntities = extractEntities(detailsFull);
        extractedEntities.forEach((entity) => {
            const entityNodeId = `entity-${nodeIdCounter++}`;
            const styleFn = NODE_TYPE_STYLES[entity.type] || NODE_TYPE_STYLES.DEFAULT_ENTITY;
            const nodeStyle = styleFn(entity.value);
            rfNodes.push({
                id: entityNodeId,
                data: { label: nodeStyle.label }, 
                style: { ...nodeStyle, label: undefined, width: nodeStyle.width || NODE_WIDTH_ENTITY, height: nodeStyle.height || NODE_HEIGHT_ENTITY },
                type: 'default',
            });
            rfEdges.push({
                id: `edge-${eventStageNodeId}-to-${entityNodeId}`,
                source: eventStageNodeId,
                target: entityNodeId,
                type: 'smoothstep',
                style: { stroke: '#667292', strokeWidth: 1.5, opacity: 0.9 },
                markerEnd: { type: MarkerType.ArrowClosed, width: 15, height: 15, color: '#667292' },
            });
        });
        rfEdges.push({
            id: `edge-event-${lastEventStageNodeId}-to-${eventStageNodeId}`,
            source: lastEventStageNodeId,
            target: eventStageNodeId,
            type: 'smoothstep',
            animated: true,
            style: { stroke: '#f72585', strokeWidth: 3, filter: 'drop-shadow(0 0 4px #f72585)' },
            markerEnd: { type: MarkerType.ArrowClosed, color: '#f72585', width: 20, height: 20 },
        });
    }
    return { nodes: rfNodes, edges: rfEdges };
};

const IncidentReport = () => {
    const [markdown, setMarkdown] = useState('');
    const [layoutedNodes, setLayoutedNodes] = useState([]);
    const [layoutedEdges, setLayoutedEdges] = useState([]);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const onNodesChange = useCallback((changes) => setLayoutedNodes((nds) => applyNodeChanges(changes, nds)), []);
    const onEdgesChange = useCallback((changes) => setLayoutedEdges((eds) => applyEdgeChanges(changes, eds)), []);
    const onConnect = useCallback((connection) => setLayoutedEdges((eds) => addEdge({ 
        ...connection, 
        type: 'smoothstep', 
        style: { stroke: '#7dd3fc', strokeWidth: 2, filter: 'drop-shadow(0 0 3px #7dd3fc)' }, 
        markerEnd: { type: MarkerType.ArrowClosed, color: '#7dd3fc', width: 18, height: 18 } 
    }, eds)), []);

    useLayoutEffect(() => {
        if (markdown && !error) {
            const { nodes: parsedNodes, edges: parsedEdges } = parseTimelineToFlow(markdown);
            if (parsedNodes.length > 0) {
                const laidoutNodes = getLayoutedElements(parsedNodes, parsedEdges, 'TB');
                setLayoutedNodes(laidoutNodes);
                setLayoutedEdges(parsedEdges);
                setIsLoading(false);
            }
        }
    }, [markdown, error]);

    useEffect(() => {
        fetch('/incident/signal_analysis_2025_05_17_to_19.md')
            .then(res => {
                if (!res.ok) throw new Error(`Failed to load incident report: ${res.status}`);
                return res.text();
            })
            .then(text => {
                setMarkdown(text);
                setTimeout(() => setIsLoading(false), 800); // Simulate loading time for effect
            })
            .catch(err => {
                console.error("Error fetching incident report:", err);
                setError(err.message);
                setIsLoading(false);
            });
    }, []);

    if (error) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-center p-8 border-2 border-red-500 rounded-lg bg-red-900/20 backdrop-blur-sm">
                    <FaSkull className="text-red-500 text-6xl mx-auto mb-4 animate-pulse" />
                    <h2 className="text-red-400 text-2xl font-['Orbitron'] mb-2">SYSTEM BREACH DETECTED</h2>
                    <p className="text-red-300 font-mono">Error: {error}</p>
                </div>
            </div>
        );
    }

    if (isLoading || !layoutedNodes.length) { 
        return (
            <div className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden">
                {/* Animated background grid */}
                <div className="absolute inset-0 opacity-20">
                    <div className="grid-animation"></div>
                </div>
                
                {/* Matrix rain effect */}
                <div className="matrix-rain absolute inset-0 opacity-30"></div>
                
                <div className="text-center z-10">
                    <div className="mb-8">
                        <FaCrosshairs className="text-cyberpunk-accent text-8xl mx-auto animate-spin" style={{ animationDuration: '3s' }} />
                    </div>
                    <h2 className="text-cyberpunk-accent text-3xl font-['Orbitron'] mb-4 glitch-text">
                        ANALYZING THREAT VECTORS
                    </h2>
                    <div className="flex justify-center space-x-2 mb-4">
                        {[...Array(5)].map((_, i) => (
                            <div 
                                key={i}
                                className="w-3 h-3 bg-cyberpunk-secondary rounded-full animate-pulse"
                                style={{ animationDelay: `${i * 0.2}s` }}
                            ></div>
                        ))}
                    </div>
                    <p className="text-cyberpunk-secondary font-mono text-lg typewriter">
                        Deconstructing timeline from signal fragments...
                    </p>
                </div>
            </div>
        );
    }

    const sections = markdown.split('## Timeline of Events');
    const preTimelineContent = sections[0];
    let technicalAnalysisAndBeyond = '';
    if (sections.length > 1 && sections[1].includes('## Technical Analysis')) {
        technicalAnalysisAndBeyond = `## Technical Analysis${sections[1].split('## Technical Analysis')[1]}`;
    } else if (sections.length > 1) {
        technicalAnalysisAndBeyond = sections[1];
    }

    return (
        <div className="bg-black text-cyberpunk-primary min-h-screen relative overflow-hidden">
            {/* Enhanced CSS Styles */}
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Hack:wght@400;700&display=swap');
                
                /* Cyberpunk animations and effects */
                @keyframes glitch {
                    0%, 100% { transform: translateX(0); }
                    20% { transform: translateX(-2px); }
                    40% { transform: translateX(-1px); }
                    60% { transform: translateX(1px); }
                    80% { transform: translateX(1px); }
                }
                
                @keyframes matrix-fall {
                    0% { transform: translateY(-100vh); opacity: 1; }
                    100% { transform: translateY(100vh); opacity: 0; }
                }
                
                @keyframes grid-pulse {
                    0%, 100% { opacity: 0.1; }
                    50% { opacity: 0.3; }
                }
                
                @keyframes typewriter {
                    from { width: 0; }
                    to { width: 100%; }
                }
                
                @keyframes breath {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.02); }
                }
                
                @keyframes scanlines {
                    0% { transform: translateY(-100%); }
                    100% { transform: translateY(100vh); }
                }
                
                .glitch-text {
                    animation: glitch 0.3s infinite;
                    text-shadow: 
                        0 0 10px #f72585,
                        0 0 20px #f72585,
                        0 0 30px #f72585;
                }
                
                .typewriter {
                    overflow: hidden;
                    white-space: nowrap;
                    border-right: 2px solid #f72585;
                    animation: typewriter 3s steps(40, end), blink-caret 0.75s step-end infinite;
                }
                
                @keyframes blink-caret {
                    from, to { border-color: transparent; }
                    50% { border-color: #f72585; }
                }
                
                .matrix-rain {
                    background: linear-gradient(0deg, transparent 24%, rgba(32, 194, 14, 0.05) 25%, rgba(32, 194, 14, 0.05) 26%, transparent 27%, transparent 74%, rgba(32, 194, 14, 0.05) 75%, rgba(32, 194, 14, 0.05) 76%, transparent 77%, transparent);
                    background-size: 12px 12px;
                    animation: matrix-fall 10s linear infinite;
                }
                
                .grid-animation {
                    background-image: 
                        linear-gradient(rgba(247, 37, 133, 0.2) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(247, 37, 133, 0.2) 1px, transparent 1px);
                    background-size: 50px 50px;
                    animation: grid-pulse 4s ease-in-out infinite;
                }
                
                .cyber-header {
                    background: linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.9) 100%);
                    border: 2px solid #f72585;
                    box-shadow: 
                        0 0 30px rgba(247, 37, 133, 0.8),
                        0 0 60px rgba(247, 37, 133, 0.4),
                        inset 0 0 20px rgba(247, 37, 133, 0.2);
                    position: relative;
                    overflow: hidden;
                }
                
                .cyber-header::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: -100%;
                    width: 100%;
                    height: 2px;
                    background: linear-gradient(90deg, transparent, #f72585, transparent);
                    animation: scanlines 3s linear infinite;
                }
                
                .react-flow__node {
                    font-family: 'Hack', monospace;
                    transition: all 0.3s ease;
                    animation: breath 4s ease-in-out infinite;
                }
                
                .react-flow__node:hover {
                    transform: scale(1.05) !important;
                    z-index: 1000 !important;
                }
                
                .react-flow__attribution { display: none; } 
                
                .react-flow__minimap {
                    background: linear-gradient(135deg, rgba(13, 17, 23, 0.95) 0%, rgba(30, 41, 59, 0.9) 100%) !important;
                    border: 2px solid #f72585 !important;
                    border-radius: 8px !important;
                    box-shadow: 0 0 20px rgba(247, 37, 133, 0.6) !important;
                }
                
                .react-flow__minimap-node {
                    fill: #f72585 !important; 
                    stroke: none !important;
                    filter: drop-shadow(0 0 3px #f72585) !important;
                }
                
                .react-flow__minimap-mask {
                    fill: rgba(247, 37, 133, 0.3) !important; 
                    stroke: #f72585 !important;
                    stroke-width: 2px !important;
                }
                
                .react-flow__controls {
                    box-shadow: 0 0 20px rgba(247, 37, 133, 0.6);
                    border: 2px solid #f72585;
                    border-radius: 8px;
                    overflow: hidden;
                    background: linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.9) 100%);
                }
                
                .react-flow__controls-button {
                    background: transparent !important;
                    border-bottom: 1px solid rgba(247, 37, 133, 0.3) !important;
                    fill: #9ca3af !important;
                    transition: all 0.3s ease !important;
                }
                
                .react-flow__controls-button:hover {
                    background: rgba(247, 37, 133, 0.2) !important;
                    fill: #f72585 !important;
                    box-shadow: 0 0 10px rgba(247, 37, 133, 0.5) !important;
                }
                
                .cyber-flow-container {
                    background: radial-gradient(circle at center, rgba(15, 23, 42, 0.98) 0%, rgba(0, 0, 0, 0.99) 100%);
                    border: 3px solid #f72585;
                    border-radius: 12px;
                    box-shadow: 
                        0 0 40px rgba(247, 37, 133, 0.8),
                        0 0 80px rgba(247, 37, 133, 0.4),
                        inset 0 0 40px rgba(247, 37, 133, 0.1);
                    position: relative;
                    overflow: hidden;
                }
                
                .cyber-flow-container::after {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: 
                        linear-gradient(0deg, transparent 98%, rgba(247, 37, 133, 0.03) 100%),
                        linear-gradient(90deg, transparent 98%, rgba(247, 37, 133, 0.03) 100%);
                    background-size: 30px 30px;
                    pointer-events: none;
                    animation: grid-pulse 6s ease-in-out infinite;
                }
                
                .threat-level-indicator {
                    background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
                    border: 2px solid #f87171;
                    box-shadow: 0 0 20px rgba(248, 113, 113, 0.8);
                    animation: breath 2s ease-in-out infinite;
                }
                
                .classification-badge {
                    background: linear-gradient(135deg, #7c2d12 0%, #431407 100%);
                    border: 2px solid #ea580c;
                    box-shadow: 0 0 15px rgba(234, 88, 12, 0.6);
                }
                
                .cyber-prose {
                    background: rgba(15, 23, 42, 0.6);
                    border: 1px solid rgba(247, 37, 133, 0.3);
                    border-radius: 8px;
                    backdrop-filter: blur(10px);
                    box-shadow: 0 0 20px rgba(247, 37, 133, 0.2);
                }
                
                .truncate {
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    display: inline-block;
                    max-width: 85%;
                }
            `}</style>

            {/* Animated background elements */}
            <div className="absolute inset-0 opacity-10">
                <div className="grid-animation"></div>
            </div>
            
            {/* Header Section */}
            <div className="cyber-header p-6 md:p-12 mb-8 mx-4 md:mx-8 mt-4 rounded-lg">
                <div className="max-w-6xl mx-auto text-center">
                    <div className="flex items-center justify-center mb-6">
                        <FaShieldAlt className="text-cyberpunk-accent text-4xl mr-4 animate-pulse" />
                        <h1 className="text-4xl md:text-6xl font-['Orbitron'] font-black text-cyberpunk-accent glitch-text">
                            SECURITY INCIDENT ANALYSIS
                        </h1>
                        <FaShieldAlt className="text-cyberpunk-accent text-4xl ml-4 animate-pulse" />
                    </div>
                    
                    <div className="flex flex-wrap justify-center gap-4 mb-6">
                        <div className="threat-level-indicator px-4 py-2 rounded-lg">
                            <span className="text-red-100 font-['Orbitron'] font-bold text-sm">THREAT LEVEL: CRITICAL</span>
                        </div>
                        <div className="classification-badge px-4 py-2 rounded-lg">
                            <span className="text-orange-100 font-['Orbitron'] font-bold text-sm">CLASSIFICATION: TOP SECRET</span>
                        </div>
                    </div>
                    
                    <p className="text-cyberpunk-secondary text-lg md:text-xl font-mono max-w-4xl mx-auto leading-relaxed">
                        Executive Summary: A comprehensive analysis of security signals from May 17-19, 2025 reveals a sophisticated 
                        multi-stage attack on host <span className="text-cyberpunk-accent font-bold">EC2AMZ-QSHKIUQ.attackrange.prptl.org</span>
                    </p>
                </div>
            </div>

            <div className="px-4 md:px-8">
                {/* Pre-timeline content */}
                <div className="max-w-6xl mx-auto mb-12">
                    <div className="cyber-prose p-6 md:p-8 rounded-lg">
                        <div className="prose prose-sm md:prose-base max-w-none prose-headings:font-['Orbitron',_sans-serif] prose-headings:text-cyberpunk-accent prose-a:text-cyberpunk-secondary hover:prose-a:text-cyberpunk-accent prose-strong:text-cyberpunk-primary prose-code:text-xs prose-code:bg-gray-700 prose-code:p-1 prose-code:rounded prose-pre:bg-gray-800/70 prose-pre:border prose-pre:border-gray-700 prose-pre:rounded-md prose-invert">
                            <ReactMarkdown>{preTimelineContent}</ReactMarkdown>
                        </div>
                    </div>
                </div>

                {/* Enhanced Timeline Section */}
                <div className="max-w-full mx-auto mb-12">
                    <h2 className="text-3xl md:text-5xl font-['Orbitron'] font-black text-cyberpunk-accent my-12 text-center border-b-2 border-cyberpunk-secondary/30 pb-6 glitch-text">
                        DECONSTRUCTED INCIDENT TIMELINE
                    </h2>
                    
                    <div className="cyber-flow-container mb-12" style={{ height: '2800px' }}>
                        <ReactFlow
                            nodes={layoutedNodes}
                            edges={layoutedEdges}
                            onNodesChange={onNodesChange}
                            onEdgesChange={onEdgesChange}
                            onConnect={onConnect}
                            fitView
                            fitViewOptions={{ padding: 0.15, duration: 1200 }}
                            minZoom={0.05} 
                            defaultEdgeOptions={{ 
                                type: 'smoothstep',
                                style: { 
                                    stroke: '#7dd3fc', 
                                    strokeWidth: 2,
                                    filter: 'drop-shadow(0 0 3px #7dd3fc)'
                                }
                            }}
                        >
                            <Controls showInteractive={false} /> 
                            <MiniMap 
                                nodeColor={(node) => node.id.startsWith('event-stage-') ? '#f72585' : '#7dd3fc'} 
                                nodeStrokeWidth={3} 
                                zoomable 
                                pannable 
                            />
                            <Background color="#1e293b" gap={20} size={1} />
                        </ReactFlow>
                    </div>
                </div>
                
                {/* Technical Analysis Section */}
                <div className="max-w-6xl mx-auto mb-12">
                    <div className="cyber-prose p-6 md:p-8 rounded-lg">
                        <div className="prose prose-sm md:prose-base max-w-none prose-headings:font-['Orbitron',_sans-serif] prose-headings:text-cyberpunk-accent prose-a:text-cyberpunk-secondary hover:prose-a:text-cyberpunk-accent prose-strong:text-cyberpunk-primary prose-code:text-xs prose-code:bg-gray-700 prose-code:p-1 prose-code:rounded prose-pre:bg-gray-800/70 prose-pre:border prose-pre:border-gray-700 prose-pre:rounded-md prose-invert">
                            <ReactMarkdown>{technicalAnalysisAndBeyond}</ReactMarkdown>
                        </div>
                    </div>
                </div>

                {/* Enhanced Return Button */}
                <div className="text-center pb-12">
                    <Link 
                        to="/" 
                        className="inline-flex items-center gap-3 text-lg text-cyberpunk-secondary hover:text-white hover:bg-cyberpunk-accent px-8 py-4 border-2 border-cyberpunk-secondary hover:border-cyberpunk-accent transition-all duration-300 rounded-lg shadow-lg hover:shadow-cyberpunk-accent/50 font-['Orbitron'] font-bold transform hover:scale-105"
                    >
                        <FaShieldAlt className="text-xl" />
                        &lt; RETURN TO MAINFRAME ANALYSIS
                        <FaShieldAlt className="text-xl" />
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default IncidentReport; 