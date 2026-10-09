import { storeJson } from '../../fileModels/store.json'
import { i18n } from '../../i18n'
import { primaryUrl } from '../../primaryUrl'
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
    // Report the public URL the daemon actually runs with: `main` resolves a
    // fallback while none is chosen, so the raw stored value reads as
    // "not configured" when the service is fine.
    const store = await storeJson.read().once()
    const publicUrl = (await primaryUrl.bestUsable(effects).once()) ?? ''
    const raw = await withVikunjaCli(
      effects,
      'vikunja-doctor',
      getVikunjaEnv(
        store && { ...store, VIKUNJA_SERVICE_PUBLICURL: publicUrl },
      ),
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

    return {
      version: '1' as const,
      title: i18n('Doctor Output'),
      message: raw ? null : i18n('Doctor produced no output.'),
      result: raw
        ? {
            type: 'multiline' as const,
            value: raw,
            copyable: true,
            filename: 'vikunja-doctor.txt',
          }
        : null,
    }
  },
)
