// Gera os executáveis de Windows, macOS e Linux que a máquina atual consegue.
// - macOS só é gerado em macOS (limite do electron-builder).
// - Linux (AppImage) no Windows precisa do Modo Desenvolvedor ligado (links simbólicos); sem ele falha com EPERM.
// O workflow .github/workflows/electron-build.yml gera os três, cada um no seu sistema.
// A plataforma da máquina atual é obrigatória; as outras são "melhor esforço" (avisam, mas não derrubam o build).
import { spawnSync } from 'node:child_process'

const own = { win32: '--win', darwin: '--mac', linux: '--linux' }[process.platform]
const others = ['--win', '--mac', '--linux'].filter((flag) => flag !== own)
const extra = process.argv.slice(2)

function build(flag) {
  return spawnSync('npx', ['electron-builder', flag, ...extra], { stdio: 'inherit', shell: true }).status === 0
}

if (!own || !build(own)) process.exit(1)

for (const flag of others) {
  if (flag === '--mac' && process.platform !== 'darwin') {
    console.warn('\nAviso: o pacote de macOS só é gerado em macOS ou pelo workflow do GitHub Actions. Pulando --mac.')
  } else if (!build(flag)) {
    console.warn(`\nAviso: não foi possível gerar ${flag} nesta máquina. Pulando.`)
  }
}
