import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'

export const toggleLinkSharing = sdk.Action.withoutInput(
  'toggle-link-sharing',

  async ({ effects }) => {
    const on = await storeJson.read((s) => s.enableLinkSharing).const(effects)
    return {
      name: on ? i18n('Disable Link Sharing') : i18n('Enable Link Sharing'),
      description: on
        ? i18n(
            'Public link sharing is currently enabled. Run this action to disable it.',
          )
        : i18n(
            'Public link sharing is currently disabled. Run this action to permit users to share projects via a public link.',
          ),
      warning: on
        ? null
        : i18n(
            'Anyone with a shared link can read all tasks and attachments on the shared project. Do not enable this if any project contains sensitive data.',
          ),
      allowedStatuses: 'any',
      group: i18n('Other'),
      visibility: 'enabled',
    }
  },

  async ({ effects }) => {
    const on = await storeJson.read((s) => s.enableLinkSharing).const(effects)
    await storeJson.merge(effects, { enableLinkSharing: !on })
  },
)
