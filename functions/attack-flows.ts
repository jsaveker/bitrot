interface Env {}

interface PagesFunctionContext<E = Env> {
    request: Request;
    env: E;
    params: any;
    waitUntil: (promise: Promise<any>) => void;
    next: (input?: Request | string, init?: RequestInit) => Promise<Response>;
    data: Record<string, any>;
}

const attackFlowFiles = [
    { id: 'browser_remote_debugging_flow_simple', title: 'Browser Remote Debugging Flow (Simple)' },
    { id: 'clickfix_detection_flow_detailed', title: 'ClickFix Detection Flow (Detailed)' },
    { id: 'clickfix_detection_flow_simple', title: 'ClickFix Detection Flow (Simple)' },
    { id: 'rmm_detection_flow_simple', title: 'RMM Detection Flow (Simple)' },
    // Add other HTML files from the attack-flow directory here
    // Note: We are not including 'The_Curious_Administrator.afb' as it's not an HTML file.
];

export const onRequestGet: PagesFunction<Env> = async (context) => {
    return new Response(JSON.stringify(attackFlowFiles), {
        headers: { 'Content-Type': 'application/json' },
    });
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
    });
}; 