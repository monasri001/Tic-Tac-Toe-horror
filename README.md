# Horror Tic Tac Toe 🩸

A spine-chilling, horror-themed twist on the classic game of Tic Tac Toe. Features glossy, watery blood-splatter effects, custom synthetic horror audio, and a suspense-filled AI CPU mode.

**[▶️ Play the Live Demo Here](https://tic-tac-toe-horror-puce.vercel.app/)**
<img width="819" height="821" alt="image" src="https://github.com/user-attachments/assets/e144d6be-f163-4fd9-ace5-fd1c503ded5d" />

## Features 👻
- **Two Game Modes**: 
  - **Player VS Player**: Battle it out locally with a friend.
  - **Player VS CPU**: Test your wits against a menacing AI that actually strategizes (and uses a suspenseful delay before making its move).
- **Visceral Visuals**: 
  - Dynamic, oozing "splat" animations when pieces are placed.
  - Custom SVG `gooey` filters (`feGaussianBlur` + `feColorMatrix`) that perfectly merge liquid splatters.
  - Detailed glossy elements and shadow depth rendering using pure CSS.
  - Aggressive screen-shake on every interaction for maximum impact.
  - Eerie CSS glitch text alongside *Creepster* and *Nosifer* Google Fonts.
- **Custom Synthetic Audio**: 
  - **Zero external dependencies!** All sound effects are synthesized dynamically in the browser using the **Web Audio API**. 
  - Includes a squelchy "Splat", a horrific dissonant chord swell for Wins, and a dull heartbeat drop for Draws.

## Tech Stack 🛠️
- **HTML5**: Semantic structure and inline SVG filter definition.
- **CSS3**: Vanilla CSS handling all keyframe animations, UI layouts, gradients, and rich custom `box-shadow` properties.
- **JavaScript (Vanilla)**: Handles the game engine, state management, algorithmic AI computer strategies, dynamic DOM physics, and Web Audio API synthesizer routing.

## Run Locally 💻
No build steps, installations, or dependencies are required. 
1. Clone this repository or download the project files.
2. Open `index.html` in any modern web browser.
3. Turn up your volume and claim some souls!

## Deployment 🚀
This project requires no complex setups and operates fully client-side. It is currently deployed automatically via [Vercel](https://vercel.com/). You can host it on any static provider (GitHub Pages, Netlify, Cloudflare).
