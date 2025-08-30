import { redirect } from 'next/navigation'

export default function HomePage() {
  // Always redirect to observe page for now
  redirect('/observe')
}
