//
//  ST_Matrix.h
//  Polldaddy
//
//  Created by John Godley on 24/05/2010.
//  Copyright 2010 Automattic. All rights reserved.
//

#import "Question.h"

@interface MatrixElement : NSObject {
	unsigned int  oID;
	NSString     *title;
}

@property (nonatomic, copy) NSString *title;
@property (nonatomic, readonly) unsigned int oID;

- (id)initWithId:(NSNumber *)theId andTitle:(NSString *)theTitle;
@end

@interface ST_Matrix : Question {
	long       choiceType;
	
	NSMutableArray *rows;
	NSMutableArray *columns;
}

@property (nonatomic, copy, readonly) NSMutableArray *rows, *columns;

- (Question *) initWithXML:(TBXMLElement *)qnode andType:(int)qType andPage:(unsigned int)thePage;
- (NSString *) description;
- (BOOL) isSingleChoice;

// Return a rowID or colID given a position within the array
- (unsigned long)columnIDForPos:(unsigned long)col;
- (unsigned long)rowIDForPos:(unsigned long)row;
- (NSString *)rowForId:(unsigned long)rowId;
- (NSString *)columnForId:(unsigned long)colId;

@end
