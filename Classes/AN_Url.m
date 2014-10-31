//
//  AN_Url.m
//  Polldaddy
//
//  Created by John Godley on 08/07/2010.
//  Copyright 2010 Automattic. All rights reserved.
//

#import "AN_Url.h"
#import "Question.h"

@implementation AN_Url

- (NSString *) summaryForQuestion:(Question *)question {
	return url;
}

- (Answer *) initWithXML:(TBXMLElement *)node {
	self = [super initWithXML:node];
	
	url = [TBXML elementText:@"value" parentElement:node withDefault:@""];
	return self;
}


@end
