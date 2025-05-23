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
import { FaFileAlt, FaUser, FaNetworkWired, FaServer, FaKey, FaTerminal, FaBolt, FaSkull, FaShieldAlt, FaCrosshairs } from 'react-icons/fa';

// Simple timeline approach - create a vertical flow
const createTimelineFlow = (markdownContent) => {
    const nodes = [];
    const edges = [];
    let nodeId = 1;

    // Parse the markdown for timeline events
    const timelineSection = markdownContent.match(/## Timeline of Events([\s\S]*?)## Technical Analysis/);
    if (!timelineSection) return { nodes: [], edges: [] };

    const timelineText = timelineSection[1];
    
    // Extract events with timestamps
    const eventMatches = timelineText.match(/#### [^#][\s\S]*?(?=####|### |## |$)/g);
    if (!eventMatches) return { nodes: [], edges: [] };

    let yPosition = 100;
    let previousNodeId = null;

    eventMatches.forEach((eventBlock, index) => {
        const lines = eventBlock.trim().split('\n');
        const titleLine = lines[0].replace(/^####\s*/, '');
        const content = lines.slice(1).join('\n').trim();
        
        // Extract time from title
        const timeMatch = titleLine.match(/\(([^)]+)\)/);
        const time = timeMatch ? timeMatch[1] : '';
        const title = titleLine.replace(/\s*\([^)]*\)/, '');

        // Create main event node - make it bigger and more prominent
        const currentNodeId = `event-${nodeId++}`;
        nodes.push({
            id: currentNodeId,
            type: 'default',
            position: { x: 600, y: yPosition },
            data: { 
                label: (
                    <div style={{ padding: '16px', textAlign: 'left' }}>
                        <strong style={{ color: '#f72585', fontSize: '16px', display: 'block', marginBottom: '6px' }}>{title}</strong>
                        {time && <div style={{ color: '#64748b', fontSize: '12px', marginBottom: '12px', fontWeight: '500' }}>{time}</div>}
                        <div style={{ color: '#e2e8f0', fontSize: '13px', lineHeight: '1.4', maxHeight: '120px', overflow: 'auto' }}>
                            {content.substring(0, 300)}{content.length > 300 ? '...' : ''}
                        </div>
                    </div>
                )
            },
            style: {
                background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.9) 100%)',
                border: '3px solid #f72585',
                borderRadius: '12px',
                width: 400,
                height: 180,
                color: '#e2e8f0',
                fontSize: '13px',
                boxShadow: '0 0 30px rgba(247, 37, 133, 0.6), 0 0 60px rgba(247, 37, 133, 0.3)'
            }
        });

        // Connect to previous event
        if (previousNodeId) {
            edges.push({
                id: `edge-${previousNodeId}-${currentNodeId}`,
                source: previousNodeId,
                target: currentNodeId,
                type: 'smoothstep',
                animated: true,
                style: {
                    stroke: '#f72585',
                    strokeWidth: 4,
                    filter: 'drop-shadow(0 0 6px #f72585)'
                },
                markerEnd: {
                    type: MarkerType.ArrowClosed,
                    color: '#f72585',
                    width: 25,
                    height: 25
                }
            });
        }

        // Add entity nodes for this event - make them bigger too
        const entities = extractSimpleEntities(content);
        entities.forEach((entity, entityIndex) => {
            const entityNodeId = `entity-${nodeId++}`;
            const xOffset = (entityIndex % 4) * 220 - 330; // Spread entities horizontally
            
            nodes.push({
                id: entityNodeId,
                type: 'default',
                position: { x: 600 + xOffset, y: yPosition + 250 },
                data: { 
                    label: (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px' }}>
                            {getEntityIcon(entity.type)}
                            <span style={{ fontSize: '12px', fontWeight: '600' }}>{entity.value}</span>
                        </div>
                    )
                },
                style: {
                    background: getEntityColor(entity.type),
                    border: '2px solid rgba(255,255,255,0.4)',
                    borderRadius: '8px',
                    width: 200,
                    height: 50,
                    color: 'white',
                    fontSize: '11px',
                    boxShadow: '0 0 15px rgba(0,0,0,0.4)'
                }
            });

            // Connect entity to event
            edges.push({
                id: `edge-${currentNodeId}-${entityNodeId}`,
                source: currentNodeId,
                target: entityNodeId,
                type: 'smoothstep',
                style: {
                    stroke: '#64748b',
                    strokeWidth: 2,
                    opacity: 0.8
                },
                markerEnd: {
                    type: MarkerType.ArrowClosed,
                    color: '#64748b',
                    width: 15,
                    height: 15
                }
            });
        });

        previousNodeId = currentNodeId;
        yPosition += 400; // More space between event groups
    });

    return { nodes, edges };
};

