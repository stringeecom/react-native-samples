//
//  StringeeLocalVideoView.h
//  Stringee
//
//  Created by Hoang Duoc on 10/18/17.
//  Copyright © 2017 Hoang Duoc. All rights reserved.
//

#import <AVFoundation/AVFoundation.h>
#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

@interface StringeeLocalVideoView: UIView

@property (nonatomic, strong, readonly) AVCaptureSession *captureSession;

@end
