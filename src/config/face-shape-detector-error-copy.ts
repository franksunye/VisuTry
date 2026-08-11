import { defaultLocale, isValidLocale, type Locale } from '@/i18n'
import type { FaceShapeFailureReason } from '@/config/face-analysis'

type FailureCopy = {
  title: string
  message: string
  hint?: string
}

type FailureCopyMap = Partial<Record<FaceShapeFailureReason, FailureCopy>> & {
  default: FailureCopy
}

const infrastructureReasons = new Set<FaceShapeFailureReason>([
  'wasm_load_failed',
  'runtime_init_failed',
  'runtime_failed',
  'model_load_failed',
  'unsupported_browser',
  'unknown',
])

const copies: Record<Locale, FailureCopyMap> = {
  en: {
    no_face: { title: 'We couldn’t clearly detect a face', message: 'Try a well-lit, straight-on photo with your full face visible.' },
    multiple_faces: { title: 'Use a photo with one person', message: 'We found more than one face. Choose a photo that shows only you.' },
    too_small: { title: 'Move closer or choose a closer photo', message: 'Your face is too small in the image for an accurate measurement.' },
    tilted: { title: 'Use a straighter photo', message: 'Keep your head upright and your eyes level with the camera.' },
    off_center: { title: 'Center your face in the photo', message: 'Keep your full face near the middle of the image.' },
    missing_landmarks: { title: 'Show your full face more clearly', message: 'Make sure your forehead, cheeks, jawline, and both eyes are visible.' },
    geometry_error: { title: 'Try a clearer front-facing photo', message: 'We could not measure this photo reliably enough.' },
    image_decode_failed: { title: 'We couldn’t read this image', message: 'Try another JPG, PNG, or WebP photo. Re-saving the image can also help.' },
    default: { title: 'We couldn’t analyze this photo', message: 'Try another photo or use a recent version of Chrome, Safari, or Edge.' },
  },
  fr: {
    no_face: { title: 'Nous n’avons pas pu détecter clairement un visage', message: 'Essayez une photo de face, bien éclairée, avec tout le visage visible.' },
    multiple_faces: { title: 'Utilisez une photo avec une seule personne', message: 'Plusieurs visages ont été détectés. Choisissez une photo où vous êtes seul.' },
    too_small: { title: 'Rapprochez-vous ou choisissez une photo plus proche', message: 'Votre visage est trop petit dans l’image pour une mesure fiable.' },
    tilted: { title: 'Utilisez une photo plus droite', message: 'Gardez la tête droite et les yeux à niveau face à l’appareil.' },
    off_center: { title: 'Centrez votre visage', message: 'Placez votre visage entier près du centre de l’image.' },
    missing_landmarks: { title: 'Montrez plus clairement votre visage', message: 'Le front, les joues, la mâchoire et les deux yeux doivent être visibles.' },
    geometry_error: { title: 'Essayez une photo de face plus nette', message: 'Cette photo ne permet pas une mesure suffisamment fiable.' },
    image_decode_failed: { title: 'Nous ne pouvons pas lire cette image', message: 'Essayez une autre photo JPG, PNG ou WebP, ou réenregistrez l’image.' },
    default: { title: 'Nous ne pouvons pas analyser cette photo', message: 'Essayez une autre photo ou une version récente de Chrome, Safari ou Edge.' },
  },
  de: {
    no_face: { title: 'Wir konnten kein Gesicht eindeutig erkennen', message: 'Nutze ein gut beleuchtetes Frontalfoto mit vollständig sichtbarem Gesicht.' },
    multiple_faces: { title: 'Nutze ein Foto mit nur einer Person', message: 'Wir haben mehrere Gesichter erkannt. Wähle ein Foto nur von dir.' },
    too_small: { title: 'Geh näher heran oder wähle ein näher aufgenommenes Foto', message: 'Dein Gesicht ist im Bild zu klein für eine zuverlässige Messung.' },
    tilted: { title: 'Nutze ein geraderes Foto', message: 'Halte den Kopf aufrecht und die Augen waagerecht zur Kamera.' },
    off_center: { title: 'Zentriere dein Gesicht', message: 'Platziere dein vollständiges Gesicht möglichst in der Bildmitte.' },
    missing_landmarks: { title: 'Zeige dein Gesicht vollständiger', message: 'Stirn, Wangen, Kiefer und beide Augen sollten sichtbar sein.' },
    geometry_error: { title: 'Versuche ein klareres Frontalfoto', message: 'Dieses Foto lässt sich nicht zuverlässig genug vermessen.' },
    image_decode_failed: { title: 'Dieses Bild konnte nicht gelesen werden', message: 'Versuche ein anderes JPG-, PNG- oder WebP-Foto oder speichere das Bild erneut.' },
    default: { title: 'Dieses Foto konnte nicht analysiert werden', message: 'Versuche ein anderes Foto oder eine aktuelle Version von Chrome, Safari oder Edge.' },
  },
  es: {
    no_face: { title: 'No pudimos detectar claramente un rostro', message: 'Prueba una foto frontal, bien iluminada y con todo el rostro visible.' },
    multiple_faces: { title: 'Usa una foto con una sola persona', message: 'Detectamos más de un rostro. Elige una foto en la que aparezcas solo tú.' },
    too_small: { title: 'Acércate o elige una foto más cercana', message: 'Tu rostro es demasiado pequeño en la imagen para medirlo con precisión.' },
    tilted: { title: 'Usa una foto más recta', message: 'Mantén la cabeza erguida y los ojos nivelados con la cámara.' },
    off_center: { title: 'Centra tu rostro', message: 'Coloca todo tu rostro cerca del centro de la imagen.' },
    missing_landmarks: { title: 'Muestra tu rostro con mayor claridad', message: 'Asegúrate de que se vean la frente, las mejillas, la mandíbula y ambos ojos.' },
    geometry_error: { title: 'Prueba una foto frontal más clara', message: 'No pudimos medir esta foto con suficiente fiabilidad.' },
    image_decode_failed: { title: 'No pudimos leer esta imagen', message: 'Prueba otra foto JPG, PNG o WebP. Volver a guardar la imagen también puede ayudar.' },
    default: { title: 'No pudimos analizar esta foto', message: 'Prueba otra foto o una versión reciente de Chrome, Safari o Edge.' },
  },
  pt: {
    no_face: { title: 'Não conseguimos detectar claramente um rosto', message: 'Tente uma foto frontal, bem iluminada e com todo o rosto visível.' },
    multiple_faces: { title: 'Use uma foto com apenas uma pessoa', message: 'Encontramos mais de um rosto. Escolha uma foto mostrando apenas você.' },
    too_small: { title: 'Aproxime-se ou escolha uma foto mais próxima', message: 'Seu rosto está pequeno demais na imagem para uma medição precisa.' },
    tilted: { title: 'Use uma foto mais reta', message: 'Mantenha a cabeça ereta e os olhos nivelados com a câmera.' },
    off_center: { title: 'Centralize seu rosto', message: 'Mantenha todo o rosto próximo ao centro da imagem.' },
    missing_landmarks: { title: 'Mostre melhor todo o rosto', message: 'Garanta que testa, bochechas, mandíbula e os dois olhos estejam visíveis.' },
    geometry_error: { title: 'Tente uma foto frontal mais nítida', message: 'Não foi possível medir esta foto com confiabilidade suficiente.' },
    image_decode_failed: { title: 'Não conseguimos ler esta imagem', message: 'Tente outra foto JPG, PNG ou WebP. Salvar a imagem novamente também pode ajudar.' },
    default: { title: 'Não conseguimos analisar esta foto', message: 'Tente outra foto ou uma versão recente do Chrome, Safari ou Edge.' },
  },
  ja: {
    no_face: { title: '顔をはっきり検出できませんでした', message: '明るい場所で、顔全体が見える正面写真をお試しください。' },
    multiple_faces: { title: '1人だけ写っている写真を使用してください', message: '複数の顔が検出されました。ご本人だけが写っている写真を選んでください。' },
    too_small: { title: 'もう少し近くで撮った写真を使用してください', message: '画像内の顔が小さすぎるため、正確に測定できません。' },
    tilted: { title: 'よりまっすぐな写真を使用してください', message: '頭をまっすぐにし、両目が水平になるようにしてください。' },
    off_center: { title: '顔を写真の中央に配置してください', message: '顔全体が画像の中央付近に入る写真を使用してください。' },
    missing_landmarks: { title: '顔全体がよりはっきり見える写真を使用してください', message: '額、頬、あご、両目が見えるようにしてください。' },
    geometry_error: { title: 'より鮮明な正面写真をお試しください', message: 'この写真では十分に信頼できる測定ができませんでした。' },
    image_decode_failed: { title: 'この画像を読み込めませんでした', message: '別のJPG、PNG、WebP画像をお試しください。画像を保存し直すのも有効です。' },
    default: { title: 'この写真を解析できませんでした', message: '別の写真、または最新のChrome、Safari、Edgeをお試しください。' },
  },
  id: {
    no_face: { title: 'Wajah tidak terdeteksi dengan jelas', message: 'Coba foto dari depan dengan pencahayaan baik dan seluruh wajah terlihat.' },
    multiple_faces: { title: 'Gunakan foto dengan satu orang', message: 'Kami mendeteksi lebih dari satu wajah. Pilih foto yang hanya menampilkan Anda.' },
    too_small: { title: 'Mendekatlah atau pilih foto yang lebih dekat', message: 'Wajah Anda terlalu kecil di dalam gambar untuk diukur dengan akurat.' },
    tilted: { title: 'Gunakan foto yang lebih tegak', message: 'Jaga kepala tetap tegak dan mata sejajar dengan kamera.' },
    off_center: { title: 'Posisikan wajah di tengah', message: 'Pastikan seluruh wajah berada dekat bagian tengah gambar.' },
    missing_landmarks: { title: 'Tampilkan seluruh wajah dengan lebih jelas', message: 'Pastikan dahi, pipi, rahang, dan kedua mata terlihat.' },
    geometry_error: { title: 'Coba foto depan yang lebih jelas', message: 'Foto ini tidak dapat diukur dengan cukup andal.' },
    image_decode_failed: { title: 'Gambar ini tidak dapat dibaca', message: 'Coba foto JPG, PNG, atau WebP lain. Menyimpan ulang gambar juga dapat membantu.' },
    default: { title: 'Foto ini tidak dapat dianalisis', message: 'Coba foto lain atau Chrome, Safari, atau Edge versi terbaru.' },
  },
  ru: {
    no_face: { title: 'Не удалось уверенно обнаружить лицо', message: 'Попробуйте хорошо освещённое фото анфас, где лицо видно полностью.' },
    multiple_faces: { title: 'Используйте фото с одним человеком', message: 'Обнаружено несколько лиц. Выберите фото, где изображены только вы.' },
    too_small: { title: 'Подойдите ближе или выберите более крупный портрет', message: 'Лицо слишком маленькое в кадре для точного измерения.' },
    tilted: { title: 'Используйте более ровное фото', message: 'Держите голову прямо, а глаза — на одном уровне.' },
    off_center: { title: 'Расположите лицо по центру', message: 'Лицо целиком должно находиться ближе к центру изображения.' },
    missing_landmarks: { title: 'Покажите лицо полнее и чётче', message: 'Лоб, щёки, линия челюсти и оба глаза должны быть видны.' },
    geometry_error: { title: 'Попробуйте более чёткое фото анфас', message: 'Это фото не удалось измерить с достаточной надёжностью.' },
    image_decode_failed: { title: 'Не удалось прочитать изображение', message: 'Попробуйте другое фото JPG, PNG или WebP либо сохраните изображение заново.' },
    default: { title: 'Не удалось проанализировать фото', message: 'Попробуйте другое фото или актуальную версию Chrome, Safari или Edge.' },
  },
  ar: {
    no_face: { title: 'تعذر اكتشاف الوجه بوضوح', message: 'جرّب صورة أمامية بإضاءة جيدة يظهر فيها الوجه بالكامل.' },
    multiple_faces: { title: 'استخدم صورة لشخص واحد فقط', message: 'تم اكتشاف أكثر من وجه. اختر صورة يظهر فيها وجهك فقط.' },
    too_small: { title: 'اقترب أكثر أو اختر صورة أقرب', message: 'الوجه صغير جدًا داخل الصورة ولا يمكن قياسه بدقة.' },
    tilted: { title: 'استخدم صورة أكثر استقامة', message: 'حافظ على الرأس مستقيمًا والعينين على مستوى واحد أمام الكاميرا.' },
    off_center: { title: 'ضع وجهك في منتصف الصورة', message: 'اجعل الوجه بالكامل قريبًا من مركز الصورة.' },
    missing_landmarks: { title: 'أظهر الوجه بالكامل بشكل أوضح', message: 'تأكد من ظهور الجبهة والخدين والفك والعينين.' },
    geometry_error: { title: 'جرّب صورة أمامية أوضح', message: 'تعذر قياس هذه الصورة بدرجة موثوقية كافية.' },
    image_decode_failed: { title: 'تعذر قراءة هذه الصورة', message: 'جرّب صورة JPG أو PNG أو WebP أخرى. قد يساعد أيضًا حفظ الصورة من جديد.' },
    default: { title: 'تعذر تحليل هذه الصورة', message: 'جرّب صورة أخرى أو إصدارًا حديثًا من Chrome أو Safari أو Edge.' },
  },
}

export function getFaceShapeDetectorFailureCopy(
  locale: string,
  reason?: FaceShapeFailureReason,
): FailureCopy {
  const resolvedLocale = isValidLocale(locale) ? locale : defaultLocale
  const localeCopy = copies[resolvedLocale]

  if (reason && localeCopy[reason]) return localeCopy[reason]!
  if (reason && infrastructureReasons.has(reason)) return localeCopy.default
  return localeCopy.default
}
