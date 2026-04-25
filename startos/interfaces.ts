import { i18n } from './i18n'
import { sdk } from './sdk'
import { uiPort } from './utils'

export const setInterfaces = sdk.setupInterfaces(async ({ effects }) => {
  const multi = sdk.MultiHost.of(effects, 'main')
  const origin = await multi.bindPort(uiPort, {
    protocol: 'http',
  })
  const webui = sdk.createInterface(effects, {
    name: i18n('Web UI'),
    id: 'webui',
    description: i18n('The Vikunja web interface'),
    type: 'ui',
    masked: false,
    schemeOverride: null,
    username: null,
    path: '',
    query: {},
  })

  const receipt = await origin.export([webui])

  return [receipt]
})
