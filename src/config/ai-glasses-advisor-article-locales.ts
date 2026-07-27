import { defaultLocale, isValidLocale, type Locale } from '@/i18n'

export type AiGlassesAdvisorArticleCopy = {
  metaTitle: string
  metaDescription: string
  eyebrow: string
  title: string
  intro: string
  articleLabel: string
  publishedLabel: string
  readTime: string
  heroTitle: string
  heroBody: string
  overviewTitle: string
  overview: readonly [string, string]
  workflowTitle: string
  guideTitle: string
  guideIntro: string
  decisionTitle: string
  decisionIntro: string
  decisionSteps: readonly string[]
  pathsTitle: string
  pathsIntro: string
  pathDetector: string
  pathAdvisor: string
  pathGuide: string
  pathTryOn: string
  faqTitle: string
  checklistTitle: string
  checklist: readonly string[]
  finalTitle: string
  finalBody: string
}

const copies: Record<Locale, AiGlassesAdvisorArticleCopy> = {
  en: {
    metaTitle: 'Which Glasses Suit My Face? Free AI Face Shape Detector',
    metaDescription: 'Upload a photo to find your face shape free, see which glasses may suit your face, and continue to personalized AI frame advice or virtual try-on.',
    eyebrow: 'Free face shape detector · No login · Photo stays in your browser',
    title: 'Which Glasses Suit My Face? Start With a Free AI Face Shape Detector',
    intro: 'Upload one photo to find your likely face shape free, then turn the result into a practical glasses shortlist. Continue to personalized AI advice or validate the styles with virtual try-on.',
    articleLabel: 'AI glasses and face-shape guide', publishedLabel: 'Published Jun 8, 2026 · Updated Jul 27, 2026', readTime: '6 min read',
    heroTitle: 'Find which glasses suit your face', heroBody: 'Start with the free private detector. If you want a personalized frame shortlist, continue to the AI Glasses Advisor.',
    overviewTitle: 'Use face shape as the first filter, not the final rule',
    overview: ['Face shape can narrow a large catalog into frame directions worth trying. It is most useful when you combine it with frame width, lens depth, bridge fit, color, and personal style.', 'The free detector gives you a private starting point. The AI Glasses Advisor adds personalized reasoning, and virtual try-on lets you judge the shortlist on your own photo.'],
    workflowTitle: 'A practical path from one photo to a shortlist', guideTitle: 'Glasses to try first by face shape', guideIntro: 'Use these recommendations as a shortlist, then verify scale and fit with virtual try-on.',
    decisionTitle: 'How to make the final decision', decisionIntro: 'A useful result should reduce uncertainty without pretending that one face-shape rule decides everything.',
    decisionSteps: ['Run the free detector with a clear, front-facing photo.', 'Choose two or three recommended frame directions.', 'Compare several frames on your own photo.', 'Check real measurements, prescription needs, comfort, and return policy before buying.'],
    pathsTitle: 'Choose the right next step', pathsIntro: 'Start at the stage that matches what you already know.',
    pathDetector: 'Find my face shape free', pathAdvisor: 'Get personalized glasses advice', pathGuide: 'Compare glasses by face shape', pathTryOn: 'Try glasses on my photo', faqTitle: 'Questions about AI glasses advice',
    checklistTitle: 'Before you choose a frame', checklist: ['Use face shape to create a shortlist, not to eliminate every other style.', 'Compare width, brow alignment, lens depth, and cheek clearance.', 'Choose the pair that looks balanced and still feels like your style.'],
    finalTitle: 'Turn the search into a real visual decision', finalBody: 'Find your face shape free, understand the recommended directions, and compare the shortlist on your own photo.',
  },
  id: {
    metaTitle: 'Kacamata Apa yang Cocok untuk Wajah Saya? Detektor AI Gratis',
    metaDescription: 'Unggah foto untuk menemukan bentuk wajah secara gratis, melihat kacamata yang mungkin cocok, lalu lanjut ke saran AI atau coba virtual.',
    eyebrow: 'Detektor bentuk wajah gratis · Tanpa login · Foto tetap di browser',
    title: 'Kacamata Apa yang Cocok untuk Wajah Saya? Mulai dengan Detektor AI Gratis',
    intro: 'Unggah satu foto untuk menemukan kemungkinan bentuk wajah Anda secara gratis, lalu ubah hasilnya menjadi pilihan kacamata yang praktis. Lanjutkan ke saran AI personal atau coba gaya secara virtual.',
    articleLabel: 'Panduan AI kacamata dan bentuk wajah', publishedLabel: 'Terbit 8 Jun 2026 · Diperbarui 27 Jul 2026', readTime: '6 menit baca',
    heroTitle: 'Temukan kacamata yang cocok untuk wajah Anda', heroBody: 'Mulai dengan detektor gratis dan privat. Untuk rekomendasi bingkai yang lebih personal, lanjutkan ke Penasihat Kacamata AI.',
    overviewTitle: 'Gunakan bentuk wajah sebagai filter awal, bukan aturan akhir',
    overview: ['Bentuk wajah membantu mempersempit katalog besar menjadi beberapa arah bingkai yang layak dicoba. Gabungkan dengan lebar bingkai, tinggi lensa, jembatan, warna, dan gaya pribadi.', 'Detektor gratis memberi titik awal yang privat. Penasihat Kacamata AI menambahkan alasan personal, sedangkan coba virtual membantu menilai pilihan pada foto Anda.'],
    workflowTitle: 'Jalur praktis dari satu foto ke pilihan bingkai', guideTitle: 'Kacamata yang layak dicoba berdasarkan bentuk wajah', guideIntro: 'Gunakan rekomendasi ini sebagai pilihan awal, lalu periksa skala dan kecocokan dengan coba virtual.',
    decisionTitle: 'Cara membuat keputusan akhir', decisionIntro: 'Hasil yang berguna mengurangi keraguan tanpa menganggap satu aturan bentuk wajah menentukan semuanya.',
    decisionSteps: ['Jalankan detektor gratis dengan foto depan yang jelas.', 'Pilih dua atau tiga arah bingkai yang direkomendasikan.', 'Bandingkan beberapa bingkai pada foto Anda.', 'Periksa ukuran nyata, kebutuhan resep, kenyamanan, dan kebijakan retur sebelum membeli.'],
    pathsTitle: 'Pilih langkah berikutnya', pathsIntro: 'Mulailah dari tahap yang sesuai dengan apa yang sudah Anda ketahui.',
    pathDetector: 'Temukan bentuk wajah gratis', pathAdvisor: 'Dapatkan saran kacamata personal', pathGuide: 'Bandingkan kacamata menurut bentuk wajah', pathTryOn: 'Coba kacamata pada foto saya', faqTitle: 'Pertanyaan tentang saran kacamata AI',
    checklistTitle: 'Sebelum memilih bingkai', checklist: ['Gunakan bentuk wajah untuk membuat pilihan awal, bukan menolak semua gaya lain.', 'Bandingkan lebar, garis alis, tinggi lensa, dan jarak dari pipi.', 'Pilih bingkai yang seimbang dan tetap terasa seperti gaya Anda.'],
    finalTitle: 'Ubah pencarian menjadi keputusan visual', finalBody: 'Temukan bentuk wajah secara gratis, pahami arah bingkai yang disarankan, lalu bandingkan pilihan pada foto Anda.',
  },
  ar: {
    metaTitle: 'ما النظارات التي تناسب وجهي؟ كاشف شكل الوجه المجاني',
    metaDescription: 'ارفع صورة لمعرفة شكل وجهك مجانًا، واكتشف النظارات التي قد تناسبك، ثم انتقل إلى نصائح الذكاء الاصطناعي أو التجربة الافتراضية.',
    eyebrow: 'كاشف مجاني · بلا تسجيل · تبقى الصورة داخل المتصفح',
    title: 'ما النظارات التي تناسب وجهي؟ ابدأ بكاشف شكل الوجه المجاني',
    intro: 'ارفع صورة واحدة لمعرفة شكل وجهك المحتمل مجانًا، ثم حوّل النتيجة إلى قائمة عملية من النظارات. تابع إلى نصائح مخصصة أو جرّب الأنماط افتراضيًا.',
    articleLabel: 'دليل النظارات وشكل الوجه بالذكاء الاصطناعي', publishedLabel: 'نُشر 8 يونيو 2026 · حُدّث 27 يوليو 2026', readTime: 'قراءة 6 دقائق',
    heroTitle: 'اعرف النظارات التي تناسب وجهك', heroBody: 'ابدأ بالكاشف المجاني والخاص. وإذا أردت قائمة إطارات مخصصة، فانتقل إلى مستشار النظارات بالذكاء الاصطناعي.',
    overviewTitle: 'اجعل شكل الوجه مرشحًا أوليًا لا قاعدة نهائية',
    overview: ['يساعد شكل الوجه على تقليص كتالوج كبير إلى اتجاهات إطارات تستحق التجربة. ادمجه مع عرض الإطار وعمق العدسة وثبات الجسر واللون وأسلوبك الشخصي.', 'يمنحك الكاشف المجاني نقطة بداية خاصة. يضيف المستشار تفسيرًا مخصصًا، وتتيح لك التجربة الافتراضية تقييم الخيارات على صورتك.'],
    workflowTitle: 'مسار عملي من صورة واحدة إلى قائمة مختصرة', guideTitle: 'نظارات تستحق التجربة حسب شكل الوجه', guideIntro: 'استخدم هذه التوصيات كقائمة أولية، ثم تحقق من الحجم والملاءمة بالتجربة الافتراضية.',
    decisionTitle: 'كيف تتخذ القرار النهائي', decisionIntro: 'النتيجة المفيدة تقلل الحيرة من دون الادعاء بأن قاعدة واحدة لشكل الوجه تحسم كل شيء.',
    decisionSteps: ['استخدم الكاشف المجاني بصورة أمامية واضحة.', 'اختر اتجاهين أو ثلاثة من الإطارات المقترحة.', 'قارن عدة إطارات على صورتك.', 'تحقق من المقاسات والوصفة والراحة وسياسة الإرجاع قبل الشراء.'],
    pathsTitle: 'اختر خطوتك التالية', pathsIntro: 'ابدأ من المرحلة التي تناسب ما تعرفه بالفعل.',
    pathDetector: 'اكتشف شكل وجهي مجانًا', pathAdvisor: 'احصل على نصيحة نظارات مخصصة', pathGuide: 'قارن النظارات حسب شكل الوجه', pathTryOn: 'جرّب النظارات على صورتي', faqTitle: 'أسئلة عن نصائح النظارات بالذكاء الاصطناعي',
    checklistTitle: 'قبل اختيار الإطار', checklist: ['استخدم شكل الوجه لبناء قائمة أولية لا لاستبعاد كل الأنماط الأخرى.', 'قارن العرض ومحاذاة الحاجب وعمق العدسة والمسافة عن الخدين.', 'اختر إطارًا متوازنًا ويعبّر عن أسلوبك.'],
    finalTitle: 'حوّل البحث إلى قرار بصري حقيقي', finalBody: 'اعرف شكل وجهك مجانًا، وافهم اتجاهات الإطارات المقترحة، ثم قارنها على صورتك.',
  },
  ru: {
    metaTitle: 'Какие очки мне подходят? Бесплатный ИИ-детектор формы лица',
    metaDescription: 'Загрузите фото, бесплатно определите форму лица, узнайте, какие очки вам подходят, и перейдите к персональным советам или виртуальной примерке.',
    eyebrow: 'Бесплатно · Без входа · Фото остаётся в браузере',
    title: 'Какие очки мне подходят? Начните с бесплатного детектора формы лица',
    intro: 'Загрузите одну фотографию, бесплатно определите вероятную форму лица и превратите результат в практичный список оправ. Затем получите персональный совет или проверьте варианты в виртуальной примерке.',
    articleLabel: 'ИИ-гид по очкам и форме лица', publishedLabel: 'Опубликовано 8 июня 2026 · Обновлено 27 июля 2026', readTime: '6 минут',
    heroTitle: 'Узнайте, какие очки подходят вашему лицу', heroBody: 'Начните с бесплатного приватного детектора. Для персонального списка оправ перейдите к ИИ-консультанту по очкам.',
    overviewTitle: 'Форма лица — первый фильтр, а не окончательное правило',
    overview: ['Форма лица помогает сузить большой каталог до нескольких направлений. Учитывайте также ширину оправы, высоту линз, посадку моста, цвет и личный стиль.', 'Бесплатный детектор даёт приватную отправную точку. ИИ-консультант добавляет персональные объяснения, а виртуальная примерка показывает варианты на вашем фото.'],
    workflowTitle: 'Практичный путь от одной фотографии к списку оправ', guideTitle: 'Какие очки примерить для каждой формы лица', guideIntro: 'Используйте рекомендации как начальный список, затем проверьте масштаб и посадку виртуальной примеркой.',
    decisionTitle: 'Как принять окончательное решение', decisionIntro: 'Полезный результат уменьшает неопределённость, не превращая одно правило формы лица в абсолют.',
    decisionSteps: ['Запустите бесплатный детектор с чёткой фотографией анфас.', 'Выберите два или три рекомендованных направления оправ.', 'Сравните несколько оправ на своей фотографии.', 'Перед покупкой проверьте размеры, рецепт, комфорт и условия возврата.'],
    pathsTitle: 'Выберите следующий шаг', pathsIntro: 'Начните с этапа, который соответствует тому, что вы уже знаете.',
    pathDetector: 'Бесплатно определить форму лица', pathAdvisor: 'Получить персональный совет по очкам', pathGuide: 'Сравнить очки по форме лица', pathTryOn: 'Примерить очки на фото', faqTitle: 'Вопросы об ИИ-подборе очков',
    checklistTitle: 'Перед выбором оправы', checklist: ['Используйте форму лица для списка вариантов, а не для запрета всех остальных стилей.', 'Сравните ширину, линию бровей, высоту линз и расстояние до щёк.', 'Выберите оправу, которая выглядит сбалансированно и соответствует вашему стилю.'],
    finalTitle: 'Превратите поиск в наглядное решение', finalBody: 'Бесплатно определите форму лица, разберитесь в рекомендациях и сравните оправы на своей фотографии.',
  },
  de: {
    metaTitle: 'Welche Brille passt zu mir? Kostenloser KI-Gesichtsform-Test',
    metaDescription: 'Laden Sie ein Foto hoch, bestimmen Sie kostenlos Ihre Gesichtsform und finden Sie passende Brillen mit KI-Beratung oder virtueller Anprobe.',
    eyebrow: 'Kostenlos · Ohne Anmeldung · Foto bleibt im Browser',
    title: 'Welche Brille passt zu mir? Starten Sie mit dem kostenlosen Gesichtsform-Test',
    intro: 'Laden Sie ein Foto hoch, bestimmen Sie kostenlos Ihre wahrscheinliche Gesichtsform und erstellen Sie daraus eine praktische Brillenauswahl. Danach erhalten Sie persönliche KI-Empfehlungen oder testen die Modelle virtuell.',
    articleLabel: 'KI-Ratgeber für Brillen und Gesichtsformen', publishedLabel: 'Veröffentlicht am 8. Juni 2026 · Aktualisiert am 27. Juli 2026', readTime: '6 Min. Lesezeit',
    heroTitle: 'Finden Sie heraus, welche Brille zu Ihrem Gesicht passt', heroBody: 'Beginnen Sie mit dem kostenlosen privaten Test. Für eine persönliche Vorauswahl wechseln Sie zum KI-Brillenberater.',
    overviewTitle: 'Gesichtsform als ersten Filter nutzen, nicht als starre Regel',
    overview: ['Die Gesichtsform hilft, einen großen Katalog auf sinnvolle Fassungsrichtungen einzugrenzen. Berücksichtigen Sie zusätzlich Breite, Glashöhe, Steg, Farbe und persönlichen Stil.', 'Der kostenlose Test liefert einen privaten Ausgangspunkt. Der KI-Berater ergänzt persönliche Gründe, und die virtuelle Anprobe zeigt die Auswahl auf Ihrem Foto.'],
    workflowTitle: 'Von einem Foto zu einer sinnvollen Vorauswahl', guideTitle: 'Brillen nach Gesichtsform: Diese Modelle zuerst testen', guideIntro: 'Nutzen Sie die Empfehlungen als Vorauswahl und prüfen Sie Größe und Wirkung anschließend virtuell.',
    decisionTitle: 'So treffen Sie die endgültige Entscheidung', decisionIntro: 'Ein gutes Ergebnis reduziert Unsicherheit, ohne eine einzelne Gesichtsform-Regel zum alleinigen Maßstab zu machen.',
    decisionSteps: ['Nutzen Sie den kostenlosen Test mit einem klaren Frontalfoto.', 'Wählen Sie zwei oder drei empfohlene Fassungsrichtungen.', 'Vergleichen Sie mehrere Brillen auf Ihrem Foto.', 'Prüfen Sie vor dem Kauf Maße, Sehstärke, Komfort und Rückgabebedingungen.'],
    pathsTitle: 'Wählen Sie den passenden nächsten Schritt', pathsIntro: 'Steigen Sie dort ein, wo es zu Ihrem aktuellen Wissen passt.',
    pathDetector: 'Gesichtsform kostenlos bestimmen', pathAdvisor: 'Persönliche Brillenberatung erhalten', pathGuide: 'Brillen nach Gesichtsform vergleichen', pathTryOn: 'Brillen auf meinem Foto testen', faqTitle: 'Fragen zur KI-Brillenberatung',
    checklistTitle: 'Vor der Wahl einer Fassung', checklist: ['Die Gesichtsform dient der Vorauswahl und schließt andere Stile nicht aus.', 'Vergleichen Sie Breite, Augenbrauenlinie, Glashöhe und Abstand zu den Wangen.', 'Wählen Sie eine ausgewogene Fassung, die zu Ihrem Stil passt.'],
    finalTitle: 'Aus der Suche wird eine sichtbare Entscheidung', finalBody: 'Bestimmen Sie kostenlos Ihre Gesichtsform, verstehen Sie die Empfehlungen und vergleichen Sie die Auswahl auf Ihrem Foto.',
  },
  ja: {
    metaTitle: '自分に似合うメガネは？無料AI顔型診断',
    metaDescription: '写真をアップロードして顔型を無料診断。似合うメガネを絞り込み、AIによる個別提案やバーチャル試着へ進めます。',
    eyebrow: '無料 · ログイン不要 · 写真はブラウザ内で処理',
    title: '自分に似合うメガネは？まず無料AI顔型診断から',
    intro: '写真1枚から顔型の傾向を無料で確認し、試す価値のあるメガネを絞り込みます。さらに詳しい個別提案や、写真でのバーチャル試着へ進めます。',
    articleLabel: 'AIメガネ・顔型ガイド', publishedLabel: '2026年6月8日公開 · 2026年7月27日更新', readTime: '読了6分',
    heroTitle: 'あなたの顔に似合うメガネを見つける', heroBody: 'まず無料でプライバシーに配慮した顔型診断を利用し、個別の候補が必要ならAIメガネアドバイザーへ進みます。',
    overviewTitle: '顔型は最初の絞り込み。最後のルールではありません',
    overview: ['顔型を使うと、多くの商品の中から試す価値のあるフレームを絞れます。幅、レンズの深さ、ブリッジ、色、好みも合わせて確認しましょう。', '無料診断はプライベートな出発点です。AIアドバイザーは理由付きの個別提案を行い、バーチャル試着では自分の写真で候補を比較できます。'],
    workflowTitle: '写真1枚から候補を絞る実用的な流れ', guideTitle: '顔型別に最初に試したいメガネ', guideIntro: 'おすすめを最初の候補として使い、サイズ感とバランスをバーチャル試着で確認してください。',
    decisionTitle: '最後の1本を決める方法', decisionIntro: '役立つ診断は迷いを減らしますが、顔型だけですべてを決めるものではありません。',
    decisionSteps: ['正面を向いた鮮明な写真で無料診断を行います。', 'おすすめから2〜3種類のフレーム方向を選びます。', '自分の写真で複数のフレームを比較します。', '購入前に実寸、度数、掛け心地、返品条件を確認します。'],
    pathsTitle: '次に行うことを選ぶ', pathsIntro: 'すでに分かっていることに合う段階から始めてください。',
    pathDetector: '顔型を無料で診断', pathAdvisor: '自分向けのメガネ提案を受ける', pathGuide: '顔型別メガネを比較', pathTryOn: '自分の写真でメガネを試着', faqTitle: 'AIメガネ提案のよくある質問',
    checklistTitle: 'フレームを選ぶ前の確認', checklist: ['顔型は候補作りに使い、他のスタイルをすべて除外しないこと。', '幅、眉との位置、レンズの深さ、頬との間隔を比較すること。', 'バランスがよく、自分らしく感じるフレームを選ぶこと。'],
    finalTitle: '検索を実際の見た目の判断へ', finalBody: '顔型を無料で確認し、おすすめの理由を理解して、自分の写真で候補を比較しましょう。',
  },
  es: {
    metaTitle: '¿Qué gafas me quedan bien? Detector facial con IA gratis',
    metaDescription: 'Sube una foto, descubre gratis la forma de tu rostro y encuentra gafas que te favorezcan con consejos de IA o prueba virtual.',
    eyebrow: 'Gratis · Sin iniciar sesión · La foto permanece en el navegador',
    title: '¿Qué gafas me quedan bien? Empieza con el detector facial gratuito',
    intro: 'Sube una foto para descubrir gratis la forma probable de tu rostro y convertir el resultado en una selección práctica de gafas. Después puedes recibir consejos personalizados o probar los estilos virtualmente.',
    articleLabel: 'Guía de gafas y forma del rostro con IA', publishedLabel: 'Publicado el 8 jun 2026 · Actualizado el 27 jul 2026', readTime: '6 min de lectura',
    heroTitle: 'Descubre qué gafas favorecen a tu rostro', heroBody: 'Empieza con el detector gratuito y privado. Si quieres una selección personalizada, continúa con el Asesor de Gafas con IA.',
    overviewTitle: 'Usa la forma del rostro como primer filtro, no como regla final',
    overview: ['La forma del rostro ayuda a reducir un catálogo amplio a varios tipos de montura que merece la pena probar. Combínala con anchura, altura de lente, puente, color y estilo personal.', 'El detector gratuito ofrece un punto de partida privado. El asesor añade razones personalizadas y la prueba virtual permite evaluar la selección sobre tu foto.'],
    workflowTitle: 'Un proceso práctico desde una foto hasta una selección', guideTitle: 'Gafas que conviene probar según la forma del rostro', guideIntro: 'Usa estas recomendaciones como primera selección y comprueba después la escala y el ajuste con la prueba virtual.',
    decisionTitle: 'Cómo tomar la decisión final', decisionIntro: 'Un resultado útil reduce las dudas sin afirmar que una sola regla sobre la forma del rostro lo decide todo.',
    decisionSteps: ['Usa el detector gratuito con una foto frontal clara.', 'Elige dos o tres tipos de montura recomendados.', 'Compara varias gafas sobre tu propia foto.', 'Antes de comprar, comprueba medidas, graduación, comodidad y devoluciones.'],
    pathsTitle: 'Elige el siguiente paso adecuado', pathsIntro: 'Empieza en la etapa que corresponda a lo que ya sabes.',
    pathDetector: 'Descubrir gratis la forma de mi rostro', pathAdvisor: 'Recibir consejos de gafas personalizados', pathGuide: 'Comparar gafas según el rostro', pathTryOn: 'Probar gafas en mi foto', faqTitle: 'Preguntas sobre el asesor de gafas con IA',
    checklistTitle: 'Antes de elegir una montura', checklist: ['Usa la forma del rostro para crear una selección, no para descartar todos los demás estilos.', 'Compara anchura, línea de cejas, altura de lente y separación de las mejillas.', 'Elige una montura equilibrada que siga representando tu estilo.'],
    finalTitle: 'Convierte la búsqueda en una decisión visual', finalBody: 'Descubre gratis la forma de tu rostro, entiende las recomendaciones y compara la selección sobre tu foto.',
  },
  pt: {
    metaTitle: 'Que óculos combinam comigo? Detector de rosto grátis com IA',
    metaDescription: 'Envie uma foto, descubra gratuitamente o formato do rosto e encontre óculos que combinam com você usando orientação de IA ou prova virtual.',
    eyebrow: 'Grátis · Sem login · A foto permanece no navegador',
    title: 'Que óculos combinam comigo? Comece pelo detector de rosto gratuito',
    intro: 'Envie uma foto para descobrir gratuitamente o provável formato do seu rosto e transformar o resultado em uma seleção prática de óculos. Depois, receba orientação personalizada ou teste os estilos virtualmente.',
    articleLabel: 'Guia de óculos e formato de rosto com IA', publishedLabel: 'Publicado em 8 jun 2026 · Atualizado em 27 jul 2026', readTime: '6 min de leitura',
    heroTitle: 'Descubra quais óculos combinam com seu rosto', heroBody: 'Comece pelo detector gratuito e privado. Se quiser uma seleção personalizada, continue para o Consultor de Óculos com IA.',
    overviewTitle: 'Use o formato do rosto como primeiro filtro, não como regra final',
    overview: ['O formato do rosto ajuda a reduzir um catálogo grande a algumas direções de armação que vale a pena testar. Combine-o com largura, altura da lente, ponte, cor e estilo pessoal.', 'O detector gratuito oferece um ponto de partida privado. O consultor acrescenta explicações personalizadas e a prova virtual permite avaliar a seleção na sua foto.'],
    workflowTitle: 'Um caminho prático de uma foto até a seleção', guideTitle: 'Óculos para testar primeiro por formato de rosto', guideIntro: 'Use estas recomendações como seleção inicial e confirme escala e ajuste com a prova virtual.',
    decisionTitle: 'Como tomar a decisão final', decisionIntro: 'Um resultado útil reduz a dúvida sem fingir que uma única regra sobre formato do rosto decide tudo.',
    decisionSteps: ['Use o detector gratuito com uma foto frontal nítida.', 'Escolha duas ou três direções de armação recomendadas.', 'Compare vários óculos na sua própria foto.', 'Antes de comprar, confira medidas, grau, conforto e política de devolução.'],
    pathsTitle: 'Escolha o próximo passo certo', pathsIntro: 'Comece pela etapa que corresponde ao que você já sabe.',
    pathDetector: 'Descobrir meu formato de rosto grátis', pathAdvisor: 'Receber orientação personalizada', pathGuide: 'Comparar óculos por formato de rosto', pathTryOn: 'Provar óculos na minha foto', faqTitle: 'Perguntas sobre o consultor de óculos com IA',
    checklistTitle: 'Antes de escolher uma armação', checklist: ['Use o formato do rosto para criar uma seleção, não para eliminar todos os outros estilos.', 'Compare largura, linha das sobrancelhas, altura das lentes e distância das bochechas.', 'Escolha uma armação equilibrada que continue combinando com seu estilo.'],
    finalTitle: 'Transforme a busca em uma decisão visual', finalBody: 'Descubra gratuitamente o formato do rosto, entenda as recomendações e compare a seleção na sua foto.',
  },
  fr: {
    metaTitle: 'Quelles lunettes me vont ? Détecteur de visage IA gratuit',
    metaDescription: 'Importez une photo, trouvez gratuitement la forme de votre visage et découvrez les lunettes qui vous vont avec un conseil IA ou un essayage virtuel.',
    eyebrow: 'Gratuit · Sans connexion · La photo reste dans le navigateur',
    title: 'Quelles lunettes me vont ? Commencez par le détecteur de visage gratuit',
    intro: 'Importez une photo pour trouver gratuitement la forme probable de votre visage et transformer le résultat en une sélection pratique de lunettes. Poursuivez avec un conseil personnalisé ou testez les styles virtuellement.',
    articleLabel: 'Guide IA des lunettes et formes de visage', publishedLabel: 'Publié le 8 juin 2026 · Mis à jour le 27 juillet 2026', readTime: '6 min de lecture',
    heroTitle: 'Découvrez quelles lunettes conviennent à votre visage', heroBody: 'Commencez par le détecteur gratuit et privé. Pour une sélection personnalisée, poursuivez avec le Conseiller Lunettes IA.',
    overviewTitle: 'Utilisez la forme du visage comme premier filtre, pas comme règle finale',
    overview: ['La forme du visage aide à réduire un grand catalogue à quelques directions de montures utiles. Combinez-la avec la largeur, la hauteur des verres, le pont, la couleur et votre style.', 'Le détecteur gratuit offre un point de départ privé. Le conseiller ajoute des explications personnalisées et l’essayage virtuel permet d’évaluer la sélection sur votre photo.'],
    workflowTitle: 'Un parcours pratique d’une photo à une sélection', guideTitle: 'Lunettes à essayer selon la forme du visage', guideIntro: 'Utilisez ces recommandations comme première sélection, puis vérifiez l’échelle et l’ajustement avec l’essayage virtuel.',
    decisionTitle: 'Comment prendre la décision finale', decisionIntro: 'Un résultat utile réduit l’incertitude sans prétendre qu’une seule règle de forme du visage décide de tout.',
    decisionSteps: ['Utilisez le détecteur gratuit avec une photo nette de face.', 'Choisissez deux ou trois directions de montures recommandées.', 'Comparez plusieurs lunettes sur votre photo.', 'Avant l’achat, vérifiez mesures, correction, confort et conditions de retour.'],
    pathsTitle: 'Choisissez la bonne étape suivante', pathsIntro: 'Commencez à l’étape qui correspond à ce que vous savez déjà.',
    pathDetector: 'Trouver gratuitement la forme de mon visage', pathAdvisor: 'Recevoir un conseil lunettes personnalisé', pathGuide: 'Comparer les lunettes par forme de visage', pathTryOn: 'Essayer des lunettes sur ma photo', faqTitle: 'Questions sur le conseil lunettes par IA',
    checklistTitle: 'Avant de choisir une monture', checklist: ['Utilisez la forme du visage pour créer une sélection, pas pour exclure tous les autres styles.', 'Comparez largeur, ligne des sourcils, hauteur des verres et dégagement des joues.', 'Choisissez une monture équilibrée qui correspond toujours à votre style.'],
    finalTitle: 'Transformez la recherche en décision visuelle', finalBody: 'Trouvez gratuitement la forme de votre visage, comprenez les recommandations et comparez la sélection sur votre photo.',
  },
}

export function getAiGlassesAdvisorArticleCopy(locale: string): AiGlassesAdvisorArticleCopy {
  return copies[isValidLocale(locale) ? locale : defaultLocale]
}
