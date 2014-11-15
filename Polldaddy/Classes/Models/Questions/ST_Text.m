//
//  ST_Text.m
//  Polldaddy
//
//  Created by John Godley on 24/05/2010.
//  Copyright 2010 Automattic. All rights reserved.
//

#import "ST_Text.h"

@implementation ST_Text

- (Question *) initWithXML:(TBXMLElement *)qnode andType:(int)qType andPage:(unsigned int)thePage {
	self = [super initWithXML:qnode andType:qType andPage:thePage];

	// Size value
	size = [TBXML elementInteger:@"size" parentElement:qnode withDefault:0];

	// Type of text
	fieldType = [TBXML elementInteger:@"type" parentElement:qnode withDefault:0];
	if ( qType == 200 )
		fieldType = 1;   // Multi-line

	return self;
}

-(NSString *) description {
	return [NSString stringWithFormat:@"%@\nSize=%ld Type=%ld", [super description], size, fieldType];
}

- (boolean_t) isPassword {
	if ( fieldType == 2 )
		return YES;
	return NO;
}

- (boolean_t) isSmall {
	if ( size == 0 )
		return YES;
	return NO;
}

- (boolean_t) isMedium {
	if ( size == 1 )
		return YES;
	return NO;
}

- (boolean_t) isBig {
	if ( size == 2 )
		return YES;
	return NO;
}

@end
