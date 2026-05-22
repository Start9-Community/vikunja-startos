import { sdk } from '../sdk'
import {
  DATA_MOUNT,
  DB_SUBPATH,
  FILES_SUBPATH,
  VIKUNJA_GID,
  VIKUNJA_UID,
  dataMount,
} from '../utils'

/**
 * Create the on-disk layout under /data and chown it for the vikunja user.
 *
 * Create /data/db and /data/files subdirectories and chown the whole /data
 * to 1000:1000 so the vikunja process (which runs as UID 1000 from the
 * FROM scratch upstream image) can read and write them.
 *
 * This MUST run at init time — the critical "Create User" task gates the
 * user-facing flow, which fires before the daemon ever starts. If chown
 * were only a daemon-chain oneshot, the critical task would never be
 * reachable because Vikunja can't write to an
 * unwriteable /data.
 *
 * We mount the volume root (subpath: null) rather than `subpath: 'db'` etc.,
 * because StartOS auto-creates those host dirs as UID 0, which we can't
 * chown from inside a user-namespace subcontainer. Mount root, steer
 * Vikunja's paths into subdirs via VIKUNJA_*_PATH env.
 *
 * Idempotent: mkdir -p and chown -R are safe to repeat on every init.
 */
export const initVolumeLayout = sdk.setupOnInit(async (effects, kind) => {
  if (!kind) return // skip on plain container rebuild

  await sdk.SubContainer.withTemp(
    effects,
    { imageId: 'busybox' },
    dataMount,
    'vikunja-init-volume-layout',
    async (sub) => {
      await sub.execFail(
        [
          'sh',
          '-c',
          `mkdir -p ${DATA_MOUNT}/${DB_SUBPATH} ${DATA_MOUNT}/${FILES_SUBPATH} && chown -R ${VIKUNJA_UID}:${VIKUNJA_GID} ${DATA_MOUNT}`,
        ],
        { user: 'root' },
      )
    },
  )
})
