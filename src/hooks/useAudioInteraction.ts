import { useEffect } from "react";
import { Room } from "livekit-client";
import { tryStartAudio, debugAudioState, ensureAudioStability } from "../utils/audio-utils";

export const useAudioInteraction = (
  room: Room | null,
  audioStartAttempted: boolean,
  setAudioStartAttempted: (value: boolean) => void
) => {
  useEffect(() => {
    if (room && !audioStartAttempted) {
      const handleUserInteraction = async () => {
        console.log('👆 User interaction detected, attempting to start audio...');
        const audioStarted = await tryStartAudio(room);
        setAudioStartAttempted(audioStarted);
        
        // Audio stabilite kontrolü
        if (audioStarted) {
          await ensureAudioStability(room);
        }
        
        debugAudioState(room);
        
        // Remove listeners after first attempt
        document.removeEventListener('click', handleUserInteraction);
        document.removeEventListener('keydown', handleUserInteraction);
        document.removeEventListener('touchstart', handleUserInteraction);
      };

      document.addEventListener('click', handleUserInteraction);
      document.addEventListener('keydown', handleUserInteraction);
      document.addEventListener('touchstart', handleUserInteraction);

      return () => {
        document.removeEventListener('click', handleUserInteraction);
        document.removeEventListener('keydown', handleUserInteraction);
        document.removeEventListener('touchstart', handleUserInteraction);
      };
    }
  }, [room, audioStartAttempted, setAudioStartAttempted]);

  // KALDIRILIYOR: Periyodik audio stabilite kontrolü gereksiz
  // Audio track'ler LiveKit event'leri ile otomatik olarak yönetiliyor
  // Manual stabilite kontrolü performans sorunlarına neden olabilir
  useEffect(() => {
    // Audio stability kontrolü sadece gerektiğinde event-driven olarak yapılacak
    return () => {}; // Cleanup
  }, [room, audioStartAttempted]);
}; 