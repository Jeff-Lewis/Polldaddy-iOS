    //
//  UI_Question.m
//  Polldaddy
//
//  Created by John Godley on 26/05/2010.
//  Copyright 2010 Automattic. All rights reserved.
//

#import "UI_Question.h"
#import "Question.h"
#import "Constants.h"
#import "Language.h"
#import "NSString+HTML.h"

extern UIInterfaceOrientation gAppOrientation;

@implementation UI_Question

@synthesize pack;

- init {
	self = [super init];
	
	// The lastPoint moves down the page as we render various parts of the question
	lastPoint = originPoint = CGPointMake( [Constants innerFrameXOffset], [Constants innerFrameYOffset] );
	return self;
}

- (NSString *) collectData {
	return @"";
}

- (boolean_t) isValid {
	return YES;
}

- (boolean_t) isCompleted {
	return YES;
}

- (NSString *) getError {
	return @"Unknown error, blimey!";
}

- (NSString *) getValidError {
	return @"Unknown error, blimey!";
}

- (NSDictionary *)getFormValues:(UIWebView *)web restrictTo:(NSString *)restricter {
    NSString *encoded = [web stringByEvaluatingJavaScriptFromString:@"get_data();"];
    NSArray *data = [encoded componentsSeparatedByString:@"&"];
    NSMutableDictionary *dict = [[NSMutableDictionary alloc] init];
    
    for ( NSString *part in data ) {
        NSArray *parts = [part componentsSeparatedByString:@"="];
        
        if ( [parts count] == 2 ) {
            NSString *name = [[parts objectAtIndex:0] decodeFromPercentEscapeString];
            NSString *value = [[parts objectAtIndex:1] decodeFromPercentEscapeString];

            NSArray *nameParts = [name componentsSeparatedByString:@"["];
            NSObject *ptr = dict, *newPtr;
            
            //        if ( pos < [nameParts count] - 1 && [(NSString *)[nameParts objectAtIndex:(pos + 1)] rangeOfString@"]"] )
            for ( unsigned int pos = 0; pos < [nameParts count]; pos++ ) {
                NSString *sub = [nameParts objectAtIndex:pos], *next = ( pos + 1 < [nameParts count] ) ? [nameParts objectAtIndex:(pos + 1 )] : nil;
                NSString *subClean = [sub stringByReplacingOccurrencesOfString:@"]" withString:@""];

                if ( [nameParts count] == 1 )
                    [dict setObject:value forKey:subClean];
                else if ( pos < [nameParts count] - 1 ) {
                    if ( [next compare:@"]"] != NSOrderedSame ) {
                        // Next item is an array therefore this must be a dictionary
                        newPtr = [(NSMutableDictionary *)ptr objectForKey:subClean];
                        
                        if ( newPtr == nil ) {
                            newPtr = [[NSMutableDictionary alloc] init];
                            [(NSMutableDictionary *)ptr setObject:newPtr forKey:subClean];
                        }
                        
                        ptr = newPtr;
                    }
                    else {
                        // Next item is an array
                        newPtr = [(NSMutableDictionary *)ptr objectForKey:subClean];
                        
                        if ( newPtr == nil ) {
                            newPtr = [[NSMutableArray alloc] init];
                            [(NSMutableDictionary *)ptr setObject:newPtr forKey:subClean];
                        }
                        
                        ptr = newPtr;
                    }
                }
                else if ( [ptr isKindOfClass:[NSMutableArray class]] ) {
                    // Last - add to array
                    [(NSMutableArray *)ptr addObject:value];
                }
                else {
                    [(NSMutableDictionary *)ptr setObject:value forKey:subClean];
                }
            }
        }                
    }
    
    if ( [dict objectForKey:restricter] )
        return [NSDictionary dictionaryWithDictionary:[dict objectForKey:restricter]];

    return [NSDictionary dictionaryWithDictionary:dict];
}

-(void) displayNextButton:(UIButton *)surveyButton andCancelButton:(UIButton *)cancelButton {
	// Move the buttons to an appropriate position
	cancelButton.hidden = NO;
    
	[cancelButton setTitle:[NSString stringWithFormat:@"« %@", [pack getPhrase:PHRASE_STARTOVER]] forState:UIControlStateNormal];
	[surveyButton setTitle:[NSString stringWithFormat:@"%@ »", [pack getPhrase:PHRASE_CONTINUE]] forState:UIControlStateNormal];

	if (UI_USER_INTERFACE_IDIOM() == UIUserInterfaceIdiomPad) {
		[cancelButton setFrame:CGRectMake( 40, [self getMaxHeight] - 80 - 25, 120, 40 )];

		if ( gAppOrientation == UIDeviceOrientationLandscapeLeft || gAppOrientation == UIDeviceOrientationLandscapeRight )
			[surveyButton setFrame:CGRectMake(760, 653, 230, [Constants buttonHeight])];
		else
			[surveyButton setFrame:CGRectMake(500, 910, 230, [Constants buttonHeight])];
	}
	else {
		if ( gAppOrientation == UIDeviceOrientationLandscapeLeft || gAppOrientation == UIDeviceOrientationLandscapeRight ) {
			[cancelButton setFrame:CGRectMake( 30, [self getMaxHeight] - 62, 100, [Constants buttonHeight] )];
			[surveyButton setFrame:CGRectMake( 320, [self getMaxHeight] - 62, 130, [Constants buttonHeight] )];
		}
		else {
			[cancelButton setFrame:CGRectMake( 20, [self getMaxHeight] - 70, 100, [Constants buttonHeight] )];
			[surveyButton setFrame:CGRectMake( 170, [self getMaxHeight] - 70, 130, [Constants buttonHeight] )];
		}
	}
}

-(void) loadTitle:(NSString *)title withNote:(NSString *)note withDisplay:(UIWebView *)questionDetails isMandatory:(BOOL)mandatory {
	if ( note == NULL )
		note = @"";

	NSString *webNote;
	if ( UI_USER_INTERFACE_IDIOM() == UIUserInterfaceIdiomPad ) {
		webNote = [NSString stringWithFormat:@"<html><head><link href=\"shared.css\" rel=\"stylesheet\" /><link href=\"ipad.css\" rel=\"stylesheet\" /><meta name='viewport' content='initial-scale=1.0, user-scalable=no, width=%f'></head>"
							 "<body class=\"question\"><h1>%@%@</h1>%@</body>"
                   "</html>", [self getWidthInOrientation:UIDeviceOrientationPortrait] - ( [Constants innerFrameXOffset] * 2 ), title, ( mandatory == YES ) ? @"<span class='mand'>*</span>" : @"", note];
	}
	else {
		webNote = [NSString stringWithFormat:@"<html><head><link href=\"shared.css\" rel=\"stylesheet\" /><link href=\"iphone.css\" rel=\"stylesheet\" /><meta name='viewport' content='initial-scale=0.7, user-scalable=no, width=%f'></head>"
							 "<body class=\"question\"><h1>%@%@</h1>%@</body>"
							 "</html>", [self getWidthInOrientation:UIDeviceOrientationPortrait] - ( [Constants innerFrameXOffset] * 2 ), title, ( mandatory == YES ) ? @"<span class='mand'>*</span>" : @"", note];
	}
	
	questionDetails.hidden   = YES;
	questionDetails.delegate = self;
	
	NSString *htmlPath = [[NSBundle mainBundle] resourcePath];
	
	htmlPath = [htmlPath stringByReplacingOccurrencesOfString:@"/" withString:@"//"];
	htmlPath = [htmlPath stringByReplacingOccurrencesOfString:@" " withString:@"%20"];

	[questionDetails loadHTMLString:webNote baseURL:[NSURL URLWithString:[NSString stringWithFormat:@"file:/%@//", htmlPath]]];
}

- (void)webViewDidFinishLoad:(UIWebView *)view {
    if ( view.hidden == YES ) {
        [self updateDetails:view];
        view.hidden = NO;
        
        // Notify anyone interested that we are done
        [[NSNotificationCenter defaultCenter] postNotificationName:@"QuestionLoaded" object:self];
    }
}

-(void) setController:(QuestionsViewController *)theController {
	controller = theController;
}

