import { getNativeChoiceGuide } from '@/config/native-choice-between-frames'
import type { Locale } from '@/i18n'
import { makeNativeRetailArticle, type NativeBlogLocale, type LocalizedRetailArticle } from '@/config/native-retail-guide-common'
import type { NativeEditorialCopy } from '@/components/blog/NativeEditorialArticle'

/** Tom Ford FT5304: exact model/color and dimensional comparison, never official SKU inventory. */
const translations: Record<NativeBlogLocale, LocalizedRetailArticle> = {
  "id": {
    "title": "Tom Ford FT5304: cara membaca kode dan ukuran bingkai",
    "description": "Pakai contoh FT5304 untuk membandingkan kode model, finishing hitam, detail tangkai dan ukuran 54–19–145 sebelum membeli.",
    "category": "Panduan bingkai desainer",
    "readTime": "4 menit baca",
    "imageAlt": "Bingkai kotak hitam tanpa merek untuk ilustrasi gaya, bukan foto asli Tom Ford.",
    "imageCaption": "Contoh VisuTry menunjukkan bingkai kotak gelap tanpa merek. Foto FT5304 resmi dapat dilihat pada sumber produsen.",
    "sections": [
      {
        "heading": "Pastikan kode model dan warna yang sama",
        "paragraphs": [
          "Dua bingkai kotak hitam bisa terlihat mirip dari depan. Tom Ford FT5304 adalah bingkai optik berbentuk persegi. Untuk varian hitam mengilap F001, situs resmi mencantumkan logo T logam berwarna rose gold pada bagian pelipis, garis berukir laser pada sisi luar kedua tangkai, dan engsel pegas. Foto samping lebih berguna daripada foto depan untuk memeriksa detail tersebut. Simpan kode lengkap serta foto samping dari toko."
        ]
      },
      {
        "heading": "Gunakan 54–19–145 saat membandingkan",
        "paragraphs": [
          "Untuk FT5304 yang dibahas, Tom Ford menuliskan 54–19–145: lebar satu lensa 54 mm, jembatan 19 mm, dan panjang tangkai 145 mm. Toko lain mungkin menamai produk hanya «kacamata kotak hitam» atau menyembunyikan ukurannya di pilihan varian. Cocokkan ketiga angka, model, dan warna agar tidak membandingkan barang berbeda.",
          "Jika kacamata Anda bertanda 52–19–145, setiap lensa pada FT5304 ini nominalnya lebih lebar 2 mm, sedangkan angka jembatan dan tangkai sama. Lebar luar dapat tetap berbeda karena bentuk rim serta engsel. Mintalah ukuran luar dan coba langsung bila bingkai lama menekan sisi kepala."
        ]
      },
      {
        "heading": "Putuskan detail apa yang sepadan dengan harganya",
        "paragraphs": [
          "Jika Anda tertarik pada logo T dan garis ukiran di tangkai, simpan tampilan samping. Jika yang Anda cari adalah bentuk kotak tebal, bandingkan siluetnya dengan bingkai tanpa merek pada potret wajah yang sama. Pratinjau dengan gambar produk membantu menilai proporsi, tetapi tidak memverifikasi keaslian merek atau kenyamanan fisik.",
          "Bandingkan total harga antar toko dengan jenis lensa, ongkir, jasa penyetelan dan layanan purnajual yang sama. Tanyakan penggantian komponen dan kebijakan retur setelah lensa resep dipasang. VisuTry tidak menyediakan katalog Tom Ford resmi; gunakan informasi produsen untuk memeriksa model sebenarnya."
        ]
      }
    ],
    "sources": [
      {
        "label": "Foto dan spesifikasi resmi Tom Ford FT5304",
        "url": "https://www.tomfordfashion.com/en-us/square-optical-frame/FT5304.html?dwvar_FT5304_color=F001"
      }
    ]
  },
  "ar": {
    "title": "Tom Ford FT5304: كيف تقرأ رمز الإطار ومقاساته؟",
    "description": "استخدم FT5304 لمقارنة رمز الطراز واللون الأسود اللامع وتفاصيل الذراع والأبعاد 54–19–145 قبل الشراء.",
    "category": "دليل إطارات المصممين",
    "readTime": "4 دقائق قراءة",
    "imageAlt": "مثال لإطار أسود مربع غير تابع لأي علامة، وليس صورة Tom Ford الرسمية.",
    "imageCaption": "يعرض مثال VisuTry شكلًا مربعًا داكنًا بلا علامة؛ توجد صور FT5304 الحقيقية لدى الشركة المصنعة.",
    "sections": [
      {
        "heading": "ابدأ برمز الطراز واللون المحددين",
        "paragraphs": [
          "قد يبدو إطاران أسودان مربعان متشابهين من الأمام. FT5304 من Tom Ford إطار بصري مربع، وتذكر الصفحة الرسمية للنسخة السوداء اللامعة F001 شعار T معدنيًا بلون الذهب الوردي عند الذراع، وخطوطًا منقوشة بالليزر على السطح الخارجي للذراعين، ومفصلًا مرنًا. الصورة الجانبية أوضح من الأمامية لهذه التفاصيل. احفظ رمز الطراز وصور الجوانب مع عرض البائع."
        ]
      },
      {
        "heading": "استخدم الأرقام 54–19–145 للمقارنة",
        "paragraphs": [
          "تشير مواصفات FT5304 المذكورة إلى 54–19–145، أي عرض عدسة واحدة 54 مم وعرض الجسر 19 مم وطول الذراع 145 مم. قد يسمي متجر المنتج «نظارة سوداء مربعة» ويخفي المقاس في قائمة الخيارات. طابق الأرقام الثلاثة مع رمز اللون والطراز عند مقارنة متجرين.",
          "إذا كانت نظارتك الحالية 52–19–145، فإن عرض كل عدسة في FT5304 أكبر اسميًا بمقدار 2 مم، بينما يبقى رقما الجسر والذراع كما هما. العرض الكلي يعتمد أيضًا على الحواف والمفصلات. اطلب العرض الخارجي وجرب الإطار فعليًا إذا كانت نظارتك تضغط على الصدغين."
        ]
      },
      {
        "heading": "أي التفاصيل تستحق التكلفة الأعلى؟",
        "paragraphs": [
          "إذا أعجبك شعار T المعدني ونقوش الذراع فاحتفظ بالصورة الجانبية. وإذا كنت تحب شكل المقدمة السوداء العريضة، فقارنها بإطار مربع غير تابع لعلامة تجارية على صورة الوجه نفسها. معاينة الصورة تُظهر النسب المرئية لكنها لا تثبت أصالة العلامة ولا تقيس الراحة.",
          "قارن السعر النهائي لدى البائعين بعد اختيار العدسات والشحن والخدمات اللاحقة. اسأل عن تعديل الإطار وقطع الغيار وشروط إرجاع النظارة الطبية الجاهزة. لا يقدّم VisuTry كتالوج Tom Ford رسميًا؛ راجع الشركة المصنعة لتأكيد الطراز والبيانات."
        ]
      }
    ],
    "sources": [
      {
        "label": "صور Tom Ford FT5304 ومواصفاته الرسمية",
        "url": "https://www.tomfordfashion.com/en-us/square-optical-frame/FT5304.html?dwvar_FT5304_color=F001"
      }
    ]
  },
  "ru": {
    "title": "Tom Ford FT5304: как читать модель, цвет и размер оправы",
    "description": "Сверьте FT5304, чёрный глянец, металлическую деталь T и размер 54–19–145 перед сравнением цен и покупкой.",
    "category": "Гид по дизайнерским оправам",
    "readTime": "4 мин чтения",
    "imageAlt": "Небрендированный пример квадратной чёрной оправы, не официальное фото Tom Ford.",
    "imageCaption": "Пример VisuTry иллюстрирует тёмный квадратный контур. Оригинальные фотографии FT5304 приведены по ссылке производителя.",
    "sections": [
      {
        "heading": "Начните с точного кода модели и цвета",
        "paragraphs": [
          "Две чёрные квадратные оправы спереди могут выглядеть одинаково. Tom Ford FT5304 — квадратная оптическая оправа. Для глянцевой чёрной версии F001 официальный сайт указывает металлическую деталь T цвета розового золота у виска, лазерную гравировку полос на наружной стороне обеих дужек и пружинный шарнир. Эти элементы лучше видны сбоку. Сохраните код и боковые снимки продавца."
        ]
      },
      {
        "heading": "Сравнивайте по трём числам 54–19–145",
        "paragraphs": [
          "Для рассматриваемой версии FT5304 производитель приводит 54–19–145: ширина линзы 54 мм, мост 19 мм, дужки 145 мм. У другого продавца товар может называться просто «чёрные квадратные очки», а размер быть спрятан в списке вариантов. Сверяйте код, цвет и все три числа.",
          "Если ваша текущая оправа имеет маркировку 52–19–145, то каждая линза FT5304 номинально шире на 2 мм, а мост и дужки имеют те же значения. Общая ширина зависит и от ободков с шарнирами. Уточните внешнюю ширину и примерьте очки лично, если прежняя оправа давила на виски."
        ]
      },
      {
        "heading": "Какая деталь стоит дополнительных денег?",
        "paragraphs": [
          "Если вас привлекли знак T и насечки на дужках, сохраняйте боковой ракурс. Если нравится только толстый квадратный перед, сравните его с небрендированной оправой на том же портрете. Примерка по фото помогает оценить контур, но не подтверждает подлинность и не измеряет физический комфорт.",
          "Сравнивайте окончательную стоимость с одинаковыми линзами, доставкой, регулировкой и обслуживанием. Спросите о запасных частях и возврате готовых очков с рецептурными линзами. VisuTry не является официальным каталогом Tom Ford; проверяйте товар на сайте бренда."
        ]
      }
    ],
    "sources": [
      {
        "label": "Официальные фото и характеристики Tom Ford FT5304",
        "url": "https://www.tomfordfashion.com/en-us/square-optical-frame/FT5304.html?dwvar_FT5304_color=F001"
      }
    ]
  },
  "de": {
    "title": "Tom Ford FT5304: Modellcode und Fassungsmaße richtig lesen",
    "description": "Vergleichen Sie das schwarze FT5304-Modell, T-Logo am Bügel und die Maßangabe 54–19–145, statt nur nach schwarzen Quadratrahmen zu suchen.",
    "category": "Designerfassungs-Ratgeber",
    "readTime": "4 Min. Lesezeit",
    "imageAlt": "Ungebrandete quadratische schwarze Beispielfassung, kein offizielles Tom-Ford-Bild.",
    "imageCaption": "Die VisuTry-Illustration zeigt eine dunkle Quadratform. Echte FT5304-Fotos und Daten stehen beim Hersteller.",
    "sections": [
      {
        "heading": "Modell und Farbe zuerst eindeutig zuordnen",
        "paragraphs": [
          "Zwei schwarze quadratische Fassungen können von vorn gleich aussehen. Die Tom Ford FT5304 ist eine quadratische optische Fassung. Für die glänzend schwarze Version F001 beschreibt der Hersteller ein roségoldfarbenes T-Metalllogo an den Bügeln, lasergravierte Streifen auf deren Außenseiten und Federscharniere. Die Seitenansicht zeigt diese Details deutlicher. Speichern Sie daher Modellnummer, Farbe und Seitenfoto der Händleranzeige."
        ]
      },
      {
        "heading": "Die Maße 54–19–145 abgleichen",
        "paragraphs": [
          "Tom Ford nennt für die betrachtete FT5304 54–19–145: Glasbreite 54 mm, Stegweite 19 mm und Bügellänge 145 mm. Ein anderer Händler könnte nur «schwarze quadratische Brille» schreiben oder die Größe in einem Variantenmenü verstecken. Prüfen Sie Modell, Farbe und alle drei Zahlen zusammen.",
          "Ist Ihre bisherige Brille mit 52–19–145 markiert, hat FT5304 nominell je 2 mm breitere Gläser, während Steg und Bügel gleich angegeben sind. Die Gesamtbreite hängt aber auch von Rändern und Scharnieren ab. Fragen Sie nach der Außenbreite und probieren Sie die Fassung im Laden, falls die alte an den Schläfen drückt."
        ]
      },
      {
        "heading": "Welche Details sind Ihnen den Preis wert?",
        "paragraphs": [
          "Falls Sie sich für das T-Zeichen und die Gravur interessieren, bewahren Sie das Seitenbild auf. Wenn Sie vor allem die markante schwarze Quadratfront mögen, vergleichen Sie sie mit einer ungebrandeten Form auf demselben Porträt. Eine Fotoanprobe zeigt Proportionen, nicht Echtheit oder tatsächlichen Tragekomfort.",
          "Vergleichen Sie Händlergesamtpreise mit denselben Gläsern, Versandkosten, Anpassung und späterem Service. Klären Sie Ersatzteile und die Rückgabe bereits verglaster Korrektionsfassungen. VisuTry ist kein offizieller Tom-Ford-Katalog; verbindliche Modellangaben stehen beim Hersteller."
        ]
      }
    ],
    "sources": [
      {
        "label": "Tom Ford FT5304: offizielle Bilder und Spezifikationen",
        "url": "https://www.tomfordfashion.com/en-us/square-optical-frame/FT5304.html?dwvar_FT5304_color=F001"
      }
    ]
  },
  "ja": {
    "title": "Tom Ford FT5304の型番・寸法・テンプル装飾の見方",
    "description": "FT5304の黒いスクエアフレーム、Tロゴとテンプルのレーザー刻印、54–19–145のサイズ表示を確認して比較しましょう。",
    "category": "デザイナーフレームガイド",
    "readTime": "約4分",
    "imageAlt": "ブランド名のない黒いスクエア型フレーム例。Tom Ford公式の商品画像ではありません。",
    "imageCaption": "VisuTryの無銘のスクエア型スタイル例です。FT5304の正式な画像と仕様はメーカーを参照してください。",
    "sections": [
      {
        "heading": "型番とカラーを正しくそろえる",
        "paragraphs": [
          "黒いスクエア型のメガネは正面から見ると似ていることがあります。Tom FordのFT5304はスクエア型のオプティカルフレームです。公式仕様によると、光沢のあるブラックF001にはローズゴールド色の金属製Tロゴ、テンプル外側のレーザー刻印による線模様、スプリングヒンジがあります。これらは正面より側面の写真で確認しやすいため、型番・カラー・横からの写真を保存します。"
        ]
      },
      {
        "heading": "54–19–145の数字で商品を比較する",
        "paragraphs": [
          "このFT5304のサイズ表記54–19–145は、レンズ幅54mm、ブリッジ幅19mm、テンプル長145mmを表します。別の販売店が「黒いスクエアメガネ」とだけ表示し、サイズを選択欄の中に入れている場合もあります。型番・カラーと3つの数字が一致するか確認しましょう。",
          "手持ちのメガネが52–19–145なら、FT5304はレンズ1枚当たりの公称幅が2mm広く、ブリッジとテンプルの数値は同じです。ただしフロント全幅はリムや蝶番によって変わります。外幅を販売店に聞き、普段のメガネでこめかみが痛む場合は実物を試してください。"
        ]
      },
      {
        "heading": "どのディテールに価値を感じるか決める",
        "paragraphs": [
          "金属製のTロゴやテンプルの刻印に惹かれたなら側面画像を残しましょう。太い黒いスクエア型の形だけが好きなら、同じ顔写真で無銘のスクエアフレームと見比べることもできます。写真での試着は見た目の比率を比較できますが、正規品の証明やフィット感の測定にはなりません。",
          "両店で同じレンズ・配送・調整サービスを選んだ総額を比較し、補修部品と完成した度付きメガネの返品条件も確認してください。VisuTryはTom Fordの公式カタログではありません。製品の事実はメーカーサイトで確かめましょう。"
        ]
      }
    ],
    "sources": [
      {
        "label": "Tom Ford公式 FT5304の商品画像と仕様",
        "url": "https://www.tomfordfashion.com/en-us/square-optical-frame/FT5304.html?dwvar_FT5304_color=F001"
      }
    ]
  },
  "es": {
    "title": "Tom Ford FT5304: cómo leer el modelo y las medidas",
    "description": "Comprueba el FT5304 negro, el detalle T de las varillas y la talla 54–19–145 antes de comparar dos anuncios de monturas cuadradas.",
    "category": "Guía de monturas de diseño",
    "readTime": "4 min de lectura",
    "imageAlt": "Montura cuadrada negra sin marca como ejemplo de estilo; no es una foto oficial Tom Ford.",
    "imageCaption": "La ilustración genérica de VisuTry muestra un contorno cuadrado oscuro. Consulta las imágenes oficiales del FT5304.",
    "sections": [
      {
        "heading": "Empieza por el modelo y el color exactos",
        "paragraphs": [
          "Dos monturas cuadradas negras pueden parecer idénticas de frente. La FT5304 de Tom Ford es una montura óptica cuadrada. Para el acabado negro brillante F001, la marca indica una T metálica de color oro rosa en la zona de la varilla, franjas grabadas con láser en el exterior de ambas varillas y bisagras flexibles. La fotografía lateral muestra mejor estos detalles. Guarda el código y las imágenes laterales antes de comparar tiendas."
        ]
      },
      {
        "heading": "Usa la inscripción 54–19–145 para comparar",
        "paragraphs": [
          "Para esta FT5304, Tom Ford especifica 54–19–145: anchura de una lente de 54 mm, puente de 19 mm y varillas de 145 mm. Otra tienda puede anunciar simplemente «gafas negras cuadradas» o esconder la talla en un selector. Comprueba siempre los tres números junto al color y el modelo.",
          "Si tus gafas actuales marcan 52–19–145, cada lente del FT5304 es nominalmente 2 mm más ancha, pero puente y varillas mantienen la misma cifra. La anchura exterior también depende del aro y las bisagras. Pide esa medida y prueba físicamente las gafas si tu montura habitual aprieta las sienes."
        ]
      },
      {
        "heading": "Decide qué detalle compensa el precio",
        "paragraphs": [
          "Si te interesa la T metálica o el grabado de las varillas, conserva la vista lateral. Si te gusta sobre todo el frontal cuadrado grueso, compara el contorno con otra montura genérica sobre el mismo retrato. La prueba virtual ayuda a juzgar proporciones, pero no demuestra autenticidad ni comodidad real.",
          "Compara los precios completos incluyendo los mismos cristales, envío y servicios de ajuste. Pregunta por piezas de repuesto y devoluciones de gafas graduadas terminadas. VisuTry no dispone de un catálogo oficial Tom Ford: verifica el modelo auténtico en la página del fabricante."
        ]
      }
    ],
    "sources": [
      {
        "label": "Fotos y especificaciones oficiales de Tom Ford FT5304",
        "url": "https://www.tomfordfashion.com/en-us/square-optical-frame/FT5304.html?dwvar_FT5304_color=F001"
      }
    ]
  },
  "pt": {
    "title": "Tom Ford FT5304: como interpretar o modelo e as medidas",
    "description": "Confirme o FT5304 preto, o detalhe T nas hastes e os números 54–19–145 antes de comparar propostas de armações quadradas.",
    "category": "Guia de armações de designer",
    "readTime": "4 min de leitura",
    "imageAlt": "Armação quadrada preta sem marca usada apenas para ilustrar a forma, não é uma imagem oficial Tom Ford.",
    "imageCaption": "A imagem genérica VisuTry mostra uma armação quadrada escura. Consulte as fotografias e características oficiais do FT5304.",
    "sections": [
      {
        "heading": "Comece por confirmar o código e a cor exatos",
        "paragraphs": [
          "Duas armações quadradas pretas podem parecer semelhantes de frente. A Tom Ford FT5304 é uma armação ótica quadrada. Na versão preta brilhante F001, a marca descreve um T metálico cor de ouro rosa na haste, riscas gravadas a laser no exterior das duas hastes e dobradiças de mola. A fotografia lateral é essencial para ver estes detalhes. Guarde a referência e as imagens laterais ao comparar vendedores."
        ]
      },
      {
        "heading": "Use 54–19–145 para comparar propostas",
        "paragraphs": [
          "Para esta FT5304, a Tom Ford indica 54–19–145, correspondentes a largura de lente 54 mm, ponte 19 mm e comprimento de haste 145 mm. Outro vendedor pode dizer apenas «óculos quadrados pretos» ou colocar o tamanho num menu. Confirme todas as cifras com modelo e cor.",
          "Se usa uma armação 52–19–145, as lentes do FT5304 são nominalmente 2 mm mais largas cada uma, mas ponte e hastes têm os mesmos valores. A largura exterior pode variar devido aos aros e dobradiças. Peça a medida total e experimente os óculos se a armação habitual aperta nas têmporas."
        ]
      },
      {
        "heading": "Decida que pormenor merece o investimento",
        "paragraphs": [
          "Se gosta do T metálico e das gravuras nas hastes, guarde a vista lateral. Se prefere sobretudo a frente preta e marcante, compare-a com uma armação quadrada sem marca no mesmo retrato. A simulação ajuda a escolher proporções, mas não verifica a autenticidade nem o conforto real.",
          "Compare preços completos com as mesmas lentes, entrega e ajustes. Confirme assistência, peças de reposição e devolução de óculos graduados acabados. A VisuTry não é um catálogo oficial Tom Ford; confirme os dados na página do fabricante."
        ]
      }
    ],
    "sources": [
      {
        "label": "Imagens e medidas oficiais Tom Ford FT5304",
        "url": "https://www.tomfordfashion.com/en-us/square-optical-frame/FT5304.html?dwvar_FT5304_color=F001"
      }
    ]
  },
  "fr": {
    "title": "Tom Ford FT5304 : lire la référence et les dimensions d'une monture",
    "description": "Vérifiez le FT5304 noir, le logo T sur les branches et la taille 54–19–145 avant de comparer les offres de montures carrées.",
    "category": "Guide des montures de créateur",
    "readTime": "4 min de lecture",
    "imageAlt": "Exemple de monture carrée noire sans marque ; ce n'est pas une photo officielle Tom Ford.",
    "imageCaption": "La photo générique de VisuTry illustre une face carrée sombre. Retrouvez le FT5304 réel auprès du fabricant.",
    "sections": [
      {
        "heading": "Identifiez d'abord la référence et la couleur",
        "paragraphs": [
          "Deux montures carrées noires peuvent sembler identiques de face. La FT5304 de Tom Ford est une monture optique carrée. Pour la finition noire brillante F001, la marque décrit un T métallique couleur or rose près des branches, des rayures gravées au laser sur leur surface extérieure et une charnière à ressort. La vue de profil est particulièrement utile pour ces détails. Conservez la référence complète et la photo latérale."
        ]
      },
      {
        "heading": "Comparez les inscriptions 54–19–145",
        "paragraphs": [
          "Pour cette FT5304, Tom Ford annonce 54–19–145, soit largeur d'un verre de 54 mm, pont de 19 mm et longueur des branches de 145 mm. Un autre marchand peut ne mentionner que « lunettes carrées noires » ou placer la taille dans une liste déroulante. Vérifiez modèle, couleur et trois nombres.",
          "Si votre paire actuelle porte 52–19–145, chaque verre FT5304 est nominalement 2 mm plus large, tandis que les deux autres mesures restent identiques. La largeur totale dépend aussi des cercles et charnières. Demandez la largeur extérieure et essayez la monture en magasin si vos lunettes habituelles serrent aux tempes."
        ]
      },
      {
        "heading": "Quel détail vaut réellement le supplément ?",
        "paragraphs": [
          "Si le T métallique et les gravures sur les branches vous plaisent, gardez la photo de côté. Si vous aimez surtout l'épaisse face carrée, comparez sa silhouette à celle d'une monture générique sur le même portrait. L'essayage photo permet d'observer les proportions, pas de prouver l'authenticité ni de mesurer le confort.",
          "Comparez les prix complets avec mêmes verres, livraison et réglages. Demandez les possibilités de remplacement et les retours des lunettes correctrices finies. VisuTry ne propose pas de catalogue officiel Tom Ford ; vérifiez les informations auprès du fabricant."
        ]
      }
    ],
    "sources": [
      {
        "label": "Photos et caractéristiques officielles Tom Ford FT5304",
        "url": "https://www.tomfordfashion.com/en-us/square-optical-frame/FT5304.html?dwvar_FT5304_color=F001"
      }
    ]
  }
}

export function getNativeTomFordFrameGuide(locale: Locale): NativeEditorialCopy | null {
  if (locale === 'en') return null
  const copy = makeNativeRetailArticle(locale, translations[locale], '2025-10-21T16:00:00Z', '2026-11-16T00:00:00Z')
  return { ...copy, relatedLabel: getNativeChoiceGuide(locale)?.title || copy.relatedLabel }
}
