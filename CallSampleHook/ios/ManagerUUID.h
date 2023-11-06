//
//  ManagerUUID.h
//  CallSampleHook
//
//  Created by Hiệp Hoàng on 04/11/2023.
//

#ifndef ManagerUUID_h
#define ManagerUUID_h


#endif /* ManagerUUID_h */

@interface ManagerUUID : NSObject

+(ManagerUUID *)instance;

-(NSString *)getUUID;
-(void)reset;

@end
