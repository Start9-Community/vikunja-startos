import { storeJson } from '../../fileModels/store.json'
import { i18n } from '../../i18n'
import { sdk } from '../../sdk'

export const toggleEmailReminders = sdk.Action.withoutInput(
  'toggle-email-reminders',

  async ({ effects }) => {
    const state = await storeJson
      .read((s) => ({
        on: s.VIKUNJA_SERVICE_ENABLEEMAILREMINDERS,
        smtp: s.smtp?.selection ?? 'disabled',
      }))
      .const(effects)

    const on = (state?.on ?? 'false') === 'true'
    const smtpDisabled = (state?.smtp ?? 'disabled') === 'disabled'

    return {
      name: on
        ? i18n('Disable Email Reminders')
        : i18n('Enable Email Reminders'),
      description: on
        ? i18n(
            'Email reminders for assigned and overdue tasks are currently enabled. Run this action to disable them.',
          )
        : i18n(
            'Email reminders for assigned and overdue tasks are currently disabled. Run this action to enable them.',
          ),
      warning:
        !on && smtpDisabled
          ? i18n(
              'SMTP is currently disabled. Enabling email reminders has no effect until you configure SMTP via Configure SMTP.',
            )
          : null,
      allowedStatuses: 'any',
      group: i18n('Email'),
      visibility: 'enabled',
    }
  },

  async ({ effects }) => {
    const on =
      (await storeJson
        .read((s) => s.VIKUNJA_SERVICE_ENABLEEMAILREMINDERS)
        .const(effects)) === 'true'
    await storeJson.merge(effects, {
      VIKUNJA_SERVICE_ENABLEEMAILREMINDERS: on ? 'false' : 'true',
    })
  },
)
