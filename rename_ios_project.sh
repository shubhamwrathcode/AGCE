#!/bin/bash
set -e

cd ios

# 1. Rename folders
if [ -d "CTEX" ]; then
    mv CTEX AGCX
fi
if [ -d "CTEXTests" ]; then
    mv CTEXTests AGCXTests
fi
if [ -d "CTEX.xcodeproj" ]; then
    mv CTEX.xcodeproj AGCX.xcodeproj
fi
if [ -d "CTEX.xcworkspace" ]; then
    mv CTEX.xcworkspace AGCX.xcworkspace
fi

# 2. Rename files inside AGCX.xcodeproj
if [ -f "AGCX.xcodeproj/xcshareddata/xcschemes/CTEX.xcscheme" ]; then
    mv AGCX.xcodeproj/xcshareddata/xcschemes/CTEX.xcscheme AGCX.xcodeproj/xcshareddata/xcschemes/AGCX.xcscheme
fi

# 3. Rename files inside AGCXTests
if [ -f "AGCXTests/CTEXTests.m" ]; then
    mv AGCXTests/CTEXTests.m AGCXTests/AGCXTests.m
fi

# 4. Search and replace CTEX with AGCX in files
find . -type f -name "*.pbxproj" -exec sed -i '' 's/CTEX/AGCX/g' {} +
find . -type f -name "*.xcscheme" -exec sed -i '' 's/CTEX/AGCX/g' {} +
find . -type f -name "Podfile" -exec sed -i '' 's/CTEX/AGCX/g' {} +
find . -type f -name "*.m" -exec sed -i '' 's/CTEX/AGCX/g' {} +
find . -type f -name "*.h" -exec sed -i '' 's/CTEX/AGCX/g' {} +

echo "Successfully renamed iOS project from CTEX to AGCX!"
