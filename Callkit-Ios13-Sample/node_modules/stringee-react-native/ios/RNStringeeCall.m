
#import "RNStringeeCall.h"
#import "RNStringeeInstanceManager.h"
#import <React/RCTLog.h>

static NSString *didChangeSignalingState    = @"didChangeSignalingState";
static NSString *didChangeMediaState        = @"didChangeMediaState";
static NSString *didReceiveLocalStream      = @"didReceiveLocalStream";
static NSString *didReceiveRemoteStream     = @"didReceiveRemoteStream";

static NSString *didReceiveDtmfDigit        = @"didReceiveDtmfDigit";
static NSString *didReceiveCallInfo         = @"didReceiveCallInfo";
static NSString *didHandleOnAnotherDevice   = @"didHandleOnAnotherDevice";


@implementation RNStringeeCall {
    NSMutableArray<NSString *> *jsEvents;
}

@synthesize bridge = _bridge;

RCT_EXPORT_MODULE();

- (instancetype)init {
    self = [super init];
    if (self) {
        [RNStringeeInstanceManager instance].rnCall = self;
        jsEvents = [[NSMutableArray alloc] init];
    }
    return self;
}

- (NSArray<NSString *> *)supportedEvents {
    return @[didChangeSignalingState,
             didChangeMediaState, 
             didReceiveLocalStream,
             didReceiveRemoteStream,
             didReceiveDtmfDigit,
             didReceiveCallInfo,
             didHandleOnAnotherDevice
             ];
}

+ (BOOL)requiresMainQueueSetup {
    return YES;
}

// TODO: - Publish Functions

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

RCT_EXPORT_METHOD(makeCall:(NSString *)parameters callback:(RCTResponseSenderBlock)callback) {
    
    NSError *jsonError;
    NSData *objectData = [parameters dataUsingEncoding:NSUTF8StringEncoding];
    NSDictionary *data = [NSJSONSerialization JSONObjectWithData:objectData
                                      options:NSJSONReadingMutableContainers 
                                        error:&jsonError];
    if (jsonError) {
        callback(@[@(NO), @(-4), @"The parameters format is invalid.", [NSNull null], [NSNull null]]);
    } else {
        NSString *from = data[@"from"];
        NSString *to = data[@"to"];
        NSNumber *isVideoCall = data[@"isVideoCall"];
        NSString *customData = data[@"customData"];
        NSString *videoResolution = data[@"videoResolution"];

        StringeeCall *outgoingCall = [[StringeeCall alloc] initWithStringeeClient:[RNStringeeInstanceManager instance].rnClient.client from:from to:to];
        outgoingCall.delegate = self;
        outgoingCall.isVideoCall = [isVideoCall boolValue];

        if (customData.length) {
            outgoingCall.customData = customData;
        }

        if ([videoResolution isEqualToString:@"NORMAL"]) {
            outgoingCall.videoResolution = VideoResolution_Normal;
        } else if ([videoResolution isEqualToString:@"HD"]) {
            outgoingCall.videoResolution = VideoResolution_HD;
        }

        __weak StringeeCall *weakCall = outgoingCall;
        __weak NSMutableDictionary *weakCalls = [RNStringeeInstanceManager instance].calls;

        [outgoingCall makeCallWithCompletionHandler:^(BOOL status, int code, NSString *message, NSString *data) {
            StringeeCall *strongCall = weakCall;
            NSMutableDictionary *strongCalls = weakCalls;
            if (status) {
                [strongCalls setObject:strongCall forKey:strongCall.callId]; 
            } 
            id returnCallId = strongCall.callId ? strongCall.callId : [NSNull null];
            id returnData = data ? data : [NSNull null];
            callback(@[@(status), @(code), message, returnCallId, returnData]);
        }];
    }
}

RCT_EXPORT_METHOD(initAnswer:(NSString *)callId callback:(RCTResponseSenderBlock)callback) {
    if ([RNStringeeInstanceManager instance].rnClient.client && [RNStringeeInstanceManager instance].rnClient.client.hasConnected) {
        if (callId.length) {
            StringeeCall *call = [[RNStringeeInstanceManager instance].calls objectForKey:callId];
            if (call) {
                call.delegate = self;
                [call initAnswerCall];
                callback(@[@(YES), @(0), @"Init answer call successfully."]);
            } else {
                callback(@[@(NO), @(-3), @"Init answer call failed. The call is not found."]);
            }
        } else {
            callback(@[@(NO), @(-2), @"Init answer call failed. The callId is invalid."]);
        }
    } else {
        callback(@[@(NO), @(-1), @"StringeeClient is not initialzied or connected."]);
    }
}

