import { actions } from '../actions'
import { restoreInit } from '../backups'
import { setDependencies } from '../dependencies'
import { setInterfaces } from '../interfaces'
import { sdk } from '../sdk'
import { versionGraph } from '../versions'
import { ensureSecret } from './ensureSecret'
import { initVolumeLayout } from './initVolumeLayout'
import { seedFiles } from './seedFiles'
import { setupPrimaryUrl } from './setupPrimaryUrl'
import { watchInitialUser } from './watchInitialUser'

export const init = sdk.setupInit(
  restoreInit,
  versionGraph,
  seedFiles,
  initVolumeLayout,
  ensureSecret,
  setInterfaces,
  setDependencies,
  actions,
  watchInitialUser,
  setupPrimaryUrl,
)

export const uninit = sdk.setupUninit(versionGraph)
