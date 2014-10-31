//
//  AN_Name.m
//  Polldaddy
//
//  Created by John Godley on 08/07/2010.
//  Copyright 2010 Automattic. All rights reserved.
//

#import "AN_Name.h"
#import "ST_Name.h"
#import "Question.h"


@implementation AN_Name

- (NSString *) summaryForQuestion:(Question *)question {
	NSMutableArray *array = [[NSMutableArray alloc] init];
	unsigned int type = [(ST_Name *)question getNameType];
	
	if ( ( type == 0 || type == 1 ) && [title length] > 0 )
		[array addObject:title];
	
	if ( [firstName length] > 0 )
		[array addObject:firstName];

	if ( [lastName length] > 0 )
		[array addObject:lastName];

	if ( type == 0 && [suffix length] > 0 )
		[array addObject:suffix];

	NSString *str = [array componentsJoinedByString:@"\n"];
	
	if ( [array count] == 0 )
		str = @"";
	return str;
}

- (Answer *) initWithXML:(TBXMLElement *)node {
	self = [super initWithXML:node];
	
	title     = [TBXML elementText:@"title" parentElement:node withDefault:@""];
	firstName = [TBXML elementText:@"firstName" parentElement:node withDefault:@""];
	lastName  = [TBXML elementText:@"lastName" parentElement:node withDefault:@""];
	suffix    = [TBXML elementText:@"suffix" parentElement:node withDefault:@""];
	title     = [TBXML elementText:@"title" parentElement:node withDefault:@""];
	return self;
}


@end
