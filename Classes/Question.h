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
	unsigned int surveyId;
	unsigned int questionType;
	unsigned int questionNumber;    // The question number shown to users, taking into account that page headings and HTML don't count
	unsigned int realQnum;          // The actual question number
	unsigned int questionId;
	unsigned int page;
	
	boolean_t isMandatory;

	NSString *title;
	NSString *note;
	
	NSMutableArray *rules;
}

@property unsigned int surveyId, questionType, questionNumber, questionId, page, realQnum;

@property (nonatomic, copy) NSString         *title, *note;
@property (nonatomic, strong) NSMutableArray *rules;

+ (Question *) allocQuestion: (TBXMLElement *)qnode onPage:(unsigned int)page;
- (Question *) initWithXML:(TBXMLElement *)qnode andType:(unsigned int)qType andPage:(unsigned int)page;
- (NSString *) description;
- (boolean_t) isMandatory;
- (boolean_t) isQuestion;
- (boolean_t) hasNote;
- (void)applyRules:(NSMutableArray *)actions withAnswer:(UI_Question *)answer;
- (void)localize:(unsigned int)theSurveyId;
- (NSString *)allocLocalizeString:(NSString *)str andSurveyId:(unsigned int)theSurveyId;
- (void)addResources:(RemoteResources *)resources;
@end
