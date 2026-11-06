import { utils } from '@start9labs/start-sdk'
import { storeJson } from '../../fileModels/store.json'
import { i18n } from '../../i18n'
import { sdk } from '../../sdk'
import {
  cliFailure,
  getVikunjaEnv,
  readUserList,
  withVikunjaCli,
} from '../../utils'
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
      'Generate a new password for a user and return it, and unlock the account if Vikunja locked it after too many failed sign-ins. Use this to recover access if a password is lost. No email is sent.',
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

    const unlocked = await withVikunjaCli(
      effects,
      'vikunja-user-reset-password',
      getVikunjaEnv(await storeJson.read().once()),
      async (sub, env) => {
        // Vikunja 2.8 locks an account after 10 failed sign-ins. Only its
        // emailed reset link unlocks it; `reset-password --direct` changes the
        // hash and leaves the account locked. Unlock first, so a failure here
        // never costs the user a password they were not shown.
        const { users } = await readUserList(sub, env)
        const locked =
          users.find((u) => u.id === input.user)?.status === 'Locked'
        if (locked) {
          const unlock = await sub.exec(
            [
              '/app/vikunja/vikunja',
              'user',
              'change-status',
              input.user,
              '--enable',
            ],
            { env, user: 'vikunja' },
          )
          if (unlock.exitCode !== 0) {
            throw new Error(
              i18n('Vikunja could not unlock the account: ${stderr}', {
                stderr: cliFailure(unlock),
              }),
            )
          }
        }

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
            throw new Error(i18n('That account no longer exists.'))
          }
          throw new Error(
            i18n('Vikunja could not reset the password: ${stderr}', {
              stderr: reason,
            }),
          )
        }
        return locked
      },
    )

    return {
      version: '1',
      title: i18n('Password Reset'),
      message: unlocked
        ? i18n(
            'The account was locked after too many failed sign-ins and is unlocked now. Share the new password with the user over a secure channel.',
          )
        : i18n('Share the new password with the user over a secure channel.'),
      result: {
        type: 'single',
        value: password,
        masked: true,
        copyable: true,
        qr: false,
        launchable: false,
      },
    }
  },
)
