//
//  Response.h
//  Polldaddy
//
//  Created by John Godley on 08/07/2010.
//  Copyright 2010 Automattic. All rights reserved.
//

#import <Foundation/Foundation.h>

@class Question, Answer, FMResultSet;

@interface Response : NSObject {
	unsigned int respondentId;
	unsigned int surveyId;
	
	NSDate *startDate;
	NSDate *endDate;
	
	NSMutableArray *answers;
	NSString       *answerXML;
	
	// xml
	bool completed;
}

@property (nonatomic) unsigned int respondentId;
@property (nonatomic,copy) NSDate *startDate, *endDate;
@property (nonatomic,readonly,strong) NSString *answerXML;
@property (nonatomic,readonly) NSMutableArray *answers;

- (NSString *) description;
- (id) initWithXML:(NSString *)xml andId:(unsigned int)theId andStart:(unsigned int)start andEnd:(unsigned int)end;
- (id) initWithResultSet:(FMResultSet *)set;
- (Answer *)getAnswerForQuestion:(Question *)question;
- (BOOL) isComplete;
@end
