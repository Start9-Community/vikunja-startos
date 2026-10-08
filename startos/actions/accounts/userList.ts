import { storeJson } from '../../fileModels/store.json'
import { i18n } from '../../i18n'
import { sdk } from '../../sdk'
import { listVikunjaUsers } from '../../utils'

export const userList = sdk.Action.withoutInput(
  'user-list',

  {
    name: i18n('List Users'),
    description: i18n('Show every Vikunja user, with ID, username, and email.'),
    warning: null,
    allowedStatuses: 'any',
    group: i18n('Accounts'),
    visibility: 'enabled',
  },

  async ({ effects }) => {
    const { raw, users } = await listVikunjaUsers(
      effects,
      await storeJson.read().once(),
    )

    if (!raw) {
      return {
        version: '1' as const,
        title: i18n('Vikunja Users'),
        message: i18n('No users found.'),
        result: null,
      }
    }

    // Parser failed (unexpected output format): show the raw table instead.
    if (users.length === 0) {
      return {
        version: '1' as const,
        title: i18n('Vikunja Users'),
        message: null,
        result: { type: 'multiline' as const, value: raw, copyable: true },
      }
    }

    return {
      version: '1' as const,
      title: i18n('Vikunja Users'),
      message: i18n('${count} user(s).', { count: users.length }),
      result: {
        type: 'group' as const,
        value: [
          ...users.map((u) => ({
            type: 'group' as const,
            name: u.username,
            description: null,
            value: [
              {
                type: 'single' as const,
                name: i18n('ID'),
                description: null,
                value: u.id,
                masked: false,
                copyable: true,
                qr: false,
              },
              {
                type: 'single' as const,
                name: i18n('Username'),
                description: null,
                value: u.username,
                masked: false,
                copyable: true,
                qr: false,
              },
              {
                type: 'single' as const,
                name: i18n('Email'),
                description: null,
                value: u.email,
                masked: false,
                copyable: true,
                qr: false,
              },
            ],
          })),
        ],
      },
    }
  },
)
