import { storeJson } from '../../fileModels/store.json'
import { i18n } from '../../i18n'
import { sdk } from '../../sdk'
import { listVikunjaUsers, VikunjaUser } from '../../utils'

// Keyed by ID: the CLI parses its user argument as an ID before a username.
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
      default: null,
      disabled:
        users === null
          ? i18n('Could not read the Vikunja account list.')
          : users.length === 0
            ? i18n('No Vikunja accounts were found.')
            : false,
    }
  })
