

#import <UIKit/UIKit.h>
#import <QuartzCore/QuartzCore.h>


@interface PDButton : UIButton {
    UIColor *_highColor;
    UIColor *_lowColor;
    
    CAGradientLayer *gradientLayer;
	CAGradientLayer *gradientLayer2;
}

@property (nonatomic,strong) UIColor *_highColor;
@property (nonatomic,strong) UIColor *_lowColor;
@property (nonatomic,strong) CAGradientLayer *gradientLayer;
@property (nonatomic,strong) CAGradientLayer *gradientLayer2;


- (void) touch;
- (void) untouch;
@end
