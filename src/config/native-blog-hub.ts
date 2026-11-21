import type { Locale } from '@/i18n'

export type NativeBlogHubText = {
  metaTitle: string
  title: string
  description: string
  exact: string
  choice: string
  width: string
  detector: string
  onlyEnglish: string
  readMore: string
}

const copies: Record<Locale, NativeBlogHubText> = {
  "en": {
    "metaTitle": "Eyewear Buying Guides, Frame Sizing & Virtual Try-On | VisuTry",
    "title": "Virtual Try-On Blog",
    "description": "Practical eyewear shopping guides, frame comparisons, and AI virtual try-on tips from VisuTry.",
    "exact": "Specific store image → custom Try-On guide",
    "choice": "Two frames → compare before buying",
    "width": "Frame markings → browser size comparator",
    "detector": "Find my face shape free",
    "onlyEnglish": "English article",
    "readMore": "Read Full Article"
  },
  "es": {
    "metaTitle": "Guías para elegir gafas y probar monturas virtualmente | VisuTry",
    "title": "Guías para elegir gafas",
    "description": "Consejos prácticos sobre monturas, medidas, pruebas virtuales con fotos y compra de gafas con más información.",
    "exact": "Una foto del producto → prueba virtual",
    "choice": "Dos monturas → compara antes de comprar",
    "width": "Medidas → compara la anchura",
    "detector": "Descubre gratis la forma de tu rostro",
    "onlyEnglish": "Artículo en inglés",
    "readMore": "Leer la guía completa"
  },
  "fr": {
    "metaTitle": "Guides lunettes, tailles et essayage virtuel | VisuTry",
    "title": "Guides pour choisir vos lunettes",
    "description": "Des conseils pratiques pour comparer les montures, vérifier les dimensions et essayer des lunettes sur votre photo.",
    "exact": "Photo du produit → essayage virtuel",
    "choice": "Deux montures → choisir avant d'acheter",
    "width": "Dimensions → comparer les largeurs",
    "detector": "Trouver gratuitement ma forme de visage",
    "onlyEnglish": "Article en anglais",
    "readMore": "Lire le guide complet"
  },
  "ru": {
    "metaTitle": "Гиды по выбору очков и виртуальной примерке | VisuTry",
    "title": "Как выбрать и примерить очки",
    "description": "Практические советы по оправам, размерам, виртуальной примерке по фото и покупке очков онлайн.",
    "exact": "Фото товара → примерка конкретной оправы",
    "choice": "Две оправы → сравнение перед заказом",
    "width": "Маркировка → ширина оправы",
    "detector": "Бесплатно определить форму лица",
    "onlyEnglish": "Статья на английском",
    "readMore": "Читать полный гид"
  },
  "ja": {
    "metaTitle": "メガネ選び・サイズ・写真試着ガイド | VisuTry",
    "title": "メガネ選びのガイド",
    "description": "顔型に合わせたフレーム選び、寸法の比較、商品写真を使った試着、購入前の確認ポイントを紹介します。",
    "exact": "商品写真でバーチャル試着",
    "choice": "2本のメガネを比べて選ぶ",
    "width": "メガネのサイズ表示と幅を確認",
    "detector": "無料で顔型を調べる",
    "onlyEnglish": "英語の記事",
    "readMore": "記事を読む"
  },
  "ar": {
    "metaTitle": "دليل اختيار النظارات ومقاساتها وتجربتها افتراضيًا | VisuTry",
    "title": "دليل اختيار النظارات",
    "description": "نصائح عملية لمقارنة الإطارات والمقاسات وتجربة النظارات بالصور وفحص شروط الشراء قبل الطلب.",
    "exact": "صورة المنتج ← تجربة إطار محدد",
    "choice": "إطاران ← مقارنة قبل الشراء",
    "width": "المقاسات ← مقارنة عرض الإطارات",
    "detector": "تحديد شكل الوجه مجانًا",
    "onlyEnglish": "مقال باللغة الإنجليزية",
    "readMore": "اقرأ الدليل كاملًا"
  },
  "pt": {
    "metaTitle": "Guias de compra de óculos e experimentação virtual | VisuTry",
    "title": "Guias para escolher óculos",
    "description": "Conselhos sobre armações, medidas, comparação de modelos e experimentação virtual com fotografias.",
    "exact": "Fotografia do produto → experimentar",
    "choice": "Duas armações → comparar antes de comprar",
    "width": "Marcação → comparar larguras",
    "detector": "Descobrir o formato do rosto gratuitamente",
    "onlyEnglish": "Artigo em inglês",
    "readMore": "Ler o guia completo"
  },
  "id": {
    "metaTitle": "Panduan memilih kacamata dan coba virtual | VisuTry",
    "title": "Panduan memilih kacamata",
    "description": "Tips praktis untuk membandingkan bingkai, memeriksa ukuran, mencoba kacamata dari foto, dan belanja online.",
    "exact": "Foto produk → coba bingkai tertentu",
    "choice": "Dua bingkai → bandingkan sebelum membeli",
    "width": "Ukuran bingkai → bandingkan lebar",
    "detector": "Cari bentuk wajah gratis",
    "onlyEnglish": "Artikel berbahasa Inggris",
    "readMore": "Baca panduan"
  },
  "de": {
    "metaTitle": "Brillenratgeber, Fassungsgrößen und virtuelle Anprobe | VisuTry",
    "title": "Ratgeber zur Brillenwahl",
    "description": "Praxisnahe Hinweise zu Fassungen, Maßen, virtueller Foto-Anprobe und Brillenkauf im Internet.",
    "exact": "Produktfotos → konkrete Fassung testen",
    "choice": "Zwei Fassungen → vor dem Kauf vergleichen",
    "width": "Größenangaben → Breite vergleichen",
    "detector": "Gesichtsform kostenlos bestimmen",
    "onlyEnglish": "Artikel auf Englisch",
    "readMore": "Ganzen Ratgeber lesen"
  }
}

export function getNativeBlogHubText(locale: Locale): NativeBlogHubText {
  return copies[locale]
}
