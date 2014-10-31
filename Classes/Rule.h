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
	unsigned int ruleId;
	unsigned int questionId;
	unsigned int responseType;
	unsigned int responseId;
	unsigned int actionType;
	unsigned int actionId;
}

@property unsigned int questionId;

- (Rule *) initWithRule: (TBXMLElement *)rule;
- (BOOL) isEnd;
- (BOOL) isJump;
- (BOOL) isSkip;
- (unsigned int) getTargetPage;
- (BOOL) applyWithQuestion:(Question *)question withAnswer:(UI_Question *)answer;

@end
