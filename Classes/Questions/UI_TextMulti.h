//
//  UI_TextMulti.h
//  Polldaddy
//
//  Created by John Godley on 26/05/2010.
//  Copyright 2010 Automattic. All rights reserved.
//

#import "UI_Question.h"

@class ST_Text, Language;

@interface UI_TextMulti : UI_Question <UITextViewDelegate> {
	ST_Text    *question;
	UITextView *textField;
	unsigned int keyboardHeight;
	
	UIToolbar *toolbar;
	UIButton *cancelButton, *surveyButton;
}

@property (nonatomic, strong) Question *question;

- initWithQuestion:(ST_Text *)theQuestion andPack:(Language *)pack;
- (NSString *) collectData;
- (boolean_t) isCompleted;
- (NSString *) getError;
-(void) displayNextButton:(UIButton *)surveyButton andCancelButton:(UIButton *)cancelButton;
- (void) displayQuestion;

@end
