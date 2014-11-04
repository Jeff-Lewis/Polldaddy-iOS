//
//  AN_Url.m
//  Polldaddy
//
//  Created by John Godley on 08/07/2010.
//  Copyright 2010 Automattic. All rights reserved.
//

#import "AN_FileUpload.h"
#import "Question.h"

@implementation AN_FileUpload

- (NSString *) summaryForQuestion:(Question *)question {
	if ( hasData )
		return @"Media Item";
	return @"";
}

- (Answer *) initWithXML:(TBXMLElement *)node {
	self = [super initWithXML:node];
	
	hasData = NO;
	if ( [[TBXML elementText:@"raw" parentElement:node withDefault:@""] length] > 0 )
		hasData = YES;
	return self;
}


@end
