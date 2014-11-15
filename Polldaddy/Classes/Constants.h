/*
 *  Constants.h
 *  pad-api-test
 *
 *  Created by Lenny on 25/05/2010.
 *  Copyright 2010 Automattic. All rights reserved.
 *
 */

@interface Constants : NSObject {
}

+ (float_t)buttonHeight;
+ (float_t)iPadWidth;
+ (float_t)iPadHeight;
+ (float_t)toolbarButtonYPos;
+ (float_t)innerFrameXOffset;
+ (float_t)innerFrameYOffset;
+ (float_t)textEditHeight;
+ (float_t)labelBottomPadding;
+ (float_t)questionToolbarHeight;
+ (float_t)multichoiceRowHeight;
+ (float_t)multichoiceTopPadding;
+ (float_t)matrixRowMin;
+ (float_t)matrixRowMax;
+ (float_t)matrixColMin;
+ (float_t)matrixColMax;
+ (float_t)matrixMinHeight;
+ (float_t)matrixMaxHeight;
+ (float_t)matrixRowPadding;
+ (float_t)matrixColPadding;
+ (boolean_t)isIpad;
+ (boolean_t)isIphone;
+ (UIColor*)polldaddyRed;
@end

// this macro takes an RGB value and converts it to a UIColor
#define UIColorFromRGB(rgbValue) [UIColor colorWithRed:((float)((rgbValue & 0xFF0000) >> 16))/255.0 green:((float)((rgbValue & 0xFF00) >> 8))/255.0 blue:((float)(rgbValue & 0xFF))/255.0 alpha:1.0]

// Colour of text on screen
#define PdTextColor grayColor
