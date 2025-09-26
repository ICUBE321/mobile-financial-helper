# App Branding Guide

## Current Changes Made

✅ **App Name**: Changed from "WealthAndAssetManagerMobile" to "Wealth Manager"
✅ **Logo**: Using your existing `assets/images/logo.jpg`
✅ **Theme Color**: Set to Sea Green (#2E8B57) for a financial/wealth theme
✅ **Bundle IDs**: Updated for cleaner app store presence

## Next Steps for Complete Branding

### 1. Optimize Your Logo for Different Sizes

Your current logo (`logo.jpg`) needs to be optimized for different screen sizes:

**Required Sizes:**

- **App Icon**: 1024x1024 pixels (PNG format)
- **Adaptive Icon** (Android): 1024x1024 pixels
- **Splash Screen**: 1284x2778 pixels (optional, but recommended)
- **Favicon**: 48x48 pixels

**Recommended Actions:**

```bash
# Generate all icon sizes automatically
npx expo install @expo/image-utils
npx create-expo-icon --icon ./assets/images/logo.jpg
```

### 2. Icon Design Best Practices

For a professional financial app:

- **Colors**: Use your theme color (#2E8B57) with white/gold accents
- **Style**: Clean, minimal, professional
- **Symbols**: Consider $ symbol, chart icons, or geometric shapes
- **Avoid**: Too much text or complex details (hard to see when small)

### 3. Create App Store Assets

For app store submission, you'll need:

- **App Icon**: 1024x1024 PNG
- **Screenshots**: Various device sizes
- **Feature Graphic**: 1024x500 (Android)

### 4. Test Your Branding

Run these commands to see your changes:

```bash
# Clear cache and restart
npx expo start -c

# Test on different devices
npx expo run:ios
npx expo run:android
```

### 5. Professional Icon Creation Tools

If you want to create a custom icon:

- **Figma** (free): Great for app icon design
- **Canva**: Has app icon templates
- **Adobe Illustrator**: Professional vector graphics
- **Online Tools**:
  - appicon.co (generates all sizes)
  - makeappicon.com

### 6. Color Scheme

Current theme color: **#2E8B57** (Sea Green)

- Primary: #2E8B57
- Success: #27ae60
- Error: #e74c3c
- Background: #ffffff

## File Structure After Changes

```
assets/images/
├── logo.jpg           ← Your main logo (used everywhere now)
├── icon.png           ← Original icon (can be removed)
├── adaptive-icon.png  ← Original adaptive icon (can be removed)
├── splash-icon.png    ← Original splash (can be removed)
└── favicon.png        ← Original favicon (can be removed)
```

## Testing Checklist

- [ ] App displays "Wealth Manager" name
- [ ] Logo appears in app icon
- [ ] Splash screen shows your logo
- [ ] Theme colors look consistent
- [ ] Test on both iOS and Android
- [ ] Check web version favicon

## Build for Distribution

When ready for app stores:

```bash
# Build for iOS App Store
npx expo build:ios

# Build for Google Play Store
npx expo build:android

# Or use EAS Build (recommended)
npx eas build --platform all
```
