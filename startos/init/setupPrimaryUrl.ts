import { setPrimaryUrl } from '../actions/setPrimaryUrl'
import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { getPrimaryUrls } from '../utils'

/**
 * Runs on every init (install, update, restore, container rebuild).
 *
 * Two responsibilities:
 *
 * 1. Auto-seed. If store.primaryUrl is empty, merge in a .local URL so the
 *    daemon has a usable VIKUNJA_SERVICE_PUBLICURL out of the box.
 *
 * 2. Re-surface. If store.primaryUrl is set but no longer in the available
 *    URL list (e.g. the user disabled the LAN gateway), create a critical
 *    task prompting them to pick a new one. The daemon's CORS config relies
 *    on a currently-reachable primary URL.
 *
 * `.const(effects)` on both reads registers the reactive watcher for the
 * container lifetime — when URLs or the store change, this re-runs.
 */
export const setupPrimaryUrl = sdk.setupOnInit(async (effects) => {
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
    return
  }

  if (urls.length > 0 && !urls.includes(current)) {
    await sdk.action.createOwnTask(effects, setPrimaryUrl, 'critical', {
      reason: i18n(
        'Your Vikunja primary URL is no longer available. Pick a new one from the list.',
      ),
    })
  }
})
