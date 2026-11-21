import type { FaceShapeContentSlug } from '@/config/face-shape-content'

type NativeLocale = 'ja' | 'es'

const frameNames: Record<NativeLocale, Record<string, string>> = {
  ja: {
    'rectangle-classic': '長方形のスクエア',
    'square-classic': 'スクエア',
    'geometric-classic': '多角形フレーム',
    'wayfarer-classic': 'ウェリントン',
    'round-classic': 'ラウンド',
    'oval-classic': 'オーバル',
    'rimless-light': 'リムレス（縁なし）',
    'aviator-classic': 'アビエーター',
    'browline-classic': 'ブロー（サーモント）',
    'cat-eye-classic': 'キャットアイ',
    'bottom-weighted-classic': '下側にアクセントのあるフレーム',
    'oversized-classic': '大きめのフレーム',
    'oversized-square-classic': '大きめのスクエア',
  },
  es: {
    'rectangle-classic': 'Montura rectangular',
    'square-classic': 'Montura cuadrada',
    'geometric-classic': 'Montura geométrica',
    'wayfarer-classic': 'Montura tipo wayfarer',
    'round-classic': 'Montura redonda',
    'oval-classic': 'Montura ovalada',
    'rimless-light': 'Gafas al aire, sin aro',
    'aviator-classic': 'Montura de aviador',
    'browline-classic': 'Montura con ceja marcada',
    'cat-eye-classic': 'Montura de ojo de gato',
    'bottom-weighted-classic': 'Montura con borde inferior marcado',
    'oversized-classic': 'Montura grande',
    'oversized-square-classic': 'Montura cuadrada grande',
  },
}

