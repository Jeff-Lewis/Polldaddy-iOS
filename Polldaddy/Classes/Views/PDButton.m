/*
 
 This is the polldaddy button class provided on the login screen and hopefully elsewhere.
 In IB, create a button and select PDButton for the button's class in the inspector window.
 This will not look correct in IB but will inherit these properties when compiled.
 
 */

#import "PDButton.h"
#import "Constants.h"

// this macro takes an RGB value and converts it to a UIColor
#define UIColorFromRGB(rgbValue) [UIColor \
colorWithRed:((float)((rgbValue & 0xFF0000) >> 16))/255.0 \
green:((float)((rgbValue & 0xFF00) >> 8))/255.0 \
blue:((float)(rgbValue & 0xFF))/255.0 alpha:1.0]

@implementation PDButton

@synthesize _highColor;
@synthesize _lowColor;
@synthesize gradientLayer;
@synthesize gradientLayer2;

- (void)awakeFromNib;
{
	self.backgroundColor = [UIColor yellowColor];
													
	// create the bottom gradient layer	
	gradientLayer = [[CAGradientLayer alloc] init];
	[gradientLayer setBounds:[self bounds]];
	
	// create the top gradient layer
	gradientLayer2 = [[CAGradientLayer alloc] init];
	[gradientLayer2 setBounds:[self bounds]];

	[gradientLayer setPosition:CGPointMake([self bounds].size.width/2, [self bounds].size.height)];
	[gradientLayer2 setPosition:CGPointMake([self bounds].size.width/2, [self bounds].size.height/2)];

	// this sets the highlight state of the text to invert the text shadow
	self.adjustsImageWhenHighlighted = YES;
    
	// button properties: cornerRadius, mask text to bounds, borderWidth
	if ( [Constants isIpad] ) {
    [[self layer] setCornerRadius:26.0f];	
    [[self layer] setBorderWidth:1.0f];
	}
	else {
    [[self layer] setCornerRadius:13.0f];	
    [[self layer] setBorderWidth:0.8f];
	}

	[[self layer] setMasksToBounds:YES];
	
	// insert the gradient layers into the button view
	[[self layer] insertSublayer:gradientLayer atIndex:0];
	[[self layer] insertSublayer:gradientLayer2 atIndex:0];
		
	// add the event handlers for touch and untouch
	// TODO: untouch off event
  [self addTarget:self action:@selector(touch) forControlEvents:UIControlEventTouchDown];
	[self addTarget:self action:@selector(untouch) forControlEvents:UIControlEventTouchUpInside];
}

- (void)touch{
	// play with the layers opacities, this animates!
	gradientLayer.opacity = 0.5;
	gradientLayer2.opacity = 0.8;

}

- (void)untouch{
	// reset the layers opacities, this animates!
	gradientLayer2.opacity = 1.0;
	gradientLayer.opacity = 1.0;
	
	
}

- (void)drawRect:(CGRect)rect;
{
	// sets the colors on the layer rects
	[gradientLayer2 setColors:[NSArray arrayWithObjects:(id)[UIColorFromRGB(0xeb3b30) CGColor],(id)[UIColorFromRGB(0x6a1515) CGColor], nil]];
	[gradientLayer setColors:[NSArray arrayWithObjects:(id)[UIColorFromRGB(0xa31919) CGColor],(id)[UIColorFromRGB(0xd92f2d) CGColor],nil]];
	

    [super drawRect:rect];
}


@end
