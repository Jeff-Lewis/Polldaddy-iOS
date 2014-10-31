//
//  Response.m
//  Polldaddy
//
//  Created by John Godley on 08/07/2010.
//  Copyright 2010 Automattic. All rights reserved.
//

#import "Response.h"
#import "Question.h"
#import "Answer.h"
#import "FMResultSet.h"

@implementation Response

@synthesize respondentId, startDate, endDate, answers, answerXML;

-(id) initWithResultSet:(FMResultSet *)set {
	self = [super init];

	completed = [set intForColumn:@"completed"] == 2 ? YES : NO;	
	startDate = [set dateForColumn:@"startDate"];
	endDate   = [set dateForColumn:@"endDate"];
	
	answerXML = [set stringForColumn:@"responseXML"];
	return self;
}

-(id) initWithXML:(NSString *)xml andId:(unsigned int)theId andStart:(unsigned int)start andEnd:(unsigned int)end {
	self = [super init];
	
	if ( end < start )
		end = start;

	respondentId = theId;
	startDate    = [NSDate dateWithTimeIntervalSince1970:start];
	endDate      = [NSDate dateWithTimeIntervalSince1970:end];
	
	answers = [Answer allocAnswersFromXML:xml];
	return self;
}

- (BOOL) isComplete {
	return completed;
}

- (NSString *) description {
	return [NSString stringWithFormat:@"<pd:xml><![CDATA[%@]]></pd:xml><pd:completed>%d</pd:completed><pd:start_date>%@</pd:start_date><pd:end_date>%@</pd:end_date>",
											answerXML, completed ? 2 : 0, [startDate description], [endDate description]];
}

- (Answer *)getAnswerForQuestion:(Question *)question {
	for ( Answer *answer in answers ) {
		if ( answer.questionId == question.questionId )
			return answer;
	}
	
	return NULL;
}


@end