RCT_EXPORT_METHOD(answer:(NSString *)callId callback:(RCTResponseSenderBlock)callback) {
    if (callId.length) {
        StringeeCall *call = [[RNStringeeInstanceManager instance].calls objectForKey:callId];
        if (call) {
            [call answerCallWithCompletionHandler:^(BOOL status, int code, NSString *message) {
                callback(@[@(status), @(code), message]);
            }];
        } else {
            callback(@[@(NO), @(-3), @"Answer call failed. The call is not found."]);
        }
    } else {
        callback(@[@(NO), @(-2), @"Answer call failed. The callId is invalid."]);
    }
}

RCT_EXPORT_METHOD(hangup:(NSString *)callId callback:(RCTResponseSenderBlock)callback) {
    if (callId.length) {
        StringeeCall *call = [[RNStringeeInstanceManager instance].calls objectForKey:callId];
        if (call) {
            [call hangupWithCompletionHandler:^(BOOL status, int code, NSString *message) {
                callback(@[@(status), @(code), message]);
            }];
        } else {
            callback(@[@(NO), @(-3), @"Hangup call failed. The call is not found."]);
        }
    } else {
        callback(@[@(NO), @(-2), @"Hangup call failed. The callId is invalid."]);
    }
}

RCT_EXPORT_METHOD(reject:(NSString *)callId callback:(RCTResponseSenderBlock)callback) {
    if (callId.length) {
        StringeeCall *call = [[RNStringeeInstanceManager instance].calls objectForKey:callId];
        if (call) {
            [call rejectWithCompletionHandler:^(BOOL status, int code, NSString *message) {
                callback(@[@(status), @(code), message]);
            }];
        } else {
            callback(@[@(NO), @(-3), @"Reject call failed. The call is not found."]);
        }
    } else {
        callback(@[@(NO), @(-2), @"Reject call failed. The callId is invalid."]);
    }
}

RCT_EXPORT_METHOD(sendDTMF:(NSString *)callId dtmf:(NSString *)dtmf callback:(RCTResponseSenderBlock)callback) {
    if (callId.length) {
        StringeeCall *call = [[RNStringeeInstanceManager instance].calls objectForKey:callId];
        if (call) {
            NSArray *DTMF = @[@"0", @"1", @"2", @"3", @"4", @"5", @"6", @"7", @"8", @"9", @"*", @"#"];
            if ([DTMF containsObject:dtmf]) {

                CallDTMF dtmfParam;
        
                if ([dtmf isEqualToString:@"0"]) {
                    dtmfParam = CallDTMFZero;
                }
                else if ([dtmf isEqualToString:@"1"]) {
                    dtmfParam = CallDTMFOne;
                }
                else if ([dtmf isEqualToString:@"2"]) {
                    dtmfParam = CallDTMFTwo;
                }
                else if ([dtmf isEqualToString:@"3"]) {
                    dtmfParam = CallDTMFThree;
                }
                else if ([dtmf isEqualToString:@"4"]) {
                    dtmfParam = CallDTMFFour;
                }
                else if ([dtmf isEqualToString:@"5"]) {
                    dtmfParam = CallDTMFFive;
                }
                else if ([dtmf isEqualToString:@"6"]) {
                    dtmfParam = CallDTMFSix;
                }
                else if ([dtmf isEqualToString:@"7"]) {
                    dtmfParam = CallDTMFSeven;
                }
                else if ([dtmf isEqualToString:@"8"]) {
                    dtmfParam = CallDTMFEight;
                }
                else if ([dtmf isEqualToString:@"9"]) {
                    dtmfParam = CallDTMFNine;
                }
                else if ([dtmf isEqualToString:@"*"]) {
                    dtmfParam = CallDTMFStar;
                }
                else {
                    dtmfParam = CallDTMFPound;
                }

                [call sendDTMF:dtmfParam completionHandler:^(BOOL status, int code, NSString *message) {
                    if (status) {
                        callback(@[@(YES), @(0), @"Sends successfully"]);
                    } else {
                        callback(@[@(NO), @(-1), @"Failed to send. The client is not connected to Stringee Server."]);
                    }
                }];
            } else {
                callback(@[@(NO), @(-4), @"Failed to send. The dtmf is invalid."]);
            }
        } else {
            callback(@[@(NO), @(-3), @"Failed to send. The call is not found."]);
        }
    } else {
        callback(@[@(NO), @(-2), @"Failed to send. The callId is invalid."]);
    }
}

