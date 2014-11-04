//
//  PDButtonBlue.m
//  Polldaddy
//
//  Created by Kevin Conboy on 5/27/10.
//  Copyright 2010 Automattic, Inc. All rights reserved.
//

#import "PDButtonBlue.h"
#import "PDButton.h"
// this macro takes an RGB value and converts it to a UIColor
#define UIColorFromRGB(rgbValue) [UIColor \
colorWithRed:((float)((rgbValue & 0xFF0000) >> 16))/255.0 \
green:((float)((rgbValue & 0xFF00) >> 8))/255.0 \
blue:((float)(rgbValue & 0xFF))/255.0 alpha:1.0]

@implementation PDButtonBlue


- (id)initWithFrame:(CGRect)frame {
    if ((self = [super initWithFrame:frame])) {
        // Initialization code
    }
    return self;
}


- (void)drawRect:(CGRect)rect;
{
	// sets the colors on the layer rects
	[gradientLayer2 setColors:[NSArray arrayWithObjects:(id)[UIColorFromRGB(0x129dc6) CGColor],(id)[UIColorFromRGB(0x036683) CGColor], nil]];
	[gradientLayer setColors:[NSArray arrayWithObjects:(id)[UIColorFromRGB(0x067596) CGColor],(id)[UIColorFromRGB(0xd379cb8) CGColor],nil]];
	
	
}

/*
// Only override drawRect: if you perform custom drawing.
// An empty implementation adversely affects performance during animation.
- (void)drawRect:(CGRect)rect {
    // Drawing code
}
*/



@end
