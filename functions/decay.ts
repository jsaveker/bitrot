// Utility functions for applying data decay algorithms

import { decode as pngDecode, encode as pngEncode } from "@cf-wasm/png";

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
    // TODO: Implement JPEG-specific glitching (more complex)
    return data;
}

/**
 * Applies ASCII shuffle decay to an ArrayBuffer (assuming UTF-8 text).
 * Randomly swaps pairs of characters. Intensity increases with level.
 * @param data The original ArrayBuffer data.
 * @param level The current decay level.
 * @returns A new ArrayBuffer with decayed data.
 */
export function applyAsciiShuffle(data: ArrayBuffer, level: number): ArrayBuffer {
    console.log(`Applying ASCII shuffle at level ${level}`);
    try {
        const decoder = new TextDecoder('utf-8');
        let text = decoder.decode(data);
        const length = text.length;
        if (length < 2) return data; // Need at least 2 chars to swap

        const chars = text.split(''); // Convert string to char array

        // Increase swaps based on level (adjust formula as needed)
        const numSwaps = Math.max(1, Math.floor(length * 0.02 * Math.pow(1.5, level)));
        console.log(` - Swapping ${numSwaps} character pairs`);

        for (let i = 0; i < numSwaps; i++) {
            // Choose two distinct random indices
            let index1 = Math.floor(Math.random() * length);
            let index2 = Math.floor(Math.random() * length);
            // Ensure indices are different
            while (index1 === index2) {
                index2 = Math.floor(Math.random() * length);
            }

            // Swap characters
            const temp = chars[index1];
            chars[index1] = chars[index2];
            chars[index2] = temp;
        }

        const encoder = new TextEncoder();
        const encodedData = encoder.encode(chars.join(''));
        // Create a new ArrayBuffer and copy the data
        const newBuffer = new ArrayBuffer(encodedData.byteLength);
        new Uint8Array(newBuffer).set(encodedData);
        return newBuffer;

    } catch (error) {
        // If it fails (e.g., not valid UTF-8), return original data
        console.error('Error during ASCII shuffle (maybe not text?):', error);
        return data;
    }
}

/**
 * Applies color drain decay to PNG image data.
 * Reduces color channel values based on the level.
 * @param data The original ArrayBuffer data.
 * @param level The current decay level.
 * @returns A new ArrayBuffer with decayed data, or original data if not PNG/error.
 */
export function applyColorDrain(data: ArrayBuffer, level: number): ArrayBuffer {
    console.log(`Attempting color drain at level ${level}`);
    const headerBytes = new Uint8Array(data.slice(0, 8));
    // Check for PNG magic bytes: 89 50 4E 47 0D 0A 1A 0A
    const isPng = headerBytes[0] === 0x89 &&
                  headerBytes[1] === 0x50 &&
                  headerBytes[2] === 0x4E &&
                  headerBytes[3] === 0x47 &&
                  headerBytes[4] === 0x0D &&
                  headerBytes[5] === 0x0A &&
                  headerBytes[6] === 0x1A &&
                  headerBytes[7] === 0x0A;

    if (!isPng) {
        console.log(' - Not a PNG file, skipping color drain.');
        return data; // Not a PNG, return original
    }

    try {
        console.log(' - Decoding PNG...');
        const decoded = pngDecode(new Uint8Array(data));
        const pixels = decoded.image; // Uint8Array RGBA pixel data
        const width = decoded.width;
        const height = decoded.height;
        console.log(` - Decoded ${width}x${height} PNG.`);

        // Calculate drain factor (increases with level, max ~0.5?)
        // Adjust formula as needed
        const drainFactor = Math.min(0.5, 0.05 * Math.pow(1.2, level));
        console.log(` - Applying drain factor: ${drainFactor.toFixed(3)}`);

        // Assuming RGBA format (4 bytes per pixel)
        for (let i = 0; i < pixels.length; i += 4) {
            // Reduce R, G, B values, leave Alpha (A) untouched
            pixels[i]   = Math.max(0, Math.floor(pixels[i] * (1 - drainFactor))); // Red
            pixels[i+1] = Math.max(0, Math.floor(pixels[i+1] * (1 - drainFactor))); // Green
            pixels[i+2] = Math.max(0, Math.floor(pixels[i+2] * (1 - drainFactor))); // Blue
            // pixels[i+3] is Alpha
        }

        console.log(' - Encoding modified PNG...');
        const encodedData: Uint8Array = pngEncode(pixels, width, height);
        console.log(' - Color drain applied successfully.');
        // Create a new ArrayBuffer and copy the data
        const newBuffer = new ArrayBuffer(encodedData.byteLength);
        new Uint8Array(newBuffer).set(encodedData);
        return newBuffer;

    } catch (error) {
        console.error('Error during PNG color drain:', error);
        return data; // Return original data on error
    }
}

// Add other decay functions as needed...

/**
 * Main decay function router.
 * Calls the appropriate decay algorithm based on the mode.
 */
export async function decay(buffer: ArrayBuffer, mode: string, level: number): Promise<ArrayBuffer> {
    switch (mode.toLowerCase()) {
        case 'bit-flip':
        case 'flip':
            return applyBitFlip(buffer, level);
        case 'jpeg-glitch':
        case 'jpeg':
            return applyJpegGlitch(buffer, level);
        case 'ascii-shuffle':
        case 'ascii':
            return applyAsciiShuffle(buffer, level);
        case 'color-drain':
        case 'drain':
            return applyColorDrain(buffer, level);
        // Add cases for other modes
        default:
            console.warn(`Unknown decay mode: ${mode}. Applying default bit-flip.`);
            return applyBitFlip(buffer, level);
    }
} 