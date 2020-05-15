//
//  StringeeRoom.h
//  Stringee
//
//  Created by Hoang Duoc on 10/19/17.
//  Copyright © 2017 Hoang Duoc. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "StringeeClient.h"
#import "StringeeRoomStream.h"

@class StringeeClient;

@protocol StringeeRoomDelegate <NSObject>

@required

- (void)didRoomConnect:(StringeeRoom *)stringeeRoom streams:(NSArray<StringeeRoomStream *>*)streams;

- (void)didRoomDisConnect:(StringeeRoom *)stringeeRoom;

- (void)didRoomError:(StringeeRoom *)stringeeRoom code:(int)code message:(NSString *)message;

- (void)didStreamAdd:(StringeeRoom *)stringeeRoom stream:(StringeeRoomStream *)stream;

- (void)didStreamRemove:(StringeeRoom *)stringeeRoom stream:(StringeeRoomStream *)stream;

- (void)didStreamSubscribe:(StringeeRoom *)stringeeRoom stream:(StringeeRoomStream *)stream;

- (void)didStreamSubscribeError:(StringeeRoom *)stringeeRoom stream:(StringeeRoomStream *)stream error:(NSString *)error;

- (void)didStreamPublish:(StringeeRoom *)stringeeRoom stream:(StringeeRoomStream *)stream;

- (void)didStreamPublishError:(StringeeRoom *)stringeeRoom stream:(StringeeRoomStream *)stream error:(NSString *)error;

- (void)didStreamUnPublish:(StringeeRoom *)stringeeRoom stream:(StringeeRoomStream *)stream;

- (void)didStreamUnPublishError:(StringeeRoom *)stringeeRoom stream:(StringeeRoomStream *)stream error:(NSString *)error;

- (void)didStreamUnSubscribe:(StringeeRoom *)stringeeRoom stream:(StringeeRoomStream *)stream;

- (void)didStreamUnSubscribeError:(StringeeRoom *)stringeeRoom stream:(StringeeRoomStream *)stream error:(NSString *)error;

@end


@interface StringeeRoom : NSObject

@property (weak, nonatomic, readonly) StringeeClient *stringeeClient;
@property (weak, nonatomic) id<StringeeRoomDelegate> delegate;
@property (assign, nonatomic, readonly) long long roomId;

// MARK: - Init
- (instancetype)initWithStringeeClient:(StringeeClient *)stringeeClient;

// MARK: - Public method
- (void)makeRoomWithCompletionHandler:(void(^)(BOOL status, int code, NSString *message))completionHandler;

- (void)joinRoomWithRoomId:(long long)roomId completionHandler:(void(^)(BOOL status, int code, NSString *message))completionHandler;

- (void)subscribe:(StringeeRoomStream *)stream;

- (void)unSubscribe:(StringeeRoomStream *)stream;

- (void)publish:(StringeeRoomStream *)stream;

- (void)unPublish:(StringeeRoomStream *)stream;

- (void)destroy;

- (void)statsReportForStream:(StringeeRoomStream *)stream useVideoTrack:(BOOL)useVideoTrack withCompletionHandler:(nullable void (^)( NSDictionary<NSString *, NSString *> *stats ))completionHandler;


@end
