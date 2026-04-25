import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { withVikunjaCli } from '../utils'

// Drop Vikunja's bootstrap log lines (`time=... level=INFO ...`) so the
// dialog only shows the actual command output.
function stripVikunjaLogs(text: string): string {
  return text
    .split('\n')
    .filter((line) => !/^time=\d{4}-\d{2}-\d{2}T/.test(line.trim()))
    .join('\n')
    .trim()
}

type ParsedUser = { id: string; username: string; email: string }

// Vikunja's `user list` prints an ASCII box-drawing table whose columns
// auto-grow to fit the widest cell — rows are not wrapped. Each data row
// looks like `│ 1  │ alice │ alice@example.com │ Active │ ... │`. We pull
// ID/USERNAME/EMAIL from the first three cells; the header row is the
// first `│`-line and is skipped by requiring a numeric ID.
function parseUserTable(text: string): ParsedUser[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('│') && line.endsWith('│'))
    .map((row) => {
      const cells = row.slice(1, -1).split('│').map((c) => c.trim())
      return {
        id: cells[0] ?? '',
        username: cells[1] ?? '',
        email: cells[2] ?? '',
      }
    })
    .filter((u) => /^\d+$/.test(u.id))
}

export const userList = sdk.Action.withoutInput(
  'user-list',

  {
    name: i18n('List Users'),
    description: i18n('Show every Vikunja user, with ID, username, and email.'),
    warning: null,
    allowedStatuses: 'any',
    group: 'Accounts (User mgmt)',
    visibility: 'enabled',
  },

  async ({ effects }) => {
    const raw = await withVikunjaCli(
      effects,
      'vikunja-user-list',
      async (sub, env) => {
        const res = await sub.execFail(
          ['/app/vikunja/vikunja', 'user', 'list'],
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
        title: i18n('Vikunja Users'),
        message: i18n('No users found.'),
        result: null,
      }
    }

    const users = parseUserTable(raw)

    // Parser failed (unexpected output format): fall back to dumping the
    // raw text in the message so the user still sees something useful.
    if (users.length === 0) {
      return {
        version: '1' as const,
        title: i18n('Vikunja Users'),
        message: raw,
        result: {
          type: 'single' as const,
          name: i18n('Raw Output'),
          description: null,
          value: raw,
          masked: false,
          copyable: true,
          qr: false,
        },
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
          {
            type: 'single' as const,
            name: i18n('Raw Output'),
            description: null,
            value: raw,
            masked: false,
            copyable: true,
            qr: false,
          },
        ],
      },
    }
  },
)
