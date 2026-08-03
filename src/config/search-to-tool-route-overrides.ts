import { defaultLocale, isValidLocale, type Locale } from '@/i18n'
import type { SearchToToolPhaseACopy, SearchToToolPhaseARouteId } from '@/config/search-to-tool-phase-a-locales'

type RouteOverride = Partial<Pick<
  SearchToToolPhaseACopy,
  'steps' | 'principles' | 'faq' | 'faqEyebrow' | 'ctaLabels' | 'howTo' | 'software'
>>

type OverrideRouteId = Extract<
  SearchToToolPhaseARouteId,
  'what-glasses-suit-my-face' | 'virtual-glasses-try-on'
>

const overrides: Record<Locale, Record<OverrideRouteId, RouteOverride>> = {
  en: {
    'what-glasses-suit-my-face': {
      steps: [
        { title: 'Detect your face shape', text: 'Use one clear photo to estimate the proportions that matter most for frame choice.' },
        { title: 'Match frame directions', text: 'Use shape, width, and visual balance to narrow a few styles worth trying.' },
        { title: 'Confirm on your photo', text: 'Validate the shortlist with virtual try-on or side-by-side comparison.' },
      ],
      principles: [
        'Face shape helps narrow options, but it is not the whole decision.',
        'Frame width, lens depth, and bridge position change how a style reads on your face.',
        'A frame that sounds right in theory should still be checked visually on your photo.',
      ],
      faq: [
        { question: 'How do I know what glasses suit my face?', answer: 'Start with face shape and proportions, then narrow frame shapes that create the balance you want. Confirm the final few on your own photo.' },
        { question: 'Do I need to upload a photo?', answer: 'A photo is the most useful way to estimate face shape and validate frame scale. You can still read the guidance first if you are not ready to upload.' },
        { question: 'Is face shape enough to choose glasses?', answer: 'No. Also consider frame width, bridge fit, lens depth, prescription needs, comfort, and your preferred style.' },
      ],
      faqEyebrow: 'From advice to a real choice',
      ctaLabels: { detector: 'Detect my face shape free', advisor: 'Get personalized glasses advice', tryOn: 'Try my shortlist on a photo', compare: 'Compare my top frames' },
      howTo: {
        name: 'How to find glasses that suit your face',
        description: 'Use face shape and proportions to narrow frame directions, then validate the final candidates visually.',
        steps: [
          { name: 'Detect', text: 'Estimate your likely face shape from one clear photo.' },
          { name: 'Match', text: 'Choose frame directions that balance your proportions and preferred look.' },
          { name: 'Confirm', text: 'Try the shortlist on your photo or compare the best candidates side by side.' },
        ],
      },
    },
    'virtual-glasses-try-on': {
      steps: [
        { title: 'Start with your face photo', text: 'Use a clear front-facing image so frame placement is easy to judge.' },
        { title: 'Bring the exact frame image', text: 'Upload a product photo or retailer screenshot of the glasses you are considering.' },
        { title: 'Decide before you buy', text: 'Preview the frame, then compare alternatives when two or more options remain close.' },
      ],
      principles: [
        'Virtual try-on is most useful when you already have a specific product image.',
        'Use it to judge appearance and visual scale, not exact physical fit.',
        'Move to side-by-side comparison when memory is no longer enough to separate candidates.',
      ],
      faq: [
        { question: 'How does virtual glasses try-on work?', answer: 'Upload a clear face photo and an image of the glasses you want to test. VisuTry creates a visual preview on your photo.' },
        { question: 'Can I try glasses from an online store?', answer: 'Yes. You can use a clean product image or retailer screenshot. Confirm exact model, dimensions, and fit details with the seller.' },
        { question: 'What should I do if several frames look good?', answer: 'Use Frame Compare to review the strongest candidates side by side instead of switching back and forth between separate previews.' },
      ],
      faqEyebrow: 'Before you buy',
      ctaLabels: { detector: 'Check my face shape', advisor: 'Get glasses advice', tryOn: 'Start virtual glasses try-on', compare: 'Compare shortlisted frames' },
      software: {
        description: 'Virtual glasses try-on from your own face photo and an exact glasses product image or retailer screenshot.',
        featureList: ['Use your own face photo', 'Upload an exact glasses product image', 'Preview appearance before buying', 'Continue into side-by-side frame comparison'],
      },
    },
  },
  id: {
    'what-glasses-suit-my-face': {
      steps: [{ title: 'Deteksi bentuk wajah', text: 'Gunakan satu foto jelas untuk memperkirakan proporsi yang penting saat memilih frame.' }, { title: 'Cocokkan arah frame', text: 'Gunakan bentuk, lebar, dan keseimbangan visual untuk memilih beberapa gaya.' }, { title: 'Konfirmasi di foto Anda', text: 'Validasi shortlist dengan coba virtual atau perbandingan berdampingan.' }],
      principles: ['Bentuk wajah membantu mempersempit pilihan, tetapi bukan satu-satunya faktor.', 'Lebar frame, kedalaman lensa, dan posisi bridge memengaruhi tampilan.', 'Frame yang cocok secara teori tetap perlu dicek secara visual.'],
      faq: [{ question: 'Bagaimana tahu kacamata yang cocok untuk wajah saya?', answer: 'Mulai dari bentuk dan proporsi wajah, pilih beberapa arah frame, lalu cek kandidat akhir pada foto Anda.' }, { question: 'Apakah saya harus mengunggah foto?', answer: 'Foto paling berguna untuk memperkirakan bentuk wajah dan memeriksa skala frame, tetapi Anda dapat membaca panduannya terlebih dahulu.' }, { question: 'Apakah bentuk wajah saja cukup?', answer: 'Tidak. Pertimbangkan juga lebar frame, bridge, kedalaman lensa, resep, kenyamanan, dan gaya pribadi.' }],
      faqEyebrow: 'Dari saran ke pilihan nyata',
      ctaLabels: { detector: 'Deteksi bentuk wajah gratis', advisor: 'Dapatkan saran personal', tryOn: 'Coba shortlist di foto', compare: 'Bandingkan frame terbaik' },
      howTo: { name: 'Cara menemukan kacamata yang cocok untuk wajah Anda', description: 'Gunakan bentuk dan proporsi wajah untuk mempersempit arah frame, lalu validasi kandidat akhir secara visual.', steps: [{ name: 'Deteksi', text: 'Perkirakan bentuk wajah dari satu foto jelas.' }, { name: 'Cocokkan', text: 'Pilih arah frame yang menyeimbangkan proporsi dan gaya Anda.' }, { name: 'Konfirmasi', text: 'Coba shortlist di foto atau bandingkan kandidat terbaik.' }] },
    },
    'virtual-glasses-try-on': {
      steps: [{ title: 'Mulai dari foto wajah', text: 'Gunakan foto frontal yang jelas agar posisi frame mudah dinilai.' }, { title: 'Tambahkan frame yang tepat', text: 'Unggah foto produk atau screenshot toko dari kacamata yang Anda pertimbangkan.' }, { title: 'Putuskan sebelum membeli', text: 'Lihat pratinjau lalu bandingkan alternatif jika pilihannya masih dekat.' }],
      principles: ['Coba virtual paling berguna untuk produk tertentu yang sudah Anda temukan.', 'Gunakan untuk menilai tampilan dan skala visual, bukan ukuran fisik yang presisi.', 'Gunakan perbandingan saat beberapa kandidat sulit dibedakan dari ingatan.'],
      faq: [{ question: 'Bagaimana cara kerja coba kacamata virtual?', answer: 'Unggah foto wajah dan gambar kacamata yang ingin diuji. VisuTry membuat pratinjau visual pada foto Anda.' }, { question: 'Bisakah mencoba kacamata dari toko online?', answer: 'Ya. Gunakan foto produk atau screenshot yang bersih, lalu konfirmasikan model dan ukuran dengan penjual.' }, { question: 'Bagaimana jika beberapa frame terlihat bagus?', answer: 'Gunakan Frame Compare untuk melihat kandidat terbaik berdampingan.' }],
      faqEyebrow: 'Sebelum membeli',
      ctaLabels: { detector: 'Periksa bentuk wajah', advisor: 'Dapatkan saran', tryOn: 'Mulai coba virtual', compare: 'Bandingkan shortlist' },
      software: { description: 'Coba kacamata virtual dari foto wajah Anda dan gambar produk atau screenshot toko yang spesifik.', featureList: ['Gunakan foto wajah sendiri', 'Unggah gambar produk tertentu', 'Lihat tampilan sebelum membeli', 'Lanjutkan ke perbandingan frame'] },
    },
  },
  ar: {
    'what-glasses-suit-my-face': {
      steps: [{ title: 'اكتشف شكل وجهك', text: 'استخدم صورة واضحة لتقدير النسب المهمة عند اختيار الإطار.' }, { title: 'طابق اتجاهات الإطارات', text: 'استخدم الشكل والعرض والتوازن البصري لاختيار عدد قليل من الأنماط.' }, { title: 'تحقق على صورتك', text: 'تحقق من القائمة بالتجربة الافتراضية أو المقارنة.' }],
      principles: ['شكل الوجه يساعد في تضييق الخيارات لكنه ليس العامل الوحيد.', 'عرض الإطار وعمق العدسة وموضع الجسر تغير المظهر.', 'الإطار المناسب نظريًا يجب التحقق منه بصريًا.'],
      faq: [{ question: 'كيف أعرف أي نظارات تناسب وجهي؟', answer: 'ابدأ بشكل الوجه ونسبه، ثم اختر بعض اتجاهات الإطارات وتحقق من المرشحين على صورتك.' }, { question: 'هل يجب أن أرفع صورة؟', answer: 'الصورة هي الأفضل لتقدير شكل الوجه وفحص حجم الإطار، لكن يمكنك قراءة الإرشاد أولًا.' }, { question: 'هل شكل الوجه وحده كافٍ؟', answer: 'لا. راعِ أيضًا عرض الإطار والجسر وعمق العدسة والوصفة والراحة والأسلوب.' }],
      faqEyebrow: 'من النصيحة إلى الاختيار',
      ctaLabels: { detector: 'اكتشف شكل وجهي مجانًا', advisor: 'احصل على نصيحة شخصية', tryOn: 'جرّب قائمتي على صورة', compare: 'قارن أفضل الإطارات' },
      howTo: { name: 'كيفية العثور على نظارات تناسب وجهك', description: 'استخدم شكل الوجه ونسبه لتقليل اتجاهات الإطارات ثم تحقق من المرشحين بصريًا.', steps: [{ name: 'اكتشف', text: 'قدّر شكل وجهك من صورة واضحة.' }, { name: 'طابق', text: 'اختر إطارات توازن نسبك وأسلوبك.' }, { name: 'تحقق', text: 'جرّب القائمة أو قارن أفضل المرشحين.' }] },
    },
    'virtual-glasses-try-on': {
      steps: [{ title: 'ابدأ بصورة وجهك', text: 'استخدم صورة أمامية واضحة لتقييم موضع الإطار.' }, { title: 'أضف الإطار المحدد', text: 'ارفع صورة المنتج أو لقطة شاشة للنظارات التي تفكر فيها.' }, { title: 'قرر قبل الشراء', text: 'عاين الإطار ثم قارن البدائل إذا بقي أكثر من خيار.' }],
      principles: ['التجربة الافتراضية مفيدة أكثر عندما يكون لديك منتج محدد.', 'استخدمها لتقييم المظهر والحجم البصري لا المقاس الفعلي الدقيق.', 'انتقل للمقارنة عندما يصعب تمييز الخيارات من الذاكرة.'],
      faq: [{ question: 'كيف تعمل تجربة النظارات الافتراضية؟', answer: 'ارفع صورة وجه وصورة النظارات التي تريد اختبارها ليتم إنشاء معاينة على صورتك.' }, { question: 'هل يمكن تجربة نظارات من متجر إلكتروني؟', answer: 'نعم. استخدم صورة منتج أو لقطة شاشة واضحة وتحقق من المقاس والطراز لدى البائع.' }, { question: 'ماذا أفعل إذا بدت عدة إطارات جيدة؟', answer: 'استخدم Frame Compare لرؤية أفضل الخيارات جنبًا إلى جنب.' }],
      faqEyebrow: 'قبل الشراء',
      ctaLabels: { detector: 'تحقق من شكل وجهي', advisor: 'احصل على نصيحة', tryOn: 'ابدأ التجربة الافتراضية', compare: 'قارن القائمة المختصرة' },
      software: { description: 'تجربة نظارات افتراضية من صورة وجهك وصورة منتج محددة أو لقطة شاشة من المتجر.', featureList: ['استخدم صورة وجهك', 'ارفع صورة منتج محدد', 'عاين المظهر قبل الشراء', 'انتقل إلى مقارنة الإطارات'] },
    },
  },
  ru: {
    'what-glasses-suit-my-face': {
      steps: [{ title: 'Определите форму лица', text: 'Используйте чёткое фото, чтобы оценить пропорции, важные при выборе оправы.' }, { title: 'Подберите направления оправ', text: 'Сузьте выбор по форме, ширине и визуальному балансу.' }, { title: 'Проверьте на фото', text: 'Подтвердите список виртуальной примеркой или сравнением.' }],
      principles: ['Форма лица помогает сузить выбор, но не решает всё.', 'Ширина оправы, глубина линз и положение моста меняют восприятие.', 'Теоретически подходящую оправу всё равно стоит проверить визуально.'],
      faq: [{ question: 'Как понять, какие очки мне идут?', answer: 'Начните с формы и пропорций лица, выберите несколько направлений оправ и проверьте финальные варианты на своём фото.' }, { question: 'Нужно ли загружать фото?', answer: 'Фото лучше всего помогает оценить форму лица и масштаб оправы, но сначала можно прочитать рекомендации.' }, { question: 'Достаточно ли формы лица?', answer: 'Нет. Учитывайте ширину, мост, глубину линз, рецепт, комфорт и личный стиль.' }],
      faqEyebrow: 'От совета к выбору',
      ctaLabels: { detector: 'Определить форму бесплатно', advisor: 'Получить персональный совет', tryOn: 'Примерить список на фото', compare: 'Сравнить лучшие оправы' },
      howTo: { name: 'Как найти очки, которые подходят вашему лицу', description: 'Используйте форму и пропорции лица, чтобы сузить выбор, затем проверьте кандидатов визуально.', steps: [{ name: 'Определите', text: 'Оцените форму лица по чёткому фото.' }, { name: 'Подберите', text: 'Выберите направления оправ под ваши пропорции и стиль.' }, { name: 'Проверьте', text: 'Примерьте список или сравните лучшие варианты.' }] },
    },
    'virtual-glasses-try-on': {
      steps: [{ title: 'Начните с фото лица', text: 'Используйте чёткое фото анфас для оценки положения оправы.' }, { title: 'Добавьте точную оправу', text: 'Загрузите фото товара или скриншот выбранных очков.' }, { title: 'Решите до покупки', text: 'Посмотрите результат и сравните альтернативы, если осталось несколько.' }],
      principles: ['Виртуальная примерка особенно полезна для конкретного найденного товара.', 'Оценивайте внешний вид и визуальный масштаб, а точную посадку проверяйте отдельно.', 'Переходите к сравнению, когда кандидатов трудно различать по памяти.'],
      faq: [{ question: 'Как работает виртуальная примерка очков?', answer: 'Загрузите фото лица и изображение очков, чтобы получить визуальный предварительный просмотр.' }, { question: 'Можно примерить очки из интернет-магазина?', answer: 'Да. Используйте чистое фото товара или скриншот и уточняйте модель и размеры у продавца.' }, { question: 'Что делать, если нравятся несколько оправ?', answer: 'Используйте Frame Compare, чтобы увидеть лучшие варианты рядом.' }],
      faqEyebrow: 'Перед покупкой',
      ctaLabels: { detector: 'Проверить форму лица', advisor: 'Получить совет', tryOn: 'Начать виртуальную примерку', compare: 'Сравнить выбранные оправы' },
      software: { description: 'Виртуальная примерка по вашему фото и точному изображению товара или скриншоту магазина.', featureList: ['Использовать своё фото', 'Загрузить конкретный товар', 'Оценить внешний вид до покупки', 'Перейти к сравнению оправ'] },
    },
  },
  de: {
    'what-glasses-suit-my-face': {
      steps: [{ title: 'Gesichtsform erkennen', text: 'Nutze ein klares Foto, um die für die Brillenwahl wichtigen Proportionen einzuschätzen.' }, { title: 'Brillenrichtungen abgleichen', text: 'Grenze mit Form, Breite und visueller Balance einige sinnvolle Stile ein.' }, { title: 'Auf deinem Foto bestätigen', text: 'Prüfe die Auswahl per virtueller Anprobe oder Direktvergleich.' }],
      principles: ['Gesichtsform grenzt ein, entscheidet aber nicht allein.', 'Rahmenbreite, Glastiefe und Stegposition verändern die Wirkung.', 'Eine theoretisch passende Brille sollte visuell geprüft werden.'],
      faq: [{ question: 'Wie erkenne ich, welche Brille zu meinem Gesicht passt?', answer: 'Beginne mit Form und Proportionen, grenze einige Rahmenrichtungen ein und prüfe die letzten Kandidaten auf deinem Foto.' }, { question: 'Muss ich ein Foto hochladen?', answer: 'Ein Foto ist am hilfreichsten für Gesichtsform und Rahmengröße, aber du kannst die Hinweise zuerst lesen.' }, { question: 'Reicht die Gesichtsform aus?', answer: 'Nein. Beachte auch Breite, Steg, Glastiefe, Sehstärke, Komfort und persönlichen Stil.' }],
      faqEyebrow: 'Von der Beratung zur Wahl',
      ctaLabels: { detector: 'Gesichtsform kostenlos erkennen', advisor: 'Personalisierte Beratung erhalten', tryOn: 'Auswahl auf Foto testen', compare: 'Top-Brillen vergleichen' },
      howTo: { name: 'So findest du Brillen, die zu deinem Gesicht passen', description: 'Nutze Form und Proportionen, um Brillenrichtungen einzugrenzen, und prüfe die Kandidaten anschließend visuell.', steps: [{ name: 'Erkennen', text: 'Schätze deine Gesichtsform aus einem klaren Foto.' }, { name: 'Abgleichen', text: 'Wähle Brillenrichtungen passend zu Proportionen und Stil.' }, { name: 'Bestätigen', text: 'Teste die Auswahl oder vergleiche die besten Kandidaten.' }] },
    },
    'virtual-glasses-try-on': {
      steps: [{ title: 'Mit deinem Gesichtsbild starten', text: 'Nutze ein klares frontales Foto, um die Rahmenposition gut zu beurteilen.' }, { title: 'Die konkrete Brille hinzufügen', text: 'Lade ein Produktfoto oder einen Händler-Screenshot der gewünschten Brille hoch.' }, { title: 'Vor dem Kauf entscheiden', text: 'Prüfe die Vorschau und vergleiche Alternativen, wenn mehrere übrig bleiben.' }],
      principles: ['Virtuelle Anprobe ist besonders nützlich für ein konkretes Produkt.', 'Beurteile Aussehen und visuellen Maßstab; die physische Passform separat.', 'Nutze Vergleich, wenn mehrere Kandidaten aus der Erinnerung schwer zu unterscheiden sind.'],
      faq: [{ question: 'Wie funktioniert virtuelle Brillenanprobe?', answer: 'Lade ein Gesichtsbild und das Bild der gewünschten Brille hoch, um eine Vorschau auf deinem Foto zu erhalten.' }, { question: 'Kann ich Brillen aus einem Online-Shop testen?', answer: 'Ja. Nutze ein sauberes Produktbild oder einen Screenshot und bestätige Modell und Maße beim Händler.' }, { question: 'Was, wenn mehrere Brillen gut aussehen?', answer: 'Nutze Frame Compare, um die stärksten Kandidaten direkt nebeneinander zu sehen.' }],
      faqEyebrow: 'Vor dem Kauf',
      ctaLabels: { detector: 'Gesichtsform prüfen', advisor: 'Brillenberatung erhalten', tryOn: 'Virtuelle Anprobe starten', compare: 'Ausgewählte Brillen vergleichen' },
      software: { description: 'Virtuelle Brillenanprobe mit deinem Gesichtsbild und einem konkreten Produktfoto oder Händler-Screenshot.', featureList: ['Eigenes Gesichtsbild verwenden', 'Konkretes Produktbild hochladen', 'Aussehen vor dem Kauf prüfen', 'Zum Brillenvergleich wechseln'] },
    },
  },
  ja: {
    'what-glasses-suit-my-face': {
      steps: [{ title: '顔型を確認する', text: '正面写真から、フレーム選びで重要な顔の比率を確認します。' }, { title: '似合う方向を絞る', text: '形、幅、バランスから試す価値のあるスタイルを絞ります。' }, { title: '自分の写真で確認する', text: 'バーチャル試着や並列比較で最終候補を確認します。' }],
      principles: ['顔型は候補を絞る材料であり、唯一の判断基準ではありません。', 'フレーム幅、レンズの深さ、ブリッジ位置でも印象は変わります。', '理論上似合うフレームでも、自分の写真で確認することが重要です。'],
      faq: [{ question: '自分に似合うメガネはどう分かりますか？', answer: '顔型と比率から候補を絞り、最後の数本を自分の写真で確認すると判断しやすくなります。' }, { question: '写真のアップロードは必要ですか？', answer: '顔型やフレームのサイズ感を確認するには写真が最も役立ちますが、先にガイドだけ読むこともできます。' }, { question: '顔型だけで選んでよいですか？', answer: 'いいえ。幅、ブリッジ、レンズの深さ、度数、快適さ、好みも考慮してください。' }],
      faqEyebrow: '提案から実際の選択へ',
      ctaLabels: { detector: '無料で顔型を診断', advisor: 'パーソナル提案を見る', tryOn: '候補を写真で試着', compare: '上位フレームを比較' },
      howTo: { name: '自分の顔に似合うメガネの探し方', description: '顔型と比率から候補を絞り、最後に写真で見た目を確認します。', steps: [{ name: '診断', text: '正面写真から顔型を推定します。' }, { name: '絞り込み', text: '比率と好みに合うフレーム方向を選びます。' }, { name: '確認', text: '候補を試着するか、上位候補を並べて比較します。' }] },
    },
    'virtual-glasses-try-on': {
      steps: [{ title: '顔写真から始める', text: 'フレーム位置を確認しやすい明るい正面写真を使います。' }, { title: '試したい商品画像を追加', text: '検討中のメガネの商品写真やショップのスクリーンショットをアップロードします。' }, { title: '購入前に判断する', text: '見た目を確認し、候補が複数なら並べて比較します。' }],
      principles: ['バーチャル試着は、具体的な商品画像があるときに特に有効です。', '見た目と視覚的なサイズ感の確認に使い、実際のフィットは別途確認します。', '候補を記憶だけで比べにくくなったら並列比較を使います。'],
      faq: [{ question: 'メガネのバーチャル試着はどう使いますか？', answer: '顔写真と試したいメガネ画像をアップロードすると、自分の写真上で見た目を確認できます。' }, { question: 'オンラインショップのメガネも試せますか？', answer: 'はい。きれいな商品画像やスクリーンショットを使い、正確な型番とサイズは販売店で確認してください。' }, { question: '複数のフレームが良く見える場合は？', answer: 'Frame Compareで上位候補を並べて確認すると判断しやすくなります。' }],
      faqEyebrow: '購入前に確認',
      ctaLabels: { detector: '顔型を確認', advisor: 'メガネ提案を見る', tryOn: 'バーチャル試着を始める', compare: '候補フレームを比較' },
      software: { description: '自分の顔写真と、具体的な商品画像やショップのスクリーンショットを使うメガネのバーチャル試着。', featureList: ['自分の顔写真を使用', '具体的な商品画像をアップロード', '購入前に見た目を確認', 'フレーム比較へ進む'] },
    },
  },
  es: {
    'what-glasses-suit-my-face': {
      steps: [{ title: 'Detecta tu forma facial', text: 'Usa una foto clara para estimar las proporciones relevantes al elegir montura.' }, { title: 'Relaciona direcciones de montura', text: 'Reduce estilos por forma, anchura y equilibrio visual.' }, { title: 'Confirma en tu foto', text: 'Valida la selección con prueba virtual o comparación lado a lado.' }],
      principles: ['La forma facial ayuda a reducir opciones, pero no decide por sí sola.', 'El ancho, la profundidad de lente y la posición del puente cambian el resultado.', 'Una montura que parece adecuada en teoría debe comprobarse visualmente.'],
      faq: [{ question: '¿Cómo sé qué gafas me quedan bien?', answer: 'Empieza por forma y proporciones, reduce algunas direcciones y comprueba los candidatos finales en tu foto.' }, { question: '¿Tengo que subir una foto?', answer: 'Una foto es la mejor forma de estimar la forma facial y la escala, aunque puedes leer primero la guía.' }, { question: '¿Basta con la forma de la cara?', answer: 'No. Considera también ancho, puente, profundidad de lente, graduación, comodidad y estilo.' }],
      faqEyebrow: 'Del consejo a la elección',
      ctaLabels: { detector: 'Detectar mi forma gratis', advisor: 'Obtener consejo personalizado', tryOn: 'Probar mi selección en foto', compare: 'Comparar mis mejores monturas' },
      howTo: { name: 'Cómo encontrar gafas que favorezcan tu cara', description: 'Usa forma y proporciones para reducir monturas y valida los candidatos finales visualmente.', steps: [{ name: 'Detectar', text: 'Estima tu forma facial con una foto clara.' }, { name: 'Relacionar', text: 'Elige direcciones que equilibren proporciones y estilo.' }, { name: 'Confirmar', text: 'Prueba la selección o compara los mejores candidatos.' }] },
    },
    'virtual-glasses-try-on': {
      steps: [{ title: 'Empieza con tu foto', text: 'Usa una imagen frontal clara para valorar la posición de la montura.' }, { title: 'Añade la montura exacta', text: 'Sube una foto de producto o captura de la tienda de las gafas que consideras.' }, { title: 'Decide antes de comprar', text: 'Mira la vista previa y compara alternativas si quedan varias.' }],
      principles: ['La prueba virtual es especialmente útil cuando ya tienes un producto concreto.', 'Úsala para valorar aspecto y escala visual, no el ajuste físico exacto.', 'Pasa a comparación cuando la memoria ya no baste para distinguir candidatos.'],
      faq: [{ question: '¿Cómo funciona la prueba virtual de gafas?', answer: 'Sube una foto de tu cara y una imagen de las gafas para generar una vista previa visual.' }, { question: '¿Puedo probar gafas de una tienda online?', answer: 'Sí. Usa una foto de producto o captura limpia y confirma modelo y medidas con el vendedor.' }, { question: '¿Qué hago si varias monturas se ven bien?', answer: 'Usa Frame Compare para ver las mejores candidatas lado a lado.' }],
      faqEyebrow: 'Antes de comprar',
      ctaLabels: { detector: 'Comprobar mi forma facial', advisor: 'Obtener consejo', tryOn: 'Iniciar prueba virtual', compare: 'Comparar monturas seleccionadas' },
      software: { description: 'Prueba virtual desde tu foto y una imagen exacta de producto o captura de tienda.', featureList: ['Usar tu foto facial', 'Subir un producto concreto', 'Ver el aspecto antes de comprar', 'Continuar a comparación'] },
    },
  },
  pt: {
    'what-glasses-suit-my-face': {
      steps: [{ title: 'Detecte o formato do rosto', text: 'Use uma foto nítida para estimar as proporções importantes na escolha da armação.' }, { title: 'Relacione direções de armação', text: 'Reduza estilos por formato, largura e equilíbrio visual.' }, { title: 'Confirme na sua foto', text: 'Valide a seleção com prova virtual ou comparação lado a lado.' }],
      principles: ['O formato do rosto ajuda a reduzir opções, mas não decide sozinho.', 'Largura, profundidade da lente e posição da ponte mudam o resultado.', 'Uma armação adequada na teoria ainda deve ser conferida visualmente.'],
      faq: [{ question: 'Como saber quais óculos combinam comigo?', answer: 'Comece por formato e proporções, reduza algumas direções e confira os candidatos finais na sua foto.' }, { question: 'Preciso enviar uma foto?', answer: 'A foto é a melhor forma de estimar o formato e a escala da armação, mas você pode ler o guia antes.' }, { question: 'Só o formato do rosto é suficiente?', answer: 'Não. Considere também largura, ponte, profundidade da lente, grau, conforto e estilo.' }],
      faqEyebrow: 'Da orientação à escolha',
      ctaLabels: { detector: 'Detectar meu rosto grátis', advisor: 'Receber orientação personalizada', tryOn: 'Provar minha seleção na foto', compare: 'Comparar minhas melhores armações' },
      howTo: { name: 'Como encontrar óculos que combinam com seu rosto', description: 'Use formato e proporções para reduzir direções de armação e valide os candidatos finais visualmente.', steps: [{ name: 'Detectar', text: 'Estime o formato do rosto com uma foto nítida.' }, { name: 'Relacionar', text: 'Escolha direções que equilibrem proporções e estilo.' }, { name: 'Confirmar', text: 'Prove a seleção ou compare os melhores candidatos.' }] },
    },
    'virtual-glasses-try-on': {
      steps: [{ title: 'Comece com sua foto', text: 'Use uma imagem frontal nítida para avaliar a posição da armação.' }, { title: 'Adicione a armação exata', text: 'Envie foto do produto ou captura da loja dos óculos que está considerando.' }, { title: 'Decida antes da compra', text: 'Veja a prévia e compare alternativas se restarem várias opções.' }],
      principles: ['A prova virtual é especialmente útil quando você já tem um produto específico.', 'Use para avaliar aparência e escala visual, não o ajuste físico exato.', 'Passe à comparação quando a memória não for suficiente para distinguir candidatos.'],
      faq: [{ question: 'Como funciona a prova virtual de óculos?', answer: 'Envie uma foto do rosto e uma imagem dos óculos para gerar uma prévia visual.' }, { question: 'Posso provar óculos de uma loja online?', answer: 'Sim. Use uma foto de produto ou captura limpa e confirme modelo e medidas com o vendedor.' }, { question: 'O que fazer se várias armações ficarem boas?', answer: 'Use Frame Compare para ver as melhores candidatas lado a lado.' }],
      faqEyebrow: 'Antes da compra',
      ctaLabels: { detector: 'Verificar formato do rosto', advisor: 'Receber orientação', tryOn: 'Iniciar prova virtual', compare: 'Comparar armações selecionadas' },
      software: { description: 'Prova virtual usando sua foto e uma imagem exata de produto ou captura de loja.', featureList: ['Usar sua foto facial', 'Enviar um produto específico', 'Ver o resultado antes da compra', 'Continuar para comparação'] },
    },
  },
  fr: {
    'what-glasses-suit-my-face': {
      steps: [{ title: 'Détecter la forme du visage', text: 'Utilisez une photo nette pour estimer les proportions utiles au choix de monture.' }, { title: 'Associer des directions de montures', text: 'Réduisez les styles selon la forme, la largeur et l’équilibre visuel.' }, { title: 'Confirmer sur votre photo', text: 'Validez la sélection par essayage virtuel ou comparaison.' }],
      principles: ['La forme du visage aide à réduire les choix mais ne décide pas seule.', 'Largeur, profondeur des verres et position du pont modifient le rendu.', 'Une monture pertinente en théorie doit encore être vérifiée visuellement.'],
      faq: [{ question: 'Comment savoir quelles lunettes me vont ?', answer: 'Commencez par la forme et les proportions, réduisez quelques directions puis vérifiez les candidats finaux sur votre photo.' }, { question: 'Dois-je importer une photo ?', answer: 'Une photo est la meilleure façon d’estimer la forme et l’échelle, mais vous pouvez lire le guide avant.' }, { question: 'La forme du visage suffit-elle ?', answer: 'Non. Tenez aussi compte de la largeur, du pont, de la profondeur des verres, de la correction, du confort et du style.' }],
      faqEyebrow: 'Du conseil au choix',
      ctaLabels: { detector: 'Détecter ma forme gratuitement', advisor: 'Obtenir des conseils personnalisés', tryOn: 'Essayer ma sélection sur photo', compare: 'Comparer mes meilleures montures' },
      howTo: { name: 'Comment trouver des lunettes qui vont à votre visage', description: 'Utilisez forme et proportions pour réduire les directions de montures puis validez visuellement les candidats finaux.', steps: [{ name: 'Détecter', text: 'Estimez la forme du visage avec une photo nette.' }, { name: 'Associer', text: 'Choisissez des directions qui équilibrent proportions et style.' }, { name: 'Confirmer', text: 'Essayez la sélection ou comparez les meilleurs candidats.' }] },
    },
    'virtual-glasses-try-on': {
      steps: [{ title: 'Commencer par votre photo', text: 'Utilisez une photo de face nette pour juger la position de la monture.' }, { title: 'Ajouter la monture exacte', text: 'Importez une photo produit ou une capture de la boutique pour les lunettes envisagées.' }, { title: 'Décider avant achat', text: 'Vérifiez le rendu puis comparez les alternatives s’il en reste plusieurs.' }],
      principles: ['L’essayage virtuel est particulièrement utile pour un produit précis.', 'Utilisez-le pour juger l’apparence et l’échelle visuelle, pas l’ajustement physique exact.', 'Passez à la comparaison lorsque la mémoire ne suffit plus à distinguer les candidats.'],
      faq: [{ question: 'Comment fonctionne l’essayage virtuel de lunettes ?', answer: 'Importez une photo de visage et une image des lunettes pour générer un aperçu visuel.' }, { question: 'Puis-je essayer des lunettes d’une boutique en ligne ?', answer: 'Oui. Utilisez une photo produit ou une capture propre et confirmez modèle et dimensions auprès du vendeur.' }, { question: 'Que faire si plusieurs montures sont réussies ?', answer: 'Utilisez Frame Compare pour voir les meilleures candidates côte à côte.' }],
      faqEyebrow: 'Avant achat',
      ctaLabels: { detector: 'Vérifier ma forme de visage', advisor: 'Obtenir des conseils', tryOn: 'Commencer l’essayage virtuel', compare: 'Comparer les montures sélectionnées' },
      software: { description: 'Essayage virtuel à partir de votre photo et d’une image produit précise ou d’une capture de boutique.', featureList: ['Utiliser votre photo de visage', 'Importer un produit précis', 'Voir le rendu avant achat', 'Continuer vers la comparaison'] },
    },
  },
}

export function getSearchToToolRouteOverride(locale: string, routeId: SearchToToolPhaseARouteId): RouteOverride {
  if (routeId !== 'what-glasses-suit-my-face' && routeId !== 'virtual-glasses-try-on') return {}
  const resolved = isValidLocale(locale) ? locale : defaultLocale
  return overrides[resolved][routeId]
}
