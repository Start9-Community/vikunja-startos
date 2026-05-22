import { utils } from '@start9labs/start-sdk'
import { storeJson } from '../../fileModels/store.json'
import { i18n } from '../../i18n'
import { sdk } from '../../sdk'
import { getVikunjaEnv, withVikunjaCli } from '../../utils'

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
        description: i18n('Must be a valid email address.'),
      },
    ],
  }),
})

export const userCreate = sdk.Action.withInput(
  'user-create',

  {
    name: i18n('Create User'),
    description: i18n(
      'Create a Vikunja user. A strong password is generated and returned below — the user can change it later in Vikunja.',
    ),
    warning: null,
    allowedStatuses: 'any',
    group: i18n('Accounts'),
    visibility: 'enabled',
  },

  inputSpec,

  async () => ({}),

  async ({ effects, input }) => {
    const { username, email } = input
    // Never ask the user for a password — generate a strong one and return it.
    const password = utils.getDefaultString({ charset: 'a-z,A-Z,0-9', len: 24 })

    await withVikunjaCli(
      effects,
      'vikunja-user-create',
      getVikunjaEnv(await storeJson.read().once()),
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
          throw new Error(
            i18n('Vikunja could not create the user: ${stderr}', { stderr }),
          )
        }
      },
    )

    // Resolves the "create your first user" install task once any user exists.
    await storeJson.merge(effects, { initialUserCreated: true })

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
