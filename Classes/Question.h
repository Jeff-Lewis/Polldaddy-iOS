//
//  Question.h
//  Polldaddy
//
//  Created by John Godley on 24/05/2010.
//  Copyright 2010 Automattic. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "TBXML.h"

@class UI_Question, RemoteResources;

@interface Question : NSObject {
	unsigned long surveyId;
	unsigned long questionType;
	unsigned long questionNumber;    // The question number shown to users, taking into account that page headings and HTML don't count
	unsigned long realQnum;          // The actual question number
	unsigned long questionId;
	unsigned long page;
	
	boolean_t isMandatory;

	NSString *title;
	NSString *note;
	
	NSMutableArray *rules;
}

@property unsigned long surveyId, questionType, questionNumber, questionId, page, realQnum;

@property (nonatomic, copy) NSString         *title, *note;
@property (nonatomic, strong) NSMutableArray *rules;

+ (Question *) allocQuestion: (TBXMLElement *)qnode onPage:(unsigned long)page;
- (Question *) initWithXML:(TBXMLElement *)qnode andType:(unsigned long)qType andPage:(unsigned long)page;
- (NSString *) description;
- (boolean_t) isMandatory;
- (boolean_t) isQuestion;
- (boolean_t) hasNote;
- (void)applyRules:(NSMutableArray *)actions withAnswer:(UI_Question *)answer;
- (void)localize:(unsigned long)theSurveyId;
- (NSString *)allocLocalizeString:(NSString *)str andSurveyId:(unsigned long)theSurveyId;
- (void)addResources:(RemoteResources *)resources;
@end
