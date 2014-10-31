//
//  UI_Address.m
//  Polldaddy
//
//  Created by Eoin Gallagher on 28/05/2010.
//  Copyright 2010 Automattic. All rights reserved.
//

#import "UI_Address.h"
#import "Question.h"
#import "ST_Address.h"
#import "NSString+XMLEntities.h"
#import "Constants.h"
#import "PolldaddyAppDelegate.h"
#import "Language.h"
#import "GTMNSString+XML.h"

extern UIInterfaceOrientation gAppOrientation;

@implementation UI_Address

@synthesize question;

- initWithQuestion:(ST_Address *)theQuestion andPack:(Language *)thePack {
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

// XXX
- (boolean_t) isCompleted {
    unsigned int parts = 0, required = 0;
    
	if ( [textFieldAddress1.text length] > 0 )
        parts++;
    
	if ( [textFieldCity.text length] > 0 )
        parts++;
    
    if ( [textFieldState.text length] > 0 )
        parts++;
    
    if ( [textFieldZip.text length] > 0 )
        parts++;

    if ( [textFieldCountry.text length] > 0 )
        parts++;

    if ( [question showZip] )
        required++;
    
    if ( [question showCity] )
        required++;
    
    if ( [question showCountry] )
        required++;
    
    if ( [question showPlace] )
        required++;
    
    if ( [question showState] )
        required++;

    if ( parts >= required )
        return YES;
	return NO;
}

- (boolean_t) isValid {
	return YES;		
}

- (NSString *) collectData {
	// Get the text, encoding any XML
	NSString *address1;
	NSString *address2;
	NSString *city;
	NSString *state;
	NSString *zip;
	NSString *country;
	
	if ( [textFieldAddress1.text length] > 0 )
		address1 = [NSString stringWithFormat:@"%@", [textFieldAddress1.text gtm_stringBySanitizingAndEscapingForXML]];
	else 
		address1 = @"";
	
	if ( [textFieldAddress2.text length] > 0 )
		address2 = [NSString stringWithFormat:@"%@", [textFieldAddress2.text gtm_stringBySanitizingAndEscapingForXML]];
	else 
		address2 = @"";
	
	if ( [textFieldCity.text length] > 0 )
		city = [NSString stringWithFormat:@"%@", [textFieldCity.text gtm_stringBySanitizingAndEscapingForXML]];
	else 
		city = @"";
	
	if ( [textFieldState.text length] > 0 )
		state = [NSString stringWithFormat:@"%@", [textFieldState.text gtm_stringBySanitizingAndEscapingForXML]];
	else 
		state = @"";
	
	if ([textFieldZip.text length] > 0)
		zip = [NSString stringWithFormat:@"%@", [textFieldZip.text gtm_stringBySanitizingAndEscapingForXML]];
	else 
		zip = @"";
	
	if ([textFieldCountry.text length] > 0)
		country = [NSString stringWithFormat:@"%@", [textFieldCountry.text stringByEncodingHTMLEntities]];
	else 
		country = @"";
	
	// Create the XML for my answer
	NSString *myData  = [NSString stringWithFormat:@"<add1>%@</add1><add2>%@</add2><city>%@</city><state>%@</state><zip>%@</zip><country>%@</country>", address1, address2, city, state, zip, country];
	
	return myData;
}

- (CGRect) getFieldSize:(unsigned int) field {
	// If on the iphone and in landscape mode then the labels are next to the fields
	if ( [Constants isIphone] && ( gAppOrientation == UIInterfaceOrientationLandscapeLeft || gAppOrientation == UIInterfaceOrientationLandscapeRight ) )
		return CGRectMake( 100, (field * [Constants textEditHeight] ) + ( field * [Constants labelBottomPadding] ), [self getMaxFrameWidth] * ( [Constants isIpad] ? 0.8 : 1 ) - 100, [Constants textEditHeight] );

	return CGRectMake( 0, ( ( field * [Constants textEditHeight] ) + ( field * [Constants labelBottomPadding] ) ) * 2, [self getMaxFrameWidth] * ( [Constants isIpad] ? 0.8 : 1 ), [Constants textEditHeight] );
}

- (CGRect) getLabelSize:(unsigned int) field {
	if ( [Constants isIphone] && ( gAppOrientation == UIInterfaceOrientationLandscapeLeft || gAppOrientation == UIInterfaceOrientationLandscapeRight ) )
		return CGRectMake( 0, field * [Constants textEditHeight] + ( field * [Constants labelBottomPadding] ), 100, [Constants textEditHeight] );

	return CGRectMake( 0, ( ( field * [Constants textEditHeight] ) + ( field * [Constants labelBottomPadding] ) ) * 2 + ( [Constants textEditHeight] + [Constants labelBottomPadding] ), [self getMaxFrameWidth], [Constants textEditHeight] );
}

- (CGRect) getRectSize {
	// Our frame needs to be just big enough to hold the UITextField - any bigger and we wont be able to click on other items on the page
	return CGRectMake( lastPoint.x, lastPoint.y, [self getMaxFrameWidth], [self getMaxFrameHeight] );
}

- (void)keyboardWasShown:(NSNotification*)aNotification {
}

- (void)keyboardWillBeHidden:(NSNotification*)aNotification {
}

- (void)textFieldDidBeginEditing:(UITextField *)textField {
	activeField = textField;
}

- (void)textFieldDidEndEditing:(UITextField *)textField {
	activeField = nil;
}

- (BOOL)textFieldShouldReturn:(UITextField *)textField {
	// Remove the popup keyboard
	[textField resignFirstResponder];	
	return YES;
}


// Implement viewDidLoad to do additional setup after loading the view, typically from a nib.
-(void) displayQuestion {
    unsigned int position = 0;
    
	// Without these the frame resizes to the height of the text field, meaning that it cuts off the 'hit' area of the field
	self.view.autoresizingMask    = NO;
	self.view.autoresizesSubviews = NO;
	
	// Our UITextField needs to be position at 0,0 within the frame
	[self.view setFrame:[self getRectSize]];
	
	// Get notification of keyboard hide/show
	[[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(keyboardWasShown:) name:UIKeyboardDidShowNotification object:nil];
	[[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(keyboardWillBeHidden:) name:UIKeyboardWillHideNotification object:nil];
	
	activeField = nil;
	
    if ( [question showPlace] ) {
        // Create text field
        textFieldAddress1 = [[UITextField alloc] initWithFrame:[self getFieldSize:position]];
        
        // Text field settings
        textFieldAddress1.returnKeyType             = UIReturnKeyDone;
        textFieldAddress1.adjustsFontSizeToFitWidth = TRUE;
        textFieldAddress1.borderStyle               = UITextBorderStyleRoundedRect;
        textFieldAddress1.autocapitalizationType    = UITextAutocapitalizationTypeSentences;
        
        // Hook up data entry
        textFieldAddress1.delegate = self;
        
        // Add to view
        [self.view addSubview:textFieldAddress1];
        
        //Create label
        labelAddress1                 = [[UILabel alloc] init];
        labelAddress1.frame           = [self getLabelSize:position];
        labelAddress1.textAlignment   = UITextAlignmentLeft;
        labelAddress1.text            = question.address1;
        labelAddress1.backgroundColor = [UIColor clearColor];
        labelAddress1.textColor       = [UIColor PdTextColor];

        [self.view addSubview:labelAddress1];
        
        position++;
        
        // Create text field
        textFieldAddress2 = [[UITextField alloc] initWithFrame:[self getFieldSize:position]];
        
        // Text field settings
        textFieldAddress2.returnKeyType             = UIReturnKeyDone;
        textFieldAddress2.adjustsFontSizeToFitWidth = TRUE;
        textFieldAddress2.borderStyle               = UITextBorderStyleRoundedRect;
        textFieldAddress2.autocapitalizationType    = UITextAutocapitalizationTypeSentences;
        
        // Hook up data entry
        textFieldAddress2.delegate = self;

        // Add to view
        [self.view addSubview:textFieldAddress2];
	
        //Create label
        labelAddress2					        = [[UILabel alloc] init];
        labelAddress2.frame				    = [self getLabelSize:position];
        labelAddress2.textAlignment		= UITextAlignmentLeft;
        labelAddress2.text				    = question.address2;
        labelAddress2.backgroundColor	= [UIColor clearColor];
        labelAddress2.textColor       = [UIColor PdTextColor];

        [self.view addSubview:labelAddress2];
        position++;
    }
	
    if ( [question showCity] ) {
        // Create text field
        textFieldCity = [[UITextField alloc] initWithFrame:[self getFieldSize:position]];
        
        // Text field settings
        textFieldCity.returnKeyType             = UIReturnKeyDone;
        textFieldCity.adjustsFontSizeToFitWidth = TRUE;
        textFieldCity.borderStyle               = UITextBorderStyleRoundedRect;
        textFieldCity.autocapitalizationType    = UITextAutocapitalizationTypeSentences;
        
        // Hook up data entry
        textFieldCity.delegate = self;
        
        // Add to view
        [self.view addSubview:textFieldCity];
        
        //Create label
        labelCity					        = [[UILabel alloc] init];
        labelCity.frame				    = [self getLabelSize:position];
        labelCity.textAlignment		= UITextAlignmentLeft;
        labelCity.text				    = question.city;
        labelCity.textColor       = [UIColor PdTextColor];
        labelCity.backgroundColor	= [UIColor clearColor];
        
        position++;
        [self.view addSubview:labelCity];
    }
	
	// Create text field
    if ( [question showState] ) {
        textFieldState = [[UITextField alloc] initWithFrame:[self getFieldSize:position]];
        
        // Text field settings
        textFieldState.returnKeyType             = UIReturnKeyDone;
        textFieldState.adjustsFontSizeToFitWidth = TRUE;
        textFieldState.borderStyle               = UITextBorderStyleRoundedRect;
        textFieldState.autocapitalizationType    = UITextAutocapitalizationTypeSentences;
        
        // Hook up data entry
        textFieldState.delegate = self;
        
        // Add to view
        [self.view addSubview:textFieldState];
        
        //Create label
        labelState					        = [[UILabel alloc] init];
        labelState.frame			      = [self getLabelSize:position];
        labelState.textAlignment  	= UITextAlignmentLeft;
        labelState.text			       	= question.state;
        labelState.backgroundColor	= [UIColor clearColor];
        labelState.textColor        = [UIColor PdTextColor];

        position++;
        [self.view addSubview:labelState];
    }
	
	if ( [question showZip] ) {
		// Create text field
		textFieldZip = [[UITextField alloc] initWithFrame:[self getFieldSize:position]];
		
		// Text field settings
		textFieldZip.returnKeyType             = UIReturnKeyDone;
		textFieldZip.adjustsFontSizeToFitWidth = TRUE;
		textFieldZip.borderStyle               = UITextBorderStyleRoundedRect;
		textFieldZip.autocapitalizationType    = UITextAutocapitalizationTypeSentences;
		
		// Hook up data entry
		textFieldZip.delegate = self;
		
		// Add to view
		[self.view addSubview:textFieldZip];
		
		//Create label
		labelZip					        = [[UILabel alloc] init];
		labelZip.frame				    = [self getLabelSize:position];
		labelZip.textAlignment		= UITextAlignmentLeft;
		labelZip.text				      = question.zip;
		labelZip.backgroundColor	= [UIColor clearColor];
		labelZip.textColor        = [UIColor PdTextColor];

		[self.view addSubview:labelZip];
        position++;
	}
	
	if ( [question showCountry] ) {
		// Create text field
		textFieldCountry = [[UITextField alloc] initWithFrame:[self getFieldSize:position]];
		
		// Text field settings
		textFieldCountry.returnKeyType             = UIReturnKeyDone;
		textFieldCountry.adjustsFontSizeToFitWidth = TRUE;
		textFieldCountry.borderStyle               = UITextBorderStyleRoundedRect;
		textFieldCountry.autocapitalizationType    = UITextAutocapitalizationTypeSentences;
		
		// Hook up data entry
		textFieldCountry.delegate = self;
		
		// Add to view
		[self.view addSubview:textFieldCountry];
		
		//Create label
		labelCountry				         	= [[UILabel alloc] init];
		labelCountry.frame		    		= [self getLabelSize:position];
		labelCountry.textAlignment		= UITextAlignmentLeft;
		labelCountry.text				      = question.country;
		labelCountry.backgroundColor	= [UIColor clearColor];
		labelCountry.textColor        = [UIColor PdTextColor];

		[self.view addSubview:labelCountry];
        position++;
	}
	
	if ( [Constants isIphone] ) {
		labelCountry.font      = [UIFont systemFontOfSize:14];
		textFieldCountry.font  = [UIFont systemFontOfSize:14];
		labelZip.font          = [UIFont systemFontOfSize:14];
		textFieldZip.font      = [UIFont systemFontOfSize:14];
		labelState.font        = [UIFont systemFontOfSize:14];
		textFieldState.font    = [UIFont systemFontOfSize:14];
		labelCity.font         = [UIFont systemFontOfSize:14];
		textFieldCity.font     = [UIFont systemFontOfSize:14];
		labelAddress2.font     = [UIFont systemFontOfSize:14];
		textFieldAddress2.font = [UIFont systemFontOfSize:14];
		labelAddress1.font     = [UIFont systemFontOfSize:14];
		textFieldAddress1.font = [UIFont systemFontOfSize:14];
	}
}

- (BOOL)shouldAutorotateToInterfaceOrientation:(UIInterfaceOrientation)interfaceOrientation {
	// Overriden to allow any orientation.
	return YES;
}

- (void)willAnimateRotationToInterfaceOrientation:(UIInterfaceOrientation)interfaceOrientation duration:(NSTimeInterval)duration{
    unsigned int position = 0;
    
	[self.view setFrame:[self getRectSize]];
	
	if ( [question showPlace] ) {
        textFieldAddress1.frame = [self getFieldSize:position];
        labelAddress1.frame     = [self getLabelSize:position];
        
        position++;
        
        textFieldAddress2.frame	= [self getFieldSize:position];
        labelAddress2.frame     = [self getLabelSize:position];

        position++;
    }
	
	if ( [question showCity] ) {
        textFieldCity.frame	= [self getFieldSize:position];
        labelCity.frame		= [self getLabelSize:position];
        position++;
    }
	
	if ( [question showState] ) {
        textFieldState.frame = [self getFieldSize:position];
        labelState.frame	 = [self getLabelSize:position];
        position++;
    }
	
	if ( [question showZip] ) {
		textFieldZip.frame = [self getFieldSize:position];
		labelZip.frame     = [self getLabelSize:position];
        position++;
	}
	
	if ( [question showCountry] ) {
		textFieldCountry.frame = [self getFieldSize:position];
		labelCountry.frame     = [self getLabelSize:position];
        position++;
	}
}

- (void)dealloc {
	[[NSNotificationCenter defaultCenter] removeObserver:self];


}

@end
