import type { Locale } from '@/i18n'
import type { NativeEditorialCopy } from '@/components/blog/NativeEditorialArticle'
import { makeNativeRetailArticle, type NativeBlogLocale, type LocalizedRetailArticle } from '@/config/native-retail-guide-common'
import { getNativeBrowlineGuide } from '@/config/native-browline-clubmaster-guide'

/** Identifying a named collaboration is not identifying a frame in any other photo. */
const copies: Record<NativeBlogLocale, LocalizedRetailArticle> = {
  "es": {
    "title": "Cómo identificar unas gafas de una foto de una celebridad",
    "description": "Observa el contorno, el puente y las varillas; verifica una colaboración documentada y compara un modelo similar en tu propia foto.",
    "category": "Estilo e identificación",
    "readTime": "5 min de lectura",
    "imageAlt": "Ejemplo editorial de montura cat-eye negra, sin atribuirla a una persona o marca.",
    "imageCaption": "Ejemplo de VisuTry: una montura cat-eye negra con esquinas elevadas hacia las sienes.",
    "sections": [
      {
        "heading": "Lee tres detalles visibles en la fotografía",
        "paragraphs": [
          "Cuando unas gafas te llaman la atención en una campaña o una foto de estilo urbano, guarda la fuente y sus créditos. Antes de buscar la marca, decide si necesitas el modelo exacto o solo una silueta similar: ambas preguntas requieren pruebas diferentes.",
          "La iluminación interior, las lentes tintadas, el ángulo de la cara y el pelo pueden ocultar información. Anota lo que no puedas ver como «desconocido», en lugar de atribuir un nombre de modelo sin respaldo."
        ],
        "bullets": [
          "Contorno frontal: sigue el borde superior desde el puente hasta la sien. Una esquina ascendente sugiere cat-eye; un borde recto y lentes profundas producen otro efecto.",
          "Aros y puente: distingue el borde superior grueso del inferior fino, el acetato continuo, el puente metálico y las plaquetas nasales visibles.",
          "Detalles laterales: otra toma puede mostrar adornos o bisagras ocultos por el pelo. No deduzcas el color exacto de una foto con iluminación alterada."
        ]
      },
      {
        "heading": "¿Qué prueba permite confirmar un modelo concreto?",
        "paragraphs": [
          "Una ficha de vestuario o una campaña de marca que enlace a un producto con nombre ofrece una referencia verificable. Por ejemplo, la página oficial Jentle Salon de Gentle Monster acredita la colaboración con JENNIE, muestra adornos de la colección y enumera referencias como Wispy 01.",
          "Que una colaboración exista no demuestra que unas gafas en otra fotografía sean la referencia Wispy 01. Para identificar un producto exacto, contrasta el modelo publicado, la vista frontal, la varilla, los adornos y el color; si faltan detalles, no afirmes identidad ni autenticidad."
        ]
      },
      {
        "heading": "Recrea el detalle que realmente te interesa",
        "paragraphs": [
          "Si te gustan las esquinas elevadas, selecciona dos cat-eye con una elevación parecida: una montura oscura y otra de acabado más claro. Guarda las fotos frontales de los productos de sus vendedores y prueba ambos sobre la misma foto de tu rostro, manteniendo pose y recorte.",
          "Si en realidad te atrae una línea horizontal superior oscura, consulta la guía browline. Antes de comprar, comprueba medidas y devolución: dos modelos de aspecto parecido pueden apoyar de forma distinta sobre la nariz. La vista previa no identifica a una persona ni comprueba un producto original."
        ]
      }
    ],
    "sources": [
      {
        "label": "Colección y modelos oficiales Jentle Salon · Gentle Monster",
        "url": "https://www.gentlemonster.com/us/en/category/collections/jentle-salon"
      }
    ]
  },
  "fr": {
    "title": "Identifier des lunettes vues sur une photo de célébrité",
    "description": "Observez la forme, le pont et les branches, vérifiez la source d'une collaboration et comparez un style proche sur votre portrait.",
    "category": "Style et identification",
    "readTime": "5 min de lecture",
    "imageAlt": "Exemple éditorial de monture cat-eye noire, sans association à une personnalité.",
    "imageCaption": "Exemple VisuTry : une monture cat-eye noire dont les coins remontent vers les tempes.",
    "sections": [
      {
        "heading": "Repérez trois détails dans la photographie",
        "paragraphs": [
          "Si une paire vous plaît sur une photo de campagne ou de rue, conservez l'image d'origine et son crédit. Déterminez si vous cherchez le produit exact ou simplement une forme proche : ces objectifs n'exigent pas le même niveau de preuve.",
          "L'éclairage, des verres teintés, l'angle de prise de vue et des cheveux peuvent cacher la structure. Indiquez « inconnu » pour les éléments non visibles au lieu de supposer un modèle ou une couleur précise."
        ],
        "bullets": [
          "Contour de face : suivez le haut du pont vers la tempe. Un coin relevé évoque le cat-eye, tandis qu'une ligne droite et des verres profonds créent une autre silhouette.",
          "Cercles et pont : observez le bord supérieur épais, la ligne inférieure fine, un cercle en acétate continu, un pont métallique ou des plaquettes visibles.",
          "Côtés : une deuxième photo peut montrer un ornement ou une charnière masqués par les cheveux. Une couleur vue en intérieur peut être trompeuse."
        ]
      },
      {
        "heading": "Qu'est-ce qui confirme une référence exacte ?",
        "paragraphs": [
          "Un crédit de stylisme ou une campagne de marque donnant le nom du produit fournit un élément vérifiable. Par exemple, la page officielle Jentle Salon de Gentle Monster présente sa collaboration avec JENNIE, des accessoires décoratifs et une liste de modèles dont Wispy 01.",
          "Ce crédit de collection ne prouve pas que les lunettes portées sur une photographie différente soient Wispy 01. Pour une identification exacte, faites correspondre référence, face, branches, ornements et couleur aux photos officielles. En cas de doute, ne concluez pas à une identification ni à l'authenticité."
        ]
      },
      {
        "heading": "Recréez le détail de style que vous aimez",
        "paragraphs": [
          "Si le détail préféré est un coin extérieur relevé, retenez deux modèles cat-eye comparables, l'un foncé et l'autre plus clair. Enregistrez les vues de face fournies par les vendeurs puis comparez les deux sur un même portrait, en conservant la pose et le cadrage.",
          "Si vous aimez plutôt la ligne supérieure sombre, consultez le guide browline. Avant l'achat, contrôlez dimensions et retours : deux paires similaires peuvent reposer très différemment sur le nez. L'aperçu virtuel ne permet pas d'identifier une personne ni de certifier un produit."
        ]
      }
    ],
    "sources": [
      {
        "label": "Jentle Salon · collection officielle Gentle Monster",
        "url": "https://www.gentlemonster.com/us/en/category/collections/jentle-salon"
      }
    ]
  },
  "ru": {
    "title": "Как определить модель очков по фотографии знаменитости",
    "description": "Сравните форму, ободки и дужки, проверьте документированную коллаборацию и примеряйте похожий стиль на собственном фото.",
    "category": "Поиск оправ по фото",
    "readTime": "5 мин чтения",
    "imageAlt": "Редакционный пример чёрной оправы «кошачий глаз», не связанный с конкретным человеком.",
    "imageCaption": "Пример VisuTry показывает приподнятые наружные уголки чёрной оправы cat-eye.",
    "sections": [
      {
        "heading": "Разберите три детали оригинального снимка",
        "paragraphs": [
          "Если вам понравились очки на рекламном или уличном снимке, сохраните исходное изображение и подпись. Уточните цель: найти точную модель или только повторить общую форму. Для первого нужны документальные подтверждения, для второго достаточно наблюдать форму.",
          "Ракурс, волосы, освещение и тонированные линзы могут скрывать важные элементы. Записывайте «неизвестно», если часть дужки или цвет нельзя определить уверенно."
        ],
        "bullets": [
          "Передний контур: проследите верхнюю линию от моста к вискам. Поднятые наружные углы напоминают cat-eye, а прямая кромка с глубокими линзами создаёт другой образ.",
          "Ободок и мост: различайте толстый верхний край, тонкую нижнюю линию, сплошной ацетат, металлический мост и видимые носоупоры.",
          "Боковые детали: второй ракурс может показать орнамент или шарнир, спрятанные волосами. Цвет на фото в помещении может отличаться от реального."
        ]
      },
      {
        "heading": "Что действительно подтверждает точную модель?",
        "paragraphs": [
          "Подпись стилиста или официальная реклама бренда со ссылкой на товар позволяют проверить название. Например, страница коллекции Jentle Salon от Gentle Monster называет сотрудничество с JENNIE, показывает декоративные подвески и перечисляет конкретные модели, в том числе Wispy 01.",
          "Но принадлежность к коллекции не доказывает, что очки на другом снимке — Wispy 01. Сопоставляйте код, форму передней части, дужки, подвески и цвет с официальным товаром. Не выдавайте предположение за установление личности, бренда или оригинальности."
        ]
      },
      {
        "heading": "Повторите именно понравившуюся особенность",
        "paragraphs": [
          "Если вас привлекли поднятые углы, выберите две похожие оправы cat-eye: одну тёмную и другую со светлой отделкой. Сохраните фронтальные товарные фотографии и сравните их на одном портрете с одинаковым выражением лица и кадрированием.",
          "Если интереснее выраженная тёмная линия у бровей, посмотрите руководство по browline. Перед заказом сравните ширину, мост и возврат: похожие оправы могут по-разному сидеть на носу. AI-превью не идентифицирует людей и не подтверждает оригинальность товара."
        ]
      }
    ],
    "sources": [
      {
        "label": "Официальная коллекция Gentle Monster Jentle Salon",
        "url": "https://www.gentlemonster.com/us/en/category/collections/jentle-salon"
      }
    ]
  },
  "ja": {
    "title": "有名人の写真からメガネの形や型番を調べる方法",
    "description": "正面の形・リム・テンプルを観察し、公式コラボ資料で裏づけを取り、似たスタイルを自分の写真で比較します。",
    "category": "写真からスタイルを探す",
    "readTime": "約5分",
    "imageAlt": "人物やブランドを特定しない、黒いキャットアイフレームの編集用サンプル。",
    "imageCaption": "VisuTryの黒いキャットアイ型サンプル。外側の角がこめかみに向かって上がっています。",
    "sections": [
      {
        "heading": "写真で確認すべき3つの特徴",
        "paragraphs": [
          "広告やスナップ写真で気になるメガネを見つけたら、まず元画像と出典を保存します。正確な商品を探すのか、形だけを再現したいのかを決めましょう。必要な証拠は異なります。",
          "髪がテンプルを隠している場合や、照明・色付きレンズ・カメラ角度が違う場合は、見えない情報を「不明」と記録してください。写真の印象だけでブランドや型番を断定しません。"
        ],
        "bullets": [
          "正面の輪郭：ブリッジからこめかみに向かう上側の線を追います。外側の角が上がるならキャットアイ、直線と深いレンズなら別の印象です。",
          "リムとブリッジ：太い上側の線と細い下側、連続したアセテート、金属ブリッジ、ノーズパッドなどを見分けます。",
          "側面の特徴：別の写真にはテンプル装飾や蝶番が写っているかもしれません。室内照明の色は実物と異なる場合があります。"
        ]
      },
      {
        "heading": "正確な商品を確かめるには？",
        "paragraphs": [
          "商品名を記した衣装クレジットや、ブランドから特定商品へのリンクがあれば検証できます。例としてGentle MonsterのJentle Salon公式ページはJENNIEとのコラボレーション、チャームデザイン、Wispy 01などのモデル一覧を紹介しています。",
          "ただし、そのコレクションが存在することと、別の写真で着用されている商品がWispy 01であることは別です。正面形状、テンプル、装飾、カラーを公式の同じ型番と照合し、確認できなければ推測にとどめましょう。"
        ]
      },
      {
        "heading": "好きな特徴を自分の写真で再現する",
        "paragraphs": [
          "外側が上がった形が気に入ったなら、同じように角が上がるキャットアイを2本選び、暗い色と明るい色を比べます。販売店の正面商品画像を保存し、顔写真・表情・切り抜き範囲を変えずにそれぞれ試してください。",
          "気に入ったのが上側の濃いラインなら、ブローラインのガイドも役立ちます。購入前にはサイズと返品条件を確認しましょう。見た目が似ていても鼻への当たり方は異なり、AI試着は人物識別や真正品確認の代わりにはなりません。"
        ]
      }
    ],
    "sources": [
      {
        "label": "Gentle Monster公式 Jentle Salonコレクション",
        "url": "https://www.gentlemonster.com/us/en/category/collections/jentle-salon"
      }
    ]
  },
  "de": {
    "title": "Brillen auf Prominentenfotos erkennen: Form und Modell prüfen",
    "description": "Analysieren Sie Frontform, Rand und Bügel, prüfen Sie offizielle Kollaborationen und vergleichen Sie einen ähnlichen Look auf Ihrem Porträt.",
    "category": "Brillenstil nach Fotos",
    "readTime": "5 Min. Lesezeit",
    "imageAlt": "Redaktionelle schwarze Cat-Eye-Beispielfassung ohne Zuordnung zu einem Prominenten oder einer Marke.",
    "imageCaption": "VisuTry-Beispiel: schwarze Cat-Eye-Fassung mit nach oben gezogenen Außenecken.",
    "sections": [
      {
        "heading": "Drei Merkmale auf dem Originalfoto lesen",
        "paragraphs": [
          "Fallen Ihnen bei einem Kampagnen- oder Street-Style-Foto die Brillengestelle auf, speichern Sie Originalaufnahme und Bildnachweis. Entscheiden Sie zuerst, ob Sie die genaue Produktreferenz oder nur eine ähnliche Silhouette suchen. Eine Modellidentifikation braucht mehr Belege.",
          "Haare, Kameraansicht, Licht und gefärbte Gläser können Merkmale verdecken. Notieren Sie unsichtbare Details als „unbekannt“, statt aus dem Foto Modellcode oder Farbe zu erraten."
        ],
        "bullets": [
          "Frontform: verfolgen Sie die obere Kante vom Steg zur Schläfe. Ansteigende Außenecken deuten auf Cat-Eye hin, eine gerade Linie mit hohen Gläsern wirkt anders.",
          "Rand und Steg: achten Sie auf starke Oberkante, dünnen unteren Rand, durchgehendes Acetat, Metallsteg oder sichtbare Nasenpads.",
          "Seitenansicht: ein weiteres Foto zeigt eventuell Bügelverzierung oder Scharnier, die von Haaren verdeckt waren. Innenlicht kann den Farbton verfälschen."
        ]
      },
      {
        "heading": "Was belegt ein genaues Modell?",
        "paragraphs": [
          "Ein offizieller Kampagnenlink oder eine Styling-Angabe mit benanntem Produkt ist ein überprüfbarer Anhaltspunkt. So nennt Gentle Monster auf seiner Jentle-Salon-Seite eine Zusammenarbeit mit JENNIE und zeigt die Schmuckanhänger der Kollektion sowie Modelle wie Wispy 01.",
          "Die Kollektion belegt jedoch nicht, dass eine fremde Fotoaufnahme Wispy 01 zeigt. Vergleichen Sie Modellnummer, Front, Bügel, Anhänger und Farbe mit den veröffentlichten Ansichten. Ohne eindeutige Zuordnung sollte man weder Marke noch Authentizität behaupten."
        ]
      },
      {
        "heading": "Den gewünschten Effekt selbst nachstellen",
        "paragraphs": [
          "Gefallen Ihnen hochgezogene Außenecken, wählen Sie zwei ähnlich geformte Cat-Eye-Modelle, eines dunkel und eines heller. Speichern Sie die Frontalfotos der Verkäufer und verwenden Sie für beide Versuche dasselbe Porträt, denselben Gesichtsausdruck und Bildausschnitt.",
          "Falls die dunkle obere Linie im Vordergrund steht, hilft der Browline-Ratgeber. Vor dem Kauf prüfen Sie Maße und Rückgabe: zwei ähnliche Fassungen können am Steg unterschiedlich sitzen. Eine KI-Vorschau ist keine Identitäts- oder Echtheitsprüfung."
        ]
      }
    ],
    "sources": [
      {
        "label": "Gentle Monster Jentle Salon – offizielle Kollektion",
        "url": "https://www.gentlemonster.com/us/en/category/collections/jentle-salon"
      }
    ]
  },
  "pt": {
    "title": "Como identificar óculos numa fotografia de celebridade",
    "description": "Observe forma frontal, rebordos e hastes, confira uma colaboração documentada e experimente um estilo semelhante na sua fotografia.",
    "category": "Identificar estilos",
    "readTime": "5 min de leitura",
    "imageAlt": "Exemplo editorial de armação cat-eye preta sem identificação de pessoa ou marca.",
    "imageCaption": "Exemplo VisuTry: armação cat-eye preta com cantos exteriores levantados junto às têmporas.",
    "sections": [
      {
        "heading": "Leia três características da fotografia",
        "paragraphs": [
          "Quando uma campanha ou fotografia de rua mostra uns óculos que lhe agradam, guarde o original e os créditos. Decida se quer o modelo exato ou apenas um formato semelhante: a primeira opção exige documentação verificável.",
          "Cabelo, iluminação, ângulo e lentes escurecidas podem ocultar detalhes. Registe como «desconhecidos» os elementos que não consegue observar, em vez de adivinhar a marca ou a cor."
        ],
        "bullets": [
          "Contorno frontal: siga o rebordo superior da ponte até às têmporas. Um canto levantado sugere cat-eye, enquanto uma linha reta com lentes profundas dá outro efeito.",
          "Rebordo e ponte: diferencie parte superior espessa, base fina, acetato contínuo, ponte metálica e plaquetas visíveis.",
          "Lateral: outro ângulo pode revelar ornamentos ou dobradiças escondidos pelo cabelo. A luz interior pode alterar a cor percebida."
        ]
      },
      {
        "heading": "Que fonte confirma um modelo específico?",
        "paragraphs": [
          "Um crédito de guarda-roupa ou campanha da marca com referência direta ao produto permite verificar o nome. A Gentle Monster, por exemplo, descreve na página oficial Jentle Salon a colaboração com JENNIE, os charms decorativos e modelos como Wispy 01.",
          "O crédito da coleção não prova que os óculos de outra fotografia sejam Wispy 01. Compare frente, hastes, acessórios, cor e código do modelo com as imagens oficiais. Se faltar evidência, evite afirmar a identificação ou autenticidade."
        ]
      },
      {
        "heading": "Recrie o pormenor de que mais gosta",
        "paragraphs": [
          "Se prefere cantos externos levantados, selecione duas armações cat-eye com subida semelhante, uma escura e outra clara. Guarde a imagem frontal de cada produto, mantendo a mesma fotografia de rosto, expressão e enquadramento ao comparar.",
          "Se prefere uma linha superior escura, consulte o guia browline. Antes de encomendar, verifique dimensões e devoluções: armações parecidas podem assentar de forma muito diferente no nariz. Uma pré-visualização não identifica pessoas nem autentica produtos."
        ]
      }
    ],
    "sources": [
      {
        "label": "Gentle Monster Jentle Salon – coleção oficial",
        "url": "https://www.gentlemonster.com/us/en/category/collections/jentle-salon"
      }
    ]
  },
  "id": {
    "title": "Cara mengenali bingkai kacamata dari foto selebritas",
    "description": "Amati bentuk depan, tepi, dan tangkai, periksa kolaborasi resmi yang terdokumentasi, lalu coba gaya serupa pada foto Anda sendiri.",
    "category": "Identifikasi gaya",
    "readTime": "5 menit baca",
    "imageAlt": "Contoh editorial bingkai cat-eye hitam, tanpa mengidentifikasi orang atau merek.",
    "imageCaption": "Contoh VisuTry: bingkai cat-eye hitam dengan sudut luar terangkat ke arah pelipis.",
    "sections": [
      {
        "heading": "Baca tiga detail pada foto asli",
        "paragraphs": [
          "Ketika Anda menyukai kacamata di foto kampanye atau gaya jalanan, simpan gambar asli serta kreditnya. Tentukan apakah Anda mencari produk yang persis sama atau hanya bentuk yang mirip. Menetapkan model tertentu membutuhkan bukti lebih kuat daripada meniru siluet.",
          "Rambut, cahaya ruangan, sudut wajah, dan lensa berwarna bisa menyembunyikan detail. Tandai bagian yang tidak terlihat sebagai «belum diketahui» dan jangan menebak merek atau warna dari satu foto."
        ],
        "bullets": [
          "Bentuk depan: ikuti garis atas dari jembatan ke pelipis. Sudut yang naik mengarah ke cat-eye; garis atas lurus dengan lensa dalam memberi kesan berbeda.",
          "Rim dan jembatan: lihat apakah bagian atas tebal dan bawah tipis, asetat menyambung, ada jembatan logam, atau bantalan hidung.",
          "Detail samping: foto lain dapat memperlihatkan hiasan tangkai atau engsel yang tertutup rambut. Cahaya dapat mengubah kesan warna."
        ]
      },
      {
        "heading": "Bukti apa yang memastikan model persis?",
        "paragraphs": [
          "Kredit busana atau kampanye merek yang menautkan produk bernama memberi referensi yang dapat diperiksa. Sebagai contoh, situs resmi Gentle Monster mencantumkan kolaborasi Jentle Salon dengan JENNIE, aksesori charm, dan daftar model termasuk Wispy 01.",
          "Namun keberadaan kolaborasi itu tidak membuktikan bahwa kacamata dalam foto lain adalah Wispy 01. Cocokkan kode, bentuk depan, tangkai, hiasan dan warna pada sumber resmi. Jangan menyatakan identitas atau keaslian jika tidak dapat diverifikasi."
        ]
      },
      {
        "heading": "Buat ulang fitur yang Anda sukai",
        "paragraphs": [
          "Jika Anda suka ujung luar yang naik, pilih dua bingkai cat-eye dengan sudut serupa, satu berwarna gelap dan satu lebih cerah. Simpan gambar depan dari penjual dan coba keduanya pada foto wajah yang sama dengan ekspresi serta crop konsisten.",
          "Jika yang menarik adalah garis atas gelap, baca panduan browline. Sebelum membeli periksa ukuran dan retur: dua model yang tampak mirip bisa berbeda pada bagian hidung. Pratinjau AI bukan alat untuk mengenali orang atau memverifikasi barang asli."
        ]
      }
    ],
    "sources": [
      {
        "label": "Koleksi resmi Gentle Monster Jentle Salon",
        "url": "https://www.gentlemonster.com/us/en/category/collections/jentle-salon"
      }
    ]
  },
  "ar": {
    "title": "كيف تتعرف على إطار نظارة من صورة أحد المشاهير؟",
    "description": "افحص الشكل الأمامي والحواف والأذرع وتحقق من تعاون موثق قبل تجربة شكل مشابه على صورتك.",
    "category": "دليل التعرّف على الأنماط",
    "readTime": "5 دقائق قراءة",
    "imageAlt": "مثال تحريري لإطار أسود على شكل عين القطة، من دون نسبة الصورة إلى شخص أو علامة.",
    "imageCaption": "مثال VisuTry لإطار عين القطة أسود بزاويتين خارجيتين ترتفعان نحو الصدغين.",
    "sections": [
      {
        "heading": "اقرأ ثلاثة تفاصيل في الصورة الأصلية",
        "paragraphs": [
          "إذا لفتتك نظارة في إعلان أو صورة أزياء شارع، احتفظ بالصورة الأصلية واسم مصدرها. حدد أولًا هل تريد الطراز المطابق أم مجرد شكل مشابه، لأن تحديد المنتج الدقيق يحتاج إلى أدلة مستقلة.",
          "قد يخفي الشعر أو الإضاءة أو زاوية الرأس أو العدسات الملونة بعض التفاصيل. اكتب «غير معروف» عند غياب معلومة بدل اختلاق اسم الطراز أو اللون من صورة واحدة."
        ],
        "bullets": [
          "الشكل الأمامي: تتبّع الحافة العليا من الجسر إلى الصدغ. الزاوية المرتفعة تشير إلى شكل عين القطة، والحافة المستقيمة مع عدسات عميقة تعطي مظهرًا آخر.",
          "الحافة والجسر: لاحظ سماكة الأعلى ورقة الأسفل، الأسيتات المتصل، الجسر المعدني، أو وسادات الأنف الظاهرة.",
          "الجوانب: قد تكشف صورة أخرى زينة الذراع أو المفصل المخفي بالشعر. تغيّر الإضاءة الداخلية اللون الذي تراه."
        ]
      },
      {
        "heading": "ما الدليل على موديل محدد بالاسم؟",
        "paragraphs": [
          "يوفّر اعتماد ملابس موثق أو حملة رسمية تربط بالمنتج دليلًا يمكن مراجعته. مثلًا، تعرض صفحة Jentle Salon الرسمية لدى Gentle Monster تعاونها مع JENNIE وزخارف charm وقائمة نماذج تضم Wispy 01.",
          "لكن توثيق التعاون لا يثبت أن نظارة في صورة أخرى هي Wispy 01. قارن رمز الطراز والواجهة والأذرع والزينة واللون بالصور الرسمية. إذا لم تتوافر أدلة كافية فتجنب الادعاء بمعرفة الشخص أو العلامة أو أصالة المنتج."
        ]
      },
      {
        "heading": "أعد إنشاء التفصيل الجمالي الذي يعجبك",
        "paragraphs": [
          "إذا أعجبتك الزوايا الخارجية المرتفعة، اختر إطارين متشابهين من نمط عين القطة، أحدهما داكن والآخر فاتح. احفظ صورتين أماميتين من البائعين واستخدم صورة وجه واحدة والتعبير والقصّ نفسيهما في المقارنة.",
          "إذا كان عنصر الجذب هو الخط الداكن عند الحاجب فارجع إلى دليل browline. قبل الشراء افحص القياسات والإرجاع، فقد يختلف إحساس الجسر بين إطارين متشابهين. تجربة الذكاء الاصطناعي لا تثبت هوية أشخاص أو أصالة سلع."
        ]
      }
    ],
    "sources": [
      {
        "label": "مجموعة Jentle Salon الرسمية لدى Gentle Monster",
        "url": "https://www.gentlemonster.com/us/en/category/collections/jentle-salon"
      }
    ]
  }
}

export function getNativeCelebrityPhotoFrameGuide(locale: Locale): NativeEditorialCopy | null {
  if (locale === 'en') return null
  const article = makeNativeRetailArticle(locale, copies[locale], '2025-10-21T14:00:00Z', '2026-11-16T00:00:00Z')
  return { ...article, relatedLabel: getNativeBrowlineGuide(locale)?.title || article.relatedLabel }
}
