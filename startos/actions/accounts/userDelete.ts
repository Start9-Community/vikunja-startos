import { storeJson } from '../../fileModels/store.json'
import { i18n } from '../../i18n'
import { sdk } from '../../sdk'
import {
  cliFailure,
  getVikunjaEnv,
  listVikunjaUsers,
  withVikunjaCli,
} from '../../utils'
import { userSelect } from './userSelect'

const { InputSpec } = sdk

const inputSpec = InputSpec.of({
  user: userSelect(
    i18n('The account to delete. Everything it owns is deleted with it.'),
  ),
})

export const userDelete = sdk.Action.withInput(
  'user-delete',

  {
    name: i18n('Delete User'),
    description: i18n(
      'Immediately delete a user and all of their data. Irreversible.',
    ),
    warning: i18n(
      'This is immediate and irreversible. The user will not receive a confirmation email.',
    ),
    allowedStatuses: 'only-running',
    group: i18n('Accounts'),
    visibility: 'enabled',
  },

  inputSpec,

  async () => ({}),

  async ({ effects, input }) => {
    const store = await storeJson.read().once()

    // The list the form showed can be stale by the time it is submitted. Look
    // the account up again, so one that has since gone is reported as such
    // rather than as a CLI failure, and so the result can name it.
    const target = (await listVikunjaUsers(effects, store)).users.find(
      (u) => u.id === input.user,
    )
    if (!target) {
      throw new Error(i18n('No user matches "${user}".', { user: input.user }))
    }

    await withVikunjaCli(
      effects,
      'vikunja-user-delete',
      getVikunjaEnv(store),
      async (sub, env) => {
        // --confirm bypasses the CLI's interactive "YES, I CONFIRM" prompt,
        // which would otherwise block on stdin and trip our exec deadline.
        // The action's `warning` is the user-facing confirmation.
        const res = await sub.exec(
          [
            '/app/vikunja/vikunja',
            'user',
            'delete',
            input.user,
            '--now',
            '--confirm',
          ],
          { env, user: 'vikunja' },
        )
        if (res.exitCode !== 0) {
          throw new Error(
            i18n('Vikunja could not delete the user: ${stderr}', {
              stderr: cliFailure(res),
            }),
          )
        }
      },
    )

    return {
      version: '1',
      title: i18n('User Deleted'),
      message: i18n('User "${user}" has been removed.', {
        user: target.username,
      }),
      result: null,
    }
  },
)
