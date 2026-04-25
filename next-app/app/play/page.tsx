import type { Metadata } from 'next';

import PlayExperience from '@/components/play/PlayExperience';
import type { PersonaMode } from '@/lib/types';

const PERSONA_MODES: PersonaMode[] = ['firefighter', 'optimizer', 'wall', 'grinder', 'council'];

function resolveInitialMode(mode: string | undefined): PersonaMode {
  if (mode && PERSONA_MODES.includes(mode as PersonaMode)) {
    return mode as PersonaMode;
  }

  return 'optimizer';
}

export const metadata: Metadata = {
  title: 'Play | Grandmaster Council',
  description: 'Play the Grandmaster Council chess experience with the existing board interface preserved.',
};

interface PlayPageProps {
  searchParams?: Promise<{
    mode?: string;
  }>;
}

export default async function PlayPage({ searchParams }: PlayPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const initialMode = resolveInitialMode(params?.mode);

  return <PlayExperience key={initialMode} initialMode={initialMode} />;
}
