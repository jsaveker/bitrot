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
interface PagesFunctionContext<E = Env> {
    request: Request;
    env: E;
    // params: any; // Not needed for query params
    // ... other context properties
}

// Simple error response helper
const errorResponse = (message: string, status: number = 400): Response => {
    return new Response(JSON.stringify({ error: message }), {
        status: status,
        headers: { 'Content-Type': 'application/json' },
    });
};

// Import the decay router function
import { decay } from './decay';

// Handle GET requests to /rot?id=...&level=...&mode=...
export const onRequestGet: PagesFunction<Env> = async (context) => {
    const { request, env } = context;
    const url = new URL(request.url);
    const params = url.searchParams;

    const fileId = params.get('id');
    const levelStr = params.get('level');
    const mode = params.get('mode'); // Optional mode override

    // 1. Validate required parameters
    if (!fileId) {
        return errorResponse('Missing required query parameter: id', 400);
    }
    if (!levelStr) {
        return errorResponse('Missing required query parameter: level', 400);
    }

    const targetLevel = parseInt(levelStr, 10);
    if (isNaN(targetLevel) || targetLevel < 0) {
        return errorResponse('Invalid level parameter: must be a non-negative integer', 400);
    }
    if (targetLevel === 0) {
        // If level 0 requested, just redirect to the view function for simplicity
        // Or fetch and return level 0 directly - let's do that here.
        console.log(`Rot request for ID: ${fileId}, Level: 0. Fetching level 0 directly.`);
    } else {
        console.log(`Rot request for ID: ${fileId}, Level: ${targetLevel}, Mode: ${mode || 'default'}`);
    }

    try {
        // 2. Fetch metadata (needed for filename, mime type, default mode)
        const metadataString = await env.BITROT_KV.get(fileId);
        if (!metadataString) {
            return errorResponse(`File metadata not found for ID: ${fileId}`, 404);
        }
        const metadata: FileMetadata = JSON.parse(metadataString);

        // Use provided mode or default from metadata
        const decayMode = mode || metadata.decayMode;

        // 3. Fetch original level 0 data from R2
        const r2KeyLevel0 = `${fileId}/level_0`;
        console.log(`Fetching R2 object: ${r2KeyLevel0}`);
        const r2Object = await env.BITROT_R2.get(r2KeyLevel0);

        if (!r2Object) {
            return errorResponse(`Original file data (level 0) not found for ID ${fileId}`, 404);
        }
        
        let currentData = await r2Object.arrayBuffer();

        // 4. Iteratively apply decay if targetLevel > 0
        if (targetLevel > 0) {
             console.log(`Applying decay iteratively up to level ${targetLevel} using mode '${decayMode}'`);
             for (let i = 0; i < targetLevel; i++) {
                 currentData = await decay(currentData, decayMode, i);
                 if (currentData.byteLength === 0 && r2Object.size !== 0) {
                     throw new Error(`Decay resulted in empty data at intermediate level ${i + 1}`);
                 }
             }
             console.log(`Finished applying decay up to level ${targetLevel}`);
        }

        // 5. Return the final decayed data
        const headers = new Headers();
        headers.set('Content-Type', metadata.mimeType || 'application/octet-stream');
        headers.set('Content-Length', currentData.byteLength.toString());
        const downloadFilename = `${metadata.filename.replace(/(\.[^.]+)$/, '')}_rot_level${targetLevel}$1`;
        headers.set('Content-Disposition', `attachment; filename="${downloadFilename}"`); // Force download for rot

        return new Response(currentData, {
            headers: headers,
        });

    } catch (e) {
        console.error(`Rot error for ID ${fileId}:`, e);
        if (e instanceof Error) {
             return errorResponse(`Failed to generate decayed file: ${e.message}`, 500);
        }
         return errorResponse('Failed to generate decayed file due to an unknown error', 500);
    }
}; 