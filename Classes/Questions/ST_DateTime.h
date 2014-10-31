//
//  ST_DateTime.h
//  Polldaddy
//
//  Created by John Godley on 24/05/2010.
//  Copyright 2010 Automattic. All rights reserved.
//

#import "Question.h"
#import <UIKit/UIKit.h>

@interface ST_DateTime : Question {
	int       dateType;
	NSString *titleDay;
	NSString *titleMonth;
	NSString *titleYear;
	NSString *titleHour;
	NSString *titleMinute;
}

- (Question *) initWithXML:(TBXMLElement *)qnode andType:(int)qType andPage:(unsigned int)thePage;
- (NSString *) description;
- (int) getDateType;
- (NSString *)getFormatString;

@end
