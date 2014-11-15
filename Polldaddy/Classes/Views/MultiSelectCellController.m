//
//  MultiSelectCellController.m
//  MultiRowSelect
//
//  Created by Matt Gallagher on 11/01/09.
//  Copyright 2008 Matt Gallagher. All rights reserved.
//
//  Permission is given to use this source code file, free of charge, in any
//  project, commercial or otherwise, entirely at your risk, with the condition
//  that any redistribution (in part or whole) of source code must retain
//  this copyright and permission notice. Attribution in compiled projects is
//  appreciated but not required.
//

#import "MultiSelectCellController.h"
#import "MultiSelectTableViewCell.h"
#import "LiveSurveySelectionViewController.h"

const NSInteger SELECTION_INDICATOR_TAG = 54321;
const NSInteger TEXT_LABEL_TAG = 54322;
const NSInteger BLANK_LABEL_TAG = 54323;
const NSInteger ACTIVITY_TAG = 54324;
const NSInteger STATUS_LABEL_TAG = 54325;

@implementation MultiSelectCellController

@synthesize label, surveyId, selected, loading, statusText;

//
// init
//
// Init method for the object.
//
- (id)initWithLabel:(NSString *)newLabel andSurveyId:(unsigned int)theSurveyId {
	self = [super init];

	label    = newLabel;
	surveyId = theSurveyId;
	selected = NO;
    loading  = NO;
    statusText = nil;

	return self;
}

//
// dealloc
//
// Releases instance memory.
//

//
// clearSelectionForTableView:
//
// Clears the selection for the given table
//
- (void)clearSelectionForTableView:(UITableView *)tableView indexPath:(NSIndexPath *)indexPath
{
	if (selected)
	{
		[self tableView:tableView didSelectRowAtIndexPath:indexPath];
		selected = NO;
	}
}

- (void)showCell:(UITableViewCell *)cell {
    UIImageView             *indicator = (UIImageView *)[cell viewWithTag:SELECTION_INDICATOR_TAG];
    UIView                  *blank = (UIImageView *)[cell viewWithTag:BLANK_LABEL_TAG];
    UIActivityIndicatorView *activity = (UIActivityIndicatorView *)[cell viewWithTag:ACTIVITY_TAG];
    UILabel                 *status = (UILabel *)[cell viewWithTag:STATUS_LABEL_TAG], *textLabel = (UILabel *)[cell viewWithTag:TEXT_LABEL_TAG];

    if ( statusText )
        [status setText:statusText];
    
    cell.backgroundView.backgroundColor = [UIColor clearColor];

    if ( selected == YES ) {
        [activity stopAnimating];
        indicator.hidden = NO;
        
		if (UI_USER_INTERFACE_IDIOM() == UIUserInterfaceIdiomPad)
			indicator.image = [UIImage imageNamed:@"IsSelected.png"];
		else
			indicator.image = [UIImage imageNamed:@"IsSelected-iPhone.png"];

        cell.backgroundView.backgroundColor = [UIColor colorWithRed:230.0/255.0 green:230.0/255.0 blue:230.0/255.0 alpha:1.0];
    }
    else if ( loading == YES ) {
        // No, begin loading indicator
        indicator.hidden = YES;
        
        // Show the activity indicator
        [activity startAnimating];
    }
    else {
        [activity stopAnimating];
        indicator.hidden = NO;
        
		if (UI_USER_INTERFACE_IDIOM() == UIUserInterfaceIdiomPad)
			indicator.image = [UIImage imageNamed:@"NotSelected.png"];
		else
			indicator.image = [UIImage imageNamed:@"NotSelected-iPhone.png"];
    }
    

    // Copy background colours from the cell
    blank.backgroundColor     = cell.backgroundView.backgroundColor;
    indicator.backgroundColor = cell.backgroundView.backgroundColor;
    blank.backgroundColor     = cell.backgroundView.backgroundColor;
    textLabel.backgroundColor = cell.backgroundView.backgroundColor;

    // Set the text
	textLabel.text = label;
    status.text    = statusText;
}

- (void)selected:(UITableViewCell *)cell {
    if ( selected == YES ) {
        // Row is already selected, de-select it
        selected = NO;
        loading  = NO;

        statusText = @"";
    }
    else if ( loading == NO ) {
        loading    = YES;
        statusText = @"Loading...";
    }
    else {
        statusText = @"Done!";

        selected = YES;
        loading  = NO;
    }
    
    [self showCell:cell];
}

//
// tableView:didSelectRowAtIndexPath:
//
// Marks the current row if editing is enabled.
//
- (void)tableView:(UITableView *)tableView didSelectRowAtIndexPath:(NSIndexPath *)indexPath {
	UITableViewCell *cell = [tableView cellForRowAtIndexPath:[(LiveSurveySelectionViewController *)tableView.delegate indexPathForCellController:self]];
	
	if (cell) {
        [self selected:cell];
	}
}

-(void) setStatus:(NSString *)text forCell:(UITableViewCell *)cell {
    UILabel *stat = (UILabel *)[cell viewWithTag:STATUS_LABEL_TAG];


    statusText = text;
    [stat setText:text];
}

//
// tableView:cellForRowAtIndexPath:
//
// Constructs and configures the MultiSelectTableViewCell for this row.
//
- (UITableViewCell *)tableView:(UITableView *)tableView cellForRowAtIndexPath:(NSIndexPath *)indexPath {
	static NSString *cellIdentifier = @"MultiSelectCellController";
	UITableViewCell *cell = [tableView dequeueReusableCellWithIdentifier:cellIdentifier];

	if ( !cell ) {
        UIImageView     *indicator;
        UIView          *blank;
        UIView          *line;
        UILabel         *textLabel, *statusLabel;
        
        UIActivityIndicatorView *activity;

		unsigned int rowHeight = 40, textOffset = 30;
		NSInteger IMAGE_SIZE;
		NSInteger SIDE_PADDING;
		
		// Create indicator image
		if ( UI_USER_INTERFACE_IDIOM() == UIUserInterfaceIdiomPad ) {
			IMAGE_SIZE   = 30;
			SIDE_PADDING = 40;
			
			rowHeight = 90;
		}
		else {
			IMAGE_SIZE   = 20;
			SIDE_PADDING = 30;
            textOffset   = 8;
		}

		line = [[UIView alloc] initWithFrame:CGRectMake(0, rowHeight - 1, tableView.frame.size.width * 2, 1)];
		line.backgroundColor = [UIColor colorWithRed:220/255.0 green:220/255.0 blue:220/255.0 alpha:1.0];
		
		blank = [[UIView alloc] initWithFrame:CGRectMake(0, 0, tableView.frame.size.width * 2, rowHeight - 1)];
		blank.backgroundColor = [UIColor clearColor];
		blank.tag             = BLANK_LABEL_TAG;
		
        indicator = [[UIImageView alloc] init];

		indicator.tag   = SELECTION_INDICATOR_TAG;
		indicator.frame = CGRectMake( 15, ( rowHeight - IMAGE_SIZE ) / 2, IMAGE_SIZE, IMAGE_SIZE);
		indicator.backgroundColor = [UIColor clearColor];
        
        activity = [[UIActivityIndicatorView alloc] initWithActivityIndicatorStyle:UIActivityIndicatorViewStyleGray];
        activity.tag   = ACTIVITY_TAG;
		activity.backgroundColor = [UIColor clearColor];

        if ( UI_USER_INTERFACE_IDIOM() == UIUserInterfaceIdiomPad )
            activity.frame = CGRectMake( 20, 35, activity.frame.size.width, activity.frame.size.height );
        else
            activity.frame = CGRectMake( 15, 11, activity.frame.size.width, activity.frame.size.height );

		// Create text label
		textLabel = [[UILabel alloc] initWithFrame:CGRectMake(SIDE_PADDING + 13, textOffset, tableView.frame.size.width - IMAGE_SIZE, 25)];
		textLabel.tag       = TEXT_LABEL_TAG;
		textLabel.textColor = [UIColor colorWithRed:1.0/255.0 green:130.0/255.0 blue:168.0/255.0 alpha:1.0];
		textLabel.backgroundColor = [UIColor clearColor];

		if ( UI_USER_INTERFACE_IDIOM() == UIUserInterfaceIdiomPad )
			textLabel.font = [UIFont fontWithName:@"American Typewriter" size:20];
		else
			textLabel.font = [UIFont fontWithName:@"American Typewriter" size:16];

        // Small status label
		statusLabel = [[UILabel alloc] initWithFrame:CGRectMake(SIDE_PADDING + 13, 60, tableView.frame.size.width - IMAGE_SIZE, 20)];
		statusLabel.tag       = STATUS_LABEL_TAG;
		statusLabel.textColor = [UIColor lightGrayColor];
		statusLabel.backgroundColor = [UIColor clearColor];
        statusLabel.font = [UIFont fontWithName:@"Helvetica" size:14];
        
		if ( UI_USER_INTERFACE_IDIOM() == UIUserInterfaceIdiomPhone )
            statusLabel.hidden = YES;   // Dont bother showing to iPhone users - no room for it
        
		// Now create the cell itself
		cell = [[MultiSelectTableViewCell alloc] initWithStyle:UITableViewCellStyleDefault reuseIdentifier:cellIdentifier];
        
        cell.frame          = CGRectMake(0, 0, tableView.frame.size.width, rowHeight);
		cell.selectionStyle = UITableViewCellSelectionStyleNone;
		cell.backgroundView = [[UIView alloc] init];
		
		// Add the image and text to the cell
		[cell addSubview:blank];
		[cell addSubview:indicator];
        [cell addSubview:activity];
		[cell addSubview:textLabel];
		[cell addSubview:line];
		[cell addSubview:statusLabel];
	}

    [self showCell:cell];

	return cell;
}

@end
