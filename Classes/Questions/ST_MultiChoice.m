//
//  ST_MultiChoice.m
//  Polldaddy
//
//  Created by John Godley on 24/05/2010.
//  Copyright 2010 Automattic. All rights reserved.
//

#import "NSString+XMLEntities.h"
#import "ST_MultiChoice.h"
#import "RemoteResources.h"

@implementation ChoiceElement

@synthesize title, oID, mediaUrl;

- (id)initWithId:(unsigned int)theId andTitle:(NSString *)theTitle {
	self = [super init];
	
	self.oID     = theId;
	self.title   = theTitle;
    self.mediaUrl = nil;
	return self;
}


- (NSString *) description {
    return [NSString stringWithFormat:@"oID=%d title=%@ mediaUrl=%@", oID, title, mediaUrl];
}
@end


NSComparisonResult compareAZ( ChoiceElement *element1, ChoiceElement *element2, void *context );
NSComparisonResult compareZA( ChoiceElement *element1, ChoiceElement *element2, void *context );
NSComparisonResult compareRandom( ChoiceElement *element1, ChoiceElement *element2, void *context );

NSComparisonResult compareAZ( ChoiceElement *element1, ChoiceElement *element2, void *context ) {
	return [element1.title caseInsensitiveCompare:element2.title];
}

NSComparisonResult compareZA( ChoiceElement *element1, ChoiceElement *element2, void *context ) {
	NSComparisonResult res = [element1.title caseInsensitiveCompare:element2.title];
	
	if ( res == NSOrderedAscending )
		return NSOrderedDescending;
	else if ( res == NSOrderedDescending )
		return NSOrderedAscending;
	return NSOrderedSame;
}

NSComparisonResult compareRandom( ChoiceElement *element1, ChoiceElement *element2, void *context ) {
	int randnum = arc4random() % 2;

	if ( randnum == 0 )
		return NSOrderedAscending;
	return NSOrderedDescending;
}

@implementation ST_MultiChoice

@synthesize answers, commentText, correctAnswer, minLimit, maxLimit;

- (Question *) initWithXML:(TBXMLElement *)qnode andType:(int)qType andPage:(unsigned int)thePage {
	self = [super initWithXML:qnode andType:qType andPage:thePage];
	
	other = FALSE;
	
	// Size value
	if ( [[TBXML elementText:@"other" parentElement:qnode withDefault:@"false"] isEqualToString:@"true"] )
		other = TRUE;
	
	// Type of text
	order      = [TBXML elementInteger:@"rand" parentElement:qnode withDefault:0];
	choiceType = [TBXML elementInteger:@"elmType" parentElement:qnode withDefault:0];

	TBXMLElement *cnode = [TBXML childElementNamed:@"comments" parentElement:qnode];
	if ( cnode && [[TBXML valueOfAttributeNamed:@"enabled" forElement:cnode] isEqualToString:@"true"] )
		self.commentText = [[TBXML textForElement:cnode] stringByDecodingHTMLEntities];
	else
		self.commentText = @"";

    // Extract limits
    TBXMLElement *limits = [TBXML childElementNamed:@"limits" parentElement:qnode];
    if ( limits ) {
        minLimit = [[TBXML valueOfAttributeNamed:@"min" forElement:limits] integerValue];
        maxLimit = [[TBXML valueOfAttributeNamed:@"max" forElement:limits] integerValue];
    }
   
	// For now we convert all list boxes to radio
	if ( choiceType == 1 )
		choiceType = 0;
	else if ( choiceType == 3 )
		choiceType = 2;

	correctAnswer = [TBXML elementInteger:@"answer" parentElement:qnode withDefault:0];

	answers = [[NSMutableArray alloc] init];
	
	// Parse the answers
	TBXMLElement *node = [TBXML childElementNamed:@"options" parentElement:qnode];
	if ( node ) {
		TBXMLElement  *opt = [TBXML childElementNamed:@"option" parentElement:node];
		ChoiceElement *element;
		unsigned int  key;
		NSString      *choiceTitle;
		
		while ( opt ) {
			key = [[TBXML valueOfAttributeNamed:@"oID" forElement:opt] integerValue];
            
            choiceTitle = [[TBXML textForElement:opt] stringByDecodingHTMLEntities];

            element = [[ChoiceElement alloc] initWithId:key andTitle:choiceTitle];
            
            // Add to dictionary, keyed on oID
			[answers addObject:element];

			opt = [TBXML nextSiblingNamed:@"option" searchFromElement: opt];
		}
	}

    // Parse any media answers
	node = [TBXML childElementNamed:@"media" parentElement:qnode];
	if ( node ) {
		TBXMLElement  *opt = [TBXML childElementNamed:@"mediaItem" parentElement:node];
        unsigned int   oID;
		
		while ( opt ) {
			oID = [[TBXML valueOfAttributeNamed:@"oID" forElement:opt] integerValue];
            
            // Find the choice and update the media item
            for ( ChoiceElement *choice in answers ) {
                if ( choice.oID == oID && [[TBXML valueOfAttributeNamed:@"type" forElement:opt] isEqualToString:@"library"] )
                    choice.mediaUrl = [[TBXML textForElement:opt] stringByDecodingHTMLEntities];
            }
            
			opt = [TBXML nextSiblingNamed:@"mediaItem" searchFromElement: opt];
		}
	}

	// Re-order the answers as per 'order'
	if ( order == 1 ) {
		// A-Z
		[answers sortUsingFunction:compareAZ context:nil];
	}
	else if ( order == 2 ) {
		// Z-A
		[answers sortUsingFunction:compareZA context:nil];
	}
	else if ( order == 3 )
		[self reorderAnswers];

	return self;
}

