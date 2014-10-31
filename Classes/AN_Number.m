//
//  AN_Url.m
//  Polldaddy
//
//  Created by John Godley on 08/07/2010.
//  Copyright 2010 Automattic. All rights reserved.
//

#import "AN_Number.h"
#import "ST_Number.h"
#import "Question.h"

@implementation AN_Number

- (NSString *) summaryForQuestion:(ST_Number *)question {
	return [question getFormattedWithLabel:number];
}

- (Answer *) initWithXML:(TBXMLElement *)node {
	self = [super initWithXML:node];
	
	number = [TBXML elementFloat:@"number" parentElement:node withDefault:0];

	return self;
}


@end
