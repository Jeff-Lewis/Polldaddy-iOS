//
//  UI_Name.m
//  Polldaddy
//
//  Created by Eoin Gallagher on 28/05/2010.
//  Copyright 2010 Automattic. All rights reserved.
//

#import "UI_Name.h"
#import "Question.h"
#import "ST_Name.h"
#import "NSString+XMLEntities.h"
#import "Constants.h"
#import "Language.h"
#import "GTMNSString+XML.h"

@implementation UI_Name

@synthesize question;

- initWithQuestion:(ST_Name *)theQuestion andPack:(Language *)thePack {
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
	switch ( [question getNameType] ) {
		case 2:
			if ( [textFieldFirstName.text length] > 0 )
				if ( [textFieldLastName.text length] > 0 )
					return YES;
			break;
		
		case 1:
			if ( [textFieldTitleName.text length] > 0 )
				if ( [textFieldFirstName.text length] > 0 )
					if ( [textFieldLastName.text length] > 0 )
						return YES;			
			break;
		
		default:
			if ( [textFieldTitleName.text length] > 0 )
				if ( [textFieldFirstName.text length] > 0 )
					if ( [textFieldLastName.text length] > 0 )
						if ( [textFieldSuffix.text length] > 0 )
							return YES;				
			break;
	}	
	return NO;
}

- (boolean_t) isValid {
   return YES;		
}

- (NSString *) collectData {
	// Get the text, encoding any XML
	NSString *title;
	NSString *firstname;
	NSString *lastname;
	NSString *suffix;
	
	if ( [textFieldTitleName.text length] > 0 )
		title = [NSString stringWithFormat:@"%@", [textFieldTitleName.text gtm_stringBySanitizingAndEscapingForXML]];
	else 
		title = @"";
	
	if ( [textFieldFirstName.text length] > 0 )
		firstname = [NSString stringWithFormat:@"%@", [textFieldFirstName.text gtm_stringBySanitizingAndEscapingForXML]];
	else 
		firstname = @"";
	
	if ( [textFieldLastName.text length] > 0 )
		lastname = [NSString stringWithFormat:@"%@", [textFieldLastName.text gtm_stringBySanitizingAndEscapingForXML]];
	else 
		lastname = @"";
	
	if ( [textFieldSuffix.text length] > 0 )
		suffix = [NSString stringWithFormat:@"%@", [textFieldSuffix.text gtm_stringBySanitizingAndEscapingForXML]];
	else 
		suffix = @"";	
	
	// Create the XML for my answer
	NSString *myData  = [NSString stringWithFormat:@"<title>%@</title><firstName>%@</firstName><lastName>%@</lastName><suffix>%@</suffix>", title, firstname, lastname, suffix];
	
	return myData;
}

- (CGRect) getFieldSize:(unsigned int) field {
	width = smallWidth = 0;
	
	switch ( [question getNameType] ) {
		case 2: //just first & last name
			width = ( ( [self getMaxFrameWidth] - ( [Constants isIpad] ? 120 : 0 ) ) / 2 ) - 5;
			
			switch (field) {
				case 1:
					return CGRectMake( width + 10, 0, width, [Constants textEditHeight] );
					break;
				default:
					return CGRectMake( 0, 0, width, [Constants textEditHeight] );
					break;
			}
		case 1: //just title, first & last name
			smallWidth = ( ( [self getMaxFrameWidth] - ( [Constants isIpad] ? 120 : 0 ) ) / 4 ) - 5;
			width      = ( ( ( [self getMaxFrameWidth] - ( [Constants isIpad] ? 120 : 0 ) ) * 0.75 ) / 2 ) - 5;
			
			switch (field) {
				case 2:
					return CGRectMake( smallWidth + width + 20, 0, width, [Constants textEditHeight] );
					break;
				case 1:
					return CGRectMake( smallWidth + 10, 0, width, [Constants textEditHeight] );
					break;
				default:
					return CGRectMake( 0, 0, smallWidth, [Constants textEditHeight] );
					break;
			}
		default: //all
			smallWidth = ( ( [self getMaxFrameWidth] - ( [Constants isIpad] ? 120 : 0 ) ) / 6 ) - 5;
			width      = ( ( [self getMaxFrameWidth] - ( [Constants isIpad] ? 120 : 0 ) ) / 3 ) - 5;
			
			switch (field) {
				case 3:
					return CGRectMake( smallWidth + width + width + 30, 0, smallWidth, [Constants textEditHeight] );
					break;
				case 2:
					return CGRectMake( smallWidth + width + 20, 0, width, [Constants textEditHeight] );
					break;
				case 1:
					return CGRectMake( smallWidth + 10, 0, width, [Constants textEditHeight] );
					break;
				default:
					return CGRectMake( 0, 0, smallWidth, [Constants textEditHeight] );
					break;
			}
			
	}
	
}

