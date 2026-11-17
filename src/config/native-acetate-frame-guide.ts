import { getNativePrescriptionShoppingGuide } from '@/config/native-prescription-shopping-guide'
import type { Locale } from '@/i18n'
import { makeNativeRetailArticle, type NativeBlogLocale, type LocalizedRetailArticle } from '@/config/native-retail-guide-common'
import type { NativeEditorialCopy } from '@/components/blog/NativeEditorialArticle'

/** Full source-faithful translations. Acetate is a subtype of plastic, not the opposite. */
const translations: Record<NativeBlogLocale, LocalizedRetailArticle> = {
  "id": {
    "title": "Asetat vs plastik pada bingkai kacamata: apa bedanya?",
    "description": "Asetat adalah salah satu jenis plastik. Pahami istilah zyl, perbedaan lembaran asetat dan bingkai cetak, serta cara membandingkan kualitas sebelum membeli.",
    "category": "Panduan bahan bingkai",
    "readTime": "5 menit baca",
    "imageAlt": "Contoh bingkai kacamata dengan ketebalan dan warna berbeda, bukan bukti jenis bahan.",
    "imageCaption": "Contoh gaya dari VisuTry menunjukkan warna dan ketebalan bingkai; foto saja tidak bisa mengidentifikasi jenis plastik.",
    "sections": [
      {
        "heading": "Apa arti asetat pada label kacamata?",
        "paragraphs": [
          "Selulosa asetat adalah plastik berbasis selulosa dari bahan seperti kayu atau kapas. Di industri kacamata, istilah zyl umumnya mengacu pada selulosa asetat. Penjual bisa menyebut bingkai yang sama sebagai zyl, asetat, atau cukup plastik. Jadi, asetat dan plastik bukan dua kelompok bahan yang selalu saling berlawanan. Mintalah nama bahan yang tepat, termasuk bahan bagian depan dan tangkai."
        ]
      },
      {
        "heading": "Lembaran asetat dan bingkai plastik cetak",
        "paragraphs": [
          "Asetat berbentuk lembaran dapat memiliki beberapa lapis warna. Produsen memotong bagian depan bingkai dari lembaran, lalu membentuk dan memolesnya. Hasilnya dapat berupa sisi transparan atau pola tortoiseshell yang berbeda dari satu bingkai ke bingkai lainnya. Contoh proses bahan dapat dilihat pada informasi produsen Mazzucchelli.",
          "Pada pencetakan injeksi, bahan plastik dibentuk dalam cetakan. Produsen dapat memakai nilon atau plastik lain. Istilah injection-molded menjelaskan proses produksi, sedangkan nilon dan asetat menunjuk pada bahan. Jika deskripsi toko hanya menulis prosesnya, tanyakan komposisi bagian depan dan tangkai."
        ]
      },
      {
        "heading": "Cara membandingkan dua bingkai sebelum membayar",
        "paragraphs": [
          "Sebagai contoh, bingkai depan asetat yang lebar dengan tangkai tebal mungkin memiliki bobot berbeda dari bingkai nilon cetak yang tipis walaupun lebar lensanya sama. Bandingkan kedua model dalam ukuran yang benar, bukan hanya berdasarkan nama bahan."
        ],
        "bullets": [
          "Ingin lebih ringan? Mintalah berat bingkai dalam ukuran yang dipilih dan tanyakan apakah berat itu sudah termasuk lensa.",
          "Ingin jembatan hidung nyaman? Bandingkan area yang menyentuh hidung dengan kacamata yang sudah cocok, lalu tanyakan kepada optik bagian mana yang dapat disetel.",
          "Ingin pola khas? Lihat foto dari depan, sisi dan tangkai; tanyakan apakah hasil akhir tiap produk berbeda.",
          "Untuk pemakaian lama, periksa konstruksi engsel, ketersediaan tangkai pengganti dan jaminan toko jika ada bagian rusak."
        ]
      },
      {
        "heading": "Bandingkan tampilan pada wajah Anda",
        "paragraphs": [
          "Gunakan foto wajah yang jelas dan gambar bingkai dari depan untuk membandingkan bentuk serta warna. Pratinjau hanya menunjukkan tampilan, bukan komposisi bahan, berat aktual, atau tekanan jembatan hidung. Pastikan spesifikasi dan kecocokan fisik bersama penjual atau optik, termasuk kebutuhan lensa resep."
        ]
      }
    ],
    "sources": [
      {
        "label": "Tinjauan bahan bingkai kacamata",
        "url": "https://onlinelibrary.wiley.com/doi/10.1111/j.1600-0536.2006.00791.x"
      },
      {
        "label": "Proses pembuatan lembaran asetat Mazzucchelli",
        "url": "https://www.mazzucchelli1849.it/pages/materials-and-processing-creative-case"
      }
    ]
  },
  "ar": {
    "title": "إطارات النظارات من الأسيتات أم البلاستيك: كيف تقارن؟",
    "description": "الأسيتات نوع من البلاستيك. تعرّف على معنى zyl والفرق بين ألواح الأسيتات والإطارات المصبوبة وما يجب فحصه قبل الشراء.",
    "category": "دليل مواد الإطارات",
    "readTime": "5 دقائق قراءة",
    "imageAlt": "مثال لإطارات تختلف في السمك واللون، وليس وسيلة لتحديد المادة من الصورة.",
    "imageCaption": "يوضح مثال VisuTry لون الإطار وسماكته؛ لا يمكن معرفة نوع البلاستيك من الصورة وحدها.",
    "sections": [
      {
        "heading": "ماذا يعني الأسيتات في وصف الإطار؟",
        "paragraphs": [
          "أسيتات السليلوز نوع من البلاستيك يُصنع باستخدام سليلوز مصادره مثل الخشب أو القطن. في صناعة النظارات يشير اسم zyl غالبًا إلى أسيتات السليلوز. قد يصف متجر الإطار نفسه بأنه zyl أو أسيتات أو بلاستيك فقط؛ لذلك ليست الأسيتات والبلاستيك فئتين متضادتين بالضرورة. اطلب اسم المادة المحدد لكل من واجهة الإطار وذراعيه."
        ]
      },
      {
        "heading": "ألواح الأسيتات مقابل الإطارات المصبوبة",
        "paragraphs": [
          "يمكن تصنيع ألواح الأسيتات من طبقات متعددة الألوان. تُقطع واجهة الإطار من اللوح ثم تُشكّل وتُصقل، وقد تظهر حواف شفافة أو نقوش شبيهة بصدفة السلحفاة تختلف بين قطعتين. يشرح مورّد المواد Mazzucchelli طريقة إنتاج هذه الألواح المزخرفة.",
          "أما القولبة بالحقن فتُشكّل جزءًا من الإطار داخل قالب وقد تستخدم النايلون أو مادة بلاستيكية أخرى. كلمة مصبوب بالحقن تصف طريقة التصنيع؛ والنايلون أو الأسيتات اسما مادتين. إذا ذكر البائع طريقة الصنع فقط، فاسأله عن مادة الواجهة والأذرع."
        ]
      },
      {
        "heading": "أربع نقاط لمقارنة إطارين قبل الشراء",
        "paragraphs": [
          "مثلًا، قد يختلف وزن إطار عريض من الأسيتات ذي أذرع سميكة كثيرًا عن إطار رفيع من النايلون المصبوب حتى عند تساوي عرض العدسات. قارن النسختين بالمقاس نفسه ولا تستنتج الراحة أو القيمة من اسم المادة وحده."
        ],
        "bullets": [
          "للوزن الأخف: اطلب وزن الإطار بالمقاس الذي ستشتريه، وتحقّق هل يشمل العدسات.",
          "لجسر مريح: قارن موضع ملامسة الأنف بنظارتك المريحة، واسأل اختصاصي البصريات عن إمكان تعديل الإطار.",
          "للتشطيب المميز: راجع صور الأمام والحافة والذراع واسأل هل يختلف النمط من قطعة لأخرى.",
          "للاستخدام الطويل: افحص المفصلات وتوفّر الأذرع البديلة وما تغطيه سياسة الضمان عند الكسر."
        ]
      },
      {
        "heading": "شاهد اللون والشكل على وجهك",
        "paragraphs": [
          "استخدم صورة وجه واضحة وصورة أمامية للمنتج لمقارنة اللون وشكل الحافة. المعاينة لا تكشف تركيب المادة أو الوزن الفعلي أو ضغط الجسر على الأنف. تأكد من المادة والمقاس والملاءمة عند البائع أو اختصاصي البصريات، خاصةً إذا كنت تحتاج إلى عدسات طبية."
        ]
      }
    ],
    "sources": [
      {
        "label": "مراجعة علمية لمواد إطارات النظارات",
        "url": "https://onlinelibrary.wiley.com/doi/10.1111/j.1600-0536.2006.00791.x"
      },
      {
        "label": "إنتاج ألواح الأسيتات لدى Mazzucchelli",
        "url": "https://www.mazzucchelli1849.it/pages/materials-and-processing-creative-case"
      }
    ]
  },
  "ru": {
    "title": "Ацетат или пластик для оправы: что сравнивать при покупке",
    "description": "Ацетат — разновидность пластика. Разберите термин zyl, отличие листового ацетата от литья и проверьте вес, мост, покрытие и фурнитуру.",
    "category": "Материалы оправ",
    "readTime": "5 мин чтения",
    "imageAlt": "Пример оправ разной толщины и цвета, не подтверждающий материал по фото.",
    "imageCaption": "Пример VisuTry показывает оттенок и толщину ободка. По одному снимку нельзя определить вид пластика.",
    "sections": [
      {
        "heading": "Что означает слово «ацетат» на этикетке?",
        "paragraphs": [
          "Ацетат целлюлозы — пластик на основе целлюлозы, получаемой, например, из древесины или хлопка. В оптике слово zyl обычно обозначает именно ацетат целлюлозы. Один магазин может назвать оправу «zyl», другой — «ацетат» или просто «пластик». Эти названия не всегда описывают разные материалы. Уточняйте полный состав фронтальной части и дужек."
        ]
      },
      {
        "heading": "Листовой ацетат и литые оправы",
        "paragraphs": [
          "Листовой ацетат бывает многослойным и разноцветным. Переднюю часть вырезают из листа, затем формуют и полируют. Так возникают полупрозрачные кромки или индивидуальные пятнистые узоры «черепахового» цвета. Поставщик Mazzucchelli показывает, как изготавливаются цветные ацетатные листы.",
          "При литье под давлением детали формируются в пресс-форме. Для этого могут применять нейлон или другие пластики. «Литая» — характеристика технологии, а «нейлон» и «ацетат» — материалы. Если в карточке есть лишь способ изготовления, запросите материал фронта и дужек."
        ]
      },
      {
        "heading": "Четыре критерия сравнения перед оплатой",
        "paragraphs": [
          "Толстая широкая ацетатная рамка с массивными дужками может весить совсем иначе, чем тонкая литая нейлоновая оправа даже при одинаковой ширине линз. Сравнивайте модели своего размера: название материала само по себе не говорит о комфорте и прочности."
        ],
        "bullets": [
          "Если важен лёгкий вес, уточните массу именно вашего размера и включены ли линзы.",
          "Для удобного моста сравните место контакта с носом с привычной оправой и спросите оптика о регулировках.",
          "Для интересного рисунка посмотрите фото фронта, кромки и дужек, а также возможные различия между экземплярами.",
          "Для долгой службы проверьте конструкцию шарниров, наличие запасных дужек и условия гарантии при поломке."
        ]
      },
      {
        "heading": "Сравните внешний вид на своём лице",
        "paragraphs": [
          "Возьмите чёткий портрет и фотографию оправы строго спереди, чтобы оценить цвет и контур. Виртуальная картинка не подтвердит состав пластика, реальный вес или давление моста. Материал и посадку следует уточнить у продавца или оптика, особенно при заказе линз по рецепту."
        ]
      }
    ],
    "sources": [
      {
        "label": "Обзор материалов очковых оправ",
        "url": "https://onlinelibrary.wiley.com/doi/10.1111/j.1600-0536.2006.00791.x"
      },
      {
        "label": "Производство листового ацетата Mazzucchelli",
        "url": "https://www.mazzucchelli1849.it/pages/materials-and-processing-creative-case"
      }
    ]
  },
  "de": {
    "title": "Acetat oder Kunststoff bei Brillenfassungen: Was ist der Unterschied?",
    "description": "Acetat ist eine Kunststoffart. Erfahren Sie, was Zyl bedeutet, wie Plattenacetat von Spritzguss abweicht und welche Kaufkriterien wichtig sind.",
    "category": "Fassungsmaterialien",
    "readTime": "5 Min. Lesezeit",
    "imageAlt": "Beispiel für unterschiedlich dicke und gefärbte Fassungen; das Material ist im Foto nicht bestimmbar.",
    "imageCaption": "Das VisuTry-Beispiel verdeutlicht Farbe und Randstärke. Ein Foto allein zeigt nicht, welcher Kunststoff verwendet wurde.",
    "sections": [
      {
        "heading": "Was bedeutet Acetat bei einer Brille?",
        "paragraphs": [
          "Celluloseacetat ist ein Kunststoff, der unter anderem aus Cellulose von Holz oder Baumwolle hergestellt wird. In der Brillenbranche wird mit Zyl meist Celluloseacetat bezeichnet. Eine Fassung kann deshalb bei einem Händler als Zyl, Acetat oder allgemein als Kunststoff stehen. Acetat und Kunststoff sind keine gegensätzlichen Materialgruppen. Fragen Sie nach dem genauen Material von Vorderteil und Bügeln."
        ]
      },
      {
        "heading": "Plattenacetat und im Spritzguss gefertigte Fassungen",
        "paragraphs": [
          "Acetatplatten können verschiedene Farbschichten enthalten. Das Vorderteil wird aus einer Platte ausgeschnitten, geformt und poliert. Dadurch entstehen durchscheinende Kanten oder marmorierte Schildpattmuster, die von Fassung zu Fassung unterschiedlich sein können. Der Zulieferer Mazzucchelli erläutert die Herstellung solcher dekorativen Platten.",
          "Beim Spritzguss entsteht ein Bauteil in einer Form, etwa aus Nylon oder einem anderen Kunststoff. «Spritzgegossen» bezeichnet das Verfahren, «Nylon» beziehungsweise «Acetat» das Material. Wenn ein Angebot nur das Verfahren nennt, erkundigen Sie sich nach dem Material von Front und Bügeln."
        ]
      },
      {
        "heading": "Vier Fragen beim Vergleich zweier Fassungen",
        "paragraphs": [
          "Eine breite Acetatfront mit kräftigen Bügeln kann deutlich anders wiegen als ein schmaler gespritzter Nylonrahmen, auch wenn die Glasbreite gleich ist. Vergleichen Sie jeweils die tatsächlich angebotene Größe, statt Komfort oder Wert aus dem Materialnamen abzuleiten."
        ],
        "bullets": [
          "Gewicht: Fragen Sie nach dem Gewicht Ihrer Größe und ob die angegebene Masse die Gläser einschließt.",
          "Nasensteg: Vergleichen Sie die Kontaktfläche mit einer bequemen Brille und klären Sie, welche Anpassungen ein Optiker vornehmen kann.",
          "Oberfläche: Prüfen Sie Bilder von Front, Kante und Bügel und fragen Sie, ob sich das Muster zwischen Exemplaren unterscheidet.",
          "Haltbarkeit: Prüfen Sie Scharniere, Ersatzbügel und die Bedingungen bei Beschädigung."
        ]
      },
      {
        "heading": "Beurteilen Sie die Fassung auf Ihrem Gesicht",
        "paragraphs": [
          "Vergleichen Sie Farbe und Silhouette mit einem klaren Porträt und dem frontalen Produktbild. Eine Bildvorschau kann den Kunststoff, das tatsächliche Gewicht und den Stegdruck nicht bestimmen. Bestätigen Sie Materialien, Maßangaben und Passform beim Händler oder Optiker, besonders bei Korrektionsgläsern."
        ]
      }
    ],
    "sources": [
      {
        "label": "Fachübersicht zu Materialien von Brillenfassungen",
        "url": "https://onlinelibrary.wiley.com/doi/10.1111/j.1600-0536.2006.00791.x"
      },
      {
        "label": "Acetatplatten und Verarbeitung bei Mazzucchelli",
        "url": "https://www.mazzucchelli1849.it/pages/materials-and-processing-creative-case"
      }
    ]
  },
  "ja": {
    "title": "アセテートとプラスチック製メガネの違いと選び方",
    "description": "アセテートはプラスチックの一種です。ザイル（zyl）の意味、板材と射出成形の違い、重さやフィット感の確認点を解説します。",
    "category": "フレーム素材ガイド",
    "readTime": "約5分",
    "imageAlt": "色とリムの厚さが異なるフレーム例。写真だけでは素材は特定できません。",
    "imageCaption": "VisuTryの作例では色とリムの厚さを比べられますが、画像からプラスチックの種類は判別できません。",
    "sections": [
      {
        "heading": "アセテートとはどんなフレーム素材？",
        "paragraphs": [
          "セルロースアセテートは、木材や綿などに由来するセルロースを用いたプラスチックの一種です。メガネ業界で「ザイル（zyl）」と呼ぶ場合も通常はセルロースアセテートを指します。同じフレームが店によって「ザイル」「アセテート」「プラスチック」と表記されることもあります。素材の名称だけで別物と判断せず、フロントとテンプルの正確な材質を確認しましょう。"
        ]
      },
      {
        "heading": "板状アセテートと射出成形の違い",
        "paragraphs": [
          "板状アセテートには色の異なる層が重なったものがあります。板からフロントを切り出し、成形して磨くため、透ける縁やべっ甲調の模様が現れ、同じ製品でも個体差が出ることがあります。素材メーカーのMazzucchelliは、模様入りアセテート板の加工工程を紹介しています。",
          "射出成形は型の中でパーツを作る製法です。ナイロンなどのプラスチックが使われます。「射出成形」は製法、「ナイロン」「アセテート」は材質名であり、同じ分類ではありません。製法しか書かれていない商品はフロントとテンプルの素材を販売店に質問しましょう。"
        ]
      },
      {
        "heading": "購入前に4つのポイントを比較",
        "paragraphs": [
          "厚いアセテートのフロントと太いテンプルを持つメガネは、同じレンズ幅でも細いナイロン成形フレームとは重さが大きく異なる場合があります。同じサイズで比べ、素材ラベルだけで快適さや価値を決めないでください。"
        ],
        "bullets": [
          "軽さ：購入するサイズの重量を確認し、レンズを含む値かを尋ねる。",
          "鼻へのフィット：手持ちの掛けやすいメガネと接触面を比べ、調整できる部分を眼鏡店に確認する。",
          "仕上がり：正面・縁・テンプルの写真を見て、模様の個体差も確認する。",
          "長期使用：蝶番の作り、交換用テンプル、破損時の対応や保証を確かめる。"
        ]
      },
      {
        "heading": "自分の顔で色と形を見比べる",
        "paragraphs": [
          "正面から撮った顔写真と商品の正面画像を使えば、リムの色や形を比較できます。ただし素材、実際の重量、鼻への圧迫感は画像ではわかりません。度付きレンズを含め、材質・寸法・フィッティングは販売店や眼鏡店で確認しましょう。"
        ]
      }
    ],
    "sources": [
      {
        "label": "メガネフレーム素材の文献レビュー",
        "url": "https://onlinelibrary.wiley.com/doi/10.1111/j.1600-0536.2006.00791.x"
      },
      {
        "label": "Mazzucchelliのアセテート板製造工程",
        "url": "https://www.mazzucchelli1849.it/pages/materials-and-processing-creative-case"
      }
    ]
  },
  "es": {
    "title": "Monturas de acetato o plástico: cómo compararlas antes de comprar",
    "description": "El acetato es un tipo de plástico. Descubre qué significa zyl, cómo se fabrica el acetato en láminas y qué revisar en una montura moldeada.",
    "category": "Materiales de monturas",
    "readTime": "5 min de lectura",
    "imageAlt": "Monturas de distintos colores y grosores; una foto no permite identificar el material.",
    "imageCaption": "Este ejemplo de VisuTry muestra color y grosor del aro; no es posible identificar el plástico exacto solo por la imagen.",
    "sections": [
      {
        "heading": "¿Qué significa acetato en la etiqueta de una montura?",
        "paragraphs": [
          "El acetato de celulosa es un plástico elaborado con celulosa procedente de fuentes como la madera o el algodón. En óptica, «zyl» suele referirse al acetato de celulosa. Una misma montura puede aparecer como zyl, acetato o simplemente plástico: no son necesariamente materiales opuestos. Antes de comparar, pregunta por la composición exacta del frontal y las varillas."
        ]
      },
      {
        "heading": "Acetato en láminas frente a monturas moldeadas",
        "paragraphs": [
          "Las láminas de acetato pueden combinar capas de distintos colores. El fabricante recorta el frontal, le da forma y lo pule. Así aparecen bordes translúcidos o patrones carey que pueden variar entre piezas. El proveedor Mazzucchelli explica cómo fabrica las láminas con motivos de color.",
          "En el moldeo por inyección, una pieza adquiere su forma dentro de un molde. Puede utilizarse nailon u otro plástico. «Inyectado» describe un proceso de fabricación, mientras que «nailon» y «acetato» designan materiales. Si la ficha indica solo el proceso, solicita el material exacto del frontal y las varillas."
        ]
      },
      {
        "heading": "Cuatro criterios para comparar dos monturas",
        "paragraphs": [
          "Por ejemplo, un frontal ancho de acetato con varillas gruesas puede pesar mucho más que una montura fina de nailon inyectado, aunque ambas tengan lentes de la misma anchura. Compara siempre tu talla concreta: el nombre del material no garantiza ni ligereza ni comodidad."
        ],
        "bullets": [
          "Si buscas menos peso, pide el peso de la talla exacta y confirma si incluye los cristales.",
          "Para un puente cómodo, compara el contacto con la nariz respecto a tus gafas habituales y pregunta al óptico qué ajustes son posibles.",
          "Para un acabado singular, mira fotografías del frontal, los bordes y las varillas; consulta si el dibujo cambia entre unidades.",
          "Para uso prolongado, comprueba bisagras, disponibilidad de varillas de repuesto y cobertura ante roturas."
        ]
      },
      {
        "heading": "Compara la montura sobre tu rostro",
        "paragraphs": [
          "Utiliza un retrato claro y la imagen frontal del producto para juzgar el color y el contorno. La prueba visual no identifica el material, el peso real ni la presión del puente. Verifica la composición, las medidas y la adaptación física con el vendedor o un profesional de óptica, especialmente si pedirás lentes graduadas."
        ]
      }
    ],
    "sources": [
      {
        "label": "Revisión técnica de materiales de monturas",
        "url": "https://onlinelibrary.wiley.com/doi/10.1111/j.1600-0536.2006.00791.x"
      },
      {
        "label": "Proceso de fabricación de láminas de acetato de Mazzucchelli",
        "url": "https://www.mazzucchelli1849.it/pages/materials-and-processing-creative-case"
      }
    ]
  },
  "pt": {
    "title": "Armações de acetato ou plástico: o que comparar",
    "description": "O acetato é um tipo de plástico. Saiba o que significa zyl, como diferem as folhas de acetato e as armações moldadas e que detalhes verificar.",
    "category": "Materiais de armações",
    "readTime": "5 min de leitura",
    "imageAlt": "Exemplo de armações com espessuras e cores diferentes, sem indicação fiável do material.",
    "imageCaption": "O exemplo VisuTry mostra cor e espessura do aro; uma fotografia não identifica o plástico utilizado.",
    "sections": [
      {
        "heading": "O que significa acetato na descrição de uns óculos?",
        "paragraphs": [
          "O acetato de celulose é um plástico produzido com celulose proveniente, por exemplo, de madeira ou algodão. Em ótica, «zyl» normalmente designa acetato de celulose. A mesma armação pode ser descrita por uma loja como zyl, acetato ou simplesmente plástico. Por isso, acetato e plástico não são materiais necessariamente distintos. Peça a composição exata da frente e das hastes."
        ]
      },
      {
        "heading": "Folhas de acetato e armações moldadas",
        "paragraphs": [
          "As folhas de acetato podem incorporar camadas de cores diferentes. O fabricante corta a frente a partir da folha, dá-lhe forma e pole-a. Podem resultar extremidades translúcidas e padrões tartaruga que variam de peça para peça. A Mazzucchelli explica como produz estas folhas decorativas.",
          "Na moldação por injeção, a peça é formada num molde, possivelmente com nylon ou outro plástico. «Injetado» descreve o processo e «nylon» ou «acetato» o material. Se a loja apresentar apenas o processo de produção, pergunte do que são feitas a frente e as hastes."
        ]
      },
      {
        "heading": "Quatro perguntas antes de escolher a armação",
        "paragraphs": [
          "Uma frente larga de acetato com hastes grossas pode ter peso muito diferente de uma armação fina de nylon moldado, ainda que a largura das lentes seja igual. Compare os modelos no tamanho que vai usar; não deduza conforto ou qualidade apenas da etiqueta do material."
        ],
        "bullets": [
          "Peso: peça o peso no seu tamanho e confirme se inclui as lentes.",
          "Ponte confortável: compare a zona de contacto com uns óculos que já assentam bem e pergunte ao ótico o que pode ajustar.",
          "Acabamento: veja fotografias da frente, do rebordo e das hastes e informe-se sobre variações do padrão.",
          "Durabilidade: confirme a construção das dobradiças, peças de substituição e cobertura em caso de quebra."
        ]
      },
      {
        "heading": "Compare o aspeto no seu rosto",
        "paragraphs": [
          "Utilize um retrato nítido e uma fotografia frontal do produto para comparar forma e cor. A imagem não identifica o tipo de plástico, o peso real nem a pressão da ponte. Confirme material, medidas e ajuste junto do vendedor ou ótico, sobretudo se também vai encomendar lentes graduadas."
        ]
      }
    ],
    "sources": [
      {
        "label": "Revisão de materiais de armações de óculos",
        "url": "https://onlinelibrary.wiley.com/doi/10.1111/j.1600-0536.2006.00791.x"
      },
      {
        "label": "Fabrico de folhas de acetato na Mazzucchelli",
        "url": "https://www.mazzucchelli1849.it/pages/materials-and-processing-creative-case"
      }
    ]
  },
  "fr": {
    "title": "Montures en acétate ou en plastique : que comparer ?",
    "description": "L’acétate est une forme de plastique. Comprenez le terme zyl, la différence entre plaques d’acétate et injection, puis vérifiez poids et finition.",
    "category": "Matériaux des montures",
    "readTime": "5 min de lecture",
    "imageAlt": "Deux formes de montures dont les couleurs et épaisseurs diffèrent ; le matériau reste inconnu sur photo.",
    "imageCaption": "Cet exemple VisuTry illustre le coloris et l'épaisseur des cercles. Une photo seule n'identifie pas le polymère utilisé.",
    "sections": [
      {
        "heading": "Que signifie « acétate » sur une fiche produit ?",
        "paragraphs": [
          "L’acétate de cellulose est un plastique fabriqué à partir de cellulose, issue notamment du bois ou du coton. Dans la lunetterie, « zyl » désigne généralement l’acétate de cellulose. Une même monture peut être présentée comme zyl, acétate ou simplement plastique : ces mentions ne s'opposent donc pas toujours. Vérifiez le matériau précis de la face et des branches."
        ]
      },
      {
        "heading": "Plaques d’acétate et montures moulées",
        "paragraphs": [
          "Les plaques d’acétate peuvent superposer plusieurs couleurs. Le fabricant y découpe la face, puis la façonne et la polit. Les bords translucides ou les motifs écaille peuvent ainsi varier d'un exemplaire à l'autre. Le fournisseur Mazzucchelli présente la fabrication de ces plaques à motifs.",
          "L’injection moule une pièce dans une forme, en nylon ou dans un autre plastique. « Moulé par injection » décrit la technique, alors que « nylon » et « acétate » nomment les matériaux. Si la fiche n'indique que le procédé, demandez la composition de la face et des branches."
        ]
      },
      {
        "heading": "Quatre vérifications pour départager deux paires",
        "paragraphs": [
          "Une face d’acétate large et des branches épaisses peuvent peser très différemment d'une fine monture moulée en nylon, même si les verres ont une largeur identique. Comparez les deux produits dans votre taille avant de déduire confort et valeur du seul nom du matériau."
        ],
        "bullets": [
          "Poids : demandez le poids de la taille choisie et si les verres sont compris.",
          "Pont : comparez la zone d'appui sur le nez à celle d'une monture confortable et interrogez l'opticien sur les réglages possibles.",
          "Finition : examinez la face, les bords et les branches ; demandez si le motif varie d'une pièce à l'autre.",
          "Durabilité : contrôlez les charnières, la disponibilité des branches de remplacement et la garantie en cas de casse."
        ]
      },
      {
        "heading": "Comparez l’apparence sur votre visage",
        "paragraphs": [
          "Un portrait net et la photo frontale du produit permettent de comparer couleur et contour. L'aperçu ne peut pas identifier le plastique, mesurer le poids réel ni ressentir la pression du pont. Confirmez composition et adaptation auprès du vendeur ou d'un opticien, surtout pour des verres correcteurs."
        ]
      }
    ],
    "sources": [
      {
        "label": "Revue scientifique sur les matériaux de montures",
        "url": "https://onlinelibrary.wiley.com/doi/10.1111/j.1600-0536.2006.00791.x"
      },
      {
        "label": "Fabrication des plaques d’acétate chez Mazzucchelli",
        "url": "https://www.mazzucchelli1849.it/pages/materials-and-processing-creative-case"
      }
    ]
  }
}

export function getNativeAcetateGuide(locale: Locale): NativeEditorialCopy | null {
  if (locale === 'en') return null
  const copy = makeNativeRetailArticle(locale, translations[locale], '2025-10-24T17:00:00Z', '2026-11-16T00:00:00Z')
  return { ...copy, relatedLabel: getNativePrescriptionShoppingGuide(locale)?.title || copy.relatedLabel }
}
