import type { Locale } from '@/i18n'
import type { NativeEditorialCopy } from '@/components/blog/NativeEditorialArticle'
import { makeNativeRetailArticle, type NativeBlogLocale, type LocalizedRetailArticle } from '@/config/native-retail-guide-common'
import { getPrescriptionTryOnArticleCopy } from '@/config/prescription-tryon-article-locales'

/** Returns reduction is a testable hypothesis, not an asserted merchant ROI result. */
const copies: Record<NativeBlogLocale, LocalizedRetailArticle> = {
  "id": {
    "title": "Cara menguji apakah coba kacamata virtual mengurangi retur",
    "description": "Ukur retur karena bentuk atau warna dari unit terkirim dan kelompok pembeli yang sebanding, bukan dari banyaknya klik pratinjau.",
    "category": "Analitik untuk toko optik",
    "readTime": "7 menit baca",
    "imageAlt": "Ilustrasi editorial fitur coba virtual untuk toko, bukan grafik hasil penurunan retur.",
    "imageCaption": "Ilustrasi editorial. Gunakan unit pesanan yang telah diterima serta retur nyata dari toko untuk menghitung hasil.",
    "sections": [
      {
        "heading": "Apa yang bisa dan tidak bisa diperbaiki oleh coba virtual",
        "paragraphs": [
          "Foto produk, tabel ukuran, dan spesifikasi membantu pembeli, tetapi belum sepenuhnya menunjukkan tampilan bingkai pada wajah sendiri. Coba virtual berbasis foto menambah konteks untuk bentuk, warna dan skala visual. Alat ini tidak menggantikan resep tepat, pilihan lensa, pengiriman andal ataupun layanan pelanggan.",
          "Selesainya pratinjau tidak membuktikan penurunan retur. Pisahkan retur karena warna atau bentuk berbeda dari harapan dari keluhan nyaman, kerusakan, resep atau kesalahan pengiriman."
        ],
        "bullets": [
          "Kepercayaan: melihat bingkai pada wajah sendiri memberi informasi lebih.",
          "Ekspektasi: pembeli dapat membandingkan bentuk, warna dan ukuran yang tampak.",
          "Alasan retur terukur: catat bentuk/warna tak sesuai harapan secara terpisah.",
          "Data pemilihan: penggunaan alat menandakan minat, bukan bukti pembelian atau retur."
        ]
      },
      {
        "heading": "Tempat terbaik menampilkan coba virtual",
        "paragraphs": [
          "Di halaman produk, letakkan di dekat foto utama sebelum memilih warna atau ukuran. Di halaman koleksi, bantu menyaring katalog yang panjang. Di keranjang, tawarkan pratinjau opsional sebelum pembayaran. Di dukungan setelah membeli, gunakan hasilnya untuk membahas harapan gaya sebelum retur diproses.",
          "Jelaskan batasan: pratinjau hanya menunjukkan tampilan dan skala perkiraan, bukan tekanan pada hidung, posisi lensa atau kenyamanan sesungguhnya."
        ],
        "bullets": [
          "Halaman produk: akses dekat gambar utama.",
          "Halaman kategori: persempit banyak pilihan.",
          "Keranjang: pengingat opsional tanpa mengubah pembayaran.",
          "Dukungan: diskusikan gaya yang diharapkan tanpa mengklaim ukuran pas."
        ]
      },
      {
        "heading": "Mulai dari beberapa bingkai tanpa katalog 3D lengkap",
        "paragraphs": [
          "AR langsung kadang memerlukan model 3D banyak produk. Coba foto dengan AI bisa dimulai dari produk populer, musiman atau SKU yang sering diretur. Pastikan gambar depan benar-benar cocok dengan nama, warna dan ukuran produk.",
          "Catat penggunaan coba virtual, tambah keranjang, pesanan, unit yang terkirim dan alasan retur sebagai metrik berbeda. Pratinjau selesai bukan penjualan, apalagi hasil penurunan retur."
        ],
        "bullets": [
          "Pilih SKU dengan kunjungan atau retur tinggi.",
          "Periksa gambar, model, warna dan ukuran.",
          "Lacak coba virtual, pesanan, pengiriman dan alasan retur.",
          "Hindari janji tentang akurasi resep atau kenyamanan."
        ]
      },
      {
        "heading": "Menghitung tingkat retur karena gaya",
        "paragraphs": [
          "Klasifikasikan setiap unit retur tepat satu alasan utama: bentuk/warna tidak sesuai, tidak nyaman, resep/lensa, rusak atau tidak diketahui. Simpan komentar asli untuk kasus ambigu.",
          "Jika memungkinkan, tawarkan pratinjau secara acak kepada separuh pengunjung memenuhi syarat. Hitung semua unit terkirim dari kedua kelompok termasuk pembeli yang tidak menggunakan alat. Untuk pembandingan sebelum dan sesudah, gunakan SKU sama dan catat perubahan harga, stok, promosi serta aturan retur.",
          "Tunggu masa retur kedua kelompok selesai. Bagi jumlah unit yang diretur karena bentuk/warna dengan semua unit memenuhi syarat yang telah terkirim. Tiga retur karena gaya dari 100 unit terkirim adalah 3%. Laporkan jumlah mentah dan retur dari semua alasan. Sampel kecil serta jendela terbuka membuat kesimpulan belum pasti."
        ],
        "bullets": [
          "1. Satu alasan utama per unit, simpan komentar yang ambigu.",
          "2. Kelompok atau SKU sebanding dengan perubahan bisnis tercatat.",
          "3. Tunggu seluruh masa retur berakhir sebelum menghitung persentase."
        ]
      }
    ],
    "merchantCta": {
      "href": "/en/business/pilot",
      "label": "Rencana pilot toko kacamata 30 hari (bahasa Inggris)",
      "notes": "Pilot 30 hari belum tentu mencakup pengiriman dan masa retur lengkap. Lanjutkan pengukuran sampai semua jendela retur berakhir."
    }
  },
  "ar": {
    "title": "كيف تختبر إن كانت تجربة النظارات الافتراضية تقلل المرتجعات؟",
    "description": "قِس مرتجعات الشكل أو اللون على أساس الوحدات المسلّمة ومجموعات قابلة للمقارنة، لا بناءً على نقرات المعاينة فقط.",
    "category": "قياس نتائج متاجر النظارات",
    "readTime": "7 دقائق قراءة",
    "imageAlt": "رسم تحريري لتجربة نظارات افتراضية لمتجر من دون بيانات فعلية لتراجع المرتجعات.",
    "imageCaption": "صورة توضيحية: استخدم الطلبات المسلّمة والمرتجعات المسجلة في متجرك لقياس النتائج.",
    "sections": [
      {
        "heading": "ما الذي تستطيع التجربة تحسينه وما الذي لا تستطيع؟",
        "paragraphs": [
          "تساعد صور المنتجات وجداول المقاسات، لكنها لا تجيب بالكامل عن شكل الإطار على وجه المشتري. قد تقلل المعاينة بالصور التردد بشأن الشكل واللون والحجم الظاهر. لكنها لا تصلح وصفة عدسات غير صحيحة أو عيوب التوصيل وخدمة العملاء أو مشاكل التوافق البصري.",
          "إتمام المعاينة ليس دليلًا على انخفاض المرتجعات. افصل حالات اللون أو الشكل المختلف عن المتوقع عن حالات عدم الراحة والعدسات والتلف والتأخير."
        ],
        "bullets": [
          "ثقة المشتري: مشاهدة الإطار على وجهه تمنحه سياقًا إضافيًا.",
          "توقعات المنتج: مقارنة الشكل واللون والحجم المرئي قبل الشراء.",
          "سبب يمكن قياسه: تسجيل الشكل/اللون غير المتوقع مستقلًا عن العيوب.",
          "إشارة اهتمام: استخدام التجربة يدل على اختيار مدروس ولا يساوي بيعًا أو مرتجعًا."
        ]
      },
      {
        "heading": "أين تضع التجربة في رحلة الشراء؟",
        "paragraphs": [
          "في صفحة المنتج ضعها قرب الصورة الأساسية قبل مقارنة الألوان والمقاسات. في صفحة المجموعة ساعد المشتري على تقليص القائمة. عند مراجعة السلة اعرض معاينة اختيارية قبل الدفع. وبعد الشراء استخدمها لمناقشة توقعات الشكل قبل طلب الإرجاع.",
          "احرص على ألا تعد بقياس ضغط الجسر أو موضع العدسات أو الراحة الفعلية. الهدف هو معاينة المظهر والنسب التقريبية."
        ],
        "bullets": [
          "صفحة المنتج: قرب الصورة الرئيسية.",
          "صفحة المجموعة: اختيار قائمة قصيرة من الكتالوج.",
          "مراجعة السلة: خطوة اختيارية لا تعطل الدفع.",
          "خدمة العملاء: مناقشة اختلاف التوقعات قبل الإرجاع."
        ]
      },
      {
        "heading": "ابدأ بعدد قليل من الإطارات بدل كتالوج ثلاثي الأبعاد",
        "paragraphs": [
          "قد تتطلب تجارب الواقع المعزز المباشر نماذج ثلاثية الأبعاد كثيرة. يمكن لتجربة الصور بالذكاء الاصطناعي أن تبدأ بإطارات شائعة أو موسمية أو عالية المرتجعات. تحقق من تطابق الصورة الأمامية مع الطراز واللون الصحيحين.",
          "اجمع أحداث استخدام المعاينة إلى جانب إضافة السلة والطلبات والوحدات المسلّمة وأسباب الإرجاع كلًا على حدة. صورة مكتملة لا تعني طلبًا ولا تؤكد توفير المال."
        ],
        "bullets": [
          "اختر إطارات ذات زيارات أو مرتجعات مرتفعة.",
          "طابق الصورة مع رمز الطراز واللون والمقاس.",
          "سجّل التجربة والشراء والتسليم والسبب الرئيسي للإرجاع.",
          "لا تعد بدقة وصفة العدسات أو الراحة على الأنف."
        ]
      },
      {
        "heading": "كيف تحسب معدل الإرجاع المرتبط بالشكل؟",
        "paragraphs": [
          "صنّف كل وحدة مرتجعة بسبب رئيسي واحد: شكل/لون غير متوقع، عدم راحة، وصفة/عدسات، عيب أو غير معروف. احتفظ بتعليق العميل الأصلي للحالات الملتبسة.",
          "إن أمكن اعرض التجربة عشوائيًا على نصف الزوار المؤهلين، واحسب جميع الوحدات المسلّمة في كل مجموعة حتى إن لم يستخدم المشتري المعاينة. وفي مقارنة قبل/بعد استخدم رموز SKU نفسها وسجّل تغيّر الأسعار والمخزون والعروض وسياسة الإرجاع.",
          "انتظر حتى تُغلق فترة الإرجاع في المجموعتين. اقسم عدد الوحدات المعادة بسبب لون أو شكل غير متوقع على جميع الوحدات المؤهلة المسلّمة. ثلاث حالات من أصل 100 وحدة = 3%. اعرض الأعداد ونسبة الإرجاع لجميع الأسباب أيضًا؛ العينات الصغيرة والفترات المفتوحة لا تثبت أثرًا."
        ],
        "bullets": [
          "1. سبب رئيسي واحد لكل وحدة مع حفظ التعليقات.",
          "2. مجموعات أو سلع قابلة للمقارنة مع توثيق التغييرات.",
          "3. انتهاء فترتي الإرجاع قبل حساب النسبة."
        ]
      }
    ],
    "merchantCta": {
      "href": "/en/business/pilot",
      "label": "خطة تجربة متجر نظارات لمدة 30 يومًا (بالإنجليزية)",
      "notes": "قد لا تشمل 30 يومًا جميع مواعيد التسليم والإرجاع. مدّد القياس حتى تنتهي نافذة الإرجاع لجميع المجموعات."
    }
  },
  "ru": {
    "title": "Как проверить, уменьшает ли виртуальная примерка возвраты очков",
    "description": "Сравнивайте возвраты из-за цвета и формы на доставленных единицах и сопоставимых группах, не выдавая просмотры за снижение возвратов.",
    "category": "Аналитика для оптик",
    "readTime": "7 мин чтения",
    "imageAlt": "Редакционная иллюстрация виртуальной примерки для магазина, без заявленных результатов по возвратам.",
    "imageCaption": "Редакционный пример. Для расчёта используйте фактические доставленные заказы и возвраты магазина.",
    "sections": [
      {
        "heading": "Что примерка может изменить, а что — нет",
        "paragraphs": [
          "Фотографии товара, размерные таблицы и характеристики помогают, но не отвечают полностью на вопрос, как конкретная оправа выглядит на покупателе. Фото-примерка даёт информацию о контуре, цвете и приблизительном визуальном масштабе. Она не исправляет рецепт, неверные линзы, задержки доставки или плохой сервис.",
          "Сам факт использования примерки не доказывает сокращение возвратов. Отдельно учитывайте возвраты из-за неожиданной формы или цвета и не смешивайте их с дискомфортом, браком и проблемами зрения."
        ],
        "bullets": [
          "Уверенность: собственный портрет помогает представить форму лучше каталожного снимка.",
          "Ожидания: перед заказом можно сравнить контур, цвет и визуальный масштаб.",
          "Проверяемая причина возврата: выделяйте форму или цвет, не совпавшие с ожиданием.",
          "Данные о выборе: действия с примеркой показывают интерес, но не являются продажами или возвращёнными товарами."
        ]
      },
      {
        "heading": "В каких точках покупки предлагать примерку",
        "paragraphs": [
          "В карточке товара расположите действие возле главного фото, до выбора цвета и размера. В каталоге помогите сократить длинный список моделей. В корзине ненавязчиво предложите проверить внешний вид до оформления. При поддержке после покупки обсуждайте ожидания стиля, а не объявляйте результат доказательством посадки.",
          "Обозначайте ограничения: изображение показывает внешний вид и приблизительный масштаб, не измеряя давление моста, совместимость линз или комфорт."
        ],
        "bullets": [
          "Карточка товара: действие рядом с основным изображением.",
          "Категория: короткий список вместо десятков вариантов.",
          "Корзина: добровольный просмотр без изменения процесса оплаты.",
          "Служба поддержки: разговор о стилевых ожиданиях перед возвратом."
        ]
      },
      {
        "heading": "Как начать небольшой пилот без полного 3D-каталога",
        "paragraphs": [
          "Для AR в реальном времени может потребоваться большая 3D-база моделей. AI-примерка по фотографии может начать с нескольких ходовых оправ, сезонных вариантов или SKU с высокими возвратами. Для каждой позиции проверьте фронтальное изображение, цвет и код модели.",
          "Разместите примерку рядом с фотографией товара и учитывайте её события наряду с корзинами, доставленными изделиями и записанными причинами возвратов. Завершённое изображение не равно заказу и не является готовым показателем экономии."
        ],
        "bullets": [
          "Выберите высокопосещаемые или проблемные по возвратам модели.",
          "Проверьте соответствие фото товару и цвету.",
          "Собирайте примерки, покупки, доставки и причины возвратов отдельно.",
          "Не обещайте точного физического размера или проверки рецепта."
        ]
      },
      {
        "heading": "Как рассчитать возврат по стилевым причинам",
        "paragraphs": [
          "Назначьте каждой возвращённой единице одну главную категорию: неожиданный цвет/форма, неудобная посадка, рецепт/линзы, дефект либо неизвестно. Не удаляйте исходный комментарий, если случай неоднозначен.",
          "По возможности случайно предложите примерку половине подходящих посетителей. В каждом назначенном варианте учитывайте все доставленные единицы, даже если покупатель не воспользовался примеркой. Для сравнения до/после используйте одинаковые SKU и документируйте цены, наличие, акции и политику возврата.",
          "Дождитесь завершения окна возврата для обоих вариантов. Разделите возвращённые из-за формы/цвета единицы на все подходящие доставленные единицы. Три таких возврата из 100 доставленных изделий — 3%. Публикуйте также абсолютные числа и общий возврат. Малые выборки, разный ассортимент и незакрытые сроки делают результат неопределённым."
        ],
        "bullets": [
          "1. Один основной мотив возврата на единицу с сохранением пояснения.",
          "2. Сопоставимые группы или SKU и учёт параллельных изменений.",
          "3. Завершённые сроки возврата до расчёта процентной доли."
        ]
      }
    ],
    "merchantCta": {
      "href": "/en/business/pilot",
      "label": "План пилота магазина оптики (англ.)",
      "notes": "30-дневный пилот может завершиться раньше доставки и окончания сроков возврата. Измерение следует продолжать до закрытия окон всех когорт."
    }
  },
  "de": {
    "title": "Senkt virtuelle Brillenanprobe die Retouren? So testen Händler es",
    "description": "Vergleichen Sie stilbedingte Retouren nach zugestellten Einheiten und vergleichbaren Gruppen, statt aus Klicks eine Reduktion abzuleiten.",
    "category": "Händler-Analyseratgeber",
    "readTime": "7 Min. Lesezeit",
    "imageAlt": "Redaktionelles Bild zu virtueller Brillenanprobe im Shop ohne tatsächliche Retourenmessung.",
    "imageCaption": "Redaktionelle Illustration: Die Auswertung muss auf zugestellten Bestellungen und echten Rücksendungen beruhen.",
    "sections": [
      {
        "heading": "Was die virtuelle Anprobe beeinflussen kann und was nicht",
        "paragraphs": [
          "Produktfotos, Größentabellen und Maße helfen, aber beantworten nicht vollständig, wie eine Fassung am eigenen Gesicht wirkt. Die Fotovorschau kann Fragen zu Form, Farbe und visueller Größe klären. Sie ersetzt weder korrekte Rezepte, passende Gläser, zuverlässigen Versand noch Kundenservice.",
          "Dass Kunden eine Vorschau benutzen, ist noch kein Nachweis für geringere Retouren. Trennen Sie Rücksendungen wegen unerwarteter Form oder Farbe von physischem Unbehagen, Defekten, Rezeptproblemen und Lieferfehlern."
        ],
        "bullets": [
          "Kaufsicherheit: das eigene Porträt liefert zusätzlichen Kontext.",
          "Erwartung an den Stil: Form, Farbe und scheinbare Größe vor Kauf vergleichen.",
          "Messbarer Rücksendegrund: abweichende Form oder Farbe getrennt dokumentieren.",
          "Merchandising-Signal: Anproben zeigen Interesse, ersetzen aber keine Zustell- oder Retourendaten."
        ]
      },
      {
        "heading": "Wo sich die Vorschau im Kaufprozess anbietet",
        "paragraphs": [
          "Auf Produktseiten direkt neben der Hauptaufnahme und vor der Größenwahl, auf Kategorieseiten zum Eingrenzen der Auswahl, im Warenkorb als freiwillige Erinnerung und im Kundendienst zur Klärung stilbezogener Fragen vor einer Rücksendung.",
          "Kommunizieren Sie die Grenze deutlich: Es geht um visuelle Wirkung und ungefähre Proportionen, nicht um gemessenen Stegdruck, Augenposition oder Tragekomfort."
        ],
        "bullets": [
          "Produktseite: neben dem zentralen Fassungsbild platzieren.",
          "Kategorie: viele Modelle zu einer engeren Auswahl reduzieren.",
          "Warenkorb: freiwilliger Check ohne Eingriff in die Bezahlung.",
          "Kundenservice: Stilabweichungen besprechen, nicht körperliche Passform behaupten."
        ]
      },
      {
        "heading": "Klein anfangen ohne vollständigen 3D-Katalog",
        "paragraphs": [
          "Echtzeit-AR kann umfangreiche 3D-Modelle benötigen. Ein Test mit KI-Fotovorschau kann mit einigen beliebten, saisonalen oder oft zurückgegebenen Fassungen starten. Die Bilder müssen zum konkreten Modell und Farbcode passen.",
          "Erfassen Sie die Anprobenutzung getrennt von Warenkörben, zugestellten Einheiten und Retourengründen. Eine fertige Vorschau ist keine Bestellung und beweist keine wirtschaftliche Wirkung."
        ],
        "bullets": [
          "Häufig besuchte oder retourenstarke Fassungen auswählen.",
          "Frontalfoto, Modellnummer, Farbe und Maße überprüfen.",
          "Nutzung, Bestellung, Zustellung und Retourengrund getrennt erfassen.",
          "Kein Versprechen über Rezeptgenauigkeit oder physische Passform abgeben."
        ]
      },
      {
        "heading": "Stilbedingte Retouren korrekt berechnen",
        "paragraphs": [
          "Jeder zurückgesendeten Einheit wird genau ein Hauptgrund zugeordnet: unerwartete Form/Farbe, physischer Druck, Rezept/Gläser, Beschädigung oder unbekannt. Bewahren Sie bei Unklarheiten die originale Kundenanmerkung auf.",
          "Wenn möglich, bieten Sie die Vorschau zufällig der Hälfte der geeigneten Besucher an. Zählen Sie alle zugestellten Einheiten beider zugewiesener Gruppen, selbst wenn einzelne Kunden die Vorschau auslassen. Für Vorher/Nachher-Analysen bleiben die SKU gleich und Änderungen bei Preis, Lager, Werbung und Rückgaberegeln werden offengelegt.",
          "Warten Sie, bis die Rückgabefrist in beiden Gruppen abgelaufen ist. Teilen Sie zurückgegebene Fassungen wegen unerwarteter Form oder Farbe durch alle geeigneten zugestellten Fassungen. Drei Stil-Retouren unter 100 zugestellten Einheiten ergeben 3 %. Melden Sie auch Rohzahlen und alle Rücksendegründe. Kleine Mengen oder offene Fristen erlauben keine sichere Aussage."
        ],
        "bullets": [
          "1. Pro zurückgesendeter Einheit genau einen Hauptgrund erfassen.",
          "2. Vergleichbare Gruppen/SKU verwenden und Paralleländerungen festhalten.",
          "3. Erst nach Ende beider Rückgabefristen einen Prozentsatz bilden."
        ]
      }
    ],
    "merchantCta": {
      "href": "/en/business/pilot",
      "label": "30-Tage-Pilotplan für Optiker (Englisch)",
      "notes": "Ein 30-Tage-Pilot ist nicht automatisch so lang wie die Zustell- und Rückgabefristen. Verlängern Sie die Auswertung bis zum vollständigen Abschluss der Gruppen."
    }
  },
  "ja": {
    "title": "バーチャル試着でメガネの返品が減るか検証する方法",
    "description": "商品到着後の返品理由と対象本数を比較し、形・色への期待違いによる返品だけを測定する実務ガイドです。",
    "category": "眼鏡店向け測定ガイド",
    "readTime": "約7分",
    "imageAlt": "眼鏡店向けバーチャル試着の編集用イラスト。返品削減を実測した図ではありません。",
    "imageCaption": "説明用イラスト。実際の測定には店舗の配送済み商品と返品記録を使います。",
    "sections": [
      {
        "heading": "試着で改善できること、できないこと",
        "paragraphs": [
          "商品写真、サイズ表、商品寸法は大切ですが、顧客が自分の顔に掛けたときの形や色の見え方までは十分に伝えられません。写真によるプレビューは、輪郭・色・見かけの大きさについて判断材料を増やします。一方、処方内容、レンズの適合、配送、接客品質を代替できません。",
          "試着画像が完成しただけでは返品減少の証拠になりません。「思っていた形や色と違う」という返品を、装着の不快感、不良品、度数の問題、配送トラブルと分けて記録します。"
        ],
        "bullets": [
          "購入判断の補助：自分の顔で比較する情報が増える。",
          "商品のイメージ：購入前にフレームの形や見かけの大きさを確認できる。",
          "検証可能な返品理由：形や色への期待違いを独立した分類にする。",
          "商品選択の行動：試着利用データは関心を表すが、注文や返品の結果ではない。"
        ]
      },
      {
        "heading": "購入導線のどこに設置するか",
        "paragraphs": [
          "商品詳細ページでは主画像の近くに置き、色やサイズを決める前に利用できるようにします。一覧ページでは多くの候補を絞り込むために、カートでは注文前の任意確認として、購入後のサポートではスタイルの期待差を話し合うために使えます。",
          "ただし見た目とおおよその比率を確認する仕組みであって、ブリッジの圧力やレンズの位置、実際の装着感まで測れるという表示は避けましょう。"
        ],
        "bullets": [
          "商品詳細：主画像付近で試着を案内する。",
          "商品一覧：多くのモデルを候補に絞る。",
          "カート：決済を妨げない任意確認を置く。",
          "購入後：返品前のスタイル相談の手掛かりにする。"
        ]
      },
      {
        "heading": "3Dカタログを作らずに始める",
        "paragraphs": [
          "リアルタイムARは広範な3D商品モデルを必要とする場合がありますが、写真ベースのAI試着なら、人気モデルや返品の多いSKUなど少数から検証できます。商品正面画像、型番、色が一致していることを確認してください。",
          "試着の利用状況は、カート追加、注文、配送済み本数、返品理由と別々に集計します。画像を生成した回数から売上や返品削減を推定しないことが重要です。"
        ],
        "bullets": [
          "閲覧数が多い、または返品理由が多いモデルから選ぶ。",
          "正面画像の色・型番・サイズを商品記録と合わせる。",
          "試着・注文・配送・返品を別指標として記録する。",
          "処方精度や装着感の保証と誤解させない。"
        ]
      },
      {
        "heading": "見た目による返品率の計算方法",
        "paragraphs": [
          "返品された1本につき主な理由を一つ付けます。例えば「形・色が想定と違う」「装着の不快感」「処方・レンズ」「不良」「不明」です。曖昧な場合は元の顧客コメントを保存します。",
          "可能なら対象訪問者をランダムに2群に割り付け、一方だけに試着を提示します。試着を使わなかった購入者も含め、各群の配送済みフレーム本数を数えます。前後比較なら同じSKUを対象にして、価格、在庫、販促、返品規約の変化を記録しましょう。",
          "両群の返品可能期間が完全に終わってから、形・色の期待違いによる返品本数を対象の配送済み本数で割ります。100本中3本なら3%。絶対数と全理由による返品率も併記します。件数が少ない、返品期間が開いたまま、商品構成が異なる場合は効果を断定できません。"
        ],
        "bullets": [
          "1. 返品された1本に主な理由を一つだけ付ける。",
          "2. 対象SKUや割付群をそろえ、同時期の変更を記録する。",
          "3. すべての返品可能期間が閉じてから率を計算する。"
        ]
      }
    ],
    "merchantCta": {
      "href": "/en/business/pilot",
      "label": "眼鏡店向け30日パイロット計画（英語）",
      "notes": "30日間の試験だけでは配送・返品の期間が終わらない場合があります。すべての対象群が締め切られるまで観察を延長してください。"
    }
  },
  "es": {
    "title": "Cómo comprobar si la prueba virtual reduce las devoluciones de gafas",
    "description": "Mide las devoluciones por forma o color en unidades entregadas y cohortes comparables, sin confundir clics con una reducción demostrada.",
    "category": "Investigación para ópticas",
    "readTime": "7 min de lectura",
    "imageAlt": "Ilustración editorial de prueba virtual para una tienda de gafas; no representa resultados comerciales medidos.",
    "imageCaption": "Ilustración editorial: utiliza pedidos entregados y devoluciones reales de tu comercio para calcular cualquier efecto.",
    "sections": [
      {
        "heading": "Qué puede mejorar una prueba virtual y qué no",
        "paragraphs": [
          "Las fichas de producto, fotografías y tablas de medidas ayudan, pero no responden por completo a cómo se verá una montura sobre el rostro del comprador. Una previsualización puede reducir incertidumbre sobre silueta, color y escala aparente. No sustituye una receta correcta, lentes adecuadas, envío fiable ni atención al cliente.",
          "Distingue hipótesis de resultados: que un cliente vea una montura no demuestra que después la conserve. Registra específicamente las devoluciones por aspecto inesperado y sepáralas de problemas de graduación, incomodidad, daños o retrasos."
        ],
        "bullets": [
          "Confianza en la elección: ver la montura en el propio rostro aporta contexto que una foto del producto por sí sola no da.",
          "Expectativas sobre el aspecto: el cliente compara líneas, color y tamaño aparente antes de pagar.",
          "Motivo de devolución evaluable: clasifica por separado forma o color distintos de lo esperado.",
          "Señales de interés: la interacción con la prueba indica qué modelos se consideran, pero no reemplaza pedidos ni devoluciones."
        ]
      },
      {
        "heading": "Dónde situar la prueba en la compra",
        "paragraphs": [
          "Elige puntos donde una vista previa permita tomar una decisión. En la página de producto, junto a la foto principal; en colecciones, para convertir una lista extensa en pocas alternativas; en el carrito, como recordatorio antes de finalizar; y en atención posventa, para conversar sobre expectativas de estilo antes de tramitar una devolución.",
          "Mantén etiquetas y mensajes prudentes: se muestra el aspecto visual y la escala aproximada, no una medición de comodidad, lentes o ajuste óptico."
        ],
        "bullets": [
          "Página de producto: prueba antes de comparar colores y tallas.",
          "Página de colección: crea una lista corta en vez de abrir decenas de fichas.",
          "Revisión del carrito: ofrece el acceso sin bloquear ni alterar el pago.",
          "Soporte posventa: revisa el estilo elegido sin usar la imagen como prueba de ajuste."
        ]
      },
      {
        "heading": "Cómo empezar en una tienda pequeña",
        "paragraphs": [
          "La realidad aumentada en tiempo real puede exigir modelos tridimensionales y un catálogo amplio. Un piloto de imágenes con IA puede comenzar con unas pocas monturas de alta demanda, modelos de temporada o referencias con muchas devoluciones. Usa fotografías frontales bien identificadas y conserva código de modelo y color.",
          "Para cada producto, coloca la entrada cerca de la imagen principal y registra el uso de la prueba junto a añadir al carrito, unidades entregadas y devoluciones posteriores. No equipares completar la prueba a una compra ni anuncies una caída porcentual sin datos."
        ],
        "bullets": [
          "Selecciona pocas referencias de alto tráfico o devolución.",
          "Comprueba que cada imagen corresponde al color y talla anunciados.",
          "Anota uso de la prueba, pedido, entrega y razón principal de devolución.",
          "Mide estilo y escala percibida, no precisión de receta o ajuste físico."
        ]
      },
      {
        "heading": "Cómo medir devoluciones relacionadas con el estilo",
        "paragraphs": [
          "Clasifica cada unidad devuelta una sola vez por motivo principal: forma/color inesperados, incomodidad física, graduación o lente, defecto, u otro/desconocido. Conserva el comentario original si una explicación es ambigua.",
          "Si puedes, asigna al azar a la mitad de visitantes elegibles la opción de prueba y compara todos los artículos entregados en cada grupo, incluso cuando una persona no utilice la función. Si comparas antes y después, usa los mismos SKU y documenta cambios de precio, stock, promociones y política de devoluciones.",
          "Espera a que termine el plazo de devolución en ambos grupos. La tasa por estilo es unidades devueltas por forma/color inesperados divididas entre todas las unidades elegibles entregadas. Tres devoluciones de estilo entre 100 unidades entregadas equivalen al 3%; publica también los recuentos y la tasa de todos los motivos. Un número pequeño o ventanas incompletas no permite atribuir un efecto fiable."
        ],
        "bullets": [
          "1. Registra un único motivo principal por unidad, conservando texto ambiguo.",
          "2. Compara grupos asignados o SKU semejantes y reconoce cambios simultáneos.",
          "3. Espera a que ambas ventanas de devolución finalicen antes de dividir las devoluciones de estilo entre las unidades entregadas."
        ]
      }
    ],
    "merchantCta": {
      "href": "/en/business/pilot",
      "label": "Plan de piloto para ópticas (recurso en inglés)",
      "notes": "Una prueba de 30 días no garantiza que estén completos los plazos de entrega y devolución. Amplía la medición hasta que todas las cohortes cierren sus ventanas."
    }
  },
  "pt": {
    "title": "A prova virtual reduz as devoluções de óculos? Como medir",
    "description": "Meça devoluções relacionadas com forma e cor em unidades entregues e grupos comparáveis, sem prometer um efeito baseado apenas em cliques.",
    "category": "Avaliação para óticas",
    "readTime": "7 min de leitura",
    "imageAlt": "Ilustração editorial de prova virtual para lojas, sem resultados reais de devoluções.",
    "imageCaption": "Ilustração editorial: utilize entregas e devoluções registadas pela sua loja para calcular o resultado.",
    "sections": [
      {
        "heading": "O que a prova virtual pode e não pode resolver",
        "paragraphs": [
          "Fotografias, fichas de produto e tabelas de medidas são essenciais, mas não respondem completamente a como uma armação fica no rosto do cliente. Uma pré-visualização pode reduzir dúvidas sobre forma, cor e escala aparente. Não substitui receitas corretas, lentes adequadas, entrega fiável ou apoio ao cliente.",
          "Uma prova realizada não significa que houve menos devoluções. Registe separadamente devoluções causadas por forma ou cor inesperadas, desconforto físico, problemas de graduação, danos e falhas de transporte."
        ],
        "bullets": [
          "Confiança: ver uma armação no próprio rosto oferece informação adicional.",
          "Expectativas: comparar silhueta, cor e proporção antes de comprar.",
          "Devolução que se pode testar: distinguir forma/cor de defeito ou desconforto.",
          "Dados de interesse: uso da prova indica consideração, mas não confirma vendas ou devoluções."
        ]
      },
      {
        "heading": "Onde apresentar a prova no percurso de compra",
        "paragraphs": [
          "Na página de produto, coloque-a junto à imagem principal antes de escolher tamanho e cor. Na coleção, ajuda a reduzir uma longa lista a poucas opções. No carrinho, pode ser uma verificação opcional. No apoio após compra, serve para conversar sobre expectativas de estilo sem afirmar que prova o ajuste físico.",
          "Deixe claros os limites: pré-visualiza aparência e escala aproximada, não pressão na ponte, posição das lentes ou conforto real."
        ],
        "bullets": [
          "Produto: ação próxima da fotografia principal.",
          "Coleção: transformar catálogo numa lista curta.",
          "Carrinho: lembrete opcional sem afetar o pagamento.",
          "Apoio: esclarecer expectativas antes de iniciar uma devolução."
        ]
      },
      {
        "heading": "Comece com poucas armações, sem catálogo 3D completo",
        "paragraphs": [
          "Uma solução AR em tempo real pode exigir muitos modelos 3D. Uma experiência de fotografia com IA pode começar por algumas armações populares, sazonais ou com muitas devoluções. Confirme que a foto frontal corresponde à referência e à cor exatas.",
          "Acompanhe eventos da pré-visualização, adição ao carrinho, encomendas, entregas e motivos de devolução como métricas distintas. Nem clicar nem concluir uma prova equivale a poupar devoluções."
        ],
        "bullets": [
          "Escolher modelos de alto tráfego ou devolução.",
          "Conferir fotografia, referência, cor e tamanho.",
          "Registar prova, compra, entrega e razão principal de devolução.",
          "Evitar promessas de precisão da receita ou conforto."
        ]
      },
      {
        "heading": "Calcule a taxa de devolução por estilo",
        "paragraphs": [
          "Classifique cada unidade devolvida com um único motivo principal: forma/cor inesperada, desconforto, receita/lentes, defeito ou desconhecido. Guarde o comentário original quando o motivo for ambíguo.",
          "Se possível, atribua aleatoriamente a possibilidade de prova a metade dos visitantes elegíveis. Inclua todas as unidades entregues de cada grupo, mesmo quando alguém não utiliza a prova. Numa comparação antes/depois, mantenha os SKU e assinale alterações de preço, stock, campanhas e políticas.",
          "Espere pelo fim dos prazos de devolução dos dois grupos. Divida as unidades devolvidas por forma/cor inesperadas por todas as unidades elegíveis entregues. Três devoluções em 100 unidades significam 3%. Apresente contagens absolutas e taxa de todas as razões; amostras pequenas ou períodos incompletos não demonstram o efeito."
        ],
        "bullets": [
          "1. Um motivo principal por unidade e comentários preservados.",
          "2. Grupos comparáveis e registo das alterações comerciais.",
          "3. Encerrar a janela de devolução antes do cálculo."
        ]
      }
    ],
    "merchantCta": {
      "href": "/en/business/pilot",
      "label": "Plano-piloto para óticas (em inglês)",
      "notes": "Um piloto de 30 dias pode não cobrir a entrega e todo o período de devolução; acompanhe os grupos até ao fim das respetivas janelas."
    }
  },
  "fr": {
    "title": "Mesurer si l'essayage virtuel réduit les retours de lunettes",
    "description": "Comparez les retours pour style ou couleur inattendus sur des unités livrées et des cohortes comparables, sans promettre un effet non mesuré.",
    "category": "Mesure pour les opticiens",
    "readTime": "7 min de lecture",
    "imageAlt": "Illustration éditoriale d'essayage virtuel en boutique, sans résultats de ventes prouvés.",
    "imageCaption": "Illustration éditoriale : utilisez les livraisons et retours enregistrés par votre commerce.",
    "sections": [
      {
        "heading": "Ce qu'un essayage virtuel peut et ne peut pas améliorer",
        "paragraphs": [
          "Les photos, dimensions et fiches produits sont nécessaires, mais ne montrent pas totalement le rendu d'une monture sur le visage de chaque client. L'aperçu peut éclairer le choix de silhouette, de couleur et d'échelle apparente. Il ne corrige ni l'ordonnance, ni les verres, ni la logistique ou le service après-vente.",
          "Une prévisualisation utilisée n'est pas une preuve de réduction des retours. Séparez les retours pour couleur ou forme inattendue des défauts, de l'inconfort et des problèmes de correction."
        ],
        "bullets": [
          "Confiance : voir la monture sur son propre visage ajoute du contexte aux photos de produit.",
          "Attentes : l'acheteur peut comparer style et proportions avant sa décision.",
          "Raison de retour ciblée : identifier les écarts de forme ou de coloris attendus.",
          "Données d'intérêt : l'essayage signale les modèles envisagés, pas les ventes ni les retours réalisés."
        ]
      },
      {
        "heading": "Où proposer l'essayage dans le parcours d'achat",
        "paragraphs": [
          "Sur la fiche produit, placez-le près de l'image principale avant le choix des couleurs et tailles. Dans la collection, aidez à limiter une grande sélection. Dans le panier, proposez un dernier aperçu facultatif. En service après-vente, utilisez le résultat pour discuter des attentes stylistiques, pas comme preuve qu'une paire convient.",
          "Ne promettez pas la mesure du confort ou du positionnement des verres : l'aperçu montre uniquement une apparence et une taille visuelle approximative."
        ],
        "bullets": [
          "Fiche produit : aperçu avant de départager tailles ou finitions.",
          "Collection : une présélection plutôt que l'ouverture de nombreuses fiches.",
          "Panier : rappel sans perturber le paiement.",
          "Support : clarifier une question de style avant la demande de retour."
        ]
      },
      {
        "heading": "Un pilote accessible sans catalogue 3D complet",
        "paragraphs": [
          "Une solution AR en temps réel peut nécessiter une modélisation 3D importante. Une prévisualisation IA par photo peut commencer avec un petit groupe de best-sellers, de montures saisonnières ou de références souvent retournées. Vérifiez la correspondance entre photo frontale, modèle et coloris.",
          "Ajoutez l'essayage près de l'image principale, puis suivez son utilisation en parallèle des paniers, unités livrées et motifs de retour. Un clic ou un aperçu terminé ne doit pas être présenté comme une commande, encore moins comme un gain prouvé."
        ],
        "bullets": [
          "Commencez par des modèles très consultés ou souvent retournés.",
          "Vérifiez modèle, couleur, taille et image de chaque référence.",
          "Reliez usage de l'aperçu, commande, livraison et motif de retour.",
          "Annoncez un rendu stylistique, pas une précision de correction ou de confort."
        ]
      },
      {
        "heading": "Calculer le taux de retour lié au style",
        "paragraphs": [
          "Attribuez un motif principal unique à chaque unité retournée : forme ou couleur inattendue, gêne physique, ordonnance ou verres, défaut, ou inconnu. Conservez le commentaire original pour les cas ambigus.",
          "Si possible, proposez l'essayage de manière aléatoire à la moitié des visiteurs éligibles et comptez toutes les unités livrées des deux groupes, même si l'acheteur n'a pas essayé. Pour un avant/après, gardez les mêmes références et notez prix, disponibilité, campagnes et conditions de retour.",
          "Attendez la fin de la période de retour pour les deux groupes. Divisez les unités revenues pour une forme/couleur inattendue par toutes les unités éligibles livrées. Trois retours stylistiques parmi 100 unités livrées donnent 3 %. Affichez aussi les nombres et tous motifs confondus ; des volumes faibles ou des délais ouverts rendent la conclusion incertaine."
        ],
        "bullets": [
          "1. Un seul motif principal par unité, sans supprimer les commentaires ambigus.",
          "2. Des groupes comparables, en documentant les changements commerciaux.",
          "3. Une période de retour achevée pour chaque groupe avant le calcul."
        ]
      }
    ],
    "merchantCta": {
      "href": "/en/business/pilot",
      "label": "Plan pilote pour opticiens (en anglais)",
      "notes": "Un pilote de 30 jours ne couvre pas nécessairement les délais de livraison et de retour ; prolongez la mesure jusqu'à fermeture des périodes éligibles."
    }
  }
}

export function getNativeEyewearReturnsStudy(locale: Locale): NativeEditorialCopy | null {
  if (locale === 'en') return null
  const copy = makeNativeRetailArticle(locale, copies[locale], '2026-05-27T10:00:00Z', '2026-11-15T00:00:00Z')
  return { ...copy, relatedLabel: getPrescriptionTryOnArticleCopy(locale).title }
}
