async function fetchInChunks(url, options = {}) {
  const {
    chunkSize = 5 * 1024 * 1024,
    maxParallelRequests = 6,
    progressCallback = null,
    signal = null,
  } = options;

  async function getFileSize(url, signal) {
    const response = await fetch(url, { method: 'HEAD', signal });
    if (!response.ok) {
      throw new Error('Failed to fetch the file size');
    }
    const contentLength = response.headers.get('content-length');
    if (!contentLength) {
      throw new Error('Content-Length header is missing');
    }
    return parseInt(contentLength, 10);
  }

  async function fetchChunk(url, start, end, signal) {
    const response = await fetch(url, {
      headers: { Range: `bytes=${start}-${end}` },
      signal,
    });
    if (!response.ok && response.status !== 206) {
      throw new Error('Failed to fetch chunk');
    }
    return await response.arrayBuffer();
  }

  async function downloadChunks(
    url,
    fileSize,
    chunkSize,
    maxParallelRequests,
    progressCallback,
    signal,
  ) {
    let chunks = [];
    let queue = [];
    let start = 0;
    let downloadedBytes = 0;

    async function processQueue() {
      while (start < fileSize) {
        if (queue.length < maxParallelRequests) {
          let end = Math.min(start + chunkSize - 1, fileSize - 1);
          let promise = fetchChunk(url, start, end, signal)
            .then((chunk) => {
              chunks.push({ start, chunk });
              downloadedBytes += chunk.byteLength;

              if (progressCallback) {
                progressCallback(downloadedBytes, fileSize);
              }

              queue = queue.filter((p) => p !== promise);
            })
            .catch((err) => {
              throw err;
            });
          queue.push(promise);
          start += chunkSize;
        }
        if (queue.length >= maxParallelRequests) {
          await Promise.race(queue);
        }
      }

      await Promise.all(queue);
    }

    await processQueue();

    return chunks.sort((a, b) => a.start - b.start).map((chunk) => chunk.chunk);
  }

  const fileSize = await getFileSize(url, signal);

  const chunks = await downloadChunks(
    url,
    fileSize,
    chunkSize,
    maxParallelRequests,
    progressCallback,
    signal,
  );

  const blob = new Blob(chunks);

  return blob;
}

export default fetchInChunks;
