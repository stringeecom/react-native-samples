#import <RCTAppDelegate.h>
#import <UIKit/UIKit.h>
#import "CustomPushPayload.h"
#import <CallKit/CXCallObserver.h>

@interface AppDelegate : RCTAppDelegate
@property (nonatomic, assign) UIBackgroundTaskIdentifier backgroundUpdateTask;
@end
