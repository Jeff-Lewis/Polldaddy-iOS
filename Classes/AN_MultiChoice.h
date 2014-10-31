//
//  AN_MultiChoice.h
//  Polldaddy
//
//  Created by John Godley on 08/07/2010.
//  Copyright 2010 Automattic. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "Answer.h"

@class Question, ST_MultiChoice;

@interface AN_MultiChoice : Answer {
	NSArray   *options;
	NSString  *other;
	NSString  *comment;
}

- (Answer *) initWithXML:(TBXMLElement *)node;
- (NSString *) summaryForQuizQuestion:(ST_MultiChoice *)question;
- (NSString *) summaryForQuestion:(Question *)question;
- (BOOL) wasSelected:(unsigned int)oID;

@end
