---
name: VITA Orbital Health
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#3c4a46'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#6b7a76'
  outline-variant: '#bacac5'
  surface-tint: '#006b5f'
  primary: '#006b5f'
  on-primary: '#ffffff'
  primary-container: '#2dd4bf'
  on-primary-container: '#00574d'
  inverse-primary: '#3cddc7'
  secondary: '#505e80'
  on-secondary: '#ffffff'
  secondary-container: '#c8d7ff'
  on-secondary-container: '#4f5d7f'
  tertiary: '#2156c9'
  on-tertiary: '#ffffff'
  tertiary-container: '#a7bcff'
  on-tertiary-container: '#0044b3'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#62fae3'
  primary-fixed-dim: '#3cddc7'
  on-primary-fixed: '#00201c'
  on-primary-fixed-variant: '#005047'
  secondary-fixed: '#d9e2ff'
  secondary-fixed-dim: '#b8c6ee'
  on-secondary-fixed: '#0a1a39'
  on-secondary-fixed-variant: '#384667'
  tertiary-fixed: '#dbe1ff'
  tertiary-fixed-dim: '#b3c5ff'
  on-tertiary-fixed: '#00174a'
  on-tertiary-fixed-variant: '#003ea6'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-lg:
    fontFamily: Space Grotesk
    fontSize: 3rem
    fontWeight: '700'
    lineHeight: 3.5rem
    letterSpacing: -0.03em
  display-lg-mobile:
    fontFamily: Space Grotesk
    fontSize: 2.25rem
    fontWeight: '700'
    lineHeight: 2.75rem
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 2rem
    fontWeight: '600'
    lineHeight: 2.5rem
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Space Grotesk
    fontSize: 1.5rem
    fontWeight: '600'
    lineHeight: 2rem
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Space Grotesk
    fontSize: 1.25rem
    fontWeight: '600'
    lineHeight: 1.75rem
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 1rem
    fontWeight: '400'
    lineHeight: 1.5rem
  body-md:
    fontFamily: Inter
    fontSize: 0.875rem
    fontWeight: '400'
    lineHeight: 1.25rem
  body-sm:
    fontFamily: Inter
    fontSize: 0.75rem
    fontWeight: '400'
    lineHeight: 1.125rem
  telemetry-lg:
    fontFamily: JetBrains Mono
    fontSize: 2.25rem
    fontWeight: '700'
    lineHeight: 2.5rem
    letterSpacing: -0.04em
  telemetry-md:
    fontFamily: JetBrains Mono
    fontSize: 1.25rem
    fontWeight: '600'
    lineHeight: 1.5rem
    letterSpacing: -0.02em
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 0.6875rem
    fontWeight: '600'
    lineHeight: 1rem
    letterSpacing: 0.08em
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 0.625rem
    fontWeight: '500'
    lineHeight: 0.875rem
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-desktop: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system blends **Mission Control technical precision** with **clinical biomedical clarity**. Designed specifically for high-stress, long-duration deep space operations (such as Ares IV), the interface reconciles two disparate operational environments: dense telemetry monitoring and rapid clinical triage. 

The emotional tone balances absolute calm, rigorous scientific fidelity, and instantaneous cognitive legibility. Visual architecture relies on a hybrid of:
- **Clean Scientific Minimalism:** Generous structural negative space in the primary diagnostic viewport, mitigating visual fatigue during extended shifts.
- **Instrument Brutalism / Mission Control Telemetry:** Dense, tabular micro-grids, monospaced numerical readouts, and calibrated millimeter-grid viewports for dynamic biological signals (ECG, intracranial pressure, radiation absorption).
- **Tactile High-Information Feedback:** Status nodes, subtle luminescent active states, and real-time biological waveform rendering.

## Colors

The color system is functionally partitioned between persistent navigational infrastructure and analytical clinical canvases.

