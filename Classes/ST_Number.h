//
//  ST_Number.h
//  Polldaddy
//
//  Created by John Godley on 26/01/2011.
//  Copyright 2011 Automattic. All rights reserved.
//

#import "Question.h"

@interface ST_Number : Question {
	BOOL isSlider;

	unsigned int decimalPlaces;
	unsigned int labelPosition;
	
	float minValue;
	float maxValue;
	float defaultValue;
	
	BOOL hasMinValue;
	BOOL hasMaxValue;
	
	NSString *label;
}

@property (nonatomic, readonly) BOOL isSlider;
@property (nonatomic, readonly) float minValue, maxValue, defaultValue;
@property (nonatomic, copy) NSString *label;

- (Question *) initWithXML:(TBXMLElement *)qnode andType:(int)qType andPage:(unsigned int)thePage;
- (NSString *) description;
- (BOOL) isWhole;
- (BOOL) hasLabel;
- (BOOL) labelAfter;
- (BOOL) labelBefore;
- (NSNumber *)getNumber:(NSString *)string;
- (NSString *) getFormatted:(float)value;
- (NSString *) getFormattedWithLabel:(float)value;
- (BOOL) inRange:(float)value;
@end
