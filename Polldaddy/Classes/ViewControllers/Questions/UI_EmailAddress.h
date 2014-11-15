//
//  UI_EmailAddress.h
//  Polldaddy
//
//  Created by Eoin Gallagher on 27/05/2010.
//  Copyright 2010 Automattic. All rights reserved.
//

#import "UI_Question.h"

@class ST_EmailAddress, Language;

@interface UI_EmailAddress : UI_Question {
	ST_EmailAddress		*question;
	UITextField			*textField;
	UILabel				*label;
}

@property (nonatomic, strong) Question *question;

- (IBAction)readField:(id)sender;
- initWithQuestion:(ST_EmailAddress *)theQuestion andPack:(Language *)pack;
- (NSString *) collectData;
- (boolean_t) isValid;
- (boolean_t) isCompleted;
- (NSString *) getError;
- (void) displayQuestion;

@end
