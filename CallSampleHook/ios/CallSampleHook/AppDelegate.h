#import <RCTAppDelegate.h>
#import <UIKit/UIKit.h>
#import "CustomPushPayload.h"
#import <CallKit/CXCallObserver.h>

@interface AppDelegate : RCTAppDelegate<CXCallObserverDelegate>
@property (nonatomic, assign) UIBackgroundTaskIdentifier backgroundUpdateTask;
@property (nonatomic, assign) BOOL jsCodeDidActive;
@end
