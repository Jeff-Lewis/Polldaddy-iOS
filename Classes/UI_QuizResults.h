//
//  UI_PageHeader.h
//  Polldaddy
//
//  Created by John Godley on 31/05/2010.
//  Copyright 2010 Automattic. All rights reserved.
//

#import "UI_Question.h"

@class Survey, Language;

@interface UI_QuizResults : UI_Question {
	NSMutableString *results;
	NSString        *failMessage;
	
	BOOL passed;
}

- initWithSurvey:(Survey *)survey andAnswers:(NSMutableDictionary *)answers andPack:(Language *)pack;
-(void) loadTitle:(NSString *)title withNote:(NSString *)note withDisplay:(UIWebView *)questionDetails isMandatory:(BOOL)mandatory;
-(void) displayNextButton:(UIButton *)surveyButton andCancelButton:(UIButton *)cancelButton;
- (void) displayQuestion;

@end
