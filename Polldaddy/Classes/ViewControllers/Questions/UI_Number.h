//
//  UI_Matrix.h
//  Polldaddy
//
//  Created by John Godley on 27/05/2010.
//  Copyright 2010 Automattic. All rights reserved.
//

#import "UI_Question.h"

@class ST_Number, Language;

@interface UI_Number : UI_Question <UITextFieldDelegate> {
	ST_Number *question;
	
	UITextField *textField;
	UISlider    *slider;
	UILabel		  *label;
	
	unsigned int width;
	unsigned int smallWidth;
}

@property (nonatomic, strong) ST_Number *question;

- initWithQuestion:(ST_Number *)theQuestion andPack:(Language *)pack;

- (NSString *) collectData;
- (boolean_t) isCompleted;
- (NSString *) getError;
- (void) displayQuestion;

@end
