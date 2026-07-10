---
name: Vibrant Minimalist
colors:
  surface: '#f8f9ff'
  surface-dim: '#d0dbed'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e6eeff'
  surface-container-high: '#dee9fc'
  surface-container-highest: '#d9e3f6'
  on-surface: '#121c2a'
  on-surface-variant: '#3c4a42'
  inverse-surface: '#27313f'
  inverse-on-surface: '#eaf1ff'
  outline: '#6c7a71'
  outline-variant: '#bbcabf'
  surface-tint: '#006c49'
  primary: '#006c49'
  on-primary: '#ffffff'
  primary-container: '#10b981'
  on-primary-container: '#00422b'
  inverse-primary: '#4edea3'
  secondary: '#2b6954'
  on-secondary: '#ffffff'
  secondary-container: '#adedd3'
  on-secondary-container: '#306d58'
  tertiary: '#55615f'
  on-tertiary: '#ffffff'
  tertiary-container: '#98a5a3'
  on-tertiary-container: '#2f3b39'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#6ffbbe'
  primary-fixed-dim: '#4edea3'
  on-primary-fixed: '#002113'
  on-primary-fixed-variant: '#005236'
  secondary-fixed: '#b0f0d6'
  secondary-fixed-dim: '#95d3ba'
  on-secondary-fixed: '#002117'
  on-secondary-fixed-variant: '#0b513d'
  tertiary-fixed: '#d8e5e2'
  tertiary-fixed-dim: '#bcc9c6'
  on-tertiary-fixed: '#121e1c'
  on-tertiary-fixed-variant: '#3d4947'
  background: '#f8f9ff'
  on-background: '#121c2a'
  surface-variant: '#d9e3f6'
typography:
  headline-xl:
    fontFamily: Manrope
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Manrope
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Manrope
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 64px
  container-max: 1280px
---

## Brand & Style
The design system is centered on a "Vibrant Minimalist" aesthetic. It targets high-end SaaS and wellness platforms that require a balance between professional calm and energetic modernity. The brand personality is optimistic, precise, and refreshing. 

The visual style utilizes a refined Minimalism base, enhanced by sophisticated color accents. We prioritize heavy whitespace to allow the updated green palette to serve as a focal point rather than an overwhelming presence. The emotional response should be one of "energized clarity"—where the user feels the interface is both exceptionally organized and forward-thinking.

## Colors
This design system employs a "Vibrant Emerald" palette. 

- **Primary:** A high-chroma Emerald (#10B981) used for core actions, active states, and brand-defining moments.
- **Secondary:** A deep Forest Green (#064E3B) used for high-contrast typography or grounded UI elements to provide depth.
- **Tertiary:** A soft Mint Wash (#F0FDFA) used for large surface areas and subtle backgrounds to maintain the calm feel.
- **Neutral:** A cool Slate Gray palette for text and borders, ensuring the green accents remain the primary focus.

The color application should be sparse but intentional, using the primary green to guide the eye toward "success" paths and primary conversions.

## Typography
Typography is structured to be "Modern Professional." 

We use **Manrope** for all headlines to provide a slightly more geometric and contemporary character than standard neo-grotesques. **Inter** is used for body text and functional labels to ensure maximum legibility and a systematic, utilitarian feel. 

Large headings should use tighter letter-spacing to appear more cohesive, while small labels use increased tracking and uppercase styling to provide clear structural hierarchy.

## Layout & Spacing
The layout follows a fluid-to-fixed model. On desktop, content is contained within a 1280px max-width container with a 12-column grid. On mobile, we shift to a 4-column grid with reduced margins.

Spacing follows an 8px rhythmic scale. We prioritize "breathability," meaning vertical margins between sections should be generous (typically 80px-120px on desktop) to reinforce the premium, minimal feel. Gutters are kept wide at 24px to prevent content density from feeling cluttered.

## Elevation & Depth
The design system uses **Tonal Layering** and **Ambient Shadows** to create a sense of organized hierarchy. 

Surfaces are distinguished by subtle shifts in the Tertiary green or light gray backgrounds rather than heavy shadows. When shadows are necessary for floating elements (like modals or dropdowns), they must be extra-diffused, using a 10% opacity of the Secondary green color to create a "tinted depth" that feels more integrated with the brand than a neutral black shadow.

## Shapes
The shape language is defined by "Soft Enclosures." 

Standard components (buttons, inputs) use a 16px corner radius (`rounded-lg`). Larger containers and cards use a 24px radius (`rounded-xl`). This specific range (16-24px) creates a friendly, approachable silhouette while maintaining enough structure to feel professional. All icons are sourced from the **Lucide** library, utilizing a consistent 2px stroke weight to match the sharp, modern lines of the typography.

## Components

- **Buttons:** Primary buttons are solid Primary Green with white text. Secondary buttons use a ghost style (Primary Green border and text) to maintain lightness.
- **Iconography:** Use **Lucide Icons** exclusively. Maintain a 20px or 24px bounding box with a 2px stroke. Icons should never be filled; use line-art only to keep the interface "airy."
- **Inputs:** Form fields use a soft gray background with a 16px radius. On focus, the border transitions to a 2px Primary Green stroke.
- **Cards:** Cards should have no border, utilizing a 24px corner radius and either a very subtle ambient shadow or a Tertiary Green background fill.
- **Chips/Badges:** Use the Tertiary Green background with Secondary Green text for a sophisticated, low-contrast look that remains legible.
- **Lists:** Use generous vertical padding (16px+) between items to maintain the minimalist spacing philosophy.