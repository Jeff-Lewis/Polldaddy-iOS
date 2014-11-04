//
//  AN_DateTime.h
//  Polldaddy
//
//  Created by John Godley on 08/07/2010.
//  Copyright 2010 Automattic. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "Answer.h"

@class Question;

@interface AN_DateTime : Answer {
	unsigned long month;
	unsigned long day;
	unsigned long year;
	unsigned long hour;
	unsigned long minute;
}

- (Answer *) initWithXML:(TBXMLElement *)node;
- (NSString *) summaryForQuestion:(Question *)question;

@end
