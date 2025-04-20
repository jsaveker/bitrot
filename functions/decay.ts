// Utility functions for applying data decay algorithms

/**
 * Applies bit-flip decay to an ArrayBuffer.
 * The intensity increases with the level.
 * @param data The original ArrayBuffer data.
 * @param level The current decay level (higher means more corruption).
 * @returns A new ArrayBuffer with decayed data.
 */
export function applyBitFlip(data: ArrayBuffer, level: number): ArrayBuffer {
    console.log(`Applying bit-flip at level ${level}`);
    const buffer = new Uint8Array(data); // Create a mutable view
    const length = buffer.length;
    if (length === 0) return buffer.buffer; // Return empty if input is empty

    // Increase the number of flips based on level (adjust formula as needed)
    // Ensure at least one flip happens even at level 0 for demonstration
    const numFlips = Math.max(1, Math.floor(length * 0.01 * Math.pow(1.5, level))); 
    console.log(` - Flipping ${numFlips} bits`);

    for (let i = 0; i < numFlips; i++) {
        // Choose a random byte
        const byteIndex = Math.floor(Math.random() * length);
        // Choose a random bit within that byte (0-7)
        const bitIndex = Math.floor(Math.random() * 8);
        // Flip the bit using XOR
        buffer[byteIndex] = buffer[byteIndex] ^ (1 << bitIndex);
    }

    return buffer.buffer; // Return the modified ArrayBuffer
}

/**
 * Placeholder for JPEG glitch algorithm.
 */
export function applyJpegGlitch(data: ArrayBuffer, level: number): ArrayBuffer {
    console.log(`Applying JPEG glitch at level ${level} - Placeholder`);
    // TODO: Implement JPEG-specific glitching
    return data;
}

/**
 * Placeholder for ASCII shuffle algorithm.
 */
export function applyAsciiShuffle(data: ArrayBuffer, level: number): ArrayBuffer {
    console.log(`Applying ASCII shuffle at level ${level} - Placeholder`);
    // TODO: Implement ASCII-specific shuffling
    return data;
}

// Add other decay functions as needed...

/**
 * Main decay function router.
 * Calls the appropriate decay algorithm based on the mode.
 */
export async function decay(buffer: ArrayBuffer, mode: string, level: number): Promise<ArrayBuffer> {
    switch (mode.toLowerCase()) {
        case 'bit-flip':
        case 'flip': // Allow alias
            return applyBitFlip(buffer, level);
        case 'jpeg-glitch':
        case 'jpeg':
            return applyJpegGlitch(buffer, level);
        case 'ascii-shuffle':
        case 'ascii':
            return applyAsciiShuffle(buffer, level);
        // Add cases for other modes
        default:
            console.warn(`Unknown decay mode: ${mode}. Applying default bit-flip.`);
            return applyBitFlip(buffer, level);
    }
} 