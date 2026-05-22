import { utils } from '@start9labs/start-sdk'
import { storeJson } from '../../fileModels/store.json'
import { i18n } from '../../i18n'
import { sdk } from '../../sdk'
import { getVikunjaEnv, withVikunjaCli } from '../../utils'

const { InputSpec, Value } = sdk

const inputSpec = InputSpec.of({
  user: Value.text({
    name: i18n('Username or user ID'),
    description: i18n(
      'Run "List Users" first to see the available usernames and IDs.',
    ),
    required: true,
    default: null,
    minLength: 1,
  }),
})

export const userResetPassword = sdk.Action.withInput(
  'user-reset-password',

  {
    name: i18n('Reset User Password'),
    description: i18n(
      'Generate a new password for a user and return it — use this to recover access if a password is lost. No email is sent.',
    ),
    warning: null,
    allowedStatuses: 'only-running',
    group: i18n('Accounts'),
    visibility: 'enabled',
  },

  inputSpec,

  async () => ({}),

  async ({ effects, input }) => {
    // Never ask for a password — generate a strong one and return it.
    const password = utils.getDefaultString({ charset: 'a-z,A-Z,0-9', len: 24 })

    await withVikunjaCli(
      effects,
      'vikunja-user-reset-password',
      getVikunjaEnv(await storeJson.read().once()),
      async (sub, env) => {
        const res = await sub.exec(
          [
            '/app/vikunja/vikunja',
            'user',
            'reset-password',
            input.user,
            '--direct',
            '--password',
            password,
          ],
          { env, user: 'vikunja' },
        )
        if (res.exitCode !== 0) {
          const stderr = res.stderr.toString().trim()
          if (/does not exist/i.test(stderr)) {
            throw new Error(
              i18n('No user matches "${user}".', { user: input.user }),
            )
          }
          throw new Error(
            i18n('Vikunja could not reset the password: ${stderr}', { stderr }),
          )
        }
      },
    )

    return {
      version: '1',
      title: i18n('Password Reset'),
      message: i18n(
        'Share the new password with the user over a secure channel.',
      ),
      result: {
        type: 'single',
        name: i18n('New Password'),
        description: null,
        value: password,
        masked: true,
        copyable: true,
        qr: false,
      },
    }
  },
)
