//
//  UI_Url.h
//  Polldaddy
//
//  Created by Eoin Gallagher on 27/05/2010.
//  Copyright 2010 Automattic. All rights reserved.
//

#import "UI_Question.h"

@class ST_Url, Language;

@interface UI_Url : UI_Question {
	ST_Url     *question;
	UITextField *textField;
	UILabel		*label;
}

@property (nonatomic, strong) Question *question;

- (IBAction)readField:(id)sender;
- initWithQuestion:(ST_Url *)theQuestion andPack:(Language *)pack;
- (NSString *) collectData;
- (boolean_t) isValid;
- (boolean_t) isCompleted;
- (NSString *) getError;
- (void) displayQuestion;

@end
