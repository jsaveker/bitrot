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

// Handle GET requests to /lessons or /lessons/[lesson-id]
export const onRequestGet: PagesFunction<Env> = async (context) => {
    const { request, params } = context;
    const pathSegments = params.path || [];

    if (pathSegments.length === 0) {
        // List available lessons
        console.log('Request to list lessons.');
        return new Response(JSON.stringify(availableLessons), {
            headers: { 'Content-Type': 'application/json' },
        });
    } else if (pathSegments.length === 1) {
        // Fetch specific lesson
        const lessonId = pathSegments[0];
        console.log(`Request for lesson: ${lessonId}`);

        // Find the lesson in our hardcoded list
        const lessonInfo = availableLessons.find(l => l.id === lessonId);
        if (!lessonInfo) {
            return errorResponse(`Lesson not found: ${lessonId}`, 404);
        }

        try {
            // Construct the URL to the static text file in /public
            const lessonUrl = new URL(`/lessons/${lessonId}.txt`, request.url);
            console.log(`Fetching lesson content from: ${lessonUrl.pathname}`);

            // Use fetch to get the static asset content via the Pages deployment
            const response = await fetch(lessonUrl.toString());

            if (!response.ok) {
                console.error(`Failed to fetch lesson ${lessonId}.txt: Status ${response.status}`);
                return errorResponse(`Could not load lesson content for: ${lessonId}`, 500);
            }

            // Return the plain text content
            const lessonContent = await response.text();
            return new Response(lessonContent, {
                headers: { 'Content-Type': 'text/plain; charset=utf-8' },
            });

        } catch (e) {
            console.error(`Error fetching lesson ${lessonId}:`, e);
            return errorResponse('Failed to retrieve lesson content due to an unknown error', 500);
        }
    } else {
        return errorResponse('Invalid request path. Use /lessons or /lessons/[lesson-id]', 400);
    }
}; 