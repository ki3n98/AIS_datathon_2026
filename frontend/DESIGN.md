---
name: Professional Analytics System
colors:
  surface: '#fbf9fa'
  surface-dim: '#dbd9db'
  surface-bright: '#fbf9fa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f3f4'
  surface-container: '#efedef'
  surface-container-high: '#e9e7e9'
  surface-container-highest: '#e4e2e3'
  on-surface: '#1b1c1d'
  on-surface-variant: '#44474c'
  inverse-surface: '#303032'
  inverse-on-surface: '#f2f0f2'
  outline: '#74777d'
  outline-variant: '#c4c6cd'
  surface-tint: '#4f6073'
  primary: '#041627'
  on-primary: '#ffffff'
  primary-container: '#1a2b3c'
  on-primary-container: '#8192a7'
  inverse-primary: '#b7c8de'
  secondary: '#505f76'
  on-secondary: '#ffffff'
  secondary-container: '#d0e1fb'
  on-secondary-container: '#54647a'
  tertiary: '#211200'
  on-tertiary: '#ffffff'
  tertiary-container: '#38260b'
  on-tertiary-container: '#a88c69'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d2e4fb'
  primary-fixed-dim: '#b7c8de'
  on-primary-fixed: '#0b1d2d'
  on-primary-fixed-variant: '#38485a'
  secondary-fixed: '#d3e4fe'
  secondary-fixed-dim: '#b7c8e1'
  on-secondary-fixed: '#0b1c30'
  on-secondary-fixed-variant: '#38485d'
  tertiary-fixed: '#feddb5'
  tertiary-fixed-dim: '#e1c29b'
  on-tertiary-fixed: '#281802'
  on-tertiary-fixed-variant: '#584326'
  background: '#fbf9fa'
  on-background: '#1b1c1d'
  surface-variant: '#e4e2e3'
typography:
  display:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  h1:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  h2:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.3'
  h3:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: 0.01em
  mono-data:
    fontFamily: monospace
    fontSize: 13px
    fontWeight: '500'
    lineHeight: '1.5'
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 20px
  margin: 24px
---

## Brand & Style

This design system is engineered for high-density information environments where clarity and authority are paramount. The brand personality is intellectual, precise, and objective, catering to data scientists and executive stakeholders who require immediate insights without visual noise. 

The aesthetic follows a **Corporate Modern** approach with a lean toward **Minimalism**. It prioritizes structural integrity and legible hierarchy over decorative elements. The interface should feel like a sophisticated instrument—stable, responsive, and deeply functional. By utilizing a restrained color palette and generous whitespace between logical groupings, the design system ensures that the data remains the focal point of the user experience.

## Colors

The color strategy for this design system utilizes a "Deep Sea" primary palette to establish a sense of stability and institutional trust. The primary navy (#1a2b3c) is used for global navigation, primary actions, and key headings. The secondary slate gray handles the UI's structural elements, borders, and secondary text, ensuring a soft but clear contrast.

Data visualization is powered by two distinct accents: a vibrant teal for positive trends, active states, and growth metrics; and a warm gold for warnings, highlights, or secondary data sets. The background is a crisp off-white to reduce eye strain during long analytical sessions. Success, error, and warning states should utilize these accents or standard semantic variations (Red/Green) only when necessary to preserve the system's professional sobriety.

## Typography

This design system utilizes **Inter** exclusively to leverage its exceptional legibility in digital interfaces and technical contexts. The typographic scale is optimized for information density, using slightly tighter letter-spacing for headlines to maintain a modern, "locked-in" feel.

A specialized `mono-data` style is reserved for tabular data, coordinates, and code snippets, ensuring that numerical values align vertically for quick scanning. Weight is used strategically: Semi-bold (600) is used for structural headers, while Medium (500) is utilized for interactive labels to distinguish them from static body text.

## Layout & Spacing

The layout philosophy centers on a **Fluid Grid** system that maximizes the available screen real estate—essential for complex dashboards. A 12-column grid is used for the main content area, with responsive breakpoints that shift the layout from multi-column data widgets to stacked lists on smaller viewports.

The spacing rhythm is built on a 4px base unit. Consistent 24px margins provide the necessary "breathing room" around the dashboard perimeter, while 16px internal padding (md) is the standard for card containers. Tight 8px spacing (sm) is used to associate labels with their corresponding inputs or data points, creating clear visual proximity.

## Elevation & Depth

To maintain a clean and professional appearance, this design system avoids heavy shadows and skeuomorphism. Instead, it employs **Tonal Layers** and **Low-Contrast Outlines**. 

The background layer is the lowest elevation. Dashboard "widgets" or cards are placed on a pure white surface with a subtle 1px border (#e2e8f0). For interactive elements or dropdowns, a very soft, diffused ambient shadow (0px 4px 12px, 5% opacity) is used to indicate a "lifted" state without breaking the flat, data-centric aesthetic. This approach ensures that the interface feels layered and organized without becoming visually cluttered.

## Shapes

The shape language is disciplined and geometric. A **Soft (1)** roundedness level is applied across the system to temper the coldness of the navy and slate palette without losing the sense of precision. 

Primary containers and cards use a 4px (0.25rem) radius. Buttons and input fields follow this same standard to create a unified, professional appearance. Circular shapes are reserved strictly for status indicators, avatars, or specific icon backgrounds to ensure they stand out against the predominantly rectangular grid.

## Components

### Buttons & Inputs
Buttons feature solid fills for primary actions using the navy blue, and ghost or outlined styles for secondary actions using slate gray. Input fields must be clearly defined with 1px borders, using the accent teal for the focus state to provide a high-visibility cue for the user’s cursor.

### Cards & Data Widgets
Cards are the primary organizational unit. They should have a clear header area with a bottom-border separator, containing the title in `h3` and any contextual actions (like "Export" or "Filter") in the top right.

### Tables & Lists
Tables are high-density. Use zebra-striping with a very light gray (#f1f5f9) on hover only. Column headers should be all-caps `label-sm` with a distinct slate color to separate metadata from the actual data points.

### Data Visualization Accents
When rendering charts:
- Use **Vibrant Teal** for the primary data series.
- Use **Warm Gold** for comparison series or target lines.
- Use **Slate Gray** for axes, gridlines, and legends to keep them in the background.

### Navigation
The sidebar navigation uses the primary navy blue with a slightly lower opacity for inactive links, transitioning to full opacity with a teal left-border "indicator" for the active state.