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
    USER: { background: '#3182CE', color: 'white', border: '1px solid #2B6CB0', padding: '4px 7px', fontSize: '0.7rem', whiteSpace: 'normal', wordBreak: 'break-all', maxWidth: '300px' },
    HOST: { background: '#C53030', color: 'white', border: '1px solid #9B2C2C', padding: '4px 7px', fontSize: '0.7rem', whiteSpace: 'normal', wordBreak: 'break-all', maxWidth: '300px' },
    PROCESS: { background: '#2F855A', color: 'white', border: '1px solid #276749', padding: '4px 7px', fontSize: '0.7rem', whiteSpace: 'normal', wordBreak: 'break-all', maxWidth: '300px' },
    FILE: { background: '#B83280', color: 'white', border: '1px solid #8D2460', padding: '4px 7px', fontSize: '0.7rem', whiteSpace: 'normal', wordBreak: 'break-all', maxWidth: '300px' },
    IP_ADDRESS: { background: '#D69E2E', color: 'white', border: '1px solid #B7791F', padding: '4px 7px', fontSize: '0.7rem', whiteSpace: 'normal', wordBreak: 'break-all', maxWidth: '300px' },
    REG_KEY: { background: '#6B46C1', color: 'white', border: '1px solid #553C9A', padding: '4px 7px', fontSize: '0.7rem', whiteSpace: 'normal', wordBreak: 'break-all', maxWidth: '300px' },
    COMMAND: { background: '#00A0B0', color: 'white', border: '1px solid #007A87', padding: '4px 7px', fontSize: '0.7rem', whiteSpace: 'normal', wordBreak: 'break-all', maxWidth: '300px' },
    DEFAULT_ENTITY: { background: '#4A5568', color: 'white', border: '1px solid #2D3748', padding: '4px 7px', fontSize: '0.7rem', whiteSpace: 'normal', wordBreak: 'break-all', maxWidth: '300px' },
    EVENT_GROUP: {
        background: 'rgba(26, 32, 44, 0.9)', // Slightly transparent
        color: '#E2E8F0',
        border: '2px solid #f72585',
        boxShadow: '0 0 12px rgba(247, 37, 133, 0.7)',
        padding: '15px',
        width: 450, // Increased width
        fontSize: '1rem',
        borderRadius: '8px',
    },
    // ACTION style can be added if action nodes are implemented
};

