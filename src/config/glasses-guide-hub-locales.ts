import { defaultLocale, isValidLocale, type Locale } from '@/i18n'

type GroupCopy = {
  eyebrow: string
  title: string
  description: string
}

export type GlassesGuideHubCopy = {
  metaTitle: string
  metaDescription: string
  badge: string
  title: string
  intro: string
  openGuide: string
  englishGuidesNote: string
  breadcrumbHome: string
  breadcrumbGuides: string
  groups: {
    faceFrame: GroupCopy
    genderStyle: GroupCopy
    decisionQuestion: GroupCopy
  }
}

const copies: Record<Locale, GlassesGuideHubCopy> = {
  en: {
    metaTitle: 'Glasses Guides by Face Shape, Frame Style & Fit Question | VisuTry',
    metaDescription: 'Explore focused glasses decision guides by face shape, frame style, and fit question, then validate the shortlist with VisuTry tools.',
    badge: 'Focused eyewear decisions',
    title: 'Glasses Guides by Face Shape, Frame Style & Fit Question',
    intro: 'These pages are built around one decision at a time. Read the short answer, then move directly into face-shape detection, personalized advice, virtual try-on, or frame compare.',
    openGuide: 'Open guide',
    englishGuidesNote: '',
    breadcrumbHome: 'Home',
    breadcrumbGuides: 'Glasses Guides',
    groups: {
      faceFrame: { eyebrow: 'Face × frame', title: 'Frame styles for specific face shapes', description: 'Use these pages when you already have a frame direction in mind and want to test whether it makes sense for your face shape.' },
      genderStyle: { eyebrow: 'Styling intent', title: 'Styling guides by face shape', description: 'Use these pages as style-oriented shortlists, not rigid gender rules. Proportion and fit still lead the decision.' },
      decisionQuestion: { eyebrow: 'Decision questions', title: 'Direct answers to common glasses fit questions', description: 'Start with the question, get the short answer, then validate the choice with a photo or side-by-side comparison.' },
    },
  },
  id: {
    metaTitle: 'Panduan Kacamata berdasarkan Bentuk Wajah, Gaya & Fit | VisuTry',
    metaDescription: 'Jelajahi panduan keputusan kacamata berdasarkan bentuk wajah, gaya frame, dan pertanyaan fit, lalu validasi dengan alat VisuTry.',
    badge: 'Keputusan kacamata yang lebih fokus', title: 'Panduan Kacamata berdasarkan Bentuk Wajah, Gaya Frame & Fit', intro: 'Setiap panduan berfokus pada satu keputusan. Mulai dari pertanyaan Anda lalu lanjutkan ke deteksi wajah, saran personal, coba virtual, atau perbandingan frame.', openGuide: 'Buka panduan', englishGuidesNote: 'Panduan kombinasi rinci sedang dilokalkan dan untuk sementara tetap tersedia dalam bahasa Inggris.', breadcrumbHome: 'Beranda', breadcrumbGuides: 'Panduan Kacamata', groups: { faceFrame: { eyebrow: 'Wajah × frame', title: 'Gaya frame untuk bentuk wajah tertentu', description: 'Gunakan bagian ini saat Anda sudah memiliki arah frame dan ingin menilai kecocokannya dengan bentuk wajah.' }, genderStyle: { eyebrow: 'Tujuan gaya', title: 'Panduan gaya berdasarkan bentuk wajah', description: 'Gunakan sebagai shortlist gaya, bukan aturan gender yang kaku. Proporsi dan fit tetap utama.' }, decisionQuestion: { eyebrow: 'Pertanyaan keputusan', title: 'Jawaban langsung untuk pertanyaan fit kacamata', description: 'Mulai dari pertanyaan, dapatkan jawaban singkat, lalu validasi dengan foto atau perbandingan.' } },
  },
  ar: {
    metaTitle: 'أدلة النظارات حسب شكل الوجه والأسلوب والملاءمة | VisuTry', metaDescription: 'استكشف أدلة عملية لاختيار النظارات حسب شكل الوجه ونمط الإطار وأسئلة الملاءمة ثم تحقق باستخدام أدوات VisuTry.', badge: 'قرارات نظارات أكثر تركيزًا', title: 'أدلة النظارات حسب شكل الوجه ونمط الإطار والملاءمة', intro: 'يركز كل دليل على قرار واحد. ابدأ بالسؤال ثم انتقل إلى اكتشاف شكل الوجه أو النصائح الشخصية أو التجربة الافتراضية أو المقارنة.', openGuide: 'افتح الدليل', englishGuidesNote: 'يجري توطين أدلة التركيبات التفصيلية، وتبقى متاحة مؤقتًا باللغة الإنجليزية.', breadcrumbHome: 'الرئيسية', breadcrumbGuides: 'أدلة النظارات', groups: { faceFrame: { eyebrow: 'الوجه × الإطار', title: 'أنماط إطارات لأشكال وجه محددة', description: 'استخدمها عندما يكون لديك اتجاه إطار وتريد معرفة مدى ملاءمته لشكل وجهك.' }, genderStyle: { eyebrow: 'الأسلوب', title: 'أدلة تنسيق حسب شكل الوجه', description: 'استخدمها كقائمة أسلوب مختصرة لا كقواعد جامدة. النسب والملاءمة أهم.' }, decisionQuestion: { eyebrow: 'أسئلة القرار', title: 'إجابات مباشرة لأسئلة ملاءمة النظارات', description: 'ابدأ بالسؤال ثم تحقق من الاختيار بصورة أو مقارنة جنبًا إلى جنب.' } },
  },
  ru: {
    metaTitle: 'Гайды по очкам: форма лица, стиль и посадка | VisuTry', metaDescription: 'Изучите практические гайды по выбору очков по форме лица, стилю оправы и вопросам посадки, затем проверьте выбор инструментами VisuTry.', badge: 'Сфокусированный выбор очков', title: 'Гайды по очкам: форма лица, стиль оправы и посадка', intro: 'Каждый гайд решает один вопрос. Получите короткий ответ и переходите к определению формы лица, рекомендациям, примерке или сравнению.', openGuide: 'Открыть гайд', englishGuidesNote: 'Подробные комбинированные гайды сейчас локализуются и временно доступны на английском.', breadcrumbHome: 'Главная', breadcrumbGuides: 'Гайды по очкам', groups: { faceFrame: { eyebrow: 'Лицо × оправа', title: 'Стили оправ для разных форм лица', description: 'Используйте, если у вас уже есть направление оправы и вы хотите проверить его для своей формы лица.' }, genderStyle: { eyebrow: 'Стиль', title: 'Стилевые гайды по форме лица', description: 'Используйте как стилевой список, а не жёсткие гендерные правила. Пропорции и посадка важнее.' }, decisionQuestion: { eyebrow: 'Вопросы выбора', title: 'Прямые ответы на вопросы о посадке очков', description: 'Начните с вопроса, получите короткий ответ и проверьте выбор по фото или в сравнении.' } },
  },
  de: {
    metaTitle: 'Brillen-Guides nach Gesichtsform, Stil & Passform | VisuTry', metaDescription: 'Entdecke fokussierte Brillen-Guides nach Gesichtsform, Rahmenstil und Passformfrage und prüfe die Auswahl mit VisuTry.', badge: 'Fokussierte Brillenentscheidungen', title: 'Brillen-Guides nach Gesichtsform, Rahmenstil & Passform', intro: 'Jeder Guide behandelt eine konkrete Entscheidung. Lies die kurze Antwort und gehe direkt zu Gesichtsform-Check, Beratung, Anprobe oder Vergleich.', openGuide: 'Guide öffnen', englishGuidesNote: 'Die detaillierten Kombinations-Guides werden derzeit lokalisiert und sind vorübergehend auf Englisch verfügbar.', breadcrumbHome: 'Startseite', breadcrumbGuides: 'Brillen-Guides', groups: { faceFrame: { eyebrow: 'Gesicht × Rahmen', title: 'Rahmenstile für bestimmte Gesichtsformen', description: 'Nutze diese Guides, wenn du schon eine Rahmenrichtung im Kopf hast und sie für deine Gesichtsform prüfen willst.' }, genderStyle: { eyebrow: 'Styling', title: 'Styling-Guides nach Gesichtsform', description: 'Nutze sie als Stil-Shortlist, nicht als starre Geschlechterregel. Proportion und Passform bleiben entscheidend.' }, decisionQuestion: { eyebrow: 'Entscheidungsfragen', title: 'Direkte Antworten auf häufige Passformfragen', description: 'Starte mit der Frage, lies die kurze Antwort und prüfe die Wahl per Foto oder Direktvergleich.' } },
  },
  ja: {
    metaTitle: '顔型・フレーム・フィット別メガネガイド | VisuTry', metaDescription: '顔型、フレームスタイル、フィットの疑問ごとにメガネ選びを整理し、VisuTryの診断・試着・比較で確認できます。', badge: 'メガネ選びを1つずつ解決', title: '顔型・フレームスタイル・フィット別メガネガイド', intro: '各ガイドは1つの判断に集中しています。短い答えを確認したら、顔型診断、パーソナル提案、バーチャル試着、フレーム比較へ進めます。', openGuide: 'ガイドを開く', englishGuidesNote: '詳細な組み合わせガイドは現在ローカライズ中で、当面は英語版のみ公開しています。', breadcrumbHome: 'ホーム', breadcrumbGuides: 'メガネガイド', groups: { faceFrame: { eyebrow: '顔型 × フレーム', title: '顔型ごとのフレームスタイル', description: '試したいフレームの方向が決まっていて、自分の顔型に合うか確認したいときに使います。' }, genderStyle: { eyebrow: 'スタイリング', title: '顔型別スタイリングガイド', description: '固定的な性別ルールではなく、スタイル候補として使います。比率とフィットを優先します。' }, decisionQuestion: { eyebrow: '選び方の疑問', title: 'メガネのフィットに関するよくある疑問', description: '疑問から始め、短い答えを確認してから写真や並列比較で判断します。' } },
  },
  es: {
    metaTitle: 'Guías de gafas por forma facial, estilo y ajuste | VisuTry', metaDescription: 'Explora guías de decisión de gafas por forma facial, estilo de montura y preguntas de ajuste, y valida con herramientas VisuTry.', badge: 'Decisiones de gafas más claras', title: 'Guías de gafas por forma facial, estilo de montura y ajuste', intro: 'Cada guía se centra en una decisión. Lee la respuesta corta y continúa con detección facial, asesoría, prueba virtual o comparación.', openGuide: 'Abrir guía', englishGuidesNote: 'Las guías combinadas detalladas se están localizando y por ahora siguen disponibles en inglés.', breadcrumbHome: 'Inicio', breadcrumbGuides: 'Guías de gafas', groups: { faceFrame: { eyebrow: 'Cara × montura', title: 'Estilos de montura para formas faciales concretas', description: 'Úsalas cuando ya tengas una dirección de montura y quieras comprobar si encaja con tu forma facial.' }, genderStyle: { eyebrow: 'Estilo', title: 'Guías de estilo por forma facial', description: 'Úsalas como listas de estilo, no como reglas rígidas de género. Proporción y ajuste siguen mandando.' }, decisionQuestion: { eyebrow: 'Preguntas de decisión', title: 'Respuestas directas sobre ajuste de gafas', description: 'Empieza por la pregunta, obtén una respuesta breve y valida con foto o comparación lado a lado.' } },
  },
  pt: {
    metaTitle: 'Guias de óculos por formato do rosto, estilo e ajuste | VisuTry', metaDescription: 'Explore guias de decisão de óculos por formato do rosto, estilo de armação e dúvidas de ajuste, e valide com ferramentas VisuTry.', badge: 'Decisões de óculos mais claras', title: 'Guias de óculos por formato do rosto, estilo de armação e ajuste', intro: 'Cada guia trata de uma decisão. Leia a resposta curta e siga para detecção facial, recomendação, prova virtual ou comparação.', openGuide: 'Abrir guia', englishGuidesNote: 'Os guias combinados detalhados estão sendo localizados e, por enquanto, continuam disponíveis em inglês.', breadcrumbHome: 'Início', breadcrumbGuides: 'Guias de óculos', groups: { faceFrame: { eyebrow: 'Rosto × armação', title: 'Estilos de armação para formatos específicos', description: 'Use quando já tiver uma direção de armação e quiser testar se faz sentido para seu rosto.' }, genderStyle: { eyebrow: 'Estilo', title: 'Guias de estilo por formato do rosto', description: 'Use como listas de estilo, não como regras rígidas de gênero. Proporção e ajuste continuam principais.' }, decisionQuestion: { eyebrow: 'Perguntas de decisão', title: 'Respostas diretas sobre ajuste de óculos', description: 'Comece pela pergunta, obtenha a resposta curta e valide com foto ou comparação lado a lado.' } },
  },
  fr: {
    metaTitle: 'Guides lunettes par forme de visage, style et ajustement | VisuTry', metaDescription: 'Explorez des guides de décision par forme de visage, style de monture et question d’ajustement, puis validez avec les outils VisuTry.', badge: 'Décisions lunettes plus ciblées', title: 'Guides lunettes par forme de visage, style de monture et ajustement', intro: 'Chaque guide traite une décision à la fois. Lisez la réponse courte puis passez à la détection, aux conseils, à l’essayage ou à la comparaison.', openGuide: 'Ouvrir le guide', englishGuidesNote: 'Les guides combinés détaillés sont en cours de localisation et restent temporairement disponibles en anglais.', breadcrumbHome: 'Accueil', breadcrumbGuides: 'Guides lunettes', groups: { faceFrame: { eyebrow: 'Visage × monture', title: 'Styles de montures pour formes de visage précises', description: 'Utilisez-les si vous avez déjà une direction de monture et souhaitez vérifier sa pertinence pour votre visage.' }, genderStyle: { eyebrow: 'Style', title: 'Guides de style par forme de visage', description: 'Utilisez-les comme sélections de style, pas comme règles de genre rigides. Proportions et ajustement restent prioritaires.' }, decisionQuestion: { eyebrow: 'Questions de décision', title: 'Réponses directes aux questions d’ajustement', description: 'Commencez par la question, lisez la réponse courte puis validez avec une photo ou une comparaison.' } },
  },
}

export function getGlassesGuideHubCopy(locale: string): GlassesGuideHubCopy {
  const resolved = isValidLocale(locale) ? locale : defaultLocale
  return copies[resolved]
}
