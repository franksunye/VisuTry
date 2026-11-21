import { defaultLocale, isValidLocale, type Locale } from '@/i18n'
import type { FaceShapeContentSlug } from '@/config/face-shape-content'

export { getOrdinaryGlassesShapeCheck, getOrdinaryGlassesStyleCopy } from '@/config/ordinary-glasses-native-style-copy'

export type OrdinaryGlassesDetailCopy = {
  metaTitle: string
  metaDescription: string
  title: string
  badge: string
  home: string
  description: string
  characteristicsTitle: string
  characteristicsText: string
  guidance: string
  tryFirstTitle: string
  avoidFirstTitle: string
  whyTitle: string
  recommendedEyebrow: string
  recommendedTitle: string
  tryAny: string
  tryStyle: string
  workflowEyebrow: string
  workflowTitle: string
  advisorCta: string
  faqTitle: string
  faqBest: string
  faqAvoid: string
  faqAi: string
  otherTitle: string
}

const englishHeadingShapes: Record<FaceShapeContentSlug, string> = {
  oval: 'Oval',
  round: 'Round',
  square: 'Square',
  heart: 'Heart-Shaped',
  diamond: 'Diamond-Shaped',
  oblong: 'Oblong',
  triangle: 'Triangle-Shaped',
}

// The four recommended cards must explain the actual preset shown, not reuse
// a face-shape slogan under numbered placeholders. JA/ES notes are provided by
// ordinary-glasses-native-style-copy; other locales retain their existing copy.
const englishStyleNotes: Record<FaceShapeContentSlug, Record<string, string>> = {
  round: {
    'rectangle-classic': 'Straight top and bottom edges add definition; compare the frame width with the widest part of your face.',
    'square-classic': 'A structured square outline contrasts softer cheeks. Try gently rounded corners if the look feels too severe.',
    'geometric-classic': 'Faceted lenses introduce angles without a heavy rim. Check that the lens height still feels proportional.',
    'wayfarer-classic': 'A softly squared upper line gives an everyday alternative to sharply rectangular frames.',
  },
  square: {
    'round-classic': 'Circular lenses contrast a defined jawline. Choose a width that still sits comfortably across the temples.',
    'oval-classic': 'Soft oval curves ease the visual contrast around the jaw while keeping the frame understated.',
    'rimless-light': 'A nearly invisible rim adds little visual weight. Lens size and bridge fit become especially important.',
    'aviator-classic': 'Curved teardrop lenses offer a softer outline. Compare their depth with your natural face proportions.',
  },
  oval: {
    'rectangle-classic': 'Crisp rectangular edges can give balanced proportions a more tailored, defined look.',
    'browline-classic': 'A stronger upper rim puts emphasis near the brows. Compare where it sits relative to your eyes.',
    'aviator-classic': 'Aviator curves add a relaxed option. Check frame width and bridge height instead of relying on shape alone.',
    'square-classic': 'Square lenses add graphic structure. Keep the size proportional so the rims do not overpower your face.',
  },
  heart: {
    'rimless-light': 'A light rim can keep the upper face from looking crowded. Check bridge fit and overall lens width.',
    'round-classic': 'Gentle circles bring softness below a broader forehead. Compare the lens diameter with cheek width.',
    'cat-eye-classic': 'A modest upsweep can highlight the eyes. Try restrained corners to avoid adding too much width above.',
    'bottom-weighted-classic': 'A stronger lower edge draws some attention toward the cheeks and chin. Check the look while smiling.',
  },
  diamond: {
    'oval-classic': 'Smooth oval edges soften cheekbone angles. Avoid a width that feels tight across the broadest area.',
    'rimless-light': 'A light rim leaves the cheekbone area open. Judge lens outline and bridge fit together.',
    'cat-eye-classic': 'A subtle upsweep shifts attention toward the brow. Compare moderate corners rather than very narrow ones.',
    'browline-classic': 'A defined upper rim can add balance near a narrower forehead while keeping the lower edge light.',
  },
  oblong: {
    'rectangle-classic': 'Look for enough lens depth to keep the frame from emphasizing vertical length.',
    'oversized-classic': 'Generous lens height may balance longer proportions. Check that the bridge and width remain comfortable.',
    'browline-classic': 'A clear upper edge breaks up vertical length. Assess lens depth as carefully as the brow line.',
    'oversized-square-classic': 'Larger square lenses add presence and depth. Avoid excessive overhang beyond the cheeks.',
  },
  triangle: {
    'browline-classic': 'A stronger upper rim brings attention toward the forehead. Compare its width with your jaw.',
    'cat-eye-classic': 'Lifted outer corners draw the eye upward. Choose a subtle angle that follows your eye line.',
    'aviator-classic': 'A broad upper bar and tapered lower lens shift visual interest upward. Recheck the frame width.',
    'geometric-classic': 'Faceted upper corners can add definition higher on the face. Try a lighter rim for contrast.',
  },
}

