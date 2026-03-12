# iOS Build and Deploy Script for Horse Riding App
# PowerShell version for Windows users (requires Mac for actual iOS builds)

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("check", "instructions")]
    [string]$Action = "instructions"
)

Write-Host "🐴 Horse Riding App - iOS Configuration Helper" -ForegroundColor Green
Write-Host "=" * 50 -ForegroundColor Green
Write-Host ""

if ($Action -eq "check") {
    Write-Host "Checking prerequisites..." -ForegroundColor Yellow
    Write-Host ""
    
    # Check Flutter
    Write-Host "Checking Flutter installation..." -ForegroundColor Cyan
    if (Get-Command flutter -ErrorAction SilentlyContinue) {
        $flutterVersion = flutter --version 2>&1 | Select-String "Flutter" | Select-Object -First 1
        Write-Host "✓ Flutter is installed: $flutterVersion" -ForegroundColor Green
    } else {
        Write-Host "✗ Flutter is not installed" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "iOS builds can only be performed on macOS" -ForegroundColor Yellow
    Write-Host "You'll need:" -ForegroundColor White
    Write-Host "  - Mac computer with Xcode installed" -ForegroundColor White
    Write-Host "  - Apple Developer account (\$99/year)" -ForegroundColor White
    Write-Host "  - Physical iOS device or simulator" -ForegroundColor White
    
} else {
    Write-Host @"
To build for iOS and TestFlight, you need a Mac computer.

📋 Quick Start Guide:
--------------------

1. On your Mac, open Terminal and navigate to the project:
   cd /path/to/horse_riding_app_design

2. Install CocoaPods dependencies:
   cd ios
   pod install
   cd ..

3. Run on iOS Simulator:
   flutter run -d simulator

4. Build for TestFlight:
   flutter build ios --release
   open ios/Runner.xcworkspace

5. In Xcode:
   - Product → Archive
   - Upload to App Store Connect

📖 Detailed Documentation:
-------------------------
See IOS_DEPLOYMENT_GUIDE.md for complete instructions

🔧 Files Configured:
-------------------
✓ ios/Runner/Info.plist - Privacy permissions added
✓ ios/ExportOptions.plist - TestFlight config
✓ ios/ExportOptions-AdHoc.plist - Ad-hoc distribution
✓ IOS_DEPLOYMENT_GUIDE.md - Complete guide

⚠️  Important:
------------
- Update bundle identifier in Xcode: com.example.horseRidingAppDesign
- Add your Apple Developer Team ID
- Configure code signing in Xcode
- Add app icons (see guide)

Need help? Check IOS_DEPLOYMENT_GUIDE.md for detailed instructions!
"@ -ForegroundColor White
}

Write-Host ""
Write-Host "For detailed instructions, see: IOS_DEPLOYMENT_GUIDE.md" -ForegroundColor Cyan
