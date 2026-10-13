import { Preferences } from '@capacitor/preferences'

// Store lightweight JSON data through one interface on Android and the web.
export async function readData(key, fallback = null) {
  const { value } = await Preferences.get({ key: `eatwhat:${key}` })
  if (value === null) return fallback
  try { return JSON.parse(value) } catch { return fallback }
}

export async function writeData(key, value) {
  await Preferences.set({ key: `eatwhat:${key}`, value: JSON.stringify(value) })
}
