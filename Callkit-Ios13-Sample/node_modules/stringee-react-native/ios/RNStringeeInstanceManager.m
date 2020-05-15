
#import "RNStringeeInstanceManager.h"

@implementation RNStringeeInstanceManager

+ (RNStringeeInstanceManager*)instance {
    static RNStringeeInstanceManager *instance = nil;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        instance = [[RNStringeeInstanceManager alloc] init];
    });
    return instance;
}

- (instancetype)init {
    self = [super init];
    if (self) {
        _calls = [[NSMutableDictionary alloc] init];
    }
    return self;
}

@end
