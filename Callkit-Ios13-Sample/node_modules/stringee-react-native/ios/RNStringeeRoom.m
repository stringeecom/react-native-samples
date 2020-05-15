
#import "RNStringeeRoom.h"
#import "RNStringeeInstanceManager.h"
#import <React/RCTLog.h>

static NSString *didRoomConnect           = @"didRoomConnect";
static NSString *didRoomDisConnect        = @"didRoomDisConnect";
static NSString *didRoomError             = @"didRoomError";

static NSString *didStreamAdd             = @"didStreamAdd";
static NSString *didStreamRemove          = @"didStreamRemove";

@implementation RNStringeeRoom {
    NSMutableArray<NSString *> *jsEvents;
    
    StringeeRoomStream *localStream;
    NSMutableDictionary *remoteStreams;
    
    RCTResponseSenderBlock publishCallback;
    RCTResponseSenderBlock unPublishCallback;
    RCTResponseSenderBlock subscribeCallback;
    RCTResponseSenderBlock unSubscribeCallback;
    
    BOOL hasChangedSpeakerPhone;
    BOOL isSpeaker;
}

@synthesize bridge = _bridge;

RCT_EXPORT_MODULE();

- (instancetype)init {
    self = [super init];
    if (self) {
        [RNStringeeInstanceManager instance].rnRoom = self;
        jsEvents = [[NSMutableArray alloc] init];
        _rooms = [[NSMutableDictionary alloc] init];
        remoteStreams = [[NSMutableDictionary alloc] init];
        isSpeaker = YES;
    }
    return self;
}

