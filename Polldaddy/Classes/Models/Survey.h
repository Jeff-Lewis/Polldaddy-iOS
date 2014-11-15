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
	unsigned long surveyId;
	unsigned long formType;
	unsigned long responses;
    unsigned long packId;
    unsigned long styleId;
	
	unsigned long quizResultsView;
	unsigned long passThreshold;
    
    boolean_t firstIsFake;
	
	NSString *startMessage;
	NSString *endMessage;
	NSString *endMessageFail;
	
	NSString *title;
	NSArray  *questions;
}

@property (nonatomic, readonly) unsigned long surveyId, passThreshold, packId, styleId;
@property (nonatomic, readonly) boolean_t firstIsFake;
@property (nonatomic, strong) NSString *title, *startMessage, *endMessage, *endMessageFail;
@property (nonatomic, strong) NSArray *questions;

- (Survey *) initWithXML: (NSString *)xml;
- (Survey *) initWithTBXML: (TBXML *)tbxml;
- (Survey *) initWithId:(unsigned long)surveyId andTitle: (NSString *)title;
- (Question *) getQuestionForPosition:(unsigned long)position;
- (Question *) getFirstQuestionForPage:(unsigned long)page;
- (Question *) getQuestionForId:(unsigned long)qID;
- (NSString *) description;
- (unsigned long) getResponses;
- (unsigned long) realQuestionCount;
- (boolean_t) hasNextQuestion:(unsigned long)qNum;
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
