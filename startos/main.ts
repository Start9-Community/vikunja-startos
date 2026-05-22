import { T } from '@start9labs/start-sdk'
import { storeJson } from './fileModels/store.json'
import { i18n } from './i18n'
import { sdk } from './sdk'
import {
  customCredentials,
  dataMount,
  getVikunjaEnv,
  mailerEnv,
  plantPasswd,
  uiPort,
} from './utils'

export const main = sdk.setupMain(async ({ effects }) => {
  console.info(i18n('Starting Vikunja!'))

  const store = await storeJson.read().const(effects)
  const smtp = store?.smtp
  let creds: T.SmtpValue | null = null
  if (smtp?.selection === 'system') {
    const sys = await sdk.getSystemSmtp(effects).const()
    const customFrom = smtp.value.customFrom as string | undefined
    creds = sys && customFrom ? { ...sys, from: customFrom } : sys
  } else if (smtp?.selection === 'custom') {
    creds = customCredentials(smtp.value.provider.value)
  }

  const env = getVikunjaEnv(
    store,
    mailerEnv(
      creds,
      store?.smtpAdvanced ?? { skipTlsVerify: false, authType: 'plain' },
    ),
  )

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