const frameNotes: Record<NativeLocale, Record<FaceShapeContentSlug, Record<string, string>>> = {
  ja: {
    round: {
      'rectangle-classic': '上下の直線で丸い頬にメリハリを。細すぎるものを避け、顔の最も広い部分とフレーム幅を比べましょう。',
      'square-classic': '四角い輪郭で頬の曲線とコントラストを作れます。強く見えすぎるときは、角に丸みのあるものを。',
      'geometric-classic': '多角形の角が目元のアクセントになります。レンズの縦幅とリムの太さも一緒に比べてみましょう。',
      'wayfarer-classic': 'ゆるやかな台形で、直線と丸みの中間を試せます。上側のリムが眉にどう重なるか確認を。',
    },
    oval: {
      'rectangle-classic': '横長の直線で目元をすっきり見せる候補です。浅すぎるレンズより、目が自然に収まる高さを選びましょう。',
      'browline-classic': '太い上側のリムが眉付近を強調します。眉との間隔や、左右にはみ出す幅を見比べましょう。',
      'aviator-classic': 'ティアドロップの曲線で、ゆったりした印象に。下側のリムが頬に当たらないか実際の試着で確認を。',
      'square-classic': '四角い輪郭で目元に存在感を出せます。大きさを変えて比べ、顔よりフレームだけが目立たないか確認しましょう。',
    },
    square: {
      'round-classic': '円形のレンズが顎の直線と対照的に見えます。丸さだけでなく、こめかみを締め付けない幅も大切です。',
      'oval-classic': '横長の曲線で目元をやわらかい印象に。細いリムと太いリムで、輪郭の見え方を比べてみましょう。',
      'rimless-light': '縁が目立たず、顔の輪郭を活かしやすいタイプです。レンズの形とブリッジの掛かり具合を確認しましょう。',
      'aviator-classic': '下側へ丸く絞られる形が顎の角と対照的です。レンズが深すぎて頬に触れないか、笑って確認を。',
    },
    heart: {
      'rimless-light': '額の近くに太い縁を足さず、軽い印象にできます。目元に対してレンズが広すぎないか比べましょう。',
      'round-classic': '丸いレンズが細い顎とやわらかい対比を作ります。レンズ径を変えて、頬とのバランスを見てみましょう。',
      'cat-eye-classic': '控えめなつり上がりで目元を強調する候補です。上の角が大きく張り出すものと、穏やかなものを比べましょう。',
      'bottom-weighted-classic': '下側のラインで頬へ視線を向けやすい形です。太さの印象に加え、笑ったときの頬との間隔も確認を。',
    },
    diamond: {
      'oval-classic': 'なだらかな曲線が頬骨の角とやわらかい対比を作ります。顔の最も広い部分に対して狭すぎない幅を。',
      'rimless-light': '頬骨の近くに太い縁を置かず、輪郭を活かせます。鼻パッドの位置と、レンズ下端の頬との間隔を確認しましょう。',
      'cat-eye-classic': '上がった外側の角が眉付近に視線を集めます。極端に細い形より、ほどよい縦幅のものも比べてみましょう。',
      'browline-classic': '太い上側のリムで、狭めの額側にアクセントを。頬骨の幅に合わせつつ、下側は軽い印象か見てみましょう。',
    },
    oblong: {
      'rectangle-classic': '横長でも、ある程度レンズに高さがあるものが候補です。浅いものと深いものを同じ幅で比べてみましょう。',
      'oversized-classic': '縦幅のあるレンズで頬に掛かる面積を増やせます。大きさだけで選ばず、鼻でずり落ちないか確認を。',
      'browline-classic': '上側の濃いラインが横方向のアクセントになります。下側のリムまでの高さも見て、浅すぎないか比べましょう。',
      'oversized-square-classic': '高さのある四角形で存在感を出せます。横幅まで大きくしすぎず、こめかみ付近の位置を確認しましょう。',
    },
    triangle: {
      'browline-classic': '上側の太いリムが、狭めの額に視線を集めます。顎とのバランスを見ながら、眉付近の幅を比べましょう。',
      'cat-eye-classic': '外側へ上がる角で、目元にアクセントを作れます。つり上がりが強いものと穏やかなものを比べてみましょう。',
      'aviator-classic': '上側のバーと下へ細くなるレンズで、目元を強調できます。頬に触れないレンズの高さも確認を。',
      'geometric-classic': '上側の角がはっきりした形で、額側にメリハリを。細いリムから試すと、形の違いを比べやすくなります。',
    },
  },
  es: {
    round: {
      'rectangle-classic': 'Los bordes rectos contrastan con las mejillas redondeadas. Compara la anchura de la montura con la zona más ancha del rostro.',
      'square-classic': 'El contorno cuadrado aporta ángulos. Si resulta demasiado marcado, prueba esquinas suavizadas y un aro más fino.',
      'geometric-classic': 'Las facetas añaden definición sin depender de un aro grueso. Compara también la altura de las lentes.',
      'wayfarer-classic': 'Su forma suavemente trapezoidal combina líneas rectas y curvas. Mira dónde queda el borde superior respecto a las cejas.',
    },
    oval: {
      'rectangle-classic': 'Las líneas horizontales dan una apariencia más definida. Busca suficiente altura para que los ojos queden bien centrados.',
      'browline-classic': 'El borde superior marcado atrae la atención hacia las cejas. Compara su posición y evita una anchura que sobresalga demasiado.',
      'aviator-classic': 'La curva de lágrima ofrece un aspecto más relajado. Comprueba al probarla que la parte inferior no toque las mejillas.',
      'square-classic': 'El contorno cuadrado da presencia a la mirada. Compara dos tamaños para decidir cuánto protagonismo quieres darle.',
    },
    square: {
      'round-classic': 'Las lentes circulares contrastan con una mandíbula angulosa. Comprueba también que las varillas no presionen las sienes.',
      'oval-classic': 'Las curvas ovaladas suavizan el contorno alrededor de los ojos. Compara aros finos y gruesos para ajustar el contraste.',
      'rimless-light': 'Al dejar el borde casi invisible, destaca menos la montura. La forma de la lente y el apoyo del puente cobran más importancia.',
      'aviator-classic': 'La curva inferior contrasta con los ángulos de la mandíbula. Revisa que las lentes no lleguen a las mejillas al sonreír.',
    },
    heart: {
      'rimless-light': 'Un borde discreto añade poco peso visual junto a la frente. Compara el tamaño de las lentes con la zona de los ojos.',
      'round-classic': 'Los círculos aportan una línea suave frente a un mentón estrecho. Prueba distintos diámetros para ajustar la proporción.',
      'cat-eye-classic': 'Una elevación moderada destaca la mirada. Compara esquinas discretas con otras más abiertas para evitar un efecto demasiado ancho arriba.',
      'bottom-weighted-classic': 'El borde inferior marcado lleva la atención hacia las mejillas. Comprueba su separación al sonreír, además del efecto visual.',
    },
    diamond: {
      'oval-classic': 'Las curvas suaves contrastan con los pómulos angulosos. Busca una anchura que no quede estrecha en la parte más ancha del rostro.',
      'rimless-light': 'El aro casi invisible deja los pómulos despejados. Revisa el apoyo nasal y la distancia entre la lente y la mejilla.',
      'cat-eye-classic': 'Las esquinas elevadas atraen la atención hacia las cejas. Compara una altura moderada con formas muy estrechas.',
      'browline-classic': 'El borde superior marcado da presencia a una frente más estrecha. Compara su anchura con los pómulos y un borde inferior ligero.',
    },
    oblong: {
      'rectangle-classic': 'Busca suficiente altura de lente: un rectángulo muy bajo puede acentuar la longitud. Compara dos alturas con anchuras similares.',
      'oversized-classic': 'Una lente alta ocupa más espacio sobre las mejillas. Verifica que el tamaño no haga que el puente resbale.',
      'browline-classic': 'La línea superior marcada añade un acento horizontal. Valora también la distancia hasta el borde inferior, no solo la ceja.',
      'oversized-square-classic': 'Las lentes cuadradas grandes aportan altura y presencia. Evita aumentar tanto la anchura que las esquinas sobresalgan demasiado.',
    },
    triangle: {
      'browline-classic': 'La parte superior marcada atrae la mirada hacia una frente estrecha. Compara ese ancho visual con el de la mandíbula.',
      'cat-eye-classic': 'Las esquinas elevadas destacan la zona de los ojos. Prueba una inclinación discreta junto a otra más pronunciada.',
      'aviator-classic': 'La barra superior y la lente que se estrecha abajo llevan el énfasis hacia arriba. Revisa la separación con las mejillas.',
      'geometric-classic': 'Los ángulos superiores definidos dan presencia cerca de la frente. Un aro fino permite comparar la forma sin añadir tanto peso visual.',
    },
  },
}

