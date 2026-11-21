import type { FaceShapeContentSlug } from '@/config/face-shape-content'
import type { SunglassesStyleRecommendation } from '@/config/sunglasses-face-shape-content'

// Native explanations follow the actual frame shown, not a repeated face-shape slogan.
const styleReasons: Record<'ja' | 'es', Record<FaceShapeContentSlug, Record<string, string>>> = {
  ja: {
    oval: {
      'sun-wayfarer-black': '程よい角が輪郭を引き締めます。顔の幅から大きくはみ出さないサイズを選びましょう。',
      'sun-aviator-gold': 'しずく形のレンズが縦のラインになじみます。下端が頬に触れない深さが目安です。',
      'sun-cat-eye-black': '目尻側の上がりが頬骨を引き立てます。眉との角度を比べて、強さを選びましょう。',
      'sun-oversized-gradient': '大きめのレンズで印象を変えられます。横幅だけでなく、眉から頬までの収まりも確認してください。',
    },
    round: {
      'sun-wayfarer-black': '直線的な上辺と角が、丸みのある頬やあごにメリハリを加えます。',
      'sun-cat-eye-black': '目尻側の上がりで視線が上へ向きます。細すぎず、こめかみに合う幅を選びましょう。',
      'sun-narrow-rectangle-black': '横長の角形が輪郭に直線を足します。レンズが浅くても、フレーム幅まで狭くしすぎないのがコツです。',
      'sun-curved-flat-top-black': 'はっきりした上辺でシャープな印象に。眉との位置と、笑ったときの頬の当たりを確認してください。',
    },
    square: {
      'sun-round-tortoise': '丸いレンズが、直線的なあごや額と対比をつくります。小さすぎないサイズから比べましょう。',
      'sun-aviator-gold': 'しずく形の曲線と細いリムで柔らかさを加えます。レンズの下端が頬に触れないか確認してください。',
      'sun-oversized-gradient': '角の丸い大きめのレンズで、顔の幅に合う存在感を出せます。横に広がりすぎないサイズを選びましょう。',
      'sun-cat-eye-black': 'ゆるやかな上がりが動きを加えます。角張りの強い形より、外側に丸みのあるタイプが比較しやすいです。',
    },
    heart: {
      'sun-aviator-gold': '下へ細くなるレンズが顔の輪郭になじみます。細いリムなら上部を重く見せにくくなります。',
      'sun-cat-eye-black': '控えめな上がりが頬骨に沿います。太い上辺や大きな装飾を避けると、軽い印象を保ちやすくなります。',
      'sun-wayfarer-black': '丸みのある下側の角で、額の幅を強調しすぎず輪郭を引き締めます。',
      'sun-oversized-gradient': '縦幅のあるレンズが下側にも存在感を足します。大きさだけで選ばず、頬に触れない位置を確認しましょう。',
    },
    diamond: {
      'sun-cat-eye-black': '上がった外側の角が、頬骨より上に幅を足します。フレームの下端が頬骨に乗らないか確認してください。',
      'sun-round-tortoise': '丸いレンズが、頬骨からあごへ続く角度を和らげます。頬幅に対して小さすぎないものから比べましょう。',
      'sun-oversized-gradient': '柔らかな角と十分な幅で、頬骨まわりに余裕をつくれます。大きすぎる横幅は避けましょう。',
      'sun-aviator-gold': '細いリムが頬骨まわりを軽く見せ、縦長のレンズが輪郭をつなぎます。頬との隙間も確認してください。',
    },
    oblong: {
      'sun-oversized-gradient': '縦幅のあるレンズが顔の中央をほどよく占めます。横幅を広げるだけでなく、レンズの深さで比べましょう。',
      'sun-aviator-gold': '深めのレンズとダブルブリッジが、顔の縦のラインを区切ります。頬に触れないサイズを選んでください。',
      'sun-wayfarer-black': 'はっきりした上辺が横方向のアクセントになります。レンズが浅すぎない形から比べましょう。',
      'sun-shield-wraparound-black': '一体型のレンズが横方向に強い印象をつくります。こめかみから大きくはみ出さない幅を確認してください。',
    },
    triangle: {
      'sun-cat-eye-black': '上がった外側の角が、額やこめかみに幅を足します。下側は軽いデザインが比較しやすいです。',
      'sun-aviator-gold': 'ダブルブリッジで目元にアクセントを加え、細い下辺で軽さを保てます。',
      'sun-curved-flat-top-black': '水平な上辺が、あごの幅に対して上部の存在感を足します。眉との間隔も見て選びましょう。',
      'sun-wayfarer-black': '上側が広い輪郭と柔らかな下側の角で、重心を目元へ寄せられます。',
    },
  },
  es: {
    oval: {
      'sun-wayfarer-black': 'Los ángulos suaves añaden definición sin romper el equilibrio. Compara una anchura cercana a la de tus sienes.',
      'sun-aviator-gold': 'La lente de lágrima acompaña la longitud del rostro. Comprueba que su borde inferior no toque las mejillas.',
      'sun-cat-eye-black': 'La elevación exterior destaca los pómulos. Elige una inclinación que encaje con tus cejas.',
      'sun-oversized-gradient': 'Las lentes grandes dan más presencia. Revisa su altura entre cejas y mejillas, además de la anchura.',
    },
    round: {
      'sun-wayfarer-black': 'La línea superior recta y las esquinas contrastan con las mejillas y la mandíbula curvas.',
      'sun-cat-eye-black': 'Las esquinas elevadas dirigen la atención hacia arriba. Busca suficiente anchura para no estrechar visualmente el rostro.',
      'sun-narrow-rectangle-black': 'La forma rectangular aporta líneas definidas. Una lente baja no debe implicar una montura demasiado estrecha.',
      'sun-curved-flat-top-black': 'El borde superior marcado añade estructura. Comprueba su posición respecto a las cejas y el espacio al sonreír.',
    },
    square: {
      'sun-round-tortoise': 'Las lentes redondas contrastan con la frente y la mandíbula rectas. Evita que queden demasiado pequeñas en proporción.',
      'sun-aviator-gold': 'Las curvas de lágrima y el aro fino suavizan el conjunto. Revisa que las lentes no descansen en las mejillas.',
      'sun-oversized-gradient': 'Las lentes amplias con esquinas suaves acompañan un rostro ancho. Busca altura sin un gran exceso lateral.',
      'sun-cat-eye-black': 'Una elevación suave añade movimiento. Las esquinas redondeadas crean menos rigidez que un contorno muy angular.',
    },
    heart: {
      'sun-aviator-gold': 'La lente se estrecha hacia abajo, siguiendo el contorno del rostro. Un aro fino evita cargar demasiado la parte superior.',
      'sun-cat-eye-black': 'Una elevación discreta acompaña los pómulos. Compara bordes superiores ligeros, sin adornos muy anchos.',
      'sun-wayfarer-black': 'Las esquinas inferiores suaves aportan estructura sin exagerar la anchura de la frente.',
      'sun-oversized-gradient': 'Una lente más alta añade presencia bajo los ojos. Revisa el espacio sobre las mejillas antes de elegir un tamaño grande.',
    },
    diamond: {
      'sun-cat-eye-black': 'Las esquinas elevadas añaden anchura por encima de los pómulos. El borde inferior debe dejarles espacio.',
      'sun-round-tortoise': 'Las curvas suavizan la transición entre pómulos y barbilla. Compara tamaños que no queden pequeños frente a las mejillas.',
      'sun-oversized-gradient': 'Las esquinas suaves y una anchura suficiente dejan espacio a los pómulos. Evita un exceso notable a ambos lados.',
      'sun-aviator-gold': 'El aro fino despeja visualmente los pómulos y la lente añade altura. Comprueba que no toque las mejillas.',
    },
    oblong: {
      'sun-oversized-gradient': 'Las lentes altas ocupan más espacio en el centro del rostro. Compara su altura sin aumentar demasiado la anchura.',
      'sun-aviator-gold': 'La lente profunda y el doble puente interrumpen la línea vertical. Busca un tamaño que deje libres las mejillas.',
      'sun-wayfarer-black': 'La línea superior crea un punto de apoyo horizontal. Elige suficiente altura de lente para equilibrar el largo.',
      'sun-shield-wraparound-black': 'La lente continua acentúa la línea horizontal. Comprueba que la montura no sobresalga mucho de las sienes.',
    },
    triangle: {
      'sun-cat-eye-black': 'Las esquinas elevadas añaden presencia cerca de la frente y las sienes, con menos peso en el borde inferior.',
      'sun-aviator-gold': 'El doble puente destaca la zona de los ojos y el aro inferior fino mantiene ligero el conjunto.',
      'sun-curved-flat-top-black': 'La línea superior horizontal equilibra visualmente una mandíbula ancha. Revisa también su distancia a las cejas.',
      'sun-wayfarer-black': 'El contorno más ancho arriba dirige la atención hacia los ojos sin cargar la parte inferior del rostro.',
    },
  },
}

export function getSunglassesStyleReason(
  locale: string,
  faceShape: FaceShapeContentSlug,
  style: SunglassesStyleRecommendation,
): string | undefined {
  if (locale === 'en') return style.why
  if (locale === 'ja' || locale === 'es') return styleReasons[locale][faceShape][style.presetId]
  return undefined
}
