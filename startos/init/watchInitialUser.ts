import { userCreate } from '../actions/accounts/userCreate'
import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'

/**
 * Watch the store on every init and surface a critical task pointing at the
 * Create User action when no Vikunja user exists yet. Public registration is
 * disabled by default, so this is the only way to bootstrap the first account.
 *
 * `createOwnTask` is idempotent on its replay key, so re-running on every
 * init kind is safe. Once Create User flips `initialUserCreated`, this no-ops
 * — and the task auto-resolves on the next init pass because the watcher
 * stops re-creating it.
 */
export const watchInitialUser = sdk.setupOnInit(async (effects) => {
  const done = await storeJson.read((s) => s.initialUserCreated).const(effects)

  if (!done) {
    await sdk.action.createOwnTask(effects, userCreate, 'critical', {
      reason: i18n(
        'Create your first Vikunja user account. Public registration is disabled by default, so this is the only way to create the initial account.',
      ),
    })
  }
})
