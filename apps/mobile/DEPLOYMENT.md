# Deployment Guide - Horus Mobile App

Complete guide for building and deploying the Horus mobile application.

## 📋 Table of Contents
- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Development Build](#development-build)
- [Production Build](#production-build)
- [Troubleshooting](#troubleshooting)
- [Release Process](#release-process)

## Prerequisites

### Required Software
- **Node.js**: 18.x or higher
- **pnpm**: 8.x or higher
- **Expo CLI**: Latest version
- **Android Studio**: For Android builds
- **JDK**: Version 17 (for Android)
- **Git**: For version control

### Android Requirements
- Android SDK Platform 34
- Android Build Tools 34.0.0
- Android SDK Command-line Tools
- ANDROID_HOME environment variable set

### iOS Requirements (macOS only)
- Xcode 15+
- CocoaPods
- iOS Simulator or physical device

## Environment Setup

### 1. Clone and Install
```bash
# Clone the repository
git clone <repository-url>
cd Horus2

# Install dependencies
pnpm install
```

### 2. Environment Variables
Create `apps/mobile/.env`:
```env
EXPO_PUBLIC_API_URL=https://your-backend-url.com/api
```

**Important**: Never commit `.env` file with production credentials.

### 3. Verify Setup
```bash
cd apps/mobile
npx expo doctor
```

## Development Build

### Using Expo Go (Fastest)
```bash
cd apps/mobile

# Start dev server
pnpm start

# Scan QR code with Expo Go app on your device
```

**Pros:**
- Fastest development cycle
- No build required
- Hot reload

**Cons:**
- Limited to Expo-compatible packages
- Can't test native modifications

### Using Development Build
```bash
# Create development build
npx expo run:android
# or
npx expo run:ios
```

## Production Build

### Method 1: Local Build (Android)

#### Step 1: Generate JavaScript Bundle
```bash
cd apps/mobile

# Export production bundle
npx expo export --platform android

# Verify bundle was created
ls -lh dist/_expo/static/js/android/
```

#### Step 2: Copy Bundle to Android Assets
```bash
# Create assets directory if it doesn't exist
mkdir -p android/app/src/main/assets

# Copy the bundle
cp dist/_expo/static/js/android/*.hbc android/app/src/main/assets/index.android.bundle
```

#### Step 3: Build APK
```bash
cd android

# For Windows
gradlew.bat assembleDebug

# For macOS/Linux
./gradlew assembleDebug
```

#### Step 4: Locate APK
```bash
# Debug APK location
android/app/build/outputs/apk/debug/app-debug.apk

# Release APK location
android/app/build/outputs/apk/release/app-release.apk
```

### Method 2: EAS Build (Recommended)

EAS (Expo Application Services) provides cloud-based builds.

#### Setup
```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure project
eas build:configure
```

#### Build
```bash
# Build for Android
eas build --platform android --profile preview

# Build for iOS
eas build --platform ios --profile preview

# Build for both
eas build --platform all --profile preview
```

#### Download Build
Builds are available in your Expo dashboard or via CLI:
```bash
eas build:list
```

### Method 3: Release Build

For production releases with code signing:

```bash
# Android
cd android
./gradlew bundleRelease

# Output: android/app/build/outputs/bundle/release/app-release.aab
```

## Troubleshooting

### Common Issues

#### 1. JAVA_HOME Not Set
**Error**: `JAVA_HOME is not set`

**Solution**:
```bash
# Find Java installation
/usr/libexec/java_home -V  # macOS
where java  # Windows

# Set JAVA_HOME
export JAVA_HOME=/path/to/java  # macOS/Linux
set JAVA_HOME=C:\Path\To\Java  # Windows
```

#### 2. Gradle Build Fails
**Error**: Build fails with exit code 1

**Solutions**:
1. Clean build:
   ```bash
   cd android
   ./gradlew clean
   ./gradlew assembleDebug
   ```

2. Clear Gradle cache:
   ```bash
   rm -rf ~/.gradle/caches
   ```

3. Invalidate Android Studio caches:
   - Open Android Studio
   - File → Invalidate Caches / Restart

#### 3. Metro Bundler Issues
**Error**: Metro bundler fails or hangs

**Solutions**:
```bash
# Clear Metro cache
npx expo start -c

# Clear all caches
rm -rf node_modules
pnpm install
npx expo start -c
```

#### 4. Bundle Not Found in APK
**Error**: App shows blank screen or "Could not load bundle"

**Solutions**:
1. Verify bundle exists:
   ```bash
   ls -lh android/app/src/main/assets/index.android.bundle
   ```

2. Check bundle size (should be >10MB)

3. Force rebuild:
   ```bash
   cd android
   ./gradlew clean
   # Delete APK
   rm -rf app/build/outputs/apk
   ./gradlew assembleDebug
   ```

#### 5. Dependencies Issues
**Error**: Module not found or incompatible versions

**Solutions**:
```bash
# Clean install
rm -rf node_modules
pnpm install

# Clear package manager cache
pnpm store prune
```

### Build Environment Issues

If you encounter persistent build issues, the problem may be with the local environment:

**Quick Fixes**:
1. Update Java to JDK 17
2. Update Android SDK tools
3. Clear all caches
4. Use EAS Build instead (cloud-based, no local setup needed)

**Diagnostic Commands**:
```bash
# Check Java version
java -version  # Should be 17.x

# Check Gradle version
cd android
./gradlew --version

# Check Android SDK
sdkmanager --list | grep "build-tools"

# Check Expo environment
npx expo-env-info
```

## Release Process

### Version Bump
1. Update version in `app.json`:
   ```json
   {
     "expo": {
       "version": "1.0.0",
       "android": {
         "versionCode": 1
       }
     }
   }
   ```

2. Update version in `package.json`

### Changelog
Update CHANGELOG.md with:
- New features
- Bug fixes
- Breaking changes
- Migration notes

### Build Release
```bash
# Using EAS (recommended)
eas build --platform android --profile production

# Using local build
cd android
./gradlew bundleRelease
# Sign the bundle with your keystore
```

### Testing Checklist
Before release, test:
- [ ] Authentication flow
- [ ] All navigation tabs
- [ ] Create/update operations for all entities
- [ ] Offline functionality
- [ ] Token refresh
- [ ] Push notifications (if enabled)
- [ ] On multiple Android versions
- [ ] On different screen sizes

### Distribution
- **Internal Testing**: Use EAS Submit or manual APK sharing
- **Beta Testing**: Google Play Beta track
- **Production**: Google Play Store release

## APK Signing (Production)

### Generate Keystore
```bash
keytool -genkeypair -v -keystore my-release-key.keystore \
  -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

### Configure Gradle
Edit `android/app/build.gradle`:
```gradle
android {
    signingConfigs {
        release {
            storeFile file('my-release-key.keystore')
            storePassword 'your-store-password'
            keyAlias 'my-key-alias'
            keyPassword 'your-key-password'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}
```

### Build Signed APK
```bash
cd android
./gradlew assembleRelease
```

## Performance Tips

### Reduce Bundle Size
- Use Hermes engine (already enabled)
- Enable ProGuard in release builds
- Remove unused dependencies
- Optimize images

### Improve Build Speed
- Use Gradle build cache
- Increase JVM heap size in `gradle.properties`:
  ```properties
  org.gradle.jvmargs=-Xmx4096m
  ```
- Use parallel builds:
  ```properties
  org.gradle.parallel=true
  ```

## Support

### Resources
- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [Android Developer Guide](https://developer.android.com/)

### Common Commands Reference
```bash
# Development
pnpm start                    # Start Metro bundler
pnpm android                  # Run on Android
pnpm ios                      # Run on iOS

# Building
npx expo export              # Export production bundle
npx expo build:android       # Build APK (deprecated, use EAS)
eas build --platform android # Build with EAS

# Debugging
npx react-native log-android # View Android logs
adb logcat                   # View device logs
npx expo start --clear       # Clear Metro cache
```

---

**Last Updated**: Sprint 5 (February 2026)
**Build Version**: 1.0.0
