//
//  ST_PageHeader.m
//  Polldaddy
//
//  Created by John Godley on 24/05/2010.
//  Copyright 2010 Automattic. All rights reserved.
//

#import "ST_PageHeader.h"


@implementation ST_PageHeader

- (ST_PageHeader *) initWithTitle:(NSString *)theTitle andNote:(NSString *)theNote {
	self = [super init];

	self.title = theTitle;
	self.note  = theNote;

	surveyId     = 0;
	questionType = 1900;
	return self;
}

- (boolean_t) isQuestion {
	return FALSE;
}

@end
