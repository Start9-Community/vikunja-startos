import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { withVikunjaCli } from '../utils'

// Vikunja boots its full runtime even for `doctor`, so the output is
// prefixed with structured `time=... level=...` log lines from migration
// and mailer init. Strip those — the user wants the diagnostic output,
// not the bootstrap noise.
function stripVikunjaLogs(text: string): string {
  return text
    .split('\n')
    .filter((line) => !/^time=\d{4}-\d{2}-\d{2}T/.test(line.trim()))
    .join('\n')
    .trim()
}

export const doctor = sdk.Action.withoutInput(
  'doctor',

  {
    name: i18n('Run Diagnostics'),
    description: i18n(
      "Run Vikunja's built-in diagnostic checks and return the output. Useful when troubleshooting install or startup problems.",
    ),
    warning: null,
    allowedStatuses: 'any',
    group: 'Other',
    visibility: 'enabled',
  },

  async ({ effects }) => {
    const raw = await withVikunjaCli(
      effects,
      'vikunja-doctor',
      async (sub, env) => {
        const res = await sub.exec(
          ['/app/vikunja/vikunja', 'doctor'],
          { env, user: 'vikunja' },
        )
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
