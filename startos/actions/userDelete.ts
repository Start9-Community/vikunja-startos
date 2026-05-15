import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { withVikunjaCli } from '../utils'

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
  confirm: Value.toggle({
    name: i18n('I understand this is irreversible'),
    description: i18n(
      'The user and all of their projects, tasks, and attachments will be permanently deleted.',
    ),
    default: false,
  }),
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
    if (!input.confirm) {
      throw new Error(i18n('You must tick the confirmation checkbox.'))
    }

    await withVikunjaCli(effects, 'vikunja-user-delete', async (sub, env) => {
      // --confirm bypasses the CLI's interactive "YES, I CONFIRM" prompt,
      // which would otherwise block on stdin and trip our exec deadline.
      // The action's own checkbox is the user-facing confirmation.
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
        const stderr = (res.stderr.toString() + res.stdout.toString()).trim()
        if (
          /does not exist/i.test(stderr) ||
          /no user/i.test(stderr) ||
          /could not get user/i.test(stderr)
        ) {
          throw new Error(
            i18n('No user matches "${user}".', { user: input.user }),
          )
        }
        throw new Error(
          i18n('Vikunja could not delete the user: ${stderr}', { stderr }),
        )
      }
    })

    return {
      version: '1',
      title: i18n('User Deleted'),
      message: i18n('User "${user}" has been removed.', { user: input.user }),
      result: null,
    }
  },
)
