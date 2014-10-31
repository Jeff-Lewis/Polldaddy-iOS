//
//  ST_PageHeader.m
//  Polldaddy
//
//  Created by John Godley on 24/05/2010.
//  Copyright 2010 Automattic. All rights reserved.
//

#import "ST_QuizResults.h"


@implementation ST_QuizResults

- (boolean_t) isQuestion {
	return FALSE;
}

- (ST_QuizResults *) initWithTitle:(NSString *)theTitle andNote:(NSString *)theNote {
	self = [super init];
	
	self.title = theTitle;
	self.note  = theNote;
	questionType = 19;
	return self;
}

@end