const extractEntitiesAndActions = (textBlock, parentNodeId, nodeIdCounterStart) => {
    const childNodes = [];
    const childEdges = [];
    let localNodeId = nodeIdCounterStart;
    let childYOffset = 30; // Start Y for the first child node, relative to parent's label area
    const childXOffset = 15; // Consistent X offset for children
    let totalChildrenHeight = 0;
    const childNodeSpacing = 5; // Vertical space between child nodes
    const baseChildNodeHeight = 30; // Approximate height for a single line child node

    const patterns = {
        USER: /User `([^`]+)`/g,
        HOST: /host `([^`]+)`/g,
        IP_ADDRESS: /(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(?::\d{1,5})?)/g,
        FILE: /([A-Za-z]:\\[^\s:`*?"<>|(),]+)|(\/[^\s:`*?"<>|(),]+)/g,
        PROCESS: /([a-zA-Z0-9_-]+\.exe)/g,
        REG_KEY: /HK[LMU]{1,2}\\[^\s(),]+/g,
        COMMAND: /(powershell\.exe|cmd\.exe)[^\n]*?(?=\n\n|- |\*\*|$)/ig,
    };

    const addedEntities = new Set(); // To avoid duplicate entity nodes from the same block

    for (const type in patterns) {
        let match;
        while ((match = patterns[type].exec(textBlock)) !== null) {
            const value = (type === 'FILE' ? (match[1] || match[2]) : match[1] || match[0]).trim();
            if (value.length < 4 && type !== 'USER') continue;
            if (addedEntities.has(value)) continue; // Check if this entity string has already been added

            addedEntities.add(value);
            const id = `detail-node-${localNodeId++}`;
            
            // Estimate node height based on text length
            const estimatedLines = Math.ceil(value.length / 35); // Approx 35 chars per line in small font
            const nodeHeight = Math.max(baseChildNodeHeight, estimatedLines * 15 + 10); // 15px per line + padding

            childNodes.push({
                id,
                data: { label: value },
                position: { x: childXOffset, y: childYOffset },
                style: { ...ENTITY_STYLES[type] || ENTITY_STYLES.DEFAULT_ENTITY, height: `${nodeHeight}px` },
                parentNode: parentNodeId,
                extent: 'parent', // Confines to parent
                draggable: true,
            });
            childEdges.push({
                id: `edge-${parentNodeId}-detail-${id}`,
                source: parentNodeId, // Edge from parent to child
                target: id,
                style: { stroke: '#4A5568', strokeWidth: 1 },
            });
            childYOffset += nodeHeight + childNodeSpacing;
            totalChildrenHeight += nodeHeight + childNodeSpacing;
        }
    }
    return { childNodes, childEdges, nextNodeId: localNodeId, totalChildrenHeight };
};

const parseTimelineToFlow = (markdownContent) => {
    const nodes = [];
    const edges = [];
    let yPos = 50;
    let nodeIdCounter = 1;
    let lastEventGroupId = null;

    const eventGroupHeaderHeight = 80; // Approx height for title, time, and summary text in event group
    const eventGroupPadding = 15; // From ENTITY_STYLES.EVENT_GROUP.padding
    const eventGroupGap = 80; // Gap between event groups

    const timelineSectionMatch = markdownContent.match(/### May 17, 2025([\s\S]*?)### May 18-19, 2025/);

    if (timelineSectionMatch && timelineSectionMatch[1]) {
        const may17EventsText = timelineSectionMatch[1];
        const events = may17EventsText.trim().split(/\r?\n#### /);

        events.forEach((eventBlock, index) => {
            if (!eventBlock.trim()) return;
            const currentEventBlock = index === 0 && !eventBlock.startsWith('####') && events.length > 1 ? eventBlock : eventBlock;
            const lines = currentEventBlock.trim().split(/\r?\n/);
            const titleLine = lines[0].replace(/^####\s*/, '');
            const detailsForSummary = lines.slice(1).join('\n').trim(); // Full details for entity extraction
            const summaryText = detailsForSummary.substring(0, 120) + (detailsForSummary.length > 120 ? '...' : '');


            const titleMatch = titleLine.match(/^([^\(]+)\(([^\)]+)\)/);
            let eventTitle = titleLine;
            let eventTime = '';
            if (titleMatch) {
                eventTitle = titleMatch[1].trim();
                try {
                     eventTime = new Date(Date.UTC(2025, 4, 17, ...titleMatch[2].match(/(\d+)/g).map(Number))).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'UTC' });
                } catch (e) { console.error("Error parsing time:", titleMatch[2], e); }
            }

            const eventGroupId = `event-group-${nodeIdCounter++}`;
            const { childNodes, childEdges, nextNodeId, totalChildrenHeight } = extractEntitiesAndActions(detailsForSummary, eventGroupId, nodeIdCounter);
            nodeIdCounter = nextNodeId;
            
            const eventGroupCalculatedHeight = eventGroupHeaderHeight + totalChildrenHeight + (eventGroupPadding * 2);

            nodes.push({
                id: eventGroupId,
                data: { label: (<div><strong>{eventTitle}</strong><br/><span className="text-xs text-gray-400">{eventTime}</span><hr className="my-2 border-cyberpunk-secondary/30"/><p className="text-xs font-mono whitespace-pre-wrap overflow-auto" style={{maxHeight: '60px'}}>{summaryText}</p></div>) },
                position: { x: (index % 2 === 0 ? 50 : 600), y: yPos }, // Increased X spacing for staggering
                style: { ...ENTITY_STYLES.EVENT_GROUP, height: `${eventGroupCalculatedHeight}px` },
                type: 'default',
            });

            nodes.push(...childNodes.map(cn => ({...cn, position: {...cn.position, y: cn.position.y + eventGroupHeaderHeight - 20 } }))); // Adjust child Y relative to parent content
            edges.push(...childEdges);

            if (lastEventGroupId) {
                edges.push({
                    id: `edge-event-${lastEventGroupId}-to-${eventGroupId}`,
                    source: lastEventGroupId,
                    target: eventGroupId,
                    animated: true,
                    style: { stroke: '#f72585', strokeWidth: 3, filter: 'drop-shadow(0 0 4px #f72585)' },
                    markerEnd: { type: 'arrowclosed', color: '#f72585', width: 25, height: 25 },
                    type: 'smoothstep',
                });
            }
            lastEventGroupId = eventGroupId;
            yPos += eventGroupCalculatedHeight + eventGroupGap;
        });
    }

    const may1819SectionMatch = markdownContent.match(/### May 18-19, 2025([\s\S]*?)## Technical Analysis/s);
    if (may1819SectionMatch && may1819SectionMatch[1] && lastEventGroupId) {
        const detailsForSummary = may1819SectionMatch[1].trim().replace(/^- /gm, '');
        const summaryText = detailsForSummary.substring(0, 120) + (detailsForSummary.length > 120 ? '...' : '');
        const eventGroupId = `event-group-${nodeIdCounter++}`;

        const { childNodes, childEdges, nextNodeId, totalChildrenHeight } = extractEntitiesAndActions(detailsForSummary, eventGroupId, nodeIdCounter);
        nodeIdCounter = nextNodeId;
        const eventGroupCalculatedHeight = eventGroupHeaderHeight + totalChildrenHeight + (eventGroupPadding * 2);

        nodes.push({
            id: eventGroupId,
            data: { label: (<div><strong>Continued Activity (May 18-19)</strong><hr className="my-2 border-cyberpunk-secondary/30"/><p className="text-xs font-mono whitespace-pre-wrap overflow-auto" style={{maxHeight: '60px'}}>{summaryText}</p></div>) },
            position: { x: (nodes.filter(n=>n.id.startsWith('event-group')).length % 2 === 0 ? 50 : 600), y: yPos },
            style: { ...ENTITY_STYLES.EVENT_GROUP, height: `${eventGroupCalculatedHeight}px` },
            type: 'default'
        });
        
        nodes.push(...childNodes.map(cn => ({...cn, position: {...cn.position, y: cn.position.y + eventGroupHeaderHeight - 20 } })));
        edges.push(...childEdges);

        edges.push({
            id: `edge-event-${lastEventGroupId}-to-${eventGroupId}`,
            source: lastEventGroupId,
            target: eventGroupId,
            animated: true,
            style: { stroke: '#f72585', strokeWidth: 3, filter: 'drop-shadow(0 0 4px #f72585)' },
            markerEnd: { type: 'arrowclosed', color: '#f72585', width: 25, height: 25 },
            type: 'smoothstep',
        });
         yPos += eventGroupCalculatedHeight + eventGroupGap; // Add this line
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
    const onConnect = useCallback((connection) => setEdges((eds) => addEdge({ ...connection, type: 'smoothstep', animated: true, style: {stroke: '#f72585'} }, eds)), []);


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
                    /* box-shadow: 0 0 10px #f72585, 0 0 5px #f72585 inset; */ /* Moved specific shadow to EVENT_GROUP */
                    border-radius: 6px; 
                }
                .react-flow__node-default {
                     border-radius: 8px; /* For Event Group */
                }
                .react-flow__edge-path {
                    /* filter: drop-shadow(0 0 3px #f72585); Removed, direct style on edge */
                }
                .react-flow__attribution { display: none; } 
                .react-flow__minimap {
                    background-color: rgba(13, 17, 23, 0.8) !important;
                    border: 1px solid #f72585 !important;
                }
                .react-flow__minimap-mask {
                    fill: rgba(247, 37, 133, 0.3) !important; 
                }
                .react-flow__controls-button {
                    background-color: rgba(31, 41, 55, 0.8) !important;
                    border-bottom: 1px solid #4b5563 !important;
                    fill: #9ca3af !important;
                     box-shadow: 0 0 5px rgba(247, 37, 133, 0.5);
                }
                 .react-flow__controls-button:hover {
                    background-color: #374151 !important;
                }
                .bg-grid-cyberpunk {
                    background-image: 
                        linear-gradient(to right, rgba(247, 37, 133, 0.08) 1px, transparent 1px),
                        linear-gradient(to bottom, rgba(247, 37, 133, 0.08) 1px, transparent 1px);
                    background-size: 30px 30px; 
                }
            `}</style>
            <div className="max-w-6xl mx-auto"> 
                <div className="prose prose-sm md:prose-base max-w-none prose-headings:font-['Orbitron',_sans-serif] prose-headings:text-cyberpunk-accent prose-a:text-cyberpunk-secondary hover:prose-a:text-cyberpunk-accent prose-strong:text-cyberpunk-primary prose-code:text-xs prose-code:bg-gray-700 prose-code:p-1 prose-code:rounded prose-pre:bg-gray-800/70 prose-pre:border prose-pre:border-gray-700 prose-pre:rounded-md prose-invert">
                    <ReactMarkdown>{preTimelineContent}</ReactMarkdown>
                </div>

                <h2 className="text-3xl md:text-4xl font-['Orbitron',_sans-serif] text-cyberpunk-accent my-10 border-b-2 border-cyberpunk-secondary/50 pb-3">
                    Deconstructed Incident Timeline
                </h2>
                <div style={{ height: '2000px', border: '2px solid #f72585', borderRadius: '0.375rem', background: 'rgba(10, 13, 18, 0.95)' }} className="mb-12 shadow-2xl shadow-cyberpunk-accent/50 bg-grid-cyberpunk overflow-hidden">
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        fitView
                        fitViewOptions={{ padding: 0.2, minZoom: 0.2 }} // Adjusted padding and minZoom
                        minZoom={0.05} 
                        nodeOrigin={[0.5, 0.5]} // Center child nodes if using parent extent
                        defaultEdgeOptions={{ type: 'smoothstep', animated: true, style:{ strokeWidth: 2, stroke: '#f72585'}}}
                    >
                        <Controls showInteractive={false} /> 
                        <MiniMap nodeStrokeWidth={3} zoomable pannable />
                        {/* <Background variant="lines" color="rgba(247, 37, 133, 0.1)" gap={30} size={1.5} /> */}
                        {/* Background is now done by bg-grid-cyberpunk */}
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