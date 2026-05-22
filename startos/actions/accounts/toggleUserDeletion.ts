import { storeJson } from '../../fileModels/store.json'
import { i18n } from '../../i18n'
import { sdk } from '../../sdk'

export const toggleUserDeletion = sdk.Action.withoutInput(
  'toggle-user-deletion',

  async ({ effects }) => {
    const on =
      (await storeJson
        .read((s) => s.VIKUNJA_SERVICE_ENABLEUSERDELETION)
        .const(effects)) === 'true'
    return {
      name: on
        ? i18n('Disable Self-Service User Deletion')
        : i18n('Enable Self-Service User Deletion'),
      description: on
        ? i18n(
            'Users can currently delete their own accounts without admin approval. Run this action to require admin intervention.',
          )
        : i18n(
            'Users must currently ask an admin to delete their account. Run this action to let them self-delete.',
          ),
      warning: null,
      allowedStatuses: 'any',
      group: i18n('Accounts'),
      visibility: 'enabled',
    }
  },

  async ({ effects }) => {
    const on =
      (await storeJson
        .read((s) => s.VIKUNJA_SERVICE_ENABLEUSERDELETION)
        .const(effects)) === 'true'
    await storeJson.merge(effects, {
      VIKUNJA_SERVICE_ENABLEUSERDELETION: on ? 'false' : 'true',
    })
  },
)
