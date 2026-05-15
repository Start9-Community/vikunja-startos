import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { withVikunjaCli } from '../utils'

const { InputSpec, Value } = sdk

const inputSpec = InputSpec.of({
  to: Value.text({
    name: i18n('Recipient Email'),
    description: i18n(
      'Email address to send the test message to. Confirm it arrives before relying on Vikunja to deliver reminders or password resets.',
    ),
    required: true,
    default: null,
    inputmode: 'email',
    patterns: [
      {
        regex: '^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$',
        description: i18n('Must be a valid email address.'),
      },
    ],
  }),
})

export const testmail = sdk.Action.withInput(
  'testmail',

  async ({ effects }) => {
    const sel = await storeJson
      .read((s) => s.smtp?.selection ?? 'disabled')
      .const(effects)
    return {
      name: i18n('Send Test Email'),
      description: i18n(
        'Deliver a test email through the configured SMTP server.',
      ),
      warning:
        sel === 'disabled'
          ? i18n('SMTP is disabled. Configure SMTP before running this action.')
          : null,
      allowedStatuses: 'any',
      group: i18n('Email'),
      visibility: 'enabled',
    }
  },

  inputSpec,

  async () => ({}),

  async ({ effects, input }) => {
    const sel = await storeJson
      .read((s) => s.smtp?.selection ?? 'disabled')
      .once()
    if (sel === 'disabled') {
      throw new Error(
        i18n('SMTP is disabled. Configure SMTP before running this action.'),
      )
    }

    await withVikunjaCli(effects, 'vikunja-testmail', async (sub, env) => {
      const res = await sub.exec(
        ['/app/vikunja/vikunja', 'testmail', input.to],
        { env, user: 'vikunja' },
      )
      if (res.exitCode !== 0) {
        const err = res.stderr.toString().trim()
        const out = res.stdout.toString().trim()
        throw new Error(
          i18n('Vikunja could not send the test email: ${stderr}', {
            stderr: err || out,
          }),
        )
      }
    })

    return {
      version: '1' as const,
      title: i18n('Test Email Sent'),
      message: i18n(
        'A test email was sent to ${to}. Check the recipient inbox; if it does not arrive, review the SMTP settings and the Vikunja logs.',
        { to: input.to },
      ),
      result: null,
    }
  },
)
