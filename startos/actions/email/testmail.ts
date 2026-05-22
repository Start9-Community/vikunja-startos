import { T } from '@start9labs/start-sdk'
import { storeJson } from '../../fileModels/store.json'
import { i18n } from '../../i18n'
import { sdk } from '../../sdk'
import {
  customCredentials,
  getVikunjaEnv,
  mailerEnv,
  withVikunjaCli,
} from '../../utils'

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
    // Send Test Email is the one CLI action that sends mail, so it resolves
    // SMTP itself (one-shot), reading system SMTP only when it is the source.
    const store = await storeJson.read().once()
    const smtp = store?.smtp
    let creds: T.SmtpValue | null = null
    if (smtp?.selection === 'system') {
      const sys = await sdk.getSystemSmtp(effects).once()
      const customFrom = smtp.value.customFrom as string | undefined
      creds = sys && customFrom ? { ...sys, from: customFrom } : sys
    } else if (smtp?.selection === 'custom') {
      creds = customCredentials(smtp.value.provider.value)
    }

    const env = getVikunjaEnv(
      store,
      mailerEnv(
        creds,
        store?.smtpAdvanced ?? {
          skipTlsVerify: false,
          authType: 'plain',
        },
      ),
    )
    if (env.VIKUNJA_MAILER_ENABLED !== 'true') {
      throw new Error(
        i18n('SMTP is disabled. Configure SMTP before running this action.'),
      )
    }

    await withVikunjaCli(effects, 'vikunja-testmail', env, async (sub, env) => {
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
