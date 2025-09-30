async function fetchInChunks(url, options = {}) {
  let {
    chunkSize,
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

  async function fetchChunk(url, start, end, signal, onProgress) {
    const response = await fetch(url, {
      headers: { Range: `bytes=${start}-${end}` },
      signal,
    });
    if (!response.ok && response.status !== 206) {
      throw new Error('Failed to fetch chunk');
    }

    if (!response.body) {
      throw new Error('Response body is not available');
    }

    const reader = response.body.getReader();
    const chunkPieces = [];
    let receivedLength = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      chunkPieces.push(value);
      receivedLength += value.length;
      if (onProgress) {
        onProgress(value.length);
      }
    }

    // Combine the pieces into a single ArrayBuffer
    const combinedChunk = new Uint8Array(receivedLength);
    let position = 0;
    for (const piece of chunkPieces) {
      combinedChunk.set(piece, position);
      position += piece.length;
    }

    return combinedChunk.buffer;
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
    let downloadedBytes = 0;

    const onChunkProgress = (bytes) => {
      downloadedBytes += bytes;
      if (progressCallback) {
        progressCallback(downloadedBytes, fileSize);
      }
    };

    // Function to process the queue
    async function processQueue() {
      let start = 0;
      while (start < fileSize) {
        if (queue.length < maxParallelRequests) {
          let end = Math.min(start + chunkSize - 1, fileSize - 1);
          // Preserve the actual start value.
          let actualStart = start;
          let promise = fetchChunk(url, start, end, signal, onChunkProgress)
            .then((chunk) => {
              // Use preserved start value.
              chunks.push({ start: actualStart, chunk });
              // Progress is reported in real-time via onChunkProgress
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

  // Calculate the default chunk size if it wasn't provided in the options.
  if (!chunkSize) {
    chunkSize = Math.ceil(fileSize / maxParallelRequests);
  }

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
