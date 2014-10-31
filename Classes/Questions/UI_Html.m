//
//  UI_Html.m
//  Polldaddy
//
//  Created by Eoin Gallagher on 27/05/2010.
//  Copyright 2010 Automattic. All rights reserved.
//

#import "UI_Html.h"
#import "Question.h"
#import "ST_Html.h"
#import "NSString+XMLEntities.h"
#import "Constants.h"
#import "Language.h"

@implementation UI_Html

@synthesize question;

- initWithQuestion:(ST_Html *)theQuestion andPack:(Language *)thePack {
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
	return YES;
}

- (boolean_t) isValid {
	return YES;
}

- (NSString *) collectData {
	// Get the text, encoding any XML
	return @"";
}

-(void) loadTitle:(NSString *)title withNote:(NSString *)note withDisplay:(UIWebView *)questionDetails isMandatory:(BOOL)mandatory {
	NSString *webNote;
    
	if ( UI_USER_INTERFACE_IDIOM() == UIUserInterfaceIdiomPad ) {
		webNote = [NSString stringWithFormat:@"<html><head><style type='text/css'>"
							 "body { font: 18px Helvetica,arial; background-color: transparent; color: #808080; padding: 0; margin: 0;} "
							 "h1 { font: 32px 'American Typewriter'; color: #6c6c6c; font-weight: bold; margin-bottom: 5px } "
							 "* { -webkit-touch-callout: none; -webkit-user-select: none; -webkit-text-size-adjust: none;} "
							 "a img, img { border: none; }"
							 "</style><meta name='viewport' content='initial-scale=1.0, user-scalable=no, width=%f'></head>"
							 "<body>%@</body>"
							 "</html>", [self getWidthInOrientation:UIDeviceOrientationPortrait] - ( [Constants innerFrameXOffset] * 2 ), [question html]];
	}
	else {
		webNote = [NSString stringWithFormat:@"<html><head><style type='text/css'>"
							 "body { font: 18px Helvetica,arial; background-color: transparent; color: #808080; padding: 0; margin: 0;} "
							 "h1 { font: 32px 'American Typewriter'; color: #6c6c6c; font-weight: bold; margin-bottom: 5px } "
							 "* { -webkit-touch-callout: none; -webkit-user-select: none; -webkit-text-size-adjust: none;} "
							 "a img, img { border: none; }"
							 "</style><meta name='viewport' content='initial-scale=0.7, user-scalable=no, width=%f'></head>"
							 "<body>%@</body>"
							 "</html>", [self getWidthInOrientation:UIDeviceOrientationPortrait] - ( [Constants innerFrameXOffset] * 2 ), [question html]];
	}
	
    NSString *localNote = [question allocLocalizeString:webNote andSurveyId:question.surveyId];

    NSString *htmlPath = [[NSBundle mainBundle] resourcePath];
	
	htmlPath = [htmlPath stringByReplacingOccurrencesOfString:@"/" withString:@"//"];
	htmlPath = [htmlPath stringByReplacingOccurrencesOfString:@" " withString:@"%20"];
    
	questionDetails.hidden   = YES;
	questionDetails.delegate = self;

	[questionDetails loadHTMLString:localNote baseURL:[NSURL URLWithString:[NSString stringWithFormat:@"file:/%@//", htmlPath]]];
}

// Implement viewDidLoad to do additional setup after loading the view, typically from a nib.
-(void) displayQuestion {
	// Without these the frame resizes to the height of the text field, meaning that it cuts off the 'hit' area of the field
	self.view.autoresizingMask    = NO;
	self.view.autoresizesSubviews = NO;
}

- (BOOL)shouldAutorotateToInterfaceOrientation:(UIInterfaceOrientation)interfaceOrientation {
	// Overriden to allow any orientation.
	return YES;
}

- (void)willAnimateRotationToInterfaceOrientation:(UIInterfaceOrientation)interfaceOrientation duration:(NSTimeInterval)duration{
}


@end
