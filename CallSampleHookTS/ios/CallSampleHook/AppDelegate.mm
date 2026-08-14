#import "AppDelegate.h"

#import <React/RCTBundleURLProvider.h>

#import <PushKit/PushKit.h>
#import <RNVoipPushNotificationManager.h>
#import "RNCallKeep.h"
#import "CustomPushPayload.h"
#import <RNStringee/RNStringeeInstanceManager.h>

static NSDictionary *StringeeDictionary(id value) {
  return [value isKindOfClass:[NSDictionary class]] ? value : @{};
}

static NSString *StringeeString(id value) {
  return [value isKindOfClass:[NSString class]] ? value : @"";
}

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  self.moduleName = @"CallSampleHookTS";
  // You can add your custom initial props in the dictionary below.
  // They will be passed down to the ViewController used by React Native.
  self.initialProps = @{};
  self.backgroundUpdateTask = UIBackgroundTaskInvalid;
  [RNCallKeep setup:@{
    @"appName": @"CallSampleHookTS",
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
  NSDictionary *data = StringeeDictionary(payload.dictionaryPayload[@"data"]);
  NSDictionary *dataMap = StringeeDictionary(data[@"map"]);
  NSDictionary *nestedData = StringeeDictionary(dataMap[@"data"]);
  NSDictionary *payloadDataDic = StringeeDictionary(nestedData[@"map"]);
  NSLog(@"didReceiveIncomingPushWithPayload: %@", payload.dictionaryPayload);
  NSString *callId = StringeeString(payloadDataDic[@"callId"]);
  id serialValue = payloadDataDic[@"serial"];
  NSNumber *serial = [serialValue respondsToSelector:@selector(integerValue)]
    ? @([serialValue integerValue])
    : @(1);
  NSString *callStatus = StringeeString(payloadDataDic[@"callStatus"]);
  id isVideoCall = payloadDataDic[@"isVideoCall"];

  NSDictionary *from = StringeeDictionary(payloadDataDic[@"from"]);
  NSDictionary *fromMap = StringeeDictionary(from[@"map"]);
  NSString *fromAlias = StringeeString(fromMap[@"alias"]);
  NSString *fromNumber = StringeeString(fromMap[@"number"]);
  NSString *callName = fromAlias.length > 0 ? fromAlias : fromNumber.length > 0 ? fromNumber : @"Connecting...";
  BOOL hasVideo = [isVideoCall respondsToSelector:@selector(boolValue)]
    ? [isVideoCall boolValue]
    : NO;


  NSMutableDictionary *dict = [[NSMutableDictionary alloc] init];
  if (callId.length == 0) {
    NSDictionary *content = StringeeDictionary(payloadDataDic[@"content"]);
    NSDictionary *contentMap = StringeeDictionary(content[@"map"]);
    NSDictionary *message = StringeeDictionary(contentMap[@"message"]);
    NSDictionary *messageMap = StringeeDictionary(message[@"map"]);
    callId = StringeeString(messageMap[@"call_id"]);
  }

  NSString *uuid = callId.length > 0
    ? [RNStringeeInstanceManager.instance generateUUID:callId serial:serial]
    : nil;

  if (uuid.length == 0) {
    uuid = [[[NSUUID UUID] UUIDString] lowercaseString];
  }

  NSLog(@"info %@ %@ %@", uuid, serial, callId);

  [dict setObject:uuid forKey:@"uuid"];
  [dict setObject:serial forKey:@"serial"];
  if (callId.length > 0) {
    [dict setObject:callId forKey:@"callId"];
  }
  [dict setObject:callName forKey:@"callName"];

  NSLog(@"voip push from stringee ---------------------");

  if (callId.length > 0 && [callStatus isEqual: @"started"]) {
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
      [RNCallKeep reportNewIncomingCall:uuid handle:@"Stringee" handleType:@"generic" hasVideo:hasVideo localizedCallerName:callName supportsHolding:false supportsDTMF:true supportsGrouping:false supportsUngrouping:false fromPushKit:true payload:nil withCompletionHandler:completion];
    } else {
      completion();
    }
  } else {
    // Show fake call
    NSLog(@"show fake call");
    [RNCallKeep reportNewIncomingCall:uuid handle:@"Stringee" handleType:@"generic" hasVideo:hasVideo localizedCallerName:callName supportsHolding:false supportsDTMF:true supportsGrouping:false supportsUngrouping:false fromPushKit:true payload:nil withCompletionHandler:completion];
    [RNCallKeep endCallWithUUID:uuid reason:1];
  }
}

- (void)pushRegistry:(PKPushRegistry *)registry didInvalidatePushTokenForType:(PKPushType)type {
  NSLog(@"VoIP push token was invalidated for type: %@", type);
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
    dispatch_async(dispatch_get_main_queue(), ^{
      [self endBackgroundTask];
    });
  });
}

// end copy



@end
