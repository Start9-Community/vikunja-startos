import { storeJson } from '../../fileModels/store.json'
import { i18n } from '../../i18n'
import { sdk } from '../../sdk'
import { getVikunjaEnv, unwrapVikunjaLogs, withVikunjaCli } from '../../utils'

const { InputSpec, Value } = sdk

/**
 * The `vikunja repair` subcommands, in the order upstream lists them. `repair`
 * on its own is only a help screen — every actual repair is one of these — so
 * the action takes the operation as input rather than shelling out to a bare
 * `repair` that would do nothing.
 */
const operations = [
  'task-positions',
  'projects',
  'file-mime-types',
  'orphan-positions',
] as const

type Operation = (typeof operations)[number]

const labels: Record<Operation, string> = {
  'task-positions': i18n('Task Positions'),
  projects: i18n('Orphaned Projects'),
  'file-mime-types': i18n('File Types'),
  'orphan-positions': i18n('Orphaned Positions'),
}

const inputSpec = InputSpec.of({
  operation: Value.select({
    name: i18n('Repair Operation'),
    description: i18n(
      'Everything — run all four checks in order. Task Positions — tasks appear in the wrong order or move around when the page reloads. Orphaned Projects — a project whose parent was deleted, which cannot be edited, un-archived, or deleted. File Types — attachments stored without a file type, usually after an upgrade. Orphaned Positions — leftover ordering records for tasks or views that no longer exist.',
    ),
    default: 'all',
    values: { all: i18n('Everything'), ...labels },
  }),
  dryRun: Value.toggle({
    name: i18n('Dry Run'),
    description: i18n(
      'Report what would change without changing anything. Leave this on for the first run — it tells you whether there is anything to repair at all. Run it again with this off to apply the fixes.',
    ),
    default: true,
  }),
})

export const repair = sdk.Action.withInput(
  'repair',

  {
    name: i18n('Repair'),
    description: i18n(
      'Detect and fix data integrity issues in the Vikunja database: duplicate task ordering, orphaned projects, missing attachment file types, and leftover position records. Run it with Dry Run on first to find out whether anything is wrong before changing anything.',
    ),
    warning: i18n(
      'With Dry Run off, this writes to the Vikunja database. Run it with Dry Run on first, and take a backup before applying repairs.',
    ),
    allowedStatuses: 'any',
    group: i18n('Other'),
    visibility: 'enabled',
  },

  inputSpec,

  async () => ({}),

  async ({ effects, input }) => {
    const selected: Operation[] =
      input.operation === 'all' ? [...operations] : [input.operation]

    const report = await withVikunjaCli(
      effects,
      'vikunja-repair',
      getVikunjaEnv(await storeJson.read().once()),
      async (sub, env) => {
        const sections: string[] = []
        for (const operation of selected) {
          const res = await sub.exec(
            [
              '/app/vikunja/vikunja',
              'repair',
              operation,
              ...(input.dryRun ? ['--dry-run'] : []),
            ],
            { env, user: 'vikunja' },
          )

          // Repair writes everything — findings and startup noise alike — to
          // stdout as structured log lines (`time=… level=INFO msg="…"`), and
          // leaves stderr empty even on failure. So stdout unwrapped is both
          // the report and, when the exit code says so, the reason it failed.
          const body = unwrapVikunjaLogs(res.stdout.toString())

          // Stop at the first failure rather than running the rest against a
          // database that just refused a repair. The error carries the
          // sections already collected, and this operation's output once — as
          // the reason, not also as a section above it.
          if (res.exitCode !== 0) {
            const reason =
              body ||
              unwrapVikunjaLogs(res.stderr.toString()) ||
              String(res.exitCode)
            throw new Error(
              [
                ...sections,
                i18n('The ${operation} repair failed: ${stderr}', {
                  operation: labels[operation],
                  stderr: reason,
                }),
              ].join('\n\n'),
            )
          }

          sections.push([labels[operation], body].filter(Boolean).join('\n'))
        }
        return sections.join('\n\n')
      },
    )

    // The report is prose, so it goes in `message`, which keeps its line
    // breaks — the same shape Run Diagnostics uses. A `single` result would
    // render it a second time, flattened into a one-line field.
    return {
      version: '1' as const,
      title: i18n('Repair Output'),
      message: [
        input.dryRun
          ? i18n('Dry run — nothing was changed.')
          : i18n('Repairs were applied.'),
        report,
      ].join('\n\n'),
      result: null,
    }
  },
)
