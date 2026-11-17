import type { Locale } from '@/i18n'
import type { NativeEditorialCopy } from '@/components/blog/NativeEditorialArticle'
import { makeNativeRetailArticle, type NativeBlogLocale, type LocalizedRetailArticle } from '@/config/native-retail-guide-common'

/** November 2026 US-only published workflows; no comparative fit-accuracy claim. */
const copies: Record<NativeBlogLocale, LocalizedRetailArticle> = {
  "id": {
    "title": "Perbandingan coba kacamata virtual: Warby Parker, Zenni, dan VisuTry",
    "description": "Bandingkan asal bingkai, kamera langsung atau unggah foto, serta batas akurasi ukuran pada tiga alat coba kacamata.",
    "category": "Perbandingan layanan",
    "readTime": "6 menit baca",
    "imageAlt": "Ilustrasi editorial bingkai di wajah, bukan jaminan ukuran kacamata yang tepat.",
    "imageCaption": "Ilustrasi editorial. Pratinjau visual tidak memastikan kenyamanan dan ukuran nyata.",
    "sections": [
      {
        "heading": "Dari mana asal bingkai yang Anda coba?",
        "paragraphs": [
          "Mulailah dengan melihat toko tempat model yang Anda inginkan dijual. Warby Parker dan Zenni menyediakan coba virtual untuk bingkai dalam katalog masing-masing. VisuTry menerima foto bingkai dari depan atau tangkapan layar toko lain bersama foto wajah Anda. Dengan begitu Anda bisa membandingkan dua toko tanpa menganggap VisuTry mengimpor data SKU atau memeriksa keaslian produknya.",
          "Perbandingan ini menggunakan alur publik situs Amerika Serikat yang diperiksa pada November 2026. Ini bukan pengujian kualitas gambar atau ketepatan ukuran secara langsung."
        ]
      },
      {
        "heading": "Coba produk dari katalog penjual",
        "paragraphs": [
          "Halaman Percey Chestnut Crystal di Warby Parker menampilkan pintu masuk coba virtual. Panduan resminya menjelaskan cermin virtual melalui browser komputer, tablet, atau ponsel, sedangkan aplikasi menambahkan fitur seperti menyimpan favorit. Pastikan warna dan lebar pilihan pada katalog penjual.",
          "Zenni menawarkan coba AR dengan kamera langsung dan opsi mengunggah foto wajah. Bingkai tetap dipilih dari katalog Zenni, misalnya keluarga bingkai persegi panjang hitam 44136. Zenni menganjurkan memasukkan jarak antarpupil dan memeriksa ukuran karena tampilan digital tidak membuktikan kecocokan sebenarnya."
        ]
      },
      {
        "heading": "Bandingkan dua toko pada foto yang sama",
        "paragraphs": [
          "Misalnya Anda menyimpan bingkai hitam persegi panjang dari satu toko dan cat-eye transparan dari toko lain. Ambil foto depan kedua produk dengan jelas. Gunakan potret wajah yang sama dengan cahaya merata supaya posisi alis dan sudut luar bingkai terhadap pelipis bisa dibandingkan.",
          "Simpan tautan produk, warna, dan ukuran asli. VisuTry membuat gambar diam menggunakan AI dari foto wajah dan foto bingkai, dengan kredit untuk proses khusus ini. Fitur perbandingan empat gaya bawaan merupakan proses berbeda dan tidak mengambil produk persis dari tangkapan layar toko."
        ]
      },
      {
        "heading": "Periksa ukuran fisik sebelum memesan",
        "paragraphs": [
          "Pratinjau dapat membantu memilih siluet, tetapi tidak mengukur tekanan pada hidung, panjang tangkai, resep lensa atau posisi optik yang tepat. Periksa lebar bingkai, jembatan, tangkai, bahan, dan pilihan lensa pada halaman penjual. Cobalah langsung atau minta bantuan optik jika ada keraguan.",
          "Cara kerjanya berbeda: Zenni memakai kamera AR, Warby Parker memakai cermin virtual untuk katalog sendiri, sedangkan VisuTry menghasilkan gambar diam dari foto produk. Jangan menyimpulkan ketiganya mempunyai akurasi yang sama."
        ]
      }
    ],
    "faq": [
      {
        "question": "Alat mana menerima screenshot dari toko lain?",
        "answer": "VisuTry menerima foto depan atau screenshot bingkai dengan foto wajah. Cek ulang nomor model, warna, serta ukuran pada halaman asli penjual."
      },
      {
        "question": "Apakah Zenni bisa dipakai tanpa kamera langsung?",
        "answer": "Bisa. Bantuan Zenni menyediakan unggah foto selain kamera. Produk yang dicoba tetap dari katalog Zenni."
      },
      {
        "question": "Apakah coba virtual menjamin ukuran pas?",
        "answer": "Tidak. Bandingkan lebar, jembatan hidung, dan panjang tangkai dengan kacamata yang nyaman, lalu periksa kebutuhan resep dan posisi lensa di optik."
      }
    ],
    "comparisonTable": {
      "caption": "Alur situs AS yang ditinjau pada November 2026.",
      "headers": [
        "Layanan",
        "Asal bingkai",
        "Metode pratinjau"
      ],
      "rows": [
        {
          "name": "Warby Parker",
          "source": "Katalog sendiri",
          "method": "Cermin virtual di situs atau aplikasi"
        },
        {
          "name": "Zenni",
          "source": "Katalog sendiri",
          "method": "Kamera langsung atau unggah foto"
        },
        {
          "name": "VisuTry",
          "source": "Foto depan atau screenshot toko lain",
          "method": "Foto wajah + foto bingkai → gambar AI diam"
        }
      ]
    },
    "sources": [
      {
        "label": "Warby Parker",
        "url": "https://www.warbyparker.com/ways-to-try"
      },
      {
        "label": "Zenni",
        "url": "https://www.zennioptical.com/help/frames-fitting/virtual-try-on"
      },
      {
        "label": "Percey · Warby Parker",
        "url": "https://www.warbyparker.com/eyeglasses/percey/chestnut-crystal"
      },
      {
        "label": "Zenni virtual try-on product example",
        "url": "https://www.zennioptical.com/p/classic-rectangle-eyeglasses/44136/4413621"
      }
    ]
  },
  "ar": {
    "title": "مقارنة تجربة النظارات الافتراضية: Warby Parker وZenni وVisuTry",
    "description": "قارن مصدر الإطار والتجربة بالكاميرا أو الصورة وحدود قياس المقاس الفعلي في ثلاث خدمات للنظارات.",
    "category": "مقارنة أدوات التجربة",
    "readTime": "6 دقائق قراءة",
    "imageAlt": "رسم توضيحي لتجربة إطار على صورة وجه، وليس قياسًا دقيقًا للملاءمة.",
    "imageCaption": "رسم تحريري؛ المعاينة البصرية لا تضمن ملاءمة النظارة في الواقع.",
    "sections": [
      {
        "heading": "من أين يأتي الإطار الذي تجربه؟",
        "paragraphs": [
          "ابدأ بالسؤال عن مكان بيع الإطار المطلوب. تتيح Warby Parker وZenni تجربة نماذج من كتالوج كل متجر. أما VisuTry فيقبل صورة أمامية لإطار أو لقطة شاشة من متجر آخر مع صورة وجهك. يمكنك بذلك مقارنة منتجات بائعين مختلفين، لكن VisuTry لا يستورد بيانات الطراز الرسمية ولا يصادق على أصالة المنتج.",
          "تعتمد المقارنة على الأوصاف المنشورة للمواقع الأمريكية في نوفمبر 2026، وليس على تجربة مباشرة تقيس دقة المقاس أو جودة الصورة بين الشركات."
        ]
      },
      {
        "heading": "جرّب إطارًا من كتالوج المتجر",
        "paragraphs": [
          "في صفحة Percey Chestnut Crystal تعرض Warby Parker خيار التجربة الافتراضية. يوضح دليلها أن المرآة الرقمية تعمل عبر متصفح الحاسوب أو الجهاز اللوحي أو الهاتف، مع ميزات إضافية مثل حفظ المفضلة في التطبيق. اختر اللون والعرض من كتالوج المتجر نفسه.",
          "تقدّم Zenni تجربة بالواقع المعزز باستخدام الكاميرا مباشرة، أو رفع صورة شخصية بدلًا منها. يبقى الإطار مختارًا من كتالوج Zenni، مثل نماذج المستطيل الأسود في سلسلة 44136. وتوصي الشركة بإدخال المسافة بين الحدقتين ومراجعة المقاسات، لأن العرض الرقمي لا يضمن الملاءمة الدقيقة."
        ]
      },
      {
        "heading": "قارن إطارين من متجرين على صورة واحدة",
        "paragraphs": [
          "لنفترض أنك تحفظ مستطيلًا أسود من متجر وإطارًا شفافًا ذا زوايا مرتفعة من آخر. احتفظ بصورة أمامية واضحة لكل منتج واستخدم صورة الوجه نفسها بإضاءة متساوية. راقب موضع الحافة عند الحاجبين ومدى امتداد الزوايا نحو الصدغين.",
          "احتفظ بروابط البائع واللون والقياسات الصحيحة. يصنع VisuTry صورة ثابتة بالذكاء الاصطناعي من صورة وجه وصورة منتج، ويتطلب رصيدًا لهذا الاستخدام. ومقارنة أربعة أشكال جاهزة وظيفة مختلفة لا تجلب طرازات المتجر الدقيقة من لقطات الشاشة."
        ]
      },
      {
        "heading": "افحص المقاس الحقيقي قبل الشراء",
        "paragraphs": [
          "تساعد المعاينة في اختيار الشكل لكنها لا تقيس الضغط على الأنف أو طول الأذرع أو توافق العدسات الطبية أو موضعها البصري. راجع العرض والجسر والأذرع والخامة وخيارات العدسات لدى البائع. جرّب النظارة واقعيًا أو استشر اختصاصي البصريات عند الحاجة.",
          "لا تتعامل مع النتائج كأنها متطابقة: تستخدم Zenni كاميرا AR، وتستخدم Warby Parker مرآة مرتبطة بكتالوجها، بينما ينتج VisuTry صورة ثابتة اعتمادًا على صورة المنتج. تختلف المدخلات وطبيعة النتيجة."
        ]
      }
    ],
    "faq": [
      {
        "question": "أي خدمة تقبل لقطة شاشة من متجر آخر؟",
        "answer": "يتيح VisuTry رفع صورة أمامية أو لقطة للإطار مع صورة الوجه. يجب تأكيد رمز الطراز واللون والمقاس من صفحة المتجر الأصلية."
      },
      {
        "question": "هل تعمل Zenni من دون كاميرا مباشرة؟",
        "answer": "نعم. تشرح صفحة المساعدة خيار رفع صورة إلى جانب الكاميرا، مع بقاء الإطارات من كتالوج Zenni."
      },
      {
        "question": "هل تثبت التجربة الافتراضية أن المقاس مناسب؟",
        "answer": "لا. قارن العرض والجسر والأذرع بنظارة مريحة، واستشر البائع أو اختصاصي البصريات بشأن الوصفة وموضع العدسات."
      }
    ],
    "comparisonTable": {
      "caption": "الوظائف المنشورة للمواقع الأمريكية كما في نوفمبر 2026.",
      "headers": [
        "الخدمة",
        "مصدر الإطار",
        "طريقة المعاينة"
      ],
      "rows": [
        {
          "name": "Warby Parker",
          "source": "كتالوج المتجر نفسه",
          "method": "مرآة افتراضية في الموقع أو التطبيق"
        },
        {
          "name": "Zenni",
          "source": "كتالوج المتجر نفسه",
          "method": "كاميرا مباشرة أو صورة مرفوعة"
        },
        {
          "name": "VisuTry",
          "source": "صورة إطار أمامية أو لقطة من متجر آخر",
          "method": "صورة الوجه والمنتج → صورة ثابتة بالذكاء الاصطناعي"
        }
      ]
    },
    "sources": [
      {
        "label": "Warby Parker",
        "url": "https://www.warbyparker.com/ways-to-try"
      },
      {
        "label": "Zenni",
        "url": "https://www.zennioptical.com/help/frames-fitting/virtual-try-on"
      },
      {
        "label": "Percey · Warby Parker",
        "url": "https://www.warbyparker.com/eyeglasses/percey/chestnut-crystal"
      },
      {
        "label": "Zenni virtual try-on product example",
        "url": "https://www.zennioptical.com/p/classic-rectangle-eyeglasses/44136/4413621"
      }
    ]
  },
  "ru": {
    "title": "Сравнение виртуальной примерки очков: Warby Parker, Zenni и VisuTry",
    "description": "Разберитесь, откуда берётся оправа, как работают камера и загруженное фото и почему превью не гарантирует физическую посадку.",
    "category": "Сравнение сервисов",
    "readTime": "6 мин чтения",
    "imageAlt": "Редакционная иллюстрация виртуальной примерки оправы на портрете; размер не подтверждён.",
    "imageCaption": "Редакционный пример: внешний вид на фото не гарантирует удобство настоящих очков.",
    "sections": [
      {
        "heading": "Откуда берётся модель оправы?",
        "paragraphs": [
          "Сначала определите, где продаётся нужная оправа. Warby Parker и Zenni дают примерять модели из собственных каталогов. В VisuTry можно загрузить изображение оправы спереди или скриншот другого магазина вместе с портретом. Так проще визуально сравнивать товары разных продавцов, но система не импортирует их карточки и не проверяет подлинность модели.",
          "Здесь описаны публично заявленные сценарии американских сайтов, проверенные в ноябре 2026 года. Мы не измеряли точность подгонки или качество изображений трёх систем."
        ]
      },
      {
        "heading": "Примерка конкретного товара из каталога",
        "paragraphs": [
          "У Warby Parker на странице Percey Chestnut Crystal предлагается виртуальная примерка. Руководство компании описывает веб-зеркало для компьютера, планшета и телефона, а приложение поддерживает дополнительные функции вроде сохранения понравившихся оправ. Выбирайте ширину и цвет у самого Warby Parker.",
          "Zenni предоставляет AR-примерку с камерой в реальном времени или через загрузку готовой фотографии. Оправа при этом выбирается в каталоге Zenni, например из серии чёрных прямоугольных моделей 44136. Производитель рекомендует указать межзрачковое расстояние и проверить размеры, поскольку изображение не гарантирует идеальную посадку."
        ]
      },
      {
        "heading": "Как сравнить два магазина на одном портрете",
        "paragraphs": [
          "Допустим, вы сохранили чёрные прямоугольные очки в одном магазине и прозрачный «кошачий глаз» в другом. Возьмите чёткие фотографии фронтальной части, затем сделайте обе примерки на одном портрете при одинаковом свете. Обратите внимание на линию у бровей и положение внешних углов относительно висков.",
          "Сохраните ссылки, цвет, номер модели и реальные размеры. VisuTry создаёт неподвижное изображение ИИ из портрета и фотографии товара, для этого нужен кредит. Сравнение до четырёх встроенных силуэтов — отдельный режим: оно не извлекает точные товары из скриншотов магазинов."
        ]
      },
      {
        "heading": "Что важно до оплаты заказа",
        "paragraphs": [
          "Виртуальный силуэт не определяет давление на переносицу, длину дужек, совместимость рецептурных линз или их положение. Проверяйте размер, мост, материал и условия изготовления на оригинальной странице. При сомнениях примерьте оправу лично или поговорите с оптиком.",
          "Не считайте методы одинаковыми: Zenni использует AR-камеру, Warby Parker — зеркало своего каталога, VisuTry — фото и AI-изображение конкретной оправы. Различаются как входные данные, так и результат."
        ]
      }
    ],
    "faq": [
      {
        "question": "Какой сервис работает со скриншотом оправы из другого магазина?",
        "answer": "VisuTry позволяет загрузить фронтальное изображение или скриншот вместе с портретом. Держите оригинальную карточку товара под рукой для модели, цвета и размера."
      },
      {
        "question": "Можно ли пользоваться Zenni без живой камеры?",
        "answer": "Да. В справке Zenni описана загрузка портрета наряду с камерой. Модель всё равно выбирается из каталога Zenni."
      },
      {
        "question": "Определяет ли виртуальная примерка настоящую посадку?",
        "answer": "Нет. Сравните ширину, мост и длину дужек со своими удобными очками; рецепт и положение линз уточните у продавца или оптика."
      }
    ],
    "comparisonTable": {
      "caption": "Публичные сценарии американских сайтов на ноябрь 2026 года.",
      "headers": [
        "Сервис",
        "Источник оправы",
        "Способ примерки"
      ],
      "rows": [
        {
          "name": "Warby Parker",
          "source": "Свой каталог",
          "method": "Виртуальное зеркало на сайте или в приложении"
        },
        {
          "name": "Zenni",
          "source": "Свой каталог",
          "method": "Живая камера или загруженное фото"
        },
        {
          "name": "VisuTry",
          "source": "Фото товара или скриншот любого магазина",
          "method": "Портрет и фото оправы → неподвижное изображение ИИ"
        }
      ]
    },
    "sources": [
      {
        "label": "Warby Parker",
        "url": "https://www.warbyparker.com/ways-to-try"
      },
      {
        "label": "Zenni",
        "url": "https://www.zennioptical.com/help/frames-fitting/virtual-try-on"
      },
      {
        "label": "Percey · Warby Parker",
        "url": "https://www.warbyparker.com/eyeglasses/percey/chestnut-crystal"
      },
      {
        "label": "Zenni virtual try-on product example",
        "url": "https://www.zennioptical.com/p/classic-rectangle-eyeglasses/44136/4413621"
      }
    ]
  },
  "de": {
    "title": "Virtuelle Brillenanprobe: Warby Parker, Zenni und VisuTry im Vergleich",
    "description": "Vergleichen Sie Katalogmodelle, Kamera-Anprobe und KI-Vorschau mit einem Produktfoto sowie die Grenzen für echte Passform.",
    "category": "Werkzeugvergleich",
    "readTime": "6 Min. Lesezeit",
    "imageAlt": "Redaktionelle Darstellung einer virtuellen Brillenvorschau, ohne Garantie für die tatsächliche Größe.",
    "imageCaption": "Redaktionelle Illustration: Eine Foto-Vorschau misst weder Passform noch Sehstärke.",
    "sections": [
      {
        "heading": "Woher stammt die Fassung für die Anprobe?",
        "paragraphs": [
          "Entscheidend ist zunächst, wo das konkrete Modell angeboten wird. Warby Parker und Zenni bieten virtuelle Anproben eigener Katalogartikel. Bei VisuTry laden Sie ein frontales Fassungsfoto oder den Screenshot eines anderen Shops zusammen mit einem Porträt hoch. Damit lassen sich zwei Angebote optisch vergleichen, ohne zu behaupten, VisuTry übernehme die Original-SKU-Daten oder prüfe die Echtheit.",
          "Verglichen werden die öffentlich beschriebenen Abläufe auf den US-Websites, Stand November 2026. Weder Bildqualität noch Größen- oder Passgenauigkeit wurden durch einen direkten Produkttest gemessen."
        ]
      },
      {
        "heading": "Ein Modell aus dem Sortiment des Anbieters testen",
        "paragraphs": [
          "Die Warby-Parker-Produktseite Percey Chestnut Crystal zeigt den Einstieg zur virtuellen Anprobe. Der Anbieter beschreibt einen Web-Spiegel auf Computer, Tablet und Smartphone; in der App kommen Funktionen wie das Speichern von Favoriten hinzu. Farbe und Breite wählen Sie aus dem Warby-Parker-Katalog.",
          "Zenni beschreibt eine AR-Anprobe mit Live-Kamera und alternativ das Hochladen eines Porträts. Die ausgewählte Fassung stammt dennoch aus dem Zenni-Sortiment, etwa den schwarzen Rechteckmodellen der Reihe 44136. Die Hilfe empfiehlt Pupillenabstand und Fassungsmaße zu prüfen; die virtuelle Anzeige ist kein Nachweis für die tatsächliche Passform."
        ]
      },
      {
        "heading": "Zwei verschiedene Shops mit demselben Porträt vergleichen",
        "paragraphs": [
          "Für eine schwarze Rechteckfassung und ein transparentes Cat-Eye-Modell aus verschiedenen Shops speichern Sie je ein klares Frontalfoto. Verwenden Sie bei beiden Versuchen dieselbe gleichmäßig beleuchtete Porträtaufnahme. Vergleichen Sie die Oberkante an den Brauen sowie den seitlichen Abschluss an den Schläfen.",
          "Bewahren Sie Produktlinks, Farben, Größen und Modellcodes auf. VisuTry erzeugt mit KI ein Standbild aus Porträt und konkretem Fassungsfoto; die individuelle Vorschau verbraucht Guthaben. Die separate Funktion mit vier integrierten Beispielstilen importiert keine exakten Produkte aus Shop-Screenshots."
        ]
      },
      {
        "heading": "Die tatsächliche Brille vor dem Kauf prüfen",
        "paragraphs": [
          "Ein visuelles Ergebnis sagt nichts Verlässliches über Nasenstegdruck, Bügellänge, Rezeptverträglichkeit oder genaue Glasposition aus. Prüfen Sie Breite, Steg, Bügel, Material und Glasoptionen beim Anbieter. Bei einer kritischen Größenfrage hilft eine Anprobe vor Ort oder die Beratung eines Optikers.",
          "Zenni verwendet einen AR-Kameramodus, Warby Parker ein kataloggebundenes virtuelles Spiegelangebot und VisuTry eine KI-generierte Fotovorschau. Eingaben und Ergebnisse sind verschieden und dürfen nicht pauschal als gleichwertig gelten."
        ]
      }
    ],
    "faq": [
      {
        "question": "Welcher Dienst akzeptiert einen Screenshot aus einem fremden Shop?",
        "answer": "VisuTry verarbeitet ein frontales Fassungsbild oder einen Screenshot zusammen mit Ihrem Porträt. Modellnummer, Farbe und Größe müssen Sie beim ursprünglichen Verkäufer prüfen."
      },
      {
        "question": "Kann ich Zenni ohne Live-Kamera nutzen?",
        "answer": "Ja. Die Zenni-Hilfe beschreibt das Hochladen einer Porträtaufnahme als Alternative zur Kamera. Die Fassung wählen Sie weiterhin aus dem Zenni-Katalog."
      },
      {
        "question": "Garantiert eine virtuelle Anprobe den richtigen Sitz?",
        "answer": "Nein. Vergleichen Sie Breite, Steg und Bügellänge mit einer bequemen Brille; Rezept und Glasposition lassen Sie von Verkäufer oder Optiker überprüfen."
      }
    ],
    "comparisonTable": {
      "caption": "US-Web-Angebote, überprüft im November 2026.",
      "headers": [
        "Dienst",
        "Herkunft der Fassung",
        "Vorschau-Methode"
      ],
      "rows": [
        {
          "name": "Warby Parker",
          "source": "Eigener Produktkatalog",
          "method": "Virtueller Spiegel im Web oder in der App"
        },
        {
          "name": "Zenni",
          "source": "Eigener Produktkatalog",
          "method": "Live-Kamera oder hochgeladenes Porträt"
        },
        {
          "name": "VisuTry",
          "source": "Frontales Produktfoto oder Screenshot aus einem Shop",
          "method": "Porträt + Fassungsbild → KI-generierte Standbildvorschau"
        }
      ]
    },
    "sources": [
      {
        "label": "Warby Parker",
        "url": "https://www.warbyparker.com/ways-to-try"
      },
      {
        "label": "Zenni",
        "url": "https://www.zennioptical.com/help/frames-fitting/virtual-try-on"
      },
      {
        "label": "Percey · Warby Parker",
        "url": "https://www.warbyparker.com/eyeglasses/percey/chestnut-crystal"
      },
      {
        "label": "Zenni virtual try-on product example",
        "url": "https://www.zennioptical.com/p/classic-rectangle-eyeglasses/44136/4413621"
      }
    ]
  },
  "ja": {
    "title": "メガネのバーチャル試着比較：Warby Parker・Zenni・VisuTry",
    "description": "自社カタログのメガネ、カメラ試着、商品写真からのAI試着の違いと、購入前に確認すべき実際のサイズを整理します。",
    "category": "試着サービス比較",
    "readTime": "約6分",
    "imageAlt": "顔写真にフレームを重ねたバーチャル試着の編集用イメージ。実物のサイズを保証するものではありません。",
    "imageCaption": "イメージ図です。写真上の見た目は、実際の掛け心地やサイズの保証ではありません。",
    "sections": [
      {
        "heading": "試着するフレームはどこから来る？",
        "paragraphs": [
          "まず試したい商品がどこにあるかを確認しましょう。Warby ParkerとZenniは自社カタログにあるフレームを試着します。VisuTryは他店の商品写真やスクリーンショットを、正面から撮った顔写真と一緒に使います。異なる販売店のモデルの外観を比べられますが、商品データを自動取得したり正規品やサイズを保証したりするわけではありません。",
          "ここでの比較は2026年11月に確認した米国向けの公開説明に基づきます。画像品質や実寸精度について3社の測定試験を行った結果ではありません。"
        ]
      },
      {
        "heading": "販売店のカタログから試着する場合",
        "paragraphs": [
          "Warby ParkerのPercey Chestnut Crystalの商品ページにはバーチャル試着の入口があります。公式ガイドによればパソコン・タブレット・スマートフォンのブラウザーで使え、アプリにはお気に入り保存などの追加機能があります。選ぶ色と幅は同社の商品情報で確認してください。",
          "Zenniはカメラを使うリアルタイムAR試着のほか、顔写真をアップロードする方法も案内しています。対象のフレームはZenniのカタログ品で、黒い長方形の44136シリーズなどから選びます。瞳孔間距離とフレーム寸法の確認も必要で、画面上の表示だけで適合を保証するものではありません。"
        ]
      },
      {
        "heading": "別々の店舗の2本を同じ写真で比べる",
        "paragraphs": [
          "片方は黒い長方形、もう片方は透明感のあるキャットアイという場合、両方の商品の正面画像を保存します。顔写真は同じ明るさ・ポーズで固定して試しましょう。上側のリムが眉に近いか、外側の角がこめかみまでどれくらい伸びるかを比べると、形の差がわかります。",
          "販売店の型番、色、寸法の情報は元ページと一緒に保存してください。VisuTryでは顔写真と商品写真からAIによる静止画像を生成し、個別の試着にはクレジットが必要です。内蔵フレームを最大4つ比較する機能は別で、店舗のスクリーンショットから商品を自動取得しません。"
        ]
      },
      {
        "heading": "注文前に実物の寸法を確認する",
        "paragraphs": [
          "プレビューで見た目は比べられても、鼻への圧力、テンプルの長さ、度付きレンズの対応や正確な位置は測れません。元の販売ページで幅、ブリッジ、テンプル、材質、レンズオプションを確認します。迷ったら実際に掛け、眼鏡店で調整について相談しましょう。",
          "ZenniのARカメラ、Warby Parkerのカタログ試着、VisuTryの商品写真からのAI静止画像は入力も表示方法も違います。同じ精度の仕組みとして比較しないことが大切です。"
        ]
      }
    ],
    "faq": [
      {
        "question": "他店のメガネのスクリーンショットを使えるのは？",
        "answer": "VisuTryは商品を正面から写した写真やスクリーンショットを顔写真と組み合わせます。正しい型番・カラー・サイズは元の販売店で確認してください。"
      },
      {
        "question": "Zenniはライブカメラなしで使える？",
        "answer": "はい。公式ヘルプではカメラ表示のほかに顔写真のアップロードが案内されています。対象のフレームはZenniのカタログ品です。"
      },
      {
        "question": "バーチャル試着だけでフィットするか決められる？",
        "answer": "いいえ。幅、ブリッジ、テンプル、レンズの処方への対応を確認し、必要に応じて眼鏡店で実物を試してください。"
      }
    ],
    "comparisonTable": {
      "caption": "2026年11月時点の米国向け公開サービス説明に基づく比較。",
      "headers": [
        "サービス",
        "フレームの入手元",
        "プレビュー方法"
      ],
      "rows": [
        {
          "name": "Warby Parker",
          "source": "自社カタログ",
          "method": "ウェブ・アプリのバーチャルミラー"
        },
        {
          "name": "Zenni",
          "source": "自社カタログ",
          "method": "ライブカメラまたは顔写真のアップロード"
        },
        {
          "name": "VisuTry",
          "source": "他店の商品正面写真・スクリーンショット",
          "method": "顔写真＋商品写真からAI静止画像を生成"
        }
      ]
    },
    "sources": [
      {
        "label": "Warby Parker",
        "url": "https://www.warbyparker.com/ways-to-try"
      },
      {
        "label": "Zenni",
        "url": "https://www.zennioptical.com/help/frames-fitting/virtual-try-on"
      },
      {
        "label": "Percey · Warby Parker",
        "url": "https://www.warbyparker.com/eyeglasses/percey/chestnut-crystal"
      },
      {
        "label": "Zenni virtual try-on product example",
        "url": "https://www.zennioptical.com/p/classic-rectangle-eyeglasses/44136/4413621"
      }
    ]
  },
  "es": {
    "title": "Comparativa de prueba virtual de gafas: Warby Parker, Zenni y VisuTry",
    "description": "Compara el origen de las monturas, el uso de la cámara o una fotografía y los límites de ajuste de tres herramientas de prueba virtual.",
    "category": "Comparativa de herramientas",
    "readTime": "6 min de lectura",
    "imageAlt": "Ilustración editorial de un rostro con una prueba virtual de montura, sin prometer precisión de talla.",
    "imageCaption": "Ilustración editorial. Una vista previa muestra el estilo, no garantiza el ajuste real.",
    "sections": [
      {
        "heading": "¿De dónde procede la montura que pruebas?",
        "paragraphs": [
          "Antes de elegir una herramienta, mira dónde está el modelo que quieres comprar. Warby Parker y Zenni permiten probar modelos de sus propios catálogos. VisuTry acepta la fotografía frontal de una montura o una captura de otro comercio junto a tu retrato. Así puedes comparar dos productos de tiendas distintas sin afirmar que el sistema importa sus fichas o certifica el modelo.",
          "La comparación se basa en los flujos publicados en las webs estadounidenses de los proveedores, consultados en noviembre de 2026. No se ha realizado una prueba comparativa de precisión de tallas ni de calidad de imagen."
        ]
      },
      {
        "heading": "Prueba las monturas disponibles en cada tienda",
        "paragraphs": [
          "En la ficha de las gafas Percey Chestnut Crystal de Warby Parker aparece la opción de prueba virtual. Su guía explica cómo probar modelos en el navegador desde ordenador, tableta o teléfono, con funciones adicionales de favoritos en su aplicación. Debes elegir la referencia y el ancho en el catálogo de Warby Parker.",
          "Zenni ofrece una vista previa AR con cámara en directo y también permite cargar una fotografía desde su menú. La montura se elige del catálogo Zenni, por ejemplo una rectangular negra de la familia 44136. Zenni aconseja introducir la distancia interpupilar y consultar las medidas del marco, porque la visualización no sustituye la comprobación del ajuste."
        ]
      },
      {
        "heading": "Compara dos tiendas sobre una misma fotografía",
        "paragraphs": [
          "Si tienes guardadas unas gafas rectangulares negras en una tienda y unas cat-eye translúcidas en otra, descarga una vista frontal clara de cada producto. Usa el mismo retrato con iluminación uniforme en las dos pruebas; compara el borde superior respecto a las cejas y cuánto se extienden las esquinas hacia las sienes.",
          "Guarda los enlaces, el color y las medidas originales del vendedor. En VisuTry, una prueba personalizada genera una imagen fija con IA a partir del retrato y la foto de la montura y requiere crédito. La comparación de hasta cuatro estilos predeterminados es un recorrido distinto y no recupera las referencias exactas de las capturas."
        ]
      },
      {
        "heading": "Comprueba la compra fuera de la pantalla",
        "paragraphs": [
          "Una previsualización puede ayudarte a elegir silueta, pero no mide presión sobre la nariz ni longitud de varillas, compatibilidad de lentes o ajuste óptico. Revisa anchura, puente, varillas, material y opciones de graduación en la ficha original. Prueba las gafas físicamente o consulta a un óptico si estas medidas afectan tu decisión.",
          "No compares la interfaz o los resultados como si fueran equivalentes: Zenni presenta realidad aumentada en directo, Warby Parker utiliza su espejo virtual de catálogo y VisuTry genera una previsualización con foto de producto. El método y la fuente de la montura son las diferencias esenciales."
        ]
      }
    ],
    "faq": [
      {
        "question": "¿Qué herramienta acepta una captura de gafas de otra tienda?",
        "answer": "VisuTry permite aportar una fotografía frontal o captura de la montura junto a un retrato. Recorta el producto para mostrar el frente completo y conserva la ficha original para comprobar modelo, color y talla."
      },
      {
        "question": "¿Puedo probar gafas Zenni sin cámara en directo?",
        "answer": "Sí. El manual oficial de Zenni contempla cargar una foto además del modo con cámara. En ambos casos la montura sigue procediendo de su catálogo."
      },
      {
        "question": "¿La prueba virtual confirma que las gafas me quedarán bien?",
        "answer": "No. Compara anchura, puente y longitud de varillas con unas gafas cómodas y confirma la graduación y la posición de las lentes con el vendedor o un óptico."
      }
    ],
    "comparisonTable": {
      "caption": "Flujos publicados para EE. UU., revisados en noviembre de 2026.",
      "headers": [
        "Herramienta",
        "Origen de la montura",
        "Forma de probarla"
      ],
      "rows": [
        {
          "name": "Warby Parker",
          "source": "Ficha de su propio catálogo",
          "method": "Espejo virtual en web o aplicación"
        },
        {
          "name": "Zenni",
          "source": "Ficha de su propio catálogo",
          "method": "Cámara en directo o foto subida"
        },
        {
          "name": "VisuTry",
          "source": "Foto frontal o captura de un comercio",
          "method": "Retrato + imagen de montura → vista fija generada por IA"
        }
      ]
    },
    "sources": [
      {
        "label": "Warby Parker",
        "url": "https://www.warbyparker.com/ways-to-try"
      },
      {
        "label": "Zenni",
        "url": "https://www.zennioptical.com/help/frames-fitting/virtual-try-on"
      },
      {
        "label": "Percey · Warby Parker",
        "url": "https://www.warbyparker.com/eyeglasses/percey/chestnut-crystal"
      },
      {
        "label": "Zenni virtual try-on product example",
        "url": "https://www.zennioptical.com/p/classic-rectangle-eyeglasses/44136/4413621"
      }
    ]
  },
  "pt": {
    "title": "Comparação de prova virtual de óculos: Warby Parker, Zenni e VisuTry",
    "description": "Compare armações de catálogo, câmaras em direto e pré-visualização com fotos de produto antes de escolher o melhor método.",
    "category": "Comparação de ferramentas",
    "readTime": "6 min de leitura",
    "imageAlt": "Ilustração editorial de uma armação sobre um retrato, não uma medição da adaptação real.",
    "imageCaption": "Ilustração de pré-visualização. O aspeto não garante as medidas ou o conforto.",
    "sections": [
      {
        "heading": "De onde vem a armação que quer experimentar?",
        "paragraphs": [
          "Comece por identificar onde está a armação pretendida. A Warby Parker e a Zenni permitem experimentar artigos dos respetivos catálogos. No VisuTry, pode carregar uma fotografia frontal ou uma captura de ecrã do produto de outra loja e o seu retrato. Isto permite comparar visualmente dois vendedores, mas não significa que os dados originais dos produtos sejam importados ou certificados.",
          "Esta comparação descreve os percursos publicados nos sites dos EUA em novembro de 2026. Não inclui um ensaio comparativo da precisão de tamanhos ou da qualidade das imagens."
        ]
      },
      {
        "heading": "Experimente um modelo do catálogo da loja",
        "paragraphs": [
          "A página Percey Chestnut Crystal da Warby Parker apresenta uma opção de prova virtual. O guia da marca descreve um espelho virtual no navegador, em computador, tablet ou telemóvel, e funções adicionais de favoritos na aplicação. A cor e a largura devem ser confirmadas no seu catálogo.",
          "A Zenni oferece realidade aumentada com câmara em tempo real e também a possibilidade de carregar uma fotografia. A armação tem de ser escolhida no catálogo Zenni, como os modelos retangulares pretos da série 44136. A marca recomenda indicar a distância pupilar e confirmar as medidas porque o ecrã não garante o ajuste físico."
        ]
      },
      {
        "heading": "Compare duas lojas com o mesmo retrato",
        "paragraphs": [
          "Se guardou um retângulo preto e um modelo cat-eye translúcido de lojas diferentes, recolha uma vista frontal nítida de cada produto. Mantenha o mesmo retrato e iluminação nas duas imagens; repare na linha superior junto às sobrancelhas e nos cantos exteriores próximos das têmporas.",
          "Guarde os links, cores e tamanhos dos produtos originais. O VisuTry gera uma imagem fixa com IA a partir do retrato e de uma fotografia da armação, requerendo crédito. A comparação de até quatro estilos integrados é um percurso diferente e não importa modelos exatos a partir de capturas de loja."
        ]
      },
      {
        "heading": "Confirme as medidas antes de comprar",
        "paragraphs": [
          "Uma pré-visualização não mede pressão no nariz, comprimento das hastes, compatibilidade da graduação ou colocação exata das lentes. Verifique largura, ponte, hastes, material e opções do vendedor. Se a diferença for importante, experimente pessoalmente ou consulte um ótico.",
          "O método é diferente em cada caso: a Zenni apresenta uma câmara AR, a Warby Parker um espelho do próprio catálogo e o VisuTry uma imagem fixa gerada com a fotografia de um produto. Não presuma que os resultados são equivalentes."
        ]
      }
    ],
    "faq": [
      {
        "question": "Que ferramenta usa uma captura de óculos de outra loja?",
        "answer": "O VisuTry aceita uma imagem frontal ou captura do produto juntamente com um retrato. O modelo, a cor e o tamanho têm de ser verificados na ficha original."
      },
      {
        "question": "Posso experimentar modelos Zenni sem câmara?",
        "answer": "Sim. A ajuda Zenni permite carregar uma fotografia em alternativa ao modo de câmara; a armação continua a ser do catálogo da marca."
      },
      {
        "question": "A prova virtual confirma o ajuste real?",
        "answer": "Não. Compare medidas de largura, ponte e hastes com uns óculos confortáveis e confirme a graduação e a posição das lentes com um profissional."
      }
    ],
    "comparisonTable": {
      "caption": "Percursos dos sites dos EUA, verificados em novembro de 2026.",
      "headers": [
        "Ferramenta",
        "Origem da armação",
        "Como aparece a pré-visualização"
      ],
      "rows": [
        {
          "name": "Warby Parker",
          "source": "Catálogo próprio",
          "method": "Espelho virtual na web ou aplicação"
        },
        {
          "name": "Zenni",
          "source": "Catálogo próprio",
          "method": "Câmara ao vivo ou fotografia carregada"
        },
        {
          "name": "VisuTry",
          "source": "Fotografia frontal ou captura de outra loja",
          "method": "Retrato + foto do produto → imagem fixa gerada com IA"
        }
      ]
    },
    "sources": [
      {
        "label": "Warby Parker",
        "url": "https://www.warbyparker.com/ways-to-try"
      },
      {
        "label": "Zenni",
        "url": "https://www.zennioptical.com/help/frames-fitting/virtual-try-on"
      },
      {
        "label": "Percey · Warby Parker",
        "url": "https://www.warbyparker.com/eyeglasses/percey/chestnut-crystal"
      },
      {
        "label": "Zenni virtual try-on product example",
        "url": "https://www.zennioptical.com/p/classic-rectangle-eyeglasses/44136/4413621"
      }
    ]
  },
  "fr": {
    "title": "Comparer l'essayage virtuel : Warby Parker, Zenni et VisuTry",
    "description": "Comparez la provenance des montures, l'essayage par caméra ou photo et les limites de l'ajustement réel dans trois outils.",
    "category": "Comparatif des outils",
    "readTime": "6 min de lecture",
    "imageAlt": "Illustration éditoriale d'un aperçu de lunettes sur un portrait ; elle ne garantit pas la taille.",
    "imageCaption": "Illustration éditoriale : l'apparence virtuelle ne confirme pas l'adaptation réelle.",
    "sections": [
      {
        "heading": "D'où vient la monture que vous essayez ?",
        "paragraphs": [
          "La première différence est la provenance de la monture. Warby Parker et Zenni permettent d'essayer des modèles de leurs propres catalogues. Avec VisuTry, vous fournissez une photo frontale de monture ou une capture issue d'un autre site ainsi que votre portrait. Vous pouvez comparer des produits provenant de deux boutiques, mais VisuTry ne récupère pas automatiquement les fiches ni ne confirme les références.",
          "Cette comparaison décrit les parcours annoncés sur les sites américains des trois fournisseurs en novembre 2026. Elle ne constitue pas un test de précision de taille ni de qualité visuelle."
        ]
      },
      {
        "heading": "Essayez une référence dans le catalogue d'une enseigne",
        "paragraphs": [
          "Sur la fiche Percey en Chestnut Crystal, Warby Parker présente un bouton d'essayage virtuel. Son guide décrit un miroir virtuel sur navigateur, ordinateur, tablette ou téléphone ; l'application offre notamment des favoris. Choisissez toujours la couleur et la largeur sur le catalogue Warby Parker.",
          "Zenni propose un miroir en réalité augmentée avec caméra en direct ainsi que le chargement d'un portrait. Le modèle provient toujours du catalogue Zenni, par exemple une monture rectangulaire noire de la série 44136. Le fournisseur recommande de renseigner la distance pupillaire et de vérifier les mesures : l'aperçu ne prouve pas l'ajustement exact."
        ]
      },
      {
        "heading": "Comparez deux boutiques avec un portrait identique",
        "paragraphs": [
          "Si vous hésitez entre un rectangle noir et un cat-eye translucide vendus sur deux sites, conservez les vues de face des deux modèles. Utilisez le même portrait bien éclairé pour chaque résultat, puis examinez la position du bord supérieur par rapport aux sourcils et l'extension des coins vers les tempes.",
          "Gardez les liens des produits, les coloris et leurs tailles. L'essayage VisuTry d'une monture personnalisée génère une image fixe par IA et nécessite un crédit. L'outil de comparaison de quatre styles prédéfinis constitue un autre parcours : il n'importe pas les références exactes depuis une capture d'écran."
        ]
      },
      {
        "heading": "Vérifiez les dimensions avant de commander",
        "paragraphs": [
          "Un aperçu peut aider à choisir le style sans mesurer la pression du pont, la longueur des branches, les besoins de correction ni le positionnement des verres. Contrôlez les dimensions, le matériau et les options de verres sur le site d'origine. Si la taille influence votre choix, essayez la paire physiquement ou consultez un opticien.",
          "Ces systèmes n'ont pas la même méthode : Zenni décrit une caméra AR, Warby Parker un miroir virtuel lié à son catalogue, tandis que VisuTry utilise le portrait et la photo de produit pour générer une image. Ne présumez pas que leurs résultats sont interchangeables."
        ]
      }
    ],
    "faq": [
      {
        "question": "Quel outil accepte une capture de lunettes vendues ailleurs ?",
        "answer": "VisuTry accepte une photo frontale du produit ou une capture accompagnée de votre portrait. Gardez la fiche du vendeur pour confirmer le modèle, le coloris et la taille."
      },
      {
        "question": "Puis-je essayer des montures Zenni sans caméra en direct ?",
        "answer": "Oui. La documentation Zenni prévoit le chargement d'une photo en plus du mode caméra. Les montures restent issues de son catalogue."
      },
      {
        "question": "L'essayage virtuel garantit-il un bon ajustement ?",
        "answer": "Non. Vérifiez largeur, pont, branches, correction et positionnement des verres à partir des mesures du vendeur, puis auprès d'un opticien si nécessaire."
      }
    ],
    "comparisonTable": {
      "caption": "Parcours décrits sur les sites américains, vérifiés en novembre 2026.",
      "headers": [
        "Outil",
        "Origine de la monture",
        "Méthode d'aperçu"
      ],
      "rows": [
        {
          "name": "Warby Parker",
          "source": "Catalogue de l'enseigne",
          "method": "Miroir virtuel sur web ou application"
        },
        {
          "name": "Zenni",
          "source": "Catalogue de l'enseigne",
          "method": "Caméra en direct ou portrait importé"
        },
        {
          "name": "VisuTry",
          "source": "Photo ou capture d'un autre vendeur",
          "method": "Portrait + photo du produit → image fixe générée par IA"
        }
      ]
    },
    "sources": [
      {
        "label": "Warby Parker",
        "url": "https://www.warbyparker.com/ways-to-try"
      },
      {
        "label": "Zenni",
        "url": "https://www.zennioptical.com/help/frames-fitting/virtual-try-on"
      },
      {
        "label": "Percey · Warby Parker",
        "url": "https://www.warbyparker.com/eyeglasses/percey/chestnut-crystal"
      },
      {
        "label": "Zenni virtual try-on product example",
        "url": "https://www.zennioptical.com/p/classic-rectangle-eyeglasses/44136/4413621"
      }
    ]
  }
}

export function getNativeTryOnToolComparison(locale: Locale): NativeEditorialCopy | null {
  if (locale === 'en') return null
  return makeNativeRetailArticle(locale, copies[locale], '2025-10-14T10:00:00Z', '2026-11-16T00:00:00Z')
}
