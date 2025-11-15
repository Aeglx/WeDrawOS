const fs = require('fs')
const path = require('path')
const https = require('https')
const { spawnSync } = require('child_process')

const DEFAULT_MODEL = 'tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf'
const DEFAULT_DIR = path.resolve(__dirname, 'models')
const DEFAULT_PATH = path.join(DEFAULT_DIR, DEFAULT_MODEL)
const MODEL_PATH = process.env.AI_MODEL_PATH
  ? path.isAbsolute(process.env.AI_MODEL_PATH)
    ? process.env.AI_MODEL_PATH
    : path.resolve(process.cwd(), process.env.AI_MODEL_PATH)
  : DEFAULT_PATH

const MIRRORS = [
  'https://huggingface.co/TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF/resolve/main/tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf?download=true',
  'https://hf-mirror.com/TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF/resolve/main/tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf',
  'https://mirror.ghproxy.com/https://huggingface.co/TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF/resolve/main/tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf'
]

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

function downloadNode(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest)
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        file.close()
        fs.unlink(dest, () => {})
        return reject(new Error(`下载失败，状态码: ${res.statusCode}`))
      }

      const total = parseInt(res.headers['content-length'] || '0', 10)
      let received = 0

      res.on('data', (chunk) => {
        received += chunk.length
        if (total) {
          const percent = ((received / total) * 100).toFixed(2)
          process.stdout.write(`\r正在下载AI模型 ${percent}% (${(received / (1024 * 1024)).toFixed(2)}MB/${(total / (1024 * 1024)).toFixed(2)}MB)`)
        } else {
          process.stdout.write(`\r已下载 ${(received / (1024 * 1024)).toFixed(2)}MB`)
        }
      })

      res.pipe(file)
      file.on('finish', () => {
        file.close(() => {
          process.stdout.write('\n')
          resolve()
        })
      })
    }).on('error', (err) => {
      file.close()
      fs.unlink(dest, () => {})
      reject(err)
    })
  })
}

function downloadPowerShell(url, dest) {
  const cmd = `Invoke-WebRequest -Uri \"${url}\" -OutFile \"${dest}\" -UseBasicParsing`
  const result = spawnSync('powershell', ['-Command', cmd], { stdio: 'inherit' })
  if (result.status !== 0) {
    throw new Error('PowerShell下载失败')
  }
}

async function main() {
  const modelDir = path.dirname(MODEL_PATH)
  ensureDir(modelDir)

  if (fs.existsSync(MODEL_PATH)) {
    console.log(`AI模型已存在: ${MODEL_PATH}`)
    return
  }

  console.log('AI模型不存在，开始自动下载...')
  console.log(`目标文件: ${MODEL_PATH}`)
  console.log('来源镜像: ', MIRRORS.join(' | '))

  let success = false
  for (const url of MIRRORS) {
    console.log(`尝试下载: ${url}`)
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        await downloadNode(url, MODEL_PATH)
        console.log('AI模型下载完成')
        success = true
        break
      } catch (e) {
        console.warn(`Node下载失败[${attempt}]:`, e.message)
      }
    }
    if (success) break
    // Node失败后尝试PowerShell
    try {
      downloadPowerShell(url, MODEL_PATH)
      console.log('AI模型下载完成 (PowerShell)')
      success = true
      break
    } catch (e) {
      console.warn('PowerShell下载失败:', e.message)
    }
  }

  if (!success) {
    console.error('AI模型下载失败：所有镜像均不可用')
    console.error('请检查网络或使用以下任一链接手动下载并放置到目标路径:')
    MIRRORS.forEach(u => console.error(' - ' + u))
    console.error(`目标路径: ${MODEL_PATH}`)
    if (process.env.AI_PREPARE_SOFT === '1') {
      console.error('软失败模式已启用，继续启动其他服务')
      return
    }
    process.exitCode = 1
  }
}

main()