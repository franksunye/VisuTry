export default function AdminGroupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // This is just a wrapper for the admin route group
  // The actual admin layout is in admin/layout.tsx
  return <>{children}</>
}

