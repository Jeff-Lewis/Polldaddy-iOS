//
//  UI_Text.m
//  Polldaddy
//
//  Created by John Godley on 26/05/2010.
//  Copyright 2010 Automattic. All rights reserved.
//

#import "UI_PhoneNumber.h"
#import "Question.h"
#import "ST_PhoneNumber.h"
#import "NSString+XMLEntities.h"
#import "Constants.h"
#import "PolldaddyAppDelegate.h"
#import "Language.h"

@interface CountryCode : NSObject {
	NSString *country;
	NSString *code;
}

@property (nonatomic, readonly,strong) NSString *country, *code;
@end

@implementation CountryCode

@synthesize country, code;

-(id) initWithCountry:(NSString *)theCountry andCode:(NSString *)theCode {
	self = [super init];
	
	country = theCountry;
	code    = theCode;
	return self;
}


- (NSComparisonResult)compare:(CountryCode *)otherObject {
	return [self.country compare:otherObject.country];
}

@end


@implementation UI_PhoneNumber

@synthesize question;

- initWithQuestion:(ST_PhoneNumber *)theQuestion andPack:(Language *)thePack {
	self = [super init];
	
	question = theQuestion;
    pack = thePack;

	NSMutableArray *tmp = [[NSMutableArray alloc] init];
	
	// Copy countries into an array for the picker
	for ( NSString *country in question.countries ) {
		CountryCode *newCountry = [[CountryCode alloc] initWithCountry:[question.countries objectForKey:country] andCode:country];
		
		[tmp addObject:newCountry];
	}
	
	countries = [tmp sortedArrayUsingSelector:@selector(compare:)];

	
	// Find the default country in the list
	unsigned int pos = 0;
	for ( CountryCode *code in countries ) {
		if ( [code.code isEqualToString:question.defaultCountry] ) {
			chosenCountry = pos;
			break;
		}
		
		pos++;
	}
	
	picker      = nil;
	pickCountry = nil;
	browser     = nil;
	return self;
}

- (boolean_t) isCompleted {
	if ( [textField.text length] == 0 )
		return NO;
	return YES;
}

// Validate the phone number
- (boolean_t) isValid {
	CountryCode *country = [countries objectAtIndex:chosenCountry];

	if ( [textField.text length] == 0 || [[browser stringByEvaluatingJavaScriptFromString:[NSString stringWithFormat:@"phone_as_xml( '%@', '%@' )", textField.text, country.code]] isEqualToString:@"true"] ) {
		return YES;		
	}
	
	return NO;
}

- (NSString *) getValidError {
	return [pack getPhrase:PHRASE_VALID_PHONE];
}

- (NSString *) getError {
	if ( [self isCompleted] == NO )
		return [pack getPhrase:PHRASE_MANDATORY];
	return @"";
}

- (NSString *) collectData {
	CountryCode *country = [countries objectAtIndex:chosenCountry];

	// Create the XML for my answer
	NSString *myData  = [NSString stringWithFormat:@"<raw>%@</raw><country>%@</country>", [textField.text length] > 0 ? textField.text : @"", country.code];
	
	return myData;
}

- (CGRect) getFieldSize {
	if ( [Constants isIpad] )
		return CGRectMake( lastPoint.x, lastPoint.y, ( [self getMaxFrameWidth] - 120), [Constants textEditHeight] );
	return CGRectMake( lastPoint.x,lastPoint.y, [self getMaxFrameWidth], [Constants textEditHeight] );
}

- (CGRect) getButtonRect {
	CGSize maximumLabelSize  = CGSizeMake( [self getMaxFrameWidth], [self getMaxFrameHeight] );
	CGSize expectedLabelSize = [[pickCountry titleForState:UIControlEventEditingDidEndOnExit] sizeWithFont:pickCountry.titleLabel.font constrainedToSize:maximumLabelSize lineBreakMode:pickCountry.titleLabel.lineBreakMode]; 

	CGRect field = [self getFieldSize];
	
	return CGRectMake( lastPoint.x, field.origin.y + field.size.height + 10, expectedLabelSize.width + 10, 30);
}

- (CGRect) getLabelSize {
	CGRect field;
	
	if ( question.canChangeCountry )
		field = [self getButtonRect];
	else
		field = [self getFieldSize];

	return CGRectMake( lastPoint.x, field.origin.y + field.size.height + 10, [self getMaxFrameWidth], 30);
}

- (IBAction)readField:(id)sender {
	// Remove the popup keyboard
	[sender resignFirstResponder];
}

- (void)pickerView:(UIPickerView *)thePickerView didSelectRow:(NSInteger)row inComponent:(NSInteger)component {
	chosenCountry = row;
}

- (CGRect) getPickerFrame {
	unsigned int height = 216;
	
	return CGRectMake( 0, [self getMaxHeight] - height - 20, [self getMaxWidth], height );
}

- (NSInteger)numberOfComponentsInPickerView:(UIPickerView *)thePickerView {	
	return 1;
}

- (NSString *)pickerView:(UIPickerView *)thePickerView titleForRow:(NSInteger)row forComponent:(NSInteger)component {
	CountryCode *country = [countries objectAtIndex:row];
	
	return country.country;
}

