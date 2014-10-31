//
//  ST_PageHeader.h
//  Polldaddy
//
//  Created by John Godley on 24/05/2010.
//  Copyright 2010 Automattic. All rights reserved.
//

#import "Question.h"

@interface ST_PageHeader : Question {

}

- (boolean_t) isQuestion;
- (ST_PageHeader *) initWithTitle:(NSString *)theTitle andNote:(NSString *)theNote;

@end
