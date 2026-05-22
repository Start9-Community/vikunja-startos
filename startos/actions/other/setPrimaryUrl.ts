import { storeJson } from '../../fileModels/store.json'
import { i18n } from '../../i18n'
import { sdk } from '../../sdk'
import { getPrimaryUrls } from '../../utils'

const { InputSpec, Value } = sdk

const inputSpec = InputSpec.of({
  url: Value.dynamicSelect(async ({ effects }) => {
    const urls = await getPrimaryUrls(effects)
    return {
      name: i18n('Primary URL'),
      description: i18n(
        'Used for email links, invitations, and frontend/API communication. Must be a URL Vikunja is reachable at.',
      ),
      values: urls.reduce(
        (obj, url) => ({ ...obj, [url]: url }),
        {} as Record<string, string>,
      ),
      default: '',
    }
  }),
})

export const setPrimaryUrl = sdk.Action.withInput(
  'set-primary-url',

  {
    name: i18n('Set Primary URL'),
    description: i18n(
      'Choose which of your Vikunja URLs should serve as the primary URL.',
    ),
    warning: null,
    allowedStatuses: 'any',
    group: i18n('Other'),
    visibility: 'enabled',
  },

  inputSpec,

  async ({ effects }) => ({
    url:
      (await storeJson.read((s) => s.VIKUNJA_SERVICE_PUBLICURL).once()) ||
      undefined,
  }),

  async ({ effects, input }) =>
    storeJson.merge(effects, { VIKUNJA_SERVICE_PUBLICURL: input.url }),
)
