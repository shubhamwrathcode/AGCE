import sys

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    start_str = """                      <TabView
                        lazy
                        navigationState={{ index: innerIndex, routes: innerRoutes }}
                        onIndexChange={setInnerIndex}
                        initialLayout={{ width: layout.width }}
                        swipeEnabled
                        renderTabBar={() => ("""

    end_str = """                          );
                        }}
                      />"""

    if start_str not in content:
        print("Start string not found")
        return
    
    if end_str not in content:
        print("End string not found")
        return
    
    start_idx = content.find(start_str)
    
    # Find the end of renderTabBar body
    mid_str = """                        )}
                        renderScene={({ route: innerRoute }) => {
                          if (innerRoute.key === "crypto") {"""
    
    if mid_str not in content:
        print("Mid string not found")
        return
    
    mid_idx = content.find(mid_str)
    
    end_idx = content.find(end_str) + len(end_str)
    
    part1 = content[:start_idx]
    tab_bar_content = content[start_idx + len(start_str):mid_idx]
    scene_content = content[mid_idx + len(mid_str):end_idx - len(end_str)]
    
    # We need to split scene_content into crypto and account parts
    crypto_end = """                            );
                          }

                          return ("""
    
    crypto_idx = scene_content.find(crypto_end)
    
    crypto_content = scene_content[:crypto_idx]
    account_content = scene_content[crypto_idx + len(crypto_end):]
    
    new_content = f"""                      <View>
{tab_bar_content}
                        {{innerIndex === 0 ? (
{crypto_content}
                            ) : (
{account_content}
                            )
                        }}
                      </View>"""
                      
    final_content = part1 + new_content + content[end_idx:]
    
    with open(filepath, 'w') as f:
        f.write(final_content)
    
    print("Successfully updated")

process_file('/Users/wrathcodetechnology/Desktop/Projects/AGCE/src/screens/wallet/WalletNew.js')
