//
//  DatePickerPopup.m
//  Polldaddy
//
//  Created by John Godley on 20/07/2010.
//  Copyright 2010 Automattic. All rights reserved.
//

#import "DatePickerPopup.h"
#import "Constants.h"
#import "UI_Question.h"

@implementation DatePickerController

extern UIInterfaceOrientation gAppOrientation;

@synthesize datePicker, delegate;

- (id)initWithType:(unsigned int)type {
	self = [super init];
	
	dateType = type;
	return self;
}

- (CGRect)pickerRect {
	UI_Question *question = [[UI_Question alloc] init];
	float_t width = [question getMaxWidth];
	

	if ( [Constants isIpad] ) {
		if ( UIInterfaceOrientationIsPortrait( gAppOrientation ) )
			return CGRectMake( 0, 820, width, 215 );
		
		return CGRectMake( 0, 565, width, 215 );
	}
	else {
	 if ( UIInterfaceOrientationIsPortrait( gAppOrientation ) )
		 return CGRectMake( 0, 215, width, 216 );

	 return CGRectMake( 0, 110, width, 160 );
	}
}

- (CGRect)toolbarRect {
	UI_Question *question = [[UI_Question alloc] init];
	float_t      width = [question getMaxWidth];
	
	
	if ( [Constants isIpad] ) {
		if ( UIInterfaceOrientationIsPortrait( gAppOrientation ) )
			return CGRectMake( 0, 790, width, 30 );
		
		return CGRectMake( 0, 535, width, 30 );
	}
	else {
		if ( UIInterfaceOrientationIsPortrait( gAppOrientation ) )
			return CGRectMake( 0, 430, width, 30 );
		
		return CGRectMake( 0, 270, width, 30 );
	}
}

- (void) loadView {
	UI_Question *question = [[UI_Question alloc] init];

    self.view = [[UIView alloc] init];
	[self.view setFrame:CGRectMake( 0, 0, [question getMaxWidth], [question getMaxHeight])];
	
	// Transparent background
	
	background = [[UIView alloc] init];
	background.backgroundColor = [UIColor blackColor];

	[background setFrame:CGRectMake(0, 0, [question getMaxWidth], [question getMaxHeight] )];
	[background setAlpha:0.5];
	[self.view addSubview:background];
	
	// Date picker itself
  datePicker = [[UIDatePicker alloc] init];
	[datePicker setFrame:[self pickerRect]];
	
	if ( dateType == 1 )
		datePicker.datePickerMode = UIDatePickerModeDate;
	else
		datePicker.datePickerMode = UIDatePickerModeTime;
	
  [self.view addSubview:datePicker];
	
	// Toolbar
	toolBar = [[UIToolbar alloc] init];
	toolBar.barStyle = UIBarStyleBlack;
	[toolBar setFrame:[self toolbarRect]];
	[self.view addSubview:toolBar];

	// Buttons
	NSMutableArray  *buttons = [[NSMutableArray alloc] init];
  UIBarButtonItem *button;
	
	button = [[UIBarButtonItem alloc] initWithBarButtonSystemItem:UIBarButtonSystemItemSave target:self action:@selector(done:)];
	[buttons addObject:button];

	button = [[UIBarButtonItem alloc] initWithBarButtonSystemItem:UIBarButtonSystemItemCancel target:self action:@selector(cancel:)];
	[buttons addObject:button];
	
  [toolBar setItems:buttons animated:YES];
	
}

- (IBAction)cancel:(id)sender {
  [delegate datePickerController:self didPickDate:nil andType:dateType];
}

- (IBAction)done:(id)sender {
  [delegate datePickerController:self didPickDate:datePicker.date andType:dateType];
}

- (BOOL)shouldAutorotateToInterfaceOrientation:(UIInterfaceOrientation)interfaceOrientation {
	// Overriden to allow any orientation.
	return YES;
}

- (void)willAnimateRotationToInterfaceOrientation:(UIInterfaceOrientation)interfaceOrientation duration:(NSTimeInterval)duration {
	UI_Question *question = [[UI_Question alloc] init];

	[datePicker setFrame:[self pickerRect]];

	[self.view setFrame:CGRectMake(0, 0, [question getMaxWidth], [question getMaxHeight])];
	[background setFrame:CGRectMake(0, 0, [question getMaxWidth], [question getMaxHeight] )];
	[toolBar setFrame:[self toolbarRect]];
	
}


@end
