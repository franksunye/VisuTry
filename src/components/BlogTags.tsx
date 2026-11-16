import { localizedPath } from '@/lib/localized-path'
import Link from '@/components/layout/PublicLink'
import { Tag } from 'lucide-react'

interface BlogTagsProps {
  locale: string
  tags: string[]
  className?: string
}

export default function BlogTags({ locale, tags, className = '' }: BlogTagsProps) {
  return (
    <div className={`flex items-center flex-wrap gap-2 ${className}`}>
      <Tag className="w-4 h-4 text-gray-500" />
      <span className="text-sm text-gray-600 me-1">Tags:</span>
      {tags.map((tag) => (
        <Link
          key={tag}
          href={localizedPath(locale, `/blog/tag/${encodeURIComponent(tag)}`)}
          className="inline-block bg-gray-100 hover:bg-blue-100 text-gray-700 hover:text-blue-800 text-sm px-3 py-1 rounded-full transition-colors"
        >
          {tag}
        </Link>
      ))}
    </div>
  )
}
