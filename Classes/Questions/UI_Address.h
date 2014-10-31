//
//  UI_Address.h
//  Polldaddy
//
//  Created by Eoin Gallagher on 28/05/2010.
//  Copyright 2010 Automattic. All rights reserved.
//

#import "UI_Question.h"

@class ST_Address, Language;

@interface UI_Address : UI_Question <UITextFieldDelegate> {
	ST_Address  *question;
	
	UITextField *textFieldAddress1;
	UITextField *textFieldAddress2;
	UITextField *textFieldCity;
	UITextField *textFieldState;
	UITextField *textFieldZip;
	UITextField *textFieldCountry;
	
	UILabel		*labelAddress1;
	UILabel		*labelAddress2;
	UILabel		*labelCity;
	UILabel		*labelState;
	UILabel		*labelZip;
	UILabel		*labelCountry;
	
	UITextField *activeField;
}

@property (nonatomic, strong) Question *question;

- initWithQuestion:(ST_Address *)theQuestion andPack:(Language *)pack;
- (NSString *) collectData;
- (boolean_t) isValid;
- (boolean_t) isCompleted;
- (NSString *) getError;
- (void) displayQuestion;

@end
