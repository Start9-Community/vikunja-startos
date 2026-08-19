import { T } from '@start9labs/start-sdk'
import { defaultMaxAttachmentSize, Store } from './fileModels/store.json'
import { sdk } from './sdk'

export const uiPort = 3456 as const

// Host id (the `sdk.MultiHost.of` group) carrying the webui interface —
// distinct from the interface id exported on it. Used for `sdk.host.getOwn`
// lookups.
export const mainHostId = 'main'
export const webuiInterfaceId = 'webui'

export const DATA_MOUNT = '/data' as const
export const DB_SUBPATH = 'db' as const
export const FILES_SUBPATH = 'files' as const
export const VIKUNJA_UID = 1000 as const
export const VIKUNJA_GID = 1000 as const

export const dataMount = sdk.Mounts.of().mountVolume({
  volumeId: 'main',
  subpath: null,
  mountpoint: DATA_MOUNT,
  readonly: false,
})

/**
 * Scratch-image /etc/passwd plant.
 *
 * The upstream `vikunja/vikunja` image is `FROM scratch` with `USER 1000`.
 * Scratch has no `/etc/passwd` or `/etc/group`, so start-container's USER
 * resolution fails. We plant minimal entries for root:0:0 and vikunja:1000:1000
 * into every subcontainer's rootfs before executing anything.
 */
export async function plantPasswd(sub: {
  writeFile: (path: string, data: string) => Promise<void>
}): Promise<void> {
  await sub.writeFile(
    '/etc/passwd',
    'root:x:0:0:root:/root:/bin/sh\n' +
      `vikunja:x:${VIKUNJA_UID}:${VIKUNJA_GID}:vikunja:/app/vikunja:/bin/sh\n`,
  )
  await sub.writeFile('/etc/group', `root:x:0:\nvikunja:x:${VIKUNJA_GID}:\n`)
}

/**
 * Read the URLs of the 'webui' service interface (excluding localhost and
 * link-local). Three consumers: the Set Primary URL dropdown, the auto-seed of
 * a .local URL on install, and the daemon's CORS allowlist — the frontend may
 * be loaded from any of these addresses, so every one of them has to be an
 * accepted origin.
 */
export async function getWebuiUrls(effects: T.Effects): Promise<string[]> {
  return sdk.host
    .getOwn(effects, mainHostId, (host) => {
      const iface =
        host &&
        Object.values(host.bindings)
          .flatMap((b) => Object.values(b.interfaces))
          .find((i) => i.id === webuiInterfaceId)
      return iface ? iface.addressInfo.nonLocal.format() : []
    })
    .const()
}

type CustomProvider = Extract<
  Store['smtp'],
  { selection: 'custom' }
>['value']['provider']['value']

/** Pure: a stored 'custom' SMTP provider config → SMTP credentials. */
export function customCredentials(p: CustomProvider): T.SmtpValue {
  return {
    host: p.host,
    port: Number(p.security.value.port),
    from: p.from,
    username: p.username,
    password: p.password,
    security: p.security.selection,
  }
}

/**
 * Pure: resolved SMTP credentials → VIKUNJA_MAILER_* env, or `{}` when there
 * are none (Vikunja's mailer defaults to off). The daemon and the Send Test
 * Email action resolve credentials and call this; other CLI actions don't send
 * mail, so they pass `{}` to getVikunjaEnv and never touch SMTP.
 */
export function mailerEnv(
  creds: T.SmtpValue | null,
  advanced: {
    skipTlsVerify: boolean
    authType: 'plain' | 'login' | 'cram-md5'
  },
): Record<string, string> {
  if (!creds) return {}
  const env: Record<string, string> = {
    VIKUNJA_MAILER_ENABLED: 'true',
    VIKUNJA_MAILER_HOST: creds.host,
    VIKUNJA_MAILER_PORT: String(creds.port),
    VIKUNJA_MAILER_FROMEMAIL: creds.from,
    VIKUNJA_MAILER_USERNAME: creds.username,
    VIKUNJA_MAILER_FORCESSL: creds.security === 'tls' ? 'true' : 'false',
    VIKUNJA_MAILER_SKIPTLSVERIFY: advanced.skipTlsVerify ? 'true' : 'false',
    VIKUNJA_MAILER_AUTHTYPE: advanced.authType,
  }
  if (creds.password) env.VIKUNJA_MAILER_PASSWORD = creds.password
  return env
}

