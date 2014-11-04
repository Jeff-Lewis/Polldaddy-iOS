//
//  ST_Name.m
//  Polldaddy
//
//  Created by John Godley on 24/05/2010.
//  Copyright 2010 Automattic. All rights reserved.
//

#import "ST_Name.h"
#import "NSString+XMLEntities.h"


@implementation ST_Name

@synthesize titleName, firstName, lastName, suffix;

- (Question *) initWithXML:(TBXMLElement *)qnode andType:(long)qType andPage:(unsigned long)thePage {
	self = [super initWithXML:qnode andType:qType andPage:thePage];
	
	nameType  = [TBXML elementInteger:@"type" parentElement:qnode withDefault:0];
	titleName = [[TBXML elementText:@"title" parentElement:qnode withDefault:NSLocalizedString( @"Title", @"" )] stringByDecodingHTMLEntities];
	firstName = [[TBXML elementText:@"firstName" parentElement:qnode withDefault:NSLocalizedString( @"First Name", @"" )] stringByDecodingHTMLEntities];
	lastName  = [[TBXML elementText:@"lastName" parentElement:qnode withDefault:NSLocalizedString( @"Last Name", @"" )] stringByDecodingHTMLEntities];
	suffix    = [[TBXML elementText:@"suffix" parentElement:qnode withDefault:NSLocalizedString( @"Suffix", @"" )] stringByDecodingHTMLEntities];
	
	return self;
}

-(NSString *) description {
	return [NSString stringWithFormat:@"%@\nType=%ld Title=%@ First=%@ Last=%@ Suffix=%@", [super description], nameType, titleName, firstName, lastName, suffix];
}

- (long) getNameType {
	return nameType;
}

@end
