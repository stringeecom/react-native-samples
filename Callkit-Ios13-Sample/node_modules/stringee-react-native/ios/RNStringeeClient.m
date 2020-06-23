
#import "RNStringeeClient.h"
#import "RNStringeeInstanceManager.h"
#import <React/RCTLog.h>

// Connect
static NSString *didConnect               = @"didConnect";
static NSString *didDisConnect            = @"didDisConnect";
static NSString *didFailWithError         = @"didFailWithError";
static NSString *requestAccessToken       = @"requestAccessToken";

// Call 1-1
static NSString *incomingCall               = @"incomingCall";
static NSString *didReceiveCustomMessage    = @"didReceiveCustomMessage";


@implementation RNStringeeClient {
    NSMutableArray<NSString *> *jsEvents;
    BOOL isConnecting;
}

@synthesize bridge = _bridge;

RCT_EXPORT_MODULE();

- (instancetype)init {
    self = [super init];
    [RNStringeeInstanceManager instance].rnClient = self;
    jsEvents = [[NSMutableArray alloc] init];
    return self;
}

- (NSArray<NSString *> *)supportedEvents {
    return @[didConnect,
             didDisConnect,
             didFailWithError,
             requestAccessToken,
             incomingCall,
             didReceiveCustomMessage
             ];
}

+ (BOOL)requiresMainQueueSetup {
    return YES;
}

RCT_EXPORT_METHOD(setNativeEvent:(NSString *)event) {
    [jsEvents addObject:event];
}

RCT_EXPORT_METHOD(removeNativeEvent:(NSString *)event) {
    int index = -1;
    index = (int)[jsEvents indexOfObject:event];
    if (index >= 0) {
        [jsEvents removeObjectAtIndex:index];
    }
}

RCT_EXPORT_METHOD(connect:(NSString *)accessToken) {
    if (isConnecting) {
        return;
    }
    isConnecting = YES;
    if (!_client) {
        _client = [[StringeeClient alloc] initWithConnectionDelegate:self];
        _client.incomingCallDelegate = self;
    }
    [_client connectWithAccessToken:accessToken];
}

RCT_EXPORT_METHOD(disconnect) {
    if (_client) {
        [_client disconnect];
    }
    isConnecting = NO;
}

RCT_EXPORT_METHOD(registerPushForDeviceToken:(NSString *)deviceToken isProduction:(BOOL)isProduction isVoip:(BOOL)isVoip callback:(RCTResponseSenderBlock)callback) {
    if (!_client || !_client.hasConnected) {
        callback(@[@(NO), @(-1), @"StringeeClient is not initialized or connected."]);
        return;
    }

    [_client registerPushForDeviceToken:deviceToken isProduction:isProduction isVoip:isVoip completionHandler:^(BOOL status, int code, NSString *message) {
        callback(@[@(status), @(code), message]);
    }];

}

RCT_EXPORT_METHOD(unregisterPushToken:(NSString *)deviceToken callback:(RCTResponseSenderBlock)callback) {

    if (!_client || !_client.hasConnected) {
        callback(@[@(NO), @(-1), @"StringeeClient is not initialized or connected."]);
        return;
    } 

    [_client unregisterPushForDeviceToken:deviceToken completionHandler:^(BOOL status, int code, NSString *message) {
        callback(@[@(status), @(code), message]);
    }];
    
}

RCT_EXPORT_METHOD(sendCustomMessage:(NSString *)userId message:(NSString *)message callback:(RCTResponseSenderBlock)callback) {
    
    if (!_client || !_client.hasConnected) {
        callback(@[@(NO), @(-1), @"StringeeClient is not initialized or connected."]);
        return;
    }

    if (!message) {
        callback(@[@(NO), @(-3), @"Message can not be nil."]);
        return;
    }
    
    NSError *jsonError;
    NSData *objectData = [message dataUsingEncoding:NSUTF8StringEncoding];
    NSDictionary *data = [NSJSONSerialization JSONObjectWithData:objectData
                                                         options:NSJSONReadingMutableContainers
                                                           error:&jsonError];
    
    if (jsonError) {
        callback(@[@(NO), @(-4), @"Message format is invalid."]);
        return;
    }
    
    [_client sendCustomMessage:data toUserId:userId completionHandler:^(BOOL status, int code, NSString *message) {
        callback(@[@(status), @(code), message]);
    }];
}

