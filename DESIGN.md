---
name: Shinme Japanese Language Center
description: 日本語で未来をひらく — Trung tâm Nhật ngữ Shinme
colors:
  primary: "#135E36"
  primary-hover: "#0F4C2B"
  accent: "#6CC24A"
  accent-soft: "#CDEABD"
  leaf: "#E4F4DA"
  neutral-bg: "#FAF8F2"
  surface: "#FFFFFF"
  border: "#E2E8F0"
  ink: "#17271E"
  ink-muted: "#56685D"
typography:
  display:
    fontFamily: "var(--font-nunito), var(--font-noto-jp), sans-serif"
    fontSize: "3.75rem"
    fontWeight: 900
    lineHeight: 1.2
  headline:
    fontFamily: "var(--font-nunito), var(--font-noto-jp), sans-serif"
    fontSize: "2.25rem"
    fontWeight: 800
    lineHeight: 1.3
  title:
    fontFamily: "var(--font-nunito), var(--font-noto-jp), sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.4
  body:
    fontFamily: "var(--font-nunito), var(--font-noto-jp), sans-serif"
    fontSize: "1rem"
    fontWeight: 500
    lineHeight: 1.6
  label:
    fontFamily: "var(--font-nunito), var(--font-noto-jp), sans-serif"
    fontSize: "0.75rem"
    fontWeight: 700
    letterSpacing: "0.02em"
rounded:
  sm: "0.375rem"
  md: "0.75rem"
  lg: "1rem"
  xl: "1.25rem"
  full: "9999px"
spacing:
  xs: "0.25rem"
  sm: "0.5rem"
  md: "1rem"
  lg: "1.5rem"
  xl: "2.5rem"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    rounded: "{rounded.full}"
    padding: "12px 24px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
---

# Design System: Shinme Japanese Language Center

## Overview

**Creative North Star: "The Living Sprout (新芽)"**

Shinme’s visual identity embodies growth, warmth, and steady progress in Japanese language mastery. Instead of cold educational tech or austere traditional calligraphy, Shinme feels approachable and grounded—drawing inspiration from young green tea shoots, warm cream Japanese washi paper, and the cheerful encouragement of our chibi sprout mascot.

**Key Characteristics:**
- **Warm & Organic Grounding:** Soft warm cream background (`#FAF8F2`) eliminating white-glare during extended study sessions.
- **Deep Forest Authority:** Trustworthy deep forest green (`#135E36`) anchoring navigation, headings, and primary calls to action.
- **Sprout Accent:** Bright spring-green sprout accent (`#6CC24A`) signaling active progress, achievements, and lively micro-moments.
- **CJK & Furigana Elegance:** Seamless integration of Vietnamese Latin typography (Nunito) and native Japanese kanji/furigana (Noto Sans JP) via `<ruby>` tags.

## Colors

The palette balances serene nature tones with crisp readability.

### Primary
- **Forest Green** (`#135E36`): Core brand anchor used for headers, primary CTAs, active navigation items, and key headings.
- **Deep Forest Shade** (`#0F4C2B`): Hover and focus states for primary controls.

### Secondary
- **Sprout Green** (`#6CC24A`): Accent tone for progress bars, badges, quiz success feedback, and sprout highlights.
- **Leaf Tint** (`#E4F4DA`): Soft background tint for cards, tags, and callouts.

### Neutral
- **Warm Cream** (`#FAF8F2`): Primary background surface for all public pages, reducing eye strain.
- **Pure Surface** (`#FFFFFF`): Elevated cards, modals, and test containers.
- **Soft Border Slate** (`#E2E8F0`): Subtle 1px boundary dividing structured information.
- **Deep Forest Ink** (`#17271E`): High-contrast text color ensuring > 4.5:1 contrast against warm cream.
- **Muted Sage Ink** (`#56685D`): Secondary metadata, subtitles, and captions.

