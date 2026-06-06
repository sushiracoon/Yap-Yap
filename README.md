# Yap-Yap 🗣️

A minimal speech analyzer that tells you if you're yapping or not.

## What it does

- Listens to your mic in real time
- Tracks **word count** and **words per minute (WPM)**
- Flags you as a yapper if you hit **60+ words** or **160+ WPM** (both = Certified Yapper 🔥)
- Shows a live **Yap Score** (0–100%) combining both signals
- Keeps a history of your last 5 sessions

## Getting started

No install needed. Just open `index.html` in **Chrome or Edge** (required for the Web Speech API).

## Files

```
yap-yap/
├── index.html   # Structure
├── styles.css   # Minimal light theme
└── app.js       # Speech recognition + logic
```

## Yap thresholds

| Signal | Threshold |
|--------|-----------|
| Word count | 60+ words |
| Speaking speed | 160+ WPM |

Both over the limit = **Certified Yapper**.

## Browser support

Requires the [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API) — works in Chrome and Edge. Firefox is not supported.
