export const fromEnvVariables = () => {
  const out: Record<string, string> = {}
  for (const [k,v] of Object.entries(process.env)) {
    if (k.startsWith('LIVETEST_VAR_') && typeof v === 'string') out[k.replace('LIVETEST_VAR_', '').toLowerCase()] = v
  }
  return out
}

export const googleTokenFromEnv = () => {
  return process.env['GOOGLE_API_ACCESS_TOKEN'] || process.env['GSC_TOKEN'] || ''
}
