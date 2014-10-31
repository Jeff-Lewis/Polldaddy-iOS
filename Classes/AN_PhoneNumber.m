//
//  AN_PhoneNumber.m
//  Polldaddy
//
//  Created by John Godley on 26/01/2011.
//  Copyright 2011 Automattic. All rights reserved.
//

#import "AN_PhoneNumber.h"
#import "ST_PhoneNumber.h"
#import "Question.h"

@implementation AN_PhoneNumber

- (NSString *) summaryForQuestion:(ST_PhoneNumber *)question {
	return number;
}

- (Answer *) initWithXML:(TBXMLElement *)node {
	self = [super initWithXML:node];
	
	number = [TBXML elementText:@"raw" parentElement:node withDefault:@""];
	return self;
}

@end
