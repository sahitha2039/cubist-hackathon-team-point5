import type { Metadata } from 'next';

import GrandmasterLanding from '@/components/landing/GrandmasterLanding';

export const metadata: Metadata = {
  title: 'Grandmaster Council',
  description: 'A bold landing page for Grandmaster Council with the preserved chess experience moved to /play.',
};

export default function HomePage() {
  return <GrandmasterLanding />;
}