- (NSInteger)pickerView:(UIPickerView *)thePickerView numberOfRowsInComponent:(NSInteger)component {
	return [countries count];
}

- (CGRect) getToolbarFrame {
	if ( [Constants isIpad] )
		return CGRectMake(0, [self getMaxHeight] - 216 - 60, [self getMaxWidth], 40);
	else
		return CGRectMake(0, [self getMaxHeight] - 216 - 60, [self getMaxWidth], 40);
}

- (void)pickedCountry:(id)sender {
	textField.enabled = YES;
	
	[picker removeFromSuperview];

	[toolbar removeFromSuperview];

	toolbar = nil;
	picker  = nil;
	
	// Update button
	CountryCode *country = [countries objectAtIndex:chosenCountry];
	
	[pickCountry setTitle:country.country forState:UIControlStateNormal];
	pickCountry.frame = [self getButtonRect];
}

- (void)changeCountry:(id)sender {
	
	// set currently selected value
	picker = [[UIPickerView alloc] initWithFrame:[self getPickerFrame]];
	picker.delegate = self;
	picker.showsSelectionIndicator = YES;
	[picker selectRow:chosenCountry inComponent:0 animated:NO];
	
	toolbar = [[UIToolbar alloc] init];
	
	UIBarButtonItem *button = [[UIBarButtonItem alloc] initWithBarButtonSystemItem:UIBarButtonSystemItemSave target:self action:@selector(pickedCountry:)];
	NSMutableArray  *buttons = [[NSMutableArray alloc] init];
	
	[buttons addObject:button];
	[toolbar setItems:buttons animated:YES];
	toolbar.barStyle = UIBarStyleBlack;
	 

	[toolbar setFrame:[self getToolbarFrame]];
	
	PolldaddyAppDelegate *delegate = [[UIApplication sharedApplication] delegate];
	[delegate.rootViewController.view addSubview:toolbar];
	[delegate.rootViewController.view addSubview:picker];
	
	textField.enabled = NO;
}

// Implement viewDidLoad to do additional setup after loading the view, typically from a nib.
-(void) displayQuestion {
	// Without these the frame resizes to the height of the text field, meaning that it cuts off the 'hit' area of the field
	self.view.autoresizingMask    = NO;
	self.view.autoresizesSubviews = NO;
	
	// Create text field
	textField = [[UITextField alloc] initWithFrame:[self getFieldSize]];
	
	// Text field settings
	textField.returnKeyType             = UIReturnKeyDone;
	textField.adjustsFontSizeToFitWidth = TRUE;
	textField.borderStyle               = UITextBorderStyleRoundedRect;
	textField.keyboardType				      = UIKeyboardTypeNumbersAndPunctuation;
	textField.autocapitalizationType    = UITextAutocapitalizationTypeNone;

	// Hook up data entry
	[textField addTarget:self action:@selector(readField:) forControlEvents:UIControlEventEditingDidEndOnExit];  
	
	// Add to view
	[self.view addSubview:textField];
	
	label                 = [[UILabel alloc] init];
	label.frame           = [self getLabelSize];
	label.textAlignment   = NSTextAlignmentLeft;
	label.text            = question.example;
	label.backgroundColor = [UIColor clearColor];
	label.textColor       = [UIColor PdTextColor];
	
	[self.view addSubview:label];
	
	if ( [Constants isIphone] ) {
		textField.font = [UIFont systemFontOfSize:14];
		label.font     = [UIFont systemFontOfSize:14];
	}
	
	if ( question.canChangeCountry ) {
		pickCountry = [UIButton buttonWithType:UIButtonTypeRoundedRect];

		[pickCountry setTitle:[question getDefaultCountry] forState:UIControlStateNormal];
		[pickCountry addTarget:self action:@selector(changeCountry:) forControlEvents:UIControlEventTouchUpInside];

		pickCountry.frame                = [self getButtonRect];
		pickCountry.titleLabel.textColor = [UIColor PdTextColor];

		[self.view addSubview:pickCountry];
	}
	
	// Create a fake web browser to run our JS
	browser = [[UIWebView alloc] init];
	NSString *webNote;

	webNote = [NSString stringWithFormat:@"<html><head><script type='text/javascript' src='phone-lib.js'></script><script type='text/javascript' src='phone.js'></script></head><body></body></html>"];
	
	NSString *htmlPath = [[NSBundle mainBundle] resourcePath];
	
	htmlPath = [htmlPath stringByReplacingOccurrencesOfString:@"/" withString:@"//"];
	htmlPath = [htmlPath stringByReplacingOccurrencesOfString:@" " withString:@"%20"];

	[browser loadHTMLString:webNote baseURL:[NSURL URLWithString:[NSString stringWithFormat:@"file:/%@//", htmlPath]]];
}

-(BOOL)shouldAutorotate {
    return YES;
}

-(NSUInteger)supportedInterfaceOrientations {
    return UIInterfaceOrientationMaskAll;
}

- (void)willAnimateRotationToInterfaceOrientation:(UIInterfaceOrientation)interfaceOrientation duration:(NSTimeInterval)duration{
	textField.frame = [self getFieldSize];
	label.frame     = [self getLabelSize];
	
	if ( picker ) {
		[toolbar setFrame:[self getToolbarFrame]];
		picker.frame = [self getPickerFrame];
	}
}



@end