// Simplified entity extraction
const extractSimpleEntities = (text) => {
    const entities = [];
    
    // Users
    const userMatches = text.match(/User `([^`]+)`/g);
    if (userMatches) {
        userMatches.forEach(match => {
            const user = match.match(/`([^`]+)`/)[1];
            entities.push({ type: 'USER', value: user });
        });
    }

    // IPs
    const ipMatches = text.match(/\b(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\b/g);
    if (ipMatches) {
        ipMatches.slice(0, 2).forEach(ip => {
            entities.push({ type: 'IP', value: ip });
        });
    }

    // Files
    const fileMatches = text.match(/`([^`]*\.(exe|dll|ps1|bat))`/gi);
    if (fileMatches) {
        fileMatches.slice(0, 2).forEach(match => {
            const file = match.replace(/`/g, '');
            entities.push({ type: 'FILE', value: file.split('\\').pop() });
        });
    }

    return entities.slice(0, 4); // Limit entities per event
};

const getEntityIcon = (type) => {
    switch (type) {
        case 'USER': return <FaUser className="text-blue-200" />;
        case 'IP': return <FaNetworkWired className="text-orange-200" />;
        case 'FILE': return <FaFileAlt className="text-purple-200" />;
        case 'PROCESS': return <FaBolt className="text-green-200" />;
        default: return <FaTerminal className="text-gray-200" />;
    }
};

