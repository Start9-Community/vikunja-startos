import { utils } from '@start9labs/start-sdk'
import { storeJson } from '../../fileModels/store.json'
import { i18n } from '../../i18n'
import { sdk } from '../../sdk'
import { cliFailure, getVikunjaEnv, withVikunjaCli } from '../../utils'
import { userSelect } from './userSelect'

const { InputSpec } = sdk

const inputSpec = InputSpec.of({
  user: userSelect(i18n('The account whose password to reset.')),
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
          const reason = cliFailure(res)
          if (/does not exist/i.test(reason)) {
            throw new Error(
              i18n('No user matches "${user}".', { user: input.user }),
            )
          }
          throw new Error(
            i18n('Vikunja could not reset the password: ${stderr}', {
              stderr: reason,
            }),
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