- (CGRect) getLabelSize:(unsigned int) field {
	CGRect fieldRect = [self getFieldSize:field];
	
	width = smallWidth = 0;
	
	switch ( [question getNameType] ) {
		case 2: //just first & last name
			width = ( ( [self getMaxFrameWidth] - ( [Constants isIpad] ? 120 : 0 ) ) / 2 ) - 5;
			
			switch (field) {
				case 1:
					return CGRectMake( width + 10, fieldRect.origin.y + fieldRect.size.height + 10, width, [Constants textEditHeight] );
					break;
				default:
					return CGRectMake( 0, fieldRect.origin.y + fieldRect.size.height + 10, width, [Constants textEditHeight] );
					break;
			}
		case 1: //just title, first & last name
			smallWidth = ( ( [self getMaxFrameWidth] - ( [Constants isIpad] ? 120 : 0 ) ) / 4 ) - 5;
			width = ( ( ( [self getMaxFrameWidth] - ( [Constants isIpad] ? 120 : 0 ) ) * 0.75 ) / 2 ) - 5;
			
			switch (field) {
				case 2:
					return CGRectMake( smallWidth + width + 20, fieldRect.origin.y + fieldRect.size.height + 10, width, [Constants textEditHeight] );
					break;
				case 1:
					return CGRectMake( smallWidth + 10, fieldRect.origin.y + fieldRect.size.height + 10, width, [Constants textEditHeight] );
					break;
				default:
					return CGRectMake( 0, fieldRect.origin.y + fieldRect.size.height + 10, smallWidth, [Constants textEditHeight] );
					break;
			}
		default: //all
			smallWidth = ( ( [self getMaxFrameWidth] - ( [Constants isIpad] ? 120 : 0 ) ) / 6 ) - 5;
			width = ( ( [self getMaxFrameWidth] - ( [Constants isIpad] ? 120 : 0 ) ) / 3 ) - 5;
			
			switch (field) {
				case 3:
					return CGRectMake( smallWidth + width + width + 30, fieldRect.origin.y + fieldRect.size.height + 10, smallWidth, [Constants textEditHeight] );
					break;
				case 2:
					return CGRectMake( smallWidth + width + 20, fieldRect.origin.y + fieldRect.size.height + 10, width, [Constants textEditHeight] );
					break;
				case 1:
					return CGRectMake( smallWidth + 10, fieldRect.origin.y + fieldRect.size.height + 10, width, [Constants textEditHeight] );
					break;
				default:
					return CGRectMake( 0, fieldRect.origin.y + fieldRect.size.height + 10, smallWidth, [Constants textEditHeight] );
					break;
			}
			
	}
}

- (CGRect) getRectSize {
	CGRect labelField;
	switch ( [question getNameType] ) {
		case 2: //just first & last name
			labelField = [self getLabelSize:1];
			break;
			
		case 1: //just title, first & last name
			labelField = [self getLabelSize:2];
			break;
			
		default: //all
			labelField = [self getLabelSize:3];
			break;
	}
	
	// Our frame needs to be just big enough to hold the UITextField - any bigger and we wont be able to click on other items on the page
	return CGRectMake( lastPoint.x, lastPoint.y, ( [self getMaxFrameWidth] ), labelField.origin.y + labelField.size.height );
}

