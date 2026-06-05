/** Read PNG width/height from the IHDR header without an image library. */
export function pngSize(buf: Buffer): { width: number; height: number } | null {
  if (buf.length < 24) return null;
  const sig = buf.readUInt32BE(0) === 0x89504e47 && buf.readUInt32BE(4) === 0x0d0a1a0a;
  if (!sig) return null;
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}
