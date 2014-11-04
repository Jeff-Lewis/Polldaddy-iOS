//
//  UI_MultiChoice.m
//  Polldaddy
//
//  Created by John Godley on 27/05/2010.
//  Copyright 2010 Automattic. All rights reserved.
//

#import "UI_Matrix.h"
#import "Question.h"
#import "ST_Matrix.h"
#import "NSString+XMLEntities.h"
#import "Constants.h"
#import "Language.h"

extern UIInterfaceOrientation gAppOrientation;

@implementation UI_Matrix

@synthesize question;

// Return a label with all the options set. Include any font settings here
-(UILabel *)allocEmptyLabel {
	UILabel *label = [[UILabel alloc] init];
	
	if ( [Constants isIphone] )
		label.font            = [UIFont systemFontOfSize: 12];

	label.backgroundColor = [UIColor clearColor];
	label.textColor       = [UIColor grayColor];
	label.lineBreakMode   = NSLineBreakByWordWrapping;
	label.numberOfLines   = 0;
	
	return label;
}

-(BOOL) calculateColumns:(unsigned int)width {
	// We set the max size to be bigger than we want so we can detect when it doesnt fit (i.e. the height will be too big)
	CGSize   maxSize = CGSizeMake( width, [Constants matrixMaxHeight] * 2 );
	UILabel *label   = [self allocEmptyLabel];
	
	colWidth = colHeight = 0;

	// Calculate the heights and widths of various parts
	for ( MatrixElement *element in question.columns ) {
		CGSize expected = [element.title sizeWithFont:label.font constrainedToSize:maxSize lineBreakMode:label.lineBreakMode];

		// If the  height is bigger than our biggest height then just drop out
		if ( expected.height > [Constants matrixMaxHeight] ) {
			return NO;
		}

		// We want to fit at least the first word horizontally. If we can't then bail and try again
		NSArray *lines = [element.title componentsSeparatedByString:@" "];
		CGSize   word = [[lines objectAtIndex:0] sizeWithFont:label.font];

		if ( word.width >= expected.width ) {
			return NO;
		}
	
		if ( expected.width > colWidth )
			colWidth = expected.width;
		
		if ( expected.height > colHeight )
			colHeight = expected.height;
	}
	
	if ( colWidth < [Constants matrixColMin] )
		colWidth = [Constants matrixColMin];
	
	if ( colHeight < [Constants matrixMinHeight] )
		colHeight = [Constants matrixMinHeight];
	
	return YES;
}

-(void) autoSize {
	// Is there any room to expand the table?
	unsigned int width = rowWidth + ( ( colWidth + [Constants matrixColPadding] ) * [question.columns count] );
	UILabel *label     = [self allocEmptyLabel];

	if ( width < [self getMaxFrameWidth] ) {
		// We have an extra bit of width to play with
		CGSize       expected, maxSize, biggest = CGSizeMake( 0, 0 );
		unsigned int extra = [self getMaxFrameWidth] - width - ( [question.rows count] * [Constants matrixColPadding]);
		NSString     *bText = nil;
		
		// Will expanding the row labels have any effect? Look for a row label that is longer than the current row width
		for ( MatrixElement *element in question.rows ) {
			// Get the width without any multi-lining
			expected = [element.title sizeWithFont:label.font];

			if ( expected.width > biggest.width ) {
				biggest = expected;
				bText   = element.title;
			}
		}

		if ( biggest.width > rowWidth && bText != nil ) {
			// We have the biggest label. Expand our row width to fit the extra
			if ( rowWidth + extra > biggest.width )
				rowWidth = biggest.width;
			else
				rowWidth += extra;
			
			// Recalculate the rowHeight
			maxSize   = CGSizeMake( rowWidth, [Constants matrixMaxHeight] );
			expected  = [bText sizeWithFont:label.font constrainedToSize:maxSize lineBreakMode:label.lineBreakMode];
			rowHeight = expected.height;
		}
		
		// Do we still have any room to expand the columns?
		width = rowWidth + ( ( colWidth + [Constants matrixColPadding] ) * [question.columns count] );
		if ( width < [self getMaxFrameWidth] ) {
			extra = [self getMaxFrameWidth] - width - ( [question.columns count] * [Constants matrixColPadding]);

			// Nudge the widths up
			colWidth += ( extra / [question.columns count] );
			colWidth -= [Constants matrixColPadding];
			
			colHeight = 0;
			
			// Now recalculate the height of the largest column
			for ( MatrixElement *element in question.columns ) {
				maxSize   = CGSizeMake( colWidth, [Constants matrixMaxHeight] );
				expected  = [element.title sizeWithFont:label.font constrainedToSize:maxSize lineBreakMode:label.lineBreakMode];
			
				if ( expected.height > colHeight )
					colHeight = expected.height;
			}
		}
	}
	
	if ( rowWidth < [Constants matrixRowMin] )
		rowWidth = [Constants matrixRowMin];
	
	if ( rowHeight < [Constants matrixMinHeight] )
		rowHeight = [Constants matrixMinHeight];

}

// Calculate the row sizes. Lot simpler than columns
-(void) calculateRows {
	CGSize   maxSize = CGSizeMake( [Constants matrixRowMax], [Constants matrixMaxHeight] );
	UILabel *label   = [self allocEmptyLabel];
	
	rowWidth = rowHeight = 0;
	
	// Find the largest row size
	for ( MatrixElement *element in question.rows ) {
		CGSize expected = [element.title sizeWithFont:label.font constrainedToSize:maxSize lineBreakMode:label.lineBreakMode];
		
		if ( expected.width > rowWidth )
			rowWidth = expected.width;
		
		if ( expected.height > rowHeight )
			rowHeight = expected.height;
	}

	// Make sure the values are at above the minimum sizes
	if ( rowWidth < [Constants matrixRowMin] )
		rowWidth = [Constants matrixRowMin];

	if ( rowHeight < [Constants matrixMinHeight] )
		rowHeight = [Constants matrixMinHeight];
	
}

-(void) doAllTheFunkyCalculations {
	unsigned int width = [Constants matrixColMin];
	
	// Try and calculate the best fit for width if landscape, or height if portrait
	while ( [self calculateColumns:width] == NO && width < [Constants matrixColMax] ) {
		width += [Constants matrixColMin];
	}
    
    if ( [self calculateColumns:width] == NO ) {
        if ( colWidth < [Constants matrixColMin] )
            colWidth = [Constants matrixColMin];
        
        if ( colHeight < [Constants matrixMinHeight] )
            colHeight = [Constants matrixMinHeight];
    }
	
	// Calculate the row label widths
	[self calculateRows];
	
	// Auto-size the table to fit the screen width, giving preference to row labels first
	[self autoSize];	
}

// Loop through from shortest width to biggest and see which fits the text (fit = height < max height)
- initWithQuestion:(ST_Matrix *)theQuestion andPack:(Language *)thePack {
	self = [super init];
	
	question = theQuestion;
    pack = thePack;

	[self doAllTheFunkyCalculations];
	
	return self;
}

- (NSString *) getError {
	if ( [question isSingleChoice] )
		return [pack getPhrase:PHRASE_MATRIX_ONE];
	return [pack getPhrase:PHRASE_MATRIX_ATLEASTONE];
}

- (boolean_t) isCompleted {
	unsigned int rowsWithItems = 0;
	
	// Look for at least 1 item in any row
	for ( NSNumber *row in selectedItems ) {
		if ( [(NSMutableArray *)[selectedItems objectForKey:row] count] > 0 )
			rowsWithItems++;
	}

	if ( rowsWithItems == [question.rows count] )
		return YES;
	return NO;
}

- (NSString *) collectData {
	NSMutableString *data = [NSMutableString stringWithString:@"<options>"];
	MatrixElement   *element;
	
	// Go through the selectedItems which are rowPosition => array of columnPosition
	for ( NSNumber *row in selectedItems ) {
		NSMutableString *colID = [[NSMutableString alloc] init];

		// For each column position, get the colID from the question and join together
		for ( NSNumber *col in [selectedItems objectForKey:row] ) {
			element = [question.columns objectAtIndex:[col intValue]];
			
			[colID appendFormat:@"%d,", element.oID];
		}

		element = [question.rows objectAtIndex:[row intValue]];
		[data appendFormat:@"<option rowID=\"%d\" colID=\"%@\" />", element.oID, [colID stringByTrimmingCharactersInSet:[NSCharacterSet characterSetWithCharactersInString:@","]]];
	}
	
	[data appendString:@"</options>"];
	return data;
}

- (unsigned int) getMatrixWidth {
	return ( [question.columns count] * colWidth ) + rowWidth + ( [question.columns count] * [Constants matrixColPadding] );
}

- (unsigned int) getMatrixHeight {
	return ( [question.rows count] * rowHeight ) + colHeight + ( [question.rows count] * [Constants matrixRowPadding] );
}

// Scroll fills the full height of the frame
- (CGRect) getScrollerFrame {
	unsigned int height = [self getMatrixHeight];
	
	// Restrict to height of screen
	if ( [Constants isIpad] ) {
		if ( height > [self getMaxFrameHeight] - originPoint.y - 50 )
			height = [self getMaxFrameHeight] - originPoint.y - 50;
	}
	else {
		if ( UIInterfaceOrientationIsPortrait( gAppOrientation ) ) {
			if ( height > [self getMaxFrameHeight] - originPoint.y - 55)
				height = [self getMaxFrameHeight] - originPoint.y - 55;
		}
		else {
			if ( height > [self getMaxFrameHeight] - originPoint.y - 5 )
				height = [self getMaxFrameHeight] - originPoint.y - 5;
		}
	}

	// Ensure the title + note does not cause the matrix to display in the toolbar area
	unsigned int maxheight = [self getMaxFrameHeight] - lastPoint.y + [Constants innerFrameYOffset];

	height = MIN( height, maxheight );
	
	return CGRectMake( 0, 0, [self getMaxFrameWidth], height );
}

- (CGRect) getFrame {
	CGRect frame = [self getScrollerFrame];

	frame.origin.x = lastPoint.x;
	frame.origin.y = lastPoint.y;
	return frame;
}

-(void)buttonEvent:(id)sender {
	UIButton     *button = (UIButton *) sender;
	unsigned long  row, col;
	
	// Calculate the row and column picked
	row = floor( ( button.tag - 1 ) / [question.columns count] );
	col = ( button.tag - 1 ) % [question.columns count];

	NSMutableArray *rowArray = [selectedItems objectForKey:[NSNumber numberWithLong:row]];
	
	if ( rowArray ) {
		// If this a single choice matrix then we're only allowed 1 choice per row
		if ( [question isSingleChoice] ) {
			// Clear the array
			[rowArray removeAllObjects];
			
			// Unselect all the buttons for this row
			UIButton *but;
			for ( unsigned long tag = 1 + ( row * [question.columns count] ); tag < 1 + ( row + 1 ) * [question.columns count]; tag++ ) {
				but = (UIButton *)[self.view viewWithTag:tag];
				if ( but )
					but.selected = NO;
			}
		}
	}
	else {
		// Now choice exists - create an array of column choices
		rowArray = [[NSMutableArray alloc] init];
	}

	// Add the choice
	[rowArray addObject:[NSNumber numberWithLong:col]];
	
	// Push back into the dictionary
	[selectedItems setObject:rowArray forKey:[NSNumber numberWithLong:row]];


	// Toggle the button selected state of the button just pressed
	button.selected = !button.selected;
}

// Implement viewDidLoad to do additional setup after loading the view, typically from a nib.
-(void) displayQuestion {
	selectedItems = [[NSMutableDictionary alloc] init];
	
    colWidth = [Constants matrixColMin];
    
	// Set our size
	[self.view setFrame:[self getFrame]];

	// Without these the frame resizes to the height of the text field, meaning that it cuts off the 'hit' area of the field
	self.view.autoresizingMask    = NO;
	self.view.autoresizesSubviews = NO;

	scroller         = [[UIScrollView alloc] initWithFrame:[self getScrollerFrame]];
	scroller.bounces = YES;

	[self.view addSubview:scroller];
	
	UILabel  *label;
	UIButton *button;
	
	CGRect       row = CGRectMake( 0, colHeight, rowWidth, rowHeight );
	CGRect       col = CGRectMake( rowWidth, 0, colWidth, colHeight );
	unsigned int tag = 10000;

	// Show column titles
	for ( MatrixElement *element in question.columns ) {
		// Column label
		label               = [self allocEmptyLabel];
		label.text          = element.title;
		label.textAlignment = NSTextAlignmentCenter;
		label.frame         = col;
		label.tag           = tag++;
		
		[scroller addSubview:label];
		
		// Move across
		col.origin.x += colWidth;
		col.origin.x += [Constants matrixColPadding];
	}
	
	unsigned int buttonCount = 1;
	
	tag = 20000;
	
	// Show rows
	for ( MatrixElement *element in question.rows ) {
		// Row label
		label       = [self allocEmptyLabel];
		label.text  = element.title;
		label.frame = row;
		label.tag   = tag++;

		[scroller addSubview:label];
		
		// Button position
		col = CGRectMake(rowWidth, row.origin.y, colWidth, rowHeight);

		// Row buttons
		for ( NSString *key in question.columns ) {
			// Column label
            NSLog(@"key: %@", key);
			button = [[UIButton alloc] initWithFrame:col];
			
			// Set the tag so we know which row+col this button is for
			button.tag = buttonCount++;
			
			// Hook up the target
			[button addTarget:self action:@selector(buttonEvent:) forControlEvents:UIControlEventTouchUpInside];     

			// Set images for the checkbox
			if ( [Constants isIpad] ) {
				[button setImage:[UIImage imageNamed:@"IsSelected.png"] forState:UIControlStateSelected];
				[button setImage:[UIImage imageNamed:@"NotSelected.png"] forState:UIControlStateNormal];
			}
			else {
				[button setImage:[UIImage imageNamed:@"IsSelected-iPhone.png"] forState:UIControlStateSelected];
				[button setImage:[UIImage imageNamed:@"NotSelected-iPhone.png"] forState:UIControlStateNormal];
			}

			// Add the button
			[scroller addSubview:button];
			
			// Move across
			col.origin.x += colWidth;
			col.origin.x += [Constants matrixColPadding];
		}
		
		// Move the next row down
		row.origin.y += rowHeight;
		row.origin.y += [Constants matrixRowPadding];
	}

	// Set the size of the scroller
	scroller.contentSize = CGSizeMake( [self getMatrixWidth], [self getMatrixHeight] );
	[scroller flashScrollIndicators];
    
    [self willAnimateRotationToInterfaceOrientation:gAppOrientation duration:0.1];
}

-(BOOL)shouldAutorotate {
    return YES;
}

-(NSUInteger)supportedInterfaceOrientations {
    return UIInterfaceOrientationMaskAll;
}

- (void)willAnimateRotationToInterfaceOrientation:(UIInterfaceOrientation)interfaceOrientation duration:(NSTimeInterval)duration{
	// Recalculate all the dimensions
	[self doAllTheFunkyCalculations];
	
	// Move everything about
	UILabel  *label;
	UIButton *button;
	
	CGRect       row = CGRectMake( 0, colHeight, rowWidth, rowHeight );
	CGRect       col = CGRectMake( rowWidth, 0, colWidth, colHeight );
	unsigned int tag = 10000, buttonCount = 1;
	
	// Move column titles
	for ( NSString *key in question.columns ) {
		NSLog(@"key: %@", key);
        
        // Get column label using tag
		label = (UILabel *)[self.view viewWithTag:tag++];
		
		if ( label ) {
			// Reposition it
			label.frame = col;
		}

		col.origin.x += colWidth;
		col.origin.x += [Constants matrixColPadding];
	}
	
	tag = 20000;
	
	// Move rows
	for ( MatrixElement *element in question.rows ) {
		// Row label
		label = (UILabel *)[self.view viewWithTag:tag++];
		if ( label ) {
			label.frame = row;
			
			// Button position
			col = CGRectMake(rowWidth, row.origin.y, colWidth, rowHeight);
			
			// Row buttons
			for ( MatrixElement *column in question.columns ) {
				// Column label
				button = (UIButton *)[self.view viewWithTag:buttonCount++];
				button.frame = col;
				
				// Set images for the checkbox
				// Move across
				col.origin.x += colWidth;
				col.origin.x += [Constants matrixColPadding];
			}
		}
		
		// Move the next row down
		row.origin.y += rowHeight;
		row.origin.y += [Constants matrixRowPadding];
	}
	
	// Update the scroller
	scroller.contentSize = CGSizeMake( [self getMatrixWidth], [self getMatrixHeight]);

	// Reset the positions of the various items
	[self.view setFrame:[self getFrame]];
	[scroller setFrame:[self getScrollerFrame]];
	
	[scroller flashScrollIndicators];
}

- (void)didReceiveMemoryWarning {
	// Releases the view if it doesn't have a superview.
	[super didReceiveMemoryWarning];
}

- (void)dealloc {
	
	for ( UIView *theView in scroller.subviews ) {
		[theView removeFromSuperview];
	}

	[scroller removeFromSuperview];
}


@end