const getEntityColor = (type) => {
    switch (type) {
        case 'USER': return 'linear-gradient(135deg, #3182CE 0%, #2B6CB0 100%)';
        case 'IP': return 'linear-gradient(135deg, #EA580C 0%, #C2410C 100%)';
        case 'FILE': return 'linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)';
        case 'PROCESS': return 'linear-gradient(135deg, #059669 0%, #047857 100%)';
        default: return 'linear-gradient(135deg, #4B5563 0%, #374151 100%)';
    }
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
        style: { stroke: '#7dd3fc', strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#7dd3fc' }
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
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-center p-8 border-2 border-red-500 rounded-lg bg-red-900/20">
                    <FaSkull className="text-red-500 text-6xl mx-auto mb-4 animate-pulse" />
                    <h2 className="text-red-400 text-2xl font-bold mb-2">SYSTEM ERROR</h2>
                    <p className="text-red-300">Error: {error}</p>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-center">
                    <FaCrosshairs className="text-cyberpunk-accent text-8xl mx-auto animate-spin mb-4" style={{ animationDuration: '2s' }} />
                    <h2 className="text-cyberpunk-accent text-2xl font-bold mb-2">ANALYZING THREAT DATA</h2>
                    <p className="text-cyberpunk-secondary">Reconstructing attack timeline...</p>
                </div>
            </div>
        );
    }

    // Split content for before and after timeline
    const sections = markdown.split('## Timeline of Events');
    const preTimelineContent = sections[0];
    const postTimelineContent = sections[1] ? sections[1].split('## Technical Analysis')[1] : '';

    return (
        <div className="bg-black min-h-screen text-cyberpunk-primary">
            <style>{`
                .cyber-container {
                    background: linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.9) 100%);
                    border: 2px solid #f72585;
                    border-radius: 12px;
                    box-shadow: 0 0 30px rgba(247, 37, 133, 0.6);
                }
                .react-flow__attribution { display: none; }
                .react-flow__controls {
                    background: rgba(15, 23, 42, 0.9);
                    border: 2px solid #f72585;
                    border-radius: 8px;
                }
                .react-flow__controls-button {
                    background: transparent !important;
                    border-color: rgba(247, 37, 133, 0.3) !important;
                    fill: #9ca3af !important;
                }
                .react-flow__controls-button:hover {
                    background: rgba(247, 37, 133, 0.2) !important;
                    fill: #f72585 !important;
                }
                .react-flow__minimap {
                    background: rgba(15, 23, 42, 0.9) !important;
                    border: 2px solid #f72585 !important;
                    border-radius: 8px !important;
                }
                .react-flow__node {
                    transition: transform 0.2s ease;
                }
                .react-flow__node:hover {
                    transform: scale(1.05);
                    z-index: 1000;
                }
                .prose h2 {
                    color: #f72585 !important;
                    font-size: 1.5rem !important;
                    margin-top: 2rem !important;
                    margin-bottom: 1rem !important;
                }
                .prose h3 {
                    color: #60a5fa !important;
                    font-size: 1.25rem !important;
                    margin-top: 1.5rem !important;
                    margin-bottom: 0.75rem !important;
                }
                .prose p {
                    color: #e2e8f0 !important;
                    line-height: 1.6 !important;
                }
                .prose ul li {
                    color: #cbd5e1 !important;
                }
                .prose strong {
                    color: #f72585 !important;
                }
                .prose code {
                    background: rgba(30, 41, 59, 0.8) !important;
                    color: #22d3ee !important;
                    padding: 2px 6px !important;
                    border-radius: 4px !important;
                    font-size: 0.875em !important;
                }
                .prose pre {
                    background: rgba(15, 23, 42, 0.9) !important;
                    border: 1px solid rgba(247, 37, 133, 0.3) !important;
                    border-radius: 8px !important;
                    overflow-x: auto !important;
                }
                body {
                    overflow-x: hidden;
                    overflow-y: auto;
                }
                .timeline-header {
                    text-shadow: 0 0 20px rgba(247, 37, 133, 0.8);
                    animation: glow 2s ease-in-out infinite alternate;
                }
                @keyframes glow {
                    from { text-shadow: 0 0 20px rgba(247, 37, 133, 0.8); }
                    to { text-shadow: 0 0 30px rgba(247, 37, 133, 1), 0 0 40px rgba(247, 37, 133, 0.6); }
                }
            `}</style>

            {/* Header */}
            <div className="cyber-container p-8 m-6">
                <div className="text-center">
                    <div className="flex items-center justify-center mb-6">
                        <FaShieldAlt className="text-cyberpunk-accent text-4xl mr-4" />
                        <h1 className="text-5xl font-black text-cyberpunk-accent">
                            SECURITY INCIDENT ANALYSIS
                        </h1>
                        <FaShieldAlt className="text-cyberpunk-accent text-4xl ml-4" />
                    </div>
                    
                    <div className="flex justify-center gap-4 mb-6">
                        <div className="bg-red-600 px-4 py-2 rounded border-2 border-red-400">
                            <span className="text-red-100 font-bold text-sm">THREAT LEVEL: CRITICAL</span>
                        </div>
                        <div className="bg-orange-600 px-4 py-2 rounded border-2 border-orange-400">
                            <span className="text-orange-100 font-bold text-sm">CLASSIFICATION: TOP SECRET</span>
                        </div>
                    </div>
                    
                    <p className="text-cyberpunk-secondary text-lg max-w-4xl mx-auto">
                        Interactive timeline reconstruction of multi-stage cyber attack
                    </p>
                </div>
            </div>

            {/* Executive Summary */}
            <div className="mx-6 mb-8">
                <div className="cyber-container p-6">
                    <div className="prose prose-invert max-w-none">
                        <ReactMarkdown>{preTimelineContent}</ReactMarkdown>
                    </div>
                </div>
            </div>

            {/* Timeline Visualization */}
            <div className="mx-6 mb-8">
                <h2 className="timeline-header text-5xl font-black text-cyberpunk-accent text-center mb-8 border-b-2 border-cyberpunk-accent/30 pb-6">
                    ATTACK TIMELINE RECONSTRUCTION
                </h2>
                
                <div className="cyber-container" style={{ height: '1400px' }}>
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        fitView
                        fitViewOptions={{ padding: 0.1 }}
                        minZoom={0.1}
                        maxZoom={2}
                        defaultZoom={0.7}
                    >
                        <Controls />
                        <MiniMap nodeStrokeWidth={3} zoomable pannable />
                        <Background color="#1e293b" gap={20} size={1} />
                    </ReactFlow>
                </div>
            </div>

            {/* Technical Analysis */}
            {postTimelineContent && (
                <div className="mx-6 mb-8">
                    <div className="cyber-container p-6">
                        <div className="prose prose-invert max-w-none">
                            <h2 className="text-3xl font-bold text-cyberpunk-accent mb-6">Technical Analysis</h2>
                            <ReactMarkdown>{postTimelineContent}</ReactMarkdown>
                        </div>
                    </div>
                </div>
            )}

            {/* Return Button */}
            <div className="text-center pb-12">
                <Link 
                    to="/" 
                    className="inline-flex items-center gap-3 text-lg text-cyberpunk-secondary hover:text-white hover:bg-cyberpunk-accent px-8 py-4 border-2 border-cyberpunk-secondary hover:border-cyberpunk-accent transition-all duration-300 rounded-lg font-bold transform hover:scale-105"
                >
                    <FaShieldAlt />
                    RETURN TO MAINFRAME
                    <FaShieldAlt />
                </Link>
            </div>
        </div>
    );
};

export default IncidentReport; 