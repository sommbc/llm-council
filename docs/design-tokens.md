# Design Tokens — sommbc.com

Extracted from ~/code/sommbc/index.html. These are the canonical tokens for the llm-council UI rewrite.

## Colors

```css
--black:      #0A0A0A   /* primary background */
--bone:       #F4F1EA   /* primary text */
--ash:        #A8A29E   /* secondary/muted text */
--ash-dim:    #918A82   /* tertiary/dim text */
--rule:       #1e1c1a   /* border/divider lines */
--rule-light: #332F2B   /* lighter rule/card borders */
--rose:       #FF2D7A   /* primary accent — CTAs, labels, highlights */
--rose-glow:  rgba(255,45,122,0.10)  /* subtle rose overlay on hover */
--card:       #161615   /* card/panel background */
--card-hover: #171615   /* card hover (nearly imperceptible) */
```

## Typography

**Font:** Plus Jakarta Sans — Google Fonts — weights 300/400/500/600/700/800  
**Fallback:** `-apple-system, sans-serif`  
**Load:** Google Fonts `<link>` with preconnect to `fonts.googleapis.com` and `fonts.gstatic.com`  
**Anti-aliasing:** `-webkit-font-smoothing: antialiased`  
**Selection:** `background: var(--rose); color: var(--black)`

### Type scale

| Use | Size | Weight | Letter-spacing | Transform |
|-----|------|--------|---------------|-----------|
| Section label / role badge | 0.72rem | 700 | 0.3em | uppercase |
| Nav / meta | 0.72rem | 600 | 0.12–0.22em | uppercase |
| Body / descriptions | 0.9rem | 400 | default | — |
| Large body | 1.15rem | 400 | default | — |
| Card heading | 2.2rem | 800 | -0.02em | uppercase |
| Body line-height | 1.55–1.72 | — | — | — |

## Spacing

- Max content width: `1080px`
- Section padding: `80px 40px` desktop, `60px 24px` mobile
- Card padding: `48px`
- Grid gap between flush cards: `3px`
- Border-left accent width: `3–4px`

## Components

### Cards
- `background: var(--card)`
- `border-radius: 0` (sharp corners — no radius anywhere)
- `border-left: 3px solid transparent` — transitions to `var(--rose)` on hover/active
- No drop shadows on cards; `0 8px 32px rgba(0,0,0,0.35)` only on hover for post cards

### Buttons
- Primary: `background: var(--rose)`, `color: var(--black)`, no border-radius
- Ghost: `border: 1px solid var(--rule-light)`, transitions to rose border on hover
- Font: `inherit`, `font-size: 0.72rem`, `font-weight: 600`, `letter-spacing: 0.12em`, `text-transform: uppercase`

### Status badge (animated)
- `font-size: 0.72rem`, weight 700, `letter-spacing: 0.22em`, uppercase, color `var(--rose)`
- Animated dot: `width: 6px; height: 6px; border-radius: 50%; background: var(--rose); animation: pulse 2.5s ease infinite`
- `@keyframes pulse { 0%,100%{opacity:0.4} 50%{opacity:1} }`

### Section divider
- `border-top: 1px solid var(--rule)` between major sections

### Focus ring
- `outline: 2px solid var(--rose); outline-offset: 2px`
