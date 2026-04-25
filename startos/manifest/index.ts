import { setupManifest } from '@start9labs/start-sdk'
import { alertInstall, alertUninstall, long, short } from './i18n'

export const manifest = setupManifest({
  id: 'vikunja',
  title: 'Vikunja',
  license: 'AGPL-3.0',
  packageRepo: 'https://github.com/Start9Labs/vikunja-startos',
  upstreamRepo: 'https://github.com/go-vikunja/vikunja',
  marketingUrl: 'https://vikunja.io/',
  donationUrl: 'https://opencollective.com/vikunja',
  docsUrls: [
    'https://vikunja.io/docs/',
    'https://vikunja.io/docs/config-options/',
  ],
  description: { short, long },
  volumes: ['main'],
  images: {
    vikunja: {
      source: { dockerTag: 'vikunja/vikunja:2.3.0' },
      arch: ['x86_64', 'aarch64'],
    },
    busybox: {
      source: { dockerTag: 'docker.io/busybox:1.36.1-musl' },
      arch: ['x86_64', 'aarch64'],
    },
  },
  alerts: {
    install: alertInstall,
    update: null,
    uninstall: alertUninstall,
    restore: null,
    start: null,
    stop: null,
  },
  dependencies: {},
})