// Implement viewDidLoad to do additional setup after loading the view, typically from a nib.
-(void) displayQuestion {
	// Without these the frame resizes to the height of the text field, meaning that it cuts off the 'hit' area of the field
	self.view.autoresizingMask    = NO;
	self.view.autoresizesSubviews = NO;
	
	// Our UITextField needs to be position at 0,0 within the frame
	[self.view setFrame:[self getRectSize]];
	
	switch ( [question getNameType] ) {
		case 2:
			//just first & last name
			
			// Create text field
			textFieldFirstName = [[UITextField alloc] initWithFrame:[self getFieldSize:0]];
			
			// Text field settings
			textFieldFirstName.returnKeyType             = UIReturnKeyDone;
			textFieldFirstName.adjustsFontSizeToFitWidth = TRUE;
			textFieldFirstName.borderStyle               = UITextBorderStyleRoundedRect;
			textFieldFirstName.autocapitalizationType    = UITextAutocapitalizationTypeSentences;
			
			// Hook up data entry
			[textFieldFirstName addTarget:self action:@selector(readField:) forControlEvents:UIControlEventEditingDidEndOnExit];  
			
			// Add to view
			[self.view addSubview:textFieldFirstName];
			
			//Create label
			labelFirstName                 = [[UILabel alloc] init];
			labelFirstName.frame           = [self getLabelSize:0];
			labelFirstName.textAlignment   = NSTextAlignmentLeft;
			labelFirstName.text            = question.firstName;
			labelFirstName.backgroundColor = [UIColor clearColor];
			labelFirstName.textColor       = [UIColor PdTextColor];

			// Resize the field on the iphone
			if ( [Constants isIphone] )
				labelFirstName.font = [UIFont systemFontOfSize:14];
			
			[self.view addSubview:labelFirstName];
			
			// Create text field
			textFieldLastName = [[UITextField alloc] initWithFrame:[self getFieldSize:1]];
			
			// Text field settings
			textFieldLastName.returnKeyType             = UIReturnKeyDone;
			textFieldLastName.adjustsFontSizeToFitWidth = TRUE;
			textFieldLastName.borderStyle               = UITextBorderStyleRoundedRect;
			textFieldLastName.autocapitalizationType    = UITextAutocapitalizationTypeSentences;

			// Hook up data entry
			[textFieldLastName addTarget:self action:@selector(readField:) forControlEvents:UIControlEventEditingDidEndOnExit];  
			
			// Add to view
			[self.view addSubview:textFieldLastName];
			
			//Create label
			labelLastName                 = [[UILabel alloc] init];
			labelLastName.frame           = [self getLabelSize:1];
			labelLastName.textAlignment   = NSTextAlignmentLeft;
			labelLastName.text            = question.lastName;
			labelLastName.backgroundColor = [UIColor clearColor];
			labelLastName.textColor       = [UIColor PdTextColor];

			[self.view addSubview:labelLastName];
			
			break;
			
		case 1:
			//just title, first & last name
			
			// Create text field
			textFieldTitleName = [[UITextField alloc] initWithFrame:[self getFieldSize:0]];
			
			// Text field settings
			textFieldTitleName.returnKeyType             = UIReturnKeyDone;
			textFieldTitleName.adjustsFontSizeToFitWidth = TRUE;
			textFieldTitleName.borderStyle               = UITextBorderStyleRoundedRect;
			textFieldTitleName.autocapitalizationType    = UITextAutocapitalizationTypeSentences;
			
			// Hook up data entry
			[textFieldTitleName addTarget:self action:@selector(readField:) forControlEvents:UIControlEventEditingDidEndOnExit];  
			
			// Add to view
			[self.view addSubview:textFieldTitleName];
			
			//Create label
			labelTitleName                 = [[UILabel alloc] init];
			labelTitleName.frame           = [self getLabelSize:0];
			labelTitleName.textAlignment   = NSTextAlignmentLeft;
			labelTitleName.text            = question.titleName;
			labelTitleName.backgroundColor = [UIColor clearColor];
			labelTitleName.textColor       = [UIColor PdTextColor];

			[self.view addSubview:labelTitleName];
			
			// Create text field
			textFieldFirstName = [[UITextField alloc] initWithFrame:[self getFieldSize:1]];
			
			// Text field settings
			textFieldFirstName.returnKeyType             = UIReturnKeyDone;
			textFieldFirstName.adjustsFontSizeToFitWidth = TRUE;
			textFieldFirstName.borderStyle               = UITextBorderStyleRoundedRect;
			textFieldFirstName.autocapitalizationType    = UITextAutocapitalizationTypeSentences;
			
			// Hook up data entry
			[textFieldFirstName addTarget:self action:@selector(readField:) forControlEvents:UIControlEventEditingDidEndOnExit];  
			
			// Add to view
			[self.view addSubview:textFieldFirstName];
			
			//Create label
			labelFirstName                 = [[UILabel alloc] init];
			labelFirstName.frame           = [self getLabelSize:1];
			labelFirstName.textAlignment   = NSTextAlignmentLeft;
			labelFirstName.text            = question.firstName;
			labelFirstName.backgroundColor = [UIColor clearColor];
			labelFirstName.textColor       = [UIColor PdTextColor];

			[self.view addSubview:labelFirstName];
			
			// Create text field
			textFieldLastName = [[UITextField alloc] initWithFrame:[self getFieldSize:2]];
			
			// Text field settings
			textFieldLastName.returnKeyType             = UIReturnKeyDone;
			textFieldLastName.adjustsFontSizeToFitWidth = TRUE;
			textFieldLastName.borderStyle               = UITextBorderStyleRoundedRect;
			textFieldLastName.autocapitalizationType    = UITextAutocapitalizationTypeSentences;
			
			// Hook up data entry
			[textFieldLastName addTarget:self action:@selector(readField:) forControlEvents:UIControlEventEditingDidEndOnExit];  
			
			// Add to view
			[self.view addSubview:textFieldLastName];
			
			//Create label
			labelLastName                 = [[UILabel alloc] init];
			labelLastName.frame           = [self getLabelSize:2];
			labelLastName.textAlignment   = NSTextAlignmentLeft;
			labelLastName.text            = question.lastName;
			labelLastName.backgroundColor = [UIColor clearColor];
			labelLastName.textColor       = [UIColor PdTextColor];

			[self.view addSubview:labelLastName];
			
			break;
			
		default:
			//all
			
			// Create text field
			textFieldTitleName = [[UITextField alloc] initWithFrame:[self getFieldSize:0]];
			
			// Text field settings
			textFieldTitleName.returnKeyType             = UIReturnKeyDone;
			textFieldTitleName.adjustsFontSizeToFitWidth = TRUE;
			textFieldTitleName.borderStyle               = UITextBorderStyleRoundedRect;
			textFieldTitleName.autocapitalizationType    = UITextAutocapitalizationTypeSentences;
			
			// Hook up data entry
			[textFieldTitleName addTarget:self action:@selector(readField:) forControlEvents:UIControlEventEditingDidEndOnExit];  
			
			// Add to view
			[self.view addSubview:textFieldTitleName];
			
			//Create label
			labelTitleName                 = [[UILabel alloc] init];
			labelTitleName.frame           = [self getLabelSize:0];
			labelTitleName.textAlignment   = NSTextAlignmentLeft;
			labelTitleName.text            = question.titleName;
			labelTitleName.backgroundColor = [UIColor clearColor];
			labelTitleName.textColor       = [UIColor PdTextColor];

			[self.view addSubview:labelTitleName];
			
			// Create text field
			textFieldFirstName = [[UITextField alloc] initWithFrame:[self getFieldSize:1]];
			
			// Text field settings
			textFieldFirstName.returnKeyType             = UIReturnKeyDone;
			textFieldFirstName.adjustsFontSizeToFitWidth = TRUE;
			textFieldFirstName.borderStyle               = UITextBorderStyleRoundedRect;
			textFieldFirstName.autocapitalizationType    = UITextAutocapitalizationTypeSentences;
			
			// Hook up data entry
			[textFieldFirstName addTarget:self action:@selector(readField:) forControlEvents:UIControlEventEditingDidEndOnExit];  
			
			// Add to view
			[self.view addSubview:textFieldFirstName];
			
			//Create label
			labelFirstName                 = [[UILabel alloc] init];
			labelFirstName.frame           = [self getLabelSize:1];
			labelFirstName.textAlignment   = NSTextAlignmentLeft;
			labelFirstName.text            = question.firstName;
			labelFirstName.backgroundColor = [UIColor clearColor];
			labelFirstName.textColor       = [UIColor PdTextColor];

			[self.view addSubview:labelFirstName];
			
			// Create text field
			textFieldLastName = [[UITextField alloc] initWithFrame:[self getFieldSize:2]];
			
			// Text field settings
			textFieldLastName.returnKeyType             = UIReturnKeyDone;
			textFieldLastName.adjustsFontSizeToFitWidth = TRUE;
			textFieldLastName.borderStyle               = UITextBorderStyleRoundedRect;
			textFieldLastName.autocapitalizationType    = UITextAutocapitalizationTypeSentences;
			
			// Hook up data entry
			[textFieldLastName addTarget:self action:@selector(readField:) forControlEvents:UIControlEventEditingDidEndOnExit];  
			
			// Add to view
			[self.view addSubview:textFieldLastName];
			
			//Create label
			labelLastName                 = [[UILabel alloc] init];
			labelLastName.frame           = [self getLabelSize:2];
			labelLastName.textAlignment   = NSTextAlignmentLeft;
			labelLastName.text            = question.lastName;
			labelLastName.backgroundColor = [UIColor clearColor];
			labelLastName.textColor       = [UIColor PdTextColor];

			[self.view addSubview:labelLastName];
			
			// Create text field
			textFieldSuffix = [[UITextField alloc] initWithFrame:[self getFieldSize:3]];
			
			// Text field settings
			textFieldSuffix.returnKeyType             = UIReturnKeyDone;
			textFieldSuffix.adjustsFontSizeToFitWidth = TRUE;
			textFieldSuffix.borderStyle               = UITextBorderStyleRoundedRect;
			textFieldSuffix.autocapitalizationType    = UITextAutocapitalizationTypeSentences;
			
			// Hook up data entry
			[textFieldSuffix addTarget:self action:@selector(readField:) forControlEvents:UIControlEventEditingDidEndOnExit];  
			
			// Add to view
			[self.view addSubview:textFieldSuffix];
			
			//Create label
			labelSuffix                 = [[UILabel alloc] init];
			labelSuffix.frame           = [self getLabelSize:3];
			labelSuffix.textAlignment   = NSTextAlignmentLeft;
			labelSuffix.text            = question.suffix;
			labelSuffix.backgroundColor = [UIColor clearColor];
			labelSuffix.textColor       = [UIColor PdTextColor];

			[self.view addSubview:labelSuffix];
			
			break;
	}
	
	
	// Resize the field on the iphone
	if ( [Constants isIphone] ) {
		textFieldTitleName.font = [UIFont systemFontOfSize:14];
		textFieldFirstName.font = [UIFont systemFontOfSize:14];
		textFieldLastName.font  = [UIFont systemFontOfSize:14];
		textFieldSuffix.font    = [UIFont systemFontOfSize:14];
		labelTitleName.font     = [UIFont systemFontOfSize:14];
		labelFirstName.font     = [UIFont systemFontOfSize:14];
		labelLastName.font      = [UIFont systemFontOfSize:14];
		labelSuffix.font        = [UIFont systemFontOfSize:14];
	}
}

