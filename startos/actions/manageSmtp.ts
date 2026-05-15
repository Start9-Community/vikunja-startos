import { smtpPrefill } from '@start9labs/start-sdk'
import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'

const { InputSpec, Value } = sdk

const advancedSpec = InputSpec.of({
  skipTlsVerify: Value.toggle({
    name: i18n('Skip TLS Verification'),
    description: i18n(
      'Disable certificate validation for the SMTP connection. Only enable if your SMTP server uses a self-signed certificate and you have verified it is trustworthy.',
    ),
    default: false,
  }),
  authType: Value.select({
    name: i18n('Auth Type'),
    description: i18n(
      'SMTP authentication mechanism. Plain is correct for most servers.',
    ),
    default: 'plain',
    values: {
      plain: 'Plain',
      login: 'Login',
      'cram-md5': 'CRAM-MD5',
    },
  }),
})

const inputSpec = InputSpec.of({
  smtp: sdk.inputSpecConstants.smtpInputSpec,
  advanced: Value.object(
    {
      name: i18n('Advanced'),
      description: i18n(
        'Vikunja-specific SMTP options. Leave the defaults unless you know you need to change them.',
      ),
    },
    advancedSpec,
  ),
})

export const manageSmtp = sdk.Action.withInput(
  'manage-smtp',

  {
    name: i18n('Configure SMTP'),
    description: i18n(
      'Add SMTP credentials so Vikunja can send password reset emails, invitations, and reminders.',
    ),
    warning: null,
    allowedStatuses: 'any',
    group: i18n('Email'),
    visibility: 'enabled',
  },

  inputSpec,

  async ({ effects }) => {
    const store = await storeJson
      .read((s) => ({ smtp: s.smtp, advanced: s.smtpAdvanced }))
      .once()
    const smtpValue = smtpPrefill(store?.smtp ?? null)
    const advanced = store?.advanced ?? {
      skipTlsVerify: false,
      authType: 'plain' as const,
    }
    return {
      smtp: smtpValue,
      advanced,
    }
  },

  async ({ effects, input }) => {
    await storeJson.merge(effects, {
      smtp: input.smtp,
      smtpAdvanced: input.advanced,
    })
  },
)
