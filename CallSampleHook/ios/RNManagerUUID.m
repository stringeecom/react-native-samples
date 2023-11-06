//
//  RNManagerUUID.m
//  CallSampleHook
//
//  Created by Hiệp Hoàng on 04/11/2023.
//

#import <Foundation/Foundation.h>
#import "RNManagerUUID.h"
#import "ManagerUUID.h"

@implementation RNManagerUUID

RCT_EXPORT_MODULE();

RCT_EXPORT_METHOD(UUID: (RCTResponseSenderBlock)callback) {
  NSString *item = [ManagerUUID.instance getUUID];
  callback(@[item]);
}

RCT_EXPORT_METHOD(RNReset) {
  [ManagerUUID.instance reset];
}



@end
