//
//  UI_EmailAddress.m
//  Polldaddy
//
//  Created by Eoin Gallagher on 27/05/2010.
//  Copyright 2010 Automattic. All rights reserved.
//

#import "UI_EmailAddress.h"
#import "Question.h"
#import "ST_EmailAddress.h"
#import "NSString+XMLEntities.h"
#import "Constants.h"
#import "Language.h"
#import "GTMNSString+XML.h"

@implementation UI_EmailAddress

@synthesize question;

- initWithQuestion:(ST_EmailAddress *)theQuestion andPack:(Language *)thePack {
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

- (NSString *) getValidError {
	return [pack getPhrase:PHRASE_VALID_EMAIL];
}

- (boolean_t) isCompleted {
	if ( [textField.text length] > 0 )
		return YES;
	return NO;
}

- (boolean_t) isValid {
	if ( [textField.text length] > 0 ){
		NSString *emailRegex = @"[A-Z0-9a-z._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,4}"; 
		NSPredicate *emailTest = [NSPredicate predicateWithFormat:@"SELF MATCHES %@", emailRegex];
		if ([emailTest evaluateWithObject:textField.text])
			return YES;
	}else if ([question isMandatory] == FALSE) {
		return YES;
	}
    
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

- (CGRect) getFieldSize {
	if ( [Constants isIpad] )
		return CGRectMake( 0, 0, ( [self getMaxFrameWidth] - 120), [Constants textEditHeight] );
	return CGRectMake( 0, 0, [self getMaxFrameWidth], [Constants textEditHeight] );
}

- (CGRect) getLabelSize {
	CGRect field = [self getFieldSize];
	
	return CGRectMake( 0, field.origin.y + field.size.height + 10, [self getMaxFrameWidth], [Constants textEditHeight]);
}

- (CGRect) getRectSize {
	CGRect labelField = [self getLabelSize];
	
	// Our frame needs to be just big enough to hold the UITextField - any bigger and we wont be able to click on other items on the page
	return CGRectMake( lastPoint.x, lastPoint.y, ( [self getMaxFrameWidth] - 40), labelField.origin.y + labelField.size.height );
}


// Implement viewDidLoad to do additional setup after loading the view, typically from a nib.
-(void) displayQuestion {
	// Without these the frame resizes to the height of the text field, meaning that it cuts off the 'hit' area of the field
	self.view.autoresizingMask    = NO;
	self.view.autoresizesSubviews = NO;
	
	// Our UITextField needs to be position at 0,0 within the frame
	[self.view setFrame:[self getRectSize]];
	
	// Create text field
	textField = [[UITextField alloc] initWithFrame:[self getFieldSize]];
	
	// Text field settings
	textField.returnKeyType             = UIReturnKeyDone;
	textField.adjustsFontSizeToFitWidth = TRUE;
	textField.borderStyle               = UITextBorderStyleRoundedRect;
	textField.keyboardType				      = UIKeyboardTypeEmailAddress;
	textField.autocapitalizationType    = UITextAutocapitalizationTypeNone;
	
	// Hook up data entry
	[textField addTarget:self action:@selector(readField:) forControlEvents:UIControlEventEditingDidEndOnExit];     
	
	// Add to view
	[self.view addSubview:textField];
	
	// Create label
	label                 = [[UILabel alloc] init];
	label.frame           = [self getLabelSize];
	label.textAlignment   = UITextAlignmentLeft;
	label.text            = question.example;
	label.backgroundColor = [UIColor clearColor];
	label.textColor       = [UIColor PdTextColor];
	
	[self.view addSubview:label];
	
	if ( [Constants isIphone] ) {
		textField.font = [UIFont systemFontOfSize:14];
		label.font     = [UIFont systemFontOfSize:14];
	}	
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
	[self.view setFrame:[self getRectSize]];
	textField.frame = [self getFieldSize];
	label.frame     = [self getLabelSize];
}


@end
