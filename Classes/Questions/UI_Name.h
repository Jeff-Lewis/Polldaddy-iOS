//
//  UI_Name.h
//  Polldaddy
//
//  Created by Eoin Gallagher on 28/05/2010.
//  Copyright 2010 Automattic. All rights reserved.
//

#import "UI_Question.h"

@class ST_Name, Language;

@interface UI_Name : UI_Question {
	ST_Name     *question;
	
	UITextField *textFieldTitleName;
	UITextField *textFieldFirstName;
	UITextField *textFieldLastName;
	UITextField *textFieldSuffix;
	
	UILabel		*labelTitleName;
	UILabel		*labelFirstName;
	UILabel		*labelLastName;
	UILabel		*labelSuffix;
	
	unsigned int width;
	unsigned int smallWidth;
}

@property (nonatomic, strong) Question *question;

- (IBAction)readField:(id)sender;
- initWithQuestion:(ST_Name *)theQuestion andPack:(Language *)pack;
- (NSString *) collectData;
- (boolean_t) isValid;
- (boolean_t) isCompleted;
- (NSString *) getError;
- (void) displayQuestion;

@end
