//
//  StringeeAudioManager.h
//  Stringee
//
//  Created by Hoang Duoc on 10/17/17.
//  Copyright © 2017 Hoang Duoc. All rights reserved.
//

#import <Foundation/Foundation.h>

@interface StringeeAudioManager : NSObject


+ (StringeeAudioManager *)instance;

- (BOOL)setLoudspeaker:(BOOL)enable;

- (BOOL)audioSessionSetCategory:(NSString *)category error:(NSError **)outError;

- (BOOL)audioSessionSetActive:(BOOL)active error:(NSError **)outError;

- (BOOL)audioSessionSetMode:(NSString *)mode error:(NSError **)outError;


@end
