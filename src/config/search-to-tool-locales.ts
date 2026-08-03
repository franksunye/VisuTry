import { defaultLocale, isValidLocale, type Locale } from '@/i18n'

export type SearchToToolRouteId = 'what-is-my-face-shape'

type FaqItem = { question: string; answer: string }
type StepItem = { title: string; text: string }

export type SearchToToolLandingCopy = {
  metaTitle: string
  metaDescription: string
  eyebrow: string
  title: string
  intro: string
  steps: readonly [StepItem, StepItem, StepItem]
  principles: readonly [string, string, string]
  faq: readonly [FaqItem, FaqItem, FaqItem]
  faqEyebrow: string
  faqTitle: string
  ctaLabels: {
    detector: string
    advisor: string
    tryOn: string
  }
  howTo: {
    name: string
    description: string
    steps: readonly [
      { name: string; text: string },
      { name: string; text: string },
      { name: string; text: string },
    ]
  }
}

const whatIsMyFaceShape: Record<Locale, SearchToToolLandingCopy> = {
  en: {
    metaTitle: 'What Is My Face Shape? Free Photo Face Shape Detector | VisuTry',
    metaDescription: 'What is my face shape? Upload one clear photo and use the free on-device VisuTry detector to estimate your likely face shape, then continue into glasses advice.',
    eyebrow: 'Free photo face-shape check',
    title: 'What Is My Face Shape?',
    intro: 'Use one clear photo to estimate your likely face shape, then turn that result into practical glasses guidance instead of stopping at a label.',
    steps: [
      { title: 'Upload one photo', text: 'Use a straight-on photo with your full face visible.' },
      { title: 'Detect your likely shape', text: 'The free detector runs on-device in your browser.' },
      { title: 'Use the result', text: 'Continue into glasses advice, try-on, or frame compare.' },
    ],
    principles: ['Face shape is an estimate, not an identity label.', 'Use proportions together rather than one feature alone.', 'Confirm glasses visually after narrowing the options.'],
    faq: [
      { question: 'How can I tell what my face shape is?', answer: 'Compare the relative width of your forehead, cheekbones, and jaw together with overall face length. VisuTry can estimate the likely shape from one clear photo.' },
      { question: 'Is the face shape detector free?', answer: 'Yes. The basic face shape detector is free and runs on-device in your browser, so you can get a quick estimate before choosing glasses.' },
      { question: 'What should I do after I know my face shape?', answer: 'Use it as a first filter, then compare frame width, lens depth, bridge fit, and style. You can continue into the glasses advisor, virtual try-on, or frame compare.' },
    ],
    faqEyebrow: 'Free next step',
    faqTitle: 'Check your face shape from a photo',
    ctaLabels: { detector: 'Detect my face shape free', advisor: 'Get glasses advice', tryOn: 'Try glasses on my photo' },
    howTo: { name: 'How to find your face shape from a photo', description: 'Estimate your likely face shape from one clear photo and use it to narrow glasses choices.', steps: [{ name: 'Upload', text: 'Choose a clear, straight-on face photo with even lighting.' }, { name: 'Detect', text: 'Run the free on-device face shape detector.' }, { name: 'Continue', text: 'Use the result to shortlist glasses and validate them with try-on.' }] },
  },
  id: {
    metaTitle: 'Apa Bentuk Wajah Saya? Detektor Gratis dari Foto | VisuTry',
    metaDescription: 'Unggah satu foto jelas untuk memperkirakan bentuk wajah secara gratis di perangkat Anda, lalu lanjutkan ke rekomendasi kacamata.',
    eyebrow: 'Pemeriksaan bentuk wajah gratis dari foto', title: 'Apa Bentuk Wajah Saya?', intro: 'Gunakan satu foto jelas untuk memperkirakan bentuk wajah, lalu ubah hasilnya menjadi panduan praktis memilih kacamata.',
    steps: [{ title: 'Unggah satu foto', text: 'Gunakan foto menghadap depan dengan seluruh wajah terlihat.' }, { title: 'Deteksi bentuk wajah', text: 'Detektor gratis berjalan langsung di browser Anda.' }, { title: 'Gunakan hasilnya', text: 'Lanjutkan ke saran kacamata, coba virtual, atau perbandingan frame.' }],
    principles: ['Bentuk wajah adalah perkiraan, bukan label mutlak.', 'Nilai beberapa proporsi wajah bersama-sama.', 'Konfirmasikan pilihan frame secara visual.'],
    faq: [{ question: 'Bagaimana mengetahui bentuk wajah saya?', answer: 'Bandingkan lebar dahi, tulang pipi, rahang, dan panjang wajah. VisuTry dapat memperkirakannya dari satu foto jelas.' }, { question: 'Apakah detektornya gratis?', answer: 'Ya. Detektor dasar gratis dan berjalan di perangkat Anda melalui browser.' }, { question: 'Apa yang dilakukan setelah tahu bentuk wajah?', answer: 'Gunakan sebagai filter awal, lalu cek lebar frame, kedalaman lensa, bridge, dan gaya melalui advisor atau try-on.' }],
    faqEyebrow: 'Langkah gratis berikutnya', faqTitle: 'Periksa bentuk wajah dari foto', ctaLabels: { detector: 'Deteksi bentuk wajah gratis', advisor: 'Dapatkan saran kacamata', tryOn: 'Coba kacamata di foto saya' },
    howTo: { name: 'Cara mengetahui bentuk wajah dari foto', description: 'Perkirakan bentuk wajah dari satu foto jelas lalu gunakan hasilnya untuk mempersempit pilihan kacamata.', steps: [{ name: 'Unggah', text: 'Pilih foto wajah menghadap depan dengan pencahayaan merata.' }, { name: 'Deteksi', text: 'Jalankan detektor bentuk wajah gratis di perangkat.' }, { name: 'Lanjutkan', text: 'Gunakan hasilnya untuk memilih dan mencoba frame.' }] },
  },
  ar: {
    metaTitle: 'ما شكل وجهي؟ كاشف مجاني من الصورة | VisuTry', metaDescription: 'ارفع صورة واضحة لتقدير شكل وجهك مجانًا على جهازك، ثم انتقل إلى نصائح النظارات وتجربتها.', eyebrow: 'فحص مجاني لشكل الوجه من صورة', title: 'ما شكل وجهي؟', intro: 'استخدم صورة واضحة لتقدير شكل وجهك، ثم حوّل النتيجة إلى إرشاد عملي لاختيار النظارات.',
    steps: [{ title: 'ارفع صورة واحدة', text: 'استخدم صورة أمامية يظهر فيها الوجه كاملًا.' }, { title: 'اكتشف الشكل المرجح', text: 'يعمل الكاشف المجاني داخل متصفحك.' }, { title: 'استخدم النتيجة', text: 'انتقل إلى النصائح أو التجربة الافتراضية أو مقارنة الإطارات.' }],
    principles: ['شكل الوجه تقدير وليس تصنيفًا ثابتًا.', 'استخدم النسب معًا بدل الاعتماد على سمة واحدة.', 'تحقق بصريًا من النظارات بعد تضييق الخيارات.'],
    faq: [{ question: 'كيف أعرف شكل وجهي؟', answer: 'قارن عرض الجبهة وعظام الخد والفك مع طول الوجه. يستطيع VisuTry تقدير الشكل من صورة واضحة.' }, { question: 'هل كاشف شكل الوجه مجاني؟', answer: 'نعم، الكاشف الأساسي مجاني ويعمل محليًا داخل المتصفح.' }, { question: 'ماذا أفعل بعد معرفة شكل وجهي؟', answer: 'استخدمه كمرشح أولي ثم راجع عرض الإطار وعمق العدسة والجسر والأسلوب عبر المستشار أو التجربة.' }],
    faqEyebrow: 'الخطوة المجانية التالية', faqTitle: 'تحقق من شكل وجهك من صورة', ctaLabels: { detector: 'اكتشف شكل وجهي مجانًا', advisor: 'احصل على نصيحة للنظارات', tryOn: 'جرّب النظارات على صورتي' },
    howTo: { name: 'كيفية معرفة شكل الوجه من صورة', description: 'قدّر شكل وجهك من صورة واضحة واستخدم النتيجة لتقليل خيارات النظارات.', steps: [{ name: 'ارفع', text: 'اختر صورة أمامية واضحة بإضاءة متساوية.' }, { name: 'اكتشف', text: 'شغّل الكاشف المجاني على جهازك.' }, { name: 'تابع', text: 'استخدم النتيجة لاختيار الإطارات وتجربتها.' }] },
  },
  ru: {
    metaTitle: 'Какая у меня форма лица? Бесплатный анализ по фото | VisuTry', metaDescription: 'Загрузите чёткое фото, бесплатно определите вероятную форму лица в браузере и перейдите к подбору очков.', eyebrow: 'Бесплатная проверка формы лица по фото', title: 'Какая у меня форма лица?', intro: 'Используйте одно чёткое фото, чтобы оценить форму лица и превратить результат в практические рекомендации по очкам.',
    steps: [{ title: 'Загрузите фото', text: 'Выберите фото анфас, где лицо видно полностью.' }, { title: 'Определите форму', text: 'Бесплатный анализ работает прямо в браузере.' }, { title: 'Используйте результат', text: 'Перейдите к советам, примерке или сравнению оправ.' }], principles: ['Форма лица — ориентир, а не жёсткий ярлык.', 'Оценивайте пропорции вместе.', 'Проверяйте оправы визуально после отбора.'],
    faq: [{ question: 'Как определить форму лица?', answer: 'Сравните ширину лба, скул и челюсти с общей длиной лица. VisuTry может оценить форму по одному фото.' }, { question: 'Анализ бесплатный?', answer: 'Да. Базовый анализ бесплатен и выполняется локально в браузере.' }, { question: 'Что делать после определения формы?', answer: 'Используйте результат как первый фильтр, затем проверьте ширину оправы, посадку, глубину линз и стиль.' }], faqEyebrow: 'Следующий бесплатный шаг', faqTitle: 'Проверьте форму лица по фото', ctaLabels: { detector: 'Определить форму бесплатно', advisor: 'Получить совет по очкам', tryOn: 'Примерить очки на фото' }, howTo: { name: 'Как определить форму лица по фото', description: 'Оцените форму лица по чёткому фото и сузьте выбор очков.', steps: [{ name: 'Загрузите', text: 'Выберите чёткое фото анфас с ровным светом.' }, { name: 'Определите', text: 'Запустите бесплатный локальный анализ.' }, { name: 'Продолжите', text: 'Используйте результат для подбора и примерки оправ.' }] },
  },
  de: {
    metaTitle: 'Welche Gesichtsform habe ich? Kostenloser Foto-Test | VisuTry', metaDescription: 'Lade ein klares Foto hoch, ermittle deine wahrscheinliche Gesichtsform kostenlos im Browser und gehe zur Brillenberatung weiter.', eyebrow: 'Kostenloser Gesichtsform-Check per Foto', title: 'Welche Gesichtsform habe ich?', intro: 'Nutze ein klares Foto, um deine wahrscheinliche Gesichtsform zu bestimmen und daraus eine praktische Brillenauswahl abzuleiten.',
    steps: [{ title: 'Ein Foto hochladen', text: 'Nutze ein frontales Foto, auf dem das ganze Gesicht sichtbar ist.' }, { title: 'Gesichtsform erkennen', text: 'Der kostenlose Test läuft direkt in deinem Browser.' }, { title: 'Ergebnis verwenden', text: 'Gehe weiter zu Beratung, virtueller Anprobe oder Vergleich.' }], principles: ['Die Gesichtsform ist eine Orientierung, kein starres Etikett.', 'Betrachte mehrere Proportionen gemeinsam.', 'Prüfe die Brille anschließend visuell.'],
    faq: [{ question: 'Wie erkenne ich meine Gesichtsform?', answer: 'Vergleiche Stirn, Wangenknochen, Kieferbreite und Gesichtslänge. VisuTry kann die Form aus einem klaren Foto schätzen.' }, { question: 'Ist der Test kostenlos?', answer: 'Ja. Der Basistest ist kostenlos und läuft lokal im Browser.' }, { question: 'Was mache ich danach?', answer: 'Nutze das Ergebnis als ersten Filter und prüfe dann Breite, Brücke, Glastiefe und Stil.' }], faqEyebrow: 'Nächster kostenloser Schritt', faqTitle: 'Gesichtsform per Foto prüfen', ctaLabels: { detector: 'Gesichtsform kostenlos erkennen', advisor: 'Brillenberatung öffnen', tryOn: 'Brille auf meinem Foto testen' }, howTo: { name: 'Gesichtsform per Foto bestimmen', description: 'Bestimme deine wahrscheinliche Gesichtsform aus einem klaren Foto und grenze passende Brillen ein.', steps: [{ name: 'Hochladen', text: 'Wähle ein klares frontales Foto bei gleichmäßigem Licht.' }, { name: 'Erkennen', text: 'Starte den kostenlosen lokalen Test.' }, { name: 'Weiter', text: 'Nutze das Ergebnis für Auswahl und Anprobe.' }] },
  },
  ja: {
    metaTitle: '私の顔型は？写真で無料診断 | VisuTry', metaDescription: '正面写真1枚から顔型をブラウザ上で無料推定し、似合うメガネの提案や試着へ進めます。', eyebrow: '写真で無料の顔型チェック', title: '私の顔型は？', intro: '正面写真1枚から顔型の傾向を推定し、結果を実用的なメガネ選びにつなげます。',
    steps: [{ title: '写真を1枚アップロード', text: '顔全体が見える正面写真を使います。' }, { title: '顔型を推定', text: '無料診断はブラウザ内で処理されます。' }, { title: '結果を活用', text: 'メガネ提案、バーチャル試着、比較へ進みます。' }], principles: ['顔型は目安であり、固定的なラベルではありません。', '一つの特徴ではなく複数の比率を見ます。', '候補を絞った後は写真で見た目を確認します。'],
    faq: [{ question: '自分の顔型はどう分かりますか？', answer: '額、頬骨、あごの幅と顔の長さを比較します。VisuTryは正面写真1枚から傾向を推定できます。' }, { question: '顔型診断は無料ですか？', answer: 'はい。基本診断は無料で、ブラウザ内で処理されます。' }, { question: '顔型が分かった後は？', answer: '最初の絞り込みに使い、フレーム幅、レンズの深さ、ブリッジ、スタイルを試着や比較で確認します。' }], faqEyebrow: '次の無料ステップ', faqTitle: '写真から顔型をチェック', ctaLabels: { detector: '無料で顔型を診断', advisor: 'メガネ提案を見る', tryOn: '自分の写真で試着' }, howTo: { name: '写真から顔型を調べる方法', description: '正面写真1枚から顔型を推定し、メガネ候補を絞ります。', steps: [{ name: 'アップロード', text: '明るく正面を向いた写真を選びます。' }, { name: '診断', text: '端末上で無料診断を実行します。' }, { name: '次へ', text: '結果をメガネ選びと試着に使います。' }] },
  },
  es: {
    metaTitle: '¿Qué forma tiene mi cara? Detector gratis por foto | VisuTry', metaDescription: 'Sube una foto clara, estima gratis la forma de tu cara en el navegador y continúa con recomendaciones de gafas.', eyebrow: 'Análisis gratuito de forma facial por foto', title: '¿Qué forma tiene mi cara?', intro: 'Usa una foto clara para estimar la forma de tu cara y convertir el resultado en una guía práctica para elegir gafas.',
    steps: [{ title: 'Sube una foto', text: 'Usa una imagen frontal donde se vea toda la cara.' }, { title: 'Detecta la forma probable', text: 'El detector gratuito funciona en tu navegador.' }, { title: 'Usa el resultado', text: 'Continúa con asesoría, prueba virtual o comparación.' }], principles: ['La forma facial es una estimación, no una etiqueta rígida.', 'Combina varias proporciones del rostro.', 'Valida visualmente las gafas después de filtrar opciones.'],
    faq: [{ question: '¿Cómo sé qué forma tiene mi cara?', answer: 'Compara la anchura de frente, pómulos y mandíbula con la longitud del rostro. VisuTry puede estimarla desde una foto clara.' }, { question: '¿El detector es gratis?', answer: 'Sí. El detector básico es gratuito y se ejecuta localmente en el navegador.' }, { question: '¿Qué hago después?', answer: 'Úsalo como primer filtro y revisa ancho, puente, profundidad de lente y estilo con asesoría o prueba virtual.' }], faqEyebrow: 'Siguiente paso gratuito', faqTitle: 'Comprueba tu forma facial con una foto', ctaLabels: { detector: 'Detectar mi forma gratis', advisor: 'Obtener consejo sobre gafas', tryOn: 'Probar gafas en mi foto' }, howTo: { name: 'Cómo conocer la forma de tu cara con una foto', description: 'Estima tu forma facial desde una foto clara y reduce las opciones de gafas.', steps: [{ name: 'Subir', text: 'Elige una foto frontal clara con luz uniforme.' }, { name: 'Detectar', text: 'Ejecuta el detector gratuito en tu dispositivo.' }, { name: 'Continuar', text: 'Usa el resultado para elegir y probar monturas.' }] },
  },
  pt: {
    metaTitle: 'Qual é o formato do meu rosto? Detector grátis por foto | VisuTry', metaDescription: 'Envie uma foto nítida, estime grátis o formato do rosto no navegador e continue para recomendações de óculos.', eyebrow: 'Análise gratuita do formato do rosto por foto', title: 'Qual é o formato do meu rosto?', intro: 'Use uma foto nítida para estimar o formato do rosto e transformar o resultado em orientação prática para escolher óculos.',
    steps: [{ title: 'Envie uma foto', text: 'Use uma imagem frontal com o rosto inteiro visível.' }, { title: 'Detecte o formato provável', text: 'O detector gratuito roda no seu navegador.' }, { title: 'Use o resultado', text: 'Continue para recomendações, prova virtual ou comparação.' }], principles: ['O formato do rosto é uma estimativa, não um rótulo rígido.', 'Considere várias proporções em conjunto.', 'Confirme visualmente os óculos após reduzir as opções.'],
    faq: [{ question: 'Como saber o formato do meu rosto?', answer: 'Compare a largura da testa, maçãs do rosto e mandíbula com o comprimento facial. O VisuTry pode estimar a partir de uma foto.' }, { question: 'O detector é gratuito?', answer: 'Sim. O detector básico é grátis e funciona localmente no navegador.' }, { question: 'O que faço depois?', answer: 'Use como primeiro filtro e verifique largura, ponte, profundidade da lente e estilo com recomendação ou prova virtual.' }], faqEyebrow: 'Próximo passo gratuito', faqTitle: 'Confira o formato do rosto por foto', ctaLabels: { detector: 'Detectar meu rosto grátis', advisor: 'Receber recomendação de óculos', tryOn: 'Provar óculos na minha foto' }, howTo: { name: 'Como descobrir o formato do rosto por foto', description: 'Estime o formato do rosto por uma foto clara e reduza as opções de óculos.', steps: [{ name: 'Enviar', text: 'Escolha uma foto frontal clara e bem iluminada.' }, { name: 'Detectar', text: 'Execute o detector gratuito no dispositivo.' }, { name: 'Continuar', text: 'Use o resultado para escolher e provar armações.' }] },
  },
  fr: {
    metaTitle: 'Quelle est la forme de mon visage ? Détecteur photo gratuit | VisuTry', metaDescription: 'Importez une photo nette, estimez gratuitement la forme de votre visage dans le navigateur, puis passez aux conseils lunettes.', eyebrow: 'Analyse gratuite de la forme du visage', title: 'Quelle est la forme de mon visage ?', intro: 'Utilisez une photo nette pour estimer la forme de votre visage et transformer le résultat en conseils pratiques pour choisir vos lunettes.',
    steps: [{ title: 'Importer une photo', text: 'Utilisez une photo de face où tout le visage est visible.' }, { title: 'Détecter la forme probable', text: 'Le détecteur gratuit fonctionne dans votre navigateur.' }, { title: 'Utiliser le résultat', text: 'Passez aux conseils, à l’essayage virtuel ou à la comparaison.' }], principles: ['La forme du visage est une estimation, pas une étiquette rigide.', 'Combinez plusieurs proportions du visage.', 'Validez visuellement les lunettes après avoir réduit les options.'],
    faq: [{ question: 'Comment connaître la forme de mon visage ?', answer: 'Comparez la largeur du front, des pommettes et de la mâchoire avec la longueur du visage. VisuTry peut l’estimer à partir d’une photo nette.' }, { question: 'Le détecteur est-il gratuit ?', answer: 'Oui. Le détecteur de base est gratuit et fonctionne localement dans le navigateur.' }, { question: 'Que faire ensuite ?', answer: 'Utilisez le résultat comme premier filtre, puis vérifiez la largeur, le pont, la profondeur des verres et le style.' }], faqEyebrow: 'Étape gratuite suivante', faqTitle: 'Vérifiez la forme de votre visage par photo', ctaLabels: { detector: 'Détecter ma forme gratuitement', advisor: 'Obtenir des conseils lunettes', tryOn: 'Essayer des lunettes sur ma photo' }, howTo: { name: 'Comment trouver la forme de son visage par photo', description: 'Estimez votre forme de visage depuis une photo nette et réduisez les choix de lunettes.', steps: [{ name: 'Importer', text: 'Choisissez une photo de face nette et bien éclairée.' }, { name: 'Détecter', text: 'Lancez le détecteur gratuit sur votre appareil.' }, { name: 'Continuer', text: 'Utilisez le résultat pour choisir et essayer des montures.' }] },
  },
}

export function getSearchToToolLandingCopy(locale: string, routeId: SearchToToolRouteId): SearchToToolLandingCopy {
  const resolved = isValidLocale(locale) ? locale : defaultLocale
  if (routeId === 'what-is-my-face-shape') return whatIsMyFaceShape[resolved]
  return whatIsMyFaceShape[defaultLocale]
}
