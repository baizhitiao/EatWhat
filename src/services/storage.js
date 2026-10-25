import { Preferences } from '@capacitor/preferences'

export async function readData(key, fallback = undefined) {
  const { value } = await Preferences.get({ key: `eatwhat:${key}` })
  if (value === null) return fallback
  try { return JSON.parse(value) } catch { throw new SyntaxError(`本地 ${key} 数据无法解析`) }
}

export async function writeData(key, value) {
  await Preferences.set({ key: `eatwhat:${key}`, value: JSON.stringify(value) })
}

// Preserve damaged input before any repair writes back to the original key.
export async function backupData(key) {
  const { value } = await Preferences.get({ key: `eatwhat:${key}` })
  if (value !== null) await Preferences.set({ key: `eatwhat:recovery:${key}:${Date.now()}`, value })
}
