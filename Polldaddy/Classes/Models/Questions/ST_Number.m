//
//  ST_Number.m
//  Polldaddy
//
//  Created by John Godley on 26/01/2011.
//  Copyright 2011 Automattic. All rights reserved.
//

#import "ST_Number.h"
#import "NSString+XMLEntities.h"

@implementation ST_Number

@synthesize isSlider, minValue, maxValue, label, defaultValue;

- (Question *) initWithXML:(TBXMLElement *)qnode andType:(int)qType andPage:(unsigned int)thePage {
	self = [super initWithXML:qnode andType:qType andPage:thePage];
	
	hasMinValue = hasMaxValue = NO;
	
	decimalPlaces = [TBXML elementInteger:@"decimal_places" parentElement:qnode withDefault:0];
	labelPosition = [TBXML elementInteger:@"label_position" parentElement:qnode withDefault:0];
	minValue      = [TBXML elementFloat:@"min_value" parentElement:qnode withDefault:0];
	maxValue      = [TBXML elementFloat:@"max_value" parentElement:qnode withDefault:0];
	defaultValue  = [TBXML elementFloat:@"default_value" parentElement:qnode withDefault:0];
	
	if ( [[TBXML elementText:@"min_value" parentElement:qnode withDefault:@""] length] > 0 )
		hasMinValue = YES;

	if ( [[TBXML elementText:@"max_value" parentElement:qnode withDefault:@""] length] > 0 )
		hasMaxValue = YES;

	self.label = [[TBXML elementText:@"label" parentElement:qnode withDefault:@""] stringByDecodingHTMLEntities];

	isSlider = NO;
	if ( [[TBXML elementText:@"slider" parentElement:qnode withDefault:@"false"] isEqualToString:@"true"] )
		isSlider = YES;
	
	return self;
}

- (NSNumber *)getNumber:(NSString *)string {
    NSNumberFormatter *format = [[NSNumberFormatter alloc] init];
	
	[format setMaximumFractionDigits:decimalPlaces];
	[format setNumberStyle:NSNumberFormatterDecimalStyle];
    
    return [format numberFromString:string];
}

- (NSString *) getFormatted:(float)value {
	NSNumberFormatter *format = [[NSNumberFormatter alloc] init];
	
	[format setMaximumFractionDigits:decimalPlaces];
	[format setNumberStyle:NSNumberFormatterDecimalStyle];
	return [format stringFromNumber:[NSNumber numberWithFloat:value]];
}

- (NSString *) getFormattedWithLabel:(float)value {
	if ( [self hasLabel] ) {
		if ( [self labelAfter] )
			return [NSString stringWithFormat:@"%@%@", [self getFormatted:value], label];
		return [NSString stringWithFormat:@"%@%@", label, [self getFormatted:value]];
	}
	
	return [self getFormatted:value];
}

- (BOOL) inRange:(float)value {
	if ( hasMaxValue && value > maxValue )
		return NO;

	if ( hasMinValue && value < minValue )
		return NO;
	
	return YES;
}

-(NSString *) description {
	return [NSString stringWithFormat:@"%@\nLabel=%@ dp=%lu min=%f max=%f default=%f slider=%@", [super description], label, decimalPlaces, minValue, maxValue, defaultValue, isSlider ? @"YES" : @"NO"];
}

- (BOOL) isWhole {
	return decimalPlaces == 0 ? YES : NO;
}

- (BOOL) hasLabel {
	return labelPosition == 0 ? NO : YES;
}

- (BOOL) labelAfter {
	return labelPosition == 2 ? YES : NO;
}

- (BOOL) labelBefore {
	return labelPosition == 1 ? YES : NO;
}


@end
