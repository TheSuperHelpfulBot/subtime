export type AppVersionInfo = {
  version: string
  commit: string
  buildTime: string
}

export const APP_VERSION_INFO: AppVersionInfo = {
  version: __APP_VERSION__,
  commit: __APP_COMMIT__,
  buildTime: __APP_BUILD_TIME__,
}

export function shortCommit(commit: string): string {
  const trimmed = commit.trim()
  if (trimmed === '' || trimmed === 'dev') return ''
  return trimmed.slice(0, 7)
}

export function formatAppVersionLabel(info: AppVersionInfo = APP_VERSION_INFO): string {
  const commit = shortCommit(info.commit)
  return commit ? `${info.version} (${commit})` : info.version
}

export function formatBuildTime(buildTime: string): string {
  const date = new Date(buildTime)
  if (Number.isNaN(date.getTime())) return buildTime
  return date.toISOString()
}
