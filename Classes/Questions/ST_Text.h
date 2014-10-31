//
//  ST_Text.h
//  Polldaddy
//
//  Created by John Godley on 24/05/2010.
//  Copyright 2010 Automattic. All rights reserved.
//

#import "Question.h"

@interface ST_Text: Question {
	int size;
	int fieldType;
}

- (Question *) initWithXML:(TBXMLElement *)qnode andType:(int)qType andPage:(unsigned int)thePage;
- (NSString *) description;
- (boolean_t) isPassword;
- (boolean_t) isSmall;
- (boolean_t) isMedium;
- (boolean_t) isBig;
@end
