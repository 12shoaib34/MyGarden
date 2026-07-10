---
name: Botanical Essence
colors:
  surface: '#faf9f5'
  surface-dim: '#dadad6'
  surface-bright: '#faf9f5'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f4f4f0'
  surface-container: '#eeeeea'
  surface-container-high: '#e8e8e4'
  surface-container-highest: '#e2e3df'
  on-surface: '#1a1c1a'
  on-surface-variant: '#40493d'
  inverse-surface: '#2f312e'
  inverse-on-surface: '#f1f1ed'
  outline: '#707a6c'
  outline-variant: '#bfcaba'
  surface-tint: '#1b6d24'
  primary: '#0d631b'
  on-primary: '#ffffff'
  primary-container: '#2e7d32'
  on-primary-container: '#cbffc2'
  inverse-primary: '#88d982'
  secondary: '#286b33'
  on-secondary: '#ffffff'
  secondary-container: '#abf4ac'
  on-secondary-container: '#2e7238'
  tertiary: '#704d40'
  on-tertiary: '#ffffff'
  tertiary-container: '#8b6557'
  on-tertiary-container: '#ffeee8'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#a3f69c'
  primary-fixed-dim: '#88d982'
  on-primary-fixed: '#002204'
  on-primary-fixed-variant: '#005312'
  secondary-fixed: '#abf4ac'
  secondary-fixed-dim: '#90d792'
  on-secondary-fixed: '#002107'
  on-secondary-fixed-variant: '#07521d'
  tertiary-fixed: '#ffdbcf'
  tertiary-fixed-dim: '#ebbcac'
  on-tertiary-fixed: '#2e150b'
  on-tertiary-fixed-variant: '#603f33'
  background: '#faf9f5'
  on-background: '#1a1c1a'
  surface-variant: '#e2e3df'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 57px
    fontWeight: '700'
    lineHeight: 64px
    letterSpacing: -0.25px
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
  title-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0.5px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0.25px
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.1px
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.5px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  container-margin: 20px
  gutter: 16px
---

## Brand & Style

The design system is rooted in the philosophy of "Cultivated Calm." It targets urban gardeners and organic enthusiasts who value precision, sustainability, and a premium aesthetic. The visual direction is a refined evolution of Material 3 Expressive, blending the systematic rigor of enterprise software with the organic softness of the natural world.

The UI should evoke a sense of organized growth. It utilizes generous whitespace, a deliberate "Natural Green" anchor, and high-quality imagery to create a professional yet welcoming atmosphere. The emotional response is one of reliability and tranquility—positioning the app as a digital sanctuary for plant care.

**Key Style Attributes:**
- **Modern Material 3 Expressive:** Utilizes large type, dynamic shapes, and fluid motion.
- **Organic Minimalism:** Removes unnecessary borders and dividers in favor of structural spacing and subtle tonal shifts.
- **Tactile Nature:** Elements feel soft to the touch through generous corner radii and physical depth metaphors.

## Colors

The palette is derived from the "Earth & Flora" spectrum. The **Primary Natural Green (#2E7D32)** serves as the brand's foundation, representing vitality and growth. It is supported by **Fresh Leaf Green (#81C784)** for secondary actions and **Earth Brown (#795548)** for structural accents.

The background uses a **Warm Beige (#F5F5F1)** in light mode to avoid the clinical feel of pure white, mimicking high-end organic paper. Dark mode transitions to a deep "Soil" charcoal (#121212) with forest-green tinted overlays to maintain brand continuity.

**Color Usage:**
- **Primary:** High-emphasis buttons, active states, and branding.
- **Secondary/Tertiary:** Card backgrounds, chip filters, and secondary iconography.
- **Accents:** Used sparingly for specific care alerts—Harvest Orange for harvest ready, Water Blue for hydration, and Sun Yellow for sunlight requirements.

## Typography

This design system utilizes **Plus Jakarta Sans** across all levels. This typeface offers a contemporary, soft-geometric feel that aligns perfectly with the "friendly professional" persona. 

**Hierarchy Strategy:**
- **Display & Headlines:** Use Bold weights with tighter letter spacing for a premium, editorial feel. These should be used for plant names and dashboard greetings.
- **Body Text:** Standardizes on a 16px base for maximum legibility in outdoor gardening conditions.
- **Labels:** Utilizes medium weights and uppercase styling for small metadata (e.g., "DAYS TO HARVEST") to ensure clarity at small scales.

## Layout & Spacing

The layout follows a **4dp linear spacing system** to ensure mathematical harmony. The philosophy is "Spacious & Accessible," prioritizing vertical breathing room to reduce cognitive load.

**Grid & Margins:**
- **Mobile:** A 4-column fluid grid with 20px outside margins and 16px gutters.
- **Vertical Spacing:** Elements are grouped using 8px (related) or 24px (unrelated) gaps. 
- **Safe Areas:** Adheres strictly to device safe areas, with bottom navigation bars utilizing a 56px height plus the home indicator area.

Content should feel like it "floats" within the container-margin, using whitespace rather than lines to define sections.

## Elevation & Depth

The design system uses **Tonal Layers** combined with **Ambient Shadows** to create a premium, tactile feel. Instead of traditional harsh shadows, depth is communicated through subtle shifts in background color and extremely soft, large-radius blurs.

- **Level 0 (Base):** Warm Beige (#F5F5F1).
- **Level 1 (Cards/Surface):** Pure White (#FFFFFF) with a 2% tint of the Primary Green and a soft shadow (Blur: 12px, Y: 4px, Opacity: 4% Black).
- **Level 2 (Active/Floating):** Pure White with a more pronounced shadow (Blur: 20px, Y: 8px, Opacity: 8% Black).
- **Interactions:** When pressed, buttons and cards should visually "sink" by reducing shadow spread and darkening the surface color slightly.

## Shapes

The shape language is "Hyper-Organic." While the base roundedness is set to Level 2 (0.5rem), the design system aggressively uses `rounded-xl` and `rounded-2xl` for primary containers and cards.

- **Standard Elements:** 8px radius (Checkboxes, small buttons).
- **Main Cards:** 24px radius to mimic the soft curves found in leaves and petals.
- **Input Fields:** 16px radius for a modern, approachable look.
- **Chips:** Fully pill-shaped (capsule) for quick visual scanning.

## Components

### Buttons
- **Primary:** Solid Primary Green, 24px height, Rounded-Full. White text.
- **Secondary:** Tonal Fresh Leaf Green background with Dark Green text. No shadow.
- **Tertiary:** Text only, bold weight, Primary Green.

### Cards
- **Plant Profile Card:** 24px corner radius, Level 1 elevation. Feature a large image at the top with a subtle 4px internal margin for a "framed" premium look.

### Inputs & Selection
- **Text Fields:** Filled style with a 16px radius. Background is a slightly darker beige than the base surface. Active state uses a 2px Primary Green bottom stroke.
- **Checkboxes/Radios:** Large 24x24dp hit targets. When selected, they utilize a "pop" animation with the Primary Green fill.

### Chips & Tags
- **Care Status:** Capsule shapes with 12px horizontal padding. Use semantic colors (e.g., Blue for "Needs Water") with 10% opacity backgrounds and 100% opacity text.

### Iconography
- **Material Symbols Rounded:** Always use the "Rounded" variant. Stroke weight should be 400 (Regular) for 24px icons. Icons for gardening actions (watering can, sun, trowel) should be stylized within a circular tonal container.