//
//  UI_Matrix.h
//  Polldaddy
//
//  Created by John Godley on 27/05/2010.
//  Copyright 2011 Automattic. All rights reserved.
//

#import "UI_Question.h"

@class ST_PhoneNumber, Language;

@interface UI_PhoneNumber : UI_Question <UIPickerViewDelegate> {
	ST_PhoneNumber *question;
	
	UIPickerView *picker;
	UIButton     *pickCountry;
	UIToolbar    *toolbar;
	
	UITextField  *textField;
	UILabel		   *label;
	
	UIWebView *browser;
	
	NSArray *countries;

	NSInteger chosenCountry;
}

@property (nonatomic, strong) ST_PhoneNumber *question;

- initWithQuestion:(ST_PhoneNumber *)theQuestion andPack:(Language *)pack;

- (NSString *) collectData;
- (boolean_t) isCompleted;
- (NSString *) getError;
- (void) displayQuestion;

@end
