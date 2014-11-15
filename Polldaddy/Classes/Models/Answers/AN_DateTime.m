//
//  AN_DateTime.m
//  Polldaddy
//
//  Created by John Godley on 08/07/2010.
//  Copyright 2010 Automattic. All rights reserved.
//

#import "AN_DateTime.h"
#import "ST_DateTime.h"
#import "Question.h"


@implementation AN_DateTime

- (Answer *) initWithXML:(TBXMLElement *)node {
	self = [super initWithXML:node];

	year   = [[TBXML elementText:@"yyyy" parentElement:node withDefault:@"0"] integerValue];
	month  = [[TBXML elementText:@"mm" parentElement:node withDefault:@"0"] integerValue];
	day    = [[TBXML elementText:@"dd" parentElement:node withDefault:@"0"] integerValue];
	hour   = [[TBXML elementText:@"h" parentElement:node withDefault:@"0"] integerValue];
	minute = [[TBXML elementText:@"m" parentElement:node withDefault:@"0"] integerValue];

	return self;
}

-(NSString *) description {
	return [NSString stringWithFormat:@"%@ %02lu/%02lu/%04lu %02lu:%02lu", [super description], day, month, year, hour, minute];
}

- (NSString *) summaryForQuestion:(Question *)question {
	NSDateFormatter *dateFormatter = [[NSDateFormatter alloc] init];

	// Set response info
	NSString *date = [NSString stringWithFormat:@"%04lu-%02lu-%02lu %02lu:%02lu:00", year, month, day, hour, minute];

    [dateFormatter setDateFormat:@"yyyy-MM-dd HH:mm:SS"];

	NSString *message = [dateFormatter stringFromDate:[dateFormatter dateFromString:date]];

    [dateFormatter setTimeStyle:NSDateFormatterMediumStyle];		
	[dateFormatter setDateStyle:NSDateFormatterMediumStyle];
	[dateFormatter setDateFormat:[(ST_DateTime *)question getFormatString]];

	return message;
}

@end
