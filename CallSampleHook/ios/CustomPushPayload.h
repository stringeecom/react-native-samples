//
//  CustomPushPayload.h
//  CallNotificationSample
//
//  Created by HoangDuoc on 7/9/21.
//

#import <PushKit/PushKit.h>

NS_ASSUME_NONNULL_BEGIN

@interface CustomPushPayload : PKPushPayload

@property (copy) NSDictionary *customDictionaryPayload;

@end

NS_ASSUME_NONNULL_END

