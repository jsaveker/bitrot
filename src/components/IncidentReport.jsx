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
} from 'reactflow';
import 'reactflow/dist/style.css';

// Placeholder for parsing and preparing timeline data for React Flow
const parseTimelineToFlow = (markdownContent) => {
    const nodes = [];
    const edges = [];
    let yPos = 0;
    let nodeIdCounter = 1;
    let lastNodeId = null;

    // Regex to capture May 17 events specifically
    const timelineSectionMatch = markdownContent.match(/### May 17, 2025([\s\S]*?)### May 18-19, 2025/);

    if (timelineSectionMatch && timelineSectionMatch[1]) {
        const may17EventsText = timelineSectionMatch[1];
        // Split events based on '####' a subheading marker, but handle \n characters correctly
        const events = may17EventsText.trim().split(/\r?\n#### /);

        events.forEach((eventBlock, index) => {
            if (!eventBlock.trim()) return;
            // If the first block doesn't start with ####, prepend it for consistent splitting
            const currentEventBlock = index === 0 && !eventBlock.startsWith('####') && events.length > 1 ? eventBlock : eventBlock;
            const lines = currentEventBlock.trim().split(/\r?\n/);
            const titleLine = lines[0].replace(/^####\s*/, ''); // Remove #### from the first title if present
            const details = lines.slice(1).join('\n').trim();

            const titleMatch = titleLine.match(/^([^\(]+)\(([^\)]+)\)/);
            let eventTitle = titleLine;
            let eventTime = new Date().toISOString(); // Fallback

            if (titleMatch) {
                eventTitle = titleMatch[1].trim();
                const timeString = titleMatch[2].trim(); // "15:16:40 UTC"
                const [time, tz] = timeString.split(' ');
                const [h, m, s] = time.split(':');
                eventTime = new Date(Date.UTC(2025, 4, 17, parseInt(h), parseInt(m), parseInt(s))).toISOString();
            }

            const currentNodeId = `node-${nodeIdCounter++}`;
            nodes.push({
                id: currentNodeId,
                data: { 
                    label: (
                        <div>
                            <strong>{eventTitle}</strong> ({new Date(eventTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'UTC' })})
                            <hr className="my-1 border-cyberpunk-secondary/50" />
                            <pre className="text-xs whitespace-pre-wrap font-mono max-w-xs overflow-auto" style={{maxHeight: '100px'}}>{details.substring(0, 300)}{details.length > 300 ? '...' : ''}</pre>
                        </div>
                    )
                },
                position: { x: (index % 2 === 0 ? 50 : 450), y: yPos }, // Adjusted X for better staggering
                style: { 
                    background: '#1f2937', // Slightly lighter dark gray
                    color: '#9ca3af',    // Gray-400
                    border: '1px solid #4b5563', // Gray-600
                    borderRadius: '0.25rem', // Smaller radius
                    padding: '12px',
                    width: 380, // Increased width for more content
                 },
            });

            if (lastNodeId) {
                edges.push({
                    id: `edge-${lastNodeId}-to-${currentNodeId}`,
                    source: lastNodeId,
                    target: currentNodeId,
                    animated: true,
                    style: { stroke: '#f72585', strokeWidth: 2 }, 
                    markerEnd: { type: 'arrowclosed', color: '#f72585' },
                });
            }
            lastNodeId = currentNodeId;
            yPos += (150 + Math.floor(details.length / 50) * 10); // Dynamic Y based on content, min 150
        });
    }

    // Add node for May 18-19
    const may1819SectionMatch = markdownContent.match(/### May 18-19, 2025([\s\S]*?)## Technical Analysis/s);
    if (may1819SectionMatch && may1819SectionMatch[1] && lastNodeId) {
        const details = may1819SectionMatch[1].trim().replace(/^- /gm, '');
        const currentNodeId = `node-${nodeIdCounter++}`;
        nodes.push({
            id: currentNodeId,
            data: { 
                label: (
                    <div>
                        <strong>Continued Activity (May 18-19)</strong>
                        <hr className="my-1 border-cyberpunk-secondary/50" />
                        <pre className="text-xs whitespace-pre-wrap font-mono max-w-xs overflow-auto" style={{maxHeight: '100px'}}>{details.substring(0, 300)}{details.length > 300 ? '...' : ''}</pre>
                    </div>
                )
            },
            position: { x: (nodes.length % 2 === 0 ? 50 : 450), y: yPos },
            style: { 
                background: '#1f2937', color: '#9ca3af', border: '1px solid #4b5563', 
                borderRadius: '0.25rem', padding: '12px', width: 380,
            },
        });
        edges.push({
            id: `edge-${lastNodeId}-to-${currentNodeId}`,
            source: lastNodeId,
            target: currentNodeId,
            animated: true,
            style: { stroke: '#f72585', strokeWidth: 2 },
            markerEnd: { type: 'arrowclosed', color: '#f72585' },
        });
        yPos += (150 + Math.floor(details.length / 50) * 10);
    }
    return { nodes, edges };
};


const IncidentReport = () => {
    const [markdown, setMarkdown] = useState('');
    const [nodes, setNodes] = useState([]);
    const [edges, setEdges] = useState([]);
    const [error, setError] = useState(null);

    const onNodesChange = useCallback((changes) => setNodes((nds) => applyNodeChanges(changes, nds)), []);
    const onEdgesChange = useCallback((changes) => setEdges((eds) => applyEdgeChanges(changes, eds)), []);
    const onConnect = useCallback((connection) => setEdges((eds) => addEdge(connection, eds)), []);

    useEffect(() => {
        fetch('/incident/signal_analysis_2025_05_17_to_19.md')
            .then(res => {
                if (!res.ok) throw new Error(`Failed to load incident report: ${res.status}`);
                return res.text();
            })
            .then(text => {
                setMarkdown(text);
                const { nodes: flowNodes, edges: flowEdges } = parseTimelineToFlow(text);
                setNodes(flowNodes);
                setEdges(flowEdges);
            })
            .catch(err => {
                console.error("Error fetching incident report:", err);
                setError(err.message);
            });
    }, []);

    if (error) {
        return <div className="p-8 bg-gray-900 text-red-500 min-h-screen font-mono">Error: {error}</div>;
    }

    if (!markdown) {
        return <div className="p-8 bg-gray-900 text-green-400 min-h-screen font-mono">Loading incident data...</div>;
    }

    const sections = markdown.split('## Timeline of Events');
    const preTimelineContent = sections[0];
    // Ensure technicalAnalysisAndBeyond correctly captures everything after the timeline, or is empty if not present
    let technicalAnalysisAndBeyond = '';
    if (sections.length > 1 && sections[1].includes('## Technical Analysis')) {
        technicalAnalysisAndBeyond = `## Technical Analysis${sections[1].split('## Technical Analysis')[1]}`;
    } else if (sections.length > 1) {
        // If no '## Technical Analysis' but there is content after timeline, capture it.
        // This might happen if the structure changes or 'Technical Analysis' is not the immediate next H2.
        technicalAnalysisAndBeyond = sections[1];
    }

    return (
        <div className="bg-black text-cyberpunk-primary min-h-screen p-4 md:p-8 font-['Hack',_monospace]">
            <style>{`
                .react-flow__node {
                    font-family: 'Hack', monospace;
                    font-size: 0.85rem; /* Slightly smaller for more text */
                    box-shadow: 0 0 10px #f72585, 0 0 5px #f72585 inset; /* Cyberpunk glow */
                }
                .react-flow__edge-path {
                    filter: drop-shadow(0 0 3px #f72585);
                }
                .react-flow__attribution { display: none; } /* Hide React Flow attribution */
                .react-flow__minimap {
                    background-color: #0d1117 !important;
                    border: 1px solid #4b5563 !important;
                }
                .react-flow__minimap-mask {
                    fill: rgba(247, 37, 133, 0.2) !important; /* Cyberpunk pink tint for minimap selector */
                }
                .react-flow__controls-button {
                    background-color: #1f2937 !important;
                    border-bottom: 1px solid #4b5563 !important;
                    fill: #9ca3af !important;
                }
                 .react-flow__controls-button:hover {
                    background-color: #374151 !important;
                }
                .bg-grid-cyberpunk {
                    background-image: 
                        linear-gradient(to right, rgba(55, 65, 81, 0.3) 1px, transparent 1px),
                        linear-gradient(to bottom, rgba(55, 65, 81, 0.3) 1px, transparent 1px);
                    background-size: 20px 20px;
                }
            `}</style>
            <div className="max-w-5xl mx-auto">
                <div className="prose prose-sm md:prose-base max-w-none prose-headings:font-['Orbitron',_sans-serif] prose-headings:text-cyberpunk-accent prose-a:text-cyberpunk-secondary hover:prose-a:text-cyberpunk-accent prose-strong:text-cyberpunk-primary prose-code:text-xs prose-code:bg-gray-700 prose-code:p-1 prose-code:rounded prose-pre:bg-gray-800/70 prose-pre:border prose-pre:border-gray-700 prose-pre:rounded-md prose-invert">
                    <ReactMarkdown>{preTimelineContent}</ReactMarkdown>
                </div>

                <h2 className="text-3xl md:text-4xl font-['Orbitron',_sans-serif] text-cyberpunk-accent my-8 border-b-2 border-cyberpunk-secondary/50 pb-2">
                    Incident Timeline Visualized
                </h2>
                <div style={{ height: '1000px', border: '2px solid #f72585', borderRadius: '0.25rem', background: '#0a0d12' }} className="mb-8 shadow-2xl shadow-cyberpunk-accent/30 bg-grid-cyberpunk">
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        fitView
                        fitViewOptions={{ padding: 0.2 }}
                    >
                        <Controls />
                        <MiniMap nodeStrokeWidth={3} zoomable pannable />
                        <Background variant="lines" color="rgba(247, 37, 133, 0.1)" gap={24} size={2} />
                    </ReactFlow>
                </div>
                
                <div className="prose prose-sm md:prose-base max-w-none prose-headings:font-['Orbitron',_sans-serif] prose-headings:text-cyberpunk-accent prose-a:text-cyberpunk-secondary hover:prose-a:text-cyberpunk-accent prose-strong:text-cyberpunk-primary prose-code:text-xs prose-code:bg-gray-700 prose-code:p-1 prose-code:rounded prose-pre:bg-gray-800/70 prose-pre:border prose-pre:border-gray-700 prose-pre:rounded-md prose-invert">
                    <ReactMarkdown>{technicalAnalysisAndBeyond}</ReactMarkdown>
                </div>

                <Link to="/" className="mt-12 mb-8 inline-block text-sm text-cyberpunk-secondary hover:text-white hover:bg-cyberpunk-accent px-3 py-2 border border-cyberpunk-secondary hover:border-cyberpunk-accent transition-all duration-150 rounded-md shadow-md hover:shadow-lg hover:shadow-cyberpunk-accent/50">
                    &lt; Return to Mainframe Analysis
                </Link>
            </div>
        </div>
    );
};

export default IncidentReport; 