import { storeJson } from '../../fileModels/store.json'
import { i18n } from '../../i18n'
import { sdk } from '../../sdk'
import { getVikunjaEnv, stripVikunjaLogs, withVikunjaCli } from '../../utils'

export const doctor = sdk.Action.withoutInput(
  'doctor',

  {
    name: i18n('Run Diagnostics'),
    description: i18n(
      "Run Vikunja's built-in diagnostic checks and return the output. Useful when troubleshooting install or startup problems.",
    ),
    warning: null,
    allowedStatuses: 'any',
    group: i18n('Other'),
    visibility: 'enabled',
  },

  async ({ effects }) => {
    const raw = await withVikunjaCli(
      effects,
      'vikunja-doctor',
      getVikunjaEnv(await storeJson.read().once()),
      async (sub, env) => {
        const res = await sub.exec(['/app/vikunja/vikunja', 'doctor'], {
          env,
          user: 'vikunja',
        })
        return [res.stdout.toString(), res.stderr.toString()]
          .map(stripVikunjaLogs)
          .filter(Boolean)
          .join('\n')
      },
    )

    if (!raw) {
      return {
        version: '1' as const,
        title: i18n('Doctor Output'),
        message: i18n('Doctor produced no output.'),
        result: null,
      }
    }

    // The dialog renders `message` as plain text but preserves newlines,
    // while a `single` result collapses to one line. Put the diagnostic
    // text in the message and use `result` only as a copy-to-clipboard.
    return {
      version: '1' as const,
      title: i18n('Doctor Output'),
      message: raw,
      result: {
        type: 'single',
        name: i18n('Diagnostic Output'),
        description: null,
        value: raw,
        masked: false,
        copyable: true,
        qr: false,
      },
    }
  },
)
