const choices = [
  { name: 'Soft round frame', effect: 'Repeats facial curves for a gentle, cohesive look', check: 'Choose enough lens width that the eyes are not crowded against the outer rims.' },
  { name: 'Rectangle frame', effect: 'Adds a sharper horizontal line and visual contrast', check: 'Avoid an excessively narrow or shallow frame just to create angles.' },
  { name: 'Subtle cat-eye frame', effect: 'Creates some outward lift without a strongly square silhouette', check: 'Keep the upsweep proportional to the temples and eyebrows.' },
] as const

/** Practical decision aid for the existing English round-on-round guide. */
export function RoundGlassesRoundFaceGuide() {
  return (
    <section aria-labelledby="round-frame-decision" className="mt-12 rounded-xl border border-gray-200 bg-white p-6 md:p-8">
      <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">Shape versus styling</p>
      <h2 id="round-frame-decision" className="mt-2 text-2xl font-bold text-gray-950">
        Round glasses on a round face: choose harmony or contrast
      </h2>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-gray-700">
        Round glasses can work well with a round face. The relevant decision is whether you prefer to echo its curves
        or introduce definition. Face shape alone does not determine the right frame.
      </p>
      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[540px] border-collapse text-left text-sm">
          <thead><tr className="border-b border-gray-200 bg-gray-50">
            <th scope="col" className="px-4 py-3 font-semibold">Try</th>
            <th scope="col" className="px-4 py-3 font-semibold">Visual effect</th>
            <th scope="col" className="px-4 py-3 font-semibold">Fit checkpoint</th>
          </tr></thead>
          <tbody>{choices.map(choice => (
            <tr key={choice.name} className="border-b border-gray-100 align-top text-gray-700">
              <th scope="row" className="px-4 py-3 font-semibold text-gray-950">{choice.name}</th>
              <td className="px-4 py-3">{choice.effect}</td>
              <td className="px-4 py-3">{choice.check}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      <h3 className="mt-8 text-xl font-semibold text-gray-950">A useful two-frame photo comparison</h3>
      <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-7 text-gray-700">
        <li>Choose one round frame and one rectangle or softly lifted frame with comparable overall width.</li>
        <li>Save a product photo or screenshot of each frame. VisuTry does not automatically load these example styles.</li>
        <li>Use the same clear, front-facing portrait for both virtual try-ons, then open Compare to judge the two results side by side.</li>
        <li>Check eye position, brow balance, frame overhang, and which expression you prefer before choosing.</li>
      </ol>
      <p className="mt-5 rounded-lg bg-blue-50 p-4 text-sm leading-7 text-gray-800">
        <strong>Important:</strong> Virtual try-on is a visual preview, not a physical fitting.
        Confirm the frame dimensions, bridge pressure, temple comfort and prescription requirements with the seller or an optician.
      </p>
    </section>
  )
}
