const DATABASE_NAME = 'geolabs-employment-portal';
const DATABASE_VERSION = 1;
const STORE_NAME = 'resume-files';

const openDatabase = () => new Promise((resolve, reject) => {
  if (typeof indexedDB === 'undefined') {
    reject(new Error('Browser file storage is unavailable.'));
    return;
  }

  const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
  request.onupgradeneeded = () => {
    const database = request.result;
    if (!database.objectStoreNames.contains(STORE_NAME)) {
      database.createObjectStore(STORE_NAME, { keyPath: 'applicationKey' });
    }
  };
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error || new Error('Could not open browser file storage.'));
});

const runTransaction = async (mode, operation) => {
  const database = await openDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, mode);
      const store = transaction.objectStore(STORE_NAME);
      const request = operation(store);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('Browser file storage failed.'));
      transaction.onabort = () => reject(transaction.error || new Error('Browser file storage was interrupted.'));
    });
  } finally {
    database.close();
  }
};

export const saveResumeFile = (applicationKey, file) => runTransaction(
  'readwrite',
  store => store.put({
    applicationKey,
    blob: file,
    name: file.name,
    type: file.type || 'application/octet-stream',
    size: file.size,
    lastModified: file.lastModified || Date.now(),
    savedAt: new Date().toISOString(),
  }),
);

export const getResumeFile = applicationKey => runTransaction(
  'readonly',
  store => store.get(applicationKey),
);

export const deleteResumeFile = applicationKey => runTransaction(
  'readwrite',
  store => store.delete(applicationKey),
);

export const blobToBase64 = blob => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
  reader.onerror = () => reject(reader.error || new Error('Could not read the saved resume.'));
  reader.readAsDataURL(blob);
});

export const resumeRecordToAttachment = async record => ({
  filename: record.name,
  content: await blobToBase64(record.blob),
  type: record.type || record.blob?.type || 'application/octet-stream',
});
