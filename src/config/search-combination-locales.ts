import { defaultLocale, isValidLocale, type Locale } from '@/i18n'
import {
  COMBINATION_SEARCH_PAGES,
  type CombinationSearchPage,
} from '@/config/search-combination-pages'

type FaceKey = 'round' | 'oval' | 'square' | 'heart' | 'diamond' | 'long'
type FrameKey = 'rectangle' | 'square' | 'browline' | 'catEye' | 'geometric' | 'aviator' | 'oversized' | 'round' | 'rimless' | 'rounded'
type AudienceKey = 'women' | 'men'

type Descriptor =
  | { type: 'face-frame'; face: FaceKey; frame: FrameKey }
  | { type: 'gender-style'; face: FaceKey; audience: AudienceKey }
  | { type: 'decision-question' }

type DecisionCopy = {
  title: string
  primary: string
  why: string
  watch: string
  tip: string
}

type LocalePack = {
  faces: Record<FaceKey, string>
  frames: Record<FrameKey, string>
  audience: Record<AudienceKey, string>
  faceGoal: Record<FaceKey, string>
  frameReason: Record<FrameKey, string>
  frameWatch: Record<FrameKey, string>
  strings: {
    faceFrameTitle: string
    faceFrameMeta: string
    faceFrameEyebrow: string
    faceFramePrimary: string
    faceFrameWhy: string
    faceFrameWatch: string
    faceFrameTip: string
    genderTitle: string
    genderMeta: string
    genderEyebrow: string
    genderPrimary: string
    genderWhy: string
    genderWatch: string
    genderTip: string
    decisionMeta: string
    faqSuit: string
    faqBeforeBuy: string
    faqFaceShapeEnough: string
    faqFaceShapeEnoughAnswer: string
    faqGender: string
    faqGenderAnswer: string
    faqNarrow: string
    faqFastValidate: string
    faqVirtualLimit: string
    faqVirtualLimitAnswer: string
    detector: string
    tryOn: string
    compare: string
    advisor: string
  }
  decisions: Record<string, DecisionCopy>
  shell: CombinationGuideShellCopy
}

export type CombinationGuideShellCopy = {
  howToStart: string
  howToCheck: string
  howToValidate: string
  stepShortlist: string
  stepCheck: string
  stepValidate: string
  visualDisclaimer: string
  faqEyebrow: string
  faqTitle: string
  quickAnswer: string
  whatToTryFirst: string
  why: string
  whyDirection: string
  watchFor: string
  whatCanGoWrong: string
  decisionTip: string
  doNotDecideFromLabel: string
  openBroaderGuide: string
  exploreRelated: string
  moreFocusedGuides: string
  viewAllGuides: string
}

const descriptors: Record<string, Descriptor> = {
  'best-rectangle-glasses-for-round-face': { type: 'face-frame', face: 'round', frame: 'rectangle' },
  'best-square-glasses-for-round-face': { type: 'face-frame', face: 'round', frame: 'square' },
  'best-browline-glasses-for-round-face': { type: 'face-frame', face: 'round', frame: 'browline' },
  'best-cat-eye-glasses-for-round-face': { type: 'face-frame', face: 'round', frame: 'catEye' },
  'best-geometric-glasses-for-round-face': { type: 'face-frame', face: 'round', frame: 'geometric' },
  'best-cat-eye-glasses-for-oval-face': { type: 'face-frame', face: 'oval', frame: 'catEye' },
  'best-aviator-glasses-for-oval-face': { type: 'face-frame', face: 'oval', frame: 'aviator' },
  'best-browline-glasses-for-oval-face': { type: 'face-frame', face: 'oval', frame: 'browline' },
  'best-oversized-glasses-for-oval-face': { type: 'face-frame', face: 'oval', frame: 'oversized' },
  'best-round-glasses-for-square-face': { type: 'face-frame', face: 'square', frame: 'round' },
  'best-aviator-glasses-for-square-face': { type: 'face-frame', face: 'square', frame: 'aviator' },
  'best-rimless-glasses-for-square-face': { type: 'face-frame', face: 'square', frame: 'rimless' },
  'best-rounded-glasses-for-heart-shaped-face': { type: 'face-frame', face: 'heart', frame: 'rounded' },
  'best-cat-eye-glasses-for-heart-shaped-face': { type: 'face-frame', face: 'heart', frame: 'catEye' },
  'best-browline-glasses-for-diamond-face': { type: 'face-frame', face: 'diamond', frame: 'browline' },
  'best-oversized-glasses-for-long-face': { type: 'face-frame', face: 'long', frame: 'oversized' },
  'glasses-for-round-face-women': { type: 'gender-style', face: 'round', audience: 'women' },
  'glasses-for-round-face-men': { type: 'gender-style', face: 'round', audience: 'men' },
  'glasses-for-oval-face-women': { type: 'gender-style', face: 'oval', audience: 'women' },
  'glasses-for-oval-face-men': { type: 'gender-style', face: 'oval', audience: 'men' },
  'glasses-for-square-face-women': { type: 'gender-style', face: 'square', audience: 'women' },
  'glasses-for-square-face-men': { type: 'gender-style', face: 'square', audience: 'men' },
  'glasses-for-heart-shaped-face-women': { type: 'gender-style', face: 'heart', audience: 'women' },
  'glasses-for-diamond-face-women': { type: 'gender-style', face: 'diamond', audience: 'women' },
  'do-round-glasses-suit-a-round-face': { type: 'decision-question' },
  'do-aviators-suit-an-oval-face': { type: 'decision-question' },
  'are-cat-eye-glasses-good-for-round-faces': { type: 'decision-question' },
  'should-glasses-cover-your-eyebrows': { type: 'decision-question' },
  'how-wide-should-glasses-be-for-my-face': { type: 'decision-question' },
  'how-should-glasses-fit-your-face': { type: 'decision-question' },
}

function format(template: string, values: Record<string, string>) {
  return template.replace(/\{(\w+)\}/g, (_, key) => values[key] ?? '')
}