- (NSArray<NSString *> *)supportedEvents {
    return @[didRoomConnect,
             didRoomDisConnect, 
             didRoomError,
             didStreamAdd,
             didStreamRemove
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

RCT_EXPORT_METHOD(makeRoom:(RCTResponseSenderBlock)callback) {
    
    StringeeRoom *room = [[StringeeRoom alloc] initWithStringeeClient:[RNStringeeInstanceManager instance].rnClient.client];
    room.delegate = self;
    
    RNStringeeRoom *weakself = self;

    [room makeRoomWithCompletionHandler:^(BOOL status, int code, NSString *message) {
        
        RNStringeeRoom *strongself = weakself;

        id roomId = (room.roomId != 0) ? [NSNumber numberWithLongLong:room.roomId] : [NSNull null];

        if (status) {
            [strongself.rooms setObject:room forKey:[self keyForLongValue:room.roomId]];
        }
        
        int returnCode;
        if (code == 2) {
            // not connected
            returnCode = -1;
        } else if (code == 3) {
            // generic
            returnCode = -2;
        } else {
            returnCode = code;
        }
        callback(@[@(status), @(returnCode), message, roomId]);
    }];
}

RCT_EXPORT_METHOD(joinRoom:(nonnull NSNumber *)roomId callback:(RCTResponseSenderBlock)callback) {

    if ([roomId longLongValue] == 0) {
        callback(@[@(NO), @(-3), @"RoomId is invalid."]);
        return;
    }

    StringeeRoom *room = [[StringeeRoom alloc] initWithStringeeClient:[RNStringeeInstanceManager instance].rnClient.client];
    room.delegate = self;
    
    RNStringeeRoom *weakself = self;
    
    long long lRoomId = [roomId longLongValue];

    [room joinRoomWithRoomId:lRoomId completionHandler:^(BOOL status, int code, NSString *message) {
        
        RNStringeeRoom *strongself = weakself;
        
        if (status) {
            [strongself.rooms setObject:room forKey:[self keyForLongValue:room.roomId]];
        }
        
        int returnCode;
        if (code == 2) {
            // not connected
            returnCode = -1;
        } else if (code == 3) {
            // generic
            returnCode = -2;
        } else {
            returnCode = code;
        }
        callback(@[@(status), @(returnCode), message]);
    }];
}

RCT_EXPORT_METHOD(publishLocalStream:(nonnull NSNumber *)roomId config:(NSString *)config callback:(RCTResponseSenderBlock)callback) {
    
    if ([roomId longLongValue] == 0) {
        callback(@[@(NO), @(-1), @"RoomId is invalid."]);
        return;
    }
    
    StringeeRoom *targetRoom = [_rooms objectForKey:[self keyForLongValue:[roomId longLongValue]]];

    // Kiem tra current room
    if (!targetRoom) {
        callback(@[@(NO), @(-2), @"Room is not found."]);
        return;
    }

    // Check config format
    NSError *jsonError;
    NSData *objectData = [config dataUsingEncoding:NSUTF8StringEncoding];
    NSDictionary *data = [NSJSONSerialization JSONObjectWithData:objectData
                                      options:NSJSONReadingMutableContainers 
                                        error:&jsonError];

    NSString *videoResolution;
    if (jsonError) {
        RCTLogInfo(@"The config format is invalid. Using default config");
    } else {
        videoResolution = data[@"videoResolution"];
    }

    // Kkoi tao local stream neu chua co
    if (!localStream) {
        StringeeRoomStreamConfig *config = [[StringeeRoomStreamConfig alloc] init];
        if ([videoResolution isEqualToString:@"HD"]) {
            config.streamVideoResolution = VideoResolution_HD;
        }
        localStream = [[StringeeRoomStream alloc] initLocalStreamWithConfig:config];
    }
    publishCallback = [callback copy];
    [targetRoom publish:localStream];
}

RCT_EXPORT_METHOD(unPublishLocalStream:(nonnull NSNumber *)roomId streamId:(NSString *)streamId callback:(RCTResponseSenderBlock)callback) {
    
    if ([roomId longLongValue] == 0) {
        callback(@[@(NO), @(-1), @"RoomId is invalid."]);
        return;
    }
    
    StringeeRoom *targetRoom = [_rooms objectForKey:[self keyForLongValue:[roomId longLongValue]]];
    
    // Kiem tra current room
    if (!targetRoom) {
        callback(@[@(NO), @(-2), @"Room is not found."]);
        return;
    }

    if (!streamId.length) {
        callback(@[@(NO), @(-3), @"StreamId is invalid."]);
        return;
    }
    
    if (!localStream) {
        callback(@[@(YES), @(-4), @"Stream is not found."]);
    }
    
    unPublishCallback = [callback copy];
    [targetRoom unPublish:localStream];
}

RCT_EXPORT_METHOD(unSubscribe:(nonnull NSNumber *)roomId streamId:(NSString *)streamId callback:(RCTResponseSenderBlock)callback) {
    
    if ([roomId longLongValue] == 0) {
        callback(@[@(NO), @(-1), @"RoomId is invalid."]);
        return;
    }
    
    StringeeRoom *targetRoom = [_rooms objectForKey:[self keyForLongValue:[roomId longLongValue]]];
    
    // Kiem tra current room
    if (!targetRoom) {
        callback(@[@(NO), @(-2), @"Room is not found."]);
        return;
    }
    
    if (!streamId.length) {
        callback(@[@(NO), @(-3), @"StreamId is invalid."]);
        return;
    }
    
    StringeeRoomStream *targetStream = [remoteStreams objectForKey:streamId];
    
    if (!targetStream) {
        callback(@[@(NO), @(-4), @"Stream is not found."]);
        return;
    }
    
    unSubscribeCallback = [callback copy];
    [targetRoom unSubscribe:targetStream];
}

RCT_EXPORT_METHOD(subscribe:(nonnull NSNumber *)roomId streamId:(NSString *)streamId callback:(RCTResponseSenderBlock)callback) {
    
    if ([roomId longLongValue] == 0) {
        callback(@[@(NO), @(-1), @"RoomId is invalid."]);
        return;
    }
    
    StringeeRoom *targetRoom = [_rooms objectForKey:[self keyForLongValue:[roomId longLongValue]]];
    
    // Kiem tra current room
    if (!targetRoom) {
        callback(@[@(NO), @(-2), @"Room is not found."]);
        return;
    }
    
    if (!streamId.length) {
        callback(@[@(NO), @(-3), @"StreamId is invalid."]);
        return;
    }
    
    StringeeRoomStream *targetStream = [remoteStreams objectForKey:streamId];
    
    if (!targetStream) {
        callback(@[@(NO), @(-4), @"Stream is not found."]);
        return;
    }
    
    subscribeCallback = [callback copy];
    [targetRoom subscribe:targetStream];
}

RCT_EXPORT_METHOD(destroy:(nonnull NSNumber *)roomId callback:(RCTResponseSenderBlock)callback) {
    
    if ([roomId longLongValue] == 0) {
        callback(@[@(NO), @(-2), @"RoomId is invalid."]);
        return;
    }
    
    StringeeRoom *targetRoom = [_rooms objectForKey:[self keyForLongValue:[roomId longLongValue]]];
    
    // Kiem tra current room
    if (!targetRoom) {
        callback(@[@(NO), @(-3), @"Room is not found."]);
        return;
    }
    
    // Remove render view
    if (localStream.localVideoView.superview) {
        [localStream.localVideoView removeFromSuperview];
    }
    
    // Terminate room and release objects
    [targetRoom destroy];
    [_rooms removeObjectForKey:roomId];
    targetRoom = nil;
    
    localStream = nil;
    [remoteStreams removeAllObjects];
    hasChangedSpeakerPhone = NO;
    isSpeaker = YES;
    
    callback(@[@(YES), @(0), @"Success"]);

}

RCT_EXPORT_METHOD(switchCamera) {
    [localStream switchCamera];
}

RCT_EXPORT_METHOD(mute:(BOOL)mute) {
    [localStream mute:mute];
}

RCT_EXPORT_METHOD(turnOnCamera:(BOOL)isOn callback:(RCTResponseSenderBlock)callback) {
    if (!localStream) {
        callback(@[@(NO), @(-1), @"Local stream is not found."]);
    }
    
    [localStream turnOnCamera:isOn];
    callback(@[@(YES), @(0), @"Success."]);
}

RCT_EXPORT_METHOD(getStats:(nonnull NSNumber *)roomId streamId:(NSString *)streamId useVideoTrack:(BOOL)useVideoTrack callback:(RCTResponseSenderBlock)callback) {
    
    if ([roomId longLongValue] == 0) {
        callback(@[@(NO), @(-1), @"RoomId is invalid."]);
        return;
    }
    
    StringeeRoom *targetRoom = [_rooms objectForKey:[self keyForLongValue:[roomId longLongValue]]];
    
    // Kiem tra current room
    if (!targetRoom) {
        callback(@[@(NO), @(-2), @"Room is not found."]);
        return;
    }
    
    if (!streamId.length) {
        callback(@[@(NO), @(-3), @"StreamId is invalid."]);
        return;
    }
    
    StringeeRoomStream *targetStream;
    if ([streamId isEqualToString:localStream.streamId]) {
        targetStream = localStream;
    } else {
        targetStream = [remoteStreams objectForKey:streamId];
    }
    if (targetStream) {
        [targetRoom statsReportForStream:targetStream useVideoTrack:NO withCompletionHandler:^(NSDictionary<NSString *,NSString *> *stats) {
            NSData *jsonData = [NSJSONSerialization dataWithJSONObject:stats
                                                               options:NSJSONWritingPrettyPrinted
                                                                 error:nil];
            NSString *jsonString = [[[NSString alloc] initWithData:jsonData encoding:NSUTF8StringEncoding] stringByReplacingOccurrencesOfString:@" " withString:@""];
            callback(@[@(YES), @(0), @"Success", jsonString]);
        }];
    } else {
        callback(@[@(NO), @(-4), @"Stream is not found."]);
    }
}

RCT_EXPORT_METHOD(setSpeakerphoneOn:(BOOL)isOn) {
    isSpeaker = isOn;
    [[StringeeAudioManager instance] setLoudspeaker:isOn];
}


// TODO: - Private functions

- (void)addRenderToView:(UIView *)view streamId:(NSString *)streamId isLocal:(BOOL)isLocal {
    RCTLogInfo(@"addRenderToView");
    if (isLocal) {
        if (localStream) {
            localStream.localVideoView.frame = CGRectMake(0, 0, view.bounds.size.width, view.bounds.size.height);
            [view addSubview:localStream.localVideoView];
        }
    } else {
        RCTLogInfo(@"addRenderToView - remote");
        StringeeRoomStream *remoteStream = [remoteStreams objectForKey:streamId];
        if (remoteStream) {
            RCTLogInfo(@"addRenderToView - remote - sucess");
            [remoteStream.remoteVideoView setFrame:CGRectMake(0, 0, view.bounds.size.width, view.bounds.size.height)];
            remoteStream.remoteVideoView.delegate = view;
            [view addSubview:remoteStream.remoteVideoView];
        }
    }
}

- (NSString *)keyForLongValue:(long long)value {
    return [NSString stringWithFormat:@"%lld", value];
}

// TODO: - Stringee Room Delegate

- (void)didRoomConnect:(StringeeRoom *)stringeeRoom streams:(NSArray<StringeeRoomStream *> *)streams {
    RCTLogInfo(@"Đã kết nối tới room");
    if ([jsEvents containsObject:didRoomConnect]) {
        NSMutableArray *streamInfos = [[NSMutableArray alloc] init];

        for (StringeeRoomStream *stream in streams) {
            [remoteStreams setObject:stream forKey:stream.streamId];
            NSDictionary *streamInfo = @{@"userId" : stream.userId, @"streamId" : stream.streamId};
            [streamInfos addObject:streamInfo];
        }
        [self sendEventWithName:didRoomConnect body:@{ @"roomId" : @(stringeeRoom.roomId), @"streams" : streamInfos }];
    }
    
}

- (void)didRoomError:(StringeeRoom *)stringeeRoom code:(int)code message:(NSString *)message {
    RCTLogInfo(@"Kết nối tới room lỗi");
    // [self clearAndEnd];
    if ([jsEvents containsObject:didRoomError]) {
      [self sendEventWithName:didRoomError body:@{ @"roomId" : @(stringeeRoom.roomId), @"code" : @(code), @"message" : message }];
    }
}

- (void)didRoomDisConnect:(StringeeRoom *)stringeeRoom {
    RCTLogInfo(@"Đã ngắt kết nối tới room");
    if ([jsEvents containsObject:didRoomDisConnect]) {
      [self sendEventWithName:didRoomDisConnect body:@{ @"roomId" : @(stringeeRoom.roomId) }];
    }
}

// Publish and unpublish
- (void)didStreamPublish:(StringeeRoom *)stringeeRoom stream:(StringeeRoomStream *)stream {
    RCTLogInfo(@"Publish local stream thành công - streamId: %@", stream.streamId);
    if (publishCallback) {
        publishCallback(@[@(YES), @(0), @"Publish local stream successfully.", stream.streamId]);
        publishCallback = nil;
    }
}

- (void)didStreamPublishError:(StringeeRoom *)stringeeRoom stream:(StringeeRoomStream *)stream error:(NSString *)error {
    RCTLogInfo(@"%@", error);
    if (publishCallback) {
        publishCallback(@[@(NO), @(-3), @"Generic error."]);
        publishCallback = nil;
    }
}

- (void)didStreamUnPublish:(StringeeRoom *)stringeeRoom stream:(StringeeRoomStream *)stream {
    RCTLogInfo(@"unPublish local stream thành công - streamId: %@", stream.streamId);
    if (unPublishCallback) {
        unPublishCallback(@[@(YES), @"Unpublish local stream successfully."]);
        unPublishCallback = nil;
    }
}

- (void)didStreamUnPublishError:(StringeeRoom *)stringeeRoom stream:(StringeeRoomStream *)stream error:(NSString *)error {
    RCTLogInfo(@"%@", error);
    if (unPublishCallback) {
        unPublishCallback(@[@(NO), @(-4), @"Generic error."]);
        unPublishCallback = nil;
    }
}

- (void)didStreamAdd:(StringeeRoom *)stringeeRoom stream:(StringeeRoomStream *)stream {
    if ([jsEvents containsObject:didStreamAdd]) {
        NSDictionary *info = @{@"userId" : stream.userId, @"streamId" : stream.streamId};
        [remoteStreams setObject:stream forKey:stream.streamId];
        [self sendEventWithName:didStreamAdd body:@{ @"roomId" : @(stringeeRoom.roomId), @"stream" : info }];
    }
}

- (void)didStreamSubscribe:(StringeeRoom *)stringeeRoom stream:(StringeeRoomStream *)stream {
    RCTLogInfo(@"Đã subscribe stream - streamId: %@", stream.streamId);
    if (!hasChangedSpeakerPhone) {
        // Set lai speaker
        hasChangedSpeakerPhone = !hasChangedSpeakerPhone;
        [[StringeeAudioManager instance] setLoudspeaker:isSpeaker];
    }
    if (subscribeCallback) {
        subscribeCallback(@[@(YES), @(0), @"Subscribe stream successfully."]);
        subscribeCallback = nil;
    }
}


- (void)didStreamSubscribeError:(StringeeRoom *)stringeeRoom stream:(StringeeRoomStream *)stream error:(NSString *)error {
    RCTLogInfo(@"%@", error);
    if (subscribeCallback) {
        subscribeCallback(@[@(NO), @(-5), @"Generic error."]);
        subscribeCallback = nil;
    }
}


- (void)didStreamUnSubscribe:(StringeeRoom *)stringeeRoom stream:(StringeeRoomStream *)stream {
    RCTLogInfo(@"Đã unsubscribe stream - streamId: %@", stream.streamId);
    if (unSubscribeCallback) {
        unSubscribeCallback(@[@(YES), @(0), @"Unsubscribe stream successfully."]);
        unSubscribeCallback = nil;
    }
}

- (void)didStreamUnSubscribeError:(StringeeRoom *)stringeeRoom stream:(StringeeRoomStream *)stream error:(NSString *)error {
    RCTLogInfo(@"%@", error);
    if (unSubscribeCallback) {
        unSubscribeCallback(@[@(NO), @(-5), @"Generic error."]);
        unSubscribeCallback = nil;
    }
}


- (void)didStreamRemove:(StringeeRoom *)stringeeRoom stream:(StringeeRoomStream *)stream {
    RCTLogInfo(@"Đã xóa stream - streamId: %@", stream.streamId);
    if ([jsEvents containsObject:didStreamRemove]) {
        NSDictionary *info = @{@"userId" : stream.userId, @"streamId" : stream.streamId};
        [remoteStreams removeObjectForKey:stream.streamId];
        [self sendEventWithName:didStreamRemove body:@{ @"roomId" : @(stringeeRoom.roomId), @"stream" : info }];
    }
}

@end
