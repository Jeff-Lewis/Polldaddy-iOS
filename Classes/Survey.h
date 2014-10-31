//
//  Survey.h
//  Polldaddy
//
//  Created by John Godley on 24/05/2010.
//  Copyright 2010 Automattic. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "PolldaddyAPI2.h"
#import "RemoteResources.h"

@class TBXML, Question;

@interface Survey : NSObject {
	unsigned int surveyId;
	unsigned int formType;
	unsigned int responses;
    unsigned int packId;
    unsigned int styleId;
	
	unsigned int quizResultsView;
	unsigned int passThreshold;
    
    boolean_t firstIsFake;
	
	NSString *startMessage;
	NSString *endMessage;
	NSString *endMessageFail;
	
	NSString *title;
	NSArray  *questions;
}

@property (nonatomic, readonly) unsigned int surveyId, passThreshold, packId, styleId;
@property (nonatomic, readonly) boolean_t firstIsFake;
@property (nonatomic, strong) NSString *title, *startMessage, *endMessage, *endMessageFail;
@property (nonatomic, strong) NSArray *questions;

- (Survey *) initWithXML: (NSString *)xml;
- (Survey *) initWithTBXML: (TBXML *)tbxml;
- (Survey *) initWithId: (unsigned int) surveyId andTitle: (NSString *)title;
- (Question *) getQuestionForPosition:(unsigned int)position;
- (Question *) getFirstQuestionForPage:(unsigned int)page;
- (Question *) getQuestionForId:(unsigned int)qID;
- (NSString *) description;
- (unsigned int) getResponses;
- (unsigned int) realQuestionCount;
- (boolean_t) hasNextQuestion:(unsigned int)qNum;
- (BOOL) isSurvey;
- (BOOL) isQuiz;

- (BOOL) showFullResults;
- (BOOL) showFinalScore;

- (BOOL)clearResources;
- (void)localizeResources:(RemoteResources *)resources;
- (void)storeResource:(RemoteResources *)resources withData:(NSData *)data andFilename:(NSString *)filename;
- (void)storeStyle:(NSData *)data;
- (void)storeLanguage:(NSData *)data;
@end
