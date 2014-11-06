//
//  UI_DateTime.m
//  Polldaddy
//
//  Created by Eoin Gallagher on 27/05/2010.
//  Copyright 2010 Automattic. All rights reserved.
//

#import "UI_DateTime.h"
#import "Question.h"
#import "ST_DateTime.h"
#import "Constants.h"
#import "DatePickerPopup.h"
#import "PolldaddyAppDelegate.h"
#import "Language.h"

@implementation UI_DateTime

extern UIInterfaceOrientation gAppOrientation;

- initWithQuestion:(ST_DateTime *)theQuestion andPack:(Language *)thePack;{
	self = [super init];
	
	displayingPicker = NO;
	question = theQuestion;
    pack = thePack;
	return self;
}

- (boolean_t) isCompleted {
	if ( selectedDate != nil )
		return YES;
	return NO;
}

- (NSString *) getError {
	if ( [self isCompleted] == NO )
		return [pack getPhrase:PHRASE_MANDATORY];
	return @"";
}

- (NSString *) collectData {
	// Get the text, encoding any XML
	NSString *month, *day, *year, *hour, *minute;

	NSDateFormatter *df = [[NSDateFormatter alloc] init];
	[df setDateFormat:@"yyyy"];

	year = month = day = minute = hour = @"";
	if ( selectedDate ) {
		year = [df stringFromDate:selectedDate];
		
		[df setDateFormat:@"M"];
		month = [df stringFromDate:selectedDate];
		
		[df setDateFormat:@"d"];
		day = [df stringFromDate:selectedDate];
	}
	
	if ( selectedTime ) {
		[df setDateFormat:@"H"];
		hour = [df stringFromDate:selectedTime];
		
		[df setDateFormat:@"mm"];
		minute = [df stringFromDate:selectedTime];
	}


	// Create the XML for my answer
	NSString *myData  = @"";

	//Format the date based on question date type
	switch ( [question getDateType] ) {
		case 4:
			//just time
			myData = [NSString stringWithFormat:@"<h>%@</h><m>%@</m>", hour,minute];
			break;
			
		case 2:
		case 3:
			//just date
			myData = [NSString stringWithFormat:@"<mm>%@</mm><dd>%@</dd><yyyy>%@</yyyy>", month,day,year];
			break;
			
		default:
			//both date and time
			myData = [NSString stringWithFormat:@"<mm>%@</mm><dd>%@</dd><yyyy>%@</yyyy><h>%@</h><m>%@</m>", month,day,year,hour,minute];
			break;
	}	 
	
	return myData;
}

- (CGRect) getFieldSize {
	return CGRectMake( 0, 0, ( [self getMaxFrameWidth]), 250 );
}

- (CGRect) getRectSize {
	// Our frame needs to be just big enough to hold the UITextField - any bigger and we wont be able to click on other items on the page
	return CGRectMake( 0, 0, [self getMaxFrameWidth], [self getMaxFrameHeight] );
}

- (void)pickDate:(id)sender {
	UIButton *button = (UIButton *)sender;

	datePicker = [[DatePickerController alloc] initWithType:button.tag];
    datePicker.delegate = self;

	// Oh crappy code... I just cannot get the modalcontroller to work properly
	PolldaddyAppDelegate *delegate = [[UIApplication sharedApplication] delegate];
	displayingPicker = YES;
	
	[delegate.rootViewController.view addSubview:datePicker.view];
}

- (void) setButtonPositions {
	unsigned int yPos = lastPoint.y;

	if ( [question getDateType] != 4 ) {
		[pickDate setFrame:CGRectMake( [Constants innerFrameXOffset], yPos, 180, [Constants textEditHeight] + [Constants labelBottomPadding] * 2 )];
		yPos += [Constants textEditHeight] + [Constants labelBottomPadding] * 3;
	}
	
	if (  [question getDateType] == 4 || [question getDateType] == 0 || [question getDateType] == 1 )
		[pickTime setFrame:CGRectMake( [Constants innerFrameXOffset], yPos, 180, [Constants textEditHeight] + [Constants labelBottomPadding] * 2 )];
}

- (void) datePickerController:(DatePickerController *)theController didPickDate:(NSDate *)date andType:(unsigned int)type {
	[self setButtonPositions];
	[self.view setFrame:[self getRectSize]];

	if ( date ) {
		NSDateFormatter *dateFormatter = [[NSDateFormatter alloc] init];

		if ( type == 1 ) {
			selectedDate = date;
			
			[dateFormatter setTimeStyle:NSDateFormatterNoStyle];		
			[dateFormatter setDateStyle:NSDateFormatterMediumStyle];
			[pickDate setTitle:[dateFormatter stringFromDate:date] forState:UIControlStateNormal];
		}
		else {
			selectedTime = date;
			
			[dateFormatter setTimeStyle:NSDateFormatterShortStyle];		
			[dateFormatter setDateStyle:NSDateFormatterNoStyle];
			[pickTime setTitle:[dateFormatter stringFromDate:date] forState:UIControlStateNormal];
		}
		
	}

	displayingPicker = NO;
	[theController.view removeFromSuperview];
}

// Implement viewDidLoad to do additional setup after loading the view, typically from a nib.
-(void) displayQuestion {
	// Our UITextField needs to be position at 0,0 within the frame
	[self.view setFrame:[self getRectSize]];

	// Add buttons to page for date and time
	if ( [question getDateType] != 4 ) {
		pickDate = [UIButton buttonWithType:UIButtonTypeRoundedRect];
		[pickDate setTitle:[pack getPhrase:PHRASE_SELECT_DATE] forState:UIControlStateNormal];
		[self.view addSubview:pickDate];
		[pickDate setTag:1];
		
		// Hook up the button
		[pickDate addTarget:self action:@selector(pickDate:) forControlEvents:UIControlEventTouchDown];
	}

	if ( [question getDateType] == 4 || [question getDateType] == 0 || [question getDateType] == 1 ) {
		pickTime = [UIButton buttonWithType:UIButtonTypeRoundedRect];
		[pickTime setTitle:[pack getPhrase:PHRASE_SELECT_TIME] forState:UIControlStateNormal];
		[pickTime setTag:2];

		// Hook up the button
		[pickTime addTarget:self action:@selector(pickDate:) forControlEvents:UIControlEventTouchDown];

		[self.view addSubview:pickTime];
	}
	
	[self setButtonPositions];
}

-(BOOL)shouldAutorotate {
    return YES;
}

-(NSUInteger)supportedInterfaceOrientations {
    return UIInterfaceOrientationMaskAll;
}

- (IBAction)changeDateInLabel:(id)sender{
	[sender resignFirstResponder];
}

- (void)willAnimateRotationToInterfaceOrientation:(UIInterfaceOrientation)interfaceOrientation duration:(NSTimeInterval)duration{
	if ( datePicker && displayingPicker )
		[datePicker willAnimateRotationToInterfaceOrientation:interfaceOrientation duration:duration];

	[self setButtonPositions];
	[self.view setFrame:[self getRectSize]];
}
											

@end
