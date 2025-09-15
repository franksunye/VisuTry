import { Glasses, Upload, Sparkles, Share2 } from 'lucide-react'
import { LoginButton } from '@/components/auth/LoginButton'

export default function Home() {
  return (
    <main className="container mx-auto px-4 py-8">
      {/* Header */}
      <header className="text-center mb-12">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <Glasses className="w-12 h-12 text-blue-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-800">VisuTry</h1>
          </div>
          <LoginButton />
        </div>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          使用AI技术体验虚拟眼镜试戴，找到最适合你的眼镜款式
        </p>
      </header>

      {/* Hero Section */}
      <section className="max-w-4xl mx-auto mb-16">
        <div className="glass-effect rounded-2xl p-8 text-center">
          <h2 className="text-3xl font-semibold mb-6 text-gray-800">
            三步轻松试戴眼镜
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Upload className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">上传照片</h3>
              <p className="text-gray-600">上传你的正面照片</p>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <Sparkles className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">AI试戴</h3>
              <p className="text-gray-600">选择眼镜款式，AI为你试戴</p>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Share2 className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">分享结果</h3>
              <p className="text-gray-600">保存并分享你的试戴效果</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="text-center">
        <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-lg text-lg transition-colors duration-200 shadow-lg hover:shadow-xl">
          开始试戴
        </button>
        <p className="text-sm text-gray-500 mt-4">
          免费试戴3次，升级套餐享受更多功能
        </p>
      </section>
    </main>
  )
}
