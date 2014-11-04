    //
//  UI_PageHeader.m
//  Polldaddy
//
//  Created by John Godley on 31/05/2010.
//  Copyright 2010 Automattic. All rights reserved.
//

#import "UI_PageHeader.h"
#import "Constants.h"
#import "Language.h"
#import "ST_PageHeader.h"

@implementation UI_PageHeader

- initWithQuestion:(ST_PageHeader *)theQuestion andPack:(Language *)thePack {
	self = [super init];
	
	question = theQuestion;
    pack = thePack;
	return self;
}

-(void) loadTitle:(NSString *)title withNote:(NSString *)note withDisplay:(UIWebView *)questionDetails isMandatory:(BOOL)mandatory {
	if ( note == NULL )
		note = @"";

	NSString *webNote;
	
	if ( UI_USER_INTERFACE_IDIOM() == UIUserInterfaceIdiomPad ) {
		webNote = [NSString stringWithFormat:@"<html><head><link href=\"shared.css\" rel=\"stylesheet\" /><link href=\"ipad.css\" rel=\"stylesheet\" /><meta name='viewport' content='initial-scale=1.0, user-scalable=no, width=%f'></head>"
							 "<body class=\"page-header\"><h1>%@</h1>%@</body>"
							 "</html>", [self getWidthInOrientation:UIDeviceOrientationPortrait] - ( [Constants innerFrameXOffset] * 2 ), title, note];
	}
	else {
		webNote = [NSString stringWithFormat:@"<html><head><link href=\"shared.css\" rel=\"stylesheet\" /><link href=\"iphone.css\" rel=\"stylesheet\" /><meta name='viewport' content='initial-scale=0.7, user-scalable=no, width=%f'></head>"
							 "<body class=\"page-header\"><h1>%@</h1>%@</body>"
							 "</html>", [self getWidthInOrientation:UIDeviceOrientationPortrait] - ( [Constants innerFrameXOffset] * 2 ), title, note];
	}
	
	questionDetails.hidden   = YES;
	questionDetails.delegate = self;
	
	NSString *htmlPath = [[NSBundle mainBundle] resourcePath];
	
	htmlPath = [htmlPath stringByReplacingOccurrencesOfString:@"/" withString:@"//"];
	htmlPath = [htmlPath stringByReplacingOccurrencesOfString:@" " withString:@"%20"];
	
	[questionDetails loadHTMLString:webNote baseURL:[NSURL URLWithString:[NSString stringWithFormat:@"file:/%@//", htmlPath]]];
}

-(void) updateDetails:(UIWebView *)view {
	view.hidden = YES;
	view.frame  = CGRectMake( view.frame.origin.x, view.frame.origin.y, [self getMaxFrameWidth], 10 );
	
	NSUInteger height = [[view stringByEvaluatingJavaScriptFromString:@"document.documentElement.clientHeight;"] integerValue];

	if ( height > [self getMaxFrameHeight] ) {
		height = [self getMaxFrameHeight];
		view.userInteractionEnabled = YES;
	}
	
	view.frame  = CGRectMake( view.frame.origin.x, [Constants innerFrameYOffset] + ( ( [self getMaxFrameHeight] - height ) / 2 ), [self getMaxFrameWidth], height );
	view.hidden = NO;
	
	lastPoint = CGPointMake( view.frame.origin.x, [Constants innerFrameYOffset] + view.frame.size.height + [Constants labelBottomPadding] );
}

-(void) displayNextButton:(UIButton *)surveyButton andCancelButton:(UIButton *)cancelButton {
	// Hide cancel button and show next button in the middle
	if ( [Constants isIpad] )
		[surveyButton setFrame:CGRectMake( ( [self getMaxWidth] - 340 ) / 2, [Constants toolbarButtonYPos], 340, [Constants buttonHeight] )];
	else
		[surveyButton setFrame:CGRectMake( ( [self getMaxWidth] - 140 ) / 2, [Constants toolbarButtonYPos], 140, [Constants buttonHeight] )];	

	[cancelButton setHidden:YES];
}

// Implement viewDidLoad to do additional setup after loading the view, typically from a nib.
- (void) displayQuestion {
	// We don't have anything else on this frame
	//	self.view.hidden = YES;
}

-(BOOL)shouldAutorotate {
    return YES;
}

-(NSUInteger)supportedInterfaceOrientations {
    return UIInterfaceOrientationMaskAll;
}

- (void)didReceiveMemoryWarning {
    // Releases the view if it doesn't have a superview.
    [super didReceiveMemoryWarning];
    
    // Release any cached data, images, etc that aren't in use.
}



@end
