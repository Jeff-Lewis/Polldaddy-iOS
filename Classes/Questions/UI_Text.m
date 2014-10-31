    //
//  UI_Text.m
//  Polldaddy
//
//  Created by John Godley on 26/05/2010.
//  Copyright 2010 Automattic. All rights reserved.
//

#import "UI_Text.h"
#import "Question.h"
#import "ST_Text.h"
#import "NSString+XMLEntities.h"
#import "Constants.h"
#import "Language.h"
#import "GTMNSString+XML.h"

@implementation UI_Text

@synthesize question;

- initWithQuestion:(ST_Text *)theQuestion andPack:(Language *)thePack {
	self = [super init];
	
	question = theQuestion;
    pack = thePack;
	return self;
}

- (NSString *) getError {
	if ( [self isCompleted] == NO )
		return [pack getPhrase:PHRASE_MANDATORY];
	return @"";
}

- (boolean_t) isCompleted {
	if ( [textField.text length] > 0 )
		return YES;
	return NO;
}

- (NSString *) collectData {
	// Get the text, encoding any XML
	NSString *encoded;

	if ( [textField.text length] > 0 )
		encoded = [NSString stringWithFormat:@"%@", [textField.text gtm_stringBySanitizingAndEscapingForXML]];
	else
		encoded = @"";
    NSLog(@"text=%@", encoded);
	// Create the XML for my answer
	NSString *myData  = [NSString stringWithFormat:@"<value>%@</value>", encoded];
	
	return myData;
}

// Returns a properly sized CGRect for the current orientation
- (CGRect) getSize {
	unsigned int size;
	
	if ( [Constants isIpad] ) {
		if ( [question isSmall] )
			size = [self getMaxFrameWidth] / 3;
		else if ( [question isMedium] )
			size = ( [self getMaxFrameWidth] / 3 ) * 2;
		else
			size = [self getMaxFrameWidth];
	}
	else {
		if ( [question isSmall] )
			size = ( [self getMaxFrameWidth] / 3 ) * 2;
		else if ( [question isMedium] )
			size = ( [self getMaxFrameWidth] / 3 ) * 2;
		else
			size = [self getMaxFrameWidth];
	}
	
	return CGRectMake( lastPoint.x, lastPoint.y, size, [Constants textEditHeight] );	
}

// Implement viewDidLoad to do additional setup after loading the view, typically from a nib.
-(void) displayQuestion {
	// Our frame needs to be just big enough to hold the UITextField - any bigger and we wont be able to click on other items on the page
	CGRect rect = [self getSize];

	// Without these the frame resizes to the height of the text field, meaning that it cuts off the 'hit' area of the field
	self.view.autoresizingMask    = NO;
	self.view.autoresizesSubviews = NO;
	
	// Our UITextField needs to be position at 0,0 within the frame
	[self.view setFrame:rect];

	rect.origin.x = 0;
	rect.origin.y = 0;

	// Create text field
	textField = [[UITextField alloc] initWithFrame:rect];

	// Text field settings
	textField.returnKeyType             = UIReturnKeyDone;
	textField.autocapitalizationType    = UITextAutocapitalizationTypeSentences;
	textField.adjustsFontSizeToFitWidth = TRUE;
	textField.borderStyle               = UITextBorderStyleRoundedRect;
	
	if ( [Constants isIphone] )
		textField.font = [UIFont systemFontOfSize:14];
	
	// Is it a password
	if ( [question isPassword] )
		textField.secureTextEntry = YES;
	
	// Hook up data entry
	[textField addTarget:self action:@selector(readField:) forControlEvents:UIControlEventEditingDidEndOnExit];     

	// Add to view
	[self.view addSubview:textField];
}

- (IBAction)readField:(id)sender {
	// Remove the popup keyboard
  [sender resignFirstResponder];
}

- (BOOL)shouldAutorotateToInterfaceOrientation:(UIInterfaceOrientation)interfaceOrientation {
	// Overriden to allow any orientation.
	return YES;
}

- (void)willAnimateRotationToInterfaceOrientation:(UIInterfaceOrientation)interfaceOrientation duration:(NSTimeInterval)duration{
	// Get new dimensions of the frame
	CGRect rect = [self getSize];

	[self.view setFrame:rect];
	
	// Set dimensions of textfield
	rect.origin.x = 0;
	rect.origin.y = 0;

	textField.frame = rect;
}

- (void)dealloc {
	[textField removeFromSuperview];
}


@end
