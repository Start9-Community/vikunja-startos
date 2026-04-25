import { createInitialUser } from '../actions/createInitialUser'
import { setPrimaryUrl } from '../actions/setPrimaryUrl'
import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'

/**
 * On install and restore:
 *  - Create the critical "Create Your First Vikunja User" task if no user
 *    has been created yet (gate on store.initialUserCreated, NOT on the
 *    registration toggle — registration is always off by default).
 *  - Create the important "Set Primary URL" task on install only, so the
 *    user confirms the auto-seeded .local URL or picks a different one.
 */
export const tasksOnInstall = sdk.setupOnInit(async (effects, kind) => {
  if (kind === null || kind === 'update') return

  const initialUserCreated = await storeJson
    .read((s) => s.initialUserCreated)
    .once()

  if (!initialUserCreated) {
    await sdk.action.createOwnTask(effects, createInitialUser, 'critical', {
      reason: i18n(
        'Create your first Vikunja user account. Public registration is disabled by default, so this is the only way to create the initial account.',
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
