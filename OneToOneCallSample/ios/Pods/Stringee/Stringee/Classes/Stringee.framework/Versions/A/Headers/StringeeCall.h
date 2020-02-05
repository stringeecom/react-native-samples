//
//  StringeeCall.h
//  Stringee
//
//  Created by Hoang Duoc on 10/12/17.
//  Copyright © 2017 Hoang Duoc. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <CoreTelephony/CTCall.h>
#import <CoreTelephony/CTCallCenter.h>
#import "StringeeClient.h"
#import "StringeeLocalVideoView.h"
#import "StringeeRemoteVideoView.h"
#import "StringeeRoomStreamConfig.h"

@class StringeeCall;

typedef NS_ENUM(NSInteger, SignalingState) {
    SignalingStateCalling,
    SignalingStateRinging,
    SignalingStateAnswered,
    SignalingStateBusy,
    SignalingStateEnded
};

typedef NS_ENUM(NSInteger, MediaState) {
    MediaStateConnected,
    MediaStateDisconnected
};

typedef NS_ENUM(NSInteger, CallType) {
    CallTypeCallIn,
    CallTypeCallOut,
    CallTypeInternalIncomingCall,
    CallTypeInternalCallAway
};

typedef NS_ENUM(NSInteger, CallDTMF) {
    CallDTMFZero,
    CallDTMFOne,
    CallDTMFTwo,
    CallDTMFThree,
    CallDTMFFour,
    CallDTMFFive,
    CallDTMFSix,
    CallDTMFSeven,
    CallDTMFEight,
    CallDTMFNine,
    CallDTMFStar,
    CallDTMFPound
};


@protocol StringeeCallDelegate <NSObject>

@required

- (void)didChangeSignalingState:(StringeeCall *)stringeeCall signalingState:(SignalingState)signalingState reason:(NSString *)reason sipCode:(int)sipCode sipReason:(NSString *)sipReason;

- (void)didChangeMediaState:(StringeeCall *)stringeeCall mediaState:(MediaState)mediaState;

@optional

- (void)didReceiveLocalStream:(StringeeCall *)stringeeCall;

- (void)didReceiveRemoteStream:(StringeeCall *)stringeeCall;

- (void)didReceiveDtmfDigit:(StringeeCall *)stringeeCall callDTMF:(CallDTMF)callDTMF;

- (void)didReceiveCallInfo:(StringeeCall *)stringeeCall info:(NSDictionary *)info;

- (void)didHandleOnAnotherDevice:(StringeeCall *)stringeeCall signalingState:(SignalingState)signalingState reason:(NSString *)reason sipCode:(int)sipCode sipReason:(NSString *)sipReason;

@end


@interface StringeeCall : NSObject

@property (strong, nonatomic, readonly) NSString *callId;
@property (strong, nonatomic, readonly) NSString *from;
@property (strong, nonatomic, readonly) NSString *to;
@property (strong, nonatomic, readonly) NSString *fromAlias;
@property (strong, nonatomic, readonly) NSString *toAlias;
@property (weak, nonatomic) id<StringeeCallDelegate> delegate;
@property (assign, nonatomic, readonly) BOOL isIncomingCall;
@property (assign, nonatomic, readonly) BOOL answeredOnAnotherDevice;
@property (assign, nonatomic, readonly) CallType callType;
@property (strong, nonatomic) NSString *customData;
@property (strong, nonatomic, readonly) NSString *customDataFromYourServer;
@property (assign, nonatomic) BOOL isVideoCall;
@property (assign, nonatomic) VideoResolution videoResolution;
@property (strong, nonatomic, readonly) StringeeLocalVideoView *localVideoView;
@property (strong, nonatomic, readonly) StringeeRemoteVideoView *remoteVideoView;


// MARK: - Init

- (instancetype)initWithStringeeClient:(StringeeClient *)stringeeClient from:(NSString *)from to:(NSString *)to;

// MARK: - Public

- (void)makeCallWithCompletionHandler:(void(^)(BOOL status, int code, NSString *message, NSString *data))completionHandler;

- (void)initAnswerCall;

- (void)answerCallWithCompletionHandler:(void(^)(BOOL status, int code, NSString *message))completionHandler;

- (void)hangupWithCompletionHandler:(void(^)(BOOL status, int code, NSString *message))completionHandler;

- (void)rejectWithCompletionHandler:(void(^)(BOOL status, int code, NSString *message))completionHandler;

- (void)sendDTMF:(CallDTMF)callDTMF completionHandler:(void(^)(BOOL status, int code, NSString *message))completionHandler;

- (void)sendCallInfo:(NSDictionary *)info completionHandler:(void(^)(BOOL status, int code, NSString *message))completionHandler;

- (void)switchCamera;

- (BOOL)enableLocalVideo:(BOOL)isEnable;

- (void)autoOrientationOfLocalVideoViewWithSize:(CGSize)size withTransitionCoordinator:(id<UIViewControllerTransitionCoordinator>)coordinator;

- (void)mute:(BOOL)isMute;

- (void)transferToUserId:(NSString *)userId completionHandler:(void(^)(BOOL status, int code, NSString *message))completionHandler;

- (void)hold:(BOOL)isHold completionHandler:(void(^)(BOOL status, int code, NSString *message))completionHandler;

- (void)statsWithCompletionHandler:
(void (^)( NSDictionary<NSString *, NSString *> *values ))completionHandler;

@end