/**
 * Build the env for the daemon and every CLI subcontainer. The store keys are
 * the env vars, so the stored settings pass straight through. SMTP is resolved
 * by the caller (only the daemon and Send Test Email need it) and passed in as
 * `smtp`; CLI commands that don't send mail leave it `{}`.
 *
 * `cors` is the daemon's allowlist of accepted browser origins — pass every
 * address the web UI is reachable at. CLI callers pass `null`, which disables
 * CORS: it is meaningless for a command that serves no HTTP, and leaving it on
 * would make every CLI invocation inherit the publicurl requirement below.
 */
export function getVikunjaEnv(
  store: Store | null,
  smtp: Record<string, string> = {},
  cors: { origins: string[] } | null = null,
): Record<string, string> {
  return {
    // Static / computed
    VIKUNJA_SERVICE_INTERFACE: `:${uiPort}`,
    VIKUNJA_SERVICE_ROOTPATH: '/app/vikunja/',
    VIKUNJA_SERVICE_TIMEZONE: 'UTC',
    VIKUNJA_SERVICE_ENABLECALDAV: 'true',
    VIKUNJA_SERVICE_ENABLETOTP: 'true',
    VIKUNJA_DATABASE_TYPE: 'sqlite',
    VIKUNJA_DATABASE_PATH: `${DATA_MOUNT}/${DB_SUBPATH}/vikunja.db`,
    VIKUNJA_FILES_BASEPATH: `${DATA_MOUNT}/${FILES_SUBPATH}`,

    // Stored settings — keys are the env vars, so these pass straight through
    VIKUNJA_SERVICE_SECRET: store?.VIKUNJA_SERVICE_SECRET ?? '',
    VIKUNJA_SERVICE_PUBLICURL: store?.VIKUNJA_SERVICE_PUBLICURL ?? '',
    VIKUNJA_SERVICE_ENABLEREGISTRATION:
      store?.VIKUNJA_SERVICE_ENABLEREGISTRATION ?? 'false',
    VIKUNJA_SERVICE_ENABLEUSERDELETION:
      store?.VIKUNJA_SERVICE_ENABLEUSERDELETION ?? 'true',
    VIKUNJA_SERVICE_ENABLELINKSHARING:
      store?.VIKUNJA_SERVICE_ENABLELINKSHARING ?? 'false',
    VIKUNJA_SERVICE_ENABLEEMAILREMINDERS:
      store?.VIKUNJA_SERVICE_ENABLEEMAILREMINDERS ?? 'false',
    VIKUNJA_FILES_MAXSIZE:
      store?.VIKUNJA_FILES_MAXSIZE ?? defaultMaxAttachmentSize,

    // CORS. Vikunja aborts at startup with "service.publicurl is required when
    // cors.enable is true" whenever CORS is on and publicurl is empty, and it
    // defaults CORS on — so a caller with no origins must switch it off rather
    // than leave the default. Origins are whitespace-separated: Vikunja stores
    // an env value as a plain string and reads it back through viper's
    // GetStringSlice, which splits with strings.Fields. Vikunja appends
    // publicurl to this list itself, so it needs no entry here.
    ...(cors
      ? {
          VIKUNJA_CORS_ENABLE: 'true',
          VIKUNJA_CORS_ORIGINS: cors.origins.join(' '),
        }
      : { VIKUNJA_CORS_ENABLE: 'false' }),

    // SMTP — resolved by the caller (daemon / Send Test Email); `{}` otherwise
    ...smtp,
  }
}

type VikunjaSub = Parameters<
  Parameters<typeof sdk.SubContainer.withTemp<unknown>>[4]
>[0]

/**
 * Run a `vikunja` CLI command in a short-lived subcontainer from the vikunja
 * image, with the main volume mounted and /etc/passwd + /etc/group planted.
 * Used by every CLI action to avoid duplicating the boilerplate.
 *
 * The caller passes the env (built from a single store read at the action's top
 * level). This runner does no reads of its own and knows nothing about SMTP —
 * the CLI commands don't send mail, so `getVikunjaEnv(store)` is all they need.
 */
export async function withVikunjaCli<T>(
  effects: T.Effects,
  name: string,
  env: Record<string, string>,
  fn: (sub: VikunjaSub, env: Record<string, string>) => Promise<T>,
): Promise<T> {
  return sdk.SubContainer.withTemp(
    effects,
    { imageId: 'vikunja' },
    dataMount,
    name,
    async (sub) => {
      await plantPasswd(sub)
      return fn(sub, env)
    },
  )
}

