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

// This function handles requests to /lessons ONLY.
export const onRequestGet: PagesFunction<Env> = async (context) => {
    // Since this file is functions/lessons.ts, it only matches /lessons.
    // No need to check params.path anymore.
    console.log('Request to list lessons.');
    return new Response(JSON.stringify(availableLessons), {
        headers: { 'Content-Type': 'application/json' },
    });
};

// Keep the 405 for other methods like POST
export const onRequestPost: PagesFunction<Env> = async (context) => {
    return errorResponse('Method Not Allowed', 405);
}; 