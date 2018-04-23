//
//  StringeeRoomStreamConfig.h
//  Stringee
//
//  Created by Hoang Duoc on 10/20/17.
//  Copyright © 2017 Hoang Duoc. All rights reserved.
//

#import <Foundation/Foundation.h>


typedef enum {
    VideoResolution_Normal      = 0, // 480 x 640
    VideoResolution_HD          = 1  // 720 x 1280
} VideoResolution;


@interface StringeeRoomStreamConfig : NSObject

@property(assign, nonatomic) VideoResolution streamVideoResolution;

- (instancetype)init;

@end