// Connect
- (void)requestAccessToken:(StringeeClient *)stringeeClient {
    isConnecting = NO;
    [self sendEventWithName:requestAccessToken body:@{ @"userId" : stringeeClient.userId }];
}

- (void)didConnect:(StringeeClient *)stringeeClient isReconnecting:(BOOL)isReconnecting {
    if ([jsEvents containsObject:didConnect]) {
        [self sendEventWithName:didConnect body:@{ @"userId" : stringeeClient.userId, @"projectId" : stringeeClient.projectId, @"isReconnecting" : @(isReconnecting) }];
    }
}

- (void)didDisConnect:(StringeeClient *)stringeeClient isReconnecting:(BOOL)isReconnecting {
    if ([jsEvents containsObject:didDisConnect]) {
        [self sendEventWithName:didDisConnect body:@{ @"userId" : stringeeClient.userId, @"projectId" : stringeeClient.projectId, @"isReconnecting" : @(isReconnecting) }];
    }
}

- (void)didFailWithError:(StringeeClient *)stringeeClient code:(int)code message:(NSString *)message {
    if ([jsEvents containsObject:didFailWithError]) {
        [self sendEventWithName:didFailWithError body:@{ @"userId" : stringeeClient.userId, @"code" : @(code), @"message" : message }];
    }
}

- (void)didReceiveCustomMessage:(StringeeClient *)stringeeClient message:(NSDictionary *)message fromUserId:(NSString *)userId {
    if ([jsEvents containsObject:didReceiveCustomMessage]) {
        [self sendEventWithName:didReceiveCustomMessage body:@{ @"fromUserId" : userId, @"message" : message }];
    }
}

// Call
- (void)incomingCallWithStringeeClient:(StringeeClient *)stringeeClient stringeeCall:(StringeeCall *)stringeeCall {
    if (stringeeCall.callId) {
        [[RNStringeeInstanceManager instance].calls setObject:stringeeCall forKey:stringeeCall.callId];
    }

    if ([jsEvents containsObject:incomingCall]) {

        int index = 0;

        if (stringeeCall.callType == CallTypeCallIn) {
            // Phone-to-app
            index = 3;
        } else if (stringeeCall.callType == CallTypeCallOut) {
            // App-to-phone
            index = 2;
        } else if (stringeeCall.callType == CallTypeInternalIncomingCall) {
            // App-to-app-incoming-call
            index = 1;
        } else {
            // App-to-app-outgoing-call
            index = 0;
        }
        
        id returnUserId = stringeeClient.userId ? stringeeClient.userId : [NSNull null];
        id returnCallId = stringeeCall.callId ? stringeeCall.callId : [NSNull null];
        id returnFrom = stringeeCall.from ? stringeeCall.from : [NSNull null];
        id returnTo = stringeeCall.to ? stringeeCall.to : [NSNull null];
        id returnFromAlias = stringeeCall.fromAlias ? stringeeCall.fromAlias : [NSNull null];
        id returnToAlias = stringeeCall.toAlias ? stringeeCall.toAlias : [NSNull null];
        id returnCustomData = stringeeCall.customDataFromYourServer ? stringeeCall.customDataFromYourServer : [NSNull null];

        [self sendEventWithName:incomingCall body:@{ @"userId" : returnUserId, @"callId" : returnCallId, @"from" : returnFrom, @"to" : returnTo, @"fromAlias" : returnFromAlias, @"toAlias" : returnToAlias, @"callType" : @(index), @"isVideoCall" : @(stringeeCall.isVideoCall), @"customDataFromYourServer" : returnCustomData}];
    }
    
}



@end
