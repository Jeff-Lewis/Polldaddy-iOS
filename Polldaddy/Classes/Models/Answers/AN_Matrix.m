//
//  AN_Matrix.m
//  Polldaddy
//
//  Created by John Godley on 08/07/2010.
//  Copyright 2010 Automattic. All rights reserved.
//

#import "AN_Matrix.h"
#import "ST_Matrix.h"
#import "Question.h"

@implementation MatrixChoice

@synthesize rowID, columns;


- (id)initWithRow:(unsigned int)row andColumns:(NSArray *)theColumns {
	self = [super init];
	rowID = row;
	columns = theColumns;
	return self;
}

@end

@implementation AN_Matrix

- (NSString *) summaryForQuestion:(Question *)question {
	NSMutableString *text = [[NSMutableString alloc] init];
	NSString        *choiceText;
	
	// Add choices. We need to go through the matrix rows to ensure our list is in the right order
	for ( MatrixElement *element in [(ST_Matrix *)question rows] ) {
		// Has this row been answered?
		for ( MatrixChoice *choice in choices ) {
			if ( choice.rowID == element.oID ) {
				NSMutableString *columnText = [[NSMutableString alloc] init];
				
				choiceText = [(ST_Matrix *)question rowForId:choice.rowID];
				
				for ( NSString *colID in choice.columns ) {
					if ( [columnText length] > 0 )
						[columnText appendString:@", "];
					
					[columnText appendString:[(ST_Matrix *)question columnForId:[colID intValue]]];
				}
				
				if ( choiceText && columnText )
					[text appendFormat:@"%@: %@\n", choiceText, columnText];
				
			}
		}
	}
	
	choiceText = [NSString stringWithString:text];
	return choiceText;
}

- (Answer *) initWithXML:(TBXMLElement *)node {
	self = [super initWithXML:node];
	
	NSMutableArray *mychoices = [[NSMutableArray alloc] init];
	
	TBXMLElement *opts = [TBXML childElementNamed:@"options" parentElement:node];
	if ( opts ) {
		TBXMLElement *opt = [TBXML childElementNamed:@"option" parentElement:opts];
		unsigned int rowID;
		
		while ( opt ) {
			rowID = [[TBXML valueOfAttributeNamed:@"rowID" forElement:opt] intValue];
			MatrixChoice *choice = [MatrixChoice alloc];
		
			choice = [choice initWithRow:rowID andColumns:[[TBXML valueOfAttributeNamed:@"colID" forElement:opt] componentsSeparatedByString:@","]];
			[mychoices addObject:choice];
			
			opt = [TBXML nextSiblingNamed:@"option" searchFromElement: opt];
		}
	}

	choices = mychoices;
	return self;
}


@end
