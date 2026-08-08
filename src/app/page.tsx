import { redirect } from 'next/navigation';

export default function Home() {
  // Redirect root to welcome onboarding
  redirect('/welcome');
}
