//
//  ST_EmailAddress.m
//  Polldaddy
//
//  Created by John Godley on 24/05/2010.
//  Copyright 2010 Automattic. All rights reserved.
//

#import "ST_EmailAddress.h"
#import "NSString+XMLEntities.h"


@implementation ST_EmailAddress

@synthesize example;

- (Question *) initWithXML:(TBXMLElement *)qnode andType:(int)qType andPage:(unsigned int)thePage {
	self = [super initWithXML:qnode andType:qType andPage:thePage];
	
	example = [[TBXML elementText:@"example" parentElement:qnode withDefault:@""] stringByDecodingHTMLEntities];
	
	return self;
}

-(NSString *) description {
	return [NSString stringWithFormat:@"%@\nExample=%@", [super description], example];
}

@end
