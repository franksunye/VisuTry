import { StaticContentImage } from '@/components/seo/StaticContentImage'
import { B02_VISUAL_SEO_ASSETS } from '@/config/visual-seo-assets'

// Reuse the accepted editorial comparison; this is not a user report or a
// live Try-On result. Keep its existing public asset URL and English owners.
const comparisonImage = B02_VISUAL_SEO_ASSETS.find((asset) => asset.id === 'VSEO-011')!

const frameNotes = [
  {
    name: '長方形（左端）',
    appearance: '濃い色のフレームと直線的な上辺が、目元の輪郭をはっきり見せています。',
    choice: '目元にメリハリを出したいときの候補に。丸型と比べて、太さや横幅が強すぎないかを見ます。',
  },
  {
    name: '丸型（左から2番目）',
    appearance: 'レンズの丸い輪郭と、長方形より細いフレームが見えます。',
    choice: '曲線のある印象が好みなら候補に。顔幅に対して小さく見えすぎないかも比べます。',
  },
  {
    name: 'キャットアイ（左から3番目）',
    appearance: 'フレームの外側が持ち上がり、目尻側の線が目立ちます。',
    choice: '外側のラインをアクセントにしたいときの候補に。眉との間隔や、上辺の存在感を確認します。',
  },
  {
    name: 'アビエーター（右端）',
    appearance: '細い金属調の縁と、下にふくらむレンズの形が見えます。',
    choice: '縁の目立ちにくさが好みなら候補に。レンズの縦幅や頬との位置関係を見比べます。',
  },
] as const

/** One Japanese editorial example on the existing photo-first selection owner. */
export function JapaneseGlassesSelectionExample() {
  return (
    <section id="frame-selection-example" aria-labelledby="frame-selection-example-title" className="mt-12 scroll-mt-8 space-y-6">
      <div className="max-w-3xl">
        <p className="mb-2 text-sm font-semibold text-blue-700">写真で比べる、メガネ選びの例</p>
        <h2 id="frame-selection-example-title" className="text-2xl font-bold leading-relaxed text-gray-950 md:text-3xl">
          同じ顔で、フレームの違いを見てみる
        </h2>
        <p className="mt-3 text-base leading-8 text-gray-700">
          顔型が分かったら、次は「どんな印象にしたいか」で候補を絞ります。
          まず長方形と丸型の2つを比べ、好みが近い方を出発点にすると、違いを見つけやすくなります。
          下の例では、形だけでなく縁の太さや色も変わっています。
        </p>
      </div>

      <figure className="overflow-hidden rounded-xl border border-gray-200 bg-white p-3 sm:p-5">
        <StaticContentImage
          src={comparisonImage.publicPath}
          alt="同じモデルで、左から長方形、丸型、キャットアイ、アビエーターの4種類のメガネを比べるイメージ"
          width={comparisonImage.width}
          height={comparisonImage.height}
          sizes="(max-width: 768px) 100vw, 1120px"
          className="h-auto w-full"
        />
        <figcaption className="mt-3 text-sm leading-6 text-gray-600">
          比較用イメージ：左から長方形、丸型、キャットアイ、アビエーター。
          同じモデルを使って一般的な見方を説明する例で、個別診断の結果ではありません。
        </figcaption>
      </figure>

      <div className="grid gap-4 md:grid-cols-2">
        {frameNotes.map((frame) => (
          <article key={frame.name} className="rounded-lg border border-gray-200 bg-white p-5">
            <h3 className="font-semibold text-gray-950">{frame.name}</h3>
            <p className="mt-2 text-sm leading-7 text-gray-700">{frame.appearance}</p>
            <p className="mt-2 text-sm leading-7 text-gray-600">{frame.choice}</p>
          </article>
        ))}
      </div>

      <div className="rounded-lg border border-gray-200 bg-gray-50 p-5 sm:p-6">
        <h3 className="text-lg font-semibold text-gray-950">見た目を絞ったら、実際のサイズも確認</h3>
        <p className="mt-3 text-sm leading-7 text-gray-700">
          写真から分かるのは見た目のバランスです。鼻への当たり方、こめかみの締めつけ、耳まわりの掛け心地は、画像だけでは確認できません。
          サイズ表記の例として「52□18–145」は、通常、レンズ幅52mm・ブリッジ幅18mm・テンプル長145mmを表します。
          この数字はフレーム全幅ではないので、掛け心地のよい手持ちのメガネと比べ、実寸や調整の可否を販売店に確認しましょう。
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <article className="rounded-lg border border-blue-100 bg-blue-50 p-5">
          <h3 className="font-semibold text-gray-950">顔型の目安は、無料で確認</h3>
          <p className="mt-2 text-sm leading-7 text-gray-700">
            無料の顔型診断はログイン不要です。写真は端末のブラウザ内で処理し、顔型の傾向を推定します。
            ここで紹介した見方は、一般的なフレーム選びの参考にできます。
          </p>
        </article>
        <article className="rounded-lg border border-gray-200 bg-white p-5">
          <h3 className="font-semibold text-gray-950">個別のレポートは、AIメガネアドバイザーへ</h3>
          <p className="mt-2 text-sm leading-7 text-gray-700">
            AIメガネアドバイザーは、写真を使った個別分析です。
            おすすめフレーム（Top Picks）など、レポートの詳細はクレジットで解除します。
          </p>
        </article>
      </div>

      <p className="max-w-3xl text-sm leading-7 text-gray-700">
        試したい商品が見つかったら、ご自身の顔写真と、そのメガネの商品画像やショップのスクリーンショットを用意して試着できます。
        この図のフレームは見比べ方の参考です。実際に検討している商品の見た目を確認し、サイズや掛け心地は販売店で確かめてください。
      </p>
    </section>
  )
}
