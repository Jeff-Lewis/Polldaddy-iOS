//
//  Constants.m
//  Polldaddy
//
//  Created by John Godley on 31/05/2010.
//  Copyright 2010 Automattic. All rights reserved.
//

#import "Constants.h"

extern UIInterfaceOrientation gAppOrientation;

@implementation Constants

+ (boolean_t)isIpad {
	return (UI_USER_INTERFACE_IDIOM() == UIUserInterfaceIdiomPad);
}

+ (boolean_t)isIphone {
	return (UI_USER_INTERFACE_IDIOM() == UIUserInterfaceIdiomPhone);
}

+ (float_t)iPadWidth {
	return 768.0;
}

+ (float_t)iPadHeight {
	return 1024.0;
}

+ (float_t)buttonHeight {
	if ( [Constants isIpad] )
		return 60;
	return 30;
}

+ (float_t)toolbarButtonYPos {
	if ( [Constants isIpad] ) {
		if ( UIInterfaceOrientationIsPortrait( gAppOrientation ) )
			return 910;
		return 653;
	}
	else {
		if ( UIInterfaceOrientationIsPortrait( gAppOrientation ) )
			return 410;
		return 258;
	}
}

+ (float_t)innerFrameXOffset {
	// The X offset from the top left of the page in which questions start (i.e. inside the graphic background)
	if ( [Constants isIpad] )
		return 50;
	return 25;
}

+ (float_t)innerFrameYOffset {
	// The Y offset from the top left of the page in which questions start (i.e. inside the graphic background)
	if ( [Constants isIpad] )
		return 50;
	return 25;
}

+ (float_t)textEditHeight {
	// Height of a text edit box
	if ( [Constants isIpad] )
		return 30;
	return 24;
}

+ (float_t)labelBottomPadding {
	// The amount of padding added to the bottom of a question title and note
	if ( [Constants isIpad] )
		return 10;
	return 3;
}

+ (float_t)questionToolbarHeight {
	// The height of the grey toolbar area at the bottom of a question page
	if ( [Constants isIpad] )
		return 127;

	if ( UIInterfaceOrientationIsPortrait( gAppOrientation ) )
		return 84;
	return 70;
}

+ (float_t)multichoiceRowHeight {
	// Height of a multiple choice row
	if ( [Constants isIpad] )
		return 70;
	return 30;
}

+ (float_t)multichoiceTopPadding {
	// Padding from the top of the row
	if ( [Constants isIpad] )
		return 20;
	return 5;
}

+ (float_t)matrixRowMin {
	// Minimum width for a row label
	return 50;
}

+ (float_t)matrixRowMax {
	// Maximum width for a row label
	if ( [Constants isIpad] )
		return 200;   
	return 150;
}

+ (float_t)matrixColMin {
	// Minimum width for a column label
	return 32;  
}

+ (float_t)matrixColMax {
	// Maximum width for a column label
	if ( [Constants isIpad] )
		return 200; 
	return 150;
}

+ (float_t)matrixMinHeight {
	// Minimum height of a matrix row
	if ( [Constants isIpad] )
		return 40; 
	return 20;
}

+ (float_t)matrixMaxHeight {
	// Maximum height of a row or column label
	return 100; 
}

+ (float_t)matrixRowPadding {
	// Padding between rows
	if ( [Constants isIpad] )
		return 6;
	return 2;
}

+ (float_t)matrixColPadding {
	// Padding between columns
	return 2;
}

@end