-(void) updateDetails:(UIWebView *)view {
	view.hidden = YES;
	view.frame  = CGRectMake( view.frame.origin.x, view.frame.origin.y, [self getMaxFrameWidth], 10 );

	unsigned long height = [[view stringByEvaluatingJavaScriptFromString:@"document.documentElement.clientHeight;"] integerValue];
	
	// Adjust iPhone height according to scale factor
	if ( [Constants isIphone] )
		height *= 0.7; 

	if ( height > [self getMaxFrameHeight] )
		height = [self getMaxFrameHeight];

	view.frame  = CGRectMake( view.frame.origin.x, [Constants innerFrameYOffset], [self getMaxFrameWidth], height);
	view.hidden = NO;
	
	lastPoint = CGPointMake( view.frame.origin.x, [Constants innerFrameYOffset] + view.frame.size.height + [Constants labelBottomPadding] );
}

-(void) displayQuestion {
}

-(CGFloat)getMaxFrameWidth {
	return [self getMaxWidth] - ( [Constants innerFrameXOffset] * 1.6 );
}

-(CGFloat)getMaxFrameHeight {
	return [self getMaxHeight] - [Constants questionToolbarHeight] - ( [Constants innerFrameYOffset] * 1.5);
}

- (CGPoint) autoHeightLabel:(UILabel *)field withText:(NSString *)text atPoint:(CGPoint)last {
	CGSize maximumLabelSize  = CGSizeMake( [self getMaxFrameWidth], [self getMaxFrameHeight] );
    CGRect rect = [text boundingRectWithSize:maximumLabelSize
                                                 options:NSStringDrawingTruncatesLastVisibleLine |
                   NSStringDrawingUsesLineFragmentOrigin
                                              attributes:@{NSFontAttributeName:field.font} context:nil];
	CGRect frame = field.frame;
	
	// Set the Y position and height of the label
	frame.origin.y    = last.y;
	frame.origin.x    = last.x;
	frame.size.height = rect.size.height;
	frame.size.width  = [self getMaxFrameWidth];
	
	// Update the text and set the new frame details
	field.text   = text;
	field.frame  = frame;
	field.hidden = NO;
	
	// Return our position as lastY + height of field + [Constants labelBottomPadding]
	return CGPointMake( last.x, last.y + field.frame.size.height + [Constants labelBottomPadding] );
}

- (CGFloat) getWidthInOrientation:(unsigned int)orientation {
	if (UI_USER_INTERFACE_IDIOM() == UIUserInterfaceIdiomPad) {
		if ( orientation == UIDeviceOrientationLandscapeLeft || orientation == UIDeviceOrientationLandscapeRight )
			return [Constants iPadHeight];
		return [Constants iPadWidth];
	}
	else {
		if ( orientation == UIDeviceOrientationLandscapeLeft || orientation == UIDeviceOrientationLandscapeRight )
			return 480.0;
		return 320.0;
	}
}

- (CGFloat) getMaxWidth {
	// There must be a better way to do this...
	if (UI_USER_INTERFACE_IDIOM() == UIUserInterfaceIdiomPad) {
		if ( gAppOrientation == UIDeviceOrientationLandscapeLeft || gAppOrientation == UIDeviceOrientationLandscapeRight )
			return [Constants iPadHeight];
		return [Constants iPadWidth];
	}
	else {
		if ( gAppOrientation == UIDeviceOrientationLandscapeLeft || gAppOrientation == UIDeviceOrientationLandscapeRight )
			return 480.0;
		return 320.0;
	}
}

- (CGFloat) getMaxHeight {
	// There must be a better way to do this...
	if (UI_USER_INTERFACE_IDIOM() == UIUserInterfaceIdiomPad) {
		if ( gAppOrientation == UIDeviceOrientationLandscapeLeft || gAppOrientation == UIDeviceOrientationLandscapeRight )
			return [Constants iPadWidth];
		return [Constants iPadHeight];
	}
	else {
		if ( gAppOrientation == UIDeviceOrientationLandscapeLeft || gAppOrientation == UIDeviceOrientationLandscapeRight )
			return 320.0;
		return 480.0;
	}
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
