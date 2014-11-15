//
//  Rule.h
//  Polldaddy
//
//  Created by John Godley on 29/09/2010.
//  Copyright 2010 Automattic. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "TBXML.h"

@class Question, UI_Question;

@interface Rule : NSObject {
	unsigned long ruleId;
	unsigned long questionId;
	unsigned long responseType;
	unsigned long responseId;
	unsigned long actionType;
	unsigned long actionId;
}

@property unsigned long questionId;

- (Rule *) initWithRule: (TBXMLElement *)rule;
- (BOOL) isEnd;
- (BOOL) isJump;
- (BOOL) isSkip;
- (unsigned long) getTargetPage;
- (BOOL) applyWithQuestion:(Question *)question withAnswer:(UI_Question *)answer;

@end
