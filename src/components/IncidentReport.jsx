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
import { FaFileAlt, FaUser, FaNetworkWired, FaServer, FaKey, FaTerminal, FaBolt } from 'react-icons/fa'; // Example icons
import dagre from 'dagre';

const NODE_WIDTH_EVENT = 350;
const NODE_HEIGHT_EVENT_BASE = 120; // Base height for event title, time, summary
const NODE_WIDTH_ENTITY = 200;
const NODE_HEIGHT_ENTITY = 50; // Approx height for entity nodes with icons

const NODE_TYPE_STYLES = {
    EVENT_STAGE: {
        background: 'rgba(30, 41, 59, 0.95)',
        color: '#e2e8f0',
        border: '2px solid #f72585',
        borderRadius: '10px',
        boxShadow: '0 0 12px rgba(247, 37, 133, 0.7), 0 0 4px rgba(247, 37, 133, 0.6) inset',
        padding: '15px',
        width: NODE_WIDTH_EVENT,
        textAlign: 'left',
        fontSize: '1rem',
    },
    ENTITY_BASE: {
        borderRadius: '6px',
        padding: '6px 10px',
        fontSize: '0.7rem',
        color: 'white',
        borderWidth: '1px',
        borderStyle: 'solid',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
        height: NODE_HEIGHT_ENTITY,
        width: NODE_WIDTH_ENTITY,
        whiteSpace: 'normal',
        wordBreak: 'break-word',
        justifyContent: 'flex-start',
    },
    USER: (label) => ({ ...NODE_TYPE_STYLES.ENTITY_BASE, background: '#3182CE', borderColor: '#2B6CB0', label: <><FaUser className="mr-1 flex-shrink-0" /> <span className="truncate" title={label}>{label}</span></> }),
    HOST: (label) => ({ ...NODE_TYPE_STYLES.ENTITY_BASE, background: '#C53030', borderColor: '#9B2C2C', label: <><FaServer className="mr-1 flex-shrink-0" /> <span className="truncate" title={label}>{label}</span></> }),
    PROCESS: (label) => ({ ...NODE_TYPE_STYLES.ENTITY_BASE, background: '#2F855A', borderColor: '#276749', label: <><FaBolt className="mr-1 flex-shrink-0" /> <span className="truncate" title={label}>{label}</span></> }),
    FILE: (label) => ({ ...NODE_TYPE_STYLES.ENTITY_BASE, background: '#805AD5', borderColor: '#6B46C1', label: <><FaFileAlt className="mr-1 flex-shrink-0" /> <span className="truncate" title={label}>{label}</span></> }),
    IP_ADDRESS: (label) => ({ ...NODE_TYPE_STYLES.ENTITY_BASE, background: '#DD6B20', borderColor: '#C05621', label: <><FaNetworkWired className="mr-1 flex-shrink-0" /> <span className="truncate" title={label}>{label}</span></> }),
    REG_KEY: (label) => ({ ...NODE_TYPE_STYLES.ENTITY_BASE, background: '#D69E2E', borderColor: '#B7791F', label: <><FaKey className="mr-1 flex-shrink-0" /> <span className="truncate" title={label}>{label}</span></> }),
    COMMAND: (label) => ({ ...NODE_TYPE_STYLES.ENTITY_BASE, background: '#00A0B0', borderColor: '#007A87', width: 280, label: <><FaTerminal className="mr-1 flex-shrink-0" /> <span className="truncate" title={label}>{label.substring(0, 70)}{label.length > 70 ? '...' : ''}</span></>}),
    DEFAULT_ENTITY: (label) => ({ ...NODE_TYPE_STYLES.ENTITY_BASE, background: '#4A5568', borderColor: '#2D3748', label: <span className="truncate" title={label}>{label}</span> }),
};

