# StayBoard Design System Guide

This document outlines the official design tokens (Typography, Colors, and Components) for the StayBoard application to ensure visual consistency across all pages and modules.

## 1. Typography

| Role | Font Family | Usage |
| :--- | :--- | :--- |
| **Display** | `DM Serif Display` | Page titles (H1), Section headers, Large numbers |
| **Sans** | `Plus Jakarta Sans` | Body text, Labels, Buttons, Input fields |
| **Mono** | `JetBrains Mono` | Phone numbers, Prices, Room numbers, IDs |

### Font Sizes & Weights
- **H1 / Page Title**: `text-4xl` or `text-5xl`, `font-display`, `tracking-tighter`
- **H2 / Section**: `text-2xl` or `text-3xl`, `font-display`
- **Body Regular**: `text-base` (16px), `font-sans`, `font-normal`
- **Small / Muted**: `text-sm` (14px) or `text-xs` (12px), `font-sans`
- **Weights**: Use `font-medium` (500) for UI elements like buttons and labels.

---

## 2. Color Palette

### Base Colors
- **Canvas (Background)**: `#F8F9FA` (`--bg-canvas`)
- **Surface (White)**: `#FFFFFF` (`--bg-surface`)
- **Sunken (Gray)**: `#F1F3F5` (`--bg-sunken`)

### Typography Colors (Ink)
- **Primary**: `#1A1A1A` — Use for main headings and readable text.
- **Secondary**: `#4B4B4B` — Use for descriptions and secondary info.
- **Muted**: `#8A8A8A` — Use for helper text and placeholders.

### Brand & Status Colors
- **Accent (Primary Blue)**: `#0259DD` (`--accent`)
- **Accent Gradient**: `linear-gradient(180deg, #87B9FF 0%, #0259DD 100%)`
- **Success**: `#059669`
- **Warning**: `#D97706`
- **Danger**: `#DC2626`

---

## 3. CTA & Button Layouts

Buttons should always use the `.btn` base class combined with a variant.

### Primary Button (`.btn-primary`)
- **Look**: Deep black/dark charcoal background with white text.
- **Background**: `var(--ink-primary)`
- **Border Radius**: `var(--radius-full)` (Rounded Pill)
- **Usage**: Main actions like "Save," "Check In," or "Confirm."

### Accent Button (`.btn-accent`)
- **Look**: Premium Blue Gradient with a soft blue glow.
- **Background**: `var(--accent-gradient)`
- **Shadow**: `0 10px 20px -5px rgba(2, 89, 221, 0.4)`
- **Usage**: Growth actions or high-priority calls to action like "New Booking" or "Add Room."

### Secondary Button (`.btn-secondary`)
- **Look**: Subtle light gray background with a border.
- **Background**: `#F8FAFC`, Border: `#E2E8F0`
- **Usage**: Cancel actions, "Edit," or secondary navigation.

### Ghost Button (`.btn-ghost`)
- **Look**: No background, text-only with a hover effect.
- **Usage**: Tertiary actions or list item actions.

---

## 4. UI Patterns
- **Radius**: Use `var(--radius-md)` (16px) for cards and inputs. Use `var(--radius-full)` for buttons.
- **Transitions**: Every interaction should use `var(--dur-normal)` (220ms) with `var(--ease-out)`.
- **Inputs**: Always use `.input` class with `.label` above it. Focus state should show a blue ring: `box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.12)`.
