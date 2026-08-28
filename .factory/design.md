# Friend File Drop — visual thesis

## Direction

Friend File Drop looks like a handwritten lab notebook used to record a careful experiment. A file transfer is treated as a checkable procedure: prepare the specimens, pair two benches, watch each item cross, and sign the receipt. The interface uses ruled paper, registration marks, ink annotations, clipped corners, and restrained stamps. It must never resemble a generic cloud-drive dashboard.

The notebook metaphor explains the product. Manifests are experiment sheets, the six-word room code is a handwritten sample label, progress is a ruled measurement, and the final receipt is a signed lab record.

## Palette

The light treatment is the product's primary and explicit mode. It resembles warm paper under a work lamp.

| Token | Value | Use |
| --- | --- | --- |
| `--paper` | `#F4EEDC` | warm page background |
| `--paper-deep` | `#E7DEC4` | secondary sheets |
| `--ink` | `#172A32` | main writing; 12.4:1 on paper |
| `--ink-soft` | `#4A5A5F` | secondary writing; 6.4:1 on paper |
| `--rule` | `#9FB5B1` | notebook rules and quiet borders |
| `--teal` | `#075F60` | primary action and focus; 6.4:1 on paper |
| `--teal-ink` | `#FFFFFF` | action text |
| `--coral` | `#A43C2F` | warnings and hand annotations |
| `--green` | `#275B3B` | verified/success states |
| `--yellow` | `#F0CD63` | room-code highlighter |

Dark mode is intentionally omitted. Warm paper is the visual premise and painting the page explicitly prevents an accidental system-dark mismatch.

## Type

- Display and annotations: `Comic Sans MS`, `Segoe Print`, cursive. This familiar system handwriting stack carries the notebook voice without a font download.
- Body and controls: `Atkinson Hyperlegible`, `Segoe UI`, system sans-serif. When the bundled font is unavailable during development, the system stack remains readable.
- Codes, sizes, and hashes: `ui-monospace`, `SFMono-Regular`, monospace, with tabular figures.

Body text starts at 17 px with 1.55 line height. Headings use a compact 1.2 scale. The readable measure is 66 characters.

## Spacing and shape

Spacing follows an 8 px base: 4, 8, 16, 24, 32, 48, 64, and 96 px. Sheet corners are slightly irregular through clipped CSS polygons. Controls stay rectangular, with 4 px radii and a two-pixel ink edge. Touch targets are at least 44 px.

Page sections alternate between open ruled paper and taped specimen sheets. Cards are reserved for independent files, transfer events, and receipts.

## Interaction grammar

- The primary action looks like a dark ink label with an offset paper shadow.
- Current steps receive a coral pencil mark and a numbered circle.
- Dragging files over the manifest lifts the paper sheet by 4 px.
- Completed files receive a green `VERIFIED` stamp alongside a written hash prefix.
- Errors read like margin notes: what happened and the next action.

## Motion policy

One signature motion is used: a short left-to-right ink trace reveals transfer progress over 220 ms. New sheets settle upward by 6 px over 180 ms. No motion loops. Under `prefers-reduced-motion: reduce`, progress changes width instantly, sheets appear without movement, and smooth scrolling is disabled.

## Asset plan and provenance

The hero illustration is an original generated editorial still life: two different devices on a ruled laboratory desk, with small file specimens physically moving between them and a stamped receipt. It clarifies mixed-device transfer without showing an invented UI. Icons and stamps are hand-authored SVG/CSS in the repository.

### Image prompt sheet

- Subject: an open lab notebook between a phone and a laptop, three paper file specimens crossing a short bridge, one completed receipt with a check mark.
- World: friendly home workbench interpreted as a careful analog lab notebook.
- Materials: warm recycled paper, blue-black fountain ink, red pencil, masking tape, subtle halftone grain.
- Light/lens: soft morning window light, slightly top-down editorial still life, 50 mm feel.
- Palette words: warm cream, deep blue-black, muted teal, brick coral, mustard highlight.
- Negative list: people, hands, brands, readable text, logos, watermarks, glossy 3D, neon gradients, floating glass panels, photoreal device UI.

Generated on 2026-08-28 with the factory image deployment through `/opt/fleet/lib/gen-image.sh`. The selected image and prompt sidecar live under `assets/src/`; web exports live under `public/assets/`. The asset is original for this product and contains no third-party marks.

## Responsive intent

At 390 px, the hero art moves below the first action, facts become a short vertical list, and transfer panels use one column. The active transfer keeps the room code and progress visible; decorative tape and long hash suffixes drop away. Desktop uses an offset two-column notebook spread rather than a centered marketing hero.
