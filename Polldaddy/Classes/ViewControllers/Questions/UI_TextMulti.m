//
//  UI_TextMulti.m
//  Polldaddy
//
//  Created by John Godley on 26/05/2010.
//  Copyright 2010 Automattic. All rights reserved.
//

#import "Constants.h"
#import "UI_TextMulti.h"
#import "Question.h"
#import "ST_Text.h"
#import "NSString+XMLEntities.h"
#import <QuartzCore/QuartzCore.h>
#import "PolldaddyAppDelegate.h"
#import "Language.h"
#import "GTMNSString+XML.h"

extern UIInterfaceOrientation gAppOrientation;

@implementation UI_TextMulti

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
	
	// Create the XML for my answer
	NSString *myData  = [NSString stringWithFormat:@"<value>%@</value>", encoded];
	
	return myData;
}

// Returns a properly sized CGRect for the current orientation
- (CGRect) getSize {
	unsigned int size;
	
	if ( [Constants isIpad] ) {
		if ( [question isSmall] )
			size = 82;
		else if ( [question isMedium] )
			size = 104;
		else
			size = 208;
	}
	else {
		if ( [question isSmall] )
			size = 40;
		else if ( [question isMedium] )
			size = 90;
		else
			size = 130;		
	}
	
	return CGRectMake( lastPoint.x, lastPoint.y, [self getMaxFrameWidth], size );	
}

-(void) displayNextButton:(UIButton *)otherSurvey andCancelButton:(UIButton *)otherCancel {
	cancelButton = otherCancel;
	surveyButton = otherSurvey;

	[super displayNextButton:otherSurvey andCancelButton:otherCancel];
}

- (IBAction)done:(id)sender {
	[textField resignFirstResponder];
	
	[toolbar removeFromSuperview];
	toolbar = nil;
}

- (void) adjustButtons {
	if ( keyboardHeight > 0 ) {
		PolldaddyAppDelegate *delegate = [[UIApplication sharedApplication] delegate];
		
		if ( !toolbar ) {
			toolbar = [[UIToolbar alloc] init];
			
			[delegate.rootViewController.view addSubview:toolbar];
			
			UIBarButtonItem *button = [[UIBarButtonItem alloc] initWithBarButtonSystemItem:UIBarButtonSystemItemSave target:self action:@selector(done:)];
			NSMutableArray  *buttons = [[NSMutableArray alloc] init];
			
			[buttons addObject:button];
			[toolbar setItems:buttons animated:YES];
			
		}
		
		if ( [Constants isIpad] )
			[toolbar setFrame:CGRectMake(0, [self getMaxHeight] - keyboardHeight - 50, [self getMaxWidth], 30)];
		else
			[toolbar setFrame:CGRectMake(0, [self getMaxHeight] - keyboardHeight - 50, [self getMaxWidth], 30)];		
	}
}

-(void) keyboardWillShow:(NSNotification *) notification {
	CGRect _keyboardEndFrame;

	[[notification.userInfo valueForKey:UIKeyboardFrameEndUserInfoKey] getValue:&_keyboardEndFrame];

	if ( gAppOrientation == UIDeviceOrientationLandscapeLeft || gAppOrientation == UIDeviceOrientationLandscapeRight )
		keyboardHeight = _keyboardEndFrame.size.width;
	else
		keyboardHeight = _keyboardEndFrame.size.height;

	// Adjust buttons by the height of the keyboard
	[self adjustButtons];
}
 
-(void) keyboardWillHide:(NSNotification *) notification {
	keyboardHeight = 0;
	
	// Adjust buttons by the height of the keyboard
	[self adjustButtons];
	[toolbar removeFromSuperview];
	toolbar = nil;	
}


// Implement viewDidLoad to do additional setup after loading the view, typically from a nib.
-(void) displayQuestion {
	// Our frame needs to be just big enough to hold the UITextField - any bigger and we wont be able to click on other items on the page
	CGRect rect = [self getSize];
	
	// Without these the frame resizes to the height of the text field, meaning that it cuts off the 'hit' area of the field
	self.view.autoresizingMask    = NO;
	self.view.autoresizesSubviews = NO;
	
	// Our UITextView needs to be position at 0,0 within the frame
	[self.view setFrame:rect];

	rect.origin.x = 0;
	rect.origin.y = 0;
	
	// Create text field just under the note
	textField = [[UITextView alloc] initWithFrame:rect];
	[textField setBackgroundColor:[UIColor whiteColor]];
	
	// Text field settings
	textField.enablesReturnKeyAutomatically = YES;
	textField.returnKeyType                 = UIReturnKeyDefault;
	textField.autocapitalizationType        = UITextAutocapitalizationTypeSentences;
	textField.font                          = [UIFont fontWithName:@"Helvetica" size:22];
	textField.layer.borderColor = [[UIColor lightGrayColor] CGColor];
	textField.layer.borderWidth = 1;
	textField.layer.cornerRadius = 5;
	
	// Set this object as the delegate
	textField.delegate = self;
	
	if ( [Constants isIphone] )
		textField.font = [UIFont systemFontOfSize:14];

	// Add to view
	[self.view addSubview:textField];
	
	// Register handlers to move the buttons when the keyboard is enabled and disabled
	NSNotificationCenter *nc = [NSNotificationCenter defaultCenter];
	
	[nc addObserver:self selector:@selector(keyboardWillShow:) name: UIKeyboardWillShowNotification object:nil];
	[nc addObserver:self selector:@selector(keyboardWillHide:) name: UIKeyboardWillHideNotification object:nil];	
}

-(BOOL)shouldAutorotate {
    return YES;
}

-(NSUInteger)supportedInterfaceOrientations {
    return UIInterfaceOrientationMaskAll;
}

- (void)willAnimateRotationToInterfaceOrientation:(UIInterfaceOrientation)interfaceOrientation duration:(NSTimeInterval)duration{
	// Get new dimensions of the frame
	CGRect rect = [self getSize];
	
	[self.view setFrame:rect];
	
	// Set dimensions of textfield
	rect.origin.x = 0;
	rect.origin.y = 0;
	
	textField.frame = rect;

	// Adjust buttons by the height of the keyboard
	[self adjustButtons];
}

- (void)dealloc {
	[[NSNotificationCenter defaultCenter] removeObserver:self];
}


@end
