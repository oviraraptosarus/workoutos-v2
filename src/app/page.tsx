import { redirect } from 'next/navigation';

export default function Home() {
  // Redirect root to sign-up-login-screen or dashboard
  redirect('/sign-up-login-screen');
}
