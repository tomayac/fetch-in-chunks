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

### Options Object

- `chunkSize` (`number`, optional): The size of each chunk in bytes. Defaults to
  5 MB (5 _ 1024 _ 1024).
- `maxParallelRequests` (`number`, optional): The maximum number of parallel
  chunk requests. Defaults to 6. `progressCallback` (`function`, optional): A
  callback function that is called with the downloaded bytes and total file
  size. `signal` (`AbortSignal`, optional): An `AbortSignal` to allow aborting
  the request.

#### Parameters

- `url` (`string`): The URL of the file to download.
- `chunkSize` (`number`, optional): The size of each chunk in bytes. Defaults to
  5 MB.
- `maxParallelRequests` (`number`, optional): The maximum number of parallel
  chunk requests. Defaults to 6.
- `progressCallback` (`function`, optional): A callback function that is called
  with the downloaded bytes and total file size. `signal` (`AbortSignal`,
  optional): An `AbortSignal` to allow aborting the request.

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
    // Create a download link and trigger the download
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'largefile.zip';
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
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
    // Create a download link and trigger the download
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'largefile.zip';
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
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
    // Create a download link and trigger the download
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'largefile.zip';
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('Download aborted');
    } else {
      console.error('Error fetching file:', error);
    }
  }
}

// To abort the download at any time
controller.abort();
```

## License

This project is licensed under the Apache 2.0 License. See the `LICENSE` file
for details.
