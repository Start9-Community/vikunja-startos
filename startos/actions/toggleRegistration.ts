import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'

export const toggleRegistration = sdk.Action.withoutInput(
  'toggle-registration',

  async ({ effects }) => {
    const on = await storeJson
      .read((s) => s.enableRegistration)
      .const(effects)
    return {
      name: on ? i18n('Disable Registration') : i18n('Enable Registration'),
      description: on
        ? i18n(
            'Public registration is currently enabled. Run this action to disable it.',
          )
        : i18n(
            'Public registration is currently disabled. Run this action to permit new signups.',
          ),
      warning: on
        ? null
        : i18n(
            'Anyone who can reach your Vikunja URL will be able to create an account on your instance. Disable this again as soon as your users have signed up.',
          ),
      allowedStatuses: 'any',
      group: 'Accounts (User mgmt)',
      visibility: 'enabled',
    }
  },

  async ({ effects }) => {
    const on = await storeJson
      .read((s) => s.enableRegistration)
      .const(effects)
    await storeJson.merge(effects, { enableRegistration: !on })
  },
)
