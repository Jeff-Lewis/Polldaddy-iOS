//
//  AN_Text.m
//  Polldaddy
//
//  Created by John Godley on 08/07/2010.
//  Copyright 2010 Automattic. All rights reserved.
//

#import "AN_Text.h"
#import "Question.h"


@implementation AN_Text

- (NSString *) summaryForQuestion:(Question *)question {
	return text;
}

- (Answer *) initWithXML:(TBXMLElement *)node {
	self = [super initWithXML:node];
	
	text = [TBXML elementText:@"value" parentElement:node withDefault:@""];
	return self;
}


@end
