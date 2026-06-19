---
name: Technical Precision
colors:
  surface: '#fff8f7'
  surface-dim: '#edd4d3'
  surface-bright: '#fff8f7'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#fff0ef'
  surface-container: '#ffe9e8'
  surface-container-high: '#fce2e1'
  surface-container-highest: '#f6dddb'
  on-surface: '#261818'
  on-surface-variant: '#594140'
  inverse-surface: '#3c2d2c'
  inverse-on-surface: '#ffedeb'
  outline: '#8d706f'
  outline-variant: '#e1bebd'
  surface-tint: '#b12935'
  primary: '#7e0018'
  on-primary: '#ffffff'
  primary-container: '#a11c2b'
  on-primary-container: '#ffb3b2'
  inverse-primary: '#ffb3b2'
  secondary: '#5f5e5e'
  on-secondary: '#ffffff'
  secondary-container: '#e2dfde'
  on-secondary-container: '#636262'
  tertiary: '#3a3c3c'
  on-tertiary: '#ffffff'
  tertiary-container: '#515353'
  on-tertiary-container: '#c6c7c7'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdad8'
  primary-fixed-dim: '#ffb3b2'
  on-primary-fixed: '#410008'
  on-primary-fixed-variant: '#8f0b20'
  secondary-fixed: '#e5e2e1'
  secondary-fixed-dim: '#c8c6c5'
  on-secondary-fixed: '#1c1b1b'
  on-secondary-fixed-variant: '#474746'
  tertiary-fixed: '#e2e2e2'
  tertiary-fixed-dim: '#c6c6c7'
  on-tertiary-fixed: '#1a1c1c'
  on-tertiary-fixed-variant: '#454747'
  background: '#fff8f7'
  on-background: '#261818'
  surface-variant: '#f6dddb'
typography:
  display-lg:
    fontFamily: Space Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  data-table:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  label-caps:
    fontFamily: Space Grotesk
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.05em
spacing:
  unit: 4px
  container-max: 1280px
  gutter: 24px
  margin-mobile: 16px
  table-cell-padding: 12px 16px
---

## Brand & Style
The design system is engineered for **SoilTest Perú**, a brand that operates at the intersection of civil engineering and laboratory precision. The visual identity reflects a "Technical Industrial" aesthetic—clean, authoritative, and data-driven. It mimics the structured reliability of engineering blueprints and laboratory certification reports.

The emotional response should be one of absolute trust, accuracy, and professional rigor. By utilizing a **High-Contrast / Modern** style with subtle **Brutalist** influences (sharp edges, heavy lines, and monospaced data), the UI prioritizes legibility and information density over decorative flair.

## Colors
The color palette is anchored by the deep corporate red derived from the brand logo, used strategically for primary actions and brand reinforcement. 

- **Primary Red (#A11C2B):** Used for primary buttons, active states, and critical headers.
- **Neutral Carbon (#1A1A1A):** Used for typography and structural borders to maintain high contrast.
- **Laboratory Grey (#F4F4F4):** Used for background surfaces and table row zebra-striping to reduce eye fatigue during long data-entry sessions.
- **Status Semantic Palette:** High-saturation greens, oranges, and reds are reserved strictly for status badges (Aprobado, Pendiente, Rechazado) to ensure they are immediately distinguishable against the neutral technical backdrop.

## Typography
Typography is split into three functional roles:
1.  **Display & Headers (Space Grotesk):** A geometric sans-serif with technical "ink traps" that conveys modern engineering.
2.  **Body Text (Inter):** Highly legible and neutral for descriptions and reports.
3.  **Technical Data (JetBrains Mono):** Used for all numerical values, SKU codes, and laboratory measurements. The monospaced nature ensures that columns of numbers align perfectly in tables, facilitating quick scanning.

All labels for form fields and table headers should use the `label-caps` token to reinforce the professional, report-like structure.

## Layout & Spacing
The layout system follows a **Fixed Grid** model on desktop (12 columns) and a fluid 4-column model on mobile. 

A strict 4px baseline grid ensures vertical rhythm. Given the laboratory nature of the product, information density is high. Tables should utilize the full container width, with horizontal borders between rows but no vertical dividers, except when distinguishing between primary categories of data.

**Breakpoints:**
- Mobile: < 600px
- Tablet: 600px - 1024px
- Desktop: > 1024px

## Elevation & Depth
This design system avoids shadows to maintain a flat, "printed report" aesthetic. Depth is communicated through **Bold Borders** and **Tonal Layers**.

- **Level 0 (Background):** Pure White (#FFFFFF).
- **Level 1 (Sub-section):** Laboratory Grey (#F4F4F4) with a 1px solid Neutral Carbon border.
- **Interaction (Hover):** A subtle shift in background color (e.g., from #F4F4F4 to #E8E8E8) rather than an elevation lift.
- **Dividers:** Use 1px or 2px solid lines to separate header sections from content, mirroring the look of a physical technical specification document.

## Shapes
The shape language is strictly **Sharp (0px roundedness)**. 

To evoke the precision of engineering and the structure of a soil test report, every button, input field, card, and badge features 90-degree corners. This creates a rigorous, architectural feel that distinguishes the product from softer, consumer-focused SaaS tools.

## Components

### Status Badges
Badges are critical for report status. They feature a high-contrast background and white text:
- **Aprobado (Approved):** Background #1B5E20, Bold JetBrains Mono text.
- **Pendiente (Pending):** Background #E65100, Bold JetBrains Mono text.
- **Rechazado (Rejected):** Background #C62828, Bold JetBrains Mono text.

### Data Tables
Tables are the primary vehicle for information. 
- **Headers:** Background #1A1A1A, Text #FFFFFF, Space Grotesk Bold, Uppercase.
- **Rows:** Alternating background #FFFFFF and #F4F4F4.
- **Numeric Cells:** Right-aligned, JetBrains Mono font.

### Buttons
- **Primary:** Background #A11C2B, White text, no radius, 2px border-bottom in a darker shade for a "tactile" but flat press effect.
- **Secondary:** Transparent background, 2px solid #1A1A1A border, black text.

### Input Fields
- Solid 1px #1A1A1A border. 
- On focus: Border thickens to 2px Primary Red. 
- Placeholder text: #757575 in JetBrains Mono.