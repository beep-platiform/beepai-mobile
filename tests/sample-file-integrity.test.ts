import { describe, expect, it } from "vitest";
import { getVerifiedSampleFileSize } from "../lib/sample-file-integrity";

describe("sample-file upload integrity", () => {
  it("uses the exact byte length of the body that will be uploaded", () => {
    const bytes = Uint8Array.from([0x50, 0x4b, 0x03, 0x04, 0x10, 0x20, 0x30, 0x40]);
    const body = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);

    expect(getVerifiedSampleFileSize(body, 8)).toBe(8);
    expect(Array.from(new Uint8Array(body))).toEqual([0x50, 0x4b, 0x03, 0x04, 0x10, 0x20, 0x30, 0x40]);
  });

  it("rejects a body whose byte count differs from the file picker's size", () => {
    const body = new Uint8Array([1, 2, 3, 4]).buffer;
    expect(() => getVerifiedSampleFileSize(body, 5)).toThrow(/complete file/i);
  });

  it("rejects empty samples", () => {
    expect(() => getVerifiedSampleFileSize(new ArrayBuffer(0), 0)).toThrow(/empty/i);
  });

  it("accepts files at 50 MB and rejects files over the limit", () => {
    const limit = 50 * 1024 * 1024;
    expect(getVerifiedSampleFileSize({ size: limit } as File)).toBe(limit);
    expect(() => getVerifiedSampleFileSize({ size: limit + 1 } as File)).toThrow(/50 MB/i);
  });
});
