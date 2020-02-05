//
//  StringeeClient.h
//  Stringee
//
//  Created by Hoang Duoc on 10/11/17.
//  Copyright © 2017 Hoang Duoc. All rights reserved.
//

#import <Foundation/Foundation.h>

@class StringeeClient;
@class StringeeCall;
@class StringeeRoom;

@protocol StringeeConnectionDelegate <NSObject>

@required

- (void)requestAccessToken:(StringeeClient *)stringeeClient;

- (void)didConnect:(StringeeClient *)stringeeClient isReconnecting:(BOOL)isReconnecting;

- (void)didDisConnect:(StringeeClient *)stringeeClient isReconnecting:(BOOL)isReconnecting;

- (void)didFailWithError:(StringeeClient *)stringeeClient code:(int)code message:(NSString *)message;

- (void)didReceiveCustomMessage:(StringeeClient *)stringeeClient message:(NSDictionary *)message fromUserId:(NSString *)userId;

@end


@protocol StringeeIncomingCallDelegate <NSObject>

@required

-(void) incomingCallWithStringeeClient:(StringeeClient *)stringeeClient stringeeCall:(StringeeCall *)stringeeCall;

@end



@interface StringeeClient : NSObject

@property (weak, nonatomic) id<StringeeConnectionDelegate> connectionDelegate;
@property (weak, nonatomic) id<StringeeIncomingCallDelegate> incomingCallDelegate;
@property (assign, nonatomic, readonly) BOOL hasConnected;
@property (strong, nonatomic, readonly) NSString *userId;
@property (strong, nonatomic, readonly) NSString *projectId;

- (instancetype)initWithConnectionDelegate:(id<StringeeConnectionDelegate>)delegate;

- (void)connectWithAccessToken:(NSString *)accessToken;

- (void)disconnect;

- (void)registerPushForDeviceToken:(NSString *)deviceToken isProduction:(BOOL)isProduction isVoip:(BOOL)isVoip completionHandler:(void(^)(BOOL status, int code, NSString *message))completionHandler;

- (void)unregisterPushForDeviceToken:(NSString *)deviceToken completionHandler:(void(^)(BOOL status, int code, NSString *message))completionHandler;

- (void)sendCustomMessage:(NSDictionary *)message toUserId:(NSString *)userId completionHandler:(void(^)(BOOL status, int code, NSString *message))completionHandler;

@end
