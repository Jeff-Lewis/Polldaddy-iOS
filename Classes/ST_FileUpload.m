//
//  ST_Url.m
//  Polldaddy
//
//  Created by John Godley on 24/05/2010.
//  Copyright 2010 Automattic. All rights reserved.
//

#import "ST_FileUpload.h"
#import "NSString+XMLEntities.h"


@implementation ST_FileUpload

@synthesize example;

- (Question *) initWithXML:(TBXMLElement *)qnode andType:(int)qType andPage:(unsigned int)thePage {
	self = [super initWithXML:qnode andType:qType andPage:thePage];
	
	return self;
}

-(NSString *) description {
	return [super description];
}

@end
