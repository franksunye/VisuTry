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

export const PRESCRIPTION_TRYON_PUBLISHED_LOCALES = ['en', 'es', 'fr'] as const satisfies readonly Locale[]

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
  }
}

export function getPrescriptionTryOnArticleCopy(locale: Locale): PrescriptionTryOnArticleCopy {
  if (locale === 'es') return copies.es
  if (locale === 'fr') return copies.fr
  return copies.en
}
