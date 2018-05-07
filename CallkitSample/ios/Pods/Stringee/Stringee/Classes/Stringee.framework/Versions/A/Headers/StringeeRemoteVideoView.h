//
//  StringeeRemoteVideoView.h
//  Stringee
//
//  Created by Hoang Duoc on 10/18/17.
//  Copyright © 2017 Hoang Duoc. All rights reserved.
//

#import <Foundation/Foundation.h>

@class StringeeRemoteVideoView;

@protocol StringeeRemoteViewDelegate

- (void)videoView:(StringeeRemoteVideoView *)videoView didChangeVideoSize:(CGSize)size;

@end


@interface StringeeRemoteVideoView : UIView

@property (nonatomic, weak) id<StringeeRemoteViewDelegate> delegate;

@end