- (IBAction)readField:(id)sender {
	// Remove the popup keyboard
	[sender resignFirstResponder];
}

-(BOOL)shouldAutorotate {
    return YES;
}

-(NSUInteger)supportedInterfaceOrientations {
    return UIInterfaceOrientationMaskAll;
}

- (void)willAnimateRotationToInterfaceOrientation:(UIInterfaceOrientation)interfaceOrientation duration:(NSTimeInterval)duration{
	[self.view setFrame:[self getRectSize]];
	switch ( [question getNameType] ) {
		case 2:	//just first & last name
			textFieldFirstName.frame	= [self getFieldSize:0];
			labelFirstName.frame		= [self getLabelSize:0];
			
			textFieldLastName.frame		= [self getFieldSize:1];
			labelLastName.frame			= [self getLabelSize:1];
			
			break;
			
		case 1:	//just title, first & last name
			textFieldTitleName.frame	= [self getFieldSize:0];
			labelTitleName.frame		= [self getLabelSize:0];
			
			textFieldFirstName.frame	= [self getFieldSize:1];
			labelFirstName.frame		= [self getLabelSize:1];
			
			textFieldLastName.frame		= [self getFieldSize:2];
			labelLastName.frame			= [self getLabelSize:2];
			
			break;
			
		default: //all
			textFieldTitleName.frame	= [self getFieldSize:0];
			labelTitleName.frame		= [self getLabelSize:0];
			
			textFieldFirstName.frame	= [self getFieldSize:1];
			labelFirstName.frame		= [self getLabelSize:1];
			
			textFieldLastName.frame		= [self getFieldSize:2];
			labelLastName.frame			= [self getLabelSize:2];
			
			textFieldSuffix	.frame		= [self getFieldSize:3];
			labelSuffix.frame			= [self getLabelSize:3];
			
			break;
	}
}


@end