const shapeChecks: Record<NativeLocale, Record<FaceShapeContentSlug, string>> = {
  ja: {
    round: '直線と丸みのどちらを楽しみたいか、幅の近い2本で比較を。頬より極端に狭いものを避け、笑ったときに下のリムが頬に触れないか確かめましょう。',
    oval: '似合う形を一つに絞るより、フレーム幅・レンズの高さ・眉との位置を比較しましょう。顔の縦横バランスと好みの印象で選べます。',
    square: '曲線でやわらげるか、角を活かすかを比べてみましょう。輪郭だけでなく、こめかみの圧迫や鼻のずり落ちも実際に掛けて確認を。',
    heart: '広めの額と細い顎のどちらに視線が向くかを見比べましょう。上側のリムの太さと外側の張り出しを変えると、印象の違いが分かります。',
    diamond: '幅は額だけでなく、最も広い頬骨の位置を基準に。眉側の強調と下側の軽さを見比べ、笑ったときの頬との接触も確認しましょう。',
    oblong: '幅をそろえ、レンズの縦幅を変えて比較してみましょう。大きめを選ぶ場合も、ブリッジのずり落ちや横への張り出しは確認が必要です。',
    triangle: 'ここでは額より顎が広い三角型を扱います。眉側にアクセントがある2本を比べ、フレームの幅と顎のバランスを確認しましょう。',
  },
  es: {
    round: 'Compara líneas rectas y curvas en dos monturas de anchura similar. Evita que queden muy estrechas frente a las mejillas y comprueba el contacto al sonreír.',
    oval: 'Compara anchura, altura de lente y posición respecto a las cejas antes de elegir una forma. La proporción y tu estilo personal ayudan a decidir entre varias opciones.',
    square: 'Decide si prefieres suavizar los ángulos o repetirlos. Pruébate las monturas para comprobar también la presión en las sienes y el apoyo del puente.',
    heart: 'Observa cuánto destacan la frente y el mentón. Cambia el grosor del borde superior y la apertura de las esquinas para comparar el peso visual.',
    diamond: 'Toma como referencia los pómulos, no solo la frente. Compara el énfasis junto a las cejas y un borde inferior ligero; comprueba el contacto al sonreír.',
    oblong: 'Compara lentes de distinta altura manteniendo una anchura parecida. Una montura grande también debe apoyar bien en la nariz y no sobresalir en exceso.',
    triangle: 'Aquí, triangular significa una mandíbula más ancha que la frente. Compara dos monturas con énfasis superior y observa su anchura frente a la mandíbula.',
  },
}

export function getOrdinaryGlassesStyleCopy(
  locale: string,
  shape: FaceShapeContentSlug,
  presetId: string,
): { name: string; note: string } | undefined {
  if (locale !== 'ja' && locale !== 'es') return undefined
  const name = frameNames[locale][presetId]
  const note = frameNotes[locale][shape][presetId]
  return name && note ? { name, note } : undefined
}

export function getOrdinaryGlassesShapeCheck(
  locale: string,
  shape: FaceShapeContentSlug,
): string | undefined {
  return locale === 'ja' || locale === 'es' ? shapeChecks[locale][shape] : undefined
}