const packs: Partial<Record<Locale, LocalePack>> = {
  ja: {
    faces: { round: '丸顔', oval: '卵型の顔', square: '四角い顔', heart: 'ハート型の顔', diamond: 'ダイヤ型の顔', long: '面長の顔' },
    frames: { rectangle: '長方形フレーム', square: 'スクエアフレーム', browline: 'ブローライン', catEye: 'キャットアイ', geometric: '幾何学フレーム', aviator: 'アビエーター', oversized: 'オーバーサイズ', round: 'ラウンドフレーム', rimless: 'リムレス', rounded: '丸みのあるフレーム' },
    audience: { women: '女性向け', men: '男性向け' },
    faceGoal: { round: '曲線に少し構造やリフトを加えると比較しやすくなります。', oval: 'バランスが取りやすいため、形よりサイズ感と表情を重視できます。', square: '強い輪郭を和らげるか、あえて構造を強調するかを決めます。', heart: '上部を重くしすぎず、下側にも自然な存在感を残します。', diamond: '頬骨を圧迫せず、こめかみ周辺に自然な幅を加えます。', long: '横幅を広げすぎず、レンズの深さで縦方向の長さを整えます。' },
    frameReason: { rectangle: '直線と角が顔に明確な構造を加えます。', square: 'はっきりした角が輪郭とのコントラストを作ります。', browline: '上部に視線を集め、下側は軽く見せられます。', catEye: '外側の持ち上がりが上向きの動きと表情を加えます。', geometric: '複数の直線が意図的なアクセントを作ります。', aviator: '丸みとテーパーが柔らかさと存在感を両立します。', oversized: 'レンズの深さと存在感を増やせます。', round: '曲線が強い角をやわらげます。', rimless: '輪郭線を減らし、視覚的な重さを抑えます。', rounded: '柔らかな曲線で上部の重さを増やさずにバランスを取ります。' },
    frameWatch: { rectangle: '幅が狭すぎたりレンズが浅すぎたりしないか確認してください。', square: '太すぎるリムや狭すぎる幅は顔を重く見せることがあります。', browline: '上部ラインが眉の角度と大きくずれないか確認してください。', catEye: '外側の持ち上がりが強すぎたり幅が狭すぎたりしないようにします。', geometric: '角と太いリムが重なり、情報量が多くなりすぎないようにします。', aviator: 'レンズが深すぎたりブリッジが低すぎたりしないか確認してください。', oversized: 'こめかみを大きく越えたり頬にかかりすぎたりしないようにします。', round: '小さすぎる丸型は顔に対して縮んで見えることがあります。', rimless: '軽さだけでなく、レンズ幅と深さが十分か確認してください。', rounded: '上部の装飾や幅が強すぎないようにします。' },
    strings: {
      faceFrameTitle: '{face}に合う{frame}', faceFrameMeta: '{face}と{frame}の組み合わせを、形・幅・サイズ感から確認し、写真で試着して判断できます。', faceFrameEyebrow: '{face} × {frame}', faceFramePrimary: '{frame}は{face}の有力な候補です。{reason} {goal}', faceFrameWhy: '{reason} {goal}', faceFrameWatch: '{watch} 最後は幅、ブリッジ、レンズの深さも合わせて確認してください。', faceFrameTip: '{frame}と異なる形を同じ写真で並べて比較し、形の名前ではなく顔全体との比率で決めます。',
      genderTitle: '{face}のメガネ選び：{audience}', genderMeta: '{face}の{audience}メガネ選び。形、サイズ、雰囲気を絞り、写真で候補を比較します。', genderEyebrow: '{face}・{audience}', genderPrimary: '{face}では、まず顔全体の比率と求める雰囲気を決めます。{goal}', genderWhy: '性別ラベルより、幅、眉との位置、レンズの深さ、素材感の組み合わせが見え方を左右します。', genderWatch: '流行やカテゴリ名だけで選ばず、実際の幅、ブリッジ、快適さを確認してください。', genderTip: '雰囲気の異なる3本を同じ写真で比較すると、短時間で候補を絞れます。',
      decisionMeta: '{title} 判断のポイントと注意点を確認し、写真で候補を比較できます。', faqSuit: '{frame}は{face}に似合いますか？', faqBeforeBuy: '{frame}を買う前に何を確認すべきですか？', faqFaceShapeEnough: '顔型だけでフレームを選べますか？', faqFaceShapeEnoughAnswer: 'いいえ。顔型は最初の絞り込みです。幅、ブリッジ、レンズの深さ、度数、快適さ、好みも確認してください。', faqGender: '性別でフレーム形状を決めるべきですか？', faqGenderAnswer: 'いいえ。ここでの分類はスタイルの入口です。比率、フィット、快適さ、度数、好みを優先してください。', faqNarrow: '候補をどう絞ればよいですか？', faqFastValidate: '最短で確認する方法は？', faqVirtualLimit: 'バーチャル試着で確認できないことは？', faqVirtualLimitAnswer: '見た目は確認できますが、実際の圧迫感、ブリッジの当たり、光学測定、度数適合は確認できません。購入前に販売店や専門家で確認してください。', detector: '顔型を確認', tryOn: '写真で試着', compare: 'フレームを比較', advisor: 'パーソナル提案を見る',
    },
    decisions: {
      'do-round-glasses-suit-a-round-face': { title: '丸顔に丸メガネは似合う？', primary: 'はい。丸型同士は柔らかく調和した印象になります。より輪郭を出したい場合は長方形、スクエア、控えめなキャットアイも比較してください。', why: '同じ形は調和を作り、異なる形はコントラストを作ります。どちらが正解というより、求める印象で決まります。', watch: '小さすぎる丸型は顔の丸みを強調したり、サイズ不足に見えたりします。', tip: '丸型と長方形を同じ写真で並べ、調和とコントラストのどちらが自然か比較してください。' },
      'do-aviators-suit-an-oval-face': { title: '卵型の顔にアビエーターは似合う？', primary: '多くの場合似合います。卵型はバランスがよく、レンズの深さとブリッジ位置が適切ならアビエーターを取り入れやすい顔型です。', why: '顔の比率がすでに安定しているため、補正よりスタイルとサイズ感で選べます。', watch: 'レンズが深すぎたりブリッジが低すぎたりすると、実寸以上に大きく見えます。', tip: '標準的なアビエーターと浅めのモデルを写真で比較し、顔の長さに合う方を選びます。' },
      'are-cat-eye-glasses-good-for-round-faces': { title: '丸顔にキャットアイは似合う？', primary: 'はい。外側のリフトが強すぎなければ、丸顔の曲線に斜めの動きと輪郭を加えられます。', why: '視線を外上方へ導き、重い長方形フレームを使わずに構造を加えます。', watch: '幅が狭すぎるキャットアイは顔を圧迫して見せることがあります。', tip: '控えめなキャットアイと長方形を比べ、リフト感と直線的な構造のどちらが好みか確認します。' },
      'should-glasses-cover-your-eyebrows': { title: 'メガネは眉毛にかかってもいい？', primary: '多少重なることは問題ありません。上部リムが眉の流れと自然に関係しているかが重要です。', why: '眉との位置関係はフレームを自然に見せますが、すべてのデザインに同じルールがあるわけではありません。', watch: '眉を完全に隠し、さらに頬にも低くかかる場合は、フレームが大きすぎる可能性があります。', tip: '高さの異なる2本を正面写真で比較し、眉の見え方だけでなく上部リムとの関係を見ます。' },
      'how-wide-should-glasses-be-for-my-face': { title: 'メガネの横幅は顔に対してどれくらい？', primary: '目安は、フレーム全幅がこめかみ付近の顔幅に近く、強い締め付けや大きな張り出しがないことです。', why: '適切な幅は目をレンズ中央付近に保ち、窮屈さや過度な大きさを避けやすくします。', watch: '大きな張り出し、テンプルの開き、頬より明らかに狭いフレームは注意が必要です。', tip: '中幅とやや広めを写真で比較し、最後に実寸とテンプルのフィットを販売店で確認してください。' },
      'how-should-glasses-fit-your-face': { title: 'メガネは顔にどうフィットするのが理想？', primary: '中央に安定して乗り、ブリッジでずれず、テンプルが大きく開かず、レンズサイズが顔の特徴に合っている状態が目安です。', why: '幅、ブリッジ、眉との位置、レンズの深さ、頬とのクリアランスを合わせて見ることで自然なバランスになります。', watch: '写真では圧迫感、ずれ、耳周りの当たり、度数に必要な測定までは確認できません。', tip: '写真では見た目の比率を確認し、購入前に実寸と実際のフィットを確認してください。' },
    },
    shell: { howToStart: '判断ポイントから始める', howToCheck: '比率とフィットを確認', howToValidate: '写真で確認', stepShortlist: '候補の方向を絞る', stepCheck: '比率を確認', stepValidate: '写真で確認', visualDisclaimer: 'バーチャル試着は見た目の比率確認に役立ちます。正確な寸法、快適さ、度数要件は購入前に別途確認してください。', faqEyebrow: '判断を確認', faqTitle: '選ぶ前によくある質問', quickAnswer: '短い答え', whatToTryFirst: '最初に試すこと', why: '理由', whyDirection: 'この方向が合う理由', watchFor: '注意点', whatCanGoWrong: '合わなく見える原因', decisionTip: '判断のヒント', doNotDecideFromLabel: 'カテゴリ名だけで決めない', openBroaderGuide: '顔型別の総合ガイドを見る', exploreRelated: '関連する判断を探す', moreFocusedGuides: '関連するメガネガイド', viewAllGuides: 'すべてのガイドを見る' },
  },
  de: {
    faces: { round: 'rundes Gesicht', oval: 'ovales Gesicht', square: 'eckiges Gesicht', heart: 'herzförmiges Gesicht', diamond: 'rautenförmiges Gesicht', long: 'längliches Gesicht' },
    frames: { rectangle: 'Rechteckbrillen', square: 'Quadratbrillen', browline: 'Browline-Brillen', catEye: 'Cat-Eye-Brillen', geometric: 'geometrische Brillen', aviator: 'Aviator-Brillen', oversized: 'Oversize-Brillen', round: 'runde Brillen', rimless: 'randlose Brillen', rounded: 'abgerundete Brillen' },
    audience: { women: 'für Frauen', men: 'für Männer' },
    faceGoal: { round: 'Etwas Struktur oder Lift schafft einen klaren Kontrast zu weicheren Konturen.', oval: 'Die Proportionen sind flexibel, daher zählen Maßstab und Ausdruck besonders.', square: 'Entscheidend ist, ob die Fassung die markanten Winkel mildert oder bewusst betont.', heart: 'Die obere Gesichtshälfte sollte nicht zusätzlich beschwert werden.', diamond: 'Die Wangenknochen brauchen Raum, während an den Schläfen kontrollierte Breite helfen kann.', long: 'Mehr Linsentiefe kann die vertikale Länge ausgleichen, ohne unnötig breit zu werden.' },
    frameReason: { rectangle: 'Gerade Linien und sichtbare Ecken geben klare Struktur.', square: 'Kräftige Ecken erzeugen einen deutlichen geometrischen Kontrast.', browline: 'Der stärkere obere Rand setzt einen Akzent an den Brauen und hält die untere Linse leichter.', catEye: 'Der äußere Schwung bringt Lift und diagonale Bewegung.', geometric: 'Mehrere gerade Kanten setzen einen bewussten grafischen Akzent.', aviator: 'Weiche Rundungen und die verjüngte Form verbinden Ausdruck mit Leichtigkeit.', oversized: 'Mehr Linsentiefe und Präsenz können die Proportionen verändern.', round: 'Kurven mildern starke Winkel.', rimless: 'Weniger Rand reduziert visuelles Gewicht.', rounded: 'Weiche Kurven schaffen Balance ohne zusätzliche Schwere oben.' },
    frameWatch: { rectangle: 'Achte darauf, dass die Fassung nicht deutlich schmaler als die Wangen oder zu flach ist.', square: 'Sehr dicke Ränder oder zu wenig Breite können schwer wirken.', browline: 'Die obere Linie sollte mit den Brauen arbeiten und nicht dagegen.', catEye: 'Ein zu schmaler oder extrem hochgezogener Außenwinkel kann unruhig wirken.', geometric: 'Viele Kanten plus dicker Rand können schnell zu dominant werden.', aviator: 'Zu tiefe Gläser oder ein sehr tiefer Steg können die Brille übergroß wirken lassen.', oversized: 'Die Fassung sollte nicht weit über die Schläfen hinausragen oder auf den Wangen liegen.', round: 'Sehr kleine runde Gläser können unterdimensioniert wirken.', rimless: 'Auch ohne Rand müssen Breite und Linsentiefe stimmen.', rounded: 'Zu viel Dekor oder Gewicht am oberen Rand kann die Balance stören.' },
    strings: {
      faceFrameTitle: '{frame} für ein {face}', faceFrameMeta: '{frame} bei einem {face}: Proportion, Breite und Maßstab prüfen und den Look anschließend auf dem eigenen Foto testen.', faceFrameEyebrow: '{face} × {frame}', faceFramePrimary: '{frame} sind für ein {face} eine sinnvolle Richtung. {reason} {goal}', faceFrameWhy: '{reason} {goal}', faceFrameWatch: '{watch} Prüfe zusätzlich Breite, Steg und Linsentiefe.', faceFrameTip: 'Vergleiche {frame} mit einer deutlich anderen Form auf demselben Foto und entscheide nach Proportion statt nach dem Kategorienamen.',
      genderTitle: 'Brillen für ein {face}: {audience}', genderMeta: 'Praktische Brillenwahl {audience} mit einem {face}: Formen eingrenzen, Maßstab prüfen und auf dem eigenen Foto vergleichen.', genderEyebrow: '{face} · {audience}', genderPrimary: 'Bei einem {face} sollte die Auswahl mit Proportion und gewünschtem Ausdruck beginnen. {goal}', genderWhy: 'Geschlechtslabels sind weniger wichtig als Breite, Brauenlinie, Linsentiefe, Material und der gewünschte Stil.', genderWatch: 'Wähle nicht nur nach Trend oder Kategorie. Steg, Breite, Komfort und reale Maße bleiben entscheidend.', genderTip: 'Vergleiche drei deutlich unterschiedliche Stilrichtungen auf demselben Foto und reduziere so die Auswahl.',
      decisionMeta: '{title} Die wichtigsten Kriterien, Risiken und eine schnelle visuelle Prüfung vor dem Kauf.', faqSuit: 'Passen {frame} zu einem {face}?', faqBeforeBuy: 'Was sollte ich vor dem Kauf von {frame} prüfen?', faqFaceShapeEnough: 'Reicht die Gesichtsform für die Brillenwahl?', faqFaceShapeEnoughAnswer: 'Nein. Sie ist ein erster Filter. Breite, Steg, Linsentiefe, Sehstärke, Komfort und persönlicher Stil müssen ebenfalls passen.', faqGender: 'Soll das Geschlecht die Rahmenform bestimmen?', faqGenderAnswer: 'Nein. Die Einteilung beschreibt nur häufige Styling-Absichten. Proportion, Passform, Komfort und persönlicher Stil sind wichtiger.', faqNarrow: 'Wie grenze ich die Auswahl ein?', faqFastValidate: 'Wie prüfe ich die Wahl am schnellsten?', faqVirtualLimit: 'Was kann eine virtuelle Anprobe nicht bestätigen?', faqVirtualLimitAnswer: 'Sie zeigt die Optik, aber nicht Druckstellen, exakten Stegsitz, optische Messwerte oder Eignung für die Sehstärke. Das muss real geprüft werden.', detector: 'Gesichtsform prüfen', tryOn: 'Auf meinem Foto testen', compare: 'Fassungen vergleichen', advisor: 'Persönliche Beratung öffnen',
    },
    decisions: {
      'do-round-glasses-suit-a-round-face': { title: 'Passen runde Brillen zu einem runden Gesicht?', primary: 'Ja. Rund auf rund kann bewusst weich und harmonisch wirken. Für mehr Definition lohnt der Vergleich mit Rechteck, Quadrat oder einem dezenten Cat-Eye.', why: 'Ähnliche Formen schaffen Harmonie, kontrastierende Formen mehr Definition. Entscheidend ist die gewünschte Wirkung.', watch: 'Sehr kleine runde Fassungen können die Fülle betonen oder unterdimensioniert wirken.', tip: 'Vergleiche eine runde und eine rechteckige Fassung auf demselben Foto und prüfe, ob Harmonie oder Kontrast besser wirkt.' },
      'do-aviators-suit-an-oval-face': { title: 'Passen Aviator-Brillen zu einem ovalen Gesicht?', primary: 'Meist ja. Ovale Proportionen vertragen die verjüngte Form gut, solange Linsentiefe, Steg und Gesamtbreite stimmen.', why: 'Das Gesicht ist bereits ausgewogen, daher kann die Auswahl stärker nach Stil und Maßstab erfolgen.', watch: 'Sehr tiefe Gläser oder ein tief sitzender Steg können die Fassung übergroß wirken lassen.', tip: 'Vergleiche einen klassischen Aviator mit einer flacheren Variante und wähle die passendere Linsentiefe.' },
      'are-cat-eye-glasses-good-for-round-faces': { title: 'Sind Cat-Eye-Brillen gut für runde Gesichter?', primary: 'Ja, besonders mit kontrolliertem Schwung. Der äußere Lift setzt diagonale Bewegung gegen weichere Wangen und Kieferlinien.', why: 'Die Form lenkt den Blick nach außen oben und schafft Struktur ohne eine schwere rechteckige Fassung.', watch: 'Ein sehr schmales Cat-Eye kann das Gesicht optisch zusammendrücken.', tip: 'Vergleiche ein dezentes Cat-Eye mit einem Rechteck und entscheide zwischen Lift und klarer Geometrie.' },
      'should-glasses-cover-your-eyebrows': { title: 'Dürfen Brillen die Augenbrauen bedecken?', primary: 'Eine leichte Überlappung ist völlig normal. Wichtiger ist, dass der obere Rand natürlich zur Brauenlinie passt.', why: 'Die Beziehung zur Braue beeinflusst, wie zentriert und bewusst die Fassung wirkt, ist aber keine starre Regel.', watch: 'Wenn die Brauen komplett verdeckt sind und die Fassung zusätzlich tief auf den Wangen sitzt, kann sie zu groß sein.', tip: 'Vergleiche zwei Rahmenhöhen frontal und bewerte die Beziehung zwischen oberem Rand und Brauen.' },
      'how-wide-should-glasses-be-for-my-face': { title: 'Wie breit sollte eine Brille für mein Gesicht sein?', primary: 'Als Ausgangspunkt sollte die Gesamtbreite ungefähr zur Gesichtsbreite an den Schläfen passen, ohne stark zu drücken oder weit überzustehen.', why: 'Proportionale Breite hält die Augen näher an der Linsenmitte und vermeidet einen gequetschten oder übergroßen Eindruck.', watch: 'Großer Überstand, deutlich aufspreizende Bügel oder eine viel zu schmale Fassung sind Warnzeichen.', tip: 'Vergleiche mittelbreit und etwas breiter auf demselben Foto und bestätige danach die Millimetermaße beim Händler.' },
      'how-should-glasses-fit-your-face': { title: 'Wie sollte eine Brille im Gesicht sitzen?', primary: 'Sie sollte zentriert wirken, sicher am Steg sitzen, keine starke Bügelspreizung zeigen und eine Linsengröße haben, die zu den Gesichtszügen passt.', why: 'Gute visuelle Balance entsteht aus Breite, Stegposition, Brauenlinie, Linsentiefe und Wangenabstand zusammen.', watch: 'Ein Foto kann Druckstellen, Rutschen, Ohrkomfort oder optische Messwerte nicht bestätigen.', tip: 'Nutze die virtuelle Anprobe für Proportionen und bestätige Maße und echten Sitz vor dem Kauf.' },
    },
    shell: { howToStart: 'Mit der Entscheidungsfrage starten', howToCheck: 'Proportion und Passform prüfen', howToValidate: 'Auf dem eigenen Foto validieren', stepShortlist: 'Richtung eingrenzen', stepCheck: 'Proportion prüfen', stepValidate: 'Auf dem Foto validieren', visualDisclaimer: 'Virtuelle Anprobe hilft bei der visuellen Proportion. Exakte Maße, Komfort und Sehstärke müssen vor dem Kauf separat bestätigt werden.', faqEyebrow: 'Entscheidung prüfen', faqTitle: 'Häufige Fragen vor der Auswahl', quickAnswer: 'Kurzantwort', whatToTryFirst: 'Was zuerst testen?', why: 'Warum', whyDirection: 'Warum diese Richtung funktionieren kann', watchFor: 'Achte auf', whatCanGoWrong: 'Was den Look stören kann', decisionTip: 'Entscheidungstipp', doNotDecideFromLabel: 'Nicht nur nach dem Label entscheiden', openBroaderGuide: 'Breiteren Gesichtsform-Guide öffnen', exploreRelated: 'Ähnliche Entscheidungen', moreFocusedGuides: 'Weitere gezielte Brillenguides', viewAllGuides: 'Alle Guides ansehen' },
  },
  es: {
    faces: { round: 'rostro redondo', oval: 'rostro ovalado', square: 'rostro cuadrado', heart: 'rostro en forma de corazón', diamond: 'rostro diamante', long: 'rostro alargado' },
    frames: { rectangle: 'monturas rectangulares', square: 'monturas cuadradas', browline: 'monturas browline', catEye: 'monturas cat-eye', geometric: 'monturas geométricas', aviator: 'monturas aviador', oversized: 'monturas oversized', round: 'monturas redondas', rimless: 'monturas al aire', rounded: 'monturas redondeadas' },
    audience: { women: 'para mujer', men: 'para hombre' },
    faceGoal: { round: 'Añadir algo de estructura o elevación ayuda a contrastar curvas suaves.', oval: 'Las proporciones son flexibles, así que pesan más la escala y la expresión.', square: 'Conviene decidir si quieres suavizar los ángulos o reforzarlos de forma intencional.', heart: 'Es mejor evitar exceso de peso visual en la parte superior del rostro.', diamond: 'La montura debe respetar los pómulos y aportar anchura controlada en las sienes.', long: 'Más profundidad de lente puede equilibrar la longitud sin añadir anchura excesiva.' },
    frameReason: { rectangle: 'Las líneas rectas y las esquinas aportan estructura clara.', square: 'Las esquinas marcadas crean contraste geométrico.', browline: 'El borde superior concentra la atención arriba y aligera la parte inferior.', catEye: 'La elevación exterior añade movimiento diagonal y expresión.', geometric: 'Varios ángulos crean un acento gráfico deliberado.', aviator: 'Las curvas y el estrechamiento inferior combinan suavidad y presencia.', oversized: 'Aporta mayor profundidad de lente y presencia visual.', round: 'Las curvas suavizan ángulos fuertes.', rimless: 'Reducir el contorno disminuye el peso visual.', rounded: 'Las curvas suaves equilibran sin cargar demasiado la zona superior.' },
    frameWatch: { rectangle: 'Evita una montura claramente más estrecha que las mejillas o demasiado baja.', square: 'Un aro muy grueso o una anchura insuficiente puede verse pesado.', browline: 'La línea superior debe relacionarse bien con tus cejas.', catEye: 'Una elevación extrema o una montura demasiado estrecha puede comprimir el rostro.', geometric: 'Muchos ángulos con un aro grueso pueden dominar demasiado.', aviator: 'Lentes muy profundas o un puente muy bajo pueden verse sobredimensionados.', oversized: 'No debería sobresalir mucho de las sienes ni caer demasiado sobre las mejillas.', round: 'Un círculo pequeño puede verse subdimensionado.', rimless: 'La ligereza no compensa una anchura o profundidad incorrectas.', rounded: 'Evita demasiado peso o decoración en la parte superior.' },
    strings: {
      faceFrameTitle: '{frame} para un {face}', faceFrameMeta: 'Cómo funcionan las {frame} en un {face}: revisa forma, anchura y escala y valida el resultado en tu propia foto.', faceFrameEyebrow: '{face} × {frame}', faceFramePrimary: 'Las {frame} son una dirección útil para un {face}. {reason} {goal}', faceFrameWhy: '{reason} {goal}', faceFrameWatch: '{watch} Revisa también anchura, puente y profundidad de lente.', faceFrameTip: 'Compara las {frame} con una forma claramente distinta en la misma foto y decide por proporción, no por la etiqueta.',
      genderTitle: 'Gafas para {face}: {audience}', genderMeta: 'Guía práctica de gafas {audience} con {face}: reduce formas, revisa escala y compara opciones en tu foto.', genderEyebrow: '{face} · {audience}', genderPrimary: 'Para un {face}, empieza por la proporción y el estilo que quieres transmitir. {goal}', genderWhy: 'La etiqueta de género importa menos que anchura, cejas, profundidad de lente, material y estilo personal.', genderWatch: 'No elijas solo por tendencia o categoría. Confirma puente, anchura, comodidad y medidas reales.', genderTip: 'Compara tres estilos claramente distintos en la misma foto y reduce la lista a partir del resultado.',
      decisionMeta: '{title} Revisa los criterios clave, los riesgos y cómo validarlo visualmente antes de comprar.', faqSuit: '¿Las {frame} favorecen a un {face}?', faqBeforeBuy: '¿Qué debo revisar antes de comprar {frame}?', faqFaceShapeEnough: '¿Basta la forma de la cara para elegir montura?', faqFaceShapeEnoughAnswer: 'No. Es un primer filtro. También importan anchura, puente, profundidad de lente, graduación, comodidad y estilo.', faqGender: '¿Debe el género decidir la forma de la montura?', faqGenderAnswer: 'No. Esta clasificación describe intenciones de estilo frecuentes. Proporción, ajuste, comodidad y estilo personal pesan más.', faqNarrow: '¿Cómo reduzco la lista?', faqFastValidate: '¿Cuál es la forma más rápida de validar la elección?', faqVirtualLimit: '¿Qué no puede confirmar la prueba virtual?', faqVirtualLimitAnswer: 'Puede mostrar el aspecto, pero no la presión real, el ajuste exacto del puente, las medidas ópticas ni la idoneidad de la graduación.', detector: 'Comprobar forma facial', tryOn: 'Probar en mi foto', compare: 'Comparar monturas', advisor: 'Obtener consejo personal',
    },
    decisions: {
      'do-round-glasses-suit-a-round-face': { title: '¿Las gafas redondas favorecen a una cara redonda?', primary: 'Sí. Redondo sobre redondo puede crear un aspecto suave y armónico. Si buscas más definición, compara con rectángulos, cuadrados o un cat-eye sutil.', why: 'Las formas parecidas crean armonía y las contrastadas, definición. La elección depende del efecto que quieras.', watch: 'Las monturas redondas muy pequeñas pueden acentuar la plenitud o verse pequeñas.', tip: 'Compara una redonda y una rectangular en la misma foto para ver si prefieres armonía o contraste.' },
      'do-aviators-suit-an-oval-face': { title: '¿Los aviadores favorecen a una cara ovalada?', primary: 'Normalmente sí. Un rostro ovalado acepta bien la forma aviador cuando la profundidad de lente, el puente y la anchura están proporcionados.', why: 'Las proporciones ya están equilibradas, así que puedes elegir principalmente por estilo y escala.', watch: 'Lentes muy profundas o un puente bajo pueden hacer que la montura parezca demasiado grande.', tip: 'Compara un aviador clásico con uno más bajo y elige la profundidad que mejor acompañe la longitud del rostro.' },
      'are-cat-eye-glasses-good-for-round-faces': { title: '¿Las gafas cat-eye son buenas para caras redondas?', primary: 'Sí, especialmente con una elevación controlada. La esquina exterior diagonal contrasta con mejillas y mandíbula más suaves.', why: 'La forma dirige la mirada hacia arriba y añade estructura sin exigir una montura rectangular pesada.', watch: 'Un cat-eye muy estrecho puede comprimir visualmente el rostro.', tip: 'Compara un cat-eye sutil con un rectángulo y elige entre elevación expresiva o estructura más limpia.' },
      'should-glasses-cover-your-eyebrows': { title: '¿Las gafas deben cubrir las cejas?', primary: 'Pueden solaparlas parcialmente. Lo importante es que el borde superior se relacione de forma natural con la línea de las cejas.', why: 'La relación con las cejas influye en que la montura se vea centrada e intencional, pero no es una regla rígida.', watch: 'Si tapa completamente las cejas y además cae sobre las mejillas, quizá sea demasiado grande.', tip: 'Compara dos alturas de montura de frente y valora la relación entre el borde superior y las cejas.' },
      'how-wide-should-glasses-be-for-my-face': { title: '¿Qué anchura deben tener las gafas para mi cara?', primary: 'Como punto de partida, la anchura total debería acercarse a la anchura del rostro en las sienes, sin presión ni gran sobresalido.', why: 'Una anchura proporcionada mantiene los ojos razonablemente centrados y evita un aspecto apretado o excesivo.', watch: 'Mucho sobresalido, varillas muy abiertas o una montura claramente más estrecha que las mejillas son señales de alerta.', tip: 'Compara una anchura media con otra algo mayor y luego confirma las medidas reales con el vendedor.' },
      'how-should-glasses-fit-your-face': { title: '¿Cómo deben quedar las gafas en la cara?', primary: 'Deben verse centradas, asentarse bien en el puente, evitar una apertura excesiva de las varillas y mantener una escala de lente proporcionada.', why: 'El equilibrio visual combina anchura, puente, línea de cejas, profundidad de lente y separación de las mejillas.', watch: 'Una foto no confirma presión, deslizamiento, comodidad detrás de las orejas ni medidas ópticas.', tip: 'Usa la prueba virtual para proporción y confirma medidas y ajuste físico antes de comprar.' },
    },
    shell: { howToStart: 'Empezar por la decisión', howToCheck: 'Revisar proporción y ajuste', howToValidate: 'Validar en tu foto', stepShortlist: 'Reducir la dirección', stepCheck: 'Revisar proporción', stepValidate: 'Validar en tu foto', visualDisclaimer: 'La prueba virtual ayuda con la proporción visual. Confirma medidas exactas, comodidad y requisitos de graduación antes de comprar.', faqEyebrow: 'Validar la decisión', faqTitle: 'Preguntas frecuentes antes de elegir', quickAnswer: 'Respuesta rápida', whatToTryFirst: 'Qué probar primero', why: 'Por qué', whyDirection: 'Por qué puede funcionar', watchFor: 'Atención', whatCanGoWrong: 'Qué puede hacer que se vea mal', decisionTip: 'Consejo de decisión', doNotDecideFromLabel: 'No decidas solo por la etiqueta', openBroaderGuide: 'Abrir la guía general por forma facial', exploreRelated: 'Explorar decisiones relacionadas', moreFocusedGuides: 'Más guías específicas', viewAllGuides: 'Ver todas las guías' },
  },
  fr: {
    faces: { round: 'visage rond', oval: 'visage ovale', square: 'visage carré', heart: 'visage en cœur', diamond: 'visage diamant', long: 'visage allongé' },
    frames: { rectangle: 'montures rectangulaires', square: 'montures carrées', browline: 'montures browline', catEye: 'montures cat-eye', geometric: 'montures géométriques', aviator: 'montures aviateur', oversized: 'montures oversize', round: 'montures rondes', rimless: 'montures sans cerclage', rounded: 'montures arrondies' },
    audience: { women: 'pour femmes', men: 'pour hommes' },
    faceGoal: { round: 'Un peu de structure ou de lift crée un contraste utile avec des courbes douces.', oval: 'Les proportions sont flexibles : l’échelle et l’expression peuvent guider le choix.', square: 'Il faut choisir entre adoucir les angles ou les renforcer volontairement.', heart: 'Mieux vaut éviter de surcharger visuellement le haut du visage.', diamond: 'Il faut laisser de l’espace aux pommettes et apporter une largeur contrôlée aux tempes.', long: 'Plus de profondeur de verre peut équilibrer la longueur sans ajouter trop de largeur.' },
    frameReason: { rectangle: 'Les lignes droites et les angles donnent une structure nette.', square: 'Les angles marqués créent un contraste géométrique clair.', browline: 'Le haut renforcé attire le regard vers les sourcils et garde le bas plus léger.', catEye: 'Le relevé extérieur ajoute du mouvement diagonal et du caractère.', geometric: 'Plusieurs arêtes droites créent un accent graphique assumé.', aviator: 'Les courbes et la forme effilée combinent douceur et présence.', oversized: 'Elle apporte davantage de profondeur de verre et de présence.', round: 'Les courbes adoucissent les angles forts.', rimless: 'Moins de contour réduit le poids visuel.', rounded: 'Les courbes douces équilibrent sans alourdir le haut.' },
    frameWatch: { rectangle: 'Évite une monture nettement plus étroite que les joues ou trop peu profonde.', square: 'Un bord très épais ou trop peu de largeur peut paraître lourd.', browline: 'La ligne supérieure doit fonctionner avec les sourcils.', catEye: 'Un relevé extrême ou une largeur trop faible peut comprimer le visage.', geometric: 'Trop d’angles avec une bordure épaisse peut dominer les traits.', aviator: 'Des verres très profonds ou un pont très bas peuvent sembler surdimensionnés.', oversized: 'La monture ne doit pas dépasser largement les tempes ni tomber sur les joues.', round: 'Une petite monture ronde peut paraître sous-dimensionnée.', rimless: 'La légèreté ne remplace pas une bonne largeur et profondeur de verre.', rounded: 'Évite trop de poids ou de décoration en haut.' },
    strings: {
      faceFrameTitle: '{frame} pour un {face}', faceFrameMeta: '{frame} sur un {face} : vérifiez forme, largeur et échelle, puis validez le rendu sur votre photo.', faceFrameEyebrow: '{face} × {frame}', faceFramePrimary: 'Les {frame} sont une piste utile pour un {face}. {reason} {goal}', faceFrameWhy: '{reason} {goal}', faceFrameWatch: '{watch} Vérifiez aussi largeur, pont et profondeur des verres.', faceFrameTip: 'Comparez les {frame} à une forme clairement différente sur la même photo et décidez selon les proportions, pas seulement le nom du style.',
      genderTitle: 'Lunettes pour {face} : {audience}', genderMeta: 'Guide pratique {audience} avec un {face} : réduire les formes, vérifier l’échelle et comparer sur votre photo.', genderEyebrow: '{face} · {audience}', genderPrimary: 'Pour un {face}, commencez par les proportions et l’expression recherchée. {goal}', genderWhy: 'Le genre compte moins que la largeur, la ligne des sourcils, la profondeur des verres, la matière et le style recherché.', genderWatch: 'Ne choisissez pas seulement selon une tendance. Vérifiez pont, largeur, confort et dimensions réelles.', genderTip: 'Comparez trois directions clairement différentes sur la même photo pour réduire rapidement la sélection.',
      decisionMeta: '{title} Les critères essentiels, les risques à surveiller et une méthode rapide de validation visuelle.', faqSuit: 'Les {frame} conviennent-elles à un {face} ?', faqBeforeBuy: 'Que vérifier avant d’acheter des {frame} ?', faqFaceShapeEnough: 'La forme du visage suffit-elle pour choisir une monture ?', faqFaceShapeEnoughAnswer: 'Non. C’est un premier filtre. Largeur, pont, profondeur, correction, confort et style personnel comptent aussi.', faqGender: 'Le genre doit-il déterminer la forme de la monture ?', faqGenderAnswer: 'Non. Cette catégorie décrit seulement une intention de style fréquente. Proportion, ajustement, confort et style personnel sont plus importants.', faqNarrow: 'Comment réduire la sélection ?', faqFastValidate: 'Quel est le moyen le plus rapide de valider le choix ?', faqVirtualLimit: 'Que ne peut pas confirmer l’essayage virtuel ?', faqVirtualLimitAnswer: 'Il montre l’apparence, mais pas la pression réelle, le pont exact, les mesures optiques ou la compatibilité avec la correction.', detector: 'Vérifier ma forme', tryOn: 'Essayer sur ma photo', compare: 'Comparer les montures', advisor: 'Obtenir des conseils personnalisés',
    },
    decisions: {
      'do-round-glasses-suit-a-round-face': { title: 'Les lunettes rondes vont-elles à un visage rond ?', primary: 'Oui. Rond sur rond peut créer un rendu doux et harmonieux. Pour plus de définition, comparez avec un rectangle, un carré ou un cat-eye discret.', why: 'Les formes similaires créent de l’harmonie, les formes contrastées davantage de définition. Le bon choix dépend du résultat recherché.', watch: 'De très petites montures rondes peuvent accentuer la rondeur ou paraître trop petites.', tip: 'Comparez une monture ronde et une rectangulaire sur la même photo pour voir si vous préférez harmonie ou contraste.' },
      'do-aviators-suit-an-oval-face': { title: 'Les aviateurs vont-ils à un visage ovale ?', primary: 'Généralement oui. Un visage ovale accepte bien la forme aviateur si la profondeur, le pont et la largeur restent proportionnés.', why: 'Les proportions sont déjà équilibrées, donc le style et l’échelle peuvent guider le choix.', watch: 'Des verres très profonds ou un pont bas peuvent donner un effet trop grand.', tip: 'Comparez un aviateur classique à une version moins profonde et choisissez celle qui accompagne le mieux la longueur du visage.' },
      'are-cat-eye-glasses-good-for-round-faces': { title: 'Les lunettes cat-eye conviennent-elles aux visages ronds ?', primary: 'Oui, surtout avec un relevé contrôlé. Le coin extérieur diagonal contraste avec des joues et une mâchoire plus douces.', why: 'La forme dirige le regard vers le haut et apporte de la structure sans exiger une monture rectangulaire lourde.', watch: 'Un cat-eye très étroit peut comprimer visuellement le visage.', tip: 'Comparez un cat-eye discret à un rectangle et choisissez entre lift expressif et structure plus nette.' },
      'should-glasses-cover-your-eyebrows': { title: 'Les lunettes doivent-elles couvrir les sourcils ?', primary: 'Elles peuvent les chevaucher légèrement. L’important est que le bord supérieur entretienne une relation naturelle avec la ligne des sourcils.', why: 'L’alignement avec les sourcils influence l’équilibre visuel, sans être une règle absolue pour tous les modèles.', watch: 'Si les sourcils sont totalement cachés et que la monture tombe aussi sur les joues, elle est peut-être trop grande.', tip: 'Comparez deux hauteurs de monture de face et observez la relation entre bord supérieur et sourcils.' },
      'how-wide-should-glasses-be-for-my-face': { title: 'Quelle largeur de lunettes pour mon visage ?', primary: 'Comme point de départ, la largeur totale devrait être proche de celle du visage aux tempes, sans forte pression ni grand débord.', why: 'Une largeur proportionnée garde les yeux assez centrés et évite un rendu pincé ou surdimensionné.', watch: 'Un grand débord, des branches très écartées ou une monture bien plus étroite que les joues sont des signes d’alerte.', tip: 'Comparez une largeur moyenne à une option un peu plus large puis confirmez les mesures réelles avant achat.' },
      'how-should-glasses-fit-your-face': { title: 'Comment des lunettes doivent-elles tenir sur le visage ?', primary: 'Elles doivent paraître centrées, tenir au pont, éviter un écartement important des branches et garder une échelle de verre proportionnée.', why: 'L’équilibre visuel dépend ensemble de la largeur, du pont, des sourcils, de la profondeur et du dégagement des joues.', watch: 'Une photo ne confirme pas pression, glissement, confort derrière les oreilles ou mesures optiques.', tip: 'Utilisez l’essayage pour les proportions puis confirmez dimensions et ajustement réel avant achat.' },
    },
    shell: { howToStart: 'Commencer par la décision', howToCheck: 'Vérifier proportion et ajustement', howToValidate: 'Valider sur votre photo', stepShortlist: 'Réduire la direction', stepCheck: 'Vérifier la proportion', stepValidate: 'Valider sur votre photo', visualDisclaimer: 'L’essayage virtuel aide pour les proportions visuelles. Confirmez dimensions exactes, confort et correction avant achat.', faqEyebrow: 'Valider la décision', faqTitle: 'Questions fréquentes avant de choisir', quickAnswer: 'Réponse rapide', whatToTryFirst: 'À essayer en premier', why: 'Pourquoi', whyDirection: 'Pourquoi cette direction peut fonctionner', watchFor: 'À surveiller', whatCanGoWrong: 'Ce qui peut déséquilibrer le rendu', decisionTip: 'Conseil de décision', doNotDecideFromLabel: 'Ne décidez pas seulement selon l’étiquette', openBroaderGuide: 'Ouvrir le guide général par forme de visage', exploreRelated: 'Explorer des décisions proches', moreFocusedGuides: 'Plus de guides ciblés', viewAllGuides: 'Voir tous les guides' },
  },
  pt: {
    faces: { round: 'rosto redondo', oval: 'rosto oval', square: 'rosto quadrado', heart: 'rosto em formato de coração', diamond: 'rosto diamante', long: 'rosto alongado' },
    frames: { rectangle: 'armações retangulares', square: 'armações quadradas', browline: 'armações browline', catEye: 'armações gatinho', geometric: 'armações geométricas', aviator: 'armações aviador', oversized: 'armações oversized', round: 'armações redondas', rimless: 'armações sem aro', rounded: 'armações arredondadas' },
    audience: { women: 'para mulheres', men: 'para homens' },
    faceGoal: { round: 'Adicionar estrutura ou elevação cria contraste com curvas mais suaves.', oval: 'As proporções são flexíveis, então escala e expressão podem liderar a escolha.', square: 'Vale decidir se você quer suavizar os ângulos ou reforçá-los de propósito.', heart: 'É melhor evitar peso visual excessivo na parte superior do rosto.', diamond: 'A armação deve respeitar as maçãs do rosto e trazer largura controlada às têmporas.', long: 'Mais profundidade de lente pode equilibrar o comprimento sem adicionar largura demais.' },
    frameReason: { rectangle: 'Linhas retas e cantos visíveis adicionam estrutura clara.', square: 'Cantos fortes criam contraste geométrico.', browline: 'A parte superior mais marcada chama atenção para as sobrancelhas e mantém a lente inferior leve.', catEye: 'A elevação externa adiciona movimento diagonal e expressão.', geometric: 'Várias arestas retas criam um acento gráfico intencional.', aviator: 'Curvas e afunilamento combinam suavidade e presença.', oversized: 'Aumenta a profundidade da lente e a presença visual.', round: 'Curvas suavizam ângulos fortes.', rimless: 'Menos contorno reduz o peso visual.', rounded: 'Curvas suaves equilibram sem pesar demais na parte superior.' },
    frameWatch: { rectangle: 'Evite largura claramente menor que as bochechas ou lentes rasas demais.', square: 'Aro muito grosso ou pouca largura pode pesar no rosto.', browline: 'A linha superior deve conversar com as sobrancelhas.', catEye: 'Elevação extrema ou largura insuficiente pode comprimir visualmente o rosto.', geometric: 'Muitos ângulos com aro grosso podem dominar demais.', aviator: 'Lentes muito profundas ou ponte baixa podem parecer grandes demais.', oversized: 'Não deve passar muito das têmporas nem cair demais sobre as bochechas.', round: 'Um modelo redondo pequeno pode parecer subdimensionado.', rimless: 'Leveza não substitui largura e profundidade corretas.', rounded: 'Evite excesso de peso ou decoração na parte superior.' },
    strings: {
      faceFrameTitle: '{frame} para {face}', faceFrameMeta: '{frame} em {face}: veja forma, largura e escala e valide o resultado na sua própria foto.', faceFrameEyebrow: '{face} × {frame}', faceFramePrimary: 'As {frame} são uma direção útil para {face}. {reason} {goal}', faceFrameWhy: '{reason} {goal}', faceFrameWatch: '{watch} Confira também largura, ponte e profundidade das lentes.', faceFrameTip: 'Compare as {frame} com uma forma claramente diferente na mesma foto e decida pela proporção, não apenas pelo nome do estilo.',
      genderTitle: 'Óculos para {face}: {audience}', genderMeta: 'Guia prático {audience} com {face}: reduza formatos, confira escala e compare opções na sua foto.', genderEyebrow: '{face} · {audience}', genderPrimary: 'Para {face}, comece pela proporção e pelo estilo que você quer transmitir. {goal}', genderWhy: 'O rótulo de gênero importa menos do que largura, sobrancelhas, profundidade da lente, material e estilo pessoal.', genderWatch: 'Não escolha só por tendência ou categoria. Confirme ponte, largura, conforto e medidas reais.', genderTip: 'Compare três direções de estilo bem diferentes na mesma foto e reduza a lista a partir do resultado.',
      decisionMeta: '{title} Veja os critérios principais, os riscos e uma forma rápida de validar visualmente antes da compra.', faqSuit: 'As {frame} combinam com {face}?', faqBeforeBuy: 'O que conferir antes de comprar {frame}?', faqFaceShapeEnough: 'O formato do rosto basta para escolher a armação?', faqFaceShapeEnoughAnswer: 'Não. É um primeiro filtro. Largura, ponte, profundidade, grau, conforto e estilo pessoal também importam.', faqGender: 'O gênero deve definir o formato da armação?', faqGenderAnswer: 'Não. A categoria descreve apenas uma intenção comum de estilo. Proporção, ajuste, conforto e estilo pessoal são mais importantes.', faqNarrow: 'Como reduzir a lista?', faqFastValidate: 'Qual é a forma mais rápida de validar a escolha?', faqVirtualLimit: 'O que a prova virtual não consegue confirmar?', faqVirtualLimitAnswer: 'Ela mostra o visual, mas não confirma pressão real, ajuste exato da ponte, medidas ópticas nem adequação ao grau.', detector: 'Verificar formato do rosto', tryOn: 'Provar na minha foto', compare: 'Comparar armações', advisor: 'Receber orientação pessoal',
    },
    decisions: {
      'do-round-glasses-suit-a-round-face': { title: 'Óculos redondos combinam com rosto redondo?', primary: 'Sim. Redondo com redondo pode criar um visual suave e harmônico. Para mais definição, compare com retangulares, quadrados ou um gatinho discreto.', why: 'Formas semelhantes criam harmonia; formas contrastantes criam definição. A escolha depende do efeito desejado.', watch: 'Armações redondas muito pequenas podem acentuar a plenitude ou parecer pequenas demais.', tip: 'Compare uma redonda e uma retangular na mesma foto para ver se você prefere harmonia ou contraste.' },
      'do-aviators-suit-an-oval-face': { title: 'Aviador combina com rosto oval?', primary: 'Na maioria dos casos, sim. O rosto oval aceita bem o formato aviador quando profundidade, ponte e largura estão proporcionais.', why: 'As proporções já são equilibradas, então estilo e escala podem liderar a escolha.', watch: 'Lentes profundas demais ou ponte baixa podem fazer a armação parecer exagerada.', tip: 'Compare um aviador clássico com um modelo mais raso e escolha a profundidade que acompanha melhor o rosto.' },
      'are-cat-eye-glasses-good-for-round-faces': { title: 'Óculos gatinho combinam com rosto redondo?', primary: 'Sim, especialmente com elevação controlada. O canto externo diagonal contrasta com bochechas e mandíbula mais suaves.', why: 'O formato direciona o olhar para cima e adiciona estrutura sem exigir uma armação retangular pesada.', watch: 'Um gatinho muito estreito pode comprimir visualmente o rosto.', tip: 'Compare um gatinho discreto com um retangular e escolha entre elevação expressiva ou estrutura mais limpa.' },
      'should-glasses-cover-your-eyebrows': { title: 'Os óculos devem cobrir as sobrancelhas?', primary: 'Podem sobrepor parcialmente. O mais importante é a relação natural entre o aro superior e a linha das sobrancelhas.', why: 'Esse alinhamento influencia o equilíbrio visual, mas não é uma regra rígida para todos os modelos.', watch: 'Se esconder totalmente as sobrancelhas e também cair sobre as bochechas, a armação pode estar grande demais.', tip: 'Compare duas alturas de armação de frente e observe a relação do aro superior com as sobrancelhas.' },
      'how-wide-should-glasses-be-for-my-face': { title: 'Qual deve ser a largura dos óculos para meu rosto?', primary: 'Como ponto de partida, a largura total deve ficar próxima da largura do rosto nas têmporas, sem apertar nem sobrar muito.', why: 'Uma largura proporcional mantém os olhos mais centrados e evita aparência apertada ou grande demais.', watch: 'Grande sobra lateral, hastes muito abertas ou armação bem mais estreita que as bochechas são sinais de alerta.', tip: 'Compare uma largura média com outra um pouco maior e depois confirme as medidas reais com o vendedor.' },
      'how-should-glasses-fit-your-face': { title: 'Como os óculos devem encaixar no rosto?', primary: 'Devem parecer centrados, ficar firmes na ponte, evitar abertura excessiva das hastes e manter escala de lente proporcional.', why: 'O equilíbrio visual vem da combinação entre largura, ponte, sobrancelhas, profundidade da lente e espaço nas bochechas.', watch: 'Uma foto não confirma pressão, deslizamento, conforto atrás das orelhas nem medidas ópticas.', tip: 'Use a prova virtual para proporção e confirme medidas e ajuste físico antes da compra.' },
    },
    shell: { howToStart: 'Começar pela decisão', howToCheck: 'Conferir proporção e ajuste', howToValidate: 'Validar na sua foto', stepShortlist: 'Reduzir a direção', stepCheck: 'Conferir proporção', stepValidate: 'Validar na sua foto', visualDisclaimer: 'A prova virtual ajuda com a proporção visual. Confirme medidas exatas, conforto e requisitos de grau antes da compra.', faqEyebrow: 'Validar a decisão', faqTitle: 'Perguntas frequentes antes de escolher', quickAnswer: 'Resposta rápida', whatToTryFirst: 'O que testar primeiro', why: 'Por quê', whyDirection: 'Por que essa direção pode funcionar', watchFor: 'Atenção', whatCanGoWrong: 'O que pode desequilibrar o visual', decisionTip: 'Dica de decisão', doNotDecideFromLabel: 'Não decida só pelo rótulo', openBroaderGuide: 'Abrir guia geral por formato do rosto', exploreRelated: 'Explorar decisões relacionadas', moreFocusedGuides: 'Mais guias específicos', viewAllGuides: 'Ver todos os guias' },
  },
  id: {
    faces: { round: 'wajah bulat', oval: 'wajah oval', square: 'wajah persegi', heart: 'wajah berbentuk hati', diamond: 'wajah berlian', long: 'wajah panjang' },
    frames: { rectangle: 'frame persegi panjang', square: 'frame kotak', browline: 'frame browline', catEye: 'frame cat-eye', geometric: 'frame geometris', aviator: 'frame aviator', oversized: 'frame oversized', round: 'frame bulat', rimless: 'frame rimless', rounded: 'frame membulat' },
    audience: { women: 'untuk wanita', men: 'untuk pria' },
    faceGoal: { round: 'Sedikit struktur atau efek terangkat membantu memberi kontras pada garis wajah yang lembut.', oval: 'Proporsinya fleksibel, jadi skala dan ekspresi bisa lebih menentukan.', square: 'Tentukan apakah Anda ingin melembutkan sudut atau justru menegaskannya.', heart: 'Hindari menambah terlalu banyak bobot visual di bagian atas wajah.', diamond: 'Sisakan ruang untuk tulang pipi dan tambahkan lebar terkontrol di area pelipis.', long: 'Kedalaman lensa dapat membantu menyeimbangkan panjang wajah tanpa membuat frame terlalu lebar.' },
    frameReason: { rectangle: 'Garis lurus dan sudut memberi struktur yang jelas.', square: 'Sudut tegas menciptakan kontras geometris.', browline: 'Bagian atas yang lebih kuat memberi fokus di area alis dan menjaga bagian bawah tetap ringan.', catEye: 'Sudut luar yang terangkat memberi gerak diagonal dan ekspresi.', geometric: 'Beberapa sisi lurus memberi aksen grafis yang disengaja.', aviator: 'Kurva dan bentuk meruncing menggabungkan kelembutan dan karakter.', oversized: 'Memberi kedalaman lensa dan kehadiran visual lebih besar.', round: 'Kurva membantu melembutkan sudut wajah.', rimless: 'Kontur yang minim mengurangi bobot visual.', rounded: 'Kurva lembut memberi keseimbangan tanpa membebani bagian atas.' },
    frameWatch: { rectangle: 'Hindari frame yang jauh lebih sempit dari pipi atau terlalu dangkal.', square: 'Rim sangat tebal atau lebar yang kurang bisa terasa berat.', browline: 'Pastikan garis atas selaras dengan arah alis.', catEye: 'Sudut yang terlalu ekstrem atau frame terlalu sempit bisa menekan wajah secara visual.', geometric: 'Terlalu banyak sudut dengan rim tebal bisa mendominasi wajah.', aviator: 'Lensa terlalu dalam atau bridge terlalu rendah bisa terlihat kebesaran.', oversized: 'Jangan terlalu jauh melewati pelipis atau jatuh di pipi.', round: 'Frame bulat yang terlalu kecil bisa tampak kekecilan.', rimless: 'Ringan bukan berarti lebar dan kedalaman lensa boleh diabaikan.', rounded: 'Hindari terlalu banyak dekorasi atau bobot di bagian atas.' },
    strings: {
      faceFrameTitle: '{frame} untuk {face}', faceFrameMeta: 'Lihat bagaimana {frame} bekerja pada {face}: cek bentuk, lebar, skala, lalu validasi dengan foto Anda.', faceFrameEyebrow: '{face} × {frame}', faceFramePrimary: '{frame} adalah salah satu arah yang layak untuk {face}. {reason} {goal}', faceFrameWhy: '{reason} {goal}', faceFrameWatch: '{watch} Periksa juga lebar, bridge, dan kedalaman lensa.', faceFrameTip: 'Bandingkan {frame} dengan bentuk yang jelas berbeda pada foto yang sama dan pilih berdasarkan proporsi, bukan sekadar nama kategori.',
      genderTitle: 'Kacamata untuk {face}: {audience}', genderMeta: 'Panduan praktis {audience} dengan {face}: persempit bentuk, cek skala, dan bandingkan di foto Anda.', genderEyebrow: '{face} · {audience}', genderPrimary: 'Untuk {face}, mulailah dari proporsi dan kesan yang Anda inginkan. {goal}', genderWhy: 'Label gender tidak sepenting lebar, posisi alis, kedalaman lensa, material, dan gaya pribadi.', genderWatch: 'Jangan memilih hanya karena tren. Konfirmasi bridge, lebar, kenyamanan, dan ukuran nyata.', genderTip: 'Bandingkan tiga arah gaya yang jelas berbeda pada foto yang sama untuk mempersempit pilihan.',
      decisionMeta: '{title} Lihat kriteria utama, risiko, dan cara cepat memvalidasi tampilannya sebelum membeli.', faqSuit: 'Apakah {frame} cocok untuk {face}?', faqBeforeBuy: 'Apa yang perlu dicek sebelum membeli {frame}?', faqFaceShapeEnough: 'Apakah bentuk wajah saja cukup untuk memilih frame?', faqFaceShapeEnoughAnswer: 'Tidak. Bentuk wajah adalah filter awal. Lebar, bridge, kedalaman lensa, resep, kenyamanan, dan gaya juga penting.', faqGender: 'Apakah gender harus menentukan bentuk frame?', faqGenderAnswer: 'Tidak. Kategori ini hanya menggambarkan arah gaya umum. Proporsi, fit, kenyamanan, dan gaya pribadi lebih penting.', faqNarrow: 'Bagaimana mempersempit pilihan?', faqFastValidate: 'Apa cara tercepat memvalidasi pilihan?', faqVirtualLimit: 'Apa yang tidak bisa dipastikan oleh coba virtual?', faqVirtualLimitAnswer: 'Coba virtual menunjukkan tampilan, tetapi tidak memastikan tekanan, fit bridge, pengukuran optik, atau kecocokan resep.', detector: 'Cek bentuk wajah', tryOn: 'Coba di foto saya', compare: 'Bandingkan frame', advisor: 'Dapatkan saran personal',
    },
    decisions: {
      'do-round-glasses-suit-a-round-face': { title: 'Apakah kacamata bulat cocok untuk wajah bulat?', primary: 'Ya. Bentuk bulat pada wajah bulat bisa terlihat lembut dan harmonis. Jika ingin lebih tegas, bandingkan dengan persegi panjang, kotak, atau cat-eye ringan.', why: 'Bentuk yang serupa menciptakan harmoni; bentuk kontras memberi definisi. Pilih berdasarkan kesan yang Anda inginkan.', watch: 'Frame bulat yang terlalu kecil dapat menonjolkan kepenuhan atau terlihat kekecilan.', tip: 'Bandingkan frame bulat dan persegi panjang pada foto yang sama untuk melihat apakah harmoni atau kontras lebih cocok.' },
      'do-aviators-suit-an-oval-face': { title: 'Apakah aviator cocok untuk wajah oval?', primary: 'Biasanya ya. Wajah oval cocok dengan aviator selama kedalaman lensa, posisi bridge, dan lebar tetap proporsional.', why: 'Proporsi wajah sudah seimbang, sehingga gaya dan skala bisa lebih menentukan.', watch: 'Lensa sangat dalam atau bridge rendah dapat membuat frame tampak terlalu besar.', tip: 'Bandingkan aviator klasik dengan versi lebih dangkal dan pilih kedalaman yang paling natural.' },
      'are-cat-eye-glasses-good-for-round-faces': { title: 'Apakah cat-eye cocok untuk wajah bulat?', primary: 'Ya, terutama jika sudut luarnya terangkat secara moderat. Garis diagonal memberi kontras pada pipi dan rahang yang lebih lembut.', why: 'Bentuk ini mengarahkan perhatian ke atas dan menambah struktur tanpa frame persegi panjang yang berat.', watch: 'Cat-eye yang terlalu sempit dapat menekan wajah secara visual.', tip: 'Bandingkan cat-eye ringan dengan persegi panjang dan pilih antara efek terangkat atau struktur yang lebih bersih.' },
      'should-glasses-cover-your-eyebrows': { title: 'Apakah kacamata boleh menutupi alis?', primary: 'Boleh sedikit tumpang tindih. Yang penting, rim atas memiliki hubungan yang natural dengan garis alis.', why: 'Hubungan dengan alis memengaruhi keseimbangan visual, tetapi bukan aturan mutlak untuk semua desain.', watch: 'Jika alis tertutup penuh dan frame juga jatuh ke pipi, ukurannya mungkin terlalu besar.', tip: 'Bandingkan dua tinggi frame dari depan dan lihat hubungan rim atas dengan alis.' },
      'how-wide-should-glasses-be-for-my-face': { title: 'Seberapa lebar kacamata yang cocok untuk wajah saya?', primary: 'Sebagai awal, lebar total frame sebaiknya mendekati lebar wajah di area pelipis tanpa menekan atau terlalu menjorok keluar.', why: 'Lebar proporsional membantu mata tetap cukup terpusat dan mencegah tampilan terlalu sempit atau terlalu besar.', watch: 'Overhang besar, gagang terlalu melebar, atau frame jauh lebih sempit dari pipi adalah tanda peringatan.', tip: 'Bandingkan ukuran sedang dan sedikit lebih lebar pada foto yang sama lalu konfirmasi ukuran milimeter dengan penjual.' },
      'how-should-glasses-fit-your-face': { title: 'Bagaimana kacamata seharusnya pas di wajah?', primary: 'Frame sebaiknya terlihat terpusat, stabil di bridge, tidak membuat gagang terlalu melebar, dan memiliki skala lensa yang proporsional.', why: 'Keseimbangan visual berasal dari lebar, posisi bridge, alis, kedalaman lensa, dan jarak dari pipi secara bersama-sama.', watch: 'Foto tidak dapat memastikan tekanan, selip, kenyamanan di telinga, atau pengukuran optik.', tip: 'Gunakan coba virtual untuk proporsi visual dan konfirmasi ukuran serta fit fisik sebelum membeli.' },
    },
    shell: { howToStart: 'Mulai dari pertanyaan keputusan', howToCheck: 'Cek proporsi dan fit', howToValidate: 'Validasi di foto Anda', stepShortlist: 'Persempit arah', stepCheck: 'Cek proporsi', stepValidate: 'Validasi di foto', visualDisclaimer: 'Coba virtual membantu mengecek proporsi visual. Konfirmasi ukuran pasti, kenyamanan, dan kebutuhan resep sebelum membeli.', faqEyebrow: 'Validasi keputusan', faqTitle: 'Pertanyaan umum sebelum memilih', quickAnswer: 'Jawaban singkat', whatToTryFirst: 'Apa yang dicoba dulu', why: 'Mengapa', whyDirection: 'Mengapa arah ini bisa bekerja', watchFor: 'Perhatikan', whatCanGoWrong: 'Apa yang bisa membuatnya terlihat salah', decisionTip: 'Tips keputusan', doNotDecideFromLabel: 'Jangan putuskan hanya dari label', openBroaderGuide: 'Buka panduan bentuk wajah yang lebih luas', exploreRelated: 'Jelajahi keputusan terkait', moreFocusedGuides: 'Panduan kacamata terkait', viewAllGuides: 'Lihat semua panduan' },
  },
  ru: {
    faces: { round: 'круглое лицо', oval: 'овальное лицо', square: 'квадратное лицо', heart: 'лицо сердцевидной формы', diamond: 'ромбовидное лицо', long: 'вытянутое лицо' },
    frames: { rectangle: 'прямоугольные оправы', square: 'квадратные оправы', browline: 'оправы browline', catEye: 'оправы «кошачий глаз»', geometric: 'геометрические оправы', aviator: 'авиаторы', oversized: 'крупные оправы', round: 'круглые оправы', rimless: 'безободковые оправы', rounded: 'округлые оправы' },
    audience: { women: 'для женщин', men: 'для мужчин' },
    faceGoal: { round: 'Небольшая структурность или подъём создают полезный контраст с мягкими линиями.', oval: 'Пропорции гибкие, поэтому особенно важны масштаб и характер оправы.', square: 'Стоит решить, хотите ли вы смягчить углы или сознательно подчеркнуть их.', heart: 'Лучше не добавлять лишний визуальный вес в верхней части лица.', diamond: 'Важно оставить место скулам и добавить контролируемую ширину у висков.', long: 'Дополнительная глубина линзы помогает сбалансировать длину без лишней ширины.' },
    frameReason: { rectangle: 'Прямые линии и углы добавляют чёткую структуру.', square: 'Выраженные углы создают геометрический контраст.', browline: 'Усиленный верхний край акцентирует область бровей и облегчает нижнюю часть.', catEye: 'Подъём внешнего угла добавляет диагональное движение и характер.', geometric: 'Несколько прямых граней создают выразительный графический акцент.', aviator: 'Мягкие кривые и сужение сочетают лёгкость и выразительность.', oversized: 'Большая глубина линзы усиливает визуальное присутствие.', round: 'Кривые смягчают сильные углы.', rimless: 'Минимум контура снижает визуальный вес.', rounded: 'Мягкие линии балансируют лицо без лишнего веса сверху.' },
    frameWatch: { rectangle: 'Избегайте оправы заметно уже щёк или слишком мелкой по высоте.', square: 'Очень толстый ободок или недостаточная ширина могут утяжелять лицо.', browline: 'Верхняя линия должна согласовываться с бровями.', catEye: 'Слишком сильный подъём или малая ширина могут визуально сжимать лицо.', geometric: 'Много углов вместе с толстым ободком могут стать слишком доминирующими.', aviator: 'Слишком глубокие линзы или низкий мост могут выглядеть чрезмерно крупно.', oversized: 'Оправа не должна сильно выходить за виски или опускаться на щёки.', round: 'Очень маленькая круглая оправа может выглядеть непропорционально.', rimless: 'Лёгкость не заменяет правильную ширину и глубину линз.', rounded: 'Избегайте лишнего веса и декора сверху.' },
    strings: {
      faceFrameTitle: '{frame} для формы лица: {face}', faceFrameMeta: '{frame} и {face}: проверьте форму, ширину и масштаб, затем оцените вариант на своём фото.', faceFrameEyebrow: '{face} × {frame}', faceFramePrimary: '{frame} — полезное направление для формы лица «{face}». {reason} {goal}', faceFrameWhy: '{reason} {goal}', faceFrameWatch: '{watch} Также проверьте ширину, мост и глубину линз.', faceFrameTip: 'Сравните {frame} с заметно другой формой на одном фото и выбирайте по пропорциям, а не по названию категории.',
      genderTitle: 'Очки для формы лица «{face}»: {audience}', genderMeta: 'Практический выбор оправ {audience} с формой лица «{face}»: сузьте варианты, проверьте масштаб и сравните на фото.', genderEyebrow: '{face} · {audience}', genderPrimary: 'Для формы лица «{face}» начните с пропорций и желаемого характера образа. {goal}', genderWhy: 'Гендерная метка менее важна, чем ширина, линия бровей, глубина линз, материал и личный стиль.', genderWatch: 'Не выбирайте только по тренду. Проверьте мост, ширину, комфорт и реальные размеры.', genderTip: 'Сравните три заметно разные стилистические направления на одном фото и сократите список.',
      decisionMeta: '{title} Ключевые критерии, риски и быстрый способ визуально проверить выбор перед покупкой.', faqSuit: 'Подходят ли {frame} для формы лица «{face}»?', faqBeforeBuy: 'Что проверить перед покупкой {frame}?', faqFaceShapeEnough: 'Достаточно ли формы лица для выбора оправы?', faqFaceShapeEnoughAnswer: 'Нет. Это только первый фильтр. Важны ширина, мост, глубина линз, рецепт, комфорт и личный стиль.', faqGender: 'Должен ли пол определять форму оправы?', faqGenderAnswer: 'Нет. Эта категория описывает лишь распространённое стилевое направление. Пропорции, посадка, комфорт и личный стиль важнее.', faqNarrow: 'Как сузить список?', faqFastValidate: 'Как быстрее всего проверить выбор?', faqVirtualLimit: 'Что не может подтвердить виртуальная примерка?', faqVirtualLimitAnswer: 'Она показывает внешний вид, но не давление, точную посадку моста, оптические измерения и пригодность под рецепт.', detector: 'Проверить форму лица', tryOn: 'Примерить на фото', compare: 'Сравнить оправы', advisor: 'Получить персональный совет',
    },
    decisions: {
      'do-round-glasses-suit-a-round-face': { title: 'Подходят ли круглые очки круглому лицу?', primary: 'Да. Круглая оправа на круглом лице может выглядеть мягко и гармонично. Для большей чёткости сравните прямоугольную, квадратную или лёгкий «кошачий глаз».', why: 'Похожие формы создают гармонию, контрастные — больше структуры. Выбор зависит от желаемого эффекта.', watch: 'Очень маленькие круглые оправы могут подчеркнуть полноту или выглядеть слишком мелко.', tip: 'Сравните круглую и прямоугольную оправу на одном фото и выберите между гармонией и контрастом.' },
      'do-aviators-suit-an-oval-face': { title: 'Подходят ли авиаторы овальному лицу?', primary: 'Чаще всего да. Овальные пропорции хорошо сочетаются с авиаторами, если глубина линз, мост и ширина остаются сбалансированными.', why: 'Лицо уже пропорционально, поэтому можно сильнее ориентироваться на стиль и масштаб.', watch: 'Очень глубокие линзы или низкий мост могут сделать оправу чрезмерно крупной.', tip: 'Сравните классический авиатор с более мелкой по высоте моделью и выберите подходящую глубину.' },
      'are-cat-eye-glasses-good-for-round-faces': { title: 'Подходит ли «кошачий глаз» круглому лицу?', primary: 'Да, особенно при умеренном подъёме внешнего угла. Диагональ создаёт контраст с мягкими щеками и линией челюсти.', why: 'Форма направляет внимание вверх и добавляет структуру без тяжёлой прямоугольной оправы.', watch: 'Слишком узкий «кошачий глаз» может визуально сжимать лицо.', tip: 'Сравните мягкий «кошачий глаз» с прямоугольником и выберите между подъёмом и более строгой геометрией.' },
      'should-glasses-cover-your-eyebrows': { title: 'Должны ли очки закрывать брови?', primary: 'Небольшое перекрытие допустимо. Важнее, чтобы верхняя линия оправы естественно соотносилась с бровями.', why: 'Связь с линией бровей влияет на визуальный баланс, но не является жёстким правилом для всех моделей.', watch: 'Если брови полностью скрыты и оправа одновременно лежит низко на щеках, она может быть слишком большой.', tip: 'Сравните две высоты оправы анфас и оцените взаимодействие верхнего края с бровями.' },
      'how-wide-should-glasses-be-for-my-face': { title: 'Какой ширины должны быть очки для моего лица?', primary: 'Хороший старт — общая ширина, близкая к ширине лица у висков, без сильного сдавливания и большого выступа по бокам.', why: 'Пропорциональная ширина помогает держать глаза ближе к центру линз и избегать эффекта тесной или слишком большой оправы.', watch: 'Большой выступ, сильно расходящиеся дужки или оправа заметно уже щёк — тревожные признаки.', tip: 'Сравните среднюю и чуть большую ширину на одном фото, затем подтвердите размеры в миллиметрах.' },
      'how-should-glasses-fit-your-face': { title: 'Как очки должны сидеть на лице?', primary: 'Оправа должна выглядеть центрированной, устойчиво сидеть на мосту, не сильно разводить дужки и иметь пропорциональный размер линз.', why: 'Баланс складывается из ширины, моста, линии бровей, глубины линз и расстояния до щёк.', watch: 'Фото не показывает давление, скольжение, комфорт за ушами и оптические измерения.', tip: 'Используйте виртуальную примерку для пропорций, а реальные размеры и посадку подтвердите перед покупкой.' },
    },
    shell: { howToStart: 'Начать с вопроса выбора', howToCheck: 'Проверить пропорции и посадку', howToValidate: 'Проверить на своём фото', stepShortlist: 'Сузить направление', stepCheck: 'Проверить пропорции', stepValidate: 'Проверить на фото', visualDisclaimer: 'Виртуальная примерка помогает оценить пропорции. Точные размеры, комфорт и требования рецепта нужно подтвердить отдельно.', faqEyebrow: 'Проверить решение', faqTitle: 'Частые вопросы перед выбором', quickAnswer: 'Короткий ответ', whatToTryFirst: 'Что попробовать сначала', why: 'Почему', whyDirection: 'Почему это направление может работать', watchFor: 'Обратите внимание', whatCanGoWrong: 'Что может нарушить баланс', decisionTip: 'Совет по выбору', doNotDecideFromLabel: 'Не выбирайте только по названию', openBroaderGuide: 'Открыть общий гид по форме лица', exploreRelated: 'Похожие вопросы', moreFocusedGuides: 'Другие точечные гиды', viewAllGuides: 'Все гиды' },
  },
  ar: {
    faces: { round: 'وجه دائري', oval: 'وجه بيضاوي', square: 'وجه مربع', heart: 'وجه على شكل قلب', diamond: 'وجه ماسي', long: 'وجه طويل' },
    frames: { rectangle: 'إطارات مستطيلة', square: 'إطارات مربعة', browline: 'إطارات Browline', catEye: 'إطارات عين القطة', geometric: 'إطارات هندسية', aviator: 'إطارات أفياتور', oversized: 'إطارات كبيرة', round: 'إطارات دائرية', rimless: 'إطارات بلا حواف', rounded: 'إطارات مستديرة الحواف' },
    audience: { women: 'للنساء', men: 'للرجال' },
    faceGoal: { round: 'إضافة بعض البنية أو الرفع تمنح تباينًا مفيدًا مع الخطوط الناعمة.', oval: 'النسب متوازنة ومرنة، لذلك يمكن أن يقود الحجم والطابع الاختيار.', square: 'اختر ما إذا كنت تريد تليين الزوايا أو إبرازها عن قصد.', heart: 'من الأفضل تجنب زيادة الثقل البصري في الجزء العلوي من الوجه.', diamond: 'يجب ترك مساحة لعظمتي الخد مع إضافة عرض متزن قرب الصدغين.', long: 'زيادة عمق العدسة قد توازن الطول من دون توسيع الإطار أكثر من اللازم.' },
    frameReason: { rectangle: 'الخطوط المستقيمة والزوايا تضيف بنية واضحة.', square: 'الزوايا الواضحة تصنع تباينًا هندسيًا.', browline: 'الحافة العلوية الأقوى تركز الانتباه قرب الحاجبين وتبقي الأسفل أخف.', catEye: 'الارتفاع الخارجي يضيف حركة قطرية وطابعًا أوضح.', geometric: 'الحواف المستقيمة المتعددة تضيف لمسة رسومية مقصودة.', aviator: 'المنحنيات والشكل المتدرج يجمعان بين النعومة والحضور.', oversized: 'يزيد عمق العدسة والحضور البصري.', round: 'المنحنيات تخفف الزوايا القوية.', rimless: 'تقليل الحدود يخفف الوزن البصري.', rounded: 'المنحنيات الناعمة توازن الوجه من دون ثقل إضافي في الأعلى.' },
    frameWatch: { rectangle: 'تجنب إطارًا أضيق بكثير من الخدين أو عدسات ضحلة جدًا.', square: 'الحواف السميكة جدًا أو العرض القليل قد يجعلان الإطار ثقيلًا.', browline: 'يجب أن ينسجم الخط العلوي مع اتجاه الحاجبين.', catEye: 'الارتفاع المبالغ فيه أو العرض القليل قد يضغط الوجه بصريًا.', geometric: 'كثرة الزوايا مع إطار سميك قد تطغى على الملامح.', aviator: 'العدسات العميقة جدًا أو الجسر المنخفض قد يجعلان الإطار أكبر من اللازم.', oversized: 'لا ينبغي أن يمتد كثيرًا خارج الصدغين أو يهبط على الخدين.', round: 'الإطار الدائري الصغير جدًا قد يبدو أصغر من اللازم.', rimless: 'الخفة لا تعوض عرضًا أو عمق عدسة غير مناسب.', rounded: 'تجنب الزخرفة أو الثقل الزائد في الجزء العلوي.' },
    strings: {
      faceFrameTitle: '{frame} لـ {face}', faceFrameMeta: 'كيف تعمل {frame} مع {face}: راجع الشكل والعرض والحجم ثم تحقق من النتيجة على صورتك.', faceFrameEyebrow: '{face} × {frame}', faceFramePrimary: 'تُعد {frame} اتجاهًا مفيدًا لـ {face}. {reason} {goal}', faceFrameWhy: '{reason} {goal}', faceFrameWatch: '{watch} راجع أيضًا العرض والجسر وعمق العدسة.', faceFrameTip: 'قارن {frame} بشكل مختلف بوضوح على الصورة نفسها واتخذ القرار وفق النسب لا اسم الفئة فقط.',
      genderTitle: 'نظارات لـ {face}: {audience}', genderMeta: 'دليل عملي لاختيار النظارات {audience} مع {face}: اختصر الأشكال وراجع الحجم وقارن على صورتك.', genderEyebrow: '{face} · {audience}', genderPrimary: 'مع {face} ابدأ بالنسب والطابع الذي تريده. {goal}', genderWhy: 'تصنيف الجنس أقل أهمية من العرض وخط الحاجبين وعمق العدسة والخامة والأسلوب الشخصي.', genderWatch: 'لا تختَر وفق الموضة فقط. تأكد من الجسر والعرض والراحة والمقاسات الفعلية.', genderTip: 'قارن ثلاثة اتجاهات مختلفة بوضوح على الصورة نفسها ثم اختصر القائمة.',
      decisionMeta: '{title} راجع المعايير الأساسية والمخاطر وطريقة سريعة للتحقق بصريًا قبل الشراء.', faqSuit: 'هل تناسب {frame} {face}؟', faqBeforeBuy: 'ماذا أراجع قبل شراء {frame}؟', faqFaceShapeEnough: 'هل يكفي شكل الوجه لاختيار الإطار؟', faqFaceShapeEnoughAnswer: 'لا. هو مرشح أولي فقط. العرض والجسر وعمق العدسة والوصفة والراحة والأسلوب مهمة أيضًا.', faqGender: 'هل يجب أن يحدد الجنس شكل الإطار؟', faqGenderAnswer: 'لا. هذا التصنيف يصف اتجاهًا شائعًا في الأسلوب فقط. النسب والملاءمة والراحة والأسلوب الشخصي أهم.', faqNarrow: 'كيف أختصر الخيارات؟', faqFastValidate: 'ما أسرع طريقة للتحقق من الاختيار؟', faqVirtualLimit: 'ما الذي لا تستطيع التجربة الافتراضية تأكيده؟', faqVirtualLimitAnswer: 'تُظهر المظهر، لكنها لا تؤكد الضغط الفعلي أو ملاءمة الجسر الدقيقة أو القياسات البصرية أو ملاءمة الوصفة.', detector: 'تحقق من شكل الوجه', tryOn: 'جرّب على صورتي', compare: 'قارن الإطارات', advisor: 'احصل على نصيحة شخصية',
    },
    decisions: {
      'do-round-glasses-suit-a-round-face': { title: 'هل تناسب النظارات الدائرية الوجه الدائري؟', primary: 'نعم. يمكن للدائري مع الدائري أن يعطي مظهرًا ناعمًا ومتناسقًا. لمزيد من التحديد قارن بالمستطيل أو المربع أو عين القطة الخفيفة.', why: 'الأشكال المتشابهة تصنع انسجامًا، والمختلفة تصنع تباينًا. الاختيار يعتمد على النتيجة التي تريدها.', watch: 'الإطارات الدائرية الصغيرة جدًا قد تبرز امتلاء الوجه أو تبدو أصغر من اللازم.', tip: 'قارن إطارًا دائريًا بآخر مستطيل على الصورة نفسها لترى هل تفضل الانسجام أم التباين.' },
      'do-aviators-suit-an-oval-face': { title: 'هل تناسب الأفياتور الوجه البيضاوي؟', primary: 'غالبًا نعم. الوجه البيضاوي يتحمل شكل الأفياتور جيدًا عندما يكون عمق العدسة والجسر والعرض متناسبًا.', why: 'النسب متوازنة أصلًا، لذلك يمكن أن يقود الأسلوب والحجم القرار.', watch: 'العدسات العميقة جدًا أو الجسر المنخفض قد يجعلان الإطار يبدو كبيرًا.', tip: 'قارن أفياتور كلاسيكيًا بآخر أقل عمقًا واختر ما يناسب طول الوجه أكثر.' },
      'are-cat-eye-glasses-good-for-round-faces': { title: 'هل نظارات عين القطة مناسبة للوجه الدائري؟', primary: 'نعم، خصوصًا مع ارتفاع خارجي معتدل. الزاوية القطرية تعطي تباينًا مع الخدين والفك الأكثر نعومة.', why: 'الشكل يوجه النظر إلى أعلى ويضيف بنية من دون الحاجة إلى إطار مستطيل ثقيل.', watch: 'عين القطة الضيقة جدًا قد تضغط الوجه بصريًا.', tip: 'قارن عين قطة خفيفة بمستطيل واختر بين الرفع التعبيري والبنية الهندسية الأنظف.' },
      'should-glasses-cover-your-eyebrows': { title: 'هل يجب أن تغطي النظارات الحاجبين؟', primary: 'يمكن أن تتداخل معهما قليلًا. الأهم أن ترتبط الحافة العلوية بخط الحاجبين بشكل طبيعي.', why: 'العلاقة مع الحاجبين تؤثر في توازن الإطار، لكنها ليست قاعدة صارمة لكل التصاميم.', watch: 'إذا أخفت الحاجبين بالكامل وهبطت أيضًا على الخدين فقد يكون الإطار كبيرًا جدًا.', tip: 'قارن ارتفاعين مختلفين من الأمام وراقب علاقة الحافة العلوية بالحاجبين.' },
      'how-wide-should-glasses-be-for-my-face': { title: 'ما عرض النظارات المناسب لوجهي؟', primary: 'كنقطة بداية، يجب أن يقترب العرض الكلي من عرض الوجه عند الصدغين من دون ضغط أو بروز كبير.', why: 'العرض المتناسب يساعد في إبقاء العينين أقرب إلى مركز العدسات ويمنع مظهر الضيق أو الضخامة.', watch: 'البروز الكبير أو فتح الذراعين بوضوح أو إطار أضيق بكثير من الخدين علامات تحذير.', tip: 'قارن عرضًا متوسطًا بآخر أوسع قليلًا على الصورة نفسها ثم أكد المقاسات الفعلية قبل الشراء.' },
      'how-should-glasses-fit-your-face': { title: 'كيف يجب أن تثبت النظارات على الوجه؟', primary: 'يجب أن تبدو في المنتصف، تثبت جيدًا عند الجسر، لا تفتح الذراعين كثيرًا، وتحافظ على حجم عدسة متناسب.', why: 'التوازن البصري يجمع بين العرض والجسر وخط الحاجبين وعمق العدسة والمسافة عن الخدين.', watch: 'الصورة لا تؤكد الضغط أو الانزلاق أو الراحة خلف الأذنين أو القياسات البصرية.', tip: 'استخدم التجربة الافتراضية للنسب البصرية وأكد المقاسات والملاءمة الفعلية قبل الشراء.' },
    },
    shell: { howToStart: 'ابدأ بسؤال القرار', howToCheck: 'راجع النسب والملاءمة', howToValidate: 'تحقق على صورتك', stepShortlist: 'اختصر الاتجاه', stepCheck: 'راجع النسب', stepValidate: 'تحقق على الصورة', visualDisclaimer: 'التجربة الافتراضية تساعد في النسب البصرية. أكد المقاسات الدقيقة والراحة ومتطلبات الوصفة قبل الشراء.', faqEyebrow: 'تحقق من القرار', faqTitle: 'أسئلة شائعة قبل الاختيار', quickAnswer: 'إجابة سريعة', whatToTryFirst: 'ما الذي تجربه أولًا', why: 'لماذا', whyDirection: 'لماذا قد ينجح هذا الاتجاه', watchFor: 'انتبه إلى', whatCanGoWrong: 'ما الذي قد يخل بالتوازن', decisionTip: 'نصيحة للقرار', doNotDecideFromLabel: 'لا تقرر من اسم الفئة فقط', openBroaderGuide: 'افتح الدليل العام لشكل الوجه', exploreRelated: 'استكشف قرارات مرتبطة', moreFocusedGuides: 'أدلة نظارات أكثر تحديدًا', viewAllGuides: 'عرض كل الأدلة' },
  },
}

