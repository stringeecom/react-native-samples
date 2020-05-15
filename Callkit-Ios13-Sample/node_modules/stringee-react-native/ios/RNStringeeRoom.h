#if __has_include(<React/RCTBridgeModule.h>)
#import <React/RCTBridgeModule.h>
#elif __has_include("RCTBridgeModule.h")
#import “RCTBridgeModule.h”
#else
#import "React/RCTBridgeModule.h"
#endif

#if __has_include(<React/RCTEventEmitter.h>)
#import <React/RCTEventEmitter.h>
#elif __has_include("RCTEventEmitter.h")
#import "RCTEventEmitter"
#else
#import "React/RCTEventEmitter.h"
#endif

#import <Stringee/Stringee.h>

@interface RNStringeeRoom : RCTEventEmitter <RCTBridgeModule, StringeeRoomDelegate>

@property(strong, nonatomic) NSMutableDictionary *rooms;

- (void)addRenderToView:(UIView *)view streamId:(NSString *)streamId isLocal:(BOOL)isLocal;

@end
