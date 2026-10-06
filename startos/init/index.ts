import { actions } from '../actions'
import { restoreInit } from '../backups'
import { dependencies } from '../dependencies'
import { setInterfaces } from '../interfaces'
import { sdk } from '../sdk'
import { versionGraph } from '../versions'
import { ensureSecret } from './ensureSecret'
import { initVolumeLayout } from './initVolumeLayout'
import { primaryUrlTask } from './primaryUrlTask'
import { seedFiles } from './seedFiles'
import { watchInitialUser } from './watchInitialUser'

export const init = sdk.setupInit(
  restoreInit,
  versionGraph,
  seedFiles,
  initVolumeLayout,
  ensureSecret,
  setInterfaces,
  actions,
  dependencies,
  watchInitialUser,
  primaryUrlTask,
)

export const uninit = sdk.setupUninit(versionGraph)
