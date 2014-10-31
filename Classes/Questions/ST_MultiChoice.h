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
    
	unsigned int oID;
}

@property (nonatomic, copy) NSString *title, *mediaUrl;
@property (nonatomic) unsigned int oID;
@end

@interface ST_MultiChoice : Question {
	boolean_t other;
	int       order;
	int       choiceType;
	NSString *commentText;
	
	unsigned int correctAnswer;
    unsigned int minLimit;
    unsigned int maxLimit;
	
	NSMutableArray *answers;
}

@property (nonatomic, strong) NSMutableArray *answers;
@property (nonatomic, copy) NSString *commentText;
@property (nonatomic, readonly) unsigned int correctAnswer, minLimit, maxLimit;

- (Question *) initWithXML:(TBXMLElement *)qnode andType:(int)qType andPage:(unsigned int)thePage;
- (NSString *) description;
- (BOOL) isRadio;
- (BOOL) isCheckbox;
- (BOOL) isListboxOne;
- (BOOL) isListboxMany;
- (BOOL) hasOther;
- (NSString *) choiceWithId:(unsigned int)oID;
- (NSString *) choiceAtPosition:(unsigned int)pos;
- (unsigned int) keyAtPosition:(unsigned int)pos;
- (void) reorderAnswers;
- (void)addResources:(RemoteResources *)resources;
@end
