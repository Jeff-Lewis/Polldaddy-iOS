//
//  ST_Address.m
//  Polldaddy
//
//  Created by John Godley on 24/05/2010.
//  Copyright 2010 Automattic. All rights reserved.
//

#import "ST_Address.h"
#import "NSString+XMLEntities.h"


@implementation ST_Address

@synthesize address1, address2, city, country, state, zip, showZip, showCountry, showPlace, showCity, showState;

- (Question *) initWithXML:(TBXMLElement *)qnode andType:(int)qType andPage:(unsigned int)thePage {
	self = [super initWithXML:qnode andType:qType andPage:thePage];
	
	address1 = [[TBXML elementText:@"add1" parentElement:qnode withDefault:@"Address Line 1"] stringByDecodingHTMLEntities];
	address2 = [[TBXML elementText:@"add2" parentElement:qnode withDefault:@"Address Line 2"] stringByDecodingHTMLEntities];
	city     = [[TBXML elementText:@"city" parentElement:qnode withDefault:@"City"] stringByDecodingHTMLEntities];
	country  = [[TBXML elementText:@"country" parentElement:qnode withDefault:@"Country"] stringByDecodingHTMLEntities];
	state    = [[TBXML elementText:@"state" parentElement:qnode withDefault:@"State"] stringByDecodingHTMLEntities];
	zip      = [[TBXML elementText:@"zip" parentElement:qnode withDefault:@"Zip"] stringByDecodingHTMLEntities];

    showPlace = showState = showCity = YES;
	showZip = showCountry = NO;
    
	if ( [[TBXML elementText:@"showZip" parentElement:qnode withDefault:@"false"] isEqualToString:@"true"] )
		showZip = YES;
	
	if ( [[TBXML elementText:@"showCountry" parentElement:qnode withDefault:@"false"] isEqualToString:@"true"] )
		showCountry = YES;

    if ( [[TBXML elementText:@"showCity" parentElement:qnode withDefault:@"false"] isEqualToString:@"false"] )
		showCity = NO;

    if ( [[TBXML elementText:@"showPlace" parentElement:qnode withDefault:@"false"] isEqualToString:@"false"] )
		showPlace = NO;

    if ( [[TBXML elementText:@"showState" parentElement:qnode withDefault:@"false"] isEqualToString:@"false"] )
		showState = NO;

	return self;
}

-(NSString *) description {
	return [NSString stringWithFormat:@"%@\nAddr1=%@ Addr2=%@ City=%@ Zip=%@ (%@) Country=%@ (%@)", [super description], address1, address2,
					city, zip, showZip ? @"true" : @"false", country, showCountry ? @"true" : @"false"];
}


@end
