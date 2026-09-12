import { sdk } from './sdk'

export const { createBackup, restoreInit } = sdk.setupBackups(async () =>
  // 'main' holds the SQLite database and file attachments; 'startos' holds
  // store.json (JWT secret, primary URL, toggles, SMTP). The `-wal` file must
  // be backed up: Vikunja opens SQLite in WAL mode and never checkpoints on
  // shutdown, so committed data can live entirely in vikunja.db-wal, and a
  // copy of vikunja.db alone restores an empty or stale database. StartOS stops
  // the service before a backup, so nothing is mid-write. Only the `-shm` index
  // is skipped — SQLite rebuilds it on open.
  sdk.Backups.ofVolumes('main', 'startos').setOptions({
    exclude: ['*-shm'],
  }),
)
