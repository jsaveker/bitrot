// Define the expected environment variables (none needed for lessons)
interface Env {}

// Define the expected request context for Pages Functions
interface PagesFunctionContext<E = Env> {
    request: Request;
    env: E;
    params: any; // Use any for params to bypass linter errors
    waitUntil: (promise: Promise<any>) => void;
    next: (input?: Request | string, init?: RequestInit) => Promise<Response>;
    data: Record<string, any>;
}

// Simple error response helper
const errorResponse = (message: string, status: number = 400): Response => {
    return new Response(JSON.stringify({ error: message }), {
        status: status,
        headers: { 'Content-Type': 'application/json' },
    });
};

// Hardcoded list of lessons for now
const availableLessons = [
    { id: '1-checksums', title: 'What\'s a Checksum?' },
    { id: '2-backups', title: 'Backups - The Ultimate Defense' },
];

// This function now ONLY handles requests to /lessons
export const onRequestGet: PagesFunction<Env> = async (context) => {
    const { request, params } = context;
    // Check if there are any path segments. The route is [[path]].ts, so 
    // params.path will exist if the path is not exactly /lessons
    const pathSegments = params.path;

    if (pathSegments && pathSegments.length > 0) {
        // Any path other than /lessons is invalid for this function now
        return errorResponse('Invalid request path. Use /lessons to list topics.', 400);
    } else {
        // List available lessons (path is exactly /lessons)
        console.log('Request to list lessons.');
        return new Response(JSON.stringify(availableLessons), {
            headers: { 'Content-Type': 'application/json' },
        });
    }
};

// Optional: Add onRequestPost or others if needed, returning 405 Method Not Allowed
export const onRequestPost: PagesFunction<Env> = async (context) => {
    return errorResponse('Method Not Allowed', 405);
}; 