//
//  Rule.m
//  Polldaddy
//
//  Created by John Godley on 29/09/2010.
//  Copyright 2010 Automattic. All rights reserved.
//

#import "Rule.h"
#import "ST_MultiChoice.h"
#import "UI_Question.h"
#import "UI_MultiChoice.h"

@implementation Rule

@synthesize questionId;

- (Rule *) initWithRule: (TBXMLElement *)rule {
	self = [super init];
	
	ruleId       = [[TBXML valueOfAttributeNamed:@"ruleID" forElement:rule] integerValue];
	questionId   = [[TBXML valueOfAttributeNamed:@"qID" forElement:rule] integerValue];
	responseType = [[TBXML valueOfAttributeNamed:@"typeOfResponse" forElement:rule] integerValue];
	responseId   = [[TBXML valueOfAttributeNamed:@"oID" forElement:rule] integerValue];
	actionType   = [[TBXML valueOfAttributeNamed:@"actionType" forElement:rule] integerValue];
	actionId     = [[TBXML valueOfAttributeNamed:@"pID" forElement:rule] integerValue];

	return self;
}


- (BOOL) isEnd {
	if ( actionType == 2 )
		return YES;
	return NO;
}

- (BOOL) isJump {
	if ( actionType == 0 )
		return YES;
	return NO;
}

- (BOOL) isSkip {
	if ( actionType == 1 )
		return YES;
	return NO;
}

- (unsigned long) getTargetPage {
	return actionId;
}

- (BOOL)isAnswered {
	if ( responseType == 0 )
		return YES;
	return NO;
}

- (BOOL)isNotAnswered {
	if ( responseType == 1 )
		return YES;
	return NO;
}

- (BOOL)isMultiChoiceSelected {
	if ( responseType == 2 )
		return YES;
	return NO;
}

- (BOOL)isMultiChoiceNotSelected {
	if ( responseType == 3 )
		return YES;
	return NO;
}

- (BOOL) applyWithQuestion:(Question *)question withAnswer:(UI_Question *)answer {
	// Basic rules - is the question answered or not answered
	if ( ( [self isAnswered] && [answer isCompleted] ) || ( [self isNotAnswered] && [answer isCompleted] == NO ) )
		return YES;
	
	// Special case for multi-choice - we check if a particular option has been chosen or not
	if ( [question isKindOfClass:[ST_MultiChoice class]] && [answer isKindOfClass:[UI_MultiChoice class]] ) {
		BOOL is_chosen = [(UI_MultiChoice *)answer isChosen:[NSNumber numberWithUnsignedLong:responseId]];

		if ( [(UI_MultiChoice *)answer hasOther] && responseId == 0 )
			is_chosen = YES;

		if ( ( [self isMultiChoiceSelected] && is_chosen ) || ( [self isMultiChoiceNotSelected] && is_chosen == NO ) )
			return YES;		
	}
	
	return NO;
}

-(NSString *) description {
	return [NSString stringWithFormat:@"Rule: id=%lu questionId=%lu responseType=%lu responseId=%lu actionType=%lu actionId=%lu", ruleId, questionId, responseType, responseId, actionType, actionId ];
}

@end
