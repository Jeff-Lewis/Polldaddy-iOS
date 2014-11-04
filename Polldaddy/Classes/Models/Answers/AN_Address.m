//
//  AN_Address.m
//  Polldaddy
//
//  Created by John Godley on 08/07/2010.
//  Copyright 2010 Automattic. All rights reserved.
//

#import "ST_Address.h"
#import "AN_Address.h"
#import "Question.h"


@implementation AN_Address

- (NSString *) summaryForQuestion:(Question *)question {
	NSMutableArray *array = [[NSMutableArray alloc] init];
	
	if ( [address1 length] > 0 && [address2 length] > 0 )
		[array addObject:[NSString stringWithFormat:@"%@, %@", address1, address2]];
	else if ( [address1 length] > 0 )
		[array addObject:address1];
	else if ( [address2 length] > 0 )
		[array addObject:address2];
	
	if ( [(ST_Address *)question showZip] )
		[array addObject:zip];

	if ( [(ST_Address *)question showCountry] )
		[array addObject:country];
	
	NSString *str = [array componentsJoinedByString:@"\n"];
	
	if ( [array count] == 0 )
		str = @"";
	return str;
}

- (Answer *) initWithXML:(TBXMLElement *)node {
	self = [super initWithXML:node];
	
	address1 = [TBXML elementText:@"add1" parentElement:node withDefault:@""];
	address2 = [TBXML elementText:@"add2" parentElement:node withDefault:@""];
	city     = [TBXML elementText:@"city" parentElement:node withDefault:@""];
	state    = [TBXML elementText:@"state" parentElement:node withDefault:@""];
	zip      = [TBXML elementText:@"zip" parentElement:node withDefault:@""];
	country  = [TBXML elementText:@"country" parentElement:node withDefault:@""];

	return self;
}

@end
