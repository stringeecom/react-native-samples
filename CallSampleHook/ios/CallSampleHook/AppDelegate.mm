#import "AppDelegate.h"

#import <React/RCTBundleURLProvider.h>

#import <PushKit/PushKit.h>
#import <RNVoipPushNotificationManager.h>
#import "RNCallKeep.h"
#import "CustomPushPayload.h"
#import <RNStringee/RNStringeeInstanceManager.h>
@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  self.moduleName = @"CallSampleHook";
  // You can add your custom initial props in the dictionary below.
  // They will be passed down to the ViewController used by React Native.
  self.initialProps = @{};
  [RNCallKeep setup:@{
    @"appName": @"CallSampleHook",
    @"supportsVideo": @YES
  }];
  
  [RNVoipPushNotificationManager voipRegistration];
  return [super application:application didFinishLaunchingWithOptions:launchOptions];
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

// copy for config push stringee
- (void)pushRegistry:(PKPushRegistry *)registry didUpdatePushCredentials:(PKPushCredentials *)credentials forType:(PKPushType)type {
  // Register VoIP push token (a property of PKPushCredentials) with server
  [RNVoipPushNotificationManager didUpdatePushCredentials:credentials forType:(NSString *)type];
  NSLog(@"push token: %@, %@", credentials, type);
}

- (void)pushRegistry:(PKPushRegistry *)registry didReceiveIncomingPushWithPayload:(PKPushPayload *)payload forType:(PKPushType)type withCompletionHandler:(void (^)(void))completion {
  NSDictionary *payloadDataDic = payload.dictionaryPayload[@"data"][@"map"][@"data"][@"map"];
  NSLog(@"didReceiveIncomingPushWithPayload: %@", payload.dictionaryPayload);
  NSString *callId = payloadDataDic[@"callId"];
  NSNumber *serial = payloadDataDic[@"serial"];
  NSString *callStatus = payloadDataDic[@"callStatus"];

  NSString *fromAlias = payloadDataDic[@"from"][@"map"][@"alias"];
  NSString *fromNumber = payloadDataDic[@"from"][@"map"][@"number"];
  NSString *callName = fromAlias != NULL ? fromAlias : fromNumber != NULL ? fromNumber : @"Connecting...";

      
  NSMutableDictionary *dict = [[NSMutableDictionary alloc] init];
  if (serial == NULL) {
    serial = @(1);
  }
  
  if (callId == NULL) {
    callId = payloadDataDic[@"content"][@"map"][@"message"][@"map"][@"call_id"];
  }
  
  NSString *uuid = [RNStringeeInstanceManager.instance generateUUID:callId serial:serial];

  if (uuid.length == 0) {
    uuid = [[[NSUUID UUID] UUIDString] lowercaseString];
  }
  
  NSLog(@"info %@ %@ %@", uuid, serial, callId);
  
  [dict setObject:uuid forKey:@"uuid"];
  [dict setObject:serial forKey:@"serial"];
  [dict setObject:callId forKey:@"callId"];
  [dict setObject:callName forKey:@"callName"];
  
  NSLog(@"voip push from stringee ---------------------");

  if (callId != NULL && [callStatus isEqual: @"started"]) {
    // --- Process the received push
    CustomPushPayload* customPayload = [[CustomPushPayload alloc] init];
    customPayload.customDictionaryPayload = dict;
    
    [RNVoipPushNotificationManager didReceiveIncomingPushWithPayload:customPayload forType:type];
    CXCallObserver *callObs = [[CXCallObserver alloc] init];
    BOOL didShow = false;
    
    for (CXCall * call in callObs.calls) {
      if ([call.UUID.UUIDString.lowercaseString isEqualToString:uuid]) {
        didShow = true;
      }
    }
    if (!didShow) {
      [RNCallKeep reportNewIncomingCall:uuid handle:@"Stringee" handleType:@"generic" hasVideo:true localizedCallerName:callName supportsHolding:false supportsDTMF:true supportsGrouping:false supportsUngrouping:false fromPushKit:true payload:nil withCompletionHandler:completion];
    }
  } else {
    // Show fake call
    NSLog(@"show fake call");
    [RNCallKeep reportNewIncomingCall:uuid handle:@"Stringee" handleType:@"generic" hasVideo:true localizedCallerName:callName supportsHolding:false supportsDTMF:true supportsGrouping:false supportsUngrouping:false fromPushKit:true payload:nil withCompletionHandler:completion];
    [RNCallKeep endCallWithUUID:uuid reason:1];
  }
}

- (void)applicationWillEnterForeground:(UIApplication *)application {
  [self endBackgroundTask];
}

- (void)applicationDidEnterBackground:(UIApplication *)application {
  [self extendBackgroundRunningTime];
}

- (void)endBackgroundTask {
  if (self.backgroundUpdateTask != UIBackgroundTaskInvalid) {
    [[UIApplication sharedApplication] endBackgroundTask:self.backgroundUpdateTask];
    self.backgroundUpdateTask = UIBackgroundTaskInvalid;
  }
}

- (void)extendBackgroundRunningTime {
  if (self.backgroundUpdateTask != UIBackgroundTaskInvalid) {
    return;
  }

  self.backgroundUpdateTask = [[UIApplication sharedApplication] beginBackgroundTaskWithName:@"extendBackgroundRunningTimeForCallKit" expirationHandler:^{
    [self endBackgroundTask];
  }];

  dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
    [NSThread sleepForTimeInterval:10];
    [[UIApplication sharedApplication] endBackgroundTask:self.backgroundUpdateTask];
    self.backgroundUpdateTask = UIBackgroundTaskInvalid;
  });
}

// end copy



@end
