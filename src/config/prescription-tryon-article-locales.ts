import type { Locale } from '@/i18n'

/**
 * Genuine, task-complete editorial translations for one existing article.
 * A localized shell does not count as translated publication content.
 * See SEO/GEO P1 Issue #538.
 */
export type PrescriptionTryOnArticleCopy = {
  language: string
  title: string
  description: string
  category: string
  readTime: string
  imageAlt: string
  imageCaption: string
  publishedPrefix: string
  publishedLabel: string
  updatedPrefix: string
  updatedLabel: string
  startHeading: string
  startP1: string
  startP2: string
  creditNote: string
  tryOnCta: string
  compareHeading: string
  compareP: string
  previewHeading: string
  previewP: string
  previewBefore: string
  previewLink: string
  previewAfter: string
  fitHeading: string
  fitP: string
  nextBefore: string
  checklistLink: string
  nextBetween: string
  widthLink: string
  nextAfter: string
}

export const PRESCRIPTION_TRYON_PUBLISHED_LOCALES = ['en', 'id', 'ar', 'ru', 'de', 'ja', 'es', 'pt', 'fr'] as const satisfies readonly Locale[]

const copies: Record<(typeof PRESCRIPTION_TRYON_PUBLISHED_LOCALES)[number], PrescriptionTryOnArticleCopy> = {
  "en": {
    "language": "en",
    "title": "How to Try On Prescription Glasses From a Photo",
    "description": "Compare two frame styles using your portrait and a product image, then check the measurements and lens options with the seller.",
    "category": "Virtual Try-On",
    "readTime": "3 min read",
    "imageAlt": "Example showing a portrait, a front-facing glasses image and a visual try-on preview.",
    "imageCaption": "VisuTry example showing the portrait, frame photo and resulting appearance preview.",
    "publishedPrefix": "Published",
    "publishedLabel": "November 4, 2025",
    "updatedPrefix": "Updated",
    "updatedLabel": "November 16, 2026",
    "startHeading": "Start with the two photos",
    "startP1": "Have a frame in mind from an online store? Save its product link and find the front view in the color you are considering. Keep both rims and hinges in the crop. A side view or a screenshot of a model wearing the frame can hide the outline you want to compare.",
    "startP2": "Take one straight-on portrait in even light, with your face uncovered and your current glasses off. In VisuTry, upload the portrait and add the product photo as a custom frame. Use the same portrait for a second frame so a change in your pose does not decide the comparison.",
    "creditNote": "Generating a custom AI Try-On preview requires signing in and using an available credit. The free Face Shape Detector is a separate, on-device tool.",
    "tryOnCta": "Try a frame on your photo",
    "compareHeading": "Compare the shape, then the color",
    "compareP": "If you are choosing between a deep square frame and a narrow oval, look first at how much of your cheeks each outline covers and how the top edge follows your brows. When comparing two colors of the same model, keep the shape and size fixed. Check the seller’s photos under different lighting before choosing a finish.",
    "previewHeading": "What your visual preview actually demonstrates",
    "previewP": "A saved AI preview compares the appearance of a particular frame image under the same portrait and lighting. Record the seller’s model name, color and printed lens/bridge/temple numbers alongside the image: VisuTry does not verify those seller details or measure exact fit from a photograph.",
    "previewBefore": "If you want to explore frame silhouettes rather than a store’s exact model,",
    "previewLink": "Frame Compare",
    "previewAfter": "uses built-in preset looks. That is a separate workflow from the exact-image Try-On above.",
    "fitHeading": "Check the physical frame before ordering",
    "fitP": "A photo preview can help you shortlist a look. It cannot measure bridge pressure, temple length or lens position. Find the exact model and size on the seller’s listing, compare the measurements with a comfortable pair, and ask the seller or your optician about your prescription and lens options. If two sizes share the same product image, the preview alone gives you no way to choose between them.",
    "nextBefore": "For the next step, use the",
    "checklistLink": "prescription glasses order checklist (English)",
    "nextBetween": "or check",
    "widthLink": "how to compare frame widths",
    "nextAfter": "."
  },
  "es": {
    "language": "es",
    "title": "Cómo probarte gafas graduadas con una foto",
    "description": "Compara dos monturas en la misma foto de tu rostro y con imágenes de producto; antes de comprar, comprueba las medidas y las opciones de lentes con la óptica.",
    "category": "Prueba virtual",
    "readTime": "3 min de lectura",
    "imageAlt": "Ejemplo con una foto del rostro, una imagen frontal de la montura y una vista previa de la prueba virtual.",
    "imageCaption": "Ejemplo de VisuTry: foto del rostro, imagen de la montura y resultado visual de la prueba virtual.",
    "publishedPrefix": "Publicado el",
    "publishedLabel": "4 de noviembre de 2025",
    "updatedPrefix": "Actualizado el",
    "updatedLabel": "16 de noviembre de 2026",
    "startHeading": "Empieza con dos fotos",
    "startP1": "¿Ya tienes una montura en mente de una tienda online? Guarda el enlace del producto y busca una foto frontal del color que te interesa. La imagen debe mostrar los dos aros y las bisagras. Una vista lateral o una foto de una modelo con las gafas puestas puede ocultar la forma que quieres comparar.",
    "startP2": "Hazte una foto de frente, con luz uniforme, la cara despejada y sin tus gafas actuales. En VisuTry, sube ese retrato y añade la imagen del producto como montura personalizada. Para probar una segunda montura, utiliza el mismo retrato: así podrás comparar las gafas sin que influya un cambio de postura.",
    "creditNote": "Para generar una prueba virtual personalizada con IA necesitas iniciar sesión y disponer de un crédito. El detector gratuito de forma de rostro es una herramienta diferente que funciona en tu navegador.",
    "tryOnCta": "Probar una montura en mi foto",
    "compareHeading": "Compara primero la forma y después el color",
    "compareP": "Si estás eligiendo entre una montura cuadrada y profunda y otra ovalada y estrecha, fíjate primero en cuánto cubren las mejillas y cómo sigue el borde superior la línea de las cejas. Al comparar dos colores del mismo modelo, mantén iguales la forma y la talla. Revisa también las fotos del vendedor con distintas iluminaciones antes de decidir el acabado.",
    "previewHeading": "Qué muestra realmente la prueba virtual",
    "previewP": "Una imagen generada por IA permite comparar cómo se ve una montura concreta sobre el mismo retrato y con una iluminación similar. Anota junto a la imagen el modelo, el color y las cifras de ancho de lente, puente y longitud de varilla que publica el vendedor. VisuTry no verifica esos datos ni puede medir el ajuste físico exacto a partir de una foto.",
    "previewBefore": "Si prefieres explorar formas de monturas en lugar de un modelo concreto de una tienda,",
    "previewLink": "Comparar monturas",
    "previewAfter": "genera estilos predefinidos incluidos en la herramienta. Es un proceso distinto de la prueba virtual con la imagen exacta de un producto.",
    "fitHeading": "Comprueba el ajuste físico antes de comprar",
    "fitP": "La prueba con foto ayuda a reducir las opciones, pero no mide la presión en el puente de la nariz, la longitud de las varillas ni la posición de las lentes. Busca el modelo y la talla exactos en la ficha del vendedor, compara las medidas con unas gafas que ya te resulten cómodas y consulta las opciones de graduación y lentes con la óptica. Si dos tallas utilizan la misma foto de producto, la vista previa no permite distinguir cuál te quedará mejor.",
    "nextBefore": "Como siguiente paso, consulta la",
    "checklistLink": "lista de comprobación para comprar gafas graduadas (en inglés)",
    "nextBetween": "o aprende",
    "widthLink": "a comparar las medidas de las monturas",
    "nextAfter": "."
  },
  "fr": {
    "language": "fr",
    "title": "Essayer des lunettes de vue à partir d’une photo",
    "description": "Comparez deux montures sur la même photo de votre visage et à l’aide d’images produit, puis vérifiez les dimensions et les options de verres auprès du vendeur.",
    "category": "Essayage virtuel",
    "readTime": "3 min de lecture",
    "imageAlt": "Exemple montrant un portrait, une image de face d’une monture et un aperçu d’essayage virtuel.",
    "imageCaption": "Exemple VisuTry : portrait, photo de la monture et résultat visuel de l’essayage.",
    "publishedPrefix": "Publié le",
    "publishedLabel": "4 novembre 2025",
    "updatedPrefix": "Mis à jour le",
    "updatedLabel": "16 novembre 2026",
    "startHeading": "Commencez par deux photos",
    "startP1": "Vous avez repéré une monture dans une boutique en ligne ? Conservez le lien du produit et cherchez une vue de face dans la couleur qui vous intéresse. Le cadrage doit montrer les deux cercles et les charnières. Une vue de profil ou une photo d’un mannequin portant la monture peut masquer la forme que vous souhaitez comparer.",
    "startP2": "Prenez un portrait de face, avec un éclairage uniforme, le visage dégagé et sans vos lunettes habituelles. Dans VisuTry, importez ce portrait puis ajoutez la photo du produit comme monture personnalisée. Utilisez exactement le même portrait pour essayer une deuxième monture : un changement de pose ne faussera pas la comparaison.",
    "creditNote": "Pour générer un essayage virtuel personnalisé par IA, vous devez vous connecter et disposer d’un crédit. Le détecteur gratuit de forme de visage est un outil distinct qui fonctionne dans votre navigateur.",
    "tryOnCta": "Essayer une monture sur ma photo",
    "compareHeading": "Comparez d’abord la forme, puis la couleur",
    "compareP": "Si vous hésitez entre une monture carrée assez haute et une monture ovale plus étroite, observez d’abord la partie des joues couverte par chacune et la façon dont la ligne supérieure suit vos sourcils. Pour comparer deux couleurs d’un même modèle, gardez la forme et la taille identiques. Regardez également les photos du vendeur sous différents éclairages avant de choisir la finition.",
    "previewHeading": "Ce que montre réellement l’aperçu virtuel",
    "previewP": "L’image générée par IA vous aide à comparer l’apparence d’une monture précise sur le même portrait et sous un éclairage similaire. Notez à côté de l’image la référence du modèle, la couleur et les dimensions indiquées par le vendeur (largeur des verres, pont et longueur des branches). VisuTry ne vérifie pas ces informations et ne mesure pas l’ajustement exact à partir d’une photo.",
    "previewBefore": "Si vous souhaitez explorer des silhouettes plutôt qu’un modèle précis proposé par une boutique,",
    "previewLink": "Comparer les montures",
    "previewAfter": "utilise des styles prédéfinis intégrés. C’est un parcours distinct de l’essayage virtuel à partir de la photo d’un produit précis.",
    "fitHeading": "Vérifiez l’ajustement réel avant de commander",
    "fitP": "Un aperçu sur photo permet de présélectionner une monture, mais il ne mesure ni la pression sur le nez, ni la longueur des branches, ni la position des verres. Vérifiez la référence et la taille exactes sur la fiche du vendeur, comparez les dimensions à celles de lunettes confortables et demandez conseil à votre opticien pour l’ordonnance et les options de verres. Si deux tailles utilisent la même photo commerciale, l’aperçu ne peut pas vous aider à choisir entre elles.",
    "nextBefore": "Pour poursuivre, consultez la",
    "checklistLink": "liste de vérification pour commander des lunettes de vue (en anglais)",
    "nextBetween": "ou apprenez",
    "widthLink": "à comparer les dimensions des montures",
    "nextAfter": "."
  },
  "ru": {
    "language": "ru",
    "title": "Как примерить очки с диоптриями по фотографии",
    "description": "Сравните две оправы на одном портрете, используя фотографии товаров, а перед заказом проверьте размеры оправы и варианты линз у продавца.",
    "category": "Виртуальная примерка",
    "readTime": "3 мин чтения",
    "imageAlt": "Пример: портрет, фотография оправы спереди и результат виртуальной примерки.",
    "imageCaption": "Пример VisuTry: портрет, фото оправы и предварительный результат примерки.",
    "publishedPrefix": "Опубликовано",
    "publishedLabel": "4 ноября 2025 г.",
    "updatedPrefix": "Обновлено",
    "updatedLabel": "16 ноября 2026 г.",
    "startHeading": "Подготовьте две фотографии",
    "startP1": "Нашли оправу в интернет-магазине? Сохраните ссылку на товар и найдите фотографию выбранного цвета строго спереди. На снимке должны быть видны оба ободка и крепления дужек. Вид сбоку или фотография человека в очках могут скрыть контур, который нужно сравнить.",
    "startP2": "Сделайте портрет анфас при ровном освещении, уберите волосы с лица и снимите свои очки. В VisuTry загрузите портрет и добавьте фото товара как собственную оправу. Для сравнения со второй моделью используйте тот же портрет: изменение позы не должно влиять на выбор.",
    "creditNote": "Для генерации персонального изображения с ИИ нужно войти в аккаунт и иметь доступный кредит. Бесплатное определение формы лица — отдельный инструмент, работающий прямо в браузере.",
    "tryOnCta": "Примерить оправу на своём фото",
    "compareHeading": "Сначала сравните форму, затем цвет",
    "compareP": "Если выбираете между высокой квадратной оправой и узкой овальной, посмотрите, какую часть щёк закрывают линзы и как верхняя линия соотносится с бровями. Сравнивая два цвета одной модели, не меняйте форму и размер. Посмотрите фото продавца при разном освещении, прежде чем выбирать покрытие.",
    "previewHeading": "Что на самом деле показывает виртуальная примерка",
    "previewP": "Изображение, созданное ИИ, помогает оценить внешний вид конкретной оправы на одном портрете при похожем освещении. Запишите модель, цвет и указанные продавцом размеры линзы, моста и дужки. VisuTry не проверяет сведения магазина и не может измерить точную посадку очков по фотографии.",
    "previewBefore": "Если хотите изучить формы, а не конкретную модель магазина,",
    "previewLink": "Сравнение оправ",
    "previewAfter": "позволяет посмотреть встроенные варианты. Это другой сценарий, чем примерка по фотографии определённого товара.",
    "fitHeading": "Проверьте настоящую посадку перед покупкой",
    "fitP": "Примерка на фото помогает сократить список вариантов, но не измеряет давление на переносицу, длину дужек и положение линз. Найдите точную модель и размер у продавца, сравните цифры с удобной парой и обсудите рецепт и линзы с оптиком. Если два размера показаны одной фотографией товара, по превью нельзя определить, какой подойдёт.",
    "nextBefore": "Для следующего шага откройте",
    "checklistLink": "список проверки заказа очков с диоптриями (на английском)",
    "nextBetween": "или узнайте,",
    "widthLink": "как сравнивать ширину оправы",
    "nextAfter": "."
  },
  "ja": {
    "language": "ja",
    "title": "写真から度付きメガネをバーチャル試着する方法",
    "description": "顔写真と商品写真を使って2つのフレームを比較。購入前には販売店で寸法とレンズの選択肢を確認しましょう。",
    "category": "バーチャル試着",
    "readTime": "約3分",
    "imageAlt": "顔写真、正面から撮ったメガネの商品画像、試着プレビューの例。",
    "imageCaption": "VisuTryで使う顔写真、フレーム画像、試着後の見え方の例。",
    "publishedPrefix": "公開",
    "publishedLabel": "2025年11月4日",
    "updatedPrefix": "更新",
    "updatedLabel": "2026年11月16日",
    "startHeading": "まず2枚の写真を用意する",
    "startP1": "ネットショップで気になるフレームを見つけたら、商品ページのリンクを保存し、希望のカラーを正面から撮った画像を探しましょう。左右のリムと丁番が見える画像が適しています。横顔の写真やモデルの着用写真では、比較したいフレームの輪郭が隠れることがあります。",
    "startP2": "明るさが均一な場所で、髪で顔を隠さず、今のメガネを外して正面から顔写真を撮ります。VisuTryに顔写真をアップロードし、商品画像をカスタムフレームとして追加してください。2本目も同じ顔写真で試せば、顔の角度による見え方の差を減らせます。",
    "creditNote": "AIでカスタム試着画像を生成するには、ログインと利用可能なクレジットが必要です。無料の顔型診断は別機能で、ブラウザー内で処理されます。",
    "tryOnCta": "自分の写真でフレームを試す",
    "compareHeading": "形を比べてから色を選ぶ",
    "compareP": "深めのスクエア型と細長いオーバル型で迷うなら、頬の見える面積や、上側のリムが眉に沿う位置を比べます。同じ型の色違いを試すときは、形とサイズをそろえてください。仕上げの質感は、販売店の複数の照明条件で撮った写真も確認しましょう。",
    "previewHeading": "試着画像でわかること・わからないこと",
    "previewP": "AIによる試着プレビューは、同じ顔写真と似た照明条件で、特定のフレーム画像がどう見えるかを比較するものです。商品名、色、レンズ幅・ブリッジ幅・テンプル長などの記載値を控えてください。VisuTryが販売店の情報を検証するわけではなく、写真だけで実際のフィット感を測定することもできません。",
    "previewBefore": "店舗の特定の商品ではなく、フレームの形を幅広く比べたい場合は、",
    "previewLink": "フレーム比較",
    "previewAfter": "で内蔵されたスタイルを試せます。商品画像を使うカスタム試着とは別の機能です。",
    "fitHeading": "注文前に実物のサイズと掛け心地を確認",
    "fitP": "写真での試着は候補を絞る助けになりますが、鼻にかかる圧力、テンプルの長さ、レンズの位置までは測れません。販売店で正確な型番とサイズを確認し、掛け心地のよい手持ちのメガネと寸法を比較しましょう。度数やレンズの種類は眼鏡店・眼科の専門家にも相談してください。同じ商品画像を複数サイズに使っている場合、画像だけで適切なサイズは選べません。",
    "nextBefore": "次に、",
    "checklistLink": "度付きメガネの注文チェックリスト（英語）",
    "nextBetween": "または",
    "widthLink": "フレーム幅の比較方法",
    "nextAfter": "を確認してください。"
  },
  "ar": {
    "language": "ar",
    "title": "كيف تجرّب النظارات الطبية افتراضيًا باستخدام صورة",
    "description": "قارن بين إطارين على صورة الوجه نفسها باستخدام صورة المنتج، ثم تحقّق من المقاسات وخيارات العدسات لدى البائع قبل الشراء.",
    "category": "تجربة افتراضية",
    "readTime": "3 دقائق قراءة",
    "imageAlt": "مثال يوضح صورة وجه وصورة إطار من الأمام ونتيجة التجربة الافتراضية.",
    "imageCaption": "مثال من VisuTry: صورة الوجه وصورة الإطار ونتيجة المعاينة الافتراضية.",
    "publishedPrefix": "نُشر في",
    "publishedLabel": "4 نوفمبر 2025",
    "updatedPrefix": "حُدّث في",
    "updatedLabel": "16 نوفمبر 2026",
    "startHeading": "ابدأ بصورتين واضحتين",
    "startP1": "هل وجدت إطارًا يعجبك في متجر إلكتروني؟ احتفظ برابط المنتج وابحث عن صورة أمامية للون الذي تريده. ينبغي أن تظهر الحلقتان والمفصلات بوضوح؛ فالصورة الجانبية أو صورة عارض يرتدي النظارة قد تخفي شكل الإطار الذي تريد مقارنته.",
    "startP2": "التقط صورة لوجهك من الأمام بإضاءة متساوية، مع إبعاد الشعر عن الوجه وخلع نظارتك الحالية. ارفع الصورة إلى VisuTry وأضف صورة المنتج بوصفها إطارًا مخصصًا. استخدم صورة الوجه نفسها عند تجربة إطار ثانٍ حتى لا يؤثر اختلاف زاوية الرأس في المقارنة.",
    "creditNote": "يتطلب إنشاء صورة تجربة مخصصة بالذكاء الاصطناعي تسجيل الدخول وتوفّر رصيد للاستخدام. أما أداة تحديد شكل الوجه المجانية فهي وظيفة مستقلة تعمل داخل متصفحك.",
    "tryOnCta": "تجربة الإطار على صورتي",
    "compareHeading": "قارن الشكل أولًا ثم اللون",
    "compareP": "عند الاختيار بين إطار مربع عميق وآخر بيضاوي ضيق، لاحظ مقدار ما يظهر من الخدين وكيف يتقاطع الحاجب مع الحافة العليا. وعند مقارنة لونين للطراز نفسه، ثبّت الشكل والمقاس. راجع صور البائع تحت إضاءة مختلفة قبل اختيار اللون أو اللمسة النهائية.",
    "previewHeading": "ما الذي تُظهره المعاينة الافتراضية فعلًا؟",
    "previewP": "تساعدك صورة الذكاء الاصطناعي على مقارنة المظهر المرئي لإطار محدد على صورة الوجه نفسها مع إضاءة متشابهة. دوّن اسم الطراز واللون وأرقام عرض العدسة والجسر وطول الذراع المذكورة لدى البائع. لا يتحقق VisuTry من بيانات المتجر ولا يقيس مدى الملاءمة الفعلية من صورة فقط.",
    "previewBefore": "إذا أردت استكشاف أشكال إطارات عامة بدلًا من طراز محدد في متجر، فاستخدم",
    "previewLink": "مقارنة الإطارات",
    "previewAfter": "لعرض أنماط جاهزة مدمجة. وهذه تجربة مختلفة عن استخدام صورة منتج بعينه.",
    "fitHeading": "تحقّق من المقاس الفعلي قبل الطلب",
    "fitP": "تساعد المعاينة بالصور على تضييق الخيارات، لكنها لا تقيس الضغط على الأنف أو طول الأذرع أو موضع العدسات. راجع رقم الطراز والمقاس الدقيقين لدى البائع وقارن القياسات بنظارة مريحة لديك، واستشر اختصاصي البصريات بشأن الوصفة والعدسات. إذا استخدم المتجر الصورة نفسها لمقاسين مختلفين فلا تكفي المعاينة لاختيار الأنسب.",
    "nextBefore": "للخطوة التالية راجع",
    "checklistLink": "قائمة التحقق قبل شراء النظارات الطبية (بالإنجليزية)",
    "nextBetween": "أو اقرأ",
    "widthLink": "طريقة مقارنة عرض الإطارات",
    "nextAfter": "."
  },
  "pt": {
    "language": "pt",
    "title": "Como experimentar óculos graduados a partir de uma fotografia",
    "description": "Compare duas armações no mesmo retrato usando fotografias dos produtos e confirme as medidas e as opções de lentes junto do vendedor antes de comprar.",
    "category": "Experimentação virtual",
    "readTime": "3 min de leitura",
    "imageAlt": "Exemplo com retrato, fotografia frontal da armação e pré-visualização da experimentação virtual.",
    "imageCaption": "Exemplo VisuTry: retrato, fotografia da armação e resultado visual da experimentação.",
    "publishedPrefix": "Publicado em",
    "publishedLabel": "4 de novembro de 2025",
    "updatedPrefix": "Atualizado em",
    "updatedLabel": "16 de novembro de 2026",
    "startHeading": "Comece pelas duas fotografias",
    "startP1": "Encontrou uma armação numa loja online? Guarde a ligação do produto e procure uma fotografia de frente na cor pretendida. O enquadramento deve mostrar os dois aros e as dobradiças. Uma vista lateral ou uma fotografia de alguém a usar os óculos pode ocultar o contorno que pretende comparar.",
    "startP2": "Tire um retrato de frente, com iluminação uniforme, sem cabelo a tapar o rosto e sem os óculos habituais. No VisuTry, carregue o retrato e adicione a fotografia do produto como armação personalizada. Use o mesmo retrato para experimentar um segundo modelo, evitando que uma mudança de pose altere a comparação.",
    "creditNote": "Para gerar uma pré-visualização personalizada com IA é necessário iniciar sessão e ter um crédito disponível. O detetor gratuito de formato do rosto é uma ferramenta diferente, processada no navegador.",
    "tryOnCta": "Experimentar a armação na minha fotografia",
    "compareHeading": "Compare primeiro o formato, depois a cor",
    "compareP": "Se hesitar entre uma armação quadrada alta e uma oval estreita, veja quanto das maçãs do rosto cada uma cobre e como a linha superior acompanha as sobrancelhas. Ao comparar duas cores do mesmo modelo, mantenha o formato e o tamanho. Confirme o acabamento nas fotografias do vendedor sob diferentes iluminações.",
    "previewHeading": "O que a pré-visualização demonstra",
    "previewP": "Uma imagem gerada por IA permite comparar o aspeto de uma armação específica no mesmo retrato, com iluminação semelhante. Guarde o nome do modelo, a cor e as medidas de largura da lente, ponte e haste indicadas pelo vendedor. O VisuTry não verifica esses dados nem consegue medir o ajuste físico exato a partir de uma fotografia.",
    "previewBefore": "Se preferir explorar silhuetas em vez de um modelo exato de uma loja,",
    "previewLink": "Comparação de armações",
    "previewAfter": "mostra estilos predefinidos incluídos. Não é o mesmo processo que experimentar a fotografia de um produto específico.",
    "fitHeading": "Verifique o ajuste físico antes de encomendar",
    "fitP": "Uma pré-visualização ajuda a selecionar modelos, mas não mede a pressão na ponte do nariz, o comprimento das hastes nem a posição das lentes. Consulte o modelo e o tamanho exatos na ficha do vendedor, compare as medidas com uns óculos confortáveis e esclareça a graduação e as lentes com um optometrista ou ótico. Se dois tamanhos partilham a mesma fotografia, a imagem não permite decidir qual assenta melhor.",
    "nextBefore": "Como próximo passo, consulte a",
    "checklistLink": "lista de verificação para encomendar óculos graduados (em inglês)",
    "nextBetween": "ou veja",
    "widthLink": "como comparar a largura das armações",
    "nextAfter": "."
  },
  "id": {
    "language": "id",
    "title": "Cara mencoba kacamata berlensa resep dari foto",
    "description": "Bandingkan dua bingkai pada foto wajah yang sama dengan gambar produk, lalu periksa ukuran bingkai dan pilihan lensa kepada penjual sebelum membeli.",
    "category": "Coba kacamata virtual",
    "readTime": "3 menit baca",
    "imageAlt": "Contoh foto wajah, gambar bingkai tampak depan, dan pratinjau coba kacamata virtual.",
    "imageCaption": "Contoh VisuTry: foto wajah, foto bingkai, dan pratinjau tampilan hasil coba kacamata.",
    "publishedPrefix": "Terbit",
    "publishedLabel": "4 November 2025",
    "updatedPrefix": "Diperbarui",
    "updatedLabel": "16 November 2026",
    "startHeading": "Siapkan dua foto yang jelas",
    "startP1": "Sudah menemukan bingkai di toko online? Simpan tautan produknya, lalu cari foto bagian depan dengan warna yang Anda incar. Pastikan kedua lingkar lensa dan engsel terlihat. Foto dari samping atau foto model yang sedang memakai kacamata dapat menutupi bentuk bingkai yang ingin dibandingkan.",
    "startP2": "Ambil foto wajah dari depan dengan pencahayaan merata, wajah tidak tertutup rambut, dan kacamata lama dilepas. Di VisuTry, unggah foto wajah lalu tambahkan gambar produk sebagai bingkai khusus. Gunakan foto wajah yang sama untuk mencoba bingkai kedua agar perubahan posisi kepala tidak memengaruhi perbandingan.",
    "creditNote": "Membuat pratinjau coba kacamata khusus dengan AI memerlukan login dan kredit yang tersedia. Pendeteksi bentuk wajah gratis adalah fitur terpisah yang diproses langsung di browser.",
    "tryOnCta": "Coba bingkai pada foto saya",
    "compareHeading": "Bandingkan bentuk dahulu, lalu warna",
    "compareP": "Jika memilih antara bingkai kotak yang tinggi dan oval yang sempit, perhatikan seberapa banyak pipi tertutup dan posisi garis atas terhadap alis. Saat membandingkan dua warna dari model yang sama, pertahankan bentuk dan ukurannya. Periksa foto penjual dalam beragam pencahayaan sebelum menentukan warna akhir.",
    "previewHeading": "Apa yang sebenarnya ditunjukkan pratinjau",
    "previewP": "Gambar hasil AI membantu membandingkan tampilan bingkai tertentu pada foto wajah yang sama dengan cahaya serupa. Catat nama model, warna, serta angka lebar lensa, jembatan hidung, dan panjang tangkai dari penjual. VisuTry tidak memverifikasi informasi toko dan tidak dapat mengukur kesesuaian fisik secara pasti lewat foto.",
    "previewBefore": "Jika ingin menjelajahi berbagai siluet bingkai, bukan satu produk toko yang persis,",
    "previewLink": "Bandingkan bingkai",
    "previewAfter": "menyediakan gaya bawaan untuk dibandingkan. Alur ini berbeda dari coba kacamata memakai foto produk yang spesifik.",
    "fitHeading": "Pastikan ukuran fisik sebelum memesan",
    "fitP": "Pratinjau foto dapat mempersempit pilihan, tetapi tidak mengukur tekanan di hidung, panjang tangkai, atau posisi lensa. Cari nomor model dan ukuran tepat di toko, bandingkan dengan kacamata yang nyaman, lalu konsultasikan resep dan pilihan lensa dengan optik atau tenaga profesional. Jika dua ukuran memakai gambar produk yang sama, pratinjau saja tidak cukup untuk menentukan ukuran yang pas.",
    "nextBefore": "Selanjutnya, baca",
    "checklistLink": "daftar periksa pemesanan kacamata resep (bahasa Inggris)",
    "nextBetween": "atau pelajari",
    "widthLink": "cara membandingkan lebar bingkai",
    "nextAfter": "."
  },
  "de": {
    "language": "de",
    "title": "Brille mit Sehstärke anhand eines Fotos virtuell anprobieren",
    "description": "Vergleichen Sie zwei Fassungen auf demselben Porträt mithilfe von Produktfotos und prüfen Sie vor dem Kauf Maße und Glasoptionen beim Anbieter.",
    "category": "Virtuelle Anprobe",
    "readTime": "3 Min. Lesezeit",
    "imageAlt": "Beispiel mit Porträt, frontalem Fassungsfoto und Vorschau der virtuellen Anprobe.",
    "imageCaption": "VisuTry-Beispiel: Porträt, Fassungsfoto und visuelles Ergebnis der Anprobe.",
    "publishedPrefix": "Veröffentlicht am",
    "publishedLabel": "4. November 2025",
    "updatedPrefix": "Aktualisiert am",
    "updatedLabel": "16. November 2026",
    "startHeading": "Beginnen Sie mit zwei Fotos",
    "startP1": "Sie haben bei einem Onlinehändler eine Fassung entdeckt? Speichern Sie den Produktlink und suchen Sie eine frontale Aufnahme in der gewünschten Farbe. Beide Fassungsränder und die Scharniere sollten sichtbar sein. Eine Seitenansicht oder ein Modelbild kann die Form verdecken, die Sie vergleichen möchten.",
    "startP2": "Fotografieren Sie Ihr Gesicht frontal bei gleichmäßigem Licht, ohne verdeckende Haare und ohne Ihre bisherige Brille. Laden Sie das Porträt in VisuTry hoch und fügen Sie das Produktbild als eigene Fassung hinzu. Verwenden Sie für das zweite Modell dasselbe Porträt, damit Unterschiede im Blickwinkel den Vergleich nicht verfälschen.",
    "creditNote": "Für die KI-generierte Vorschau einer individuellen Fassung sind Anmeldung und ein verfügbares Guthaben erforderlich. Der kostenlose Gesichtsform-Detektor arbeitet als separates Werkzeug im Browser.",
    "tryOnCta": "Fassung auf meinem Foto ausprobieren",
    "compareHeading": "Erst die Form, dann die Farbe vergleichen",
    "compareP": "Wenn Sie zwischen einer hohen eckigen Fassung und einer schmalen ovalen wählen, achten Sie darauf, wie viel Wange sichtbar bleibt und wie die obere Linie zu den Augenbrauen verläuft. Vergleichen Sie zwei Farben desselben Modells bei gleicher Form und Größe. Prüfen Sie den Farbton auch auf Händlerfotos unter unterschiedlichem Licht.",
    "previewHeading": "Was die virtuelle Vorschau wirklich zeigt",
    "previewP": "Ein KI-Bild hilft, die optische Wirkung einer bestimmten Fassung auf demselben Porträt bei ähnlichem Licht zu vergleichen. Notieren Sie Modell, Farbe sowie die vom Händler angegebenen Glas-, Steg- und Bügellängen. VisuTry überprüft diese Angaben nicht und kann die tatsächliche Passform aus einem Foto nicht exakt messen.",
    "previewBefore": "Möchten Sie erst allgemeine Fassungsformen statt eines bestimmten Händlerprodukts kennenlernen,",
    "previewLink": "Fassungen vergleichen",
    "previewAfter": "zeigt integrierte Beispielmodelle. Dieser Ablauf unterscheidet sich von der Anprobe mit einem konkreten Produktfoto.",
    "fitHeading": "Vor dem Bestellen die reale Passform prüfen",
    "fitP": "Eine Fotovorschau grenzt die Auswahl ein, misst aber weder Druck auf dem Nasensteg noch Bügellänge oder die genaue Position der Gläser. Prüfen Sie das exakte Modell und seine Größe beim Händler, vergleichen Sie Maße mit Ihrer bequemen Brille und klären Sie Verordnung und Glasoptionen mit dem Optiker. Wenn zwei Größen dasselbe Produktbild haben, hilft die Vorschau allein nicht bei der Größenwahl.",
    "nextBefore": "Lesen Sie anschließend die",
    "checklistLink": "Checkliste für den Brillenkauf (Englisch)",
    "nextBetween": "oder erfahren Sie,",
    "widthLink": "wie sich Fassungsbreiten vergleichen lassen",
    "nextAfter": "."
  }
}

export function getPrescriptionTryOnArticleCopy(locale: Locale): PrescriptionTryOnArticleCopy {
  return copies[locale]
}
