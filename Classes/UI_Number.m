//
//  UI_Number.m
//  Polldaddy
//
//  Created by John Godley on 26/05/2010.
//  Copyright 2010 Automattic. All rights reserved.
//

#import "UI_Number.h"
#import "Question.h"
#import "ST_Number.h"
#import "NSString+XMLEntities.h"
#import "Constants.h"
#import "Language.h"

@implementation UI_Number

@synthesize question;

- initWithQuestion:(ST_Number *)theQuestion andPack:(Language *)thePack {
	self = [super init];
	
	question = theQuestion;
    pack = thePack;
	
	textField = nil;
	slider    = nil;
	label     = nil;
	return self;
}

// Check max/min values
- (boolean_t) isValid {
    NSString *value = textField.text;
    
	return [textField.text length] == 0 || [question inRange:[[value stringByReplacingOccurrencesOfString:@"," withString:@""] floatValue]];
}

- (NSString *) getValidError {
	return [pack getPhrase:PHRASE_VALID_NUMBER];
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
	// Create the XML for my answer
	NSString *myData  = [NSString stringWithFormat:@"<number>%@</number>", [question getNumber:textField.text]];
	
	return myData;
}

-(CGRect) getSliderRect {
	return CGRectMake( [self getMaxFrameWidth] / 8, lastPoint.y, ( [self getMaxFrameWidth] / 8 ) * 7, [Constants textEditHeight] );
}

- (void) setInputRect {
	unsigned int label_width = 0, input_width = [self getMaxFrameWidth] / 2;
	unsigned int label_x = 0, input_x = lastPoint.x;
	unsigned int input_y = lastPoint.y, label_y = lastPoint.y;

	if ( [question hasLabel] ) {
		CGSize maximumLabelSize = CGSizeMake( [self getMaxFrameWidth] / 2, [Constants textEditHeight] );
		CGSize size = [[question label] sizeWithFont:label.font constrainedToSize:maximumLabelSize lineBreakMode:label.lineBreakMode]; 

		label_width  = size.width;
		input_width -= label_width;
		
		if ( [question labelBefore] ) {
			label_width += [Constants labelBottomPadding] * 2;
			label_x      = lastPoint.x;
			input_x      = label_x + label_width;
		}
		else {
			label_x = lastPoint.x + input_width + 10 + label_width;
		}

		input_width = MAX( [self getMaxFrameWidth] / 2, [self getMaxFrameWidth] - label_width - input_width );
	}
	
	if ( question.isSlider ) {
		CGRect sliderRect = [self getSliderRect];
		
		label_y += sliderRect.size.height + [Constants textEditHeight];
		input_y = label_y + 5;
		input_y -= ( [Constants labelBottomPadding] * 2 );
	}
	
    [textField setFrame:CGRectMake( input_x, input_y, input_width, [Constants textEditHeight] )];	
    [label setFrame:CGRectMake( label_x, label_y, label_width, [Constants textEditHeight] )];	
}

- (IBAction)sliderChanged:(UISlider *)sender {
	textField.text = [question getFormatted:slider.value];
}

- (BOOL)textFieldShouldReturn:(UITextField *)textField {
	return YES;
}

-(BOOL)textField:(UITextField *)textField shouldChangeCharactersInRange:(NSRange)range replacementString:(NSString *)textEntered {
	NSCharacterSet *myCharSet = [NSCharacterSet characterSetWithCharactersInString:@"-0123456789,.\n"];
	
	for (unsigned int i = 0; i < [textEntered length]; i++) {
		unichar c = [textEntered characterAtIndex:i];

		if (![myCharSet characterIsMember:c] ) {
			return NO;
		}
	}
	return YES;
}

- (IBAction)readField:(id)sender {
	// Remove the popup keyboard
  [sender resignFirstResponder];
}

// Implement viewDidLoad to do additional setup after loading the view, typically from a nib.
-(void) displayQuestion {
	// Without these the frame resizes to the height of the text field, meaning that it cuts off the 'hit' area of the field
	self.view.autoresizingMask    = NO;
	self.view.autoresizesSubviews = NO;

	if ( question.isSlider ) {
		slider = [[UISlider alloc] initWithFrame:[self getSliderRect]];
		slider.minimumValue = question.minValue;
		slider.maximumValue = question.maxValue;
		slider.value        = question.defaultValue;
		
		[slider addTarget:self action:@selector(sliderChanged:) forControlEvents:UIControlEventValueChanged];
		[self.view addSubview:slider];
	}
	
	textField = [[UITextField alloc] init];
	textField.adjustsFontSizeToFitWidth = TRUE;
	textField.borderStyle               = UITextBorderStyleRoundedRect;
	textField.returnKeyType             = UIReturnKeyDone;
	textField.keyboardType              = UIKeyboardTypeNumbersAndPunctuation;
	textField.delegate                  = self;
	[textField addTarget:self action:@selector(readField:) forControlEvents:UIControlEventEditingDidEndOnExit];     

	if ( [Constants isIphone] )
		textField.font = [UIFont systemFontOfSize:14];
	
	if ( [question hasLabel] ) {
		label = [[UILabel alloc] init];
		
		label.text            = question.label;
		label.textColor       = [UIColor PdTextColor];
		label.backgroundColor = [UIColor clearColor];
		label.textAlignment   = NSTextAlignmentLeft;
		
		[self.view addSubview:label];
		
		if ( [Constants isIphone] )
			label.font = [UIFont systemFontOfSize:14];
	}
	
	[self.view addSubview:textField];	
	[self setInputRect];
	
	// text box or slider
	if ( question.isSlider ) {
		textField.enabled     = NO; // Readonly
		textField.borderStyle = UITextBorderStyleNone;
		textField.textColor   = [UIColor PdTextColor];
		
		[self sliderChanged:slider];
	}
}

-(BOOL)shouldAutorotate {
    return YES;
}

-(NSUInteger)supportedInterfaceOrientations {
    return UIInterfaceOrientationMaskAll;
}

- (void)willAnimateRotationToInterfaceOrientation:(UIInterfaceOrientation)interfaceOrientation duration:(NSTimeInterval)duration{
	if ( question.isSlider ) {
		
		
	}
	else {
		[self setInputRect];
	}
}



@end
