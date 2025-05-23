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
import { FaFileAlt, FaUser, FaNetworkWired, FaServer, FaKey, FaTerminal, FaBolt, FaSkull, FaShieldAlt, FaCrosshairs, FaArrowLeft } from 'react-icons/fa';

// Technical Analysis approach - create a hierarchical flow
const createTechnicalAnalysisFlow = (markdownContent) => {
    const nodes = [];
    const edges = [];
    let nodeId = 1;

    // Parse the markdown for technical analysis
    const technicalSection = markdownContent.match(/## Technical Analysis([\s\S]*?)(?=## |$)/);
    if (!technicalSection) return { nodes: [], edges: [] };

    // Define attack categories and their details - cleaner color palette
    const attackCategories = [
        {
            title: "Initial Access",
            description: "ClickFix social engineering attack",
            tools: ["ClickFix Technique", "PowerShell", "fixer.exe", "revshelled.exe"],
            color: "#ef4444", // Red-500
            position: { x: 200, y: 100 }
        },
        {
            title: "Command & Control",
            description: "Remote access establishment",
            tools: ["C2 Channel", "172.31.7.63:4444", "Remote Commands"],
            color: "#f97316", // Orange-500
            position: { x: 600, y: 100 }
        },
        {
            title: "Persistence",
            description: "System access maintenance",
            tools: ["AnyDesk RMM", "Living off Land", "C:\\Windows\\Temp\\"],
            color: "#eab308", // Yellow-500
            position: { x: 1000, y: 100 }
        },
        {
            title: "Process Injection",
            description: "Code injection techniques",
            tools: ["anydesk.exe", "cmd.exe", "Memory Access"],
            color: "#22c55e", // Green-500
            position: { x: 200, y: 400 }
        },
        {
            title: "Credential Theft",
            description: "Credential harvesting",
            tools: ["Rubeus", "BloodHound", "Kerberoast", "hashes.txt"],
            color: "#3b82f6", // Blue-500
            position: { x: 600, y: 400 }
        },
        {
            title: "Registry Persistence",
            description: "System-level persistence",
            tools: ["Service Registry", "DLL Loading", "Tcpip Parameters"],
            color: "#8b5cf6", // Purple-500
            position: { x: 1000, y: 400 }
        }
    ];

    // Create parent nodes for each category - clean and simple styling
    attackCategories.forEach((category, index) => {
        const parentNodeId = `category-${nodeId++}`;
        
        nodes.push({
            id: parentNodeId,
            type: 'default',
            position: category.position,
            data: { 
                label: (
                    <div style={{ 
                        padding: '12px', 
                        textAlign: 'center', 
                        height: '100px', 
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center'
                    }}>
                        <div style={{ 
                            color: 'white', 
                            fontSize: '11px',
                            fontWeight: '600',
                            marginBottom: '6px',
                            lineHeight: '1.3'
                        }}>
                            {category.title}
                        </div>
                        <div style={{ 
                            color: 'rgba(255,255,255,0.85)', 
                            fontSize: '9px', 
                            lineHeight: '1.3',
                            maxHeight: '50px',
                            overflow: 'hidden'
                        }}>
                            {category.description}
                        </div>
                    </div>
                )
            },
            style: {
                background: category.color,
                border: 'none',
                borderRadius: '6px',
                width: 220,
                height: 100,
                color: 'white',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)' // Softer shadow
            }
        });

        // Create child nodes for tools/techniques - very clean styling
        category.tools.forEach((tool, toolIndex) => {
            const childNodeId = `tool-${nodeId++}`;
            const xOffset = (toolIndex % 2) * 120 - 60; // Closer horizontal spread
            const yOffset = Math.floor(toolIndex / 2) * 55 + 150; // Tighter vertical spread
            
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
                            padding: '6px 10px',
                            height: '40px',
                            overflow: 'hidden',
                            textAlign: 'center'
                        }}>
                            <span style={{ 
                                fontSize: '9px', 
                                fontWeight: '500',
                                color: '#374151',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                display: '-webkit-box',
                            }} title={tool}>
                                {tool}
                            </span>
                        </div>
                    )
                },
                style: {
                    background: '#f9fafb', // Light gray background
                    border: '1px solid #e5e7eb', // Light border
                    borderRadius: '4px',
                    width: 110,
                    height: 40,
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                }
            });

            // Connect child to parent - subtle edges
            edges.push({
                id: `edge-${parentNodeId}-${childNodeId}`,
                source: parentNodeId,
                target: childNodeId,
                type: 'smoothstep',
                style: {
                    stroke: '#cbd5e1', // Lighter gray
                    strokeWidth: 1
                },
                markerEnd: {
                    type: MarkerType.ArrowClosed,
                    color: '#cbd5e1',
                    width: 10,
                    height: 10
                }
            });
        });

        // Connect categories - subtle connecting lines
        if (index > 0 && index < 3) {
            const prevCategoryId = `category-${index}`;
            const currentCategoryId = `category-${index + 1}`;
            edges.push({
                id: `edge-chain-${prevCategoryId}-${currentCategoryId}`,
                source: prevCategoryId,
                target: currentCategoryId,
                type: 'smoothstep',
                style: {
                    stroke: '#9ca3af', // Medium gray
                    strokeWidth: 1.5
                },
                markerEnd: {
                    type: MarkerType.ArrowClosed,
                    color: '#9ca3af',
                    width: 14,
                    height: 14
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
                style: {
                    stroke: '#9ca3af',
                    strokeWidth: 1.5
                },
                markerEnd: {
                    type: MarkerType.ArrowClosed,
                    color: '#9ca3af',
                    width: 14,
                    height: 14
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
    const timelineEventsContent = sections[1] ? sections[1].split('## Technical Analysis')[0] : '';
    const technicalAnalysisText = sections[1] ? sections[1].split('## Technical Analysis')[1]?.split('## MITRE ATT&CK Mapping')[0] : '';

    return (
        <div className="min-h-screen bg-gray-100 text-gray-800 font-sans">
            <style>{`
                body { font-family: 'Inter', sans-serif; }
                .prose h1, .prose h2, .prose h3 {
                    font-family: 'Inter', sans-serif;
                    font-weight: 600;
                    color: #1f2937; /* gray-800 */
                }
                .prose h1 { font-size: 1.875rem; margin-bottom: 1rem; }
                .prose h2 { font-size: 1.5rem; margin-top: 2rem; margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 1px solid #e5e7eb; }
                .prose h3 { font-size: 1.25rem; margin-top: 1.5rem; margin-bottom: 0.75rem; }
                .prose p, .prose li {
                    color: #4b5563; /* gray-600 */
                    line-height: 1.65;
                }
                .prose strong { color: #111827; font-weight: 600; }
                .prose code { 
                    background-color: #f3f4f6; /* gray-100 */
                    color: #ef4444; /* red-500 for code, as an accent */
                    padding: 0.2em 0.4em;
                    margin: 0;
                    font-size: 0.875em;
                    border-radius: 3px;
                }
                .prose pre code { background-color: transparent; color: inherit; padding: 0; font-size: inherit; }
                .prose pre {
                    background-color: #f9fafb; /* gray-50 */
                    border: 1px solid #e5e7eb; /* gray-200 */
                    border-radius: 6px;
                    padding: 1em;
                    overflow-x: auto;
                }
                .react-flow__attribution { display: none; }
                .react-flow__controls {
                    background: white;
                    border: 1px solid #e5e7eb;
                    border-radius: 6px;
                    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
                }
                .react-flow__controls-button {
                    background: white !important;
                    border-color: #e5e7eb !important;
                    fill: #6b7280 !important;
                }
                .react-flow__controls-button:hover {
                    background: #f9fafb !important;
                }
                .react-flow__minimap {
                    background: white !important;
                    border: 1px solid #e5e7eb !important;
                    border-radius: 6px !important;
                }
                 .react-flow__node:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 4px 8px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06);
                }
            `}</style>

            {/* Header Section */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-5">
                        <div className="flex items-center">
                            <FaShieldAlt className="text-red-500 h-8 w-8 mr-2" />
                            <h1 className="text-2xl font-semibold text-gray-900">Security Incident Analysis</h1>
                        </div>
                        <div className="flex items-center space-x-4">
                            <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                Severity: CRITICAL
                            </span>
                            <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                                Priority: HIGH
                            </span>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Top Section: Summary and Overview */}
                <section className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-8">
                    <div className="md:col-span-4 bg-white shadow-sm border border-gray-200 rounded-lg p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-3">Executive Summary</h2>
                        <div className="prose prose-sm max-w-none">
                            <ReactMarkdown>{preTimelineContent.split('## Executive Summary')[1]?.split('## Timeline of Events')[0] || preTimelineContent}</ReactMarkdown>
                        </div>
                    </div>
                    <div className="md:col-span-3 bg-white shadow-sm border border-gray-200 rounded-lg p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-3">Incident Overview</h2>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between py-1.5 border-b border-gray-100"><span>Date Range:</span><span className="font-medium text-gray-700">May 17-19, 2025</span></div>
                            <div className="flex justify-between py-1.5 border-b border-gray-100"><span>Target Host:</span><span className="font-medium text-gray-700 font-mono">EC2AMAZ-OSH4IUQ</span></div>
                            <div className="flex justify-between py-1.5 border-b border-gray-100"><span>User:</span><span className="font-medium text-gray-700 font-mono">jl.picard</span></div>
                            <div className="flex justify-between py-1.5 border-b border-gray-100"><span>Attack Vector:</span><span className="font-medium text-gray-700">ClickFix</span></div>
                            <div className="flex justify-between py-1.5"><span>C2:</span><span className="font-medium text-gray-700 font-mono">172.31.7.63:4444</span></div>
                        </div>
                    </div>
                    <div className="md:col-span-5 bg-white shadow-sm border border-gray-200 rounded-lg p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 text-center">Risk Assessment</h2>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
                            <div className="text-center p-3 bg-red-50 border border-red-200 rounded-md">
                                <div className="text-xs text-red-700 font-medium mb-1">Severity</div>
                                <div className="font-semibold text-red-800">CRITICAL</div>
                            </div>
                            <div className="text-center p-3 bg-orange-50 border border-orange-200 rounded-md">
                                <div className="text-xs text-orange-700 font-medium mb-1">Scope</div>
                                <div className="font-semibold text-orange-800">HIGH</div>
                            </div>
                            <div className="text-center p-3 bg-orange-50 border border-orange-200 rounded-md">
                                <div className="text-xs text-orange-700 font-medium mb-1">Impact</div>
                                <div className="font-semibold text-orange-800">HIGH</div>
                            </div>
                            <div className="text-center p-3 bg-yellow-50 border border-yellow-300 rounded-md">
                                <div className="text-xs text-yellow-700 font-medium mb-1">Sophistication</div>
                                <div className="font-semibold text-yellow-800">HIGH</div>
                            </div>
                            <div className="col-span-2 text-center p-4 bg-red-600 text-white rounded-md mt-2">
                                <div className="text-xs font-medium uppercase tracking-wider mb-1">Overall Risk</div>
                                <div className="font-bold text-lg">CRITICAL</div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Technical Analysis Visualization */}
                <section className="mb-8">
                    <div className="bg-white shadow-sm border border-gray-200 rounded-lg">
                         <div className="p-6 border-b border-gray-200">
                            <h2 className="text-xl font-semibold text-gray-900 text-center">Technical Analysis Breakdown</h2>
                        </div>
                        <div style={{ height: '700px' }}>
                            <ReactFlow
                                nodes={nodes}
                                edges={edges}
                                onNodesChange={onNodesChange}
                                onEdgesChange={onEdgesChange}
                                onConnect={onConnect}
                                fitView
                                fitViewOptions={{ padding: 0.15, duration: 0 }} // Instant fitView
                                minZoom={0.1}
                                maxZoom={1.5} // Constrain max zoom
                                defaultZoom={0.8}
                            >
                                <Controls />
                                <MiniMap nodeStrokeWidth={2} zoomable pannable nodeColor="#f3f4f6" maskColor="rgba(0,0,0,0.05)"/>
                                <Background color="#e5e7eb" gap={24} size={0.5} />
                            </ReactFlow>
                        </div>
                    </div>
                </section>

                {/* Timeline of Events - Text Section */}
                {timelineEventsContent && (
                    <section className="mb-8">
                        <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-8">
                            <div className="prose prose-lg max-w-none">
                                <h2 className="text-xl font-semibold text-gray-900 mb-4">Timeline of Events</h2>
                                <ReactMarkdown>{timelineEventsContent}</ReactMarkdown>
                            </div>
                        </div>
                    </section>
                )}

                {/* Technical Analysis - Text Section */}
                {technicalAnalysisText && (
                     <section className="mb-8">
                        <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-8">
                            <div className="prose prose-lg max-w-none">
                                <h2 className="text-xl font-semibold text-gray-900 mb-4">Technical Analysis Details</h2>
                                <ReactMarkdown>{technicalAnalysisText}</ReactMarkdown>
                            </div>
                        </div>
                    </section>
                )}

                {/* Return Button */}
                <footer className="text-center py-8">
                    <Link 
                        to="/" 
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900 rounded-lg font-medium transition-colors duration-150 text-sm"
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