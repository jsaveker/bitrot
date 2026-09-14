export async function sha256(bytes: Uint8Array): Promise<string> {
  if (!globalThis.crypto?.subtle)
    throw new Error(
      "This browser needs a secure HTTPS connection to calculate SHA-256.",
    );
  const digest = await crypto.subtle.digest("SHA-256", bytes.slice().buffer);
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}
export function flipOneBit(bytes: Uint8Array, offset = 4): Uint8Array {
  if (!Number.isInteger(offset) || offset < 0 || offset >= bytes.length)
    throw new Error("Choose a byte inside the message.");
  const result = bytes.slice();
  result[offset] ^= 1;
  return result;
}
