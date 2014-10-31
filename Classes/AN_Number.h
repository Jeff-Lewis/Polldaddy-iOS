//
//  AN_Url.h
//  Polldaddy
//
//  Created by John Godley on 08/07/2010.
//  Copyright 2010 Automattic. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "Answer.h"

@class Question, ST_Number;

@interface AN_Number : Answer {
	float number;
}

- (Answer *) initWithXML:(TBXMLElement *)node;
- (NSString *) summaryForQuestion:(ST_Number *)question;

@end
