//
//  ST_Matrix.m
//  Polldaddy
//
//  Created by John Godley on 24/05/2010.
//  Copyright 2010 Automattic. All rights reserved.
//

#import "NSString+XMLEntities.h"
#import "ST_Matrix.h"


@implementation MatrixElement

@synthesize title, oID;

- (id)initWithId:(NSNumber *)theId andTitle:(NSString *)theTitle {
	self = [super init];

	oID        = [theId intValue];
	self.title = theTitle;
	return self;
}


@end

@implementation ST_Matrix

@synthesize rows, columns;

- (Question *) initWithXML:(TBXMLElement *)qnode andType:(int)qType andPage:(unsigned int)thePage {
	self = [super initWithXML:qnode andType:qType andPage:thePage];
	
	// Type of text
	choiceType = [TBXML elementInteger:@"elmType" parentElement:qnode withDefault:0];
	
	rows    = [[NSMutableArray alloc] init];
	columns = [[NSMutableArray alloc] init];
	
	// Parse the rows
	TBXMLElement  *opt;
	NSNumber      *key;
	MatrixElement *element;
	
	// Step through the option nodes
	TBXMLElement *node = [TBXML childElementNamed:@"options" parentElement:qnode];
	while ( node ) {
		// Step through the sub-options
		opt = [TBXML childElementNamed:@"option" parentElement:node];
		
		while ( opt ) {
			key = [NSNumber numberWithInt:[[TBXML valueOfAttributeNamed:@"oID" forElement:opt] integerValue]];

			element = [[MatrixElement alloc] initWithId:key andTitle:[[TBXML textForElement:opt] stringByDecodingHTMLEntities]];

			// Add to row or answer dictionary, keyed on oID
			if ( [[TBXML valueOfAttributeNamed:@"oType" forElement:node] isEqualToString:@"cols"] )
				[columns addObject:element];
			else
				[rows addObject:element];
			
			
			opt = [TBXML nextSiblingNamed:@"option" searchFromElement: opt];
		}

		node = [TBXML nextSiblingNamed:@"options" searchFromElement: node];
	}
		
	return self;
}

- (NSString *)rowForId:(unsigned int)rowId {
	for ( MatrixElement *element in rows ) {
		if ( element.oID == rowId )
			return element.title;
	}
	return nil;
}

- (NSString *)columnForId:(unsigned int)colId {
	for ( MatrixElement *element in columns ) {
		if ( element.oID == colId )
			return element.title;
	}
	return nil;
}

- (unsigned int)columnIDForPos:(unsigned int)col {
	unsigned int step = 0;
	
	for ( NSString *key in columns ) {
		if ( step == col )
			return [key integerValue];
		
		step++;
	}
	
	return 0;
}

- (unsigned int)rowIDForPos:(unsigned int)row {
	unsigned int step = 0;

	for ( NSString *key in rows ) {
		if ( step == row )
			return [key integerValue];
		
		step++;
	}
	
	return 0;
}

- (BOOL) isSingleChoice {
	if ( choiceType == 0 || choiceType == 2 )
		return YES;
	return NO;
}


-(NSString *) description {
	NSMutableString *answerText = [[NSMutableString alloc] init];
	
	for (MatrixElement *element in rows) {
		[answerText appendFormat:@"\nrow %d=%@", element.oID, element.title];
	}

	for (MatrixElement *element in columns) {
		[answerText appendFormat:@"\ncol %d=%@", element.oID, element.title];
	}
	
	NSString *text = [NSString stringWithFormat:@"%@\nType=%d%@", [super description], choiceType, answerText];
	return text;
}

@end
