//
//  AN_EmailAddress.m
//  Polldaddy
//
//  Created by John Godley on 08/07/2010.
//  Copyright 2010 Automattic. All rights reserved.
//

#import "AN_EmailAddress.h"
#import "Question.h"
#import "NSString+XMLEntities.h"


@implementation AN_EmailAddress

- (NSString *) summaryForQuestion:(Question *)question {
	return email;
}

- (Answer *) initWithXML:(TBXMLElement *)node {
	self = [super initWithXML:node];

	email = [[[TBXML elementText:@"value" parentElement:node withDefault:@""]  stringByDecodingHTMLEntities] stringByStrippingTags];
	return self;
}


@end
