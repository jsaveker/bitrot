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

// Technical Analysis approach - create a hierarchical flow
const createTechnicalAnalysisFlow = (markdownContent) => {
    const nodes = [];
    const edges = [];
    let nodeId = 1;

    // Parse the markdown for technical analysis
    const technicalSection = markdownContent.match(/## Technical Analysis([\s\S]*?)(?=## |$)/);
    if (!technicalSection) return { nodes: [], edges: [] };

    // Define attack categories and their details
    const attackCategories = [
        {
            title: "Initial Access Vector",
            description: "ClickFix social engineering, PowerShell execution",
            tools: ["ClickFix Technique", "PowerShell Command", "fixer.exe", "revshelled.exe"],
            color: "#dc2626",
            position: { x: 200, y: 100 }
        },
        {
            title: "Command and Control",
            description: "Remote access channel establishment",
            tools: ["C2 Channel", "172.31.7.63:4444", "Remote Commands"],
            color: "#ea580c",
            position: { x: 600, y: 100 }
        },
        {
            title: "Lateral Movement",
            description: "Persistence and system access maintenance",
            tools: ["AnyDesk RMM", "Living off Land", "C:\\Windows\\Temp\\"],
            color: "#ca8a04",
            position: { x: 1000, y: 100 }
        },
        {
            title: "Process Injection",
            description: "Code injection into legitimate processes",
            tools: ["anydesk.exe injection", "cmd.exe injection", "Memory Access 0x1fffff"],
            color: "#16a34a",
            position: { x: 200, y: 400 }
        },
        {
            title: "Credential Theft",
            description: "Credential harvesting and enumeration",
            tools: ["Rubeus", "BloodHound", "Kerberoast", "hashes.txt"],
            color: "#2563eb",
            position: { x: 600, y: 400 }
        },
        {
            title: "Registry Persistence",
            description: "System-level persistence mechanisms",
            tools: ["Service Registry", "DLL Loading", "Tcpip Parameters", "Interface Keys"],
            color: "#7c3aed",
            position: { x: 1000, y: 400 }
        }
    ];

    // Create parent nodes for each category
    attackCategories.forEach((category, index) => {
        const parentNodeId = `category-${nodeId++}`;
        
        nodes.push({
            id: parentNodeId,
            type: 'default',
            position: category.position,
            data: { 
                label: (
                    <div style={{ padding: '12px', textAlign: 'center', height: '120px', overflow: 'hidden' }}>
                        <strong style={{ 
                            color: '#ffffff', 
                            fontSize: '12px', 
                            display: 'block', 
                            marginBottom: '6px',
                            lineHeight: '1.2'
                        }}>
                            {category.title}
                        </strong>
                        <div style={{ 
                            color: '#e2e8f0', 
                            fontSize: '10px', 
                            lineHeight: '1.3',
                            height: '60px',
                            overflow: 'hidden',
                            wordWrap: 'break-word'
                        }}>
                            {category.description}
                        </div>
                    </div>
                )
            },
            style: {
                background: `linear-gradient(135deg, ${category.color} 0%, ${category.color}dd 100%)`,
                border: '3px solid #ffffff',
                borderRadius: '12px',
                width: 240,
                height: 120,
                color: '#ffffff',
                fontSize: '10px',
                boxShadow: `0 0 20px ${category.color}80, 0 0 40px ${category.color}40`
            }
        });

        // Create child nodes for tools/techniques
        category.tools.forEach((tool, toolIndex) => {
            const childNodeId = `tool-${nodeId++}`;
            const xOffset = (toolIndex % 2) * 140 - 70;
            const yOffset = Math.floor(toolIndex / 2) * 80 + 180;
            
            nodes.push({
                id: childNodeId,
                type: 'default',
                position: { 
                    x: category.position.x + xOffset, 
                    y: category.position.y + yOffset 
                },
                data: { 
                    label: (
                        <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            padding: '6px 8px',
                            height: '50px',
                            overflow: 'hidden',
                            textAlign: 'center'
                        }}>
                            <span style={{ 
                                fontSize: '9px', 
                                fontWeight: '600',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                wordWrap: 'break-word',
                                lineHeight: '1.2',
                                display: '-webkit-box',
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: 'vertical'
                            }} title={tool}>
                                {tool}
                            </span>
                        </div>
                    )
                },
                style: {
                    background: `linear-gradient(135deg, ${category.color}aa 0%, ${category.color}77 100%)`,
                    border: '2px solid rgba(255,255,255,0.6)',
                    borderRadius: '8px',
                    width: 130,
                    height: 50,
                    color: 'white',
                    fontSize: '9px',
                    boxShadow: '0 0 10px rgba(0,0,0,0.4)'
                }
            });

            // Connect child to parent
            edges.push({
                id: `edge-${parentNodeId}-${childNodeId}`,
                source: parentNodeId,
                target: childNodeId,
                type: 'smoothstep',
                style: {
                    stroke: category.color,
                    strokeWidth: 2,
                    opacity: 0.8
                },
                markerEnd: {
                    type: MarkerType.ArrowClosed,
                    color: category.color,
                    width: 15,
                    height: 15
                }
            });
        });

        // Connect categories in attack chain order
        if (index > 0 && index < 3) {
            const prevCategoryId = `category-${index}`;
            const currentCategoryId = `category-${index + 1}`;
            edges.push({
                id: `edge-chain-${prevCategoryId}-${currentCategoryId}`,
                source: prevCategoryId,
                target: currentCategoryId,
                type: 'smoothstep',
                animated: true,
                style: {
                    stroke: '#f72585',
                    strokeWidth: 3,
                    filter: 'drop-shadow(0 0 6px #f72585)'
                },
                markerEnd: {
                    type: MarkerType.ArrowClosed,
                    color: '#f72585',
                    width: 20,
                    height: 20
                }
            });
        }
        if (index >= 3 && index < 5) {
            const prevCategoryId = `category-${index}`;
            const currentCategoryId = `category-${index + 1}`;
            edges.push({
                id: `edge-chain-${prevCategoryId}-${currentCategoryId}`,
                source: prevCategoryId,
                target: currentCategoryId,
                type: 'smoothstep',
                animated: true,
                style: {
                    stroke: '#f72585',
                    strokeWidth: 3,
                    filter: 'drop-shadow(0 0 6px #f72585)'
                },
                markerEnd: {
                    type: MarkerType.ArrowClosed,
                    color: '#f72585',
                    width: 20,
                    height: 20
                }
            });
        }
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
                const { nodes: flowNodes, edges: flowEdges } = createTechnicalAnalysisFlow(text);
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
            <div className="cyber-container p-6 m-6 mb-4">
                <div className="text-center">
                    <div className="flex items-center justify-center mb-4">
                        <FaShieldAlt className="text-cyberpunk-accent text-3xl mr-3" />
                        <h1 className="text-4xl font-black text-cyberpunk-accent">
                            SECURITY INCIDENT ANALYSIS
                        </h1>
                        <FaShieldAlt className="text-cyberpunk-accent text-3xl ml-3" />
                    </div>
                    
                    <div className="flex justify-center gap-4 mb-4">
                        <div className="bg-red-600 px-3 py-1 rounded border-2 border-red-400">
                            <span className="text-red-100 font-bold text-sm">INCIDENT SEVERITY: CRITICAL</span>
                        </div>
                        <div className="bg-orange-600 px-3 py-1 rounded border-2 border-orange-400">
                            <span className="text-orange-100 font-bold text-sm">PRIORITY: HIGH</span>
                        </div>
                    </div>
                    
                    <p className="text-cyberpunk-secondary text-base">
                        Interactive timeline reconstruction of multi-stage cyber attack
                    </p>
                </div>
            </div>

            {/* Main Content Layout - Side by Side */}
            <div className="mx-6 mb-8 grid grid-cols-12 gap-6">
                {/* Left Sidebar - Executive Summary & Overview */}
                <div className="col-span-3 space-y-6">
                    {/* Executive Summary */}
                    <div className="cyber-container p-6">
                        <h3 className="text-xl font-bold text-cyberpunk-accent mb-4 border-b border-cyberpunk-accent/30 pb-2">
                            Executive Summary
                        </h3>
                        <div className="prose prose-invert prose-sm max-w-none text-sm">
                            <ReactMarkdown>{preTimelineContent.split('## Executive Summary')[1]?.split('## Timeline of Events')[0] || preTimelineContent}</ReactMarkdown>
                        </div>
                    </div>

                    {/* Incident Overview */}
                    <div className="cyber-container p-6">
                        <h3 className="text-xl font-bold text-cyberpunk-accent mb-4 border-b border-cyberpunk-accent/30 pb-2">
                            Incident Overview
                        </h3>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-cyberpunk-secondary font-semibold">Date Range:</span>
                                <span className="text-cyberpunk-primary text-xs">May 17-19, 2025</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-cyberpunk-secondary font-semibold">Target Host:</span>
                                <span className="text-cyberpunk-primary text-xs">EC2AMAZ-OSH4IUQ</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-cyberpunk-secondary font-semibold">Compromised User:</span>
                                <span className="text-cyberpunk-primary text-xs">ATTACKRANGE\jl.picard</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-cyberpunk-secondary font-semibold">Attack Vector:</span>
                                <span className="text-cyberpunk-primary text-xs">ClickFix Social Engineering</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-cyberpunk-secondary font-semibold">C2 Infrastructure:</span>
                                <span className="text-cyberpunk-primary text-xs">172.31.7.63:4444</span>
                            </div>
                            <div className="border-t border-cyberpunk-secondary/30 pt-3 mt-3">
                                <h4 className="text-cyberpunk-accent font-semibold mb-2 text-sm">Key Attack Components:</h4>
                                <ul className="text-cyberpunk-primary text-xs space-y-1">
                                    <li>• Remote Management Tool (AnyDesk)</li>
                                    <li>• Process Injection Techniques</li>
                                    <li>• Credential Theft (Rubeus, BloodHound)</li>
                                    <li>• Registry Persistence Mechanisms</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Risk Assessment - New Column */}
                <div className="col-span-2">
                    <div className="cyber-container p-6 h-fit">
                        <h3 className="text-xl font-bold text-cyberpunk-accent mb-4 border-b border-cyberpunk-accent/30 pb-2 text-center">
                            Risk Assessment
                        </h3>
                        <div className="space-y-4">
                            {/* Severity */}
                            <div className="text-center">
                                <div className="text-xs text-cyberpunk-secondary mb-1">Severity</div>
                                <div className="bg-red-600 px-3 py-2 rounded border-2 border-red-400 text-white font-bold text-sm">
                                    CRITICAL
                                </div>
                            </div>
                            
                            {/* Scope */}
                            <div className="text-center">
                                <div className="text-xs text-cyberpunk-secondary mb-1">Scope</div>
                                <div className="bg-orange-600 px-3 py-2 rounded border-2 border-orange-400 text-white font-bold text-sm">
                                    HIGH
                                </div>
                            </div>

                            {/* Impact */}
                            <div className="text-center">
                                <div className="text-xs text-cyberpunk-secondary mb-1">Impact</div>
                                <div className="bg-orange-600 px-3 py-2 rounded border-2 border-orange-400 text-white font-bold text-sm">
                                    HIGH
                                </div>
                            </div>

                            {/* Sophistication */}
                            <div className="text-center">
                                <div className="text-xs text-cyberpunk-secondary mb-1">Sophistication</div>
                                <div className="bg-orange-600 px-3 py-2 rounded border-2 border-orange-400 text-white font-bold text-sm">
                                    HIGH
                                </div>
                            </div>

                            {/* Overall Risk */}
                            <div className="border-t border-cyberpunk-accent/30 pt-3 mt-4">
                                <div className="text-center">
                                    <div className="text-sm text-cyberpunk-accent mb-2 font-semibold">Overall Risk</div>
                                    <div className="bg-red-700 px-4 py-3 rounded-lg border-3 border-red-400 text-white font-black text-lg animate-pulse">
                                        CRITICAL
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side - Technical Analysis Visualization */}
                <div className="col-span-7">
                    <h2 className="timeline-header text-4xl font-black text-cyberpunk-accent text-center mb-6 border-b-2 border-cyberpunk-accent/30 pb-4">
                        TECHNICAL ANALYSIS BREAKDOWN
                    </h2>
                    
                    <div className="cyber-container" style={{ height: '800px' }}>
                        <ReactFlow
                            nodes={nodes}
                            edges={edges}
                            onNodesChange={onNodesChange}
                            onEdgesChange={onEdgesChange}
                            onConnect={onConnect}
                            fitView
                            fitViewOptions={{ padding: 0.2 }}
                            minZoom={0.1}
                            maxZoom={2}
                            defaultZoom={0.9}
                        >
                            <Controls />
                            <MiniMap nodeStrokeWidth={3} zoomable pannable />
                            <Background color="#1e293b" gap={20} size={1} />
                        </ReactFlow>
                    </div>
                </div>
            </div>

            {/* Timeline of Events */}
            {sections[1] && (
                <div className="mx-6 mb-8">
                    <div className="cyber-container p-6">
                        <div className="prose prose-invert max-w-none">
                            <h2 className="text-3xl font-bold text-cyberpunk-accent mb-6">Timeline of Events</h2>
                            <ReactMarkdown>{sections[1].split('## Technical Analysis')[0]}</ReactMarkdown>
                        </div>
                    </div>
                </div>
            )}

            {/* Technical Analysis */}
            {postTimelineContent && (
                <div className="mx-6 mb-8">
                    <div className="cyber-container p-6">
                        <div className="prose prose-invert max-w-none">
                            <h2 className="text-3xl font-bold text-cyberpunk-accent mb-6">Technical Analysis</h2>
                            <ReactMarkdown>{postTimelineContent.split('## MITRE ATT&CK Mapping')[0]}</ReactMarkdown>
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