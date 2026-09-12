import { T } from '@start9labs/start-sdk'
import { storeJson } from './fileModels/store.json'
import { i18n } from './i18n'
import { sdk } from './sdk'
import {
  customCredentials,
  dataMount,
  getVikunjaEnv,
  getWebuiUrls,
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

  // Every address the web UI is reachable at becomes an accepted CORS origin,
  // so the frontend works wherever the user chose to expose it rather than only
  // at the one URL stored as primary. `.const` inside `getWebuiUrls` makes this
  // reactive: enabling Tor or a tunnel later re-runs main with the new address
  // already in the allowlist.
  const urls = await getWebuiUrls(effects)

  // publicurl is only used for outbound links (emails, migration redirects),
  // but Vikunja refuses to start if it is empty while CORS is on. Fall back to
  // any reachable address so a service whose primary URL was never seeded still
  // boots; with no address at all, CORS goes off rather than aborting startup.
  const publicUrl = store?.VIKUNJA_SERVICE_PUBLICURL || urls[0] || ''

  const env = getVikunjaEnv(
    store && { ...store, VIKUNJA_SERVICE_PUBLICURL: publicUrl },
    mailerEnv(
      creds,
      store?.smtpAdvanced ?? { skipTlsVerify: false, authType: 'plain' },
    ),
    publicUrl ? { origins: urls } : null,
  )

  if (!env.VIKUNJA_SERVICE_SECRET) {
    // StartOS retries a failed `main` on a fixed interval and surfaces nothing
    // — not in the service log, not in the OS log, not in statusInfo.error — so
    // a throw here reads as a service that restarts every 10s for no stated
    // reason. Say what happened before throwing, and say which of the two
    // causes it was: the store not being readable at all, or it being readable
    // without a secret.
    console.error(
      store === null
        ? 'store.json could not be read — every setting fell back to its default, including the JWT secret'
        : 'store.json was read but carries no VIKUNJA_SERVICE_SECRET',
    )
    throw new Error(
      'VIKUNJA_SERVICE_SECRET is empty — ensureSecret should have generated one on init',
    )
  }

  const sub = sdk.SubContainer.of(
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
      // Fetch the page rather than check the port: a bound port says the
      // process started, a response says it is serving. Any HTTP status
      // counts; the timeout is generous for low-power hardware.
      fn: () =>
        sdk.healthCheck.checkWebUrl(effects, `http://127.0.0.1:${uiPort}/`, {
          timeout: 5_000,
          successMessage: i18n('The web interface is ready'),
          errorMessage: i18n('The web interface is not ready'),
        }),
      gracePeriod: 30_000,
    },
    requires: [],
  })
})