- (void) reorderAnswers {
	// Random
	if ( order == 3 ) {
    for ( NSUInteger i = [answers count]; i > 1; i--) {
			NSUInteger m = 1;
			
			do {
        m <<= 1;
			} while(m < i);
			
			NSUInteger ret;
			
			do {
        ret = random() % m;
			} while(ret >= i);
			
			[answers exchangeObjectAtIndex:i - 1 withObjectAtIndex:ret];
    }
		
	}
}


- (BOOL) hasOther {
	return other;
}

- (BOOL) isRadio {
	if ( choiceType == 0 )
		return YES;
	return NO;
}

- (BOOL) isCheckbox {
	if ( choiceType == 2 )
		return YES;
	return NO;
}

- (BOOL) isListboxOne {
	if ( choiceType == 1 )
		return YES;
	return NO;
}

- (BOOL) isListboxMany {
	if ( choiceType == 3 )
		return YES;
	return NO;
}

- (NSString *) choiceWithId:(unsigned int)oID {
	for ( ChoiceElement *choice in answers ) {
		if ( choice.oID == oID )
			return choice.title;
	}
	
	return nil;
}

- (NSString *) choiceAtPosition:(unsigned int)pos {
	ChoiceElement *element = [answers objectAtIndex:pos];
	if ( element )
		return element.title;
	return nil;
}

- (unsigned int) keyAtPosition:(unsigned int)pos {
	ChoiceElement *element = [answers objectAtIndex:pos];
	if ( element )
		return element.oID;
	return 0;
}

- (void)addResources:(RemoteResources *)resources {
    // Add resources for normal question stuff
    [super addResources:resources];
    
    // Now add media in choices
	for ( ChoiceElement *choice in answers ) {
		if ( choice.mediaUrl != nil ) {
            if ( [resources alreadyExists:choice.mediaUrl] == NO )
                [resources addResource:choice.mediaUrl];   
        }
	}
}

-(NSString *) description {
	NSMutableString *answerText = [[NSMutableString alloc] init];
	
	for (ChoiceElement *element in answers) {
		[answerText appendFormat:@"\n%u=%@", element.oID, element.title];
	}
	
	NSString *text = [NSString stringWithString:answerText];
	return [NSString stringWithFormat:@"%@\nOther=%@ order=%d, type=%d, comments=%@ %@", [super description], other ? @"true" : @"false", order, choiceType, commentText, text];
}

@end