### Named Rules
**The Sprout Rarity Rule.** The bright sprout green (`#6CC24A`) is an accent of growth; it is reserved for badges, active milestones, and progress indicators—never splashed as solid full-screen backgrounds.

## Typography

**Display Font:** Nunito (Vietnamese/Latin) paired with Noto Sans JP (Japanese Kanji/Kana).
**Body Font:** Nunito with strict CJK kinsoku wrapping.

### Hierarchy
- **Display** (Black 900, clamp 2.3rem–4.4rem, 1.55 line-height): Hero taglines and Furigana banner text.
- **Headline** (ExtraBold 800, clamp 1.5rem–2.25rem, 1.3 line-height): Section titles and primary headers.
- **Title** (Bold 700, 1.25rem, 1.4 line-height): Course titles, sensei names, and dialog headings.
- **Body** (Medium 500, 1rem, 1.6 line-height): Descriptive text, outcomes, and articles.
- **Interface Medium** (Bold 700, 0.95rem): Primary navigation links, button controls, and sensei quotes.
- **Label** (Bold 700–800, 0.75rem, 0.02em tracking): Metadata badges, timestamps, and lesson tags.
- **Micro / Caption** (Black 900, 0.65rem–0.7rem): Micro pill indicators, audio duration tags, and file extension tags.

### Named Rules
**The Furigana Room Rule.** Any text with Japanese furigana annotations (`<ruby>`) must have extra line spacing (minimum 1.8x line-height) to prevent ruby readings from touching text on preceding lines.

## Layout

A fluid 12-column grid container capped at `80rem` (1280px) with responsive horizontal padding (`px-5 sm:px-8 lg:px-10`). The LMS portal utilizes a responsive split-view: sticky 264px (`16.5rem`) sidebar on desktop, transitioning to a clean hamburger slide-out on mobile.

## Elevation & Depth

Surfaces maintain crisp, clean modernism with soft, organic drop shadows tinted with subtle forest undertones.

### Shadow Vocabulary
- **Card Rest** (`0 1px 2px rgb(19 94 54 / 0.05), 0 8px 24px -12px rgb(19 94 54 / 0.18)`): Default elevation for course cards, sensei tiles, and dashboard widgets.
- **Lifted Focus** (`0 2px 4px rgb(19 94 54 / 0.06), 0 18px 40px -18px rgb(19 94 54 / 0.35)`): Modals, floating role switcher, and active interactive elements.

## Shapes

- **Rounded Corners:** Generous `1rem` (`rounded-2xl`) for cards, modal dialogs, and panels.
- **Pill Controls:** Full-radius `rounded-full` for all buttons, badges, and level selector chips.

## Components

### Buttons
- **Shape:** Pill (`rounded-full`, 9999px radius).
- **Primary:** Forest green background with white text, lifting with `-translate-y-px` on active.
- **Outline:** 2px border in forest green with leaf-tint hover.

### Badges / Chips
- **Style:** Compact pill (`rounded-full`) with uppercase or bold text.
- **Tones:** `leaf` (sprout badge), `primary` (forest), `warn` (upcoming classes), `neutral` (level indicators).

### Cards
- **Corner Style:** `rounded-2xl` with soft slate border (`#E2E8F0`) and `bg-white`.
- **Hover:** Gentle elevation lift with ease-out timing curve.

## Do's and Don'ts

### Do:
- **Do** always use the `<FuriganaText />` component for Japanese kanji containing readings.
- **Do** wrap all interactive tests and forms in accessible keyboard navigation and handle IME `isComposing` states.
- **Do** maintain bilingual typography respect: Noto Sans JP for Japanese characters, Nunito for Vietnamese tone-marked text.

### Don't:
- **Don't** use cold pure gray `#808080` for secondary text; always use tinted sage `#56685D`.
- **Don't** use harsh square corners on interactive controls.
- **Don't** truncate Japanese sentences with awkward middle-of-word breaks.