function localizeFaceFrame(base: CombinationSearchPage, descriptor: Extract<Descriptor, { type: 'face-frame' }>, pack: LocalePack): CombinationSearchPage {
  const face = pack.faces[descriptor.face]
  const frame = pack.frames[descriptor.frame]
  const reason = pack.frameReason[descriptor.frame]
  const goal = pack.faceGoal[descriptor.face]
  const watch = pack.frameWatch[descriptor.frame]
  const values = { face, frame, reason, goal, watch }
  const primaryAnswer = format(pack.strings.faceFramePrimary, values)
  const whyItWorks = format(pack.strings.faceFrameWhy, values)
  const watchFor = format(pack.strings.faceFrameWatch, values)
  const decisionTip = format(pack.strings.faceFrameTip, values)
  return {
    ...base,
    title: format(pack.strings.faceFrameTitle, values),
    metaDescription: format(pack.strings.faceFrameMeta, values),
    eyebrow: format(pack.strings.faceFrameEyebrow, values),
    intro: primaryAnswer,
    primaryAnswer,
    whyItWorks,
    watchFor,
    decisionTip,
    ctaLabels: { detector: pack.strings.detector, tryOn: pack.strings.tryOn, compare: pack.strings.compare },
    faq: [
      { question: format(pack.strings.faqSuit, values), answer: primaryAnswer },
      { question: format(pack.strings.faqBeforeBuy, values), answer: watchFor },
      { question: pack.strings.faqFaceShapeEnough, answer: pack.strings.faqFaceShapeEnoughAnswer },
    ],
  }
}

