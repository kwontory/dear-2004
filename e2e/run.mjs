/**
 * 브라우저 E2E 실행기: 빌드 결과를 vite preview로 띄우고 모든 *.e2e.mjs를 차례로 돌린다.
 * 각 스위트는 "PASS  이름" / "FAIL  이름 → 이유" 줄을 출력한다.
 *
 *   npm run test:e2e              # 전체
 *   npm run test:e2e -- export    # 이름에 export가 들어간 스위트만
 */
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const OUT = path.join(ROOT, 'e2e', '.output')
const PORT = Number(process.env.E2E_PORT ?? 4180)
const URL = `http://localhost:${PORT}/`
const filter = process.argv[2]

const suites = fs
  .readdirSync(path.join(ROOT, 'e2e'))
  .filter((f) => f.endsWith('.e2e.mjs') && (!filter || f.includes(filter)))
  .sort()

fs.mkdirSync(OUT, { recursive: true })

const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { cwd: ROOT, stdio: 'ignore' })
const stop = () => server.kill()
process.on('exit', stop)

async function waitForServer() {
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(URL)).ok) return
    } catch {
      // 아직 뜨는 중
    }
    await new Promise((r) => setTimeout(r, 250))
  }
  throw new Error(`preview 서버가 뜨지 않았어요: ${URL}`)
}

function runSuite(file) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [path.join(ROOT, 'e2e', file), URL, OUT], { cwd: ROOT })
    let out = ''
    child.stdout.on('data', (d) => (out += d))
    child.stderr.on('data', (d) => (out += d))
    child.on('close', (code) => resolve({ file, code, out }))
  })
}

await waitForServer()
let pass = 0
let fail = 0
let skip = 0
for (const file of suites) {
  const { code, out } = await runSuite(file)
  const lines = out.split('\n')
  const p = lines.filter((l) => l.startsWith('PASS')).length
  const f = lines.filter((l) => l.startsWith('FAIL'))
  const skipped = lines.filter((l) => l.startsWith('SKIP'))
  const crashed = code !== 0 || p + f.length === 0
  pass += p
  fail += f.length + (crashed ? 1 : 0)
  skip += skipped.length
  console.log(
    `${crashed || f.length ? '✗' : '✓'} ${file.padEnd(22)} ${p} passed${f.length ? `, ${f.length} failed` : ''}${skipped.length ? `, ${skipped.length} skipped` : ''}`,
  )
  for (const line of [...f, ...skipped]) console.log(`    ${line}`)
  if (crashed) console.log(out.split('\n').filter((l) => !l.startsWith('PASS')).slice(0, 12).map((l) => `    ${l}`).join('\n'))
}
console.log(`\n브라우저 E2E: ${pass} passed, ${fail} failed${skip ? `, ${skip} skipped` : ''} (${suites.length} suites)`)
stop()
process.exit(fail > 0 ? 1 : 0)
