import sys

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    start_str = """      {/* Content panel */}
      <View style={[{ overflow: 'hidden', minHeight: 150 }, isFullScreen && { flex: 1 }]}>
        <Animated.View style={[{ flexDirection: 'row', width: slideWidth * currentTabs.length, transform: [{ translateX: pagerX }] }, isFullScreen && { flex: 1 }]}>
          {currentTabs.map((tab, idx) => {"""

    end_str = """          })}
        </Animated.View>"""

    if start_str not in content:
        print("Start string not found")
        return
    
    if end_str not in content:
        print("End string not found")
        return
    
    start_idx = content.find(start_str)
    end_idx = content.find(end_str) + len(end_str)
    
    body = content[start_idx + len(start_str):content.find(end_str)]
    
    new_content = """      {/* Content panel */}
      <View style={[{ overflow: 'hidden', minHeight: 150 }, isFullScreen && { flex: 1 }]}>
        <View style={[{ width: "100%" }, isFullScreen && { flex: 1 }]}>
          {currentTabs.map((tab, idx) => {
            if (tab.id !== activeTab) return null;""" + body + """          })}
        </View>"""
        
    final_content = content[:start_idx] + new_content + content[end_idx:]
    
    with open(filepath, 'w') as f:
        f.write(final_content)
    
    print("Successfully updated MarginHistorySection")

process_file('/Users/wrathcodetechnology/Desktop/Projects/AGCE/src/screens/spotScreen/MarginHistorySection.jsx')