const copies: Record<Locale, OrdinaryGlassesDetailCopy> = {
  en: {
    metaTitle: 'Best Glasses for {shape} Faces: Styles to Try First', metaDescription: 'Best glasses for a {shape} face. Compare recommended frame styles and fit checks, then try the shortlist on your photo with virtual try-on or frame compare.', title: 'Best Glasses for {shape} Faces', badge: 'Glasses guide by face shape', home: 'Home', description: 'Use your {shape} face shape to shortlist frames, then compare width, lens depth, bridge fit, color, and style on your own photo.', characteristicsTitle: 'Shopping Priorities for {shape} Faces', characteristicsText: 'Face shape is a useful first filter. The strongest choice also fits your measurements, prescription needs, comfort, and personal style.', guidance: 'Start with the recommendations below, then use virtual try-on as the visual check.', tryFirstTitle: 'Try first', avoidFirstTitle: 'Reconsider first', whyTitle: 'Why it works', recommendedEyebrow: 'Recommended frame styles', recommendedTitle: 'Glasses to Try for {shape} Faces', tryAny: 'Try any glasses on your photo', tryStyle: 'Try this style', workflowEyebrow: 'AI shopping workflow', workflowTitle: 'From {shape} Face Guide to Virtual Try-On', advisorCta: 'Get personalized glasses advice', faqTitle: '{shape} Face Glasses FAQ', faqBest: 'What glasses are best for a {shape} face?', faqAvoid: 'Should {shape} faces avoid any glasses?', faqAi: 'Can AI help me choose glasses for my face shape?', otherTitle: 'Compare glasses for other face shapes',
  },
  fr: {
    metaTitle: 'Meilleures lunettes pour un visage {shape}', metaDescription: 'Trouvez les meilleures lunettes pour un visage {shape}, comparez montures et ajustement, puis essayez la sélection sur votre photo.', title: 'Meilleures lunettes pour un visage {shape}', badge: 'Guide lunettes par forme de visage', home: 'Accueil', description: 'Utilisez votre visage {shape} pour présélectionner des montures, puis comparez largeur, hauteur des verres, pont, couleur et style sur votre photo.', characteristicsTitle: 'Objectif pour un visage {shape}', characteristicsText: 'La forme du visage est un premier filtre utile. Le meilleur choix respecte aussi vos mesures, votre correction, votre confort et votre style.', guidance: 'Commencez par les conseils ci-dessous, puis utilisez l’essayage virtuel comme vérification visuelle.', tryFirstTitle: 'À essayer en premier', avoidFirstTitle: 'À reconsidérer', whyTitle: 'Pourquoi cela fonctionne', recommendedEyebrow: 'Montures recommandées', recommendedTitle: 'Lunettes à essayer pour un visage {shape}', tryAny: 'Essayer des lunettes sur votre photo', tryStyle: 'Essayer ce style', workflowEyebrow: 'Parcours d’achat avec IA', workflowTitle: 'Du guide visage {shape} à l’essayage virtuel', advisorCta: 'Recevoir un conseil personnalisé', faqTitle: 'FAQ lunettes pour visage {shape}', faqBest: 'Quelles lunettes conviennent à un visage {shape} ?', faqAvoid: 'Un visage {shape} doit-il éviter certaines lunettes ?', faqAi: 'L’IA peut-elle m’aider à choisir mes lunettes ?', otherTitle: 'Comparer les autres formes de visage',
  },
  ru: {
    metaTitle: 'Лучшие очки для {shape} лица',
    metaDescription: 'Узнайте, какие очки подходят для {shape} лица: сравните оправы и посадку, затем примерьте понравившиеся модели на своём фото.',
    title: 'Лучшие очки для {shape} лица',
    badge: 'Гид по очкам и форме лица',
    home: 'Главная',
    description: 'Для {shape} лица начните с подбора подходящих оправ, а затем сравните ширину, высоту линз, переносицу, цвет и стиль на своём фото.',
    characteristicsTitle: 'Как выбрать очки для {shape} лица',
    characteristicsText: 'Форма лица — полезный первый фильтр. Лучшая оправа также учитывает размеры, рецепт, комфорт и личный стиль.',
    guidance: 'Начните с рекомендаций ниже, а затем проверьте результат виртуальной примеркой.',
    tryFirstTitle: 'Попробуйте сначала',
    avoidFirstTitle: 'Сначала пересмотрите',
    whyTitle: 'Почему это работает',
    recommendedEyebrow: 'Рекомендуемые оправы',
    recommendedTitle: 'Оправы для {shape} лица',
    tryAny: 'Примерить очки на своём фото',
    tryStyle: 'Примерить этот стиль',
    workflowEyebrow: 'Путь выбора с ИИ',
    workflowTitle: 'От гида по очкам для {shape} лица к виртуальной примерке',
    advisorCta: 'Получить персональный совет',
    faqTitle: 'Вопросы об очках для {shape} лица',
    faqBest: 'Какие очки подходят для {shape} лица?',
    faqAvoid: 'Каких оправ стоит избегать при выборе очков для {shape} лица?',
    faqAi: 'Может ли ИИ помочь выбрать очки?',
    otherTitle: 'Сравнить другие формы лица',
  },
  de: {
    metaTitle: 'Beste Brillen für ein {shape} Gesicht',
    metaDescription: 'Entdecken Sie Brillen für ein {shape} Gesicht, vergleichen Sie Fassungen und Passform und testen Sie die Auswahl auf Ihrem Foto.',
    title: 'Beste Brillen für ein {shape} Gesicht',
    badge: 'Brillenratgeber nach Gesichtsform',
    home: 'Startseite',
    description: 'Wenn Sie ein {shape} Gesicht haben, vergleichen Sie Fassungsbreite, Glashöhe, Steg, Farbe und Stil auf Ihrem Foto.',
    characteristicsTitle: 'Auswahlkriterien für ein {shape} Gesicht',
    characteristicsText: 'Die Gesichtsform ist ein hilfreicher erster Filter. Die beste Fassung berücksichtigt auch Maße, Sehstärke, Komfort und persönlichen Stil.',
    guidance: 'Beginnen Sie mit den Empfehlungen und prüfen Sie das Ergebnis anschließend mit der virtuellen Anprobe.',
    tryFirstTitle: 'Zuerst probieren',
    avoidFirstTitle: 'Zuerst überdenken',
    whyTitle: 'Warum es funktioniert',
    recommendedEyebrow: 'Empfohlene Fassungen',
    recommendedTitle: 'Brillen für ein {shape} Gesicht',
    tryAny: 'Brillen auf meinem Foto testen',
    tryStyle: 'Diesen Stil testen',
    workflowEyebrow: 'KI-gestützter Auswahlweg',
    workflowTitle: 'Vom Ratgeber für ein {shape} Gesicht zur virtuellen Anprobe',
    advisorCta: 'Persönliche Brillenberatung erhalten',
    faqTitle: 'Häufige Fragen: Brillen für ein {shape} Gesicht',
    faqBest: 'Welche Brillen eignen sich für ein {shape} Gesicht?',
    faqAvoid: 'Welche Brillen sind für ein {shape} Gesicht weniger geeignet?',
    faqAi: 'Kann KI bei der Brillenwahl helfen?',
    otherTitle: 'Andere Gesichtsformen vergleichen',
  },
  pt: {
    metaTitle: 'Melhores óculos para rosto {shape}', metaDescription: 'Encontre os melhores óculos para rosto {shape}, compare armações e ajuste e experimente a seleção na sua foto.', title: 'Melhores óculos para rosto {shape}', badge: 'Guia de óculos por formato de rosto', home: 'Início', description: 'Use o formato {shape} para selecionar armações e depois compare largura, altura das lentes, ponte, cor e estilo na sua foto.', characteristicsTitle: 'Objetivo para rosto {shape}', characteristicsText: 'O formato do rosto é um bom primeiro filtro. A melhor armação também respeita medidas, receita, conforto e estilo pessoal.', guidance: 'Comece pelas recomendações abaixo e use a prova virtual como verificação visual.', tryFirstTitle: 'Experimente primeiro', avoidFirstTitle: 'Reconsidere primeiro', whyTitle: 'Por que funciona', recommendedEyebrow: 'Armações recomendadas', recommendedTitle: 'Óculos para experimentar em rosto {shape}', tryAny: 'Experimentar óculos na minha foto', tryStyle: 'Experimentar este estilo', workflowEyebrow: 'Jornada de compra com IA', workflowTitle: 'Do guia de rosto {shape} à prova virtual', advisorCta: 'Receber recomendação personalizada', faqTitle: 'Perguntas sobre óculos para rosto {shape}', faqBest: 'Quais óculos combinam com rosto {shape}?', faqAvoid: 'Rostos {shape} devem evitar algum óculos?', faqAi: 'A IA pode ajudar a escolher óculos?', otherTitle: 'Comparar outros formatos de rosto',
  },
  id: {
    metaTitle: 'Kacamata Terbaik untuk Wajah {shape}', metaDescription: 'Temukan kacamata terbaik untuk wajah {shape}, bandingkan bingkai dan kecocokannya, lalu coba pilihan pada foto Anda.', title: 'Kacamata Terbaik untuk Wajah {shape}', badge: 'Panduan kacamata berdasarkan bentuk wajah', home: 'Beranda', description: 'Gunakan bentuk wajah {shape} untuk memilih bingkai awal, lalu periksa lebar, tinggi lensa, jembatan, warna, dan gaya pada foto Anda.', characteristicsTitle: 'Tujuan pilihan untuk wajah {shape}', characteristicsText: 'Bentuk wajah adalah filter awal yang berguna. Bingkai terbaik juga sesuai dengan ukuran, resep, kenyamanan, dan gaya pribadi.', guidance: 'Mulai dengan rekomendasi berikut, lalu gunakan coba virtual sebagai pemeriksaan visual.', tryFirstTitle: 'Coba lebih dulu', avoidFirstTitle: 'Pertimbangkan kembali', whyTitle: 'Mengapa cocok', recommendedEyebrow: 'Bingkai yang direkomendasikan', recommendedTitle: 'Kacamata untuk wajah {shape}', tryAny: 'Coba kacamata pada foto saya', tryStyle: 'Coba gaya ini', workflowEyebrow: 'Alur belanja dengan AI', workflowTitle: 'Dari panduan wajah {shape} ke coba virtual', advisorCta: 'Dapatkan saran kacamata personal', faqTitle: 'FAQ kacamata untuk wajah {shape}', faqBest: 'Kacamata apa yang cocok untuk wajah {shape}?', faqAvoid: 'Apakah wajah {shape} perlu menghindari kacamata tertentu?', faqAi: 'Bisakah AI membantu memilih kacamata?', otherTitle: 'Bandingkan bentuk wajah lain',
  },
  ja: {
    metaTitle: '{shape}の顔に似合うメガネ｜フレームの選び方',
    metaDescription: '{shape}の顔に合わせてフレームを比較。形ごとの見え方と、幅・レンズの高さ・鼻での掛かり具合を確認しましょう。',
    title: '{shape}の顔に似合うメガネ',
    badge: '顔型別メガネガイド',
    home: 'ホーム',
    description: '{shape}の顔に合わせて、まずは幅の近い2本を比較。形・リムの太さ・眉との位置で、好みの印象を探しましょう。',
    characteristicsTitle: '{shape}の顔のフレーム選び',
    characteristicsText: '顔型は候補を探す手掛かりです。フレームの実寸、度数、掛け心地、自分らしいスタイルも合わせて選びましょう。',
    guidance: '写真で印象を比べ、実際の掛け心地は眼鏡店で確認しましょう。顔型だけで似合う形が一つに決まるわけではありません。',
    tryFirstTitle: 'まず比べたい形',
    avoidFirstTitle: 'サイズや印象を確かめたい形',
    whyTitle: '選び方のポイント',
    recommendedEyebrow: 'フレームの形を比較',
    recommendedTitle: '{shape}の顔で試したいメガネ',
    tryAny: '自分の写真でメガネを試す',
    tryStyle: 'この形を試す',
    workflowEyebrow: '自分の写真で比べる',
    workflowTitle: '{shape}の顔に合う候補を試す',
    advisorCta: '個別のメガネ提案を見る',
    faqTitle: '{shape}の顔とメガネ：よくある質問',
    faqBest: '{shape}の顔にはどんなメガネが似合いますか？',
    faqAvoid: '{shape}の顔では避けたほうがよい形はありますか？',
    faqAi: 'AIで似合うメガネを選べますか？',
    otherTitle: 'ほかの顔型と比べる',
  },
  es: {
    metaTitle: 'Mejores gafas para rostro {shape}', metaDescription: 'Encuentra las mejores gafas para rostro {shape}, compara monturas y ajuste y prueba la selección en tu foto.', title: 'Mejores gafas para rostro {shape}', badge: 'Guía de gafas por forma de rostro', home: 'Inicio', description: 'Usa tu rostro {shape} para preseleccionar monturas y después compara anchura, altura de lente, puente, color y estilo en tu foto.', characteristicsTitle: 'Objetivo para un rostro {shape}', characteristicsText: 'La forma del rostro es un primer filtro útil. La mejor montura también respeta medidas, graduación, comodidad y estilo personal.', guidance: 'Empieza por estas recomendaciones y usa la prueba virtual como comprobación visual.', tryFirstTitle: 'Prueba primero', avoidFirstTitle: 'Reconsidera primero', whyTitle: 'Por qué funciona', recommendedEyebrow: 'Monturas recomendadas', recommendedTitle: 'Gafas para probar en un rostro {shape}', tryAny: 'Probar gafas en mi foto', tryStyle: 'Probar este estilo', workflowEyebrow: 'Proceso de compra con IA', workflowTitle: 'De la guía para rostro {shape} a la prueba virtual', advisorCta: 'Recibir recomendación personalizada', faqTitle: 'Preguntas sobre gafas para rostro {shape}', faqBest: '¿Qué gafas quedan bien a un rostro {shape}?', faqAvoid: '¿Un rostro {shape} debe evitar algunas gafas?', faqAi: '¿Puede la IA ayudarme a elegir gafas?', otherTitle: 'Comparar otras formas de rostro',
  },
  ar: {
    metaTitle: 'أفضل النظارات للوجه {shape}', metaDescription: 'اكتشف أفضل النظارات للوجه {shape}، وقارن الإطارات والملاءمة، ثم جرّب الخيارات على صورتك.', title: 'أفضل النظارات للوجه {shape}', badge: 'دليل النظارات حسب شكل الوجه', home: 'الرئيسية', description: 'استخدم شكل الوجه {shape} لاختيار الإطارات أوليًا، ثم قارن العرض وارتفاع العدسة والجسر واللون والأسلوب على صورتك.', characteristicsTitle: 'هدف الاختيار للوجه {shape}', characteristicsText: 'شكل الوجه مرشح أولي مفيد. الإطار الأفضل يراعي أيضًا المقاسات والوصفة والراحة والأسلوب الشخصي.', guidance: 'ابدأ بالتوصيات أدناه ثم استخدم التجربة الافتراضية للتحقق من المظهر.', tryFirstTitle: 'جرّب أولًا', avoidFirstTitle: 'أعد النظر أولًا', whyTitle: 'لماذا يناسب', recommendedEyebrow: 'إطارات مقترحة', recommendedTitle: 'نظارات لتجربتها للوجه {shape}', tryAny: 'جرّب النظارات على صورتي', tryStyle: 'جرّب هذا النمط', workflowEyebrow: 'مسار تسوق بالذكاء الاصطناعي', workflowTitle: 'من دليل الوجه {shape} إلى التجربة الافتراضية', advisorCta: 'احصل على نصيحة مخصصة', faqTitle: 'أسئلة النظارات للوجه {shape}', faqBest: 'ما النظارات المناسبة للوجه {shape}؟', faqAvoid: 'هل ينبغي للوجه {shape} تجنب بعض النظارات؟', faqAi: 'هل يساعد الذكاء الاصطناعي في اختيار النظارات؟', otherTitle: 'قارن أشكال الوجه الأخرى',
  },
}

