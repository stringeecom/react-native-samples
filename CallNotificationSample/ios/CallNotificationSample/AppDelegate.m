#import "AppDelegate.h"

#import <React/RCTBridge.h>
#import <React/RCTBundleURLProvider.h>
#import <React/RCTRootView.h>

#ifdef FB_SONARKIT_ENABLED
#import <FlipperKit/FlipperClient.h>
#import <FlipperKitLayoutPlugin/FlipperKitLayoutPlugin.h>
#import <FlipperKitUserDefaultsPlugin/FKUserDefaultsPlugin.h>
#import <FlipperKitNetworkPlugin/FlipperKitNetworkPlugin.h>
#import <SKIOSNetworkPlugin/SKIOSNetworkAdapter.h>
#import <FlipperKitReactPlugin/FlipperKitReactPlugin.h>

#import <PushKit/PushKit.h>                    /* <------ add this line */
#import "RNVoipPushNotificationManager.h"      /* <------ add this line */
#import "RNCallKeep.h"
#import "CustomPushPayload.h"

static void InitializeFlipper(UIApplication *application) {
  FlipperClient *client = [FlipperClient sharedClient];
  SKDescriptorMapper *layoutDescriptorMapper = [[SKDescriptorMapper alloc] initWithDefaults];
  [client addPlugin:[[FlipperKitLayoutPlugin alloc] initWithRootNode:application withDescriptorMapper:layoutDescriptorMapper]];
  [client addPlugin:[[FKUserDefaultsPlugin alloc] initWithSuiteName:nil]];
  [client addPlugin:[FlipperKitReactPlugin new]];
  [client addPlugin:[[FlipperKitNetworkPlugin alloc] initWithNetworkAdapter:[SKIOSNetworkAdapter new]]];
  [client start];
}
#endif

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
#ifdef FB_SONARKIT_ENABLED
  InitializeFlipper(application);
#endif

  RCTBridge *bridge = [[RCTBridge alloc] initWithDelegate:self launchOptions:launchOptions];
  RCTRootView *rootView = [[RCTRootView alloc] initWithBridge:bridge
                                                   moduleName:@"CallNotificationSample"
                                            initialProperties:nil];

  if (@available(iOS 13.0, *)) {
      rootView.backgroundColor = [UIColor systemBackgroundColor];
  } else {
      rootView.backgroundColor = [UIColor whiteColor];
  }

  self.window = [[UIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];
  UIViewController *rootViewController = [UIViewController new];
  rootViewController.view = rootView;
  self.window.rootViewController = rootViewController;
  [self.window makeKeyAndVisible];
  return YES;
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
#if DEBUG
 return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index" fallbackResource:nil];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

/* Add PushKit delegate method */

// --- Handle updated push credentials
- (void)pushRegistry:(PKPushRegistry *)registry didUpdatePushCredentials:(PKPushCredentials *)credentials forType:(PKPushType)type {
  // Register VoIP push token (a property of PKPushCredentials) with server
  [RNVoipPushNotificationManager didUpdatePushCredentials:credentials forType:(NSString *)type];
}

// --- Handle incoming pushes (for ios <= 10)
- (void)pushRegistry:(PKPushRegistry *)registry didReceiveIncomingPushWithPayload:(PKPushPayload *)payload forType:(PKPushType)type {
  [self pushRegistry:registry didReceiveIncomingPushWithPayload:payload forType:type withCompletionHandler:nil];
}

// --- Handle incoming pushes (for ios >= 11)
- (void)pushRegistry:(PKPushRegistry *)registry didReceiveIncomingPushWithPayload:(PKPushPayload *)payload forType:(PKPushType)type withCompletionHandler:(void (^)(void))completion {
  NSLog(@"didReceiveIncomingPushWithPayload: %@", payload.dictionaryPayload);

  NSDictionary *payloadDataDic = payload.dictionaryPayload[@"data"][@"map"][@"data"][@"map"];
  NSString *callId = payloadDataDic[@"callId"];
  NSNumber *serial = payloadDataDic[@"serial"];
  NSString *callStatus = payloadDataDic[@"callStatus"];

  NSString *fromAlias = payloadDataDic[@"from"][@"map"][@"alias"];
  NSString *fromNumber = payloadDataDic[@"from"][@"map"][@"number"];
  NSString *callName = fromAlias != NULL ? fromAlias : fromNumber != NULL ? fromNumber : @"Connecting...";

  NSString *uuid = [[[NSUUID UUID] UUIDString] lowercaseString];
  NSMutableDictionary *dict = [[NSMutableDictionary alloc] init];
  [dict setObject:uuid forKey:@"uuid"];
  [dict setObject:serial forKey:@"serial"];
  [dict setObject:callId forKey:@"callId"];

  if (callId != NULL && [callStatus isEqual: @"started"]) {
    // --- Process the received push
    CustomPushPayload *customPayload = [[CustomPushPayload alloc] init];
    customPayload.customDictionaryPayload = dict;
    [RNVoipPushNotificationManager didReceiveIncomingPushWithPayload:customPayload forType:type];

    // --- You should make sure to report to callkit BEFORE execute `completion()`
    [RNCallKeep reportNewIncomingCall:uuid handle:@"Stringee" handleType:@"generic" hasVideo:true localizedCallerName:callName supportsHolding:false supportsDTMF:true supportsGrouping:false supportsUngrouping:false fromPushKit:true payload:nil withCompletionHandler:nil];
  } else {
    // Show fake call
    [RNCallKeep reportNewIncomingCall:uuid handle:@"Stringee" handleType:@"generic" hasVideo:true localizedCallerName:callName supportsHolding:false supportsDTMF:true supportsGrouping:false supportsUngrouping:false fromPushKit:true payload:nil withCompletionHandler:nil];
    [RNCallKeep endCallWithUUID:uuid reason:1];
  }

  if (completion != nil) {
    completion();
  }
}

@end
