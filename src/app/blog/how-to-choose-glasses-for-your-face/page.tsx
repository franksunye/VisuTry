import { Metadata } from 'next'
import { generateSEO, generateStructuredData } from '@/lib/seo'
import Link from 'next/link'
import { ArrowLeft, Glasses, Share2 } from 'lucide-react'

export const metadata: Metadata = generateSEO({
  title: '如何根据脸型选择适合的眼镜？完整指南',
  description: '详细解析不同脸型适合的眼镜款式，包括圆脸、方脸、长脸等专业建议。使用AI试戴工具找到最佳搭配。',
  url: '/blog/how-to-choose-glasses-for-your-face',
  type: 'article',
})

// 结构化数据
const structuredData = generateStructuredData('article', {
  title: '如何根据脸型选择适合的眼镜？完整指南',
  description: '详细解析不同脸型适合的眼镜款式，包括圆脸、方脸、长脸等专业建议。',
  publishedAt: '2025-10-15T10:00:00Z',
  modifiedAt: '2025-10-15T10:00:00Z',
  author: 'VisuTry团队',
  image: '/blog/face-shape-guide.jpg',
})

export default function BlogPostPage() {
  return (
    <>
      {/* 结构化数据 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-12">
          {/* 返回按钮 */}
          <div className="mb-8">
            <Link
              href="/blog"
              className="inline-flex items-center text-blue-600 hover:text-blue-800"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回博客
            </Link>
          </div>

          {/* 文章内容 */}
          <article className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
            {/* 文章头部 */}
            <div className="h-64 bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center">
              <div className="text-center text-white">
                <Glasses className="w-16 h-16 mx-auto mb-4" />
                <h1 className="text-3xl font-bold">脸型与眼镜搭配指南</h1>
              </div>
            </div>

            {/* 文章元信息 */}
            <div className="p-8 border-b">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>作者：VisuTry团队</span>
                  <span>发布时间：2025年10月15日</span>
                  <span>阅读时间：5分钟</span>
                </div>
                <button className="flex items-center text-blue-600 hover:text-blue-800">
                  <Share2 className="w-4 h-4 mr-1" />
                  分享
                </button>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                如何根据脸型选择适合的眼镜？完整指南
              </h1>
              <p className="text-xl text-gray-600">
                选择合适的眼镜不仅能提升视力，更能完美修饰脸型。本文将详细介绍不同脸型的眼镜搭配技巧。
              </p>
            </div>

            {/* 文章正文 */}
            <div className="p-8 prose prose-lg max-w-none">
              <h2>为什么脸型很重要？</h2>
              <p>
                选择眼镜时，脸型是最重要的考虑因素之一。合适的眼镜能够：
              </p>
              <ul>
                <li>平衡面部比例</li>
                <li>突出最佳特征</li>
                <li>提升整体气质</li>
                <li>增强自信心</li>
              </ul>

              <h2>不同脸型的眼镜选择指南</h2>

              <h3>1. 圆脸型</h3>
              <p>
                <strong>特征：</strong>脸部宽度和长度相近，下巴较圆润，颧骨不明显。
              </p>
              <p>
                <strong>推荐眼镜：</strong>
              </p>
              <ul>
                <li>方形或矩形镜框</li>
                <li>角度分明的设计</li>
                <li>镜框宽度略大于脸部最宽处</li>
              </ul>

              <h3>2. 方脸型</h3>
              <p>
                <strong>特征：</strong>额头、颧骨、下颌宽度相近，下巴线条较为方正。
              </p>
              <p>
                <strong>推荐眼镜：</strong>
              </p>
              <ul>
                <li>圆形或椭圆形镜框</li>
                <li>柔和的曲线设计</li>
                <li>避免过于方正的款式</li>
              </ul>

              <h3>3. 长脸型</h3>
              <p>
                <strong>特征：</strong>脸部长度明显大于宽度，额头较高。
              </p>
              <p>
                <strong>推荐眼镜：</strong>
              </p>
              <ul>
                <li>大框或宽框设计</li>
                <li>装饰性较强的镜框</li>
                <li>低鼻梁设计</li>
              </ul>

              <h3>4. 心形脸</h3>
              <p>
                <strong>特征：</strong>额头较宽，下巴尖细，呈倒三角形。
              </p>
              <p>
                <strong>推荐眼镜：</strong>
              </p>
              <ul>
                <li>下半框较重的设计</li>
                <li>猫眼形状</li>
                <li>避免上半部分过于厚重</li>
              </ul>

              {/* CTA区域 */}
              <div className="bg-blue-50 p-6 rounded-lg my-8">
                <h3 className="text-xl font-bold text-blue-900 mb-4">
                  🔍 立即体验AI虚拟试戴
                </h3>
                <p className="text-blue-800 mb-4">
                  不确定哪款眼镜适合你？使用我们的AI虚拟试戴工具，上传照片即可看到试戴效果！
                </p>
                <Link
                  href="/"
                  className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  开始试戴
                </Link>
              </div>

              <h2>选择眼镜的其他考虑因素</h2>

              <h3>肤色搭配</h3>
              <p>
                除了脸型，肤色也是选择眼镜的重要因素：
              </p>
              <ul>
                <li><strong>暖色调肌肤：</strong>适合金色、棕色、橙色镜框</li>
                <li><strong>冷色调肌肤：</strong>适合银色、黑色、蓝色镜框</li>
              </ul>

              <h3>生活方式</h3>
              <p>
                考虑你的日常活动和职业需求：
              </p>
              <ul>
                <li>运动爱好者：选择轻便、防滑的材质</li>
                <li>商务人士：选择经典、专业的款式</li>
                <li>时尚达人：可以尝试大胆的设计</li>
              </ul>

              <h2>总结</h2>
              <p>
                选择合适的眼镜需要综合考虑脸型、肤色、生活方式等多个因素。
                最重要的是，选择让你感到自信和舒适的款式。
              </p>
              <p>
                使用VisuTry的AI虚拟试戴技术，你可以轻松尝试不同款式，
                找到最适合自己的眼镜。
              </p>
            </div>

            {/* 文章底部 */}
            <div className="p-8 bg-gray-50 border-t">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  标签：眼镜选择、脸型搭配、时尚指南
                </div>
                <Link
                  href="/"
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  立即试戴
                </Link>
              </div>
            </div>
          </article>
        </div>
      </div>
    </>
  )
}
