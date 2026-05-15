import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { withVikunjaCli } from '../utils'

const { InputSpec, Value } = sdk

const inputSpec = InputSpec.of({
  username: Value.text({
    name: i18n('Username'),
    description: i18n(
      'Between 3 and 250 characters. No spaces or commas. Cannot look like a URL. Cannot start with "link-share-" (reserved).',
    ),
    required: true,
    default: null,
    minLength: 3,
    maxLength: 250,
    patterns: [
      { regex: '^[^\\s,]+$', description: i18n('No spaces or commas.') },
      {
        regex: '^(?!https?://)(?!ftp://)(?!www\\.).*$',
        description: i18n('Cannot look like a URL.'),
      },
      {
        regex: '^(?!link-share-\\d+$).*$',
        description: i18n('"link-share-<number>" is reserved.'),
      },
    ],
  }),
  email: Value.text({
    name: i18n('Email'),
    description: i18n('Valid email address.'),
    required: true,
    default: null,
    inputmode: 'email',
    maxLength: 250,
    patterns: [
      {
        regex: '^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$',
        description: i18n('Must be a valid email address.'),
      },
    ],
  }),
  password: Value.text({
    name: i18n('Password'),
    description: i18n('8 to 72 bytes.'),
    required: true,
    default: null,
    minLength: 8,
    maxLength: 72,
    masked: true,
  }),
})

export const userCreate = sdk.Action.withInput(
  'user-create',

  {
    name: i18n('Create User'),
    description: i18n(
      'Create an additional Vikunja user. Use this when public registration is disabled.',
    ),
    warning: null,
    allowedStatuses: 'any',
    group: i18n('Accounts'),
    visibility: 'enabled',
  },

  inputSpec,

  async () => ({}),

  async ({ effects, input }) => {
    const { username, email, password } = input

    await withVikunjaCli(effects, 'vikunja-user-create', async (sub, env) => {
      const res = await sub.exec(
        [
          '/app/vikunja/vikunja',
          'user',
          'create',
          '--username',
          username,
          '--email',
          email,
          '--password',
          password,
        ],
        { env, user: 'vikunja' },
      )

      if (res.exitCode !== 0) {
        const stderr = res.stderr.toString().trim()
        if (/already exists/i.test(stderr) || /duplicate/i.test(stderr)) {
          throw new Error(
            i18n('A user with that username or email already exists.'),
          )
        }
        throw new Error(
          i18n('Vikunja could not create the user: ${stderr}', { stderr }),
        )
      }
    })

    return {
      version: '1',
      title: i18n('User Created'),
      message: i18n('User created. Save the credentials.'),
      result: {
        type: 'group',
        value: [
          {
            type: 'single',
            name: i18n('Username'),
            description: null,
            value: username,
            masked: false,
            copyable: true,
            qr: false,
          },
          {
            type: 'single',
            name: i18n('Password'),
            description: null,
            value: password,
            masked: true,
            copyable: true,
            qr: false,
          },
        ],
      },
    }
  },
)
