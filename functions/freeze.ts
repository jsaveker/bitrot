// Define the expected environment variables from wrangler.toml
interface Env {
    BITROT_KV: KVNamespace;
    // R2 not strictly needed here, but keep for consistency?
    BITROT_R2: R2Bucket; 
}

// Define the structure for file metadata stored in KV
interface FileMetadata {
    id: string;
    filename: string;
    mimeType: string;
    size: number;
    createdAt: string;
    decayMode: string; 
    currentLevel: number;
    nextDecayAt: string | null;
}

// Define the expected request context for Pages Functions
interface PagesFunctionContext<E = Env> {
    request: Request;
    env: E;
    // ... other context properties
}

// Simple error response helper
const errorResponse = (message: string, status: number = 400): Response => {
    return new Response(JSON.stringify({ error: message }), {
        status: status,
        headers: { 'Content-Type': 'application/json' },
    });
};

// Handle POST requests to /freeze?id=...
export const onRequestPost: PagesFunction<Env> = async (context) => {
    const { request, env } = context;
    const url = new URL(request.url);
    const fileId = url.searchParams.get('id');

    if (!fileId) {
        return errorResponse('Missing required query parameter: id', 400);
    }

    console.log(`Freeze request for ID: ${fileId}`);

    try {
        // 1. Fetch current metadata from KV
        const metadataString = await env.BITROT_KV.get(fileId);
        if (!metadataString) {
            return errorResponse(`File metadata not found for ID: ${fileId}`, 404);
        }
        const metadata: FileMetadata = JSON.parse(metadataString);

        // 2. Check if already frozen
        if (metadata.nextDecayAt === null) {
            return new Response(JSON.stringify({
                message: `File ${metadata.filename} (ID: ${fileId}) is already frozen.`,
                fileId: fileId,
            }), {
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // 3. Update metadata to freeze (set nextDecayAt to null)
        const updatedMetadata: FileMetadata = {
            ...metadata,
            nextDecayAt: null, 
        };

        // 4. Put updated metadata back into KV (no expiration change needed)
        await env.BITROT_KV.put(fileId, JSON.stringify(updatedMetadata));
        console.log(`Successfully froze file ${fileId} by setting nextDecayAt to null.`);

        // 5. Return success response
        return new Response(JSON.stringify({
            message: `File ${metadata.filename} (ID: ${fileId}) has been frozen. Decay halted.`,
            fileId: fileId,
        }), {
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (e) {
        console.error(`Freeze error for ID ${fileId}:`, e);
        if (e instanceof Error) {
             return errorResponse(`Failed to freeze file: ${e.message}`, 500);
        }
         return errorResponse('Failed to freeze file due to an unknown error', 500);
    }
};

// Optional: Handle other methods like GET
export const onRequestGet: PagesFunction<Env> = async (context) => {
    return errorResponse('GET method not allowed for /freeze. Use POST.', 405);
}; 