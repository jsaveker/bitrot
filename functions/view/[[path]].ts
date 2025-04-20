// Define the expected environment variables from wrangler.toml
interface Env {
    BITROT_KV: KVNamespace;
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
// Removing specific param typing due to linter issues
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

// Removing specific param typing from PagesFunction due to linter issues
export const onRequestGet: PagesFunction<Env> = async (context) => {
    const { env, params } = context;
    // Assuming params.path exists and is string[] at runtime
    const pathSegments = params.path || []; 

    if (pathSegments.length < 1 || pathSegments.length > 2) {
        return errorResponse('Invalid request path. Use /view/[id] or /view/[id]/[level]', 400);
    }
    
    const fileId = pathSegments[0];
    const requestedLevelStr = pathSegments[1];
    let targetLevel: number | undefined;

    console.log(`View request for ID: ${fileId}, Level: ${requestedLevelStr || 'latest'}`);

    try {
        // 1. Fetch metadata from KV
        const metadataString = await env.BITROT_KV.get(fileId);
        if (!metadataString) {
            return errorResponse(`File metadata not found for ID: ${fileId}`, 404);
        }
        const metadata: FileMetadata = JSON.parse(metadataString);

        // 2. Determine target level
        if (requestedLevelStr) {
            targetLevel = parseInt(requestedLevelStr, 10);
            if (isNaN(targetLevel) || targetLevel < 0 || targetLevel > metadata.currentLevel) {
                return errorResponse(`Invalid level requested. Available levels for ${fileId}: 0 to ${metadata.currentLevel}`, 400);
            }
        } else {
            targetLevel = metadata.currentLevel; // Default to latest
        }

        // 3. Construct R2 key and fetch object
        const r2Key = `${fileId}/level_${targetLevel}`;
        console.log(`Fetching R2 object: ${r2Key}`);
        const r2Object = await env.BITROT_R2.get(r2Key);

        if (!r2Object) {
            // This might happen if data exists in KV but not R2 (e.g., failed cron?)
            return errorResponse(`File data not found in storage for ID ${fileId}, Level ${targetLevel}`, 404);
        }

        // 4. Return the file data with correct headers
        const headers = new Headers();
        headers.set('Content-Type', metadata.mimeType || 'application/octet-stream');
        headers.set('Content-Length', r2Object.size.toString());
        // Suggest filename for download, including the level
        const downloadFilename = `${metadata.filename.replace(/(\.[^.]+)$/, '')}_level${targetLevel}$1`;
        headers.set('Content-Disposition', `inline; filename="${downloadFilename}"`); // Try inline first, fallback to download
        // Add cache control? ETag?
        // headers.set('ETag', r2Object.httpEtag); 

        return new Response(r2Object.body, {
            headers: headers,
        });

    } catch (e) {
        console.error(`View error for ID ${fileId}:`, e);
        if (e instanceof Error) {
             return errorResponse(`Failed to retrieve file: ${e.message}`, 500);
        }
         return errorResponse('Failed to retrieve file due to an unknown error', 500);
    }
}; 