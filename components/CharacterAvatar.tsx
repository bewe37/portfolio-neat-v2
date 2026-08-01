"use client"

import { useState } from "react"
import { playClick } from "@/lib/click-sound"

// forceRainbow lets an external trigger (e.g. hovering the word "enjoy" in
// the bio) turn the spin on regardless of click state — the two layer
// together rather than fight: whichever is true wins, and releasing the
// hover falls back to whatever the click-toggle state already was.
export default function CharacterAvatar({ size = 32, forceRainbow = false }: { size?: number; forceRainbow?: boolean }) {
  const [rainbow, setRainbow] = useState(false)

  function handleClick() {
    playClick()
    setRainbow((v) => !v)
  }

  return (
    <button
      onClick={handleClick}
      aria-label="Click for a surprise"
      className="character-avatar-btn"
      style={{ display: "block", padding: 0, border: "none", background: "transparent", cursor: "pointer" }}
    >
      <svg
        className={rainbow || forceRainbow ? "character-avatar-rainbow" : undefined}
        width={size}
        height={size}
        viewBox="0 0 250 250"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: "block" }}
      >
        <path
          d="M70.1602 0.187316C75.3748 -0.154739 83.3334 0.0767167 88.7861 0.0744647L160.634 0.0687108C170.269 0.0629557 182.826 -0.356421 192.154 1.57681C203.645 3.9822 214.384 9.1273 223.448 16.5727C238.557 28.8562 248.673 48.6614 249.692 68.0622C250.033 74.5903 249.93 81.1706 249.93 87.7097L249.903 157.866C249.918 169.302 250.598 181.669 248.139 192.744C245.73 203.593 240.474 214.514 233.386 223.075C222.299 236.527 206.796 245.63 189.625 248.775C186.838 249.286 183.606 249.486 180.744 249.753C158.075 250.224 134.233 249.876 111.499 249.879H86.8829C76.3194 249.879 67.3851 250.311 56.9923 247.847C25.6322 240.415 2.95106 213.796 0.514869 181.75C-0.0466331 174.361 0.0742968 167.225 0.0712861 159.796L0.0504598 92.0136C0.0567322 80.0789 -0.530608 68.098 2.14694 56.4185C4.95295 44.5807 10.5619 33.5856 18.5043 24.3539C28.4987 12.6662 43.2508 4.68859 58.2693 1.59207C62.2929 0.76233 66.0839 0.50535 70.1602 0.187316ZM83.2356 157.581C105.564 156.528 115.515 129.865 113.865 110.938C112.864 99.47 108.948 87.157 100.137 79.1671C96.0736 75.4773 87.9805 71.2608 82.3479 72.0145C75.0005 72.2572 68.2426 75.7193 63.2629 81.0253C47.0465 98.3034 47.182 134.023 64.7627 150.247C69.759 154.949 76.3661 157.572 83.2356 157.581ZM168.949 157.352C204.152 154.088 208.166 92.4755 180.791 75.946C175.979 73.0404 171.184 71.7157 165.582 72.056C158.284 72.7746 151.146 76.9133 146.575 82.7013C131.702 101.536 132.235 135.692 151.413 151.572C155.48 154.94 163.69 158.417 168.949 157.352Z"
          fill="#5451D9"
        />
        <path
          d="M72.3271 87.5002C84.2436 87.3263 87.3228 106.58 74.0181 110.328C61.6791 111.529 58.4428 89.4062 72.3271 87.5002Z"
          fill="#5451D9"
        />
        <path
          d="M157.787 87.5078C170.737 88.8398 170.696 108.568 158.119 110.364C146.523 110.476 144.009 88.9371 157.787 87.5078Z"
          fill="#5451D9"
        />
      </svg>

      <style>{`
        @keyframes character-hue-spin {
          from { filter: hue-rotate(0deg) saturate(1.4); }
          to { filter: hue-rotate(360deg) saturate(1.4); }
        }
        .character-avatar-rainbow {
          animation: character-hue-spin 2.5s linear infinite;
        }
        .character-avatar-btn:active svg {
          transform: scale(0.9);
        }
        .character-avatar-btn svg {
          transition: transform 0.1s ease;
        }
      `}</style>
    </button>
  )
}