function localizeGender(base: CombinationSearchPage, descriptor: Extract<Descriptor, { type: 'gender-style' }>, pack: LocalePack): CombinationSearchPage {
  const face = pack.faces[descriptor.face]
  const audience = pack.audience[descriptor.audience]
  const goal = pack.faceGoal[descriptor.face]
  const values = { face, audience, goal }
  const primaryAnswer = format(pack.strings.genderPrimary, values)
  return {
    ...base,
    title: format(pack.strings.genderTitle, values),
    metaDescription: format(pack.strings.genderMeta, values),
    eyebrow: format(pack.strings.genderEyebrow, values),
    intro: primaryAnswer,
    primaryAnswer,
    whyItWorks: pack.strings.genderWhy,
    watchFor: pack.strings.genderWatch,
    decisionTip: pack.strings.genderTip,
    ctaLabels: { detector: pack.strings.detector, advisor: pack.strings.advisor, tryOn: pack.strings.tryOn },
    faq: [
      { question: format(pack.strings.genderTitle, values), answer: primaryAnswer },
      { question: pack.strings.faqGender, answer: pack.strings.faqGenderAnswer },
      { question: pack.strings.faqNarrow, answer: pack.strings.genderTip },
    ],
  }
}

function localizeDecision(base: CombinationSearchPage, pack: LocalePack): CombinationSearchPage {
  const copy = pack.decisions[base.slug]
  if (!copy) return base
  return {
    ...base,
    title: copy.title,
    metaDescription: format(pack.strings.decisionMeta, { title: copy.title }),
    eyebrow: pack.shell.quickAnswer,
    intro: copy.primary,
    primaryAnswer: copy.primary,
    whyItWorks: copy.why,
    watchFor: copy.watch,
    decisionTip: copy.tip,
    ctaLabels: { detector: pack.strings.detector, tryOn: pack.strings.tryOn, compare: pack.strings.compare, advisor: pack.strings.advisor },
    faq: [
      { question: copy.title, answer: copy.primary },
      { question: pack.strings.faqFastValidate, answer: copy.tip },
      { question: pack.strings.faqVirtualLimit, answer: pack.strings.faqVirtualLimitAnswer },
    ],
  }
}