### Palette Architecture
- **Control Shell (Sidebar & Core Navigation):** Deep Space Navy (`#0B1B3A`). Establishes a disciplined, non-distracting physical boundary that recedes into peripheral vision.
- **Clinical Floor (Main Workspace Canvas):** Sterilized Blue-Gray Tint (`#F4F7FB`). Softens glare while maintaining clean contrast for crisp data density.
- **Diagnostic Surfaces (Panels, Cards, Modals):** Pure White (`#FFFFFF`) grounded with structural hairline borders (`rgba(15, 23, 42, 0.08)` or `#E2E8F0`).
- **Telemetry & Physiological Spectrum:**
  - **Optimal / Nominal / Primary Action:** Mint Turquoise (`#2DD4BF`). Indicates baseline homeostasis, confirmed readiness, and positive clinical status.
  - **Hemodynamic / Alert / Tachycardia:** Vital Coral Red (`#F0566A`). Reserved strictly for critical thresholds, physiological decompensation, and emergency warnings.
  - **Metabolic / Nutrition / Environmental Radiation:** Warm Amber (`#F59E0B`). Denotes caution, nutritional deficits, elevated radiation dosage, and maintenance requirements.
  - **Neuro-Cognitive / Circadian / Sleep Architecture:** Astral Indigo-Violet (`#7C6FE8`). Represents polysomnography, REM cycles, cognitive workload scores, and neurological assessment states.
  - **Electrophysiology / Arterial Pressure / Vitals:** Electric Blue (`#4F7CF0`). Deployed for active lead tracking, ECG vector sweeps, systolic/diastolic metrics, and raw biotelemetry streams.

### Text & Typographic Contrast
- **Primary Data & Headings:** Deep Slate (`#0F172A`) for high-contrast reading of vital numbers and status headers.
- **Secondary Readouts & Units:** Medium Slate (`#64748B`) for technical nomenclature, metric labels (mmHg, bpm, mSv), and timestamps.
- **Subtle Grids & Dividers:** Precision Slate Tint (`rgba(15, 23, 42, 0.06)`).

## Typography

The typographic hierarchy serves three distinct operational objectives:

1. **Space Grotesk (Architectural & Section Hierarchy):** Chosen for its engineered geometric structure and subtle mechanical personality. Used for mission headers, crew designation tags, and module sections.
2. **Inter (Interface & Clinical Notes):** Provides neutral, highly legible reading for diagnostic summaries, protocol documentation, and therapeutic plans.
3. **JetBrains Mono (Telemetry, Micro-labels & Quantitative Data):** Ensures column-aligned tabular numbers that never shift or jitter when streaming dynamic real-time data. All micro-labels, metrics, vectors, coordinates, and units are rendered in uppercase monospaced text with expanded letter-spacing (`tracking-wider`).

## Layout & Spacing

The viewport implements a **Modular Mission Grid System** featuring a fixed left-hand command spine (Dark Deep Space Navy, 80px collapsed / 240px expanded) paired with an asynchronous multi-column canvas.

### Grid & Responsiveness
- **Desktop (Mission Control Multi-Monitor / Console):** 12-column adaptive fluid grid with `1.5rem` gutters and `2rem` outer page margins. Critical vitals occupy high-priority persistent modular blocks (e.g., 4-column crew cards or 8-column high-frequency waveform bays).
- **Tablet / Crew PADD (Portable Diagnostic Device):** 8-column layout. Waveform sweeps collapse to primary Lead II feeds; secondary channels stack into tabbed modules. Outer margin compresses to `1.25rem`.
- **Mobile / EVA Suit HUD Companion:** Single-column stacked telemetry modules with sticky biometric status chips and a fixed bottom critical-action bar. Margins contract to `1rem`.

### Spacing Rhythm
Component internal padding scales proportionally:
- `space-xs` (4px): Metric-to-unit separation, badge interior spacing.
- `space-sm` (8px): Spacing between sub-metrics, mini-sparkline container insets.
- `space-md` (16px): Card internal padding, list item gaps.
- `space-lg` (24px): Inter-card gap and major block clustering.
- `space-xl` (40px): Section headers to clinical workspace segregation.

## Elevation & Depth

Visual depth is strictly functional, replacing ornamental diffusion with structural clarity:

1. **Subtle Grounding Shadows:** Diagnostic cards use a directional, crisp, low-opacity drop:
   `box-shadow: 0 1px 3px rgba(11, 27, 58, 0.04), 0 6px 16px rgba(11, 27, 58, 0.03);`
