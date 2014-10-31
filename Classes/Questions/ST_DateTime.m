//
//  ST_DateTime.m
//  Polldaddy
//
//  Created by John Godley on 24/05/2010.
//  Copyright 2010 Automattic. All rights reserved.
//

#import "ST_DateTime.h"
#import "NSString+XMLEntities.h"


@implementation ST_DateTime

- (Question *) initWithXML:(TBXMLElement *)qnode andType:(int)qType andPage:(unsigned int)thePage {
	self = [super initWithXML:qnode andType:qType andPage:thePage];
	
	dateType    = [TBXML elementInteger:@"type" parentElement:qnode withDefault:0];
	titleDay    = [[TBXML elementText:@"dd" parentElement:qnode withDefault:@"DD"] stringByDecodingHTMLEntities];
	titleMonth  = [[TBXML elementText:@"mm" parentElement:qnode withDefault:@"MM"] stringByDecodingHTMLEntities];
	titleYear   = [[TBXML elementText:@"yyyy" parentElement:qnode withDefault:@"YYYY"] stringByDecodingHTMLEntities];
	titleHour   = [[TBXML elementText:@"h" parentElement:qnode withDefault:@"H"] stringByDecodingHTMLEntities];
	titleMinute = [[TBXML elementText:@"m" parentElement:qnode withDefault:@"Mins"] stringByDecodingHTMLEntities];
	
	return self;
}

-(NSString *) description {
	return [NSString stringWithFormat:@"%@\nType=%d Day=%@ Month=%@ Year=%@ Hour=%@ Minute=%@", [super description], dateType, titleDay,
					titleMonth, titleYear, titleHour, titleMinute];
}

- (NSString *)getFormatString {
	if ( dateType == 0 )
		return @"MM/dd/yyyy hh:mm";
	else if ( dateType == 1 )
		return @"MM/mm/yyyy hh:mm";
	else if ( dateType == 2 )
		return @"MM/dd/yyyy";
	else if ( dateType == 3 )
		return @"MM/mm/yyyy";
	else if ( dateType == 4 )
		return @"hh:mm";
	return @"";
}

- (int) getDateType {
	return dateType;
}


@end
