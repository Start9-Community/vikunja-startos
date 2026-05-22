import { setPrimaryUrl } from '../actions/other/setPrimaryUrl'
import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { getPrimaryUrls } from '../utils'

/**
 * Manage the primary URL across the container lifetime.
 *
 * Two responsibilities:
 *
 * 1. Auto-seed. If the stored VIKUNJA_SERVICE_PUBLICURL is empty, merge in a
 *    .local URL so the daemon has a usable public URL out of the box. The
 *    operator can change it any time via the Set Primary URL action — we do
 *    not nag them with a task on install.
 *
 * 2. Re-surface on breakage. If the stored URL is set but no longer in the
 *    available URL list (e.g. the operator disabled the LAN gateway), create
 *    a critical task prompting them to pick a new one. The daemon's CORS
 *    config relies on a currently-reachable primary URL.
 *
 * `.const(effects)` on both reads registers the reactive watcher for the
 * container lifetime — when URLs or the store change, this re-runs.
 */
export const setupPrimaryUrl = sdk.setupOnInit(async (effects) => {
  const urls = await getPrimaryUrls(effects)
  const current = await storeJson
    .read((s) => s.VIKUNJA_SERVICE_PUBLICURL)
    .const(effects)

  if (!current) {
    const seeded = urls.find((u) => u.includes('.local')) ?? urls[0] ?? ''
    if (seeded) {
      await storeJson.merge(
        effects,
        { VIKUNJA_SERVICE_PUBLICURL: seeded },
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
})
