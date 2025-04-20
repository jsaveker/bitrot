// Define the expected environment variables from wrangler.toml
interface Env {
    BITROT_KV: KVNamespace;
    BITROT_R2: R2Bucket;
}

// Define the structure for file metadata stored in KV (should match upload.ts)
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

// Define the structure for scheduled event context
interface ScheduledController {
    scheduledTime: number;
    cron: string;
    noRetry: () => void;
}

import { decay } from './decay'; // Import the decay router function

// Placeholder for actual decay algorithms (REMOVED - now in decay.ts)
// async function applyDecay(...) { ... }

// Function triggered by Cron
export const scheduled: ExportedHandlerScheduledHandler<Env> = async (controller, env, ctx) => {
    console.log(`Cron triggered at ${new Date(controller.scheduledTime).toISOString()} by rule: ${controller.cron}`);
    const now = new Date();

    try {
        console.log('Checking for files ready for decay...');
        const listResult = await env.BITROT_KV.list(); // Note: KV list has limits, consider alternatives for large scale

        if (!listResult || listResult.keys.length === 0) {
            console.log('No files found in KV.');
            return;
        }

        let decayCount = 0;
        for (const key of listResult.keys) {
            const metadataString = await env.BITROT_KV.get(key.name);
            if (!metadataString) continue; // Skip if metadata somehow missing

            try {
                const metadata: FileMetadata = JSON.parse(metadataString);

                // Check if decay is scheduled and due
                if (metadata.nextDecayAt && new Date(metadata.nextDecayAt) <= now) {
                    console.log(`File ${metadata.filename} (ID: ${metadata.id}) is due for decay (Level ${metadata.currentLevel + 1}).`);
                    decayCount++;

                    // 1. Fetch previous level data from R2
                    const previousLevelKey = `${metadata.id}/level_${metadata.currentLevel}`;
                    const previousObject = await env.BITROT_R2.get(previousLevelKey);
                    if (!previousObject) {
                        console.error(`Error: Previous level data not found in R2 for key ${previousLevelKey}. Skipping decay.`);
                        // Optionally: Mark file as errored or attempt recovery?
                        continue; // Skip to next file
                    }
                    const previousData = await previousObject.arrayBuffer();

                    // 2. Apply decay algorithm using the imported router
                    console.log(` - Applying decay mode: ${metadata.decayMode}`);
                    const nextData = await decay(previousData, metadata.decayMode, metadata.currentLevel);
                    if (nextData.byteLength === 0 && previousData.byteLength !== 0) {
                        console.error(`Error: Decay function returned empty data for ${metadata.id}. Skipping update.`);
                        continue; // Avoid storing empty data unless original was empty
                    }

                    // 3. Upload new level data to R2
                    const nextLevel = metadata.currentLevel + 1;
                    const nextLevelKey = `${metadata.id}/level_${nextLevel}`;
                    await env.BITROT_R2.put(nextLevelKey, nextData, {
                        httpMetadata: { contentType: metadata.mimeType }
                    });
                    console.log(` - Stored new level ${nextLevel} data in R2: ${nextLevelKey}`);

                    // 4. Update metadata in KV
                    const nextDecayTime = new Date(Date.now() + 60 * 60 * 1000); // Schedule next decay (e.g., 1 hour later)
                    const updatedMetadata: FileMetadata = {
                        ...metadata,
                        currentLevel: nextLevel,
                        nextDecayAt: nextDecayTime.toISOString(),
                    };
                    await env.BITROT_KV.put(metadata.id, JSON.stringify(updatedMetadata)); // Overwrite with updated data
                    console.log(` - Updated metadata in KV for level ${nextLevel}. Next decay at ${updatedMetadata.nextDecayAt}`);
                
                    // Optional: Delete the previous level from R2 to save space? Depends on requirements.
                    // await env.BITROT_R2.delete(previousLevelKey);
                }

            } catch (parseOrProcessError) {
                console.error(`Error processing decay for key ${key.name}:`, parseOrProcessError);
                // Decide how to handle errors for individual files (e.g., log, mark as errored, noRetry)
                // controller.noRetry(); // Example: Prevent retrying this specific cron run if one file fails critically
            }
        }
        console.log(`Decay check complete. Processed ${decayCount} file(s).`);

    } catch (listError) {
        console.error('Error listing keys for decay check:', listError);
        // Handle potential errors during the initial KV list operation
    }
}; 