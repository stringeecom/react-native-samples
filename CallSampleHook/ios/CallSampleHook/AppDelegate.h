#import <RCTAppDelegate.h>
#import <UIKit/UIKit.h>
#import "CustomPushPayload.h"

@interface AppDelegate : RCTAppDelegate
@property (nonatomic, assign) UIBackgroundTaskIdentifier backgroundUpdateTask;
@end
