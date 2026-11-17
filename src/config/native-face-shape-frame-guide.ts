import type { Locale } from '@/i18n'
import type { NativeEditorialCopy } from '@/components/blog/NativeEditorialArticle'

/** Complete native articles: face-shape frame comparison, four examples, two FAQs. */
const copies: Record<Exclude<Locale, 'en'>, NativeEditorialCopy> = {
  "es": {
    "title": "Cómo elegir gafas según la forma de tu rostro",
    "description": "Compara dos monturas con distinto borde, profundidad o color y confirma las medidas y el puente antes de comprar.",
    "sections": [
      {
        "heading": "Elige dos monturas para comparar",
        "paragraphs": [
          "Empieza por una montura que te guste. ¿Qué cambiarías de su aspecto? Un borde superior recto puede destacar las cejas; una montura fina deja ver más la cara. Prueba dos modelos de anchura parecida para que la comparación no dependa de un tamaño exagerado. La forma de tu rostro es un punto de partida, no una regla que prohíba estilos."
        ],
        "bullets": [
          "Mejillas redondas o mandíbula curva: compara una forma suavemente redondeada con un rectángulo de borde superior recto; observa cómo cambia la línea sobre las mejillas.",
          "Mandíbula cuadrada o angulosa: compara un aro ovalado con un cuadrado de esquinas suavizadas; puede gustarte tanto repetir los ángulos como suavizarlos.",
          "Rostro alargado: prueba un rectángulo poco profundo y otro más alto, de anchura similar. Compara cuánto pómulo queda visible por debajo.",
          "Frente más ancha y mentón estrecho: compara una montura metálica fina con una tipo browline más oscura; fíjate en las esquinas superiores y las cejas."
        ]
      },
      {
        "heading": "Observa primero el borde superior",
        "paragraphs": [
          "En la imagen, la montura oscura tiene una línea superior marcada, mientras que los aros claros y redondeados se notan menos en los laterales. Aquí cambian tanto el color como la forma: para saber qué factor te gusta más, prueba después la misma montura en dos colores. Puedes comparar otras siluetas en la guía de monturas por rostro."
        ]
      },
      {
        "heading": "Revisa las medidas y el puente",
        "paragraphs": [
          "Usa como referencia unas gafas que te resulten cómodas. Los tres números impresos en la varilla suelen indicar anchura de lente, puente y longitud de varilla en milímetros; no representan la anchura total del frontal. Busca las medidas del modelo en la ficha del vendedor. Si el puente resbala o presiona la nariz, pide que lo revise un óptico: la foto y la etiqueta de forma de rostro no miden esa sensación."
        ]
      }
    ],
    "faq": [
      {
        "question": "¿Y si mi rostro parece de dos formas diferentes?",
        "answer": "Elige un rasgo que quieras destacar, como la línea de la mandíbula. Prueba dos monturas de anchura y color similares pero distinta profundidad; compara cómo queda el borde inferior sobre las mejillas."
      },
      {
        "question": "¿Qué hago si me gustan las dos monturas?",
        "answer": "Pruébalas en persona si puedes. Comprueba si el puente resbala, si las varillas aprietan las sienes y si el aro toca las mejillas al sonreír. En una compra online, revisa ajustes y devoluciones."
      }
    ],
    "category": "Guía de monturas",
    "readTime": "4 min de lectura",
    "imageAlt": "Ejemplo de dos contornos y colores de montura sobre el rostro.",
    "imageCaption": "Compara cómo el borde oscuro sigue las cejas y cómo los aros claros dejan ver más la cara.",
    "publishedLabel": "Publicado el 15 de octubre de 2025",
    "updatedLabel": "Actualizado el 16 de noviembre de 2026",
    "tryOnLabel": "Probar monturas en mi foto",
    "detectorLabel": "Detectar gratis mi forma de rostro",
    "compareLabel": "Comparar estilos predefinidos",
    "widthLabel": "Comparar medidas de monturas",
    "relatedLabel": "Guía de asesoramiento con foto y opciones de desbloqueo",
    "nextStepLabel": "Una imagen te ayuda a ver estilos, pero no mide el ajuste real ni sustituye al óptico.",
    "creditDisclosure": "El detector gratuito ofrece información general sin enviar la foto al servidor; las recomendaciones personalizadas con IA y la prueba virtual con imágenes de producto usan créditos."
  },
  "fr": {
    "title": "Choisir ses lunettes selon la forme de son visage",
    "description": "Comparez deux montures par leur ligne supérieure, leur profondeur et leur couleur, puis vérifiez dimensions et pont avant de commander.",
    "sections": [
      {
        "heading": "Choisissez deux montures à essayer",
        "paragraphs": [
          "Commencez par une paire qui vous plaît. Que changeriez-vous dans son apparence ? Un bord supérieur droit attire l'attention sur les sourcils ; une monture fine et claire laisse davantage voir le visage. Choisissez deux modèles de largeur comparable pour éviter qu'une taille exagérée ne décide à votre place. La forme du visage sert de point de départ, pas de règle absolue."
        ],
        "bullets": [
          "Joues rondes ou mâchoire douce : comparez une monture légèrement ronde avec un rectangle à bord supérieur droit ; regardez comment change la ligne des joues.",
          "Mâchoire carrée ou anguleuse : opposez un ovale à un carré aux coins adoucis. Vous pouvez apprécier la répétition des angles autant que la courbe plus douce.",
          "Visage long ou oblong : comparez un rectangle peu profond à un modèle plus haut, de largeur semblable. Observez la partie des joues visible sous la monture.",
          "Front large et menton plus étroit : comparez un fin cercle métallique à un browline foncé ; observez les coins supérieurs et l'accent mis sur les sourcils."
        ]
      },
      {
        "heading": "Regardez d'abord la ligne supérieure",
        "paragraphs": [
          "Sur l'image, le bord supérieur sombre suit nettement les sourcils, tandis que les montures claires et arrondies se fondent davantage sur les côtés. La forme et la couleur varient ici : pour savoir ce que vous préférez, comparez ensuite une même monture dans deux couleurs. Explorez d'autres silhouettes dans les guides de montures par visage."
        ]
      },
      {
        "heading": "Vérifiez les dimensions et le pont",
        "paragraphs": [
          "Prenez comme référence une paire confortable. Les trois nombres sur une branche indiquent généralement la largeur d'un verre, du pont et la longueur des branches en millimètres, non la largeur totale. Consultez le schéma des mesures du vendeur. Si le pont glisse ou appuie sur le nez, demandez conseil à un opticien : une photo et une catégorie de visage ne mesurent pas cette sensation."
        ]
      }
    ],
    "faq": [
      {
        "question": "Et si mon visage présente deux formes différentes ?",
        "answer": "Choisissez un trait à mettre en valeur, par exemple une mâchoire arrondie. Comparez deux rectangles d'une largeur et couleur similaires mais de hauteur différente, puis observez leur bord inférieur sur les joues."
      },
      {
        "question": "Et si les deux paires me plaisent ?",
        "answer": "Essayez-les en magasin si possible. Vérifiez le glissement du pont, la pression des branches sur les tempes et le contact des verres avec les joues en souriant. En ligne, contrôlez réglages et retours."
      }
    ],
    "category": "Conseils montures",
    "readTime": "4 min de lecture",
    "imageAlt": "Exemple de deux contours et couleurs de montures sur un visage.",
    "imageCaption": "Observez la ligne sombre près des sourcils et les contours pâles qui dégagent davantage le visage.",
    "publishedLabel": "Publié le 15 octobre 2025",
    "updatedLabel": "Mis à jour le 16 novembre 2026",
    "tryOnLabel": "Essayer des montures sur ma photo",
    "detectorLabel": "Détecter gratuitement ma forme de visage",
    "compareLabel": "Comparer des styles prédéfinis",
    "widthLabel": "Comparer les mesures des montures",
    "relatedLabel": "Guide photo pour des conseils personnalisés",
    "nextStepLabel": "La photo aide à juger un style, pas à mesurer l'ajustement réel ni à remplacer un opticien.",
    "creditDisclosure": "Le détecteur gratuit donne des indications générales en traitant la photo dans le navigateur ; l'avis personnalisé par IA et l'essayage de produits précis utilisent des crédits."
  },
  "ru": {
    "title": "Как подобрать очки к форме лица: практическое сравнение оправ",
    "description": "Сравните две оправы по верхнему краю, глубине и цвету, а перед покупкой проверьте размер и посадку моста.",
    "sections": [
      {
        "heading": "Выберите две оправы для сравнения",
        "paragraphs": [
          "Начните с оправы, которая нравится. Что хотите изменить во внешнем виде? Прямая верхняя линия подчёркивает брови, а тонкая светлая оправа оставляет больше лица открытым. Выбирайте варианты примерно одной ширины, чтобы слишком большой размер не подменял сравнение форм. Форма лица — ориентир для первого выбора, но не строгий запрет на другие стили."
        ],
        "bullets": [
          "Округлые щёки или линия челюсти: поставьте рядом мягкую округлую форму и прямоугольник с ровным верхним краем; сравните, как меняется линия над щеками.",
          "Угловатая или квадратная челюсть: сравните овал и квадрат со сглаженными углами. Возможно, вам одинаково понравятся повторяющиеся углы и смягчённые линии.",
          "Удлинённое лицо: попробуйте неглубокий прямоугольник и более высокий той же ширины. Смотрите, сколько щеки видно ниже оправы.",
          "Широкий лоб и узкий подбородок: сравните тонкую металлическую рамку с более тёмным browline, обращая внимание на верхние углы и брови."
        ]
      },
      {
        "heading": "Сначала посмотрите на верхний край",
        "paragraphs": [
          "На изображении тёмный верхний край отчётливо виден вдоль бровей, а светлые закруглённые ободки почти исчезают по бокам. Здесь одновременно меняются форма и цвет. Чтобы понять, что важнее, затем примерьте ту же модель в двух цветах. Дополнительные варианты по форме лица можно найти в каталоге стилевых советов."
        ]
      },
      {
        "heading": "Проверьте размеры и мост",
        "paragraphs": [
          "Сравнивайте размеры с удобными очками. Три числа на дужке обычно означают ширину одной линзы, ширину моста и длину дужки в миллиметрах; это не полная ширина оправы. Проверьте схему размеров у продавца. Если мост съезжает или давит, обратитесь к оптику: фотография и название формы лица не показывают ощущения при ношении."
        ]
      }
    ],
    "faq": [
      {
        "question": "А если моё лицо похоже на две формы?",
        "answer": "Выберите одну черту, которую хотите выделить. Например, при округлой челюсти и удлинённых пропорциях сравните прямоугольники близкой ширины и цвета, но разной глубины; смотрите на нижний край у щеки."
      },
      {
        "question": "Что делать, если нравятся обе оправы?",
        "answer": "По возможности примерьте их в магазине. Проверьте, не соскальзывает ли мост, не давят ли дужки на виски и не касаются ли ободки щёк при улыбке. Для онлайн-заказа изучите регулировку и возврат."
      }
    ],
    "category": "Советы по выбору оправ",
    "readTime": "4 мин чтения",
    "imageAlt": "Пример оправ разных очертаний и цветов на одном лице.",
    "imageCaption": "Сравните тёмный край вдоль бровей и светлые закруглённые ободки.",
    "publishedLabel": "Опубликовано 15 октября 2025 г.",
    "updatedLabel": "Обновлено 16 ноября 2026 г.",
    "tryOnLabel": "Примерить оправы на своём фото",
    "detectorLabel": "Бесплатно определить форму лица",
    "compareLabel": "Сравнить готовые стили",
    "widthLabel": "Как сравнивать размеры оправ",
    "relatedLabel": "Гид по персональным рекомендациям",
    "nextStepLabel": "Фотография помогает оценить стиль, но не измеряет фактическую посадку и не заменяет оптика.",
    "creditDisclosure": "Бесплатный детектор даёт общую оценку формы лица прямо в браузере; персональные рекомендации ИИ и примерка конкретной модели требуют кредитов."
  },
  "ja": {
    "title": "顔の形に合うメガネの選び方",
    "description": "2本のフレームの上側のライン・レンズの深さ・色を比べ、注文前にサイズとブリッジの掛け心地を確認しましょう。",
    "sections": [
      {
        "heading": "まず2本のフレームを比べる",
        "paragraphs": [
          "好きなメガネを1本選び、見た目のどこを変えたいか考えます。まっすぐな上側のリムは眉を強調し、細く明るいリムは顔をすっきり見せます。フレームの幅を近づけて比較すると、極端な大きさだけで好みを判断せずに済みます。顔型は候補を見つける手掛かりであり、似合う形を一つに決めるルールではありません。"
        ],
        "bullets": [
          "丸い頬や丸みのある顎：柔らかい丸型と、上側がまっすぐな長方形を比べ、頬のラインの見え方を確認します。",
          "角ばった顎：オーバル型と角を少し丸めたスクエア型を比べます。曲線で柔らかくするか角を活かすかは好みです。",
          "縦長の顔：浅い長方形と深めの長方形を同じ幅で比較し、下の頬がどのくらい見えるか観察します。",
          "額が広く顎が細い顔：細いメタルフレームと濃いブローラインを比べ、眉と上側の角の印象を確かめます。"
        ]
      },
      {
        "heading": "上側のリムと眉の位置を見る",
        "paragraphs": [
          "写真では、左の濃い上側のラインが眉に沿って目立ち、右の明るい丸みのあるリムは横から見えにくくなっています。形と色の両方が違うため、次は同じフレームの色違いで比較してみましょう。卵型・ひし形・三角形などの例は顔型別フレームガイドでも探せます。"
        ]
      },
      {
        "heading": "サイズとブリッジを確認する",
        "paragraphs": [
          "掛け心地のよい手持ちのメガネを基準にしましょう。テンプル内側の3つの数字は通常、レンズ幅・ブリッジ幅・テンプル長（mm）を示し、フレーム全体の幅ではありません。商品ページの採寸図も見比べてください。鼻に圧迫感がある、またはずり落ちる場合は眼鏡店で相談しましょう。顔型診断や写真では実際の感触までは測れません。"
        ]
      }
    ],
    "faq": [
      {
        "question": "顔型が2種類の中間に見える場合は？",
        "answer": "強調したい特徴を一つ選びましょう。たとえば丸い顎と縦長の輪郭なら、幅と色をそろえた浅い長方形と深めの長方形を試し、下側のリムと頬の位置を比べます。"
      },
      {
        "question": "2本とも気に入ったら？",
        "answer": "可能なら実際に掛け、鼻でずり落ちないか、こめかみを締め付けないか、笑ったとき頬に当たらないか確認します。ネット購入時は調整・返品条件も調べましょう。"
      }
    ],
    "category": "フレーム選びのガイド",
    "readTime": "約4分",
    "imageAlt": "顔写真に重ねた異なる形と色のメガネの比較例。",
    "imageCaption": "眉に沿った濃い上側のラインと、顔になじむ明るい丸型フレームを比べましょう。",
    "publishedLabel": "公開：2025年10月15日",
    "updatedLabel": "更新：2026年11月16日",
    "tryOnLabel": "自分の写真でメガネを試す",
    "detectorLabel": "無料で顔型を調べる",
    "compareLabel": "内蔵フレームを比較する",
    "widthLabel": "フレームの寸法を比べる",
    "relatedLabel": "写真からメガネを選ぶガイド",
    "nextStepLabel": "写真はスタイル選びには役立ちますが、実際の掛け心地を測ったり眼鏡店の調整を代替したりはできません。",
    "creditDisclosure": "無料の顔型診断はブラウザー内で一般的な情報を提供します。写真による個別AIおすすめや商品画像の試着にはクレジットが必要です。"
  },
  "ar": {
    "title": "كيف تختار النظارات المناسبة لشكل وجهك",
    "description": "قارن إطارين من حيث الخط العلوي وعمق العدسة واللون، ثم تأكد من المقاسات وملاءمة الجسر قبل الشراء.",
    "sections": [
      {
        "heading": "اختر إطارين لتجربتهما",
        "paragraphs": [
          "ابدأ بإطار تحبه. ما الذي ترغب في تغييره بمظهره؟ قد تُبرز الحافة المستقيمة الحاجبين، بينما يترك الإطار الرفيع والفاتح مساحة أكبر من الوجه ظاهرة. قارن إطارين بعرض متقارب كي لا يحسم الحجم المبالغ فيه المقارنة. شكل الوجه نقطة بداية مفيدة وليس قاعدة تمنعك من اختيار أشكال أخرى."
        ],
        "bullets": [
          "الخدان المستديران أو الفك المنحني: قارن شكلًا مستديرًا قليلًا بمستطيل ذي حافة علوية مستقيمة، وانظر إلى الخط الظاهر فوق الخدين.",
          "الفك المربع أو الزاوي: قارن إطارًا بيضاويًا بآخر مربع ذي زوايا ناعمة؛ قد تفضّل تكرار الزوايا أو التباين مع انحناءات أهدأ.",
          "الوجه الطويل: جرّب مستطيلًا ضحلًا وآخر أعمق بعرض مماثل، ولاحظ مقدار الخد الظاهر أسفل الحافة.",
          "الجبهة العريضة والذقن الضيق: قارن إطارًا معدنيًا رفيعًا بآخر browline داكن وانتبه إلى الزوايا العليا والحاجبين."
        ]
      },
      {
        "heading": "راقب الحافة العلوية أولًا",
        "paragraphs": [
          "تُظهر الصورة حافة علوية داكنة واضحة بمحاذاة الحاجبين، مقابل حواف فاتحة مستديرة تكاد تختفي عند الجانبين. يتغير اللون والشكل معًا؛ لمعرفة أيهما تفضله، جرّب الإطار نفسه بلونين مختلفين بعد ذلك. ويمكنك تصفح المزيد من الأشكال في دليل الإطارات حسب شكل الوجه."
        ]
      },
      {
        "heading": "تحقّق من المقاسات والجسر",
        "paragraphs": [
          "اتخذ نظارة مريحة لديك مرجعًا. تشير الأرقام الثلاثة المطبوعة داخل الذراع عادةً إلى عرض عدسة واحدة وعرض الجسر وطول الذراع بالملليمتر، وليس إلى العرض الكلي. راجع مخطط قياسات البائع. إذا انزلق الجسر أو ضغط على الأنف، اطلب فحصًا لدى اختصاصي البصريات؛ فالصورة ووصف شكل الوجه لا يقيسان شعورك عند الارتداء."
        ]
      }
    ],
    "faq": [
      {
        "question": "ماذا إن بدا وجهي بين شكلين؟",
        "answer": "اختر سمة واحدة ترغب في إبرازها. إن كان الفك مستديرًا والوجه طويلًا، قارن مستطيلين متقاربين في العرض واللون ومختلفين في العمق؛ راقب الحافة السفلى قرب الخد."
      },
      {
        "question": "ماذا أفعل إن أعجبني الإطاران؟",
        "answer": "جرّبهما فعليًا إن أمكن. تأكد من عدم انزلاق الجسر أو ضغط الذراعين على الصدغين أو ملامسة الحواف للخدين عند الابتسام. عند الشراء عبر الإنترنت راجع التعديل والإرجاع."
      }
    ],
    "category": "دليل اختيار الإطارات",
    "readTime": "4 دقائق قراءة",
    "imageAlt": "مثال على اختلاف شكل الإطار ولونه على صورة الوجه نفسها.",
    "imageCaption": "قارن الحافة الداكنة عند الحاجبين بالإطار الفاتح المستدير.",
    "publishedLabel": "نُشر في 15 أكتوبر 2025",
    "updatedLabel": "حُدّث في 16 نوفمبر 2026",
    "tryOnLabel": "تجربة الإطارات على صورتي",
    "detectorLabel": "معرفة شكل وجهي مجانًا",
    "compareLabel": "مقارنة الإطارات الجاهزة",
    "widthLabel": "كيفية مقارنة مقاسات الإطارات",
    "relatedLabel": "دليل النصائح المخصصة من الصورة",
    "nextStepLabel": "الصورة تُفيد في مقارنة المظهر، لكنها لا تقيس الملاءمة ولا تغني عن فحص اختصاصي البصريات.",
    "creditDisclosure": "تقدّم أداة شكل الوجه المجانية معلومات عامة داخل المتصفح؛ أما التوصيات الشخصية وتجربة منتج محدد بالذكاء الاصطناعي فتستخدم رصيدًا."
  },
  "pt": {
    "title": "Como escolher óculos para o formato do rosto",
    "description": "Compare duas armações pelo rebordo superior, profundidade e cor, e confirme medidas e ajuste da ponte antes de comprar.",
    "sections": [
      {
        "heading": "Escolha duas armações para experimentar",
        "paragraphs": [
          "Comece por uns óculos de que goste. O que mudaria no seu aspeto? Um rebordo superior direito pode acentuar as sobrancelhas; uma armação fina e clara deixa mais rosto à vista. Compare modelos de largura semelhante para que uma dimensão excessiva não determine a escolha. O formato do rosto é um ponto de partida, não uma regra absoluta sobre que armações pode usar."
        ],
        "bullets": [
          "Bochechas arredondadas ou maxilar suave: compare uma forma levemente redonda com um retângulo de rebordo superior horizontal; veja a diferença junto às maçãs do rosto.",
          "Maxilar quadrado ou angular: compare uma armação oval com um quadrado de cantos arredondados. Pode gostar tanto de repetir os ângulos como de os suavizar.",
          "Rosto alongado: experimente um retângulo baixo e outro mais profundo da mesma largura; observe quanto da bochecha fica visível abaixo do aro.",
          "Testa larga e queixo estreito: compare metal fino com um browline mais escuro, prestando atenção aos cantos superiores e sobrancelhas."
        ]
      },
      {
        "heading": "Observe primeiro o rebordo superior",
        "paragraphs": [
          "Na imagem, a linha superior escura destaca-se junto às sobrancelhas, enquanto aros claros e arredondados quase desaparecem nas laterais. Aqui mudam cor e contorno em simultâneo: para perceber de que pormenor gosta mais, experimente depois a mesma armação em duas cores. Encontre outros exemplos no guia de armações por formato do rosto."
        ]
      },
      {
        "heading": "Verifique as medidas e a ponte",
        "paragraphs": [
          "Use como referência uns óculos confortáveis. Os três números numa haste costumam indicar largura de uma lente, largura da ponte e comprimento da haste em milímetros; não representam a largura total da frente. Consulte o esquema de medidas do vendedor. Se a ponte escorregar ou pressionar o nariz, peça ajuda ao ótico: uma imagem e um rótulo de formato de rosto não medem essa sensação."
        ]
      }
    ],
    "faq": [
      {
        "question": "E se o meu rosto parecer ter dois formatos?",
        "answer": "Escolha uma característica que queira realçar. Com maxilar arredondado e rosto alongado, por exemplo, compare retângulos de largura e cor semelhantes mas profundidades diferentes, observando o aro inferior na face."
      },
      {
        "question": "E se gostar das duas armações?",
        "answer": "Experimente ambas pessoalmente, se possível. Veja se a ponte escorrega, se as hastes apertam as têmporas e se os aros tocam nas bochechas ao sorrir. Numa compra online, confirme ajustes e devoluções."
      }
    ],
    "category": "Guia de armações",
    "readTime": "4 min de leitura",
    "imageAlt": "Exemplo de armações com contornos e cores diferentes sobre o rosto.",
    "imageCaption": "Compare o rebordo escuro junto às sobrancelhas com aros claros arredondados.",
    "publishedLabel": "Publicado em 15 de outubro de 2025",
    "updatedLabel": "Atualizado em 16 de novembro de 2026",
    "tryOnLabel": "Experimentar armações na minha fotografia",
    "detectorLabel": "Descobrir gratuitamente o formato do rosto",
    "compareLabel": "Comparar armações predefinidas",
    "widthLabel": "Comparar medidas das armações",
    "relatedLabel": "Guia de aconselhamento pessoal com fotografia",
    "nextStepLabel": "Uma fotografia ajuda a ver estilos, mas não mede a adaptação real nem substitui o ótico.",
    "creditDisclosure": "O detetor gratuito dá orientações gerais no navegador; recomendações personalizadas por IA e experimentações com imagens de produtos utilizam créditos."
  },
  "id": {
    "title": "Cara memilih kacamata berdasarkan bentuk wajah",
    "description": "Bandingkan dua bingkai melalui garis atas, kedalaman lensa dan warna, lalu periksa ukuran serta jembatan hidung sebelum membeli.",
    "sections": [
      {
        "heading": "Pilih dua bingkai untuk dicoba",
        "paragraphs": [
          "Mulailah dari satu bingkai yang Anda sukai. Bagian mana yang ingin Anda ubah? Garis atas yang lurus bisa menonjolkan alis, sementara bingkai tipis berwarna terang membuat wajah lebih terlihat. Bandingkan dua model dengan lebar mendekati sama supaya ukuran besar tidak otomatis menentukan pilihan. Bentuk wajah adalah petunjuk awal, bukan aturan yang membatasi semua gaya lain."
        ],
        "bullets": [
          "Pipi bulat atau rahang membulat: bandingkan bingkai bulat lembut dengan persegi panjang bertepi atas rata; lihat perubahan garis di atas pipi.",
          "Rahang kotak atau bersudut: bandingkan oval dengan persegi yang sudutnya melengkung; Anda mungkin suka garis tegas maupun lekukan lembut.",
          "Wajah panjang: coba persegi panjang yang dangkal dan lebih dalam pada lebar sama; bandingkan area pipi di bawah bingkai.",
          "Dahi lebar dan dagu sempit: bandingkan bingkai logam tipis dengan browline gelap, lalu perhatikan sudut atas dan alis."
        ]
      },
      {
        "heading": "Perhatikan bagian atas bingkai lebih dulu",
        "paragraphs": [
          "Pada gambar, tepi atas yang gelap terlihat jelas di sepanjang alis, sedangkan bingkai terang membulat hampir tidak menonjol di sisi wajah. Bentuk dan warna berubah sekaligus dalam contoh ini. Untuk tahu faktor mana yang Anda sukai, bandingkan satu model yang sama dalam dua warna berikutnya. Contoh bentuk lainnya tersedia di panduan bingkai berdasarkan wajah."
        ]
      },
      {
        "heading": "Periksa ukuran dan jembatan hidung",
        "paragraphs": [
          "Gunakan kacamata yang nyaman sebagai acuan. Tiga angka di bagian dalam tangkai biasanya menyatakan lebar satu lensa, lebar jembatan, dan panjang tangkai dalam milimeter; bukan lebar total bingkai. Baca diagram ukuran penjual. Jika bagian hidung melorot atau menekan, minta pemeriksaan di optik: foto dan label bentuk wajah tidak dapat mengukur rasa nyaman. "
        ]
      }
    ],
    "faq": [
      {
        "question": "Bagaimana jika bentuk wajah saya berada di antara dua kategori?",
        "answer": "Pilih satu ciri yang ingin ditonjolkan. Untuk rahang membulat dengan wajah lebih panjang, bandingkan dua bingkai persegi panjang dengan lebar dan warna mirip tetapi tinggi berbeda; periksa posisi tepi bawah di pipi."
      },
      {
        "question": "Bagaimana jika kedua bingkai sama-sama bagus?",
        "answer": "Coba langsung jika memungkinkan. Pastikan jembatan tidak melorot, tangkai tidak menekan pelipis, dan bingkai tidak menyentuh pipi saat tersenyum. Untuk belanja online, periksa ketentuan penyesuaian dan pengembalian."
      }
    ],
    "category": "Panduan bingkai",
    "readTime": "4 menit baca",
    "imageAlt": "Contoh bentuk dan warna bingkai yang berbeda pada wajah.",
    "imageCaption": "Bandingkan garis atas gelap di alis dengan bingkai terang berbentuk bulat.",
    "publishedLabel": "Terbit 15 Oktober 2025",
    "updatedLabel": "Diperbarui 16 November 2026",
    "tryOnLabel": "Coba bingkai pada foto saya",
    "detectorLabel": "Cari bentuk wajah gratis",
    "compareLabel": "Bandingkan gaya bingkai bawaan",
    "widthLabel": "Panduan membandingkan ukuran bingkai",
    "relatedLabel": "Panduan saran personal dari foto",
    "nextStepLabel": "Foto membantu memilih gaya, tetapi tidak mengukur kecocokan fisik dan bukan pengganti pemeriksaan di optik.",
    "creditDisclosure": "Pendeteksi bentuk wajah gratis memberi panduan umum di browser; rekomendasi AI personal dan coba kacamata dari produk tertentu memakai kredit."
  },
  "de": {
    "title": "Welche Brille passt zu meiner Gesichtsform?",
    "description": "Vergleichen Sie zwei Fassungen anhand von oberem Rand, Glastiefe und Farbe und prüfen Sie vor dem Kauf Maße und Nasensteg.",
    "sections": [
      {
        "heading": "Wählen Sie zwei Fassungen zum Vergleich",
        "paragraphs": [
          "Beginnen Sie mit einer Fassung, die Ihnen gefällt. Was würden Sie am Aussehen ändern? Ein gerader oberer Rand betont die Brauen, während eine schmale helle Fassung mehr vom Gesicht zeigt. Vergleichen Sie Modelle mit ähnlicher Breite, damit eine übergroße Probe nicht über die Form entscheidet. Die Gesichtsform ist ein Startpunkt, kein starres Verbot für andere Stilrichtungen."
        ],
        "bullets": [
          "Rundliche Wangen oder weicher Kiefer: vergleichen Sie eine sanft runde Fassung mit einem Rechteck und gerader Oberkante; beobachten Sie die Linien über den Wangen.",
          "Eckiger Kiefer: stellen Sie ein Oval einem Quadrat mit abgerundeten Ecken gegenüber. Wiederholte Winkel können ebenso gut gefallen wie ein weicher Kontrast.",
          "Längliches Gesicht: probieren Sie ein flaches und ein höheres Rechteck bei ähnlicher Breite; achten Sie auf die Wangen unter dem unteren Rand.",
          "Breite Stirn und schmales Kinn: vergleichen Sie eine dünne Metallfassung mit einer dunklen Browline und betrachten Sie obere Ecken und Brauen."
        ]
      },
      {
        "heading": "Betrachten Sie zuerst den oberen Fassungsrand",
        "paragraphs": [
          "Auf dem Bild verläuft die dunkle Oberkante deutlich entlang der Brauen; die hellen abgerundeten Ränder treten seitlich weniger hervor. Hier verändern sich Farbe und Form gleichzeitig. Probieren Sie anschließend dasselbe Modell in zwei Farben, um die bevorzugte Eigenschaft zu erkennen. Weitere Beispiele für unterschiedliche Gesichtsformen finden Sie im Fassungsratgeber."
        ]
      },
      {
        "heading": "Prüfen Sie Maße und Nasensteg",
        "paragraphs": [
          "Nehmen Sie eine bequeme Brille als Referenz. Die drei Zahlen am Bügel stehen meist für Breite eines Glases, Stegbreite und Bügellänge in Millimetern, nicht für die komplette Frontbreite. Vergleichen Sie das Messschema des Händlers. Rutscht die Fassung oder drückt sie auf die Nase, lassen Sie den Steg beim Optiker prüfen: Ein Foto oder Gesichtsform-Label kann das Tragegefühl nicht erfassen."
        ]
      }
    ],
    "faq": [
      {
        "question": "Was, wenn meine Gesichtsform zwischen zwei Kategorien liegt?",
        "answer": "Suchen Sie sich ein Merkmal aus, das Sie betonen möchten. Bei einem abgerundeten Kiefer und längerem Gesicht vergleichen Sie zwei ähnlich breite und gleichfarbige Rechtecke unterschiedlicher Tiefe; beobachten Sie den unteren Rand an der Wange."
      },
      {
        "question": "Was zählt, wenn mir beide Fassungen gefallen?",
        "answer": "Probieren Sie nach Möglichkeit beide vor Ort an. Prüfen Sie, ob der Steg rutscht, die Bügel an den Schläfen drücken oder die Ränder beim Lächeln die Wangen berühren. Online sind Anpassungs- und Rückgaberegeln wichtig."
      }
    ],
    "category": "Fassungsratgeber",
    "readTime": "4 Min. Lesezeit",
    "imageAlt": "Beispiel mit unterschiedlichen Fassungsformen und Farben auf einem Gesicht.",
    "imageCaption": "Vergleichen Sie den dunklen Brauenrand mit der hellen abgerundeten Fassung.",
    "publishedLabel": "Veröffentlicht am 15. Oktober 2025",
    "updatedLabel": "Aktualisiert am 16. November 2026",
    "tryOnLabel": "Fassungen auf meinem Foto probieren",
    "detectorLabel": "Gesichtsform kostenlos bestimmen",
    "compareLabel": "Vorgegebene Modelle vergleichen",
    "widthLabel": "Fassungsmaße vergleichen",
    "relatedLabel": "Fotobasierter Ratgeber für persönliche Beratung",
    "nextStepLabel": "Ein Foto hilft beim Stil, misst aber nicht die tatsächliche Passform und ersetzt keine Beratung beim Optiker.",
    "creditDisclosure": "Der kostenlose Gesichtsform-Detektor gibt allgemeine Hinweise direkt im Browser; persönliche KI-Empfehlungen und Produktfoto-Anproben benötigen Guthaben."
  }
}

export function getNativeFaceFrameGuide(locale: Locale): NativeEditorialCopy | null {
  return locale === 'en' ? null : copies[locale]
}
