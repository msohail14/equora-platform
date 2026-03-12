#!/bin/bash

# iOS Build and Deploy Script for Horse Riding App
# This script helps automate the iOS build process

set -e

echo "🐴 Horse Riding App - iOS Build Script"
echo "========================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${GREEN}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if running on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    print_error "This script must run on macOS"
    exit 1
fi

# Check if Flutter is installed
if ! command -v flutter &> /dev/null; then
    print_error "Flutter is not installed. Please install Flutter first."
    exit 1
fi

print_info "Flutter version:"
flutter --version | head -n 1

echo ""
echo "Select build type:"
echo "1) Run on Simulator"
echo "2) Run on Physical Device"
echo "3) Build Release IPA"
echo "4) Clean and Rebuild"
echo "5) Install CocoaPods"
echo "6) Open in Xcode"
read -p "Enter choice [1-6]: " choice

case $choice in
    1)
        print_info "Running on iOS Simulator..."
        flutter run -d simulator
        ;;
    2)
        print_info "Available devices:"
        flutter devices
        echo ""
        read -p "Enter device ID: " device_id
        print_info "Running on device: $device_id"
        flutter run -d "$device_id"
        ;;
    3)
        print_info "Building Release IPA..."
        
        # Clean previous builds
        print_info "Cleaning previous builds..."
        flutter clean
        
        # Get dependencies
        print_info "Getting dependencies..."
        flutter pub get
        
        # Install pods
        print_info "Installing CocoaPods..."
        cd ios
        pod install
        cd ..
        
        # Build
        print_info "Building iOS release..."
        flutter build ios --release
        
        print_info "✅ Build complete!"
        print_warning "Next steps:"
        echo "  1. Open ios/Runner.xcworkspace in Xcode"
        echo "  2. Select 'Any iOS Device (arm64)' as target"
        echo "  3. Product → Archive"
        echo "  4. Distribute App → App Store Connect"
        ;;
    4)
        print_info "Cleaning and rebuilding..."
        flutter clean
        rm -rf ios/Pods
        rm -rf ios/Podfile.lock
        rm -rf ios/.symlinks
        flutter pub get
        cd ios
        pod install
        cd ..
        print_info "✅ Clean complete! You can now build."
        ;;
    5)
        print_info "Installing CocoaPods dependencies..."
        cd ios
        pod install
        cd ..
        print_info "✅ CocoaPods installed!"
        ;;
    6)
        print_info "Opening in Xcode..."
        open ios/Runner.xcworkspace
        ;;
    *)
        print_error "Invalid choice"
        exit 1
        ;;
esac

echo ""
print_info "Done! 🎉"
