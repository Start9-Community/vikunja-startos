import { storeJson } from './fileModels/store.json'
import { i18n } from './i18n'
import { sdk } from './sdk'
import { mainHostId, webuiInterfaceId } from './utils'

export const primaryUrl = sdk.setupPrimaryUrl({
  id: 'set-primary-url',
  hostId: mainHostId,
  interfaceId: webuiInterfaceId,
  metadata: {
    name: i18n('Set Primary URL'),
    description: i18n(
      'Choose the URL Vikunja puts in the links it sends by email, such as invitations and password resets. Open UI opens this address when your connection can reach it.',
    ),
    warning: null,
    allowedStatuses: 'any',
    group: i18n('Other'),
    visibility: 'enabled',
  },
  field: {
    name: i18n('Primary URL'),
    description: i18n(
      'Used for email links and invitations. Every address Vikunja is reachable at works in the browser regardless of this setting.',
    ),
  },
  // The store keeps '' for an unset URL; the helper needs null to fall back.
  get: storeJson.read((s) => s.VIKUNJA_SERVICE_PUBLICURL || null),
  set: (effects, url) =>
    storeJson.merge(effects, { VIKUNJA_SERVICE_PUBLICURL: url }),
})
