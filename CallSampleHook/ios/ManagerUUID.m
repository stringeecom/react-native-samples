//
//  ManagerUUID.m
//  CallSampleHook
//
//  Created by Hiệp Hoàng on 04/11/2023.
//

#import <Foundation/Foundation.h>
#import "ManagerUUID.h"


@implementation ManagerUUID {
  NSString *uuid;
}

- (instancetype)init {
    self = [super init];
    if (self) {
      uuid = [[[NSUUID UUID] UUIDString]lowercaseString];
    }
    return self;
}

+ (ManagerUUID *)instance {
  static ManagerUUID * instance = nil;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    instance = [[ManagerUUID alloc] init];
  });
  return instance;
}

- (NSString *)getUUID {
  return uuid;
}

- (void)reset {
  uuid = [[[NSUUID UUID] UUIDString]lowercaseString];
}


@end
