export interface FetchInChunksOptions {
  chunkSize?: number;
  maxParallelRequests?: number;
  progressCallback?: (downloaded: number, total: number) => void;
  signal?: AbortSignal | null;
}

export default function fetchInChunks(
  url: string,
  options?: FetchInChunksOptions,
): Promise<Blob>;
