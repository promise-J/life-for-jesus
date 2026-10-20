# Asset and licence inventory

Every visual and sound in the game is either generated in code for this project or comes from an openly licensed package. Nothing is copied from Lagos Life or any other game, and no commercial music or recordings are used.

| Asset | Source | Creator | Licence | Attribution | Use |
|---|---|---|---|---|---|
| Character sprites (all skin tones, hairstyles, outfits, 4-direction walk cycles) | `client/src/game/art/character.js` — drawn procedurally on canvas | This project | Project licence | – | Player, NPCs, previews |
| Buildings, ground, roads, interiors, furniture, props, vehicles | `client/src/game/art/world.js` — procedural canvas drawing | This project | Project licence | – | All maps |
| Main-menu skyline illustration | Inline SVG in `client/src/screens/MainMenu.jsx` | This project | Project licence | – | Main menu |
| Adire-style background pattern | CSS gradients in `client/src/styles.css` | This project | Project licence | – | Menus |
| Music (city, home, church, village, ancient, prayer, tension…), ambience, sound effects, the trumpet call | `client/src/audio/audio.js` — synthesised live with the Web Audio API | This project | Project licence | – | All audio |
| App icon | `client/public/icon.svg` | This project | Project licence | – | Favicon |
| Baloo 2 font | `@fontsource/baloo-2` (Ek Type) | Ek Type | SIL Open Font License 1.1 | Not required in UI; licence included in the npm package | Display type |
| Nunito font | `@fontsource/nunito` (Vernon Adams et al.) | Vernon Adams, Cyreal, Jacques Le Bailly | SIL Open Font License 1.1 | Not required in UI; licence included in the npm package | Body type |
| Icons | `lucide-react` | Lucide contributors | ISC | Licence in package | UI icons |
| Bible text | World English Bible via github.com/TehShrike/world-english-bible | eBible.org / Rainbow Missions | Public domain | Credited in UI (“World English Bible, public domain”) | Bible Explorer, Scripture cards |
| Game engine | Phaser 3 | Phaser Studio | MIT | Licence in package | World rendering |

**Fallbacks:** all art and audio are generated at runtime, so there are no external asset downloads that can fail. If Web Audio is unavailable the game runs silently; if the Bible file is missing the server logs a warning and Scripture cards show the reference with a clear “unavailable” note.
