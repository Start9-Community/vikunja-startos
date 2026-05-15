import { setPrimaryUrl } from '../actions/setPrimaryUrl'
import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { getPrimaryUrls } from '../utils'

/**
 * Manage the primary URL across the container lifetime.
 *
 * Three responsibilities:
 *
 * 1. Auto-seed. If store.primaryUrl is empty, merge in a .local URL so the
 *    daemon has a usable VIKUNJA_SERVICE_PUBLICURL out of the box.
 *
 * 2. Install nudge. On a fresh install only, surface an `important` task
 *    asking the user to confirm the auto-seeded URL or pick a Tor / custom
 *    domain instead. The task is idempotent on its replay key and clears
 *    when the user runs the action.
 *
 * 3. Re-surface on breakage. If store.primaryUrl is set but no longer in
 *    the available URL list (e.g. the user disabled the LAN gateway),
 *    create a critical task prompting them to pick a new one. The daemon's
 *    CORS config relies on a currently-reachable primary URL.
 *
 * `.const(effects)` on both reads registers the reactive watcher for the
 * container lifetime — when URLs or the store change, this re-runs.
 */
export const setupPrimaryUrl = sdk.setupOnInit(async (effects, kind) => {
  const urls = await getPrimaryUrls(effects)
  const current = await storeJson.read((s) => s.primaryUrl).const(effects)

  if (!current) {
    const seeded = urls.find((u) => u.includes('.local')) ?? urls[0] ?? ''
    if (seeded) {
      await storeJson.merge(
        effects,
        { primaryUrl: seeded },
        { allowWriteAfterConst: true },
      )
    }
  } else if (urls.length > 0 && !urls.includes(current)) {
    await sdk.action.createOwnTask(effects, setPrimaryUrl, 'critical', {
      reason: i18n(
        'Your Vikunja primary URL is no longer available. Pick a new one from the list.',
      ),
    })
  }

  if (kind === 'install') {
    await sdk.action.createOwnTask(effects, setPrimaryUrl, 'important', {
      reason: i18n(
        'Confirm your Vikunja primary URL. StartOS auto-selected a .local URL; change it if you plan to access Vikunja over Tor or clearnet.',
      ),
    })
  }
})
