import { playSound } from "@/lib/sound-engine"
import { clickSoftSound } from "@/lib/click-soft"

export function playClick(volume = 0.7) {
  playSound(clickSoftSound.dataUri, { volume })
}