/**
 * Vikunja boots its full runtime for every CLI invocation, so most command
 * output is prefixed with structured `time=YYYY-MM-DDT… level=INFO …` log
 * lines from migration and mailer init. Strip those — the user wants the
 * command's actual output, not the bootstrap noise.
 */
export function stripVikunjaLogs(text: string): string {
  return text
    .split('\n')
    .filter((line) => !/^time=\d{4}-\d{2}-\d{2}T/.test(line.trim()))
    .join('\n')
    .trim()
}

export type VikunjaUser = { id: string; username: string; email: string }

// Vikunja's `user list` prints an ASCII box-drawing table whose columns
// auto-grow to fit the widest cell — rows are not wrapped. Each data row
// looks like `│ 1  │ alice │ alice@example.com │ Active │ ... │`. We pull
// ID/USERNAME/EMAIL from the first three cells; the header row is the
// first `│`-line and is skipped by requiring a numeric ID.
function parseUserTable(text: string): VikunjaUser[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('│') && line.endsWith('│'))
    .map((row) => {
      const cells = row
        .slice(1, -1)
        .split('│')
        .map((c) => c.trim())
      return {
        id: cells[0] ?? '',
        username: cells[1] ?? '',
        email: cells[2] ?? '',
      }
    })
    .filter((u) => /^\d+$/.test(u.id))
}

/**
 * Run `vikunja user list` and return both the parsed rows and the cleaned raw
 * output. Two callers with different needs: the List Users action falls back to
 * showing `raw` when the table format defeats the parser, while init only cares
 * whether any account exists. Throws if the CLI itself fails.
 */
export async function listVikunjaUsers(
  effects: T.Effects,
  store: Store | null,
): Promise<{ raw: string; users: VikunjaUser[] }> {
  const raw = await withVikunjaCli(
    effects,
    'vikunja-user-list',
    getVikunjaEnv(store),
    async (sub, env) => {
      const res = await sub.execFail(['/app/vikunja/vikunja', 'user', 'list'], {
        env,
        user: 'vikunja',
      })
      return [res.stdout.toString(), res.stderr.toString()]
        .map(stripVikunjaLogs)
        .filter(Boolean)
        .join('\n')
    },
  )
  return { raw, users: parseUserTable(raw) }
}

const VIKUNJA_LOG_LINE =
  /^time=\S+\s+level=(\w+)\s+msg=(?:"((?:[^"\\]|\\.)*)"|(\S*))/

// Chatter Vikunja emits while booting its runtime, before the command itself
// runs. It arrives on stdout interleaved with the real output, so it has to be
// dropped by message rather than by stream.
const VIKUNJA_BOOTSTRAP_LOG =
  /^(No config file found|Running migrations|Using SQLite|Ran all migrations|No license key)/

/**
 * Unwrap Vikunja's structured log lines into plain text.
 *
 * `repair` reports everything it finds as `time=… level=INFO msg="…"` lines —
 * unlike `doctor`, which prints plain text. Handing that to `stripVikunjaLogs`
 * would filter away the entire result, since every line it wants to keep looks
 * exactly like the bootstrap noise that function exists to remove. Pull the
 * `msg` field out instead, and drop the bootstrap lines by message. Anything
 * above INFO keeps its level as a prefix, so a warning or error stays visible
 * rather than reading like a normal finding.
 */
export function unwrapVikunjaLogs(text: string): string {
  return (
    text
      .split('\n')
      .map((line) => {
        // A carriage return means a progress bar redrawing itself in place
        // (`file-mime-types` draws one) — keep only the frame it settled on.
        const flat = line.split('\r').pop() ?? ''
        const match = flat.trim().match(VIKUNJA_LOG_LINE)
        if (!match) return { level: 'INFO', msg: flat.trimEnd() }
        const msg =
          match[2] !== undefined
            ? match[2].replace(/\\"/g, '"').replace(/\\\\/g, '\\')
            : (match[3] ?? '')
        return { level: match[1], msg: msg.trimEnd() }
      })
      // Filter on the message, not on the formatted line: the license warning is
      // bootstrap noise too, and it arrives at WARN.
      .filter(
        ({ msg }) => msg.trim() && !VIKUNJA_BOOTSTRAP_LOG.test(msg.trim()),
      )
      .map(({ level, msg }) => (level === 'INFO' ? msg : `${level}: ${msg}`))
      .join('\n')
      .trim()
  )
}
