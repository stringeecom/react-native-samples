//
//  StringeeRoomStream.h
//  Stringee
//
//  Created by Hoang Duoc on 10/19/17.
//  Copyright © 2017 Hoang Duoc. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "StringeeRemoteVideoView.h"
#import "StringeeRoomStreamConfig.h"

@interface StringeeRoomStream : NSObject

@property (strong, nonatomic, readonly) NSString *userId;
@property (strong, nonatomic, readonly) NSString *streamId;

@property (strong, nonatomic, readonly) StringeeRemoteVideoView *remoteVideoView;
@property (strong, nonatomic, readonly) StringeeLocalVideoView *localVideoView;

// Public
- (instancetype)initLocalStreamWithConfig:(StringeeRoomStreamConfig *)config;

- (void)switchCamera;

- (void)mute:(BOOL)mute;

- (void)turnOnCamera:(BOOL)isOn;

- (void)autoOrientationOfLocalVideoViewWithSize:(CGSize)size withTransitionCoordinator:(id<UIViewControllerTransitionCoordinator>)coordinator;

@end

