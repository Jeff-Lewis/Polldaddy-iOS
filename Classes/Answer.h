//
//  Answer.h
//  Polldaddy
//
//  Created by John Godley on 08/07/2010.
//  Copyright 2010 Automattic. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "TBXML.h"

@class Question;

@interface Answer : NSObject {
	unsigned long questionType;
	unsigned long questionId;
}

@property (nonatomic) unsigned long questionType, questionId;

+ (NSMutableArray *)allocAnswersFromXML:(NSString *)xml;
- (Answer *) initWithXML:(TBXMLElement *)node;
- (NSString *) description;
- (NSString *) summaryForQuestion:(Question *)question;

@end
