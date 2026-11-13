# HomeCrew design specs

Reference material only. Nothing in this folder is imported by the app, so the
bundle stays small. Point Claude (or a teammate) at these files when building
a component, e.g. "build the booking card from design-specs/components/booking-card.png".

| Folder         | What goes here                                                    |
|----------------|-------------------------------------------------------------------|
| `screens/`     | Full-page exports, one per screen: `home.png`, `service-detail.png`, `checkout.png` |
| `components/`  | Close-ups of single UI pieces: `navbar.png`, `provider-card.png`, `button-states.png` |
| `mockups/`     | Flows, wireframes, mobile vs desktop variants                      |
| `style-guide/` | Colors, typography, spacing, the design-tokens export, brand guidelines |
| `prototype/`   | Interactive HTML prototypes (`HomeCrew UI -KA-.dc.html` = Georgian, the main one; `HomeCrew UI.dc.html` = English). Keep `support.js` next to them. Open in a browser. |

Assets the app actually renders live elsewhere:

- `src/assets/icons/`   SVG icons imported in components (`import Logo from '@/assets/icons/logo.svg'`)
- `src/assets/images/`  images imported in components (bundled and hashed by Vite)
- `public/images/`      large or static images referenced by URL (`<img src="/images/hero.jpg">`)

Tip: name files in kebab-case after the screen/component they show.