// Breadcrumb labels use nominative face-shape names; text templates need the
// forms required by the local grammar and face-shape terminology.
const templateShapeVariants: Partial<Record<Locale, Record<FaceShapeContentSlug, string>>> = {
  ja: {
    oval: '卵型',
    round: '丸型',
    square: '四角型',
    heart: 'ハート型',
    diamond: 'ひし形',
    oblong: '面長',
    triangle: '三角型',
  },
  es: {
    oval: 'ovalado',
    round: 'redondo',
    square: 'cuadrado',
    heart: 'en forma de corazón',
    diamond: 'en forma de diamante',
    oblong: 'alargado',
    triangle: 'triangular',
  },
  ru: {
    oval: 'овального',
    round: 'круглого',
    square: 'квадратного',
    heart: 'сердцевидного',
    diamond: 'ромбовидного',
    oblong: 'удлинённого',
    triangle: 'треугольного',
  },
  de: {
    oval: 'ovales',
    round: 'rundes',
    square: 'eckiges',
    heart: 'herzförmiges',
    diamond: 'diamantförmiges',
    oblong: 'längliches',
    triangle: 'dreieckiges',
  },
}

export function getOrdinaryGlassesTemplateShape(
  locale: string,
  shape: FaceShapeContentSlug,
  fallbackName: string,
): string {
  const validLocale = isValidLocale(locale) ? locale : defaultLocale
  return templateShapeVariants[validLocale]?.[shape] ?? fallbackName.toLocaleLowerCase(validLocale)
}

export function getOrdinaryGlassesHeadingShape(
  locale: string,
  shape: FaceShapeContentSlug,
  fallbackTemplateShape: string,
): string {
  return locale === 'en' ? englishHeadingShapes[shape] : fallbackTemplateShape
}

export function getEnglishOrdinaryGlassesStyleNote(
  shape: FaceShapeContentSlug,
  presetId: string,
): string | undefined {
  return englishStyleNotes[shape][presetId]
}

export function getOrdinaryGlassesDetailCopy(locale: string): OrdinaryGlassesDetailCopy {
  return copies[isValidLocale(locale) ? locale : defaultLocale]
}

export function interpolateOrdinaryGlassesCopy(template: string, shape: string): string {
  return template.split('{shape}').join(shape)
}