RCT_EXPORT_METHOD(sendCallInfo:(NSString *)callId callInfo:(NSString *)callInfo callback:(RCTResponseSenderBlock)callback) {
    if (callId.length) {
        StringeeCall *call = [[RNStringeeInstanceManager instance].calls objectForKey:callId];
        if (call) {

            NSError *jsonError;
            NSData *objectData = [callInfo dataUsingEncoding:NSUTF8StringEncoding];
            NSDictionary *data = [NSJSONSerialization JSONObjectWithData:objectData
                                                        options:NSJSONReadingMutableContainers 
                                                        error:&jsonError];

            if (jsonError) {
                callback(@[@(NO), @(-4), @"The call info format is invalid."]);
            } else {
                [call sendCallInfo:data completionHandler:^(BOOL status, int code, NSString *message) {
                    if (status) {
                        callback(@[@(YES), @(0), @"Sends successfully"]);
                    } else {
                        callback(@[@(NO), @(-1), @"Failed to send. The client is not connected to Stringee Server."]);
                    }
                }];
            }

        } else {
            callback(@[@(NO), @(-3), @"Failed to send. The call is not found"]);
        }
    } else {
        callback(@[@(NO), @(-2), @"Failed to send. The callId is invalid"]);
    }
}

RCT_EXPORT_METHOD(getCallStats:(NSString *)callId callback:(RCTResponseSenderBlock)callback) {
    if (![RNStringeeInstanceManager instance].rnClient.client || ![RNStringeeInstanceManager instance].rnClient.client.hasConnected) {
        callback(@[@(NO), @(-1), @"StringeeClient is not initialzied or connected.", @""]);
        return;
    }

    if (!callId.length) {
        callback(@[@(NO), @(-2), @"The call id is invalid.", @""]);
        return;
    }

    StringeeCall *call = [[RNStringeeInstanceManager instance].calls objectForKey:callId];

    if (!call) {
        callback(@[@(NO), @(-3), @"The call is not found.", @""]);
        return;
    }

    [call statsWithCompletionHandler:^(NSDictionary<NSString *,NSString *> *values) {
    NSData *jsonData = [NSJSONSerialization dataWithJSONObject:values
                                            options:NSJSONWritingPrettyPrinted
                                            error:nil];
    NSString *jsonString = [[[NSString alloc] initWithData:jsonData encoding:NSUTF8StringEncoding] stringByReplacingOccurrencesOfString:@" " withString:@""];
        callback(@[@(YES), @(0), @"Success", jsonString]);
    }];

}

RCT_EXPORT_METHOD(mute:(NSString *)callId mute:(BOOL)mute callback:(RCTResponseSenderBlock)callback) {

    if (!callId.length) {
        callback(@[@(NO), @(-2), @"The call id is invalid."]);
        return;
    }

    StringeeCall *call = [[RNStringeeInstanceManager instance].calls objectForKey:callId];

    if (!call) {
        callback(@[@(NO), @(-3), @"The call is not found."]);
        return;
    }

    [call mute:mute];
    callback(@[@(YES), @(0), @"Success"]);

}

RCT_EXPORT_METHOD(setSpeakerphoneOn:(NSString *)callId speaker:(BOOL)speaker callback:(RCTResponseSenderBlock)callback) {

    if (!callId.length) {
        callback(@[@(NO), @(-2), @"The call id is invalid."]);
        return;
    }

    StringeeCall *call = [[RNStringeeInstanceManager instance].calls objectForKey:callId];

    if (!call) {
        callback(@[@(NO), @(-3), @"The call is not found."]);
        return;
    }

    [[StringeeAudioManager instance] setLoudspeaker:speaker];
    callback(@[@(YES), @(0), @"Success"]);
}

RCT_EXPORT_METHOD(switchCamera:(NSString *)callId callback:(RCTResponseSenderBlock)callback) {

    if (!callId.length) {
        callback(@[@(NO), @(-2), @"The call id is invalid."]);
        return;
    }

    StringeeCall *call = [[RNStringeeInstanceManager instance].calls objectForKey:callId];

    if (!call) {
        callback(@[@(NO), @(-3), @"The call is not found."]);
        return;
    }

    dispatch_async(dispatch_get_main_queue(), ^{
        [call switchCamera];
    });
    callback(@[@(YES), @(0), @"Success"]);
}

RCT_EXPORT_METHOD(enableVideo:(NSString *)callId enableVideo:(BOOL)enableVideo callback:(RCTResponseSenderBlock)callback) {

    if (!callId.length) {
        callback(@[@(NO), @(-2), @"The call id is invalid."]);
        return;
    }

    StringeeCall *call = [[RNStringeeInstanceManager instance].calls objectForKey:callId];

    if (!call) {
        callback(@[@(NO), @(-3), @"The call is not found."]);
        return;
    }
    
    dispatch_async(dispatch_get_main_queue(), ^{
        [call enableLocalVideo:enableVideo];
    });
    callback(@[@(YES), @(0), @"Success"]);
}

