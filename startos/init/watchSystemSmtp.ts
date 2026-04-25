import { storeJson } from '../fileModels/store.json'
import { sdk } from '../sdk'

/**
 * When the user has selected "system" SMTP, subscribe to changes to the
 * StartOS system SMTP configuration (/system/email). This doesn't write
 * anywhere — main.ts recomputes SMTP env on every restart. The point is
 * to register the reactive dependency so main.ts re-runs when the system
 * SMTP changes, restarting the daemon with the new values.
 */
export const watchSystemSmtp = sdk.setupOnInit(async (effects) => {
  const sel = await storeJson
    .read((s) => s.smtp?.selection ?? 'disabled')
    .const(effects)

  if (sel === 'system') {
    await sdk.getSystemSmtp(effects).const()
  }
})
