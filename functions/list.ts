// Define the expected environment variables from wrangler.toml
interface Env {
    BITROT_KV: KVNamespace;
    BITROT_R2: R2Bucket; // Keep R2 definition for potential future use in other functions
}

// Define the structure for file metadata stored in KV (reuse from upload.ts if possible, or define here)
interface FileMetadata {
    id: string;
    filename: string;
    mimeType: string;
    size: number;
    createdAt: string;
    // Add other fields if they exist in your KV data
}

// Define the expected request context for Pages Functions (reuse if possible)
interface PagesFunctionContext<E = Env> {
    request: Request;
    env: E;
    // ... other context properties
}

// Simple error response helper (reuse if possible)
const errorResponse = (message: string, status: number = 400): Response => {
    return new Response(JSON.stringify({ error: message }), {
        status: status,
        headers: { 'Content-Type': 'application/json' },
    });
};

// Main function handler for GET requests to /list
export const onRequestGet: PagesFunction<Env> = async (context) => {
    const { env } = context;

    try {
        console.log('Listing keys from BITROT_KV...');
        // Fetch all keys from the KV namespace. Add prefix later if needed.
        const listResult = await env.BITROT_KV.list();
        
        if (!listResult || listResult.keys.length === 0) {
            console.log('No keys found in KV.');
            return new Response(JSON.stringify([]), { // Return empty array if no files
                headers: { 'Content-Type': 'application/json' },
            });
        }

        console.log(`Found ${listResult.keys.length} keys. Fetching metadata...`);
        const metadataPromises = listResult.keys.map(key => 
            env.BITROT_KV.get(key.name)
        );
        
        const metadataValues = await Promise.all(metadataPromises);

        const files: FileMetadata[] = metadataValues
            .filter(value => value !== null) // Filter out any potential null values
            .map(value => JSON.parse(value!)) // Parse the JSON metadata
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); // Sort by newest first

        console.log(`Returning metadata for ${files.length} files.`);
        return new Response(JSON.stringify(files), {
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (e) {
        console.error('List error:', e);
        if (e instanceof Error) {
             return errorResponse(`Failed to list files: ${e.message}`, 500);
        }
         return errorResponse('Failed to list files due to an unknown error', 500);
    }
};

// Optional: Handle other methods like POST
export const onRequestPost: PagesFunction<Env> = async (context) => {
    return errorResponse('POST method not allowed for /list', 405);
}; 