const { revalidateTag } = require('next/cache')

// 这个脚本需要在Next.js应用中运行
// 我们可以通过API路由来清除缓存

console.log('缓存清除脚本')
console.log('请访问以下URL来清除缓存:')
console.log('http://localhost:3000/api/admin/clear-cache')
console.log('或者')
console.log('https://visutry.vercel.app/api/admin/clear-cache')