const extractEntities = (textBlock) => {
    const entities = [];
    const patterns = {
        USER: /User `([^`]+)`/g,
        HOST: /host `([^`]+)`/g,
        IP_ADDRESS: /(\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}(?::[0-9]{1,5})?\b)/g, // Stricter IP regex
        FILE: /(\b[A-Za-z]:\\[^\s:`*?"<>|(),]+(?:\.[a-zA-Z0-9]+)?\b)|(\b\/[^\s:`*?"<>|(),]+\b)/g,
        PROCESS: /(\b[a-zA-Z0-9_-]+\.exe\b)/g,
        REG_KEY: /(HK[LMU]{1,2}\\[^\s(),;:!"]+)/g,
        COMMAND: /(powershell\.exe|cmd\.exe)[^\n]*(?:\n(?!\s*[-*>]))*/ig, // Capture multi-line better
    };
    const addedValues = new Set(); // Avoid duplicate entities from the same block

    for (const type in patterns) {
        let match;
        while ((match = patterns[type].exec(textBlock)) !== null) {
            const value = (type === 'FILE' ? (match[1] || match[2]) : match[1] || match[0]).trim();
            if (value.length < 4 && type !== 'USER' && type !== 'IP_ADDRESS') continue;
            if (addedValues.has(value + type)) continue; // Avoid exact same entity string + type
            
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
            const eventNodeHeight = NODE_HEIGHT_EVENT_BASE + Math.max(0, Math.ceil(summaryText.length / 40) - 2) * 20; // Adjust height for summary

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

    // Simplified May 18-19 section, similar logic to above
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

    const onNodesChange = useCallback((changes) => setLayoutedNodes((nds) => applyNodeChanges(changes, nds)), []);
    const onEdgesChange = useCallback((changes) => setLayoutedEdges((eds) => applyEdgeChanges(changes, eds)), []);
    const onConnect = useCallback((connection) => setLayoutedEdges((eds) => addEdge({ ...connection, type: 'smoothstep', style:{stroke: '#7dd3fc', strokeWidth:1.5}, markerEnd: {type: MarkerType.ArrowClosed, color: '#7dd3fc'} }, eds)), []);

    useLayoutEffect(() => {
        if (markdown && !error) {
            const { nodes: parsedNodes, edges: parsedEdges } = parseTimelineToFlow(markdown);
            if (parsedNodes.length > 0) {
                const laidoutNodes = getLayoutedElements(parsedNodes, parsedEdges, 'TB');
                setLayoutedNodes(laidoutNodes);
                setLayoutedEdges(parsedEdges); // Edges don't change position from Dagre, only nodes
            }
        }
    }, [markdown, error]);

    useEffect(() => {
        fetch('/incident/signal_analysis_2025_05_17_to_19.md')
            .then(res => {
                if (!res.ok) throw new Error(`Failed to load incident report: ${res.status}`);
                return res.text();
            })
            .then(text => setMarkdown(text))
            .catch(err => {
                console.error("Error fetching incident report:", err);
                setError(err.message);
            });
    }, []);

    if (error) {
        return <div className="p-8 bg-gray-900 text-red-500 min-h-screen font-mono">Error: {error}</div>;
    }

    if (!layoutedNodes.length) { 
        return <div className="p-8 bg-gray-900 text-green-400 min-h-screen font-mono">Deconstructing timeline from signal fragments...</div>;
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
                    border-radius: 8px;
                    /* Default node styles, specific styles in NODE_TYPE_STYLES will override */
                }
                .react-flow__attribution { display: none; } 
                .react-flow__minimap {
                    background-color: rgba(13, 17, 23, 0.9) !important;
                    border: 1px solid #f72585 !important;
                    border-radius: 4px;
                }
                .react-flow__minimap-node {
                     fill: #f72585 !important; 
                     stroke: none !important;
                }
                .react-flow__minimap-mask {
                    fill: rgba(247, 37, 133, 0.25) !important; 
                }
                .react-flow__controls {
                    box-shadow: 0 0 10px rgba(247, 37, 133, 0.5);
                    border-radius: 6px;
                    overflow: hidden;
                }
                .react-flow__controls-button {
                    background-color: rgba(30, 41, 59, 0.9) !important;
                    border-bottom: 1px solid #4b5563 !important;
                    fill: #9ca3af !important;
                }
                .react-flow__controls-button:hover {
                    background-color: #374151 !important;
                }
                .bg-grid-cyberpunk {
                    background-image: 
                        radial-gradient(circle at 1px 1px, rgba(247, 37, 133, 0.10) 1px, transparent 0),
                        radial-gradient(circle at 15px 15px, rgba(247, 37, 133, 0.08) 1px, transparent 0);
                    background-size: 30px 30px; 
                }
                .truncate {
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    display: inline-block; /* or block */
                    max-width: 90%; /* Adjust as needed relative to icon */
                }
            `}</style>
            <div className="max-w-full px-2 mx-auto"> 
                <div className="prose prose-sm md:prose-base max-w-4xl mx-auto prose-headings:font-['Orbitron',_sans-serif] prose-headings:text-cyberpunk-accent prose-a:text-cyberpunk-secondary hover:prose-a:text-cyberpunk-accent prose-strong:text-cyberpunk-primary prose-code:text-xs prose-code:bg-gray-700 prose-code:p-1 prose-code:rounded prose-pre:bg-gray-800/70 prose-pre:border prose-pre:border-gray-700 prose-pre:rounded-md prose-invert">
                    <ReactMarkdown>{preTimelineContent}</ReactMarkdown>
                </div>

                <h2 className="text-3xl md:text-4xl font-['Orbitron',_sans-serif] text-cyberpunk-accent my-10 text-center border-b-2 border-cyberpunk-secondary/30 pb-3 max-w-4xl mx-auto">
                    Deconstructed Incident Timeline
                </h2>
                <div style={{ width: '100%', height: '2500px', border: '2px solid #f72585', borderRadius: '0.375rem', background: 'rgba(10, 13, 18, 0.98)' }} className="mb-12 shadow-2xl shadow-cyberpunk-accent/50 bg-grid-cyberpunk overflow-hidden">
                    <ReactFlow
                        nodes={layoutedNodes}
                        edges={layoutedEdges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        fitView
                        fitViewOptions={{ padding: 0.1, duration: 800 }}
                        minZoom={0.05} 
                        defaultEdgeOptions={{ type: 'smoothstep'}} 
                    >
                        <Controls showInteractive={false} /> 
                        <MiniMap nodeColor={(node) => node.id.startsWith('event-stage-') ? '#f72585' : '#7dd3fc'} nodeStrokeWidth={2} zoomable pannable />
                    </ReactFlow>
                </div>
                
                <div className="prose prose-sm md:prose-base max-w-4xl mx-auto prose-headings:font-['Orbitron',_sans-serif] prose-headings:text-cyberpunk-accent prose-a:text-cyberpunk-secondary hover:prose-a:text-cyberpunk-accent prose-strong:text-cyberpunk-primary prose-code:text-xs prose-code:bg-gray-700 prose-code:p-1 prose-code:rounded prose-pre:bg-gray-800/70 prose-pre:border prose-pre:border-gray-700 prose-pre:rounded-md prose-invert">
                    <ReactMarkdown>{technicalAnalysisAndBeyond}</ReactMarkdown>
                </div>

                <Link to="/" className="mt-12 mb-8 block w-max mx-auto text-sm text-cyberpunk-secondary hover:text-white hover:bg-cyberpunk-accent px-4 py-2 border border-cyberpunk-secondary hover:border-cyberpunk-accent transition-all duration-150 rounded-md shadow-md hover:shadow-lg hover:shadow-cyberpunk-accent/50">
                    &lt; Return to Mainframe Analysis
                </Link>
            </div>
        </div>
    );
};

export default IncidentReport; 