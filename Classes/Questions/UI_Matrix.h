//
//  UI_Matrix.h
//  Polldaddy
//
//  Created by John Godley on 27/05/2010.
//  Copyright 2010 Automattic. All rights reserved.
//

#import "UI_Question.h"

@class ST_Matrix, Language;

@interface UI_Matrix : UI_Question {
	ST_Matrix *question;
	
	UIScrollView        *scroller;
	NSMutableDictionary *selectedItems;
	
	unsigned int rowHeight;
	unsigned int rowWidth;
	
	unsigned int colHeight;
	unsigned int colWidth;
}

@property (nonatomic, strong) ST_Matrix *question;

- initWithQuestion:(ST_Matrix *)theQuestion andPack:(Language *)pack;

- (NSString *) collectData;
- (boolean_t) isCompleted;
- (NSString *) getError;
- (void) displayQuestion;

@end
