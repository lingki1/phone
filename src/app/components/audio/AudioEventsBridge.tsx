'use client';

import { useEffect } from 'react';
import { useAudioPlayer } from '@audio/AudioProvider';

export default function AudioEventsBridge() {
  const { open } = useAudioPlayer();

  useEffect(() => {
    const onOpen = () => open();
    window.addEventListener('audio:open', onOpen as EventListener);
    return () => window.removeEventListener('audio:open', onOpen as EventListener);
  }, [open]);

  return null;
}


