const MAX_SAMPLE_BYTES = 50 * 1024 * 1024;

/** Verify the exact body sent to Storage before any request metadata is written. */
export function getVerifiedSampleFileSize(body: File | ArrayBuffer, reportedSize?: number | null): number {
  const actualSize = body instanceof ArrayBuffer ? body.byteLength : body.size;
  if (actualSize <= 0) throw new Error("The selected sample file is empty.");
  if (actualSize > MAX_SAMPLE_BYTES) throw new Error("Sample files must be 50 MB or smaller.");
  if (reportedSize != null && reportedSize !== actualSize) {
    throw new Error("The selected sample could not be verified as a complete file. Please select it again.");
  }
  return actualSize;
}
