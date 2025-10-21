import { redirect } from 'next/navigation';

// This is the root admin page that redirects to the dashboard
// When users visit /admin, they will be automatically redirected to /admin/dashboard
export default function AdminPage() {
  redirect('/admin/dashboard');
}

