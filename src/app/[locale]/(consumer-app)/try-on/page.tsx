import { redirect } from "next/navigation"

interface TryOnPageProps {
  params: Promise<{
    locale: string
  }>
}

/**
 * Legacy try-on page - redirects to /try-on/glasses for backward compatibility
 */
export default async function TryOnPage(props: TryOnPageProps) {
  const params = await props.params;
  const { locale } = params

  // Redirect to glasses try-on (default type)
  redirect(`/${locale}/try-on/glasses`)
}
