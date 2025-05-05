import { redirect } from 'next/navigation';

export default function Home() {
  redirect('/login');
  // Keep the empty return for TS, though it won't be reached.
  return <></>;
}
