import type { Locale } from '@/i18n'
import type { NativeEditorialCopy } from '@/components/blog/NativeEditorialArticle'

/**
 * Native order checklist for prescription glasses. US FTC prescription rights
 * are explicitly country-scoped; they are not claimed as global law.
 */
const copies: Record<Exclude<Locale, 'en'>, NativeEditorialCopy> = {
  "es": {
    "title": "Cómo comprar gafas graduadas por internet de forma segura",
    "description": "Prepara tu receta, compara las medidas de montura y lentes y revisa el precio total, los cambios y las devoluciones antes de pagar.",
    "sections": [
      {
        "heading": "Reúne los datos necesarios para el pedido",
        "paragraphs": [
          "Empieza con una receta de gafas vigente y unas monturas que te resulten cómodas. Pregunta al vendedor qué medidas necesita para las lentes elegidas. Si el pedido solicita un valor que no sabes identificar, consulta al profesional que emitió la receta o a una óptica antes de enviarlo.",
          "No introduzcas una distancia interpupilar (DP) media si te piden tu medida. Solicita una medición adecuada. En Estados Unidos, las normas de la FTC sobre la entrega de recetas tras una refracción se aplican allí; las obligaciones pueden ser distintas en tu país. Consulta la información oficial de tu lugar de compra."
        ]
      },
      {
        "heading": "Compara la montura con unas gafas que ya tengas",
        "paragraphs": [
          "Busca los tres números impresos en la varilla. Por ejemplo, 54 □ 16 140 suele indicar anchura de lente de 54 mm, puente de 16 mm y varilla de 140 mm; no es la anchura total del frontal. Compara esas cifras y el ancho completo de la ficha del vendedor con las gafas que ya llevas.",
          "Guarda el modelo, talla, color y enlace del producto. Puedes probar el aspecto sobre una foto frontal de tu rostro usando una imagen frontal de esa montura. La prueba visual muestra la silueta; el vendedor o la óptica deben confirmar la compatibilidad de las lentes y el ajuste físico."
        ]
      },
      {
        "heading": "Comprueba el precio del pedido completo",
        "paragraphs": [
          "Para comparar dos tiendas, selecciona el mismo tipo de lente, recubrimientos y talla en ambas. Apunta el total con envío e impuestos aplicables. Comparar el precio de una montura sola con el de unas gafas terminadas daría un resultado engañoso."
        ]
      },
      {
        "heading": "Revisa las devoluciones y los cambios de lentes",
        "paragraphs": [
          "Un reembolso, un saldo de tienda y una nueva fabricación de lentes ofrecen soluciones distintas si el producto no sirve. Abre la política del vendedor antes de pagar. Los plazos y las excepciones pueden variar entre monturas, lentes personalizadas y productos rebajados."
        ],
        "bullets": [
          "Averigua si las lentes graduadas, la montura y los artículos en oferta tienen reglas de devolución diferentes.",
          "Anota cuándo empieza el plazo, cómo se devuelve el dinero y quién paga los gastos de envío.",
          "Pregunta quién se encarga de ajustar la montura o rehacer las lentes y qué documentos necesitarás."
        ]
      }
    ],
    "category": "Guía de compra",
    "readTime": "4 min de lectura",
    "imageAlt": "Fotografía de una montura utilizada como referencia para comparar medidas y estilo.",
    "imageCaption": "Antes de comprar, contrasta los datos del producto, la receta y los costes reales.",
    "publishedLabel": "Publicado el 28 de octubre de 2025",
    "updatedLabel": "Actualizado el 16 de noviembre de 2026",
    "tryOnLabel": "Ver una montura en mi foto",
    "detectorLabel": "Detectar gratis mi forma de rostro",
    "compareLabel": "Comparar estilos de montura",
    "widthLabel": "Cómo comparar la anchura de las monturas",
    "relatedLabel": "Guía de prueba virtual con foto",
    "nextStepLabel": "Conserva la confirmación del pedido, las medidas y la política de devoluciones. Si compras desde EE. UU., consulta la guía oficial de la FTC sobre recetas.",
    "creditDisclosure": "La prueba con foto no verifica la graduación ni el ajuste. La prueba virtual personalizada requiere cuenta y créditos; el detector gratuito procesa la foto en tu navegador."
  },
  "fr": {
    "title": "Acheter des lunettes de vue en ligne : les vérifications essentielles",
    "description": "Vérifiez l'ordonnance, les mesures de monture, les options de verres, le prix complet et les conditions de retour avant de commander.",
    "sections": [
      {
        "heading": "Rassemblez les informations pour la commande",
        "paragraphs": [
          "Commencez par une ordonnance valable et une paire de lunettes confortable. Demandez au vendeur les mesures nécessaires aux verres choisis. Si un champ de la commande est inconnu, faites-le expliquer par le professionnel ayant établi l'ordonnance ou par un opticien avant de payer.",
          "N'indiquez pas une distance pupillaire moyenne au hasard. Demandez une mesure appropriée. Aux États-Unis, les règles de la FTC sur la remise des ordonnances après réfraction s'appliquent aux achats relevant de ce pays ; les obligations sont différentes ailleurs. Consultez les règles locales."
        ]
      },
      {
        "heading": "Comparez la monture à une paire que vous possédez",
        "paragraphs": [
          "Regardez les trois chiffres sur une branche. Une inscription telle que 54 □ 16 140 indique habituellement un verre de 54 mm, un pont de 16 mm et une branche de 140 mm ; elle ne donne pas la largeur totale. Comparez-les, ainsi que la largeur de face fournie par le vendeur, avec vos lunettes habituelles.",
          "Enregistrez la référence, la taille, la couleur et le lien produit. Vous pouvez comparer l'apparence avec un portrait de face et la photo frontale de cette monture. L'aperçu indique une silhouette ; seul le vendeur ou l'opticien peut confirmer les verres compatibles et la véritable adaptation."
        ]
      },
      {
        "heading": "Comparez le prix total de la commande",
        "paragraphs": [
          "Sélectionnez la même catégorie de verres, les mêmes traitements et la même taille dans chaque boutique. Notez les montants avec livraison et éventuelles taxes. Le prix d'une monture nue ne se compare pas au prix d'une paire équipée de verres correcteurs."
        ]
      },
      {
        "heading": "Vérifiez les retours et la refabrication des verres",
        "paragraphs": [
          "Un remboursement, un avoir et une nouvelle fabrication de verres sont des solutions différentes si les lunettes ne conviennent pas. Lisez la politique du marchand avant de commander. Les restrictions peuvent varier entre montures, verres personnalisés et articles soldés."
        ],
        "bullets": [
          "Vérifiez si les verres correcteurs, les montures et les articles promotionnels ont des conditions distinctes.",
          "Notez le début du délai, le mode de remboursement et les frais de retour.",
          "Demandez qui effectue le réglage ou la refabrication et quelles preuves seront demandées."
        ]
      }
    ],
    "category": "Guide d'achat",
    "readTime": "4 min de lecture",
    "imageAlt": "Photo de monture utilisée pour comparer les dimensions et l'aspect.",
    "imageCaption": "Avant paiement, contrôlez les données du produit, l'ordonnance et les frais totaux.",
    "publishedLabel": "Publié le 28 octobre 2025",
    "updatedLabel": "Mis à jour le 16 novembre 2026",
    "tryOnLabel": "Prévisualiser une monture sur ma photo",
    "detectorLabel": "Détecter gratuitement ma forme de visage",
    "compareLabel": "Comparer des styles de montures",
    "widthLabel": "Comment comparer les largeurs de montures",
    "relatedLabel": "Guide d'essayage virtuel depuis une photo",
    "nextStepLabel": "Conservez le récapitulatif de commande, les mesures et la politique consultée. Pour un achat aux États-Unis, référez-vous aux explications officielles de la FTC.",
    "creditDisclosure": "Une photo ne vérifie ni la correction ni l'ajustement. L'essayage personnalisé nécessite un compte et des crédits ; le détecteur gratuit traite la photo dans le navigateur."
  },
  "ru": {
    "title": "Как заказать очки по рецепту онлайн: проверка перед покупкой",
    "description": "Подготовьте рецепт, сравните размеры оправ, линзы, полную стоимость и условия возврата до оформления заказа.",
    "sections": [
      {
        "heading": "Соберите данные для заказа",
        "paragraphs": [
          "Подготовьте действующий рецепт на очки и удобную пару для сравнения. Уточните у продавца, какие размеры нужны для выбранных линз. Если в форме заказа есть непонятный показатель, попросите выписавшего рецепт специалиста или оптика объяснить его до оплаты.",
          "Не вводите усреднённое межзрачковое расстояние (PD), если требуется ваше измерение: попросите измерить его. В США действуют правила FTC о выдаче рецепта после обследования с рефракцией; эти правила не следует автоматически переносить на другие страны. Проверяйте местное законодательство."
        ]
      },
      {
        "heading": "Сравните оправу с очками, которые уже носите",
        "paragraphs": [
          "Найдите три цифры на дужке. Например, 54 □ 16 140 обычно означает ширину линзы 54 мм, мост 16 мм и дужку 140 мм — не общую ширину оправы. Сравните размеры и полную ширину у продавца с удобными очками.",
          "Сохраните модель, размер, цвет и ссылку на товар. Виртуальная примерка с портретом анфас и фронтальным фото конкретной оправы помогает оценить вид, но совместимость линз и реальную посадку должны подтвердить продавец или оптик."
        ]
      },
      {
        "heading": "Проверьте цену полного заказа",
        "paragraphs": [
          "В двух магазинах выберите одинаковый тип линз, покрытий и размер оправы. Сравнивайте итоговую стоимость с доставкой и применимыми налогами. Цена одной оправы и цена очков с готовыми линзами не показывают объективную разницу."
        ]
      },
      {
        "heading": "Изучите возврат и изготовление новых линз",
        "paragraphs": [
          "Возврат денег, бонус на счёт магазина и изготовление линз заново дают разные права и варианты решения. До покупки прочитайте политику продавца: для индивидуальных линз, оправ и товаров со скидкой условия могут отличаться."
        ],
        "bullets": [
          "Уточните отдельные правила возврата для оправ, рецептурных линз и распродаж.",
          "Зафиксируйте начало срока возврата, способ компенсации и оплату обратной доставки.",
          "Спросите, кто выполняет регулировку оправы или переделку линз и что для этого потребуется."
        ]
      }
    ],
    "category": "Руководство по заказу",
    "readTime": "4 мин чтения",
    "imageAlt": "Фото оправы для сопоставления размера и внешнего вида.",
    "imageCaption": "Перед покупкой проверьте рецепт, параметры товара и полную сумму.",
    "publishedLabel": "Опубликовано 28 октября 2025 г.",
    "updatedLabel": "Обновлено 16 ноября 2026 г.",
    "tryOnLabel": "Примерить оправу на своём фото",
    "detectorLabel": "Бесплатно определить форму лица",
    "compareLabel": "Сравнить готовые формы",
    "widthLabel": "Как сравнивать ширину оправ",
    "relatedLabel": "Гид по примерке с фото",
    "nextStepLabel": "Сохраните подтверждение заказа, размеры и правила возврата. Для покупок по правилам США обратитесь к официальному разъяснению FTC.",
    "creditDisclosure": "Примерка на фото не проверяет рецепт или посадку. Индивидуальная генерация требует аккаунта и кредитов; бесплатный детектор работает в браузере."
  },
  "ja": {
    "title": "度付きメガネをネットで購入する前の確認ガイド",
    "description": "処方内容、フレームの寸法、レンズオプション、合計価格、返品条件を確認してから注文しましょう。",
    "sections": [
      {
        "heading": "注文に必要な情報をそろえる",
        "paragraphs": [
          "有効なメガネの処方情報と、掛け心地のよい手持ちのメガネを用意しましょう。希望のレンズに必要な測定値を販売店に確認します。注文画面に意味のわからない項目があれば、処方した専門家や眼鏡店に説明してもらってから注文してください。",
          "瞳孔間距離（PD）が必要な場合、平均値を適当に入力せず自分の測定値を確認します。米国では屈折検査後の処方箋交付についてFTCの規則がありますが、これは他の国に一律に適用されるものではありません。居住地と販売店のルールを確認してください。"
        ]
      },
      {
        "heading": "手持ちのメガネとフレームを比較する",
        "paragraphs": [
          "今のメガネのテンプル内側にある3つの数字を見ます。例えば 54 □ 16 140 は通常レンズ幅54mm、ブリッジ幅16mm、テンプル長140mmを意味し、フロント全体の幅ではありません。販売店の寸法図も参照し、手持ちのメガネと比較しましょう。",
          "型番、サイズ、色、商品リンクを保存してください。自分の正面顔写真と商品の正面画像で外観をプレビューできますが、実際に度付きレンズが対応するか、掛け心地が合うかは眼鏡店・販売店で確認する必要があります。"
        ]
      },
      {
        "heading": "レンズ込みの合計金額を比べる",
        "paragraphs": [
          "2つの店舗で同じ種類のレンズ、コーティング、フレームサイズを選んでから総額を比べます。送料や適用される税金も含めて確認しましょう。フレーム単体の価格と完成した度付きメガネの価格を比べると判断を誤ります。"
        ]
      },
      {
        "heading": "返品・レンズ再製作の条件を確認する",
        "paragraphs": [
          "返品時の返金、店舗クレジット、レンズの再製作はそれぞれ異なる対応です。支払い前に販売店の規約を開き、処方レンズやセール品などに別の条件がないか確認してください。"
        ],
        "bullets": [
          "処方レンズ、フレーム、セール商品で返品条件が異なるか調べる。",
          "返品期限の開始日、返金方法、返送費用の負担者を記録する。",
          "フィッティング調整やレンズ再製作の窓口と必要書類を確認する。"
        ]
      }
    ],
    "category": "購入チェックリスト",
    "readTime": "約4分",
    "imageAlt": "サイズと外観を比較するためのフレーム写真。",
    "imageCaption": "購入前に処方、商品サイズ、送料を含む総額を確認しましょう。",
    "publishedLabel": "公開：2025年10月28日",
    "updatedLabel": "更新：2026年11月16日",
    "tryOnLabel": "自分の写真でフレームを試す",
    "detectorLabel": "無料で顔型を確認する",
    "compareLabel": "内蔵フレームを比較する",
    "widthLabel": "フレーム幅の確認方法",
    "relatedLabel": "写真でのメガネ試着ガイド",
    "nextStepLabel": "注文内容、サイズ、返品規約を保存しましょう。米国の注文についてはFTCの公式説明も確認してください。",
    "creditDisclosure": "写真での試着は度数や実際の掛け心地を検証しません。カスタムAI試着にはログインとクレジット、無料顔型診断にはブラウザーだけを使います。"
  },
  "ar": {
    "title": "دليل شراء النظارات الطبية عبر الإنترنت قبل الدفع",
    "description": "تحقّق من الوصفة ومقاسات الإطار وخيارات العدسات والسعر الإجمالي وشروط الإرجاع قبل تقديم الطلب.",
    "sections": [
      {
        "heading": "اجمع البيانات اللازمة للطلب",
        "paragraphs": [
          "ابدأ بوصفة نظارات سارية وبنظارة مريحة لديك للمقارنة. اسأل البائع عن القياسات اللازمة للعدسات التي اخترتها. إذا طُلب منك رقم لا تعرف معناه، فاستشر الطبيب الذي كتب الوصفة أو اختصاصي البصريات قبل تقديم الطلب.",
          "لا تدخل متوسطًا تقديريًا للمسافة بين الحدقتين (PD) إذا طُلب قياسك الشخصي؛ اطلب قياسًا صحيحًا. في الولايات المتحدة تنطبق قواعد FTC بشأن تسليم الوصفة بعد فحص الانكسار، لكنها لا تنطبق تلقائيًا على الدول الأخرى. راجع الأنظمة المحلية."
        ]
      },
      {
        "heading": "قارن الإطار بنظارة تملكها بالفعل",
        "paragraphs": [
          "ابحث عن ثلاثة أرقام داخل ذراع نظارتك. على سبيل المثال، 54 □ 16 140 تعني عادة عرض العدسة 54 مم والجسر 16 مم وطول الذراع 140 مم؛ وهي ليست العرض الكلي للإطار. قارنها، ومعها العرض الكامل إن كان متاحًا، بمقاسات نظارتك الحالية.",
          "دوّن اسم الطراز والمقاس واللون ورابط المنتج. يمكنك مقارنة المظهر بصورة أمامية لوجهك وصورة أمامية للإطار المحدد. تُظهر المعاينة الشكل فقط، بينما يتحقق البائع أو اختصاصي البصريات من توافق العدسات والملاءمة الفعلية."
        ]
      },
      {
        "heading": "قارن السعر الكامل للطلب",
        "paragraphs": [
          "اختر نوع العدسات والطلاءات والمقاس نفسه لدى المتجرين قبل مقارنة السعر. احسب الشحن والضرائب المطبّقة. المقارنة بين سعر إطار فقط وسعر نظارة جاهزة بعدساتها قد تعطي انطباعًا مضللًا."
        ]
      },
      {
        "heading": "راجع شروط الإرجاع وإعادة صنع العدسات",
        "paragraphs": [
          "استرداد المال ورصيد المتجر وإعادة تصنيع العدسات خيارات مختلفة عند وجود مشكلة. افتح سياسة البائع قبل الدفع، فقد تختلف الأحكام بين الإطار والعدسات المصنوعة حسب الوصفة والمنتجات المخفّضة."
        ],
        "bullets": [
          "تحقق مما إذا كانت للعدسات الطبية والإطارات والعروض شروط إرجاع مختلفة.",
          "سجّل تاريخ بدء فترة الإرجاع وطريقة الاسترداد والجهة التي تتحمل تكلفة الشحن.",
          "اسأل من يتولى تعديل الإطار أو إعادة صنع العدسات وما المستندات المطلوبة."
        ]
      }
    ],
    "category": "دليل الطلب",
    "readTime": "4 دقائق قراءة",
    "imageAlt": "صورة إطار مرجعية لمقارنة القياسات والمظهر.",
    "imageCaption": "تحقّق من الوصفة وأرقام المقاسات والتكلفة الكاملة قبل الشراء.",
    "publishedLabel": "نُشر في 28 أكتوبر 2025",
    "updatedLabel": "حُدّث في 16 نوفمبر 2026",
    "tryOnLabel": "تجربة إطار على صورتي",
    "detectorLabel": "معرفة شكل وجهي مجانًا",
    "compareLabel": "مقارنة أشكال جاهزة",
    "widthLabel": "مقارنة عرض الإطارات",
    "relatedLabel": "دليل تجربة النظارات من صورة",
    "nextStepLabel": "احتفظ بملخص الطلب والقياسات وشروط الإرجاع. تتوفر معلومات FTC الرسمية للمشتريات المشمولة بقواعد الولايات المتحدة.",
    "creditDisclosure": "المعاينة بالصور لا تتحقق من الوصفة أو الملاءمة. التجربة المخصصة تتطلب حسابًا ورصيدًا، وكاشف شكل الوجه المجاني يعمل في المتصفح."
  },
  "pt": {
    "title": "Como comprar óculos graduados online: guia de verificação",
    "description": "Confirme a receita, as medidas, as lentes, o preço completo e as condições de devolução antes de encomendar óculos.",
    "sections": [
      {
        "heading": "Reúna os dados para a encomenda",
        "paragraphs": [
          "Comece com uma receita válida e um par de óculos confortável. Pergunte ao vendedor que medidas são necessárias para as lentes escolhidas. Se algum campo do formulário lhe for desconhecido, peça ao profissional que passou a receita ou a um ótico que o esclareça antes de encomendar.",
          "Não introduza uma distância pupilar (DP) média se lhe pedirem a sua medição. Peça um valor medido. Nos Estados Unidos existem regras da FTC sobre a entrega de prescrições após refração; não se aplicam automaticamente a Portugal ou outros países. Consulte as regras locais."
        ]
      },
      {
        "heading": "Compare a armação com uns óculos que já usa",
        "paragraphs": [
          "Procure três números numa haste. Uma marcação como 54 □ 16 140 indica normalmente largura da lente 54 mm, ponte 16 mm e haste 140 mm — não a largura total. Compare esses valores e a largura completa que o vendedor indicar com uns óculos confortáveis.",
          "Guarde modelo, tamanho, cor e ligação ao produto. Pode comparar a aparência com o seu retrato frontal e uma fotografia de frente da armação específica. A pré-visualização mostra a silhueta, não confirma a compatibilidade das lentes nem o ajuste físico."
        ]
      },
      {
        "heading": "Compare o preço completo da encomenda",
        "paragraphs": [
          "Em duas lojas, selecione o mesmo tipo de lentes, tratamentos e tamanho de armação. Compare o total incluindo envio e impostos aplicáveis. O preço de uma armação sem lentes não é comparável ao de óculos graduados completos."
        ]
      },
      {
        "heading": "Verifique devoluções e substituição de lentes",
        "paragraphs": [
          "Um reembolso, um crédito em loja e uma substituição de lentes oferecem soluções diferentes. Consulte a política antes da compra, especialmente para lentes personalizadas e artigos em promoção."
        ],
        "bullets": [
          "Confirme regras específicas para lentes graduadas, armação e artigos em saldo.",
          "Registe o início do prazo de devolução, a forma de reembolso e quem paga o transporte.",
          "Pergunte quem faz ajustes ou refabrica as lentes e que documentos são necessários."
        ]
      }
    ],
    "category": "Guia de compra",
    "readTime": "4 min de leitura",
    "imageAlt": "Fotografia de armação para comparar dimensões e estilo.",
    "imageCaption": "Verifique a receita, as medidas e os custos reais antes de pagar.",
    "publishedLabel": "Publicado em 28 de outubro de 2025",
    "updatedLabel": "Atualizado em 16 de novembro de 2026",
    "tryOnLabel": "Experimentar uma armação na fotografia",
    "detectorLabel": "Descobrir gratuitamente o formato do rosto",
    "compareLabel": "Comparar modelos de armações",
    "widthLabel": "Como comparar larguras de armação",
    "relatedLabel": "Guia de experimentação virtual com foto",
    "nextStepLabel": "Guarde o resumo da encomenda, as medidas e a política de devolução. A orientação FTC aplica-se às compras abrangidas pelas regras dos EUA.",
    "creditDisclosure": "A experimentação em fotografia não confirma a graduação nem o conforto. A IA personalizada requer conta e créditos; o detetor gratuito funciona no navegador."
  },
  "id": {
    "title": "Panduan membeli kacamata resep secara online",
    "description": "Periksa resep, ukuran bingkai, pilihan lensa, biaya total, serta aturan pengembalian sebelum memesan kacamata.",
    "sections": [
      {
        "heading": "Siapkan data untuk pesanan",
        "paragraphs": [
          "Mulailah dengan resep kacamata yang masih berlaku dan kacamata yang nyaman dipakai. Tanyakan kepada penjual pengukuran yang diperlukan untuk lensa pilihan Anda. Jika formulir meminta angka yang tidak Anda pahami, tanyakan dulu kepada pemberi resep atau optik sebelum memesan.",
          "Jangan memasukkan angka rata-rata jarak antarpupil (PD) jika penjual meminta ukuran pribadi Anda. Mintalah pengukuran yang benar. Di Amerika Serikat ada aturan FTC terkait penyerahan resep setelah pemeriksaan refraksi; aturan tersebut tidak otomatis berlaku di Indonesia. Periksa ketentuan setempat."
        ]
      },
      {
        "heading": "Bandingkan bingkai dengan kacamata yang Anda miliki",
        "paragraphs": [
          "Cari tiga angka pada tangkai kacamata lama. Misalnya 54 □ 16 140 biasanya berarti lebar lensa 54 mm, jembatan 16 mm, dan tangkai 140 mm, bukan lebar total. Bandingkan dengan ukuran lengkap yang disediakan toko.",
          "Simpan nama model, ukuran, warna, dan tautan produk. Untuk membandingkan tampilan, gunakan foto wajah dari depan dan gambar bingkai tertentu dari depan. Pratinjau hanya menunjukkan siluet; penjual atau optik harus memeriksa kecocokan lensa resep serta kenyamanan fisik."
        ]
      },
      {
        "heading": "Bandingkan harga pesanan yang lengkap",
        "paragraphs": [
          "Di kedua toko, pilih jenis lensa, lapisan, dan ukuran bingkai yang sama, lalu bandingkan biaya total termasuk ongkir dan pajak yang berlaku. Harga bingkai tanpa lensa tidak setara dengan harga kacamata resep yang sudah jadi."
        ]
      },
      {
        "heading": "Periksa retur dan pembuatan ulang lensa",
        "paragraphs": [
          "Uang kembali, saldo toko, dan penggantian lensa adalah solusi yang berbeda ketika kacamata tidak sesuai. Baca aturan penjual sebelum membayar, terutama untuk lensa pesanan khusus dan barang diskon."
        ],
        "bullets": [
          "Pastikan aturan retur untuk lensa resep, bingkai, dan barang promosi.",
          "Catat awal masa retur, cara pengembalian dana, dan pihak yang menanggung ongkos kirim balik.",
          "Tanyakan siapa yang menangani penyesuaian atau pembuatan ulang lensa dan dokumen yang diperlukan."
        ]
      }
    ],
    "category": "Panduan belanja",
    "readTime": "4 menit baca",
    "imageAlt": "Foto bingkai untuk membandingkan ukuran dan tampilan.",
    "imageCaption": "Periksa resep, ukuran produk, dan biaya total sebelum memesan.",
    "publishedLabel": "Terbit 28 Oktober 2025",
    "updatedLabel": "Diperbarui 16 November 2026",
    "tryOnLabel": "Coba bingkai pada foto saya",
    "detectorLabel": "Cari bentuk wajah saya secara gratis",
    "compareLabel": "Bandingkan gaya bingkai",
    "widthLabel": "Panduan lebar bingkai",
    "relatedLabel": "Panduan coba kacamata dari foto",
    "nextStepLabel": "Simpan rincian pesanan, ukuran, dan aturan retur. Panduan FTC hanya berlaku untuk pembelian yang tunduk pada aturan Amerika Serikat.",
    "creditDisclosure": "Pratinjau tidak memeriksa resep atau kenyamanan. Coba kacamata kustom memerlukan akun dan kredit; pendeteksi bentuk wajah gratis berjalan di browser."
  },
  "de": {
    "title": "Korrektionsbrille online kaufen: die Checkliste",
    "description": "Prüfen Sie Rezept, Fassungsmaße, Glasoptionen, Endpreis und Rückgaberegeln, bevor Sie eine Brille online bestellen.",
    "sections": [
      {
        "heading": "Sammeln Sie die Angaben für Ihre Bestellung",
        "paragraphs": [
          "Beginnen Sie mit einer gültigen Brillenverordnung und einer bequemen Fassung als Vergleich. Fragen Sie beim Händler nach den Messwerten für die gewünschten Gläser. Wenn ein Bestellfeld unklar ist, lassen Sie es vor der Bestellung von der verordnenden Fachperson oder einem Optiker erklären.",
          "Geben Sie keinen durchschnittlichen Pupillenabstand (PD) an, wenn Ihr persönlicher Wert gefragt wird; lassen Sie ihn messen. In den USA gelten FTC-Regeln zur Herausgabe der Verordnung nach einer Refraktionsuntersuchung. Diese Regeln gelten nicht automatisch in Deutschland. Beachten Sie die lokalen Bestimmungen."
        ]
      },
      {
        "heading": "Vergleichen Sie die Fassung mit Ihrer bisherigen Brille",
        "paragraphs": [
          "Auf dem Bügel stehen häufig drei Zahlen. Eine Angabe wie 54 □ 16 140 meint meist Glasbreite 54 mm, Stegweite 16 mm und Bügellänge 140 mm, nicht die gesamte Frontbreite. Vergleichen Sie auch die Gesamtbreite, falls der Händler sie nennt, mit einer bequemen Fassung.",
          "Notieren Sie Modellnummer, Größe, Farbe und Produktlink. Mit einem Frontalporträt und dem frontalen Produktfoto der gewünschten Fassung können Sie den Stil vergleichen. Die Vorschau bestätigt weder die Eignung für Ihre Gläser noch die tatsächliche Passform; das muss der Händler oder Optiker prüfen."
        ]
      },
      {
        "heading": "Vergleichen Sie den vollständigen Bestellpreis",
        "paragraphs": [
          "Wählen Sie bei beiden Händlern die gleiche Glasart, Beschichtung und Fassungsgröße und vergleichen Sie den Endpreis einschließlich Versand und anfallender Steuern. Ein Preis nur für die Fassung ist nicht mit einer fertig verglasten Brille vergleichbar."
        ]
      },
      {
        "heading": "Prüfen Sie Rückgabe und Neuanfertigung der Gläser",
        "paragraphs": [
          "Geld zurück, Shopguthaben und eine erneute Fertigung der Gläser sind unterschiedliche Leistungen. Lesen Sie vor dem Kauf die Regeln, besonders für individuell gefertigte Korrektionsgläser oder reduzierte Ware."
        ],
        "bullets": [
          "Prüfen Sie, ob für Gläser, Fassung und Angebote verschiedene Rückgaberegeln gelten.",
          "Notieren Sie Fristbeginn, Erstattungsart und die Kosten einer Rücksendung.",
          "Fragen Sie nach Anpassung, Neuanfertigung der Gläser und erforderlichen Unterlagen."
        ]
      }
    ],
    "category": "Kaufberatung",
    "readTime": "4 Min. Lesezeit",
    "imageAlt": "Fassungsfoto zum Vergleich von Größe und Stil.",
    "imageCaption": "Prüfen Sie Rezept, Produktmaße und den vollen Preis vor dem Kauf.",
    "publishedLabel": "Veröffentlicht am 28. Oktober 2025",
    "updatedLabel": "Aktualisiert am 16. November 2026",
    "tryOnLabel": "Fassung auf meinem Foto testen",
    "detectorLabel": "Gesichtsform kostenlos bestimmen",
    "compareLabel": "Fassungsstile vergleichen",
    "widthLabel": "Fassungsbreiten vergleichen",
    "relatedLabel": "Ratgeber für Foto-Brillenanprobe",
    "nextStepLabel": "Bewahren Sie die Bestellung, Maße und Rückgaberegeln auf. Die FTC-Hinweise beziehen sich auf Bestellungen unter US-Vorschriften.",
    "creditDisclosure": "Eine Fotovorschau prüft weder Sehstärke noch Passform. Individuelle KI-Anproben benötigen Anmeldung und Guthaben; der kostenlose Detektor läuft im Browser."
  }
}

export function getNativePrescriptionShoppingGuide(locale: Locale): NativeEditorialCopy | null {
  return locale === 'en' ? null : copies[locale]
}
