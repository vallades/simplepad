interface SidePlaceholderViewProps {
  title: string
  description: string
}

/** Minimal placeholder for future Activity Bar views. */
function SidePlaceholderView({ title, description }: SidePlaceholderViewProps): React.JSX.Element {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center border-b border-zinc-100 px-2 py-1.5 dark:border-zinc-800">
        <span className="text-[11px] font-medium text-zinc-500">{title}</span>
      </div>
      <div className="flex min-h-0 flex-1 items-start px-3 py-4">
        <p className="text-[11px] leading-relaxed text-zinc-400">{description}</p>
      </div>
    </div>
  )
}

export default SidePlaceholderView
