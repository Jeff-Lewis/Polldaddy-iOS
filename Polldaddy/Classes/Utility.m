//
//  Utility.m
//  Polldaddy
//
//  Created by William Welbes on 11/7/14.
//  Copyright (c) 2014 Automattic. All rights reserved.
//

#import "Utility.h"

@implementation Utility

+ (UIInterfaceOrientation)currentInterfaceOrientation
{
    return [UIApplication sharedApplication].statusBarOrientation;
}

+ (CGFloat)deviceHeight
{
    CGFloat deviceHeight = [UIScreen mainScreen].bounds.size.height;
    if( [[UIScreen mainScreen] respondsToSelector: @selector(nativeBounds)]) {
        CGRect nativeBounds = [UIScreen mainScreen].nativeBounds;
        deviceHeight = nativeBounds.size.height / [UIScreen mainScreen].nativeScale;
    }
    
    return deviceHeight;
}

@end
