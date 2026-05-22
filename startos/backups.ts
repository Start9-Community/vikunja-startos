import { sdk } from './sdk'

export const { createBackup, restoreInit } = sdk.setupBackups(async () =>
  // 'main' holds the SQLite database and file attachments; 'startos' holds
  // store.json (JWT secret, primary URL, toggles, SMTP). Exclude SQLite's
  // WAL/journal/shm sidecar files — backing them up mid-write can restore an
  // inconsistent database.
  sdk.Backups.ofVolumes('main', 'startos').setOptions({
    exclude: ['*-journal', '*-wal', '*-shm'],
  }),
)
