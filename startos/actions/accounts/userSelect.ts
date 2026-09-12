import { storeJson } from '../../fileModels/store.json'
import { i18n } from '../../i18n'
import { sdk } from '../../sdk'
import { listVikunjaUsers, VikunjaUser } from '../../utils'

/**
 * A select over the accounts that exist when the form opens, read through
 * Vikunja's own `user list`. Keyed by user ID rather than username: the CLI
 * parses its user argument as an ID first and only falls back to a username
 * when that fails, so a username made of digits would otherwise name a
 * different account.
 *
 * With no accounts, or none readable, the field is disabled with the reason —
 * there is nothing to pick, and a free-text fallback is what this replaced.
 */
export const userSelect = (description: string) =>
  sdk.Value.dynamicSelect(async ({ effects }) => {
    let users: VikunjaUser[] | null = null
    try {
      users = (await listVikunjaUsers(effects, await storeJson.read().once()))
        .users
    } catch (e) {
      console.warn(`Could not list Vikunja users: ${String(e)}`)
    }

    return {
      name: i18n('User'),
      description,
      values: Object.fromEntries(
        (users ?? []).map((u) => [
          u.id,
          u.email ? `${u.username} (${u.email})` : u.username,
        ]),
      ),
      default: '',
      disabled:
        users === null
          ? i18n('Could not read the Vikunja account list.')
          : users.length === 0
            ? i18n('No Vikunja accounts were found.')
            : false,
    }
  })
