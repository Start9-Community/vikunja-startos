import { i18n } from './i18n'
import { sdk } from './sdk'
import {
  dataMount,
  getVikunjaEnv,
  plantPasswd,
  uiPort,
} from './utils'

export const main = sdk.setupMain(async ({ effects }) => {
  console.info(i18n('Starting Vikunja!'))

  const env = await getVikunjaEnv(effects)

  if (!env.VIKUNJA_SERVICE_SECRET) {
    throw new Error(
      'VIKUNJA_SERVICE_SECRET is empty — ensureSecret init step did not run',
    )
  }

  const sub = await sdk.SubContainer.of(
    effects,
    { imageId: 'vikunja' },
    dataMount,
    'vikunja-sub',
  )
  await plantPasswd(sub)

  return sdk.Daemons.of(effects).addDaemon('vikunja', {
    subcontainer: sub,
    exec: {
      command: sdk.useEntrypoint(),
      env,
    },
    ready: {
      display: i18n('Web Interface'),
      fn: () =>
        sdk.healthCheck.checkPortListening(effects, uiPort, {
          successMessage: i18n('The web interface is ready'),
          errorMessage: i18n('The web interface is not ready'),
        }),
      gracePeriod: 30_000,
    },
    requires: [],
  })
})
