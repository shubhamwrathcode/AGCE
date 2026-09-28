#import "AppDelegate.h"

#import <React/RCTBundleURLProvider.h>
#import <React/RCTRootView.h>
#import <ReactAppDependencyProvider/RCTAppDependencyProvider.h>
#import <GoogleSignIn/GoogleSignIn.h>

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application
    didFinishLaunchingWithOptions:(NSDictionary *)launchOptions {
  self.moduleName = @"AGCX";
  self.dependencyProvider = [RCTAppDependencyProvider new];
  self.initialProps = @{};

  return [super application:application
      didFinishLaunchingWithOptions:launchOptions];
}

- (BOOL)application:(UIApplication *)application
            openURL:(NSURL *)url
            options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options {
  if ([GIDSignIn.sharedInstance handleURL:url]) {
    return YES;
  }
  return [super application:application openURL:url options:options];
}

- (void)customizeRootView:(RCTRootView *)rootView {
  // Same as LaunchScreen.storyboard / splash video background, so there is no white
  // flash between the launch screen and the first JS render.
  rootView.backgroundColor = [UIColor colorWithRed:23.0 / 255.0
                                             green:28.0 / 255.0
                                              blue:34.0 / 255.0
                                             alpha:1.0];
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge {
  return [self bundleURL];
}

- (NSURL *)bundleURL {
#if DEBUG
  return
      [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
#else
  return [[NSBundle mainBundle] URLForResource:@"main"
                                 withExtension:@"jsbundle"];
#endif
}

@end