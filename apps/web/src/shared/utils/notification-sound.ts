let audio: HTMLAudioElement | null = null;

export const playNotificationSound = () => {
  if (!audio) {
    audio = new Audio("/notification/closure-542.mp3");
    audio.volume = 0.5;
  }
  audio.currentTime = 0;
  audio.play().catch(() => {});
};
