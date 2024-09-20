# fetch-in-chunks

A utility for fetching large files in chunks with support for parallel
downloads, progress tracking, and request abortion.

## Installation

Install the package using npm:

```sh
npm install fetch-in-chunks
```

## Usage

### Importing the Module

```js
import fetchInChunks from 'fetch-in-chunks';
```

### Function Signature

```js
async function fetchInChunks(url, options = {})
```

#### Parameters

- `url` (`string`): The URL of the file to download.
- `options` (`object`, optional): An object containing additional options.
  - `options.chunkSize` (`number`, default: `5 * 1024 * 1024`): The size of each
    chunk to download in bytes.
  - `options.maxParallelRequests` (`number`, default: `1`): The number of chunks
    to download in parallel.
  - `options.progressCallback` (`function`, optional): A callback function that
    will be called with the number of bytes downloaded and the total size of the
    file.
  - `options.signal` (`AbortSignal`, optional): An `AbortSignal` object that can
    be used to abort the download.

#### Returns

- `Promise<Blob>`: A promise that resolves to a `Blob` containing the downloaded
  file.

## Example

### Basic Usage

```js
import fetchInChunks from 'fetch-in-chunks';

async function downloadFile() {
  try {
    const blob = await fetchInChunks('https://example.com/largefile.zip');
    return blob;
  } catch (error) {
    console.error('Error fetching file:', error);
  }
}

downloadFile();
```

### With Progress Callback

```js
import fetchInChunks from 'fetch-in-chunks';

async function downloadFileWithProgress() {
  try {
    const blob = await fetchInChunks('https://example.com/largefile.zip', {
      progressCallback: (downloaded, total) => {
        console.log(`Downloaded ${((downloaded / total) * 100).toFixed(2)}%`);
      },
    });
    return blob;
  } catch (error) {
    console.error('Error fetching file:', error);
  }
}

downloadFileWithProgress();
```

### With `AbortController`

```js
import fetchInChunks from 'fetch-in-chunks';

async function downloadFileWithAbort() {
  const controller = new AbortController();
  const signal = controller.signal;

  try {
    const blob = await fetchInChunks('https://example.com/largefile.zip', {
      signal,
    });
    return blob;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('Download aborted');
    } else {
      console.error('Error fetching file:', error);
    }
  }

  // To abort the download at any time
  controller.abort();
}
```

## License

This project is licensed under the Apache 2.0 License. See the `LICENSE` file
for details.
