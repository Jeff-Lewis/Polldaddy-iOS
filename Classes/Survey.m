//
//  Survey.m
//  Polldaddy
//
//  Created by John Godley on 24/05/2010.
//  Copyright 2010 Automattic. All rights reserved.
//

#import "Survey.h"
#import "Question.h"
#import "Rule.h"
#import "ST_PageHeader.h"
#import "ST_QuizResults.h"
#import "TBXML.h"
#import "NSString+XMLEntities.h"
#import "Language.h"

@implementation Survey

@synthesize title, surveyId, questions, startMessage, endMessage, endMessageFail, passThreshold, packId, styleId, firstIsFake;

- (Survey *) initWithId: (unsigned long) theId andTitle: (NSString *)andTitle {
	self = [super init];
	
	self.title        = andTitle;
	self.startMessage = nil;
	self.endMessage   = nil;

	surveyId     = theId;
	responses    = 0;
	questions    = nil;
	
	return self;
}

- (Survey *) initWithXML: (NSString *)xml  {
	return [self initWithTBXML: [TBXML tbxmlWithXMLString:xml]];
}

- (Survey *) initWithTBXML: (TBXML *)tbxml {
	TBXMLElement *root = tbxml.rootXMLElement;

	self = [super init];

	surveyId   = [[TBXML valueOfAttributeNamed:@"id" forElement:root] integerValue];
    packId     = [[TBXML valueOfAttributeNamed:@"packID" forElement:root] integerValue];
    styleId    = [[TBXML valueOfAttributeNamed:@"styleID" forElement:root] integerValue];
	formType   = [[TBXML valueOfAttributeNamed:@"fType" forElement:root] integerValue];
	self.title = [[TBXML valueOfAttributeNamed:@"title" forElement:root] stringByDecodingHTMLEntities];
	
	bool hasStart = NO, hasEnd = NO;

	if ( root ) {
		NSMutableArray *questionList = [[NSMutableArray alloc] init];
		
		if ( [self isSurvey] ) {
			self.startMessage = [[TBXML elementText:@"startMessage" parentElement:root withDefault:NSLocalizedString( @"You are at the beginning of this survey. To begin, press start below.", @"" )] stringByDecodingHTMLEntities];
			self.endMessage   = [[TBXML elementText:@"endMessage" parentElement:root withDefault:NSLocalizedString( @"Thank you for taking part in this survey!", @"" )] stringByDecodingHTMLEntities];
		}
		else {
			self.startMessage   = [[TBXML elementText:@"startMessage" parentElement:root withDefault:NSLocalizedString( @"You are at the beginning of this quiz. To begin, press start below.", @"" )] stringByDecodingHTMLEntities];
			self.endMessage     = [[TBXML elementText:@"endMessage" parentElement:root withDefault:NSLocalizedString( @"Thank you for taking part in this quiz!", @"" )] stringByDecodingHTMLEntities];
			self.endMessageFail = [[TBXML elementText:@"finish_message_fail" parentElement:root withDefault:NSLocalizedString( @"Thank you for taking part in this quiz!", @"" )] stringByDecodingHTMLEntities];
		}
		
		if ( [TBXML childElementNamed:@"startMessage" parentElement:root] )
			hasStart = YES;

		if ( [TBXML childElementNamed:@"finishMessage" parentElement:root] )
			hasEnd = YES;

		TBXMLElement *page = [TBXML childElementNamed:@"page" parentElement:root];
		long           qnum = 0, pnum, realQ = 1;

		// Go through the pages
		while ( page ) {
			pnum = [[TBXML valueOfAttributeNamed:@"pID" forElement:page] integerValue];
			
			// Go through the questions in a page
			TBXMLElement *qnode = [TBXML childElementNamed:@"question" parentElement:page];
			
			while ( qnode ) {
				Question *question = [Question allocQuestion:qnode onPage:pnum];
				
				if ( question ) {
                    question.surveyId = surveyId;
					[questionList addObject:question];
					
					question.realQnum = realQ++;

					// If it's a real question then set the question number
					if ( [question isQuestion] )
						question.questionNumber = ++qnum;

				}

				qnode = [TBXML nextSiblingNamed:@"question" searchFromElement: qnode];
			}
			
			page = [TBXML nextSiblingNamed:@"page" searchFromElement: page];
		}
        
        firstIsFake = NO;

		// Add start/end messages
		if ( [questionList count] > 0 ) {
			Question *fake;
			
			if ( hasStart == YES || ((Question *)[questionList objectAtIndex:0]).questionType != 1900 ) {
				fake = [[ST_PageHeader alloc] initWithTitle:title andNote:startMessage];
				
                firstIsFake = YES;
				[questionList insertObject:fake atIndex:0];			
			}
			
			if ( hasEnd == YES || ((Question *)[questionList objectAtIndex:[questionList count] - 1]).questionType != 1900 ) {
                Language *pack = [[Language alloc] initForSurvey:self];
                
				if ( [self isSurvey] )
					fake = [[ST_PageHeader alloc] initWithTitle:[pack getPhrase:PHRASE_END] andNote:endMessage];
				else
					fake = [[ST_QuizResults alloc] initWithTitle:[pack getPhrase:PHRASE_END] andNote:endMessage];
				
				[questionList addObject:fake];
			}
		}
        
        // Localize the questions
        for ( Question *question in questionList ) {
            [question localize:surveyId];
        }
		
		questions = [[NSArray alloc] initWithArray:questionList];
		
		TBXMLElement *rules = [TBXML childElementNamed:@"rules" parentElement:root];
		if ( rules ) {
			TBXMLElement *rule = [TBXML childElementNamed:@"rule" parentElement:rules];

			while ( rule ) {
				Rule *newRule = [[Rule alloc] initWithRule:rule];
				Question *question = [self getQuestionForId:newRule.questionId];
				
				if ( question )
					[question.rules addObject:newRule];


				rule = [TBXML nextSiblingNamed:@"rule" searchFromElement: rule];
			}
		}

		// Any quiz settings
		TBXMLElement *quiz = [TBXML childElementNamed:@"quizData" parentElement:root];
		if ( quiz ) {
			quizResultsView = [[TBXML valueOfAttributeNamed:@"resultsView" forElement:quiz] integerValue];
			passThreshold   = [[TBXML valueOfAttributeNamed:@"passThreshold" forElement:quiz] integerValue];
		}
	}

	return self;
}

- (BOOL) isSurvey {
	if ( formType == 0 )
		return YES;
	return NO;
}

- (BOOL) isQuiz {
	if ( formType == 4 )
		return YES;
	return NO;
}

- (BOOL) showFullResults {
	if ( quizResultsView == 1 )
		return YES;
	return NO;
}

- (BOOL) showFinalScore {
	if ( quizResultsView == 2 )
		return YES;
	return NO;	
}

- (boolean_t) hasNextQuestion:(unsigned long)qNum {
	if ( qNum + 1 < [questions count] )
		return TRUE;
	return FALSE;
}

- (unsigned long) realQuestionCount {
	unsigned int count = 0;
	
	for ( Question *question in questions ) {
		if ( [question isQuestion] )
			count++;
	}
	
	return count;
}

- (Question *) getQuestionForId:(unsigned long)qID {
	for ( Question *question in questions ) {
		if ( question.questionId == qID )
			return question;
	}
	
	return FALSE;
}

- (Question *) getQuestionForPosition:(unsigned long)position {
	if ( position < [questions count] ) {
		return [questions objectAtIndex:position];
	}

	return nil;
}

- (Question *) getFirstQuestionForPage:(unsigned long)page {
	for ( Question *question in questions ) {
		if ( question.page == page )
			return question;
	}
	
	return FALSE;
}

- (unsigned long) getResponses {
	return responses;
}

- (NSString *) description {
	if ( [self isSurvey] )
		return [NSString stringWithFormat:@"Survey %lu, %lu questions", surveyId, (unsigned long)[questions count]];
	else
		return [NSString stringWithFormat:@"Quiz %lu, %lu questions", surveyId, (unsigned long)[questions count]];
}


- (NSString *)getResourcePath {
    NSArray  *paths = NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES); 
    
    return [NSString stringWithFormat:@"%@/%lu/", [paths objectAtIndex:0], surveyId ];
}

- (BOOL)clearResources {
    BOOL      isDir;
	NSString *path = [self getResourcePath];
    
    NSFileManager *fileManager = [NSFileManager defaultManager];

    if ( [fileManager fileExistsAtPath:path isDirectory:&isDir] && isDir ) {
        NSError *err = nil;
        NSArray *files = [[NSFileManager defaultManager] contentsOfDirectoryAtPath:path error:&err];
        
        // Delete any files inside the directory
        for ( NSString *file in files ) {
            [fileManager removeItemAtPath:[NSString stringWithFormat:@"%@%@", [self getResourcePath], file] error:&err];
        }
        
        // Finally remove the directory
        return [fileManager removeItemAtPath:path error:&err];
    }
    
    // No directory, success!
    return YES;
}

- (BOOL)createResources {
    // Delete any existing files
    if ( [self clearResources] ) {
        // Create the directory
        NSString *path = [self getResourcePath];
        
        return [[NSFileManager defaultManager] createDirectoryAtPath:path withIntermediateDirectories:YES attributes:nil error:nil];
    }
    
    return NO;
}

- (void)storeResource:(RemoteResources *)resources withData:(NSData *)data andFilename:(NSString *)filename {
    RemoteContent *content = [resources.content objectAtIndex:resources.current];
    NSString      *path = [self getResourcePath];
    NSString      *extension = [filename pathExtension];

    content.local = [NSString stringWithFormat:@"%@/%@.%@", path, [RemoteContent localName:content.remote], extension];
    if ( [[NSFileManager defaultManager] createFileAtPath:content.local contents:data attributes:nil] == NO )
        NSLog(@"Failed to save res file" );
}

- (void)storeStyle:(NSData *)data {
    NSString *path = [NSString stringWithFormat:@"%@/style.css", [self getResourcePath]];
    
    [[NSFileManager defaultManager] createFileAtPath:path contents:data attributes:nil];
}

- (void)storeLanguage:(NSData *)data {
    if ( [data length] > 0 ) {
        NSString *path = [NSString stringWithFormat:@"%@/pack.xml", [self getResourcePath]];
        
        if ( [[NSFileManager defaultManager] createFileAtPath:path contents:data attributes:nil] == NO )
            NSLog(@"Failed to save lang file" );
    }
}

- (void)localizeResources:(RemoteResources *)resources {
    // Create survey resource directory
    if ( [self createResources] ) {
        // Go through each question and look for resources in note and multi-choice questions?
        for ( Question *question in questions ) {
            [question addResources:resources];
        }
    }
    else
        NSLog(@"Directory not created");
}

@end
