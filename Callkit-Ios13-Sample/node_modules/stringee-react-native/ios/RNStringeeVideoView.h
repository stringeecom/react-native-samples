
#import <UIKit/UIKit.h>
#import <Stringee/Stringee.h>

@interface RNStringeeVideoView : UIView <StringeeRemoteViewDelegate>

@property(assign, nonatomic) BOOL local;
@property(assign, nonatomic) BOOL overlay;
@property(strong, nonatomic) NSString *callId;
@property(strong, nonatomic) NSString *streamId;

@end
