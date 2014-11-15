//
//  UI_Text.h
//  Polldaddy
//
//  Created by John Godley on 26/05/2010.
//  Copyright 2010 Automattic. All rights reserved.
//

#import "UI_Question.h"

@class ST_Text, Language;

@interface UI_Text : UI_Question {
	ST_Text     *question;
	UITextField *textField;
}

@property (nonatomic, strong) ST_Text *question;

- (IBAction)readField:(id)sender;
- initWithQuestion:(ST_Text *)theQuestion andPack:(Language *)pack;
- (NSString *) collectData;
- (boolean_t) isCompleted;
- (NSString *) getError;
- (void) displayQuestion;

@end
