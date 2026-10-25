// Writes demo meals straight into the debug app's storage on the connected phone (not part of the app).
// Usage: npm run seed:device   (ANDROID_SERIAL picks a phone when several are attached)
// Earlier record_demo_* meals are replaced so dates stay recent; every other record is kept.
import { execFileSync } from 'node:child_process'
import { existsSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { demoRecords } from './demoData.js'

const app = 'io.github.baizhitiao.eatwhat', file = 'shared_prefs/CapacitorStorage.xml'
const sdkAdb = join(process.env.LOCALAPPDATA ?? '', 'Android/Sdk/platform-tools/adb.exe')
const adbPath = process.env.ADB ?? (existsSync(sdkAdb) ? sdkAdb : 'adb')
const adb = (args, input) => execFileSync(adbPath, args, { input, maxBuffer: 64 << 20 }).toString('utf8')

const unescape = text => text.replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
const escape = text => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const parse = xml => new Map([...xml.matchAll(/<string name="([^"]*)">([^<]*)<\/string>/g)].map(([, key, value]) => [unescape(key), unescape(value)]))
const serialize = entries => `<?xml version='1.0' encoding='utf-8' standalone='yes' ?>\n<map>\n${
  [...entries].map(([key, value]) => `    <string name="${escape(key)}">${escape(value)}</string>`).join('\n')}\n</map>\n`

adb(['shell', 'am', 'force-stop', app])
let original = ''
try { original = adb(['exec-out', 'run-as', app, 'cat', file]) } catch { /* first run: no storage yet */ }
if (original && !original.includes('<map')) throw new Error(`无法读取 ${file}：${original.trim()}`)
if (original) {
  const backup = join(tmpdir(), `eatwhat-backup-${Date.now()}.xml`)
  writeFileSync(backup, original)
  console.log(`原数据已备份：${backup}`)
}

const entries = parse(original)
if ((entries.get('eatwhat:version') ?? '1') !== '1') throw new Error('手机上的数据版本不是 1，已停止')
const kept = JSON.parse(entries.get('eatwhat:records') ?? '[]').filter(record => !record.id.startsWith('record_demo_'))
const demo = demoRecords()
entries.set('eatwhat:version', '1')
entries.set('eatwhat:records', JSON.stringify([...kept, ...demo]))

const xml = serialize(entries)
adb(['exec-in', `run-as ${app} sh -c 'cat > ${file}'`], xml)
if (adb(['exec-out', 'run-as', app, 'cat', file]) !== xml) throw new Error('写入后校验不一致')
adb(['shell', 'am', 'start', '-n', `${app}/.MainActivity`])
console.log(`已写入 ${demo.length} 条演示记录，保留 ${kept.length} 条其他记录，并已重新打开应用。`)
