type StorePresentationDisclosureProps = {
  referenceData: boolean
  poweredBy?: string
  referenceLabel?: string
}

export function StorePresentationDisclosure({
  referenceData,
  poweredBy = 'Powered by VisuTry',
  referenceLabel = 'Reference pilot · simulation',
}: StorePresentationDisclosureProps) {
  return (
    <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200/80 px-1 pt-5 text-xs text-slate-400">
      {referenceData ? <p>{referenceLabel}</p> : <span aria-hidden="true" />}
      <p>{poweredBy}</p>
    </footer>
  )
}
