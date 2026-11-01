// Research basis for the non-prescriptive measurement guidance:
// https://www.warbyparker.com/learn/how-should-glasses-fit
// https://www.eyebuydirect.com/guides/frame-measurements
// The frame numbers describe lens/bridge/temple dimensions, not outer width.
const frameSizeMarks = [
  { mark: '52', measurement: 'Lens width', meaning: 'Width of one lens, in millimeters.' },
  { mark: '18', measurement: 'Bridge width', meaning: 'Gap between the lenses, in millimeters.' },
  { mark: '145', measurement: 'Temple length', meaning: 'Length of an arm from hinge toward the ear, in millimeters.' },
] as const

const fitChecks = [
  {
    heading: 'Look at the sides',
    body: 'The frame front should roughly match your face width across the temples. Squeezing or arms spreading outward can indicate a narrow fit.',
  },
  {
    heading: 'Check for excess overhang',
    body: 'A little styling width is a preference; large overhang beyond the temples can be a sign to test a smaller frame.',
  },
  {
    heading: 'Center the eyes',
    body: 'Your eyes should sit reasonably centered within the lenses. If they appear far toward one edge, compare a different width or bridge fit.',
  },
  {
    heading: 'Confirm the bridge and temples',
    body: 'A good-looking front can still slip, pinch the nose, or press behind the ears. A photo cannot confirm physical comfort.',
  },
] as const

/** Specific practical answer for the English frame-width question page only. */
export function FrameWidthBuyingGuide() {
  return (
    <section aria-labelledby="frame-width-buying-guide" className="mt-12 rounded-xl border border-gray-200 bg-white p-6 md:p-8">
      <div className="max-w-3xl">
        <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-blue-700">Frame-size example</p>
        <h2 id="frame-width-buying-guide" className="text-2xl font-bold text-gray-950">Read the numbers before judging width</h2>
        <p className="mt-3 leading-7 text-gray-700">
          A pair of glasses might be marked <strong>52 □ 18 – 145</strong> on the inside of an arm.
          These are lens width, bridge width, and temple length in millimeters — <strong>not the overall front-frame width</strong>.
        </p>
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[420px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-gray-800">
              <th scope="col" className="px-4 py-3 font-semibold">Mark</th>
              <th scope="col" className="px-4 py-3 font-semibold">Measurement</th>
              <th scope="col" className="px-4 py-3 font-semibold">What it means</th>
            </tr>
          </thead>
          <tbody>
            {frameSizeMarks.map((item) => (
              <tr key={item.mark} className="border-b border-gray-100 text-gray-700">
                <th scope="row" className="px-4 py-3 font-semibold text-gray-950">{item.mark}</th>
                <td className="px-4 py-3">{item.measurement}</td>
                <td className="px-4 py-3">{item.meaning}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 rounded-lg bg-blue-50 p-5 text-sm leading-7 text-gray-800">
        <h3 className="font-semibold text-gray-950">Why 52 + 18 + 145 does not tell you the frame width</h3>
        <p className="mt-2">
          For this example, <strong>2 × 52 + 18 = 122 mm</strong> gives a rough lens-and-bridge span,
          not an exact outer width. Rims and end pieces change the full front measurement.
          Look for the retailer's <strong>overall frame width</strong>, or measure a well-fitting frame from outermost edge to outermost edge, including rims and end pieces.
        </p>
      </div>

      <h3 className="mt-8 text-xl font-semibold text-gray-950">Four checks you can make before choosing a size</h3>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {fitChecks.map((check) => (
          <article key={check.heading} className="rounded-lg border border-gray-200 p-4">
            <h4 className="font-semibold text-gray-950">{check.heading}</h4>
            <p className="mt-2 text-sm leading-6 text-gray-700">{check.body}</p>
          </article>
        ))}
      </div>

      <p className="mt-6 max-w-3xl text-sm leading-7 text-gray-700">
        <strong>Buying checklist:</strong> compare the measured overall width of a comfortable current pair with the candidate,
        review its lens/bridge/temple dimensions, then use virtual try-on to check appearance on your photo.
        Confirm pressure, comfort, optical measurements, and prescription suitability with the seller or an optician before purchase.
      </p>
    </section>
  )
}