export function getLocalizedCombinationSearchPage(locale: string, slug: string): CombinationSearchPage | undefined {
  const base = COMBINATION_SEARCH_PAGES.find((page) => page.slug === slug)
  if (!base) return undefined
  const resolved = isValidLocale(locale) ? locale : defaultLocale
  if (resolved === 'en') return base
  const pack = packs[resolved]
  const descriptor = descriptors[slug]
  if (!pack || !descriptor) return base
  if (descriptor.type === 'face-frame') return localizeFaceFrame(base, descriptor, pack)
  if (descriptor.type === 'gender-style') return localizeGender(base, descriptor, pack)
  return localizeDecision(base, pack)
}

export function getLocalizedCombinationSearchPages(locale: string): CombinationSearchPage[] {
  return COMBINATION_SEARCH_PAGES.map((page) => getLocalizedCombinationSearchPage(locale, page.slug) ?? page)
}

const englishShell: CombinationGuideShellCopy = {
  howToStart: 'Start with the decision question',
  howToCheck: 'Check proportion and fit',
  howToValidate: 'Validate on your photo',
  stepShortlist: 'Shortlist the direction',
  stepCheck: 'Check proportion',
  stepValidate: 'Validate on your photo',
  visualDisclaimer: 'Virtual try-on helps with visual proportion; confirm exact dimensions, comfort, and prescription requirements before purchase.',
  faqEyebrow: 'Validate the decision',
  faqTitle: 'Common questions before you choose',
  quickAnswer: 'Quick answer',
  whatToTryFirst: 'What to try first',
  why: 'Why',
  whyDirection: 'Why this direction can work',
  watchFor: 'Watch for',
  whatCanGoWrong: 'What can make it look wrong',
  decisionTip: 'Decision tip',
  doNotDecideFromLabel: 'Do not decide from the label alone',
  openBroaderGuide: 'Open the broader face-shape frame guide',
  exploreRelated: 'Explore related decisions',
  moreFocusedGuides: 'More focused glasses guides',
  viewAllGuides: 'View all guides',
}

export function getCombinationGuideShellCopy(locale: string): CombinationGuideShellCopy {
  const resolved = isValidLocale(locale) ? locale : defaultLocale
  return resolved === 'en' ? englishShell : packs[resolved]?.shell ?? englishShell
}
