//
//  ST_MultiChoice.h
//  Polldaddy
//
//  Created by John Godley on 24/05/2010.
//  Copyright 2010 Automattic. All rights reserved.
//

#import "Question.h"

@interface ChoiceElement : NSObject {
	NSString *title;
    NSString *mediaUrl;
    
	unsigned long oID;
}

@property (nonatomic, copy) NSString *title, *mediaUrl;
@property (nonatomic) unsigned long oID;
@end

@interface ST_MultiChoice : Question {
	boolean_t other;
	long       order;
	long       choiceType;
	NSString *commentText;
	
	unsigned long correctAnswer;
    unsigned long minLimit;
    unsigned long maxLimit;
	
	NSMutableArray *answers;
}

@property (nonatomic, strong) NSMutableArray *answers;
@property (nonatomic, copy) NSString *commentText;
@property (nonatomic, readonly) unsigned long correctAnswer, minLimit, maxLimit;

- (Question *) initWithXML:(TBXMLElement *)qnode andType:(long)qType andPage:(unsigned long)thePage;
- (NSString *) description;
- (BOOL) isRadio;
- (BOOL) isCheckbox;
- (BOOL) isListboxOne;
- (BOOL) isListboxMany;
- (BOOL) hasOther;
- (NSString *) choiceWithId:(unsigned long)oID;
- (NSString *) choiceAtPosition:(unsigned long)pos;
- (unsigned long) keyAtPosition:(unsigned long)pos;
- (void) reorderAnswers;
- (void)addResources:(RemoteResources *)resources;
@end
