import type { FaceShapeContentSlug } from '@/config/face-shape-content'

type ShapeNotes = Record<FaceShapeContentSlug, string>
type Faq = readonly { question: string; answer: string }[]

type PriorityLocaleCopy = {
  detector: {
    metaTitle: string
    metaDescription: string
    title: string
    intro: string
    trust: readonly { title: string; text: string }[]
    tipsTitle: string
    tips: readonly string[]
    manualTitle: string
    manualText: string
    manualLink: string
    faq: Faq
  }
  glasses: {
    guideTitle: string
    guideIntro: string
    columns: readonly [string, string, string, string]
    tryFirst: ShapeNotes
    avoidFirst: ShapeNotes
    reasons: ShapeNotes
    faq: Faq
  }
}

/** Hand-curated decision guidance for the two locales with measured search growth.
 * Keeps title, canonical, URLs and pricing claims in the existing SEO contract.
 */
export const priorityLocaleCopy = {
  ja: {
    detector: {
      metaTitle: '顔の形診断 カメラ・写真で無料チェック | VisuTry',
      metaDescription: '顔の形診断を写真1枚で無料チェック。ログイン不要、画像はブラウザ内で処理。卵型・丸型など7種類の傾向を知り、似合うメガネ探しへ。',
      title: '顔の形診断｜写真で無料チェック',
      intro: '顔の形が気になる方へ。正面写真を選ぶと、ブラウザ内で7種類の顔型の傾向を推定します。無料・ログイン不要。画像はサーバーに送信せず、診断結果をメガネ選びの目安にできます。',
      trust: [
        { title: '写真は端末内で処理', text: '無料診断では写真をサーバーに送信せず、ブラウザ内で解析します。' },
        { title: '顔の比率を推定', text: '輪郭や顔の測定点から、7種類の顔型の傾向を推定します。' },
        { title: 'メガネ選びの出発点', text: '結果だけで決めず、フレームの幅やバランスも確認しましょう。' },
      ],
      tipsTitle: '顔型を判定しやすい写真の撮り方',
      tips: [
        '顔を中央に置き、正面を向いて自然な表情にします。',
        '両目が水平になるようにして、十分な明るさを確保します。',
        '前髪を上げて、額・頬・あごの輪郭を見せます。',
        '強い影、加工フィルター、極端な広角撮影を避けます。',
      ],
      manualTitle: '写真を使わずに確認したい場合',
      manualText: '顔の縦横比や額・頬・あごの幅を自分で比較することもできます。',
      manualLink: '顔の測り方を見る',
      faq: [
        { question: '無料で顔型を診断できますか？', answer: 'はい。無料診断にはログインもクレジットも必要ありません。' },
        { question: '写真はアップロードされますか？', answer: 'いいえ。無料の顔型診断では写真をブラウザ内で処理します。' },
        { question: '診断結果だけでメガネを選べますか？', answer: '顔型は候補を絞る参考です。幅・ブリッジ・好みを確認し、必要なら写真で試着しましょう。' },
        { question: '顔型の推定には誤差がありますか？', answer: 'あります。姿勢、光、髪型、複数の特徴を持つ顔型によって結果が変わることがあります。' },
      ],
    },
    glasses: {
      guideTitle: '顔型別・似合うメガネの選び方',
      guideIntro: '顔型は最初のヒントです。7種類それぞれの候補と注意点を比較し、幅や掛け心地も確かめてください。',
      columns: ['顔型', '試したいフレーム', 'まず注意する形', '選ぶ理由'],
      tryFirst: {
        oval: 'ウェリントン、ボストン、ブロー、アビエーター',
        round: 'スクエア、長方形、角のあるフレーム',
        square: '丸型、楕円、細身のメタルフレーム',
        heart: '軽い丸型、細身のフレーム、控えめなキャットアイ',
        diamond: '楕円、リムレス、キャットアイ、ブロー',
        oblong: '縦幅のあるウェリントン、少し大きめのフレーム',
        triangle: 'ブロー、キャットアイ、上部に存在感のある形',
      },
      avoidFirst: {
        oval: '顔幅より極端に狭いフレーム',
        round: '頬の内側に収まる小さすぎる丸型',
        square: '角を過度に強調する重いスクエア',
        heart: '額側だけを強調する大きく重い上部',
        diamond: '頬骨を窮屈に見せる細すぎる形',
        oblong: '顔の縦長感を強調する浅すぎるレンズ',
        triangle: 'あご周りの幅を強調する下部の重い形',
      },
      reasons: {
        oval: '輪郭のバランスがよく、形よりも幅とサイズ感が重要です。',
        round: '直線的な輪郭が、丸みのある顔立ちにコントラストを加えます。',
        square: '柔らかい曲線が額やあごの角を穏やかに見せます。',
        heart: '軽いデザインが額とあごの印象を整えます。',
        diamond: '頬骨とのバランスを取りつつ目元にほどよい幅を加えます。',
        oblong: 'レンズの縦幅が顔の縦長感をやわらげます。',
        triangle: 'フレーム上部の存在感が額とあごのバランスを整えます。',
      },
      faq: [
        { question: '自分に似合うメガネは顔型だけで決まりますか？', answer: 'いいえ。顔型は候補を絞るヒントで、幅・ブリッジ・レンズの高さ・好みも重要です。' },
        { question: '無料で顔型を確認できますか？', answer: 'はい。顔型診断は無料で、写真はブラウザ内で処理されます。' },
        { question: '候補のメガネをどう比較しますか？', answer: '商品画像やスクリーンショットを用意してバーチャル試着し、見た目の違いを比較できます。実際の掛け心地は別途ご確認ください。' },
      ],
    },
  },
  es: {
    detector: {
      metaTitle: '¿Qué forma tiene mi rostro? Detector gratis | VisuTry',
      metaDescription: 'Descubre tu tipo de rostro con una foto gratis y sin registro. El análisis se hace en tu navegador; después puedes explorar monturas para tu cara.',
      title: 'Descubre tu forma de rostro gratis con una foto',
      intro: 'Elige una foto frontal para estimar si tu rostro es ovalado, redondo, cuadrado, corazón, diamante, alargado o triangular. La imagen se procesa en tu navegador, sin subirla al servidor. Usa el resultado como orientación para elegir gafas.',
      trust: [
        { title: 'Tu foto permanece en el dispositivo', text: 'El detector gratuito procesa la imagen en tu navegador, sin enviarla al servidor.' },
        { title: 'Estimación basada en proporciones', text: 'Los puntos faciales ayudan a estimar una de siete formas de rostro.' },
        { title: 'Una guía para elegir monturas', text: 'Usa el resultado para comparar estilos, no como una regla absoluta.' },
      ],
      tipsTitle: 'Cómo conseguir una foto útil para el análisis',
      tips: [
        'Mira de frente a la cámara con una expresión natural y un solo rostro visible.',
        'Mantén los ojos a la misma altura y utiliza luz uniforme.',
        'Aparta el pelo para mostrar la frente, los pómulos y la mandíbula.',
        'Evita filtros, sombras intensas y objetivos muy angulares.',
      ],
      manualTitle: '¿Prefieres comprobarlo sin foto?',
      manualText: 'También puedes comparar la longitud del rostro y la anchura de la frente, los pómulos y la mandíbula.',
      manualLink: 'Ver la guía de medidas',
      faq: [
        { question: '¿El detector de forma de rostro es gratis?', answer: 'Sí. No necesitas crear una cuenta ni gastar créditos.' },
        { question: '¿Se sube mi foto a VisuTry?', answer: 'No. El detector gratuito procesa la imagen en la memoria de tu navegador.' },
        { question: '¿Qué hago después de conocer mi forma de rostro?', answer: 'Usa el resultado para elegir algunas monturas, compara las proporciones y prueba tus modelos favoritos con una foto.' },
        { question: '¿El resultado es exacto en todos los casos?', answer: 'No. La pose, la iluminación, el cabello y las proporciones mixtas pueden influir en la estimación.' },
      ],
    },
    glasses: {
      guideTitle: 'Qué monturas probar según la forma de tu rostro',
      guideIntro: 'La forma del rostro es un punto de partida. Compara opciones y límites de cada estilo; verifica el ancho, el puente y la comodidad antes de comprar.',
      columns: ['Forma del rostro', 'Prueba primero', 'Reconsidera', 'Por qué'],
      tryFirst: {
        oval: 'Rectangulares equilibradas, browline y aviador',
        round: 'Rectangulares, cuadradas y geométricas',
        square: 'Redondas, ovaladas y metálicas finas',
        heart: 'Monturas ligeras, redondeadas y cat-eye discretas',
        diamond: 'Ovaladas, al aire, cat-eye y browline',
        oblong: 'Rectangulares altas y monturas con más profundidad de lente',
        triangle: 'Browline, cat-eye y monturas con parte superior marcada',
      },
      avoidFirst: {
        oval: 'Monturas demasiado estrechas para el rostro',
        round: 'Círculos muy pequeños que acentúen las mejillas',
        square: 'Monturas cuadradas pesadas que remarquen la mandíbula',
        heart: 'Partes superiores muy pesadas que destaquen la frente',
        diamond: 'Monturas muy estrechas que compriman los pómulos',
        oblong: 'Lentes demasiado bajas que alarguen la apariencia',
        triangle: 'Monturas con exceso de peso visual en la parte inferior',
      },
      reasons: {
        oval: 'Las proporciones equilibradas permiten muchos estilos; prioriza el ancho y la escala.',
        round: 'Las líneas angulares aportan contraste a un contorno más suave.',
        square: 'Las curvas suavizan visualmente la frente y la mandíbula marcadas.',
        heart: 'La ligereza equilibra una frente más ancha con una barbilla más estrecha.',
        diamond: 'Aportan presencia alrededor de los ojos sin saturar los pómulos.',
        oblong: 'La profundidad de las lentes puede equilibrar un rostro más largo.',
        triangle: 'Una línea superior definida equilibra la frente con una mandíbula más ancha.',
      },
      faq: [
        { question: '¿La forma de rostro determina qué gafas me quedan bien?', answer: 'No por sí sola. También importan el ancho, la altura de las lentes, el puente y tus preferencias.' },
        { question: '¿Puedo saber mi forma de rostro gratis?', answer: 'Sí. Puedes usar el detector gratuito sin iniciar sesión y con procesamiento en tu navegador.' },
        { question: '¿Cómo comparo las monturas recomendadas?', answer: 'Prepara la imagen del producto o una captura de la tienda y prueba varias opciones con tu foto. La prueba virtual no confirma el ajuste físico.' },
      ],
    },
  },
} satisfies Record<'ja' | 'es', PriorityLocaleCopy>
