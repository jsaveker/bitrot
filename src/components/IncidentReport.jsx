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
import { FaFileAlt, FaUser, FaNetworkWired, FaServer, FaKey, FaTerminal, FaBolt } from 'react-icons/fa'; // Example icons

const NODE_TYPE_STYLES = {
    EVENT_STAGE: {
        background: 'rgba(30, 41, 59, 0.9)', // Darker, slightly transparent
        color: '#cbd5e1', // Lighter text
        border: '2px solid #f72585',
        borderRadius: '12px',
        boxShadow: '0 0 15px rgba(247, 37, 133, 0.6), 0 0 5px rgba(247, 37, 133, 0.8) inset',
        padding: '20px',
        width: 320, // Fixed width for event stage
        textAlign: 'center',
        fontSize: '1.1rem',
    },
    ENTITY_BASE: { // Base style for all small entity nodes
        borderRadius: '8px',
        padding: '8px 12px',
        fontSize: '0.75rem',
        color: 'white',
        borderWidth: '1px',
        borderStyle: 'solid',
        boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
        display: 'flex',
        alignItems: 'center',
        gap: '6px', // Space between icon and text
        minHeight: '36px', // Ensure consistent height
        maxWidth: '220px', // Max width for entity nodes
        whiteSpace: 'normal', // Allow text wrapping
        wordBreak: 'break-all', // Break long words
    },
    USER: (label) => ({ ...NODE_TYPE_STYLES.ENTITY_BASE, background: '#3182CE', borderColor: '#2B6CB0', label: <><FaUser /> {label}</> }),
    HOST: (label) => ({ ...NODE_TYPE_STYLES.ENTITY_BASE, background: '#C53030', borderColor: '#9B2C2C', label: <><FaServer /> {label}</> }),
    PROCESS: (label) => ({ ...NODE_TYPE_STYLES.ENTITY_BASE, background: '#2F855A', borderColor: '#276749', label: <><FaBolt /> {label}</> }),
    FILE: (label) => ({ ...NODE_TYPE_STYLES.ENTITY_BASE, background: '#805AD5', borderColor: '#6B46C1', label: <><FaFileAlt /> {label}</> }),
    IP_ADDRESS: (label) => ({ ...NODE_TYPE_STYLES.ENTITY_BASE, background: '#DD6B20', borderColor: '#C05621', label: <><FaNetworkWired /> {label}</> }),
    REG_KEY: (label) => ({ ...NODE_TYPE_STYLES.ENTITY_BASE, background: '#D69E2E', borderColor: '#B7791F', label: <><FaKey /> {label}</> }),
    COMMAND: (label) => ({ ...NODE_TYPE_STYLES.ENTITY_BASE, background: '#00A0B0', borderColor: '#007A87', width: '280px', /* Wider for commands */ label: <><FaTerminal /> {label.substring(0, 100)}{label.length > 100 ? '...' : ''}</>}),
    DEFAULT_ENTITY: (label) => ({ ...NODE_TYPE_STYLES.ENTITY_BASE, background: '#4A5568', borderColor: '#2D3748', label: label }),
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

const parseTimelineToFlow = (markdownContent) => {
    const nodes = [];
    const edges = [];
    let yPos = 80; // Initial Y position for the first event stage
    let nodeIdCounter = 1;
    let lastEventStageNodeId = null;

    const eventStageGap = 200; // Increased vertical gap between event stages
    const entitySpreadRadius = 280; // How far entities spread from the event stage center
    const entityAngleStep = 30; // Angle step for placing entities radially

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
            const summaryText = detailsFull.substring(0, 150) + (detailsFull.length > 150 ? '...' : '');

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
            const eventStageX = (index % 2 === 0) ? 200 : 800; // Stagger event stages
            
            nodes.push({
                id: eventStageNodeId,
                data: { label: (<div><strong>{eventTitle}</strong><br/><span className="text-xs text-gray-400 mt-1">{eventTime}</span><hr className="my-2 border-cyberpunk-accent/40"/><p className="text-sm font-normal whitespace-pre-wrap" style={{maxHeight: '80px', overflowY: 'auto'}}>{summaryText}</p></div>) },
                position: { x: eventStageX, y: yPos },
                style: NODE_TYPE_STYLES.EVENT_STAGE,
                type: 'default', // Or a custom type if we add one
            });

            const extractedEntities = extractEntities(detailsFull);
            let currentAngle = -90; // Start placing entities above the event node

            extractedEntities.forEach((entity, entityIndex) => {
                const entityNodeId = `entity-${nodeIdCounter++}`;
                const styleFn = NODE_TYPE_STYLES[entity.type] || NODE_TYPE_STYLES.DEFAULT_ENTITY;
                const nodeStyle = styleFn(entity.value); // Call the function to get style and label with icon
                
                // Calculate position for entities around the event stage node
                // Simple radial layout for now, can be improved
                const entityX = eventStageX + (NODE_TYPE_STYLES.EVENT_STAGE.width / 2) + Math.cos(currentAngle * Math.PI / 180) * entitySpreadRadius - (nodeStyle.width ? nodeStyle.width / 2 : 100) ;
                const entityY = yPos + (NODE_TYPE_STYLES.EVENT_STAGE.padding) + Math.sin(currentAngle * Math.PI / 180) * (entitySpreadRadius / 1.5) ; // Y spread is less

                nodes.push({
                    id: entityNodeId,
                    data: { label: nodeStyle.label }, // Label with icon comes from styleFn
                    position: { x: entityX, y: entityY },
                    style: { ...nodeStyle, label: undefined }, // Remove label from style as it's in data
                    type: 'default', // Can be custom types later
                });
                edges.push({
                    id: `edge-${eventStageNodeId}-to-${entityNodeId}`,
                    source: eventStageNodeId,
                    target: entityNodeId,
                    type: 'smoothstep',
                    style: { stroke: '#567189', strokeWidth: 1.5, opacity: 0.8 }, // Softer edge for entities
                    animated: false,
                });
                currentAngle += entityAngleStep + (extractedEntities.length > 6 ? 0 : 10); // More spread for fewer entities
            });

            if (lastEventStageNodeId) {
                edges.push({
                    id: `edge-event-${lastEventStageNodeId}-to-${eventStageNodeId}`,
                    source: lastEventStageNodeId,
                    target: eventStageNodeId,
                    type: 'smoothstep',
                    animated: true,
                    style: { stroke: '#f72585', strokeWidth: 3.5, filter: 'drop-shadow(0 0 5px #f72585)' },
                    markerEnd: { type: 'arrowclosed', color: '#f72585', width: 20, height: 20 },
                });
            }
            lastEventStageNodeId = eventStageNodeId;
            // Adjust yPos based on a fixed height per stage + entities, or more dynamic if needed
            yPos += NODE_TYPE_STYLES.EVENT_STAGE.padding * 2 + 120 + (extractedEntities.length > 0 ? entitySpreadRadius / 1.5 + 50 : 0) + eventStageGap;
        });
    }

    // Placeholder for May 18-19 content - adapt similar logic
    const may1819SectionMatch = markdownContent.match(/### May 18-19, 2025([\s\S]*?)## Technical Analysis/s);
    if (may1819SectionMatch && may1819SectionMatch[1] && lastEventStageNodeId) {
        const detailsFull = may1819SectionMatch[1].trim().replace(/^- /gm, '');
        const summaryText = detailsFull.substring(0, 150) + (detailsFull.length > 150 ? '...' : '');
        const eventStageNodeId = `event-stage-${nodeIdCounter++}`;
        const eventStageX = (nodes.filter(n => n.id.startsWith('event-stage-')).length % 2 === 0) ? 200 : 800;

        nodes.push({
            id: eventStageNodeId,
            data: { label: (<div><strong>Continued Activity (May 18-19)</strong><hr className="my-2 border-cyberpunk-accent/40"/><p className="text-sm font-normal whitespace-pre-wrap" style={{maxHeight: '80px', overflowY: 'auto'}}>{summaryText}</p></div>) },
            position: { x: eventStageX, y: yPos },
            style: NODE_TYPE_STYLES.EVENT_STAGE,
            type: 'default',
        });

        const extractedEntities = extractEntities(detailsFull);
        let currentAngle = -90;
        extractedEntities.forEach((entity, entityIndex) => {
            const entityNodeId = `entity-${nodeIdCounter++}`;
            const styleFn = NODE_TYPE_STYLES[entity.type] || NODE_TYPE_STYLES.DEFAULT_ENTITY;
            const nodeStyle = styleFn(entity.value);
            const entityX = eventStageX + (NODE_TYPE_STYLES.EVENT_STAGE.width / 2) + Math.cos(currentAngle * Math.PI / 180) * entitySpreadRadius - (nodeStyle.width ? nodeStyle.width / 2 : 100);
            const entityY = yPos + (NODE_TYPE_STYLES.EVENT_STAGE.padding) + Math.sin(currentAngle * Math.PI / 180) * (entitySpreadRadius / 1.5);

            nodes.push({
                id: entityNodeId,
                data: { label: nodeStyle.label },
                position: { x: entityX, y: entityY },
                style: { ...nodeStyle, label: undefined },
                type: 'default',
            });
            edges.push({
                id: `edge-${eventStageNodeId}-to-${entityNodeId}`,
                source: eventStageNodeId,
                target: entityNodeId,
                type: 'smoothstep',
                style: { stroke: '#567189', strokeWidth: 1.5, opacity: 0.8 },
                animated: false,
            });
            currentAngle += entityAngleStep + (extractedEntities.length > 6 ? 0 : 10);
        });
        
        edges.push({
            id: `edge-event-${lastEventStageNodeId}-to-${eventStageNodeId}`,
            source: lastEventStageNodeId,
            target: eventStageNodeId,
            type: 'smoothstep',
            animated: true,
            style: { stroke: '#f72585', strokeWidth: 3.5, filter: 'drop-shadow(0 0 5px #f72585)' },
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
    const onConnect = useCallback((connection) => setEdges((eds) => addEdge({ ...connection, type: 'smoothstep', animated: false, style: {stroke: '#7dd3fc', strokeWidth:1.5} }, eds)), []);


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

    if (!markdown || !nodes.length) { 
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
            <style>{/* Consolidated and refined styles */`
                .react-flow__node {
                    font-family: 'Hack', monospace;
                    border-radius: 8px; 
                }
                .react-flow__attribution { display: none; } 
                .react-flow__minimap {
                    background-color: rgba(13, 17, 23, 0.9) !important;
                    border: 1px solid #f72585 !important;
                    border-radius: 4px;
                }
                .react-flow__minimap-node {
                     fill: #f72585 !important; /* Event stages in minimap */
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
                        radial-gradient(circle at 1px 1px, rgba(247, 37, 133, 0.15) 1px, transparent 0),
                        radial-gradient(circle at 15px 15px, rgba(247, 37, 133, 0.1) 1px, transparent 0);
                    background-size: 30px 30px; 
                }
            `}</style>
            <div className="max-w-full px-4 mx-auto"> {/* Full width for timeline */}
                <div className="prose prose-sm md:prose-base max-w-4xl mx-auto prose-headings:font-['Orbitron',_sans-serif] prose-headings:text-cyberpunk-accent prose-a:text-cyberpunk-secondary hover:prose-a:text-cyberpunk-accent prose-strong:text-cyberpunk-primary prose-code:text-xs prose-code:bg-gray-700 prose-code:p-1 prose-code:rounded prose-pre:bg-gray-800/70 prose-pre:border prose-pre:border-gray-700 prose-pre:rounded-md prose-invert">
                    <ReactMarkdown>{preTimelineContent}</ReactMarkdown>
                </div>

                <h2 className="text-3xl md:text-4xl font-['Orbitron',_sans-serif] text-cyberpunk-accent my-10 text-center border-b-2 border-cyberpunk-secondary/30 pb-3 max-w-4xl mx-auto">
                    Deconstructed Incident Timeline
                </h2>
                {/* Increased height significantly */}
                <div style={{ height: '2800px', border: '2px solid #f72585', borderRadius: '0.375rem', background: 'rgba(10, 13, 18, 0.98)' }} className="mb-12 shadow-2xl shadow-cyberpunk-accent/50 bg-grid-cyberpunk overflow-hidden">
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        fitView
                        fitViewOptions={{ padding: 0.15, minZoom: 0.1 }}
                        minZoom={0.05} 
                        defaultEdgeOptions={{ type: 'smoothstep' }} // defaultEdgeOptions for all edges
                    >
                        <Controls showInteractive={false} /> 
                        <MiniMap nodeColor={(node) => node.id.startsWith('event-stage-') ? '#f72585' : '#7dd3fc'} nodeStrokeWidth={2} zoomable pannable />
                        {/* Background is now done by bg-grid-cyberpunk style */}
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