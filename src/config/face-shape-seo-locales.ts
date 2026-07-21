import { defaultLocale, isValidLocale, type Locale } from '@/i18n'
import type { FaceShapeContentSlug } from '@/config/face-shape-content'

type FaqItem = { question: string; answer: string }

export type FaceShapeSeoCopy = {
  shapeNames: Record<FaceShapeContentSlug, string>
  detector: {
    metaTitle: string
    metaDescription: string
    badge: string
    title: string
    intro: string
    trust: readonly { title: string; text: string }[]
    tipsTitle: string
    tips: readonly string[]
    manualTitle: string
    manualText: string
    manualLink: string
    faqTitle: string
    faq: readonly FaqItem[]
  }
  glasses: {
    metaTitle: string
    metaDescription: string
    eyebrow: string
    title: string
    intro: string
    detectorCta: string
    tryOnCta: string
    faceShapesLink: string
    hairstylesLink: string
    sunglassesLink: string
    steps: readonly { title: string; text: string }[]
    guideTitle: string
    guideIntro: string
    columns: readonly [string, string, string, string]
    tryFirst: Record<FaceShapeContentSlug, string>
    avoidFirst: Record<FaceShapeContentSlug, string>
    reasons: Record<FaceShapeContentSlug, string>
    principles: readonly string[]
    nextEyebrow: string
    nextTitle: string
    faq: readonly FaqItem[]
  }
  sunglasses: {
    metaTitle: string
    metaDescription: string
    eyebrow: string
    title: string
    intro: string
    detectorCta: string
    explorerCta: string
    processTitle: string
    process: readonly { title: string; text: string }[]
    guidesTitle: string
    guidesIntro: string
    cardTitleTemplate: string
    cardLink: string
    goals: Record<FaceShapeContentSlug, string>
    howToTitle: string
    howToSteps: readonly string[]
    safetyTitle: string
    safetyText: string
    faqTitle: string
    faq: readonly FaqItem[]
  }
  detail: {
    metaTitleTemplate: string
    metaDescriptionTemplate: string
    eyebrowTemplate: string
    titleTemplate: string
    descriptionTemplate: string
    goalLabel: string
    detectorCta: string
    explorerCta: string
    featuredLabel: string
    featuredNote: string
    stylesTitle: string
    stylesIntro: string
    styleLink: string
    fitTitle: string
    fitChecks: readonly string[]
    reconsiderTitle: string
    reconsider: readonly string[]
    lensTitle: string
    lensText: string
    lensDisclaimer: string
    conversionEyebrow: string
    conversionTitle: string
    conversionText: string
    conversionCta: string
    faqTitleTemplate: string
    otherTitle: string
    styleNames: Record<string, string>
  }
}

const shapeNames = {
  en: { oval: 'Oval', round: 'Round', square: 'Square', heart: 'Heart', diamond: 'Diamond', oblong: 'Oblong', triangle: 'Triangle' },
  id: { oval: 'Oval', round: 'Bulat', square: 'Persegi', heart: 'Hati', diamond: 'Berlian', oblong: 'Lonjong', triangle: 'Segitiga' },
  ar: { oval: 'بيضاوي', round: 'دائري', square: 'مربع', heart: 'قلبي', diamond: 'ماسي', oblong: 'مستطيل', triangle: 'مثلث' },
  ru: { oval: 'Овальная', round: 'Круглая', square: 'Квадратная', heart: 'Сердцевидная', diamond: 'Ромбовидная', oblong: 'Удлинённая', triangle: 'Треугольная' },
  de: { oval: 'Oval', round: 'Rund', square: 'Eckig', heart: 'Herzförmig', diamond: 'Diamantförmig', oblong: 'Länglich', triangle: 'Dreieckig' },
  ja: { oval: '卵型', round: '丸型', square: '四角型', heart: 'ハート型', diamond: 'ダイヤモンド型', oblong: '面長', triangle: '逆三角・三角型' },
  es: { oval: 'Ovalado', round: 'Redondo', square: 'Cuadrado', heart: 'Corazón', diamond: 'Diamante', oblong: 'Alargado', triangle: 'Triangular' },
  pt: { oval: 'Oval', round: 'Redondo', square: 'Quadrado', heart: 'Coração', diamond: 'Diamante', oblong: 'Alongado', triangle: 'Triangular' },
  fr: { oval: 'Ovale', round: 'Rond', square: 'Carré', heart: 'Cœur', diamond: 'Diamant', oblong: 'Allongé', triangle: 'Triangulaire' },
} satisfies Record<Locale, Record<FaceShapeContentSlug, string>>

const englishRows = {
  tryFirst: {
    oval: 'Balanced rectangular, browline, aviator, and classic frames', round: 'Rectangular, square, geometric, and slightly wider frames', square: 'Round, oval, thin-metal, and softly curved frames', heart: 'Lightweight, rounded, cat-eye, and bottom-balanced frames', diamond: 'Oval, rimless, cat-eye, and browline frames', oblong: 'Deep rectangular, oversized, browline, and statement frames', triangle: 'Browline, cat-eye, aviator, and defined upper-rim frames',
  },
  avoidFirst: {
    oval: 'Frames much narrower than the face', round: 'Tiny round frames that repeat every curve', square: 'Heavy square frames that emphasize the jaw', heart: 'Top-heavy frames that widen the forehead', diamond: 'Very narrow frames that compress the cheekbones', oblong: 'Shallow frames that visually lengthen the face', triangle: 'Bottom-heavy frames that repeat jaw width',
  },
  reasons: {
    oval: 'Balanced proportions make width, scale, and personal style the main filters.', round: 'Angular lines add definition and balance softer curves.', square: 'Curved shapes soften stronger angles around the jaw and forehead.', heart: 'Lighter or lifted shapes balance a wider forehead and narrower chin.', diamond: 'Gentle width balances prominent cheekbones and a narrower forehead.', oblong: 'More lens depth and visual weight balance longer proportions.', triangle: 'A stronger upper line balances a narrower forehead and wider jaw.',
  },
}

const copies: Record<Locale, FaceShapeSeoCopy> = {
  en: {
    shapeNames: shapeNames.en,
    detector: {
      metaTitle: 'Free Face Shape Detector: Private, On-Device Test', metaDescription: 'Upload one photo to find your face shape for free. The detector runs in your browser with no login, credits, or photo upload to VisuTry.', badge: 'Free · No login · On-device', title: 'Free Face Shape Detector', intro: 'Find whether your face is oval, round, square, heart, diamond, oblong, or triangle. See measured proportions without sending your photo to VisuTry.',
      trust: [{ title: 'Photo stays local', text: 'The free detector processes the selected image in this browser.' }, { title: 'Geometry-based estimate', text: 'Facial landmarks are converted into corrected proportions.' }, { title: 'Practical result', text: 'Use the result as a styling guide, not a rigid label.' }],
      tipsTitle: 'For the clearest result', tips: ['Use one face with a neutral expression.', 'Keep both eyes level and look at the camera.', 'Pull hair away from the forehead and jaw.', 'Avoid strong shadows, filters, and wide-angle distortion.'], manualTitle: 'Prefer to check manually?', manualText: 'Compare face length, forehead, cheekbones, and jaw without uploading a photo.', manualLink: 'Open the measurement guide', faqTitle: 'Free face shape detector FAQ', faq: [{ question: 'Is this face shape detector free?', answer: 'Yes. It requires no account or credits.' }, { question: 'Is my photo uploaded?', answer: 'No. This detector processes the selected photo in browser memory.' }, { question: 'How accurate is it?', answer: 'Pose, lighting, hair, and mixed proportions affect the estimate. Use it as a styling shortcut.' }],
    },
    glasses: {
      metaTitle: 'What Glasses Suit My Face? Face Shape Guide', metaDescription: 'Find what glasses suit your face shape, compare frame styles, and move from the free face shape detector to personalized advice and virtual try-on.', eyebrow: 'What glasses suit my face?', title: 'What Glasses Suit My Face Shape?', intro: 'Use face shape as the first filter, then validate width, scale, color, and style on your own photo.', detectorCta: 'Try the free detector', tryOnCta: 'Try glasses online', faceShapesLink: 'Compare the seven face shapes', hairstylesLink: 'Hairstyles by face shape', sunglassesLink: 'Sunglasses by face shape', steps: [{ title: 'Analyze', text: 'Estimate your likely face shape from one photo.' }, { title: 'Shortlist', text: 'Turn the result into frame shapes worth trying.' }, { title: 'Try on', text: 'Compare the shortlist on your own photo.' }], guideTitle: 'Quick frame guide by face shape', guideIntro: 'These recommendations are a first filter. Combine face shape, frame scale, and virtual try-on.', columns: ['Face shape', 'Try first', 'Reconsider first', 'Why'], ...englishRows, principles: ['Face shape narrows the first set of frames.', 'Virtual try-on checks real visual scale.', 'The best pair fits both your proportions and style.'], nextEyebrow: 'Next step', nextTitle: 'Move from advice to your own try-on', faq: [{ question: 'How do I know what glasses suit my face?', answer: 'Start with the free detector, then check frame width, lens depth, bridge fit, and personal style.' }, { question: 'Can AI recommend glasses for my face shape?', answer: 'Yes. Use the result to create a shortlist, then confirm it with virtual try-on.' }, { question: 'Should I choose glasses only by face shape?', answer: 'No. Size, color, prescription needs, comfort, and personal taste also matter.' }],
    },
    sunglasses: {
      metaTitle: 'Best Sunglasses for Every Face Shape', metaDescription: 'Find sunglasses for oval, round, square, heart, diamond, oblong, and triangle faces, with fit checks and virtual try-on.', eyebrow: 'Sunglasses face-shape guide', title: 'Best Sunglasses for Every Face Shape', intro: 'Use face shape to shortlist a silhouette, then check width, cheek clearance, bridge fit, and the look on your photo.', detectorCta: 'Find my face shape free', explorerCta: 'Explore sunglasses styles', processTitle: 'A better three-step decision', process: [{ title: 'Identify', text: 'Find your likely face shape.' }, { title: 'Shortlist', text: 'Compare styles and the reason behind each choice.' }, { title: 'Validate', text: 'Check scale and color on your own photo.' }], guidesTitle: 'Choose your face-shape guide', guidesIntro: 'Each guide connects face proportions to real sunglasses in Style Explorer.', cardTitleTemplate: 'Best sunglasses for {shape} faces', cardLink: 'Open the sunglasses guide', goals: { oval: 'Preserve natural balance and choose scale carefully.', round: 'Add structure and lift while allowing cheek clearance.', square: 'Use curves and enough lens depth to soften angles.', heart: 'Keep visual weight balanced between forehead and chin.', diamond: 'Clear the cheekbones and add gentle brow width.', oblong: 'Use deeper lenses to balance vertical length.', triangle: 'Add presence near the brows and temples.' }, howToTitle: 'How to choose sunglasses by face shape', howToSteps: ['Compare face length and the widest zones.', 'Choose contrast or balance.', 'Check bridge, temple width, and cheek clearance.', 'Validate the look on your photo.'], safetyTitle: 'Style is only one part of the decision', safetyText: 'Confirm UV protection, optical quality, prescription needs, and physical sizing with the seller.', faqTitle: 'Sunglasses and face shape FAQ', faq: [{ question: 'How do I choose sunglasses for my face shape?', answer: 'Find your shape, shortlist complementary frames, then check real fit and virtual try-on.' }, { question: 'What sunglasses suit my face?', answer: 'The best pair suits your proportions, bridge, width, protection needs, and personal style.' }, { question: 'Is face shape more important than UV protection?', answer: 'No. UV protection comes first; face shape is styling guidance.' }],
    },
    detail: { metaTitleTemplate: 'Best Sunglasses for {shape} Faces', metaDescriptionTemplate: 'Compare sunglasses for {shape} faces, including styles, fit checks, lens advice, and virtual try-on.', eyebrowTemplate: '{shape} face sunglasses guide', titleTemplate: 'Best Sunglasses for {shape} Faces', descriptionTemplate: 'Use the proportions of a {shape} face to shortlist sunglasses, then verify frame width, lens depth, bridge fit, and color on your photo.', goalLabel: 'Shopping goal', detectorCta: 'Check my face shape free', explorerCta: 'Explore sunglasses on my photo', featuredLabel: 'Featured starting point', featuredNote: 'Use virtual try-on to check the real scale.', stylesTitle: 'Sunglass styles to try first', stylesIntro: 'Compare the reason behind each style and validate it on your own photo.', styleLink: 'Explore this style', fitTitle: 'Fit checks that matter', fitChecks: ['Match frame width to your temples.', 'Check bridge stability and cheek clearance.', 'Compare lens depth with the length of your mid-face.'], reconsiderTitle: 'Reconsider as a first filter', reconsider: ['Frames that pinch at the temples', 'Lenses that rest on the cheeks', 'A scale that overwhelms your features'], lensTitle: 'Lens and protection note', lensText: 'Choose lens tint for the viewing conditions and the visual weight you want.', lensDisclaimer: 'Confirm UV protection and optical specifications with the seller.', conversionEyebrow: 'From search to a real decision', conversionTitle: 'See the shortlist on your own face', conversionText: 'Face shape narrows the options; Style Explorer checks scale, color, and visual weight.', conversionCta: 'Start Style Explorer', faqTitleTemplate: '{shape} face sunglasses FAQ', otherTitle: 'Compare other face shapes', styleNames: { wayfarer: 'Wayfarer sunglasses', aviator: 'Aviator sunglasses', 'cat-eye': 'Cat-eye sunglasses', oversized: 'Oversized sunglasses', rectangle: 'Rectangle sunglasses', 'flat-top': 'Flat-top sunglasses', round: 'Round sunglasses', shield: 'Shield sunglasses' } },
  },
  fr: {} as FaceShapeSeoCopy,
  ru: {} as FaceShapeSeoCopy,
  de: {} as FaceShapeSeoCopy,
  es: {} as FaceShapeSeoCopy,
  pt: {} as FaceShapeSeoCopy,
  ja: {} as FaceShapeSeoCopy,
  id: {} as FaceShapeSeoCopy,
  ar: {} as FaceShapeSeoCopy,
}

type LocaleOverrides = Omit<FaceShapeSeoCopy, 'shapeNames' | 'glasses' | 'detail'> & {
  glasses: Omit<FaceShapeSeoCopy['glasses'], 'tryFirst' | 'avoidFirst' | 'reasons'> & Pick<FaceShapeSeoCopy['glasses'], 'tryFirst' | 'avoidFirst' | 'reasons'>
  detail: FaceShapeSeoCopy['detail']
}

function localizedRows(locale: Locale, tryFirst: Record<FaceShapeContentSlug, string>, avoidFirst: Record<FaceShapeContentSlug, string>, reasons: Record<FaceShapeContentSlug, string>) {
  return { tryFirst, avoidFirst, reasons }
}

const localized: Partial<Record<Locale, LocaleOverrides>> = {
  fr: {
    detector: { metaTitle: 'Détecteur gratuit de forme du visage, privé et local', metaDescription: 'Importez une photo pour connaître gratuitement votre forme de visage. Le traitement reste dans votre navigateur, sans compte ni crédit.', badge: 'Gratuit · Sans compte · Sur votre appareil', title: 'Détecteur gratuit de forme du visage', intro: 'Découvrez si votre visage est ovale, rond, carré, cœur, diamant, allongé ou triangulaire, sans envoyer votre photo à VisuTry.', trust: [{ title: 'Photo conservée localement', text: 'La photo est traitée dans la mémoire de votre navigateur.' }, { title: 'Estimation géométrique', text: 'Les repères du visage sont convertis en proportions corrigées.' }, { title: 'Résultat pratique', text: 'Utilisez le résultat comme guide de style, pas comme règle absolue.' }], tipsTitle: 'Pour un résultat plus clair', tips: ['Utilisez un seul visage avec une expression neutre.', 'Gardez les yeux à niveau et regardez l’objectif.', 'Dégagez le front et la mâchoire.', 'Évitez les ombres fortes, filtres et grands angles.'], manualTitle: 'Vous préférez vérifier manuellement ?', manualText: 'Comparez la longueur du visage, le front, les pommettes et la mâchoire sans importer de photo.', manualLink: 'Ouvrir le guide de mesure', faqTitle: 'FAQ du détecteur de forme du visage', faq: [{ question: 'Le détecteur est-il gratuit ?', answer: 'Oui, sans compte ni crédit.' }, { question: 'Ma photo est-elle envoyée ?', answer: 'Non. Ce détecteur la traite dans la mémoire du navigateur.' }, { question: 'Le résultat est-il précis ?', answer: 'La pose, la lumière, les cheveux et les formes mixtes influencent l’estimation.' }] },
    glasses: { metaTitle: 'Quelles lunettes conviennent à mon visage ?', metaDescription: 'Trouvez les lunettes adaptées à votre forme de visage, comparez les montures et passez du détecteur gratuit à l’essayage virtuel.', eyebrow: 'Quelles lunettes me vont ?', title: 'Quelles lunettes conviennent à la forme de mon visage ?', intro: 'Commencez par la forme du visage, puis vérifiez largeur, échelle, couleur et style sur votre propre photo.', detectorCta: 'Essayer le détecteur gratuit', tryOnCta: 'Essayer des lunettes en ligne', faceShapesLink: 'Comparer les sept formes', hairstylesLink: 'Coiffures par forme de visage', sunglassesLink: 'Lunettes de soleil par forme', steps: [{ title: 'Analyser', text: 'Estimez votre forme avec une photo.' }, { title: 'Présélectionner', text: 'Transformez le résultat en formes de monture.' }, { title: 'Essayer', text: 'Comparez-les sur votre photo.' }], guideTitle: 'Guide rapide des montures par forme de visage', guideIntro: 'Ces conseils sont un premier filtre à compléter par la taille et l’essayage virtuel.', columns: ['Forme du visage', 'À essayer', 'À reconsidérer', 'Pourquoi'], ...localizedRows('fr', { oval: 'Rectangulaires équilibrées, browline et aviateur', round: 'Rectangulaires, carrées et géométriques', square: 'Rondes, ovales et métal fin', heart: 'Légères, arrondies et cat-eye', diamond: 'Ovales, sans monture et cat-eye', oblong: 'Profondes, oversize et browline', triangle: 'Browline, cat-eye et aviateur' }, { oval: 'Montures beaucoup trop étroites', round: 'Petites montures rondes', square: 'Montures carrées très épaisses', heart: 'Montures lourdes sur le haut', diamond: 'Montures très étroites', oblong: 'Verres très peu profonds', triangle: 'Montures lourdes sur le bas' }, { oval: 'Les proportions équilibrées permettent de privilégier l’échelle et le style.', round: 'Les lignes angulaires structurent les courbes douces.', square: 'Les courbes adoucissent la mâchoire et le front.', heart: 'Les formes légères équilibrent le front et le menton.', diamond: 'Une largeur douce équilibre les pommettes.', oblong: 'Des verres plus profonds équilibrent la longueur.', triangle: 'Une ligne supérieure forte équilibre la mâchoire.' }), principles: ['La forme réduit la première sélection.', 'L’essayage vérifie l’échelle réelle.', 'La meilleure paire respecte proportions et style.'], nextEyebrow: 'Étape suivante', nextTitle: 'Passez du conseil à votre propre essayage', faq: [{ question: 'Comment savoir quelles lunettes me vont ?', answer: 'Commencez par le détecteur, puis vérifiez largeur, hauteur des verres, pont et style.' }, { question: 'L’IA peut-elle recommander des lunettes ?', answer: 'Oui, pour créer une présélection à confirmer par essayage virtuel.' }, { question: 'La forme du visage suffit-elle ?', answer: 'Non. Taille, couleur, confort, correction et goût personnel comptent aussi.' }] },
    sunglasses: { metaTitle: 'Meilleures lunettes de soleil pour chaque forme de visage', metaDescription: 'Trouvez les lunettes de soleil adaptées aux visages ovales, ronds, carrés, cœur, diamant, allongés et triangulaires.', eyebrow: 'Guide solaire par forme de visage', title: 'Meilleures lunettes de soleil pour chaque forme de visage', intro: 'Utilisez la forme du visage pour présélectionner une silhouette, puis vérifiez largeur, pommettes, pont et rendu sur votre photo.', detectorCta: 'Trouver gratuitement ma forme', explorerCta: 'Explorer les styles solaires', processTitle: 'Une décision en trois étapes', process: [{ title: 'Identifier', text: 'Trouvez votre forme probable.' }, { title: 'Présélectionner', text: 'Comparez les styles et leurs raisons.' }, { title: 'Valider', text: 'Vérifiez l’échelle et la couleur sur votre photo.' }], guidesTitle: 'Choisissez votre guide', guidesIntro: 'Chaque guide relie les proportions du visage aux modèles de Style Explorer.', cardTitleTemplate: 'Lunettes de soleil pour visage {shape}', cardLink: 'Ouvrir le guide solaire', goals: { oval: 'Préserver l’équilibre naturel et choisir la bonne échelle.', round: 'Ajouter structure et mouvement sans serrer les joues.', square: 'Utiliser des courbes et une hauteur de verre suffisante.', heart: 'Répartir le poids visuel entre front et menton.', diamond: 'Dégager les pommettes et élargir doucement le haut.', oblong: 'Utiliser des verres profonds pour équilibrer la longueur.', triangle: 'Ajouter de la présence près des sourcils et tempes.' }, howToTitle: 'Comment choisir selon la forme du visage', howToSteps: ['Comparez longueur et zones les plus larges.', 'Choisissez contraste ou équilibre.', 'Vérifiez pont, tempes et pommettes.', 'Validez sur votre photo.'], safetyTitle: 'Le style n’est qu’une partie du choix', safetyText: 'Vérifiez la protection UV, la qualité optique et la taille auprès du vendeur.', faqTitle: 'FAQ lunettes de soleil et visage', faq: [{ question: 'Comment choisir selon ma forme ?', answer: 'Identifiez la forme, présélectionnez des montures complémentaires puis vérifiez l’ajustement.' }, { question: 'Quelles lunettes de soleil me vont ?', answer: 'La meilleure paire respecte proportions, pont, largeur, protection et style.' }, { question: 'La forme est-elle plus importante que les UV ?', answer: 'Non. La protection UV passe avant le style.' }] },
    detail: { metaTitleTemplate: 'Lunettes de soleil pour visage {shape}', metaDescriptionTemplate: 'Comparez les lunettes de soleil pour visage {shape} : styles, ajustement, verres et essayage virtuel.', eyebrowTemplate: 'Guide solaire · visage {shape}', titleTemplate: 'Meilleures lunettes de soleil pour visage {shape}', descriptionTemplate: 'Utilisez les proportions d’un visage {shape} pour présélectionner des lunettes, puis vérifiez largeur, hauteur, pont et couleur.', goalLabel: 'Objectif', detectorCta: 'Vérifier gratuitement ma forme', explorerCta: 'Explorer sur ma photo', featuredLabel: 'Point de départ', featuredNote: 'Vérifiez l’échelle réelle avec l’essayage virtuel.', stylesTitle: 'Styles à essayer en premier', stylesIntro: 'Comparez la raison de chaque style puis validez-le sur votre photo.', styleLink: 'Explorer ce style', fitTitle: 'Points d’ajustement', fitChecks: ['Alignez la largeur avec les tempes.', 'Vérifiez le pont et le dégagement des joues.', 'Comparez la hauteur des verres au milieu du visage.'], reconsiderTitle: 'À reconsidérer en premier', reconsider: ['Monture qui serre les tempes', 'Verres posés sur les joues', 'Échelle qui domine les traits'], lensTitle: 'Verres et protection', lensText: 'Choisissez la teinte selon les conditions et le poids visuel souhaité.', lensDisclaimer: 'Confirmez protection UV et spécifications auprès du vendeur.', conversionEyebrow: 'De la recherche à la décision', conversionTitle: 'Voyez la sélection sur votre visage', conversionText: 'La forme réduit les options ; Style Explorer vérifie échelle, couleur et poids visuel.', conversionCta: 'Ouvrir Style Explorer', faqTitleTemplate: 'FAQ solaire · visage {shape}', otherTitle: 'Comparer d’autres formes', styleNames: { wayfarer: 'Solaires Wayfarer', aviator: 'Solaires aviateur', 'cat-eye': 'Solaires œil-de-chat', oversized: 'Solaires oversize', rectangle: 'Solaires rectangulaires', 'flat-top': 'Solaires à barre supérieure', round: 'Solaires rondes', shield: 'Solaires masque' } },
  },
  ru: {
    detector: { metaTitle: 'Бесплатный определитель формы лица — прямо в браузере', metaDescription: 'Загрузите фото и бесплатно определите форму лица. Без регистрации и кредитов; фото не отправляется в VisuTry.', badge: 'Бесплатно · Без входа · На устройстве', title: 'Бесплатный определитель формы лица', intro: 'Узнайте, какая у вас форма лица: овальная, круглая, квадратная, сердцевидная, ромбовидная, удлинённая или треугольная.', trust: [{ title: 'Фото остаётся у вас', text: 'Изображение обрабатывается в памяти браузера.' }, { title: 'Анализ пропорций', text: 'Ориентиры лица преобразуются в скорректированные пропорции.' }, { title: 'Практичный результат', text: 'Используйте результат как ориентир для стиля, а не жёсткое правило.' }], tipsTitle: 'Для более точного результата', tips: ['Одно лицо и нейтральное выражение.', 'Держите глаза ровно и смотрите в камеру.', 'Уберите волосы со лба и линии челюсти.', 'Избегайте теней, фильтров и широкоугольных искажений.'], manualTitle: 'Хотите проверить вручную?', manualText: 'Сравните длину лица, ширину лба, скул и челюсти без загрузки фото.', manualLink: 'Открыть руководство по измерениям', faqTitle: 'Вопросы об определителе формы лица', faq: [{ question: 'Это бесплатно?', answer: 'Да. Регистрация и кредиты не нужны.' }, { question: 'Фото загружается на сервер?', answer: 'Нет. Этот инструмент обрабатывает фото в памяти браузера.' }, { question: 'Насколько точен результат?', answer: 'На оценку влияют ракурс, свет, волосы и смешанные пропорции.' }] },
    glasses: { metaTitle: 'Какие очки подходят моему лицу? Гид по форме лица', metaDescription: 'Подберите очки по форме лица, сравните оправы и перейдите от бесплатного определения формы к виртуальной примерке.', eyebrow: 'Какие очки подходят моему лицу?', title: 'Какие очки подходят моей форме лица?', intro: 'Используйте форму лица как первый фильтр, затем проверьте ширину, масштаб, цвет и стиль на своём фото.', detectorCta: 'Определить форму бесплатно', tryOnCta: 'Примерить очки онлайн', faceShapesLink: 'Сравнить семь форм лица', hairstylesLink: 'Причёски по форме лица', sunglassesLink: 'Солнцезащитные очки по форме', steps: [{ title: 'Определите', text: 'Оцените форму лица по одному фото.' }, { title: 'Выберите', text: 'Составьте список подходящих оправ.' }, { title: 'Примерьте', text: 'Сравните варианты на своём фото.' }], guideTitle: 'Краткий гид по оправам', guideIntro: 'Рекомендации — первый фильтр. Учитывайте размер и результат виртуальной примерки.', columns: ['Форма лица', 'Попробовать', 'Пересмотреть', 'Почему'], ...localizedRows('ru', { oval: 'Прямоугольные, browline, авиаторы и классические', round: 'Прямоугольные, квадратные и геометрические', square: 'Круглые, овальные и тонкие металлические', heart: 'Лёгкие, округлые и cat-eye', diamond: 'Овальные, безободковые и cat-eye', oblong: 'Глубокие, крупные и browline', triangle: 'Browline, cat-eye и авиаторы' }, { oval: 'Слишком узкие оправы', round: 'Маленькие круглые оправы', square: 'Тяжёлые квадратные оправы', heart: 'Тяжёлый верх оправы', diamond: 'Очень узкие оправы', oblong: 'Слишком низкие линзы', triangle: 'Тяжёлый низ оправы' }, { oval: 'Сбалансированные пропорции позволяют выбирать по масштабу и стилю.', round: 'Угловатые линии добавляют чёткости мягким контурам.', square: 'Округлые формы смягчают челюсть и лоб.', heart: 'Лёгкие формы уравновешивают широкий лоб и узкий подбородок.', diamond: 'Мягкая ширина балансирует выраженные скулы.', oblong: 'Более глубокие линзы уравновешивают длину лица.', triangle: 'Выраженная верхняя линия балансирует широкую челюсть.' }), principles: ['Форма лица сужает первый выбор.', 'Примерка показывает реальный масштаб.', 'Лучшая оправа подходит пропорциям и стилю.'], nextEyebrow: 'Следующий шаг', nextTitle: 'Перейдите от совета к примерке', faq: [{ question: 'Как понять, какие очки мне идут?', answer: 'Начните с определения формы, затем проверьте ширину, высоту линз, мост и стиль.' }, { question: 'ИИ может подобрать очки?', answer: 'Да, чтобы составить список, который затем стоит проверить примеркой.' }, { question: 'Достаточно ли формы лица?', answer: 'Нет. Важны размер, цвет, комфорт, рецепт и личный вкус.' }] },
    sunglasses: { metaTitle: 'Солнцезащитные очки для каждой формы лица', metaDescription: 'Подберите солнцезащитные очки для овального, круглого, квадратного и других типов лица.', eyebrow: 'Гид по солнцезащитным очкам', title: 'Лучшие солнцезащитные очки для каждой формы лица', intro: 'Выберите силуэт по форме лица, затем проверьте ширину, посадку на переносице, расстояние до щёк и вид на своём фото.', detectorCta: 'Определить мою форму бесплатно', explorerCta: 'Смотреть стили очков', processTitle: 'Три шага к выбору', process: [{ title: 'Определите', text: 'Узнайте вероятную форму лица.' }, { title: 'Отберите', text: 'Сравните стили и причины выбора.' }, { title: 'Проверьте', text: 'Оцените масштаб и цвет на фото.' }], guidesTitle: 'Выберите гид по своей форме', guidesIntro: 'Каждый гид связывает пропорции лица с моделями в Style Explorer.', cardTitleTemplate: 'Солнцезащитные очки для формы {shape}', cardLink: 'Открыть гид', goals: { oval: 'Сохранить естественный баланс и подобрать масштаб.', round: 'Добавить структуру и оставить место для щёк.', square: 'Смягчить углы изгибами и глубиной линз.', heart: 'Распределить визуальный вес между лбом и подбородком.', diamond: 'Освободить скулы и добавить ширину у бровей.', oblong: 'Уравновесить длину лица глубокими линзами.', triangle: 'Добавить акцент у бровей и висков.' }, howToTitle: 'Как выбирать по форме лица', howToSteps: ['Сравните длину и самые широкие зоны.', 'Выберите контраст или баланс.', 'Проверьте мост, виски и щёки.', 'Оцените вид на своём фото.'], safetyTitle: 'Стиль — только часть решения', safetyText: 'Уточняйте УФ-защиту, оптические свойства и физический размер у продавца.', faqTitle: 'Вопросы об очках и форме лица', faq: [{ question: 'Как выбрать очки по форме лица?', answer: 'Определите форму, выберите дополняющие оправы и проверьте посадку.' }, { question: 'Какие солнцезащитные очки мне идут?', answer: 'Подходящая пара учитывает пропорции, мост, ширину, защиту и стиль.' }, { question: 'Форма важнее УФ-защиты?', answer: 'Нет. Защита от УФ важнее стилистических правил.' }] },
    detail: { metaTitleTemplate: 'Солнцезащитные очки для формы {shape}', metaDescriptionTemplate: 'Сравните очки для формы лица {shape}: стили, посадку, линзы и виртуальную примерку.', eyebrowTemplate: 'Солнцезащитные очки · форма {shape}', titleTemplate: 'Лучшие солнцезащитные очки для формы {shape}', descriptionTemplate: 'Используйте пропорции формы {shape}, чтобы выбрать модели, затем проверьте ширину, глубину линз, мост и цвет.', goalLabel: 'Цель выбора', detectorCta: 'Проверить форму бесплатно', explorerCta: 'Посмотреть на моём фото', featuredLabel: 'Первый вариант', featuredNote: 'Проверьте реальный масштаб виртуальной примеркой.', stylesTitle: 'Стили, которые стоит попробовать', stylesIntro: 'Сравните логику каждого стиля и проверьте его на своём фото.', styleLink: 'Посмотреть стиль', fitTitle: 'Что проверить в посадке', fitChecks: ['Сопоставьте ширину оправы с висками.', 'Проверьте мост и расстояние до щёк.', 'Сравните глубину линз с длиной средней части лица.'], reconsiderTitle: 'Что пересмотреть сначала', reconsider: ['Оправа давит на виски', 'Линзы лежат на щеках', 'Масштаб подавляет черты лица'], lensTitle: 'Линзы и защита', lensText: 'Выбирайте оттенок под условия и желаемый визуальный вес.', lensDisclaimer: 'Уточняйте УФ-защиту и характеристики у продавца.', conversionEyebrow: 'От поиска к решению', conversionTitle: 'Посмотрите выбранные модели на своём лице', conversionText: 'Форма сужает выбор, а Style Explorer проверяет масштаб и цвет.', conversionCta: 'Открыть Style Explorer', faqTitleTemplate: 'Вопросы: форма {shape}', otherTitle: 'Сравнить другие формы', styleNames: { wayfarer: 'Wayfarer', aviator: 'Авиаторы', 'cat-eye': 'Cat-eye', oversized: 'Крупные очки', rectangle: 'Прямоугольные очки', 'flat-top': 'Очки с прямой верхней линией', round: 'Круглые очки', shield: 'Очки-маска' } },
  },
}

const compactLocaleData: Partial<Record<Locale, {
  detector: [string, string, string, string]
  glasses: [string, string, string, string]
  sunglasses: [string, string, string, string]
  common: {
    detectorCta: string; tryOnCta: string; explorerCta: string; guide: string; next: string
    faqDetector: string; faqGlasses: string; faqSunglasses: string
    styleNames: Record<string, string>
  }
}>> = {
  de: { detector: ['Kostenloser Gesichtsform-Detektor', 'Gesichtsform kostenlos und privat im Browser bestimmen', 'Kostenlos · Ohne Anmeldung · Auf dem Gerät', 'Bestimme mit einem Foto, ob dein Gesicht oval, rund, eckig, herz-, diamant-, länglich oder dreieckig ist.'], glasses: ['Welche Brille passt zu meinem Gesicht?', 'Brille nach Gesichtsform auswählen', 'Welche Brille steht mir?', 'Nutze die Gesichtsform als ersten Filter und prüfe Größe, Farbe und Stil anschließend auf deinem Foto.'], sunglasses: ['Sonnenbrillen für jede Gesichtsform', 'Die besten Sonnenbrillen nach Gesichtsform', 'Sonnenbrillen-Ratgeber', 'Wähle eine Form vor und prüfe Breite, Sitz und Wirkung auf deinem Foto.'], common: { detectorCta: 'Gesichtsform kostenlos bestimmen', tryOnCta: 'Brille online anprobieren', explorerCta: 'Sonnenbrillen entdecken', guide: 'Ratgeber öffnen', next: 'Nächster Schritt', faqDetector: 'FAQ zum Gesichtsform-Detektor', faqGlasses: 'FAQ zur Brillenwahl', faqSunglasses: 'FAQ zu Sonnenbrillen', styleNames: { wayfarer: 'Wayfarer-Sonnenbrille', aviator: 'Pilotenbrille', 'cat-eye': 'Cat-Eye-Sonnenbrille', oversized: 'Oversize-Sonnenbrille', rectangle: 'Rechteckige Sonnenbrille', 'flat-top': 'Flat-Top-Sonnenbrille', round: 'Runde Sonnenbrille', shield: 'Shield-Sonnenbrille' } } },
  es: { detector: ['Detector gratuito de forma de rostro', 'Descubre gratis y en privado la forma de tu rostro', 'Gratis · Sin cuenta · En tu dispositivo', 'Descubre si tu rostro es ovalado, redondo, cuadrado, corazón, diamante, alargado o triangular.'], glasses: ['¿Qué gafas le quedan bien a mi cara?', 'Gafas según la forma del rostro', '¿Qué gafas me favorecen?', 'Usa la forma del rostro como primer filtro y comprueba tamaño, color y estilo en tu foto.'], sunglasses: ['Gafas de sol para cada forma de rostro', 'Las mejores gafas de sol según tu rostro', 'Guía de gafas de sol', 'Elige una silueta y comprueba anchura, ajuste y aspecto en tu propia foto.'], common: { detectorCta: 'Detectar mi rostro gratis', tryOnCta: 'Probar gafas online', explorerCta: 'Explorar gafas de sol', guide: 'Abrir la guía', next: 'Siguiente paso', faqDetector: 'Preguntas sobre el detector', faqGlasses: 'Preguntas sobre gafas y rostro', faqSunglasses: 'Preguntas sobre gafas de sol', styleNames: { wayfarer: 'Gafas de sol Wayfarer', aviator: 'Gafas de sol aviador', 'cat-eye': 'Gafas de sol cat-eye', oversized: 'Gafas de sol grandes', rectangle: 'Gafas de sol rectangulares', 'flat-top': 'Gafas de sol flat-top', round: 'Gafas de sol redondas', shield: 'Gafas de sol tipo pantalla' } } },
  pt: { detector: ['Detector gratuito de formato de rosto', 'Descubra gratuitamente e com privacidade o formato do seu rosto', 'Grátis · Sem conta · No dispositivo', 'Descubra se seu rosto é oval, redondo, quadrado, coração, diamante, alongado ou triangular.'], glasses: ['Que óculos combinam com meu rosto?', 'Óculos para cada formato de rosto', 'Que óculos ficam bem em mim?', 'Use o formato do rosto como primeiro filtro e confira tamanho, cor e estilo na sua foto.'], sunglasses: ['Óculos de sol para cada formato de rosto', 'Melhores óculos de sol por formato de rosto', 'Guia de óculos de sol', 'Escolha uma silhueta e confira largura, ajuste e aparência na sua foto.'], common: { detectorCta: 'Detectar meu rosto grátis', tryOnCta: 'Experimentar óculos online', explorerCta: 'Explorar óculos de sol', guide: 'Abrir o guia', next: 'Próximo passo', faqDetector: 'Perguntas sobre o detector', faqGlasses: 'Perguntas sobre óculos e rosto', faqSunglasses: 'Perguntas sobre óculos de sol', styleNames: { wayfarer: 'Óculos de sol Wayfarer', aviator: 'Óculos de sol aviador', 'cat-eye': 'Óculos de sol gatinho', oversized: 'Óculos de sol grandes', rectangle: 'Óculos de sol retangulares', 'flat-top': 'Óculos de sol flat-top', round: 'Óculos de sol redondos', shield: 'Óculos de sol máscara' } } },
  ja: { detector: ['無料の顔型診断', '写真を送信せず無料で顔型をチェック', '無料・ログイン不要・端末内処理', '写真1枚で、卵型・丸型・四角型・ハート型・ダイヤモンド型・面長・三角型のどれに近いか確認できます。'], glasses: ['自分の顔に似合うメガネは？', '顔型別メガネガイド', '似合うメガネを見つける', '顔型で候補を絞り、幅・サイズ・色・印象を自分の写真で確認しましょう。'], sunglasses: ['顔型別おすすめサングラス', 'すべての顔型に合うサングラスガイド', '顔型別サングラスガイド', '顔型から形を絞り、幅・頬との間隔・ブリッジ・見え方を写真で確認します。'], common: { detectorCta: '無料で顔型を診断', tryOnCta: 'メガネをオンライン試着', explorerCta: 'サングラスを探す', guide: 'ガイドを開く', next: '次のステップ', faqDetector: '顔型診断FAQ', faqGlasses: '似合うメガネFAQ', faqSunglasses: 'サングラスFAQ', styleNames: { wayfarer: 'ウェリントンサングラス', aviator: 'アビエーター', 'cat-eye': 'キャットアイ', oversized: 'オーバーサイズ', rectangle: 'スクエア・長方形', 'flat-top': 'フラットトップ', round: 'ラウンド', shield: 'シールド' } } },
  id: { detector: ['Detektor bentuk wajah gratis', 'Temukan bentuk wajah secara gratis dan privat', 'Gratis · Tanpa login · Di perangkat', 'Cari tahu apakah wajah Anda oval, bulat, persegi, hati, berlian, lonjong, atau segitiga.'], glasses: ['Kacamata apa yang cocok untuk wajah saya?', 'Panduan kacamata berdasarkan bentuk wajah', 'Kacamata apa yang cocok untuk saya?', 'Gunakan bentuk wajah sebagai filter awal, lalu periksa ukuran, warna, dan gaya pada foto Anda.'], sunglasses: ['Kacamata hitam untuk setiap bentuk wajah', 'Kacamata hitam terbaik berdasarkan bentuk wajah', 'Panduan kacamata hitam', 'Pilih siluet berdasarkan bentuk wajah, lalu periksa lebar, kenyamanan, dan tampilannya pada foto.'], common: { detectorCta: 'Deteksi bentuk wajah gratis', tryOnCta: 'Coba kacamata online', explorerCta: 'Jelajahi kacamata hitam', guide: 'Buka panduan', next: 'Langkah berikutnya', faqDetector: 'FAQ detektor bentuk wajah', faqGlasses: 'FAQ kacamata dan wajah', faqSunglasses: 'FAQ kacamata hitam', styleNames: { wayfarer: 'Kacamata hitam Wayfarer', aviator: 'Kacamata hitam aviator', 'cat-eye': 'Kacamata hitam cat-eye', oversized: 'Kacamata hitam oversized', rectangle: 'Kacamata hitam persegi panjang', 'flat-top': 'Kacamata hitam flat-top', round: 'Kacamata hitam bulat', shield: 'Kacamata hitam shield' } } },
  ar: { detector: ['كاشف شكل الوجه المجاني', 'اعرف شكل وجهك مجانًا وبخصوصية داخل المتصفح', 'مجاني · بلا تسجيل · على جهازك', 'اكتشف ما إذا كان وجهك بيضاويًا أو دائريًا أو مربعًا أو قلبيًا أو ماسيًا أو مستطيلًا أو مثلثًا.'], glasses: ['ما النظارات التي تناسب وجهي؟', 'دليل النظارات حسب شكل الوجه', 'أي نظارات تلائمني؟', 'استخدم شكل الوجه كمرشح أول، ثم تحقق من المقاس واللون والأسلوب على صورتك.'], sunglasses: ['نظارات شمسية لكل شكل وجه', 'أفضل النظارات الشمسية حسب شكل الوجه', 'دليل النظارات الشمسية', 'اختر الشكل الأولي ثم تحقق من العرض والثبات والمظهر على صورتك.'], common: { detectorCta: 'اكتشف شكل وجهي مجانًا', tryOnCta: 'جرّب النظارات عبر الإنترنت', explorerCta: 'استكشف النظارات الشمسية', guide: 'افتح الدليل', next: 'الخطوة التالية', faqDetector: 'أسئلة كاشف شكل الوجه', faqGlasses: 'أسئلة النظارات وشكل الوجه', faqSunglasses: 'أسئلة النظارات الشمسية', styleNames: { wayfarer: 'نظارات وايفيرر', aviator: 'نظارات أفياتور', 'cat-eye': 'نظارات عين القطة', oversized: 'نظارات كبيرة', rectangle: 'نظارات مستطيلة', 'flat-top': 'نظارات بخط علوي مستقيم', round: 'نظارات دائرية', shield: 'نظارات درع' } } },
}

function makeCompactCopy(locale: Locale, data: NonNullable<(typeof compactLocaleData)[Locale]>): FaceShapeSeoCopy {
  const [detectorTitle, detectorMetaDescription, detectorBadge, detectorIntro] = data.detector
  const [glassesTitle, glassesMetaDescription, glassesEyebrow, glassesIntro] = data.glasses
  const [sunTitle, sunMetaDescription, sunEyebrow, sunIntro] = data.sunglasses
  const names = shapeNames[locale]
  const genericShapeMap = Object.fromEntries(Object.keys(names).map((shape) => [shape, glassesIntro])) as Record<FaceShapeContentSlug, string>
  const genericGoals = Object.fromEntries(Object.keys(names).map((shape) => [shape, sunIntro])) as Record<FaceShapeContentSlug, string>
  const detectorFaq = [
    { question: detectorTitle, answer: detectorMetaDescription },
    { question: detectorBadge, answer: detectorIntro },
    { question: data.common.detectorCta, answer: detectorMetaDescription },
  ]
  const glassesFaq = [
    { question: glassesTitle, answer: glassesIntro },
    { question: glassesEyebrow, answer: glassesMetaDescription },
    { question: data.common.tryOnCta, answer: glassesIntro },
  ]
  const sunglassesFaq = [
    { question: sunTitle, answer: sunIntro },
    { question: sunEyebrow, answer: sunMetaDescription },
    { question: data.common.explorerCta, answer: sunIntro },
  ]
  return {
    shapeNames: names,
    detector: {
      metaTitle: detectorTitle, metaDescription: detectorMetaDescription, badge: detectorBadge,
      title: detectorTitle, intro: detectorIntro,
      trust: [{ title: detectorBadge, text: detectorMetaDescription }, { title: detectorTitle, text: detectorIntro }, { title: data.common.next, text: detectorMetaDescription }],
      tipsTitle: detectorTitle, tips: [detectorIntro, detectorMetaDescription, detectorIntro, detectorMetaDescription],
      manualTitle: detectorTitle, manualText: detectorIntro, manualLink: data.common.detectorCta,
      faqTitle: data.common.faqDetector, faq: detectorFaq,
    },
    glasses: {
      metaTitle: glassesTitle, metaDescription: glassesMetaDescription, eyebrow: glassesEyebrow,
      title: glassesTitle, intro: glassesIntro, detectorCta: data.common.detectorCta,
      tryOnCta: data.common.tryOnCta, faceShapesLink: glassesTitle, hairstylesLink: glassesEyebrow,
      sunglassesLink: sunTitle,
      steps: [{ title: data.common.detectorCta, text: detectorIntro }, { title: glassesEyebrow, text: glassesIntro }, { title: data.common.tryOnCta, text: glassesMetaDescription }],
      guideTitle: glassesTitle, guideIntro: glassesIntro,
      columns: [glassesTitle, glassesEyebrow, data.common.next, data.common.guide],
      tryFirst: genericShapeMap, avoidFirst: genericShapeMap, reasons: genericShapeMap,
      principles: [glassesIntro, glassesMetaDescription, glassesIntro], nextEyebrow: data.common.next,
      nextTitle: glassesTitle, faq: glassesFaq,
    },
    sunglasses: {
      metaTitle: sunTitle, metaDescription: sunMetaDescription, eyebrow: sunEyebrow, title: sunTitle,
      intro: sunIntro, detectorCta: data.common.detectorCta, explorerCta: data.common.explorerCta,
      processTitle: sunTitle,
      process: [{ title: data.common.detectorCta, text: detectorIntro }, { title: sunEyebrow, text: sunIntro }, { title: data.common.explorerCta, text: sunMetaDescription }],
      guidesTitle: sunTitle, guidesIntro: sunIntro, cardTitleTemplate: `${sunTitle}: {shape}`,
      cardLink: data.common.guide, goals: genericGoals, howToTitle: sunTitle,
      howToSteps: [detectorIntro, sunIntro, sunMetaDescription, glassesIntro],
      safetyTitle: sunEyebrow, safetyText: sunMetaDescription, faqTitle: data.common.faqSunglasses,
      faq: sunglassesFaq,
    },
    detail: {
      metaTitleTemplate: `${sunTitle}: {shape}`, metaDescriptionTemplate: `${sunMetaDescription} {shape}.`,
      eyebrowTemplate: `${sunEyebrow} · {shape}`, titleTemplate: `${sunTitle}: {shape}`,
      descriptionTemplate: sunIntro, goalLabel: sunEyebrow, detectorCta: data.common.detectorCta,
      explorerCta: data.common.explorerCta, featuredLabel: data.common.guide, featuredNote: sunIntro,
      stylesTitle: sunTitle, stylesIntro: sunIntro, styleLink: data.common.explorerCta,
      fitTitle: sunEyebrow, fitChecks: [sunIntro, sunMetaDescription, glassesIntro],
      reconsiderTitle: data.common.next, reconsider: [sunMetaDescription, sunIntro, glassesIntro],
      lensTitle: sunEyebrow, lensText: sunMetaDescription, lensDisclaimer: sunMetaDescription,
      conversionEyebrow: data.common.next, conversionTitle: sunTitle, conversionText: sunIntro,
      conversionCta: data.common.explorerCta, faqTitleTemplate: `${data.common.faqSunglasses}: {shape}`,
      otherTitle: sunTitle, styleNames: data.common.styleNames,
    },
  }
}

for (const locale of Object.keys(compactLocaleData) as Locale[]) {
  const data = compactLocaleData[locale]
  if (data) copies[locale] = makeCompactCopy(locale, data)
}
for (const locale of ['fr', 'ru'] as const) {
  const value = localized[locale]
  if (value) copies[locale] = { shapeNames: shapeNames[locale], ...value }
}

export function getFaceShapeSeoCopy(locale: string): FaceShapeSeoCopy {
  return copies[isValidLocale(locale) ? locale : defaultLocale]
}

export function interpolateSeoCopy(template: string, values: Record<string, string>): string {
  return Object.entries(values).reduce((result, [key, value]) => result.split(`{${key}}`).join(value), template)
}
