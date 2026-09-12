import { redirect } from "next/navigation"

interface TryOnPageProps {
  params: {
    locale: string
  }
}

/**
 * Legacy try-on page - redirects to /try-on/glasses for backward compatibility
 */
export default async function TryOnPage({ params }: TryOnPageProps) {
  const { locale } = params

  // Redirect to glasses try-on (default type)
  redirect(`/${locale}/try-on/glasses`)
}