- (void)didChangeSignalingState:(StringeeCall *)stringeeCall signalingState:(SignalingState)signalingState reason:(NSString *)reason sipCode:(int)sipCode sipReason:(NSString *)sipReason {
    
    if ([jsEvents containsObject:didChangeSignalingState]) {
        [self sendEventWithName:didChangeSignalingState body:@{ @"callId" : stringeeCall.callId, @"code" : @(signalingState), @"reason" : reason, @"sipCode" : @(sipCode), @"sipReason" : sipReason }];
    }
}

- (void)didChangeMediaState:(StringeeCall *)stringeeCall mediaState:(MediaState)mediaState {

    if ([jsEvents containsObject:didChangeMediaState]) {
        switch (mediaState) {
            case MediaStateConnected:
                [self sendEventWithName:didChangeMediaState body:@{ @"callId" : stringeeCall.callId, @"code" : @(0), @"description" : @"Connected" }];
                break;
            case MediaStateDisconnected:
                [self sendEventWithName:didChangeMediaState body:@{ @"callId" : stringeeCall.callId, @"code" : @(1), @"description" : @"Disconnected" }];
                break;
            default:
                break;
        }
    }

}

- (void)didReceiveLocalStream:(StringeeCall *)stringeeCall {
    if ([jsEvents containsObject:didReceiveLocalStream]) {
        [self sendEventWithName:didReceiveLocalStream body:@{ @"callId" : stringeeCall.callId }];
    }    
}

- (void)didReceiveRemoteStream:(StringeeCall *)stringeeCall {
    if ([jsEvents containsObject:didReceiveRemoteStream]) {
        [self sendEventWithName:didReceiveRemoteStream body:@{ @"callId" : stringeeCall.callId }];
    }
}

- (void)didReceiveDtmfDigit:(StringeeCall *)stringeeCall callDTMF:(CallDTMF)callDTMF {

    if ([jsEvents containsObject:didReceiveDtmfDigit]) {
        NSString * digit = @"";
        if ((long)callDTMF <= 9) {
            digit = [NSString stringWithFormat:@"%ld", (long)callDTMF];
        } else if (callDTMF == 10) {
            digit = @"*";
        } else if (callDTMF == 11) {
            digit = @"#";
        }

        [self sendEventWithName:didReceiveDtmfDigit body:@{ @"callId" : stringeeCall.callId, @"dtmf" : digit }];
    }

}

- (void)didReceiveCallInfo:(StringeeCall *)stringeeCall info:(NSDictionary *)info {
    if ([jsEvents containsObject:didReceiveCallInfo]) {
        NSData *jsonData = [NSJSONSerialization dataWithJSONObject:info
                                            options:NSJSONWritingPrettyPrinted
                                            error:nil];
        NSString *jsonString = [[[NSString alloc] initWithData:jsonData encoding:NSUTF8StringEncoding] stringByReplacingOccurrencesOfString:@" " withString:@""];
        [self sendEventWithName:didReceiveCallInfo body:@{ @"callId" : stringeeCall.callId, @"data" : jsonString }];
    }
}

- (void)didHandleOnAnotherDevice:(StringeeCall *)stringeeCall signalingState:(SignalingState)signalingState reason:(NSString *)reason sipCode:(int)sipCode sipReason:(NSString *)sipReason {
    
    if ([jsEvents containsObject:didHandleOnAnotherDevice]) {
        [self sendEventWithName:didHandleOnAnotherDevice body:@{ @"callId" : stringeeCall.callId, @"code" : @(signalingState), @"description" : reason }];
    }

}

- (void)addRenderToView:(UIView *)view callId:(NSString *)callId isLocal:(BOOL)isLocal {
    if (callId.length) {
        StringeeCall *call = [[RNStringeeInstanceManager instance].calls objectForKey:callId];
        if (call) {
            if (isLocal) {
                call.localVideoView.frame = CGRectMake(0, 0, view.bounds.size.width, view.bounds.size.height);
                [view addSubview:call.localVideoView];
            } else {
                call.remoteVideoView.frame = CGRectMake(0, 0, view.bounds.size.width, view.bounds.size.height);
                call.remoteVideoView.delegate = view;
                [view addSubview:call.remoteVideoView];
            }
        }
    }
}


@end
