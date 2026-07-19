import {
  entriesFromFrontmatter,
  formatFrontmatterValue,
  isTagList,
  type FrontmatterData
} from '../utils/frontmatter'

interface PropertiesPanelProps {
  data: FrontmatterData
  className?: string
}

/**
 * Minimal YAML frontmatter display for the Markdown Preview.
 * Tags render as badges; other keys as compact key/value chips.
 */
function PropertiesPanel({ data, className = '' }: PropertiesPanelProps): React.JSX.Element | null {
  const entries = entriesFromFrontmatter(data)
  if (entries.length === 0) return null

  return (
    <section
      className={[
        'properties-panel mb-4 rounded-lg border border-zinc-200 bg-zinc-50/80 p-3 dark:border-zinc-700 dark:bg-zinc-900/60',
        className
      ].join(' ')}
      aria-label="Properties"
    >
      <h3 className="mb-2 text-[10px] font-semibold tracking-wide text-zinc-400 uppercase">
        Properties
      </h3>
      <dl className="flex flex-col gap-2">
        {entries.map(({ key, value }) => (
          <div key={key} className="flex flex-wrap items-start gap-x-2 gap-y-1 text-[12px]">
            <dt className="shrink-0 font-medium text-zinc-500 dark:text-zinc-400">{key}</dt>
            <dd className="min-w-0 flex-1 text-zinc-800 dark:text-zinc-100">
              {isTagList(key, value) ? (
                <ul className="flex flex-wrap gap-1">
                  {value.map((tag, i) => (
                    <li
                      key={`${key}-${i}-${String(tag)}`}
                      className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                    >
                      {formatFrontmatterValue(tag)}
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="break-words">{formatFrontmatterValue(value)}</span>
              )}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

export default PropertiesPanel
