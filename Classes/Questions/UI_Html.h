//
//  UI_Url.h
//  Polldaddy
//
//  Created by John Godley on 27/05/2010.
//  Copyright 2010 Automattic. All rights reserved.
//

#import "UI_Question.h"

@class ST_Html, Language;

@interface UI_Html : UI_Question {
	ST_Html     *question;
}

@property (nonatomic, strong) Question *question;

-(void) loadTitle:(NSString *)title withNote:(NSString *)note withDisplay:(UIWebView *)questionDetails isMandatory:(BOOL)mandatory;
- initWithQuestion:(ST_Html *)theQuestion andPack:(Language *)pack;
- (boolean_t) isValid;
- (boolean_t) isCompleted;
- (NSString *) getError;
- (void) displayQuestion;

@end
