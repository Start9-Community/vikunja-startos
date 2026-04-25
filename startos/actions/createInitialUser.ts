import { storeJson } from '../fileModels/store.json'
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
      {
        regex: '^[^\\s,]+$',
        description: 'No spaces or commas.',
      },
      {
        regex: '^(?!https?://)(?!ftp://)(?!www\\.).*$',
        description: 'Cannot look like a URL.',
      },
      {
        regex: '^(?!link-share-\\d+$).*$',
        description: '"link-share-<number>" is reserved.',
      },
    ],
  }),
  email: Value.text({
    name: i18n('Email'),
    description: i18n(
      'Valid email address. Used for password reset and notifications.',
    ),
    required: true,
    default: null,
    inputmode: 'email',
    maxLength: 250,
    patterns: [
      {
        regex: '^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$',
        description: 'Must be a valid email address.',
      },
    ],
  }),
  password: Value.text({
    name: i18n('Password'),
    description: i18n(
      '8 to 72 bytes. Bcrypt truncates anything beyond 72 bytes; non-ASCII characters count as more than one byte.',
    ),
    required: true,
    default: null,
    minLength: 8,
    maxLength: 72,
    masked: true,
  }),
})

export const createInitialUser = sdk.Action.withInput(
  'create-initial-user',

  async ({ effects }) => {
    const done = await storeJson
      .read((s) => s.initialUserCreated)
      .const(effects)
    return {
      name: i18n('Create Your First Vikunja User'),
      description: i18n(
        'Create the initial administrator account. Public registration is disabled by default, so this action is the only way to create the first user.',
      ),
      warning: null,
      allowedStatuses: 'any',
      group: 'Accounts (User mgmt)',
      visibility: done ? 'hidden' : 'enabled',
    }
  },

  inputSpec,

  async () => ({}),

  async ({ effects, input }) => {
    const { username, email, password } = input

    await withVikunjaCli(
      effects,
      'vikunja-create-first-user',
      async (sub, env) => {
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
          if (/invalid email/i.test(stderr)) {
            throw new Error(i18n('The email address is invalid.'))
          }
          throw new Error(
            i18n('Vikunja could not create the user: ${stderr}', { stderr }),
          )
        }
      },
    )

    await storeJson.merge(effects, {
      initialUserCreated: true,
      enableRegistration: false,
    })

    // Explicitly clear the install task — tasksOnInstall only fires on
    // install/restore, so without this clear the critical task would
    // linger in the UI after the user successfully creates their account.
    await sdk.action.clearTask(effects, 'vikunja:create-initial-user')

    return {
      version: '1',
      title: i18n('User Created'),
      message: i18n(
        'Save these credentials. You can now log in to Vikunja at your primary URL.',
      ),
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