2. **Hairline Structural Borders:** Every white surface is reinforced with a millimeter hairline: `border: 1px solid rgba(15, 23, 42, 0.06)` or `#E2E8F0`. This prevents edge bleeding when ambient cockpit/habitat lighting drops.
3. **Drawer & Sliding Overlays (VITA AI & Emergency Overrides):** Elevates via a dark frosted barrier (`rgba(11, 27, 58, 0.35)` with `backdrop-filter: blur(8px)`) paired with a high-elevation boundary shadow:
   `box-shadow: -8px 0 24px rgba(11, 27, 58, 0.12);`
4. **Active/Critical Glowing Embers:** Real-time alarms do not use heavy shadows, but instead cast a soft, 6px colored radial aura (`0 0 12px rgba(240, 86, 106, 0.3)`) to command optical priority immediately.

## Shapes

The design system adopts a **Soft Geometric & Precision-Milled** silhouette standard (`roundedness: 1`):

- **Standard Containers & Cards:** `0.375rem` (6px) to `0.5rem` (8px). Radii remain tight and disciplined to maintain maximum spatial efficiency and a lab-grade instrumentation aesthetic.
- **Pills & Status Indicators:** Telemetry state chips, crew status badges, and pulsed alarm indicators employ full circular geometry (`rounded-full` / 9999px) to contrast with analytical rectangular cards.
- **Waveform Viewports & Sparkline Canvases:** Strictly bounded with `0.25rem` (4px) inner corner radii, mimicking glass instrumentation displays.

## Components

### Status Chips with Pulsing Beacons
- **Structure:** Monospaced label-caps text encased in an ultra-subtle tinted container (`rgba` of corresponding channel color at 10% opacity) with a solid 1px border at 20% opacity.
- **Pulse Mechanism:** Houses a 6px circular indicator containing a core dot and a concentric outer ring animating with a 1.8s cyclical keyframe expansion (`scale 1 to 2.2, opacity 0.75 to 0`). Green for Nominal, Amber for Warning, Coral for Critical Alert.

### Telemetry Metric Cards
- **Structure:** Clean white surface, 1px Slate border. Header includes crew ID/crew name, uppercase category label in `JetBrains Mono`, and state chip.
- **Primary Readout:** Extra-bold tabular number paired with baseline-aligned unit tag in medium slate (e.g., `72` in `2.25rem`, `BPM` in `0.75rem`).
- **Telemetry Sparkline:** Mini vector SVG embedded beneath the primary figure. Uses a 1.5px continuous path line with an area gradient fill fading to zero opacity at the card floor.

### Real-Time ECG Sweep Channel
- **Canvas:** Technical dark-on-light or light-on-dark sub-viewport rendered over an SVG/CSS millimeter grid (5mm major grid at `rgba(79, 124, 240, 0.12)`, 1mm sub-grid at `rgba(79, 124, 240, 0.04)`).
- **Sweep Bar:** Electric Blue (`#4F7CF0`) trace line with an illuminated vertical scanning gradient line that simulates physical phosphorescent sweep delay.

### Concentric Biometric Rings
- **Visuals:** Thin, multi-ring radial gauges displaying multi-axis metrics (Oxygen Saturation, Circadian Sync, Hydration, Radiation Limit).
- **Styling:** Inactive background track in `rgba(15, 23, 42, 0.05)`. Active tracks use categorical mission colors with rounded caps and precision percentage values in the center.

### Inputs & Precision Steppers
- **Field Anatomy:** Grounded white input with `0.25rem` corners, 1px border `#CBD5E1`. Focus state transitions directly to Electric Blue or Mint (`#2DD4BF`) with an absolute 2px zero-blur ring.
- **Numeric Steppers:** Integrated monospaced keypad increments with tactile micro-buttons for microgravity adjustments.

### VITA AI Assistant Slide-Out Drawer
- **Placement:** Docked off-canvas right, sliding over the main viewport with a smooth hardware-accelerated spring curve.
- **Surfaces:** Dark Deep Navy background (`#0B1B3A`) to clearly separate autonomous AI analysis from raw medical data.
- **Chat Feed:** Query bubbles rendered in translucent slate panels with glowing Mint highlights indicating synthesized clinical diagnostic suggestions.