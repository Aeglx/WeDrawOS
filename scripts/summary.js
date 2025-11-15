const axios = require('axios')

const apiPort = Number(process.env.PORT) || 3000
const adminPort = Number(process.env.ADMIN_PORT) || 6000
const buyerPort = Number(process.env.BUYER_PORT) || 4000
const sellerPort = Number(process.env.SELLER_PORT) || 5000

const targets = [
  { name: 'API', url: `http://localhost:${apiPort}/api/health`, display: `http://localhost:${apiPort}` },
  { name: '管理端', url: `http://localhost:${adminPort}`, display: `http://localhost:${adminPort}` },
  { name: '买家端', url: `http://localhost:${buyerPort}`, display: `http://localhost:${buyerPort}` },
  { name: '卖家端', url: `http://localhost:${sellerPort}`, display: `http://localhost:${sellerPort}` }
]

async function waitFor(url) {
  for (let i = 0; i < 120; i++) {
    try {
      await axios.get(url, { timeout: 1000 })
      return true
    } catch (e) {
      await new Promise(r => setTimeout(r, 1000))
    }
  }
  return false
}

;(async () => {
  console.log('========================================')
  console.log('项目地址摘要')
  console.log('========================================')

  for (const t of targets) {
    const ok = await waitFor(t.url)
    if (ok) {
      console.log(`✅ ${t.name}: ${t.display}`)
    } else {
      console.log(`⚠️ ${t.name}: 未就绪 (${t.display})`)
    }
  }

  console.log('========================================')
})()