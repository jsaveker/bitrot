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

const ENTITY_STYLES = {
    USER: { background: '#2b6cb0', color: 'white', border: '1px solid #2c5282', padding: '5px 8px', fontSize: '0.75rem' },
    HOST: { background: '#9B2C2C', color: 'white', border: '1px solid #742A2A', padding: '5px 8px', fontSize: '0.75rem' },
    PROCESS: { background: '#276749', color: 'white', border: '1px solid #22543D', padding: '5px 8px', fontSize: '0.75rem' },
    FILE: { background: '#B83280', color: 'white', border: '1px solid #8D2460', padding: '5px 8px', fontSize: '0.75rem' },
    IP_ADDRESS: { background: '#C05621', color: 'white', border: '1px solid #9C4221', padding: '5px 8px', fontSize: '0.75rem' },
    REG_KEY: { background: '#6B46C1', color: 'white', border: '1px solid #553C9A', padding: '5px 8px', fontSize: '0.75rem' },
    COMMAND: { background: '#0891B2', color: 'white', border: '1px solid #0E7490', padding: '5px 8px', fontSize: '0.75rem' },
    DEFAULT_ENTITY: { background: '#4A5568', color: 'white', border: '1px solid #2D3748', padding: '5px 8px', fontSize: '0.75rem' },
    EVENT_GROUP: {
        background: '#1a202c',
        color: '#e2e8f0',
        border: '1px solid #f72585', // Cyberpunk pink border
        boxShadow: '0 0 8px #f72585',
        padding: '15px',
        width: 400,
        fontSize: '1rem'
    },
    ACTION: {
        background: '#16a34a', // Green for actions
        color: 'white',
        padding: '3px 6px',
        fontSize: '0.7rem',
        borderRadius: '10px',
        border: 'none'
    }
};

const extractEntitiesAndActions = (textBlock, parentNodeId, nodeIdCounterStart) => {
    const childNodes = [];
    const childEdges = [];
    let localNodeId = nodeIdCounterStart;
    let entityYOffset = 60; // Initial Y offset from parent for entities
    const entityXOffsetBase = -150; 

    // Simplified regexes, can be expanded
    const patterns = {
        USER: /User `([^`]+)`/g,
        HOST: /host `([^`]+)`/g,
        IP_ADDRESS: /(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(?::\d{1,5})?)/g,
        FILE: /([A-Za-z]:\\[^\s:`*?"<>|]+)|(\/[^\s:`*?"<>|]+)/g, // Catches Windows and Unix paths
        PROCESS: /([a-zA-Z0-9_-]+\.exe)/g,
        REG_KEY: /HK[LMU]{1,2}\\[^\s]+/g,
        COMMAND: /powershell\.exe[^\n]+|cmd\.exe[^\n]+/ig, // Basic Powershell/CMD
    };

    const createChildNode = (type, value, xOffset, yPos) => {
        const id = `detail-node-${localNodeId++}`;
        childNodes.push({
            id,
            data: { label: value },
            position: { x: xOffset, y: yPos },
            style: ENTITY_STYLES[type] || ENTITY_STYLES.DEFAULT_ENTITY,
            parentNode: parentNodeId,
            extent: 'parent',
            draggable: true,
        });
        childEdges.push({
            id: `edge-${parentNodeId}-to-${id}`,
            source: parentNodeId,
            target: id,
            style: { stroke: '#4A5568', strokeWidth: 1 },
        });
        return id;
    };
    
    let entityCount = 0;
    for (const type in patterns) {
        let match;
        while ((match = patterns[type].exec(textBlock)) !== null) {
            const value = type === 'FILE' ? (match[1] || match[2]) : match[1] || match[0];
             if (value.length < 5 && type !== 'USER') continue; // Avoid short, common strings unless it's a user
            if (childNodes.find(n => n.data.label === value)) continue; // Avoid duplicates for now
            
            const xOffset = entityXOffsetBase + (entityCount % 2 === 0 ? 0 : 100); // Stagger X
            createChildNode(type, value, xOffset , entityYOffset + Math.floor(entityCount / 2) * 40);
            entityCount++;
        }
    }
    return { childNodes, childEdges, nextNodeId: localNodeId }; 
};

const parseTimelineToFlow = (markdownContent) => {
    const nodes = [];
    const edges = [];
    let yPos = 50;
    let nodeIdCounter = 1;
    let lastEventGroupId = null;

    const timelineSectionMatch = markdownContent.match(/### May 17, 2025([\s\S]*?)### May 18-19, 2025/);

    if (timelineSectionMatch && timelineSectionMatch[1]) {
        const may17EventsText = timelineSectionMatch[1];
        const events = may17EventsText.trim().split(/\r?\n#### /);

        events.forEach((eventBlock, index) => {
            if (!eventBlock.trim()) return;
            const currentEventBlock = index === 0 && !eventBlock.startsWith('####') && events.length > 1 ? eventBlock : eventBlock;
            const lines = currentEventBlock.trim().split(/\r?\n/);
            const titleLine = lines[0].replace(/^####\s*/, '');
            const details = lines.slice(1).join('\n').trim();

            const titleMatch = titleLine.match(/^([^\(]+)\(([^\)]+)\)/);
            let eventTitle = titleLine;
            let eventTime = '';
            if (titleMatch) {
                eventTitle = titleMatch[1].trim();
                eventTime = new Date(Date.UTC(2025, 4, 17, ...titleMatch[2].match(/\d+/g).map(Number))).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'UTC' });
            }

            const eventGroupId = `event-group-${nodeIdCounter++}`;
            nodes.push({
                id: eventGroupId,
                data: { label: (<div><strong>{eventTitle}</strong><br/><span className="text-xs text-gray-400">{eventTime}</span><hr className="my-2 border-cyberpunk-secondary/30"/><p className="text-xs font-mono whitespace-pre-wrap overflow-auto" style={{maxHeight: '80px'}}>{details.substring(0,250)}{details.length > 250 ? '...':''}</p></div>) },
                position: { x: (index % 2 === 0 ? 50 : 550), y: yPos },
                style: ENTITY_STYLES.EVENT_GROUP,
                type: 'default',
            });

            const { childNodes, childEdges, nextNodeId } = extractEntitiesAndActions(details, eventGroupId, nodeIdCounter);
            nodes.push(...childNodes);
            edges.push(...childEdges);
            nodeIdCounter = nextNodeId;

            if (lastEventGroupId) {
                edges.push({
                    id: `edge-event-${lastEventGroupId}-to-${eventGroupId}`,
                    source: lastEventGroupId,
                    target: eventGroupId,
                    animated: true,
                    style: { stroke: '#f72585', strokeWidth: 2.5, filter: 'drop-shadow(0 0 3px #f72585)' },
                    markerEnd: { type: 'arrowclosed', color: '#f72585', width: 20, height: 20 },
                });
            }
            lastEventGroupId = eventGroupId;
            const numChildRows = Math.max(1, Math.ceil(childNodes.length / 2));
            yPos += ENTITY_STYLES.EVENT_GROUP.padding * 2 + 80 + (numChildRows * 40) + 50; // Base height + details + child nodes + gap
        });
    }

    const may1819SectionMatch = markdownContent.match(/### May 18-19, 2025([\s\S]*?)## Technical Analysis/s);
    if (may1819SectionMatch && may1819SectionMatch[1] && lastEventGroupId) {
        const details = may1819SectionMatch[1].trim().replace(/^- /gm, '');
        const eventGroupId = `event-group-${nodeIdCounter++}`;
        nodes.push({
            id: eventGroupId,
            data: { label: (<div><strong>Continued Activity (May 18-19)</strong><hr className="my-2 border-cyberpunk-secondary/30"/><p className="text-xs font-mono whitespace-pre-wrap overflow-auto" style={{maxHeight: '80px'}}>{details.substring(0,250)}{details.length > 250 ? '...':''}</p></div>) },
            position: { x: (nodes.filter(n=>n.id.startsWith('event-group')).length % 2 === 0 ? 50 : 550), y: yPos },
            style: ENTITY_STYLES.EVENT_GROUP,
            type: 'default'
        });
        
        const { childNodes, childEdges, nextNodeId } = extractEntitiesAndActions(details, eventGroupId, nodeIdCounter);
        nodes.push(...childNodes);
        edges.push(...childEdges);
        nodeIdCounter = nextNodeId;

        edges.push({
            id: `edge-event-${lastEventGroupId}-to-${eventGroupId}`,
            source: lastEventGroupId,
            target: eventGroupId,
            animated: true,
            style: { stroke: '#f72585', strokeWidth: 2.5, filter: 'drop-shadow(0 0 3px #f72585)' },
            markerEnd: { type: 'arrowclosed', color: '#f72585', width: 20, height: 20 },
        });
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

    if (!markdown || !nodes.length) { // Added !nodes.length for better loading state
        return <div className="p-8 bg-gray-900 text-green-400 min-h-screen font-mono">Loading incident data and constructing timeline...</div>;
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
        <div className="bg-black text-cyberpunk-primary min-h-screen p-4 md:p-8 font-['Hack',_monospace]">
            <style>{`
                .react-flow__node {
                    font-family: 'Hack', monospace;
                    box-shadow: 0 0 10px #f72585, 0 0 5px #f72585 inset;
                    border-radius: 4px; /* Consistent border radius */
                }
                .react-flow__node-default {
                    /* Ensure default nodes (used for event groups) also get base styling if not overridden by type */
                     border-radius: 6px;
                }
                .react-flow__edge-path {
                    filter: drop-shadow(0 0 3px #f72585);
                }
                .react-flow__attribution { display: none; } 
                .react-flow__minimap {
                    background-color: #0d1117 !important;
                    border: 1px solid #4b5563 !important;
                }
                .react-flow__minimap-mask {
                    fill: rgba(247, 37, 133, 0.2) !important; 
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
                        linear-gradient(to right, rgba(55, 65, 81, 0.2) 1px, transparent 1px),
                        linear-gradient(to bottom, rgba(55, 65, 81, 0.2) 1px, transparent 1px);
                    background-size: 25px 25px; /* Slightly larger grid */
                }
            `}</style>
            <div className="max-w-6xl mx-auto"> {/* Increased max-width for more space */}
                <div className="prose prose-sm md:prose-base max-w-none prose-headings:font-['Orbitron',_sans-serif] prose-headings:text-cyberpunk-accent prose-a:text-cyberpunk-secondary hover:prose-a:text-cyberpunk-accent prose-strong:text-cyberpunk-primary prose-code:text-xs prose-code:bg-gray-700 prose-code:p-1 prose-code:rounded prose-pre:bg-gray-800/70 prose-pre:border prose-pre:border-gray-700 prose-pre:rounded-md prose-invert">
                    <ReactMarkdown>{preTimelineContent}</ReactMarkdown>
                </div>

                <h2 className="text-3xl md:text-4xl font-['Orbitron',_sans-serif] text-cyberpunk-accent my-10 border-b-2 border-cyberpunk-secondary/50 pb-3">
                    Deconstructed Incident Timeline
                </h2>
                {/* Increased height of ReactFlow container */}
                <div style={{ height: '1600px', border: '2px solid #f72585', borderRadius: '0.25rem', background: '#0a0d12' }} className="mb-12 shadow-2xl shadow-cyberpunk-accent/30 bg-grid-cyberpunk">
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        fitView
                        fitViewOptions={{ padding: 0.1, minZoom: 0.3 }}
                        minZoom={0.1} // Allow more zoom out
                    >
                        <Controls showInteractive={false} /> {/* Hiding interactive control for now to simplify */}
                        <MiniMap nodeStrokeWidth={3} zoomable pannable />
                        <Background variant="lines" color="rgba(247, 37, 133, 0.1)" gap={30} size={1.5} />
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