//
//  AN_MultiChoice.m
//  Polldaddy
//
//  Created by John Godley on 08/07/2010.
//  Copyright 2010 Automattic. All rights reserved.
//

#import "AN_MultiChoice.h"
#import "ST_MultiChoice.h"
#import "Question.h"


@implementation AN_MultiChoice

- (NSString *) summaryForQuestion:(Question *)question {
	NSMutableString *text = [[NSMutableString alloc] init];
	NSString        *choiceText;
	
	// Add choices
	for ( NSString *oId in options ) {
		choiceText = [(ST_MultiChoice *)question choiceWithId:[oId intValue]];
		if ( choiceText ) {
			[text appendFormat:@"%@\n", choiceText];
		}
	}
	
	// Add 'other'
	if ( [other length] > 0 )
		[text appendFormat:@"%@\n", other];
	
	// Add 'comment'
	if ( [comment length] > 0 )
		[text appendFormat:@"\nComment:\n%@\n", comment];
	
	choiceText = [NSString stringWithString:text];
	return choiceText;
}

- (NSString *) summaryForQuizQuestion:(ST_MultiChoice *)question {
	NSMutableString *text = [[NSMutableString alloc] init];
	NSString        *choiceText;
	
	// Add choices
	for ( NSString *oId in options ) {
		choiceText = [(ST_MultiChoice *)question choiceWithId:[oId intValue]];
		if ( choiceText ) {
			if ( (unsigned int)[oId integerValue] == question.correctAnswer )
				[text appendFormat:@"%@ (Correct)\n", choiceText];
			else
				[text appendFormat:@"%@ (Incorrect)\n", choiceText];
		}
	}
	
	// Add 'other'
	if ( [other length] > 0 )
		[text appendFormat:@"%@\n", other];
	
	// Add 'comment'
	if ( [comment length] > 0 )
		[text appendFormat:@"\nComment:\n%@\n", comment];
	
	choiceText = [NSString stringWithString:text];
	return choiceText;
}

- (BOOL) wasSelected:(unsigned int)oID {
	for ( NSString *option in options ) {
		if ( oID == (unsigned int)[option integerValue] )
			return YES;
	}
	
	return NO;
}

- (Answer *) initWithXML:(TBXMLElement *)node {
	self = [super initWithXML:node];
	
	options = [[NSMutableArray alloc] init];
	
	TBXMLElement *opts = [TBXML childElementNamed:@"options" parentElement:node];
	if ( opts ) {
		other   = [TBXML elementText:@"otherText" parentElement:opts withDefault:@""];
		comment = [TBXML elementText:@"commentText" parentElement:opts withDefault:@""];
			
		TBXMLElement *opt = [TBXML childElementNamed:@"option" parentElement:opts];
		if ( opt ) {
			options = [[TBXML valueOfAttributeNamed:@"oID" forElement:opt] componentsSeparatedByString:@","];

			NSArray *sorted = [options sortedArrayUsingSelector:@selector(compare:)];
			options = sorted;
		}
	}

	return self;
}

@end
