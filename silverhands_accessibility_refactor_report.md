# SilverHands Accessibility Architecture Refactor Report

## 1. Executive Summary
Refactored SilverHands accessibility architecture to completely separate **Font Size Scaling** from **High Contrast Theme Display**. Previously, High Contrast mode was implemented as an item inside the font-size selection list, preventing users from combining font scaling with high contrast styling.

Following the refactoring, users can combine any of the **4 Font Sizes** with **High Contrast OFF or ON**, providing **8 total accessibility combinations**.

---

## 2. Decoupled Architecture & Data Flow

### A. Independent LocalStorage Keys
The settings are saved separately in browser `localStorage` and never overwrite each other:

- **`silverhands_font_size`**: `"standard" | "large" | "xlarge" | "xlarge-voice"` (default: `"large"`)
- **`silverhands_high_contrast`**: `true | false` (default: `false`)

### B. Independent DOM Attributes
State in `App.tsx` sets two independent attributes on the root HTML element (`document.documentElement`):

1. `data-accessibility="<font-size>"`
2. `data-high-contrast="true|false"`

```tsx
useEffect(() => {
  document.documentElement.setAttribute('data-accessibility', fontSize);
  document.documentElement.setAttribute('data-high-contrast', isHighContrast ? 'true' : 'false');
  document.documentElement.setAttribute('lang', language);
  localStorage.setItem('silverhands_font_size', fontSize);
  localStorage.setItem('silverhands_high_contrast', String(isHighContrast));
}, [fontSize, isHighContrast, language]);
```

### C. Decoupled CSS Rules ([`index.css`](file:///d:/HexawareHackathon/Hexaware-Hackathon-2026/frontend/src/index.css))
- **Font Scaling Selectors** (`html[data-accessibility="..."]`): Purely control base typography scaling (`16px`, `18px`, `20px`, `22px`), line-height, and element spacing.
- **High Contrast Selectors** (`html[data-high-contrast="true"]`): Purely control background colors (`#FFFFFF`), text colors (`#000000`), primary button styling (`#0037FF`), dark 2px visible borders, and shadow removal.

---

## 3. Verification of All 8 Accessibility Combinations

| Combination | Font Size | High Contrast | Verified Behavior |
| :--- | :--- | :--- | :--- |
| **1** | Standard (100% / 16px) | OFF | Standard UI styling & colors |
| **2** | Standard (100% / 16px) | ON | Standard sizing + Pure White bg, Black text, `#0037FF` buttons, Dark 2px borders |
| **3** | Large (120% / 18px) | OFF | Senior Default: 18px text, Standard UI theme |
| **4** | Large (120% / 18px) | ON | Senior Default: 18px text + Pure White bg, Black text, `#0037FF` buttons, Dark 2px borders |
| **5** | Extra Large (140% / 20px) | OFF | 20px text, Standard UI theme |
| **6** | Extra Large (140% / 20px) | ON | 20px text + Pure White bg, Black text, `#0037FF` buttons, Dark 2px borders |
| **7** | Extra Large + Voice (150% / 22px) | OFF | 22px text + Voice prompts, Standard UI theme |
| **8** | Extra Large + Voice (150% / 22px) | ON | 22px text + Voice prompts + Pure White bg, Black text, `#0037FF` buttons, Dark 2px borders |

---

## 4. UI Controls & Senior Accessibility Features
- **Top Utility Bar Controls**: Displays separate **Font Size:** `[Standard] [Large] [Extra Large] [Extra Large + Voice]` buttons and an independent **High Contrast:** `[OFF] [ON]` toggle.
- **Navbar Quick Action Controls**: Features a quick font-scaling button (`Font 120%`, `Font 140%`, etc.) and an independent `HC OFF / HC ON` quick toggle button.
- **Senior UI Minimums Maintained**:
  - Minimum text size: 16px (`Standard`), 18px (`Large`)
  - Minimum button height & touch target: **48px × 48px** (`min-h-[48px]`)
  - Floating AI Assistant launcher button at `bottom-20 sm:bottom-6` with `min-h-[56px] min-w-[56px]`.

---

## 5. Files Changed
1. [`frontend/src/i18n.ts`](file:///d:/HexawareHackathon/Hexaware-Hackathon-2026/frontend/src/i18n.ts)
   - Added `fontSizeLabel`, `highContrastLabel`, `highContrastOn`, and `highContrastOff` in English, Tamil, and Hindi.
2. [`frontend/src/index.css`](file:///d:/HexawareHackathon/Hexaware-Hackathon-2026/frontend/src/index.css)
   - Decoupled `data-accessibility` font size rules from `data-high-contrast="true"` display theme rules.
3. [`frontend/src/App.tsx`](file:///d:/HexawareHackathon/Hexaware-Hackathon-2026/frontend/src/App.tsx)
   - Refactored state into independent `fontSize` and `isHighContrast` state variables.
   - Updated `localStorage` to save `silverhands_font_size` and `silverhands_high_contrast` separately.
   - Updated top utility bar UI to render independent Font Size and High Contrast toggle controls.
4. [`frontend/src/components/Navbar.tsx`](file:///d:/HexawareHackathon/Hexaware-Hackathon-2026/frontend/src/components/Navbar.tsx)
   - Updated props interface for `fontSize`, `setFontSize`, `isHighContrast`, and `setIsHighContrast`.
   - Added quick font cycle (`cycleFontSize`) and High Contrast `HC ON / OFF` quick toggle buttons.

---

## 6. Build & Test Results
- `npm run build` -> **PASSED with 0 errors** (`dist/index.html` built in 1.00s)
- `..\.venv\Scripts\python.exe test_full_architecture.py` -> **PASSED 100%** (11/11 tests passed in 2.65s)
- Backend business logic & API contracts -> **0 changes / 0 regressions**.
