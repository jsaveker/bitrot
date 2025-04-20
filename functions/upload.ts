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
    createdAt: string; // ISO 8601 format
    decayMode: string; // e.g., 'bit-flip' (default for now)
    currentLevel: number;
    nextDecayAt: string | null; // ISO 8601 format, null if frozen
}

// Define the expected request context for Pages Functions
interface PagesFunctionContext<E = Env> {
    request: Request;
    env: E;
    params: Record<string, string>;
    waitUntil: (promise: Promise<any>) => void;
    next: (input?: Request | string, init?: RequestInit) => Promise<Response>;
    data: Record<string, any>; // For passing data between middleware
}

// Simple error response helper
const errorResponse = (message: string, status: number = 400): Response => {
    return new Response(JSON.stringify({ error: message }), {
        status: status,
        headers: { 'Content-Type': 'application/json' },
    });
};

// Main function handler for POST requests to /upload
export const onRequestPost: PagesFunction<Env> = async (context) => {
    const { request, env } = context;

    // 1. Check content type
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
        return errorResponse('Content-Type must be multipart/form-data');
    }

    try {
        // 2. Parse form data
        const formData = await request.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return errorResponse('No file uploaded or incorrect form field name (expected \'file\')');
        }
        if (file.size === 0) {
            return errorResponse('Uploaded file is empty');
        }
        
        // Add explicit size limit check (5 MB)
        const MAX_SIZE_BYTES = 5 * 1024 * 1024; 
        if (file.size > MAX_SIZE_BYTES) {
           const maxSizeMB = (MAX_SIZE_BYTES / 1024 / 1024).toFixed(1);
           // Return 413 Payload Too Large
           return errorResponse(`File size (${(file.size / 1024 / 1024).toFixed(1)} MiB) exceeds limit of ${maxSizeMB} MiB`, 413); 
        }

        // 3. Generate unique ID & timestamp
        const fileId = crypto.randomUUID();
        const createdAt = new Date().toISOString();

        // 4. Upload file to R2 (level_0)
        const r2Key = `${fileId}/level_0`;
        const fileData = await file.arrayBuffer();
        console.log(`Uploading ${file.name} to R2 key: ${r2Key}`);
        await env.BITROT_R2.put(r2Key, fileData, { httpMetadata: { contentType: file.type } });
        console.log(`Successfully uploaded to R2.`);

        // 5. Create metadata object with initial decay state
        const nextDecayTime = new Date(Date.now() + 60 * 60 * 1000); // Decay in 1 hour
        const metadata: FileMetadata = {
            id: fileId,
            filename: file.name,
            mimeType: file.type || 'application/octet-stream',
            size: file.size,
            createdAt: createdAt,
            decayMode: 'bit-flip', // Default decay mode
            currentLevel: 0,
            nextDecayAt: nextDecayTime.toISOString(), // Schedule first decay
        };

        // 6. Put metadata into KV
        console.log(`Storing metadata in KV for key: ${fileId}`);
        await env.BITROT_KV.put(fileId, JSON.stringify(metadata), { expirationTtl: 86400 }); // Keep 1 day expiration for now
        console.log(`Successfully stored metadata in KV.`);

        // 7. Return success response
        return new Response(JSON.stringify({
            message: `File \"${file.name}\" uploaded successfully!`, 
            fileId: fileId,
            filename: file.name,
        }), {
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (e) {
        console.error('Upload error:', e);
        // Check if it's an R2 error and provide more detail if possible
        if (e instanceof Error) {
            return errorResponse(`Upload failed: ${e.message}`, 500);
        }
        return errorResponse('Failed to process upload due to an unknown error', 500);
    }
};

// Optional: Handle other methods if needed (e.g., GET, OPTIONS)
export const onRequestGet: PagesFunction<Env> = async (context) => {
    return errorResponse('GET method not allowed for /upload', 405);
}; 