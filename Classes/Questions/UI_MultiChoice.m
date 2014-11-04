    //
//  UI_MultiChoice.m
//  Polldaddy
//
//  Created by John Godley on 27/05/2010.
//  Copyright 2010 Automattic. All rights reserved.
//

#import "UI_MultiChoice.h"
#import "Question.h"
#import "ST_MultiChoice.h"
#import "NSString+XMLEntities.h"
#import "RadioCell.h"
#import "Constants.h"
#import "Language.h"
#import "PolldaddyAppDelegate.h"
#import "stdlib.h"
#import "GTMNSString+XML.h"

extern UIInterfaceOrientation gAppOrientation;

@implementation UI_MultiChoice

@synthesize question;

- initWithQuestion:(ST_MultiChoice *)theQuestion andPack:(Language *)thePack {
	self = [super init];
	
	question = theQuestion;
	
	commentField = nil;
	commentLabel = nil;
    pack = thePack;
	return self;
}

- (NSString *) getError {
    NSDictionary *dataArray = [self getFormValues:web restrictTo:[NSString stringWithFormat:@"q_%lu", question.questionId]];
    unsigned long chosencount = 0;
    
    if ( [dataArray objectForKey:@"choice"] ) {
        if ( [question isRadio] )
            chosencount++;
        else if ( [[dataArray objectForKey:@"choice"] isKindOfClass:[NSArray class]] ) {
            NSArray *arr = [dataArray objectForKey:@"choice"];
            chosencount = [arr count];
        }
    }
    
    if ( [[dataArray objectForKey:@"other"] length] > 0 )
        chosencount++;
    
    if ( [question isCheckbox] && ( [question minLimit] > 0 || [question maxLimit] > 0 ) ) {
        if ( [question minLimit] > 0 && chosencount < [question minLimit] )
            return [pack getPhrase:PHRASE_TOOFEW];
        
        if ( [question maxLimit] > 0 && chosencount > [question maxLimit] )
            return [pack getPhrase:PHRASE_TOOMANY];
    }

	return [pack getPhrase:PHRASE_MANDATORY];
}

- (boolean_t) isCompleted {
    NSDictionary *dataArray = [self getFormValues:web restrictTo:[NSString stringWithFormat:@"q_%lu", question.questionId]];
    unsigned long chosencount = 0;
    
    if ( [dataArray objectForKey:@"choice"] ) {
        if ( [question isRadio] )
            chosencount++;
        else if ( [[dataArray objectForKey:@"choice"] isKindOfClass:[NSArray class]] ) {
            NSArray *arr = [dataArray objectForKey:@"choice"];
            chosencount = [arr count];
        }
    }

    if ( [[dataArray objectForKey:@"other"] length] > 0 )
        chosencount++;
    
    if ( [question isCheckbox] && ( [question minLimit] > 0 || [question maxLimit] > 0 ) ) {
        if ( [question minLimit] > 0 && chosencount < [question minLimit] )
            return NO;
        
        if ( [question maxLimit] > 0 && chosencount > [question maxLimit] )
            return NO;
    }
    
	if ( chosencount > 0 )
		return YES;
	return NO;
}

- (NSString *) collectData {
	NSMutableString *data    = [NSMutableString stringWithString:@"<options>"];
	NSMutableString *options = [[NSMutableString alloc] init];

    NSDictionary *dataArray = [self getFormValues:web restrictTo:[NSString stringWithFormat:@"q_%lu", question.questionId]];
    
    [chosen removeAllObjects];
    if ( [dataArray objectForKey:@"choice"] ) {
        if ( [question isRadio] ) {
            NSString *option = [dataArray objectForKey:@"choice"];
            [options appendString:[dataArray objectForKey:@"choice"]];
            [chosen addObject:[NSNumber numberWithLong:[option integerValue]]];
        }
        else if ( [[dataArray objectForKey:@"choice"] isKindOfClass:[NSArray class]] ) {
            NSArray *parts = (NSArray *)[dataArray objectForKey:@"choice"];
            
            for (NSString *option in parts) {
                [chosen addObject:[NSNumber numberWithLong:[option integerValue]]];
            }

            [options appendString:[(NSArray *)[dataArray objectForKey:@"choice"] componentsJoinedByString:@","]];
        }
    }
    
	if ( [[dataArray objectForKey:@"other"] length] > 0 )
		[data appendFormat:@"<otherText>%@</otherText>", [[dataArray objectForKey:@"other"] gtm_stringBySanitizingAndEscapingForXML]];

	if ( [[dataArray objectForKey:@"comments"] length] > 0 )
		[data appendFormat:@"<commentText>%@</commentText>", [[dataArray objectForKey:@"comments"] gtm_stringBySanitizingAndEscapingForXML]];

	if ( [options length] > 0 )
		[data appendFormat:@"<option oID=\"%@\" />", [options stringByTrimmingCharactersInSet:[NSCharacterSet characterSetWithCharactersInString:@","]]];

	[data appendString:@"</options>"];

	return data;
}

- (CGRect) getFrameRect {
	CGRect table = CGRectMake( lastPoint.x, lastPoint.y, [self getMaxFrameWidth], [self getMaxFrameHeight] - lastPoint.y + 50 );
	
	return table;
}

- (CGRect) getWebRect {
	CGRect table = CGRectMake( 0, 0, [self getMaxFrameWidth], [self getMaxFrameHeight] - lastPoint.y + 50 );
	
    if ( [Constants isIphone] )
        table.size.height -= 10;
	return table;
}

- (CGRect) getToolbarRect {
	if ( [Constants isIpad] ) {
		if ( UIInterfaceOrientationIsPortrait( gAppOrientation ) )
            return CGRectMake(0, [self getMaxHeight] - 264 - 60, [self getMaxWidth], 40);
        return CGRectMake(0, [self getMaxHeight] - 350 - 60, [self getMaxWidth], 40);
    }
	else {
		if ( UIInterfaceOrientationIsPortrait( gAppOrientation ) )
            return CGRectMake(0, 205, [self getMaxWidth], 40);
        return CGRectMake(0, 100, [self getMaxWidth], 40);
    }
}

- (IBAction)done:(id)sender {
    // Remove keyboard focus
    [web stringByEvaluatingJavaScriptFromString:@"document.activeElement.blur();"];
    [toolbar removeFromSuperview];
    toolbar = nil;
}

-(void)keyboardWasHidden:(NSNotification*)aNotification {
    if ( toolbar ) {
        [toolbar removeFromSuperview];
        toolbar = nil;
    }
}

-(void)keyboardWasShown:(NSNotification*)aNotification {
    UIWindow* tempWindow;

    // Because we cant get access to the UIKeyboard throught the SDK we will just use UIView.
    // UIKeyboard is a subclass of UIView anyways
    UIView *keyboard;
    
    // Check each window in our application
    for( unsigned int c = 0; c < [[[UIApplication sharedApplication] windows] count]; c ++) {
        //Get a reference of the current window
        tempWindow = [[[UIApplication sharedApplication] windows] objectAtIndex:c];
        
        // Get a reference of the current view
        for ( unsigned int i = 0; i < [tempWindow.subviews count]; i++ ) {
            keyboard = [tempWindow.subviews objectAtIndex:i];
            
            if ( [[keyboard description] hasPrefix:@"<UIPeripheralHostView"] == YES ) {      
                keyboard.hidden = YES;
                UIView* keyboardLayer;
                
                for ( unsigned int n = 0; n < [keyboard.subviews count]; n++) {
                    keyboardLayer = [keyboard.subviews objectAtIndex:n];
                    
                    if ( [[keyboardLayer description] hasPrefix:@"<UIWebFormAccessory"] == YES ) {
                        // Remove existing toolbar
                        [keyboardLayer removeFromSuperview];
                    }
                }
                
                keyboard.hidden = NO;
            }
        }
    }

    // Toolbar
    toolbar = [[UIToolbar alloc] init];
    toolbar.barStyle = UIBarStyleBlack;
    [toolbar setFrame:[self getToolbarRect]];
    
    PolldaddyAppDelegate *delegate = [[UIApplication sharedApplication] delegate];
    [delegate.rootViewController.view addSubview:toolbar];
    
    // Buttons
    NSMutableArray  *buttons = [[NSMutableArray alloc] init];
    UIBarButtonItem *button;
    
    button = [[UIBarButtonItem alloc] initWithBarButtonSystemItem:UIBarButtonSystemItemSave target:self action:@selector(done:)];
    [buttons addObject:button];
    [toolbar setItems:buttons animated:YES];	
    
}

// Implement viewDidLoad to do additional setup after loading the view, typically from a nib.
-(void) displayQuestion {
	// Without these the frame resizes to the height of the text field, meaning that it cuts off the 'hit' area of the field
	self.view.autoresizingMask    = NO;
	self.view.autoresizesSubviews = NO;

    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(keyboardWasShown:) name:UIKeyboardDidShowNotification object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(keyboardWasHidden:) name:UIKeyboardWillHideNotification object:nil];

    // Store all our choices in here
	choices = [[NSMutableDictionary alloc] init];
	chosen  = [[NSMutableArray alloc] init];
    
	// Reorder the answers, just in case they are randomized
	[question reorderAnswers];
    
    // Set our frame size
    [self.view setFrame:[self getFrameRect]];
    
    // Create a UIWebView object for the display
    web = [[UIWebView alloc] initWithFrame:[self getWebRect]];

    NSString *webNote;
    NSMutableString *content;
    
    content = [NSMutableString stringWithFormat:@"<form><div class='PDF_question'><div class='qContent'><div class='PDF_QT400'><ul%@>", [question isRadio] ? @" class='radio'" : @" class='checkbox'"];
    
	for ( ChoiceElement *answer in question.answers ) {
        [content appendString:@"<li>"];
        
        if ( [question isCheckbox] )
            [content appendFormat:@"<input type='checkbox' name='q_%lu[choice][]' value='%lu' id='q_%lu_%lu'/>", question.questionId, answer.oID, question.questionId, answer.oID];
        else
            [content appendFormat:@"<input type='radio' name='q_%lu[choice]' value='%lu' id='q_%lu_%lu'/>", question.questionId, answer.oID, question.questionId, answer.oID];

        // Add text
        [content appendFormat:@" <label for='q_%lu_%lu'>%@</label>", question.questionId, answer.oID, answer.title];

        // Add embedded media
        if ( answer.mediaUrl != nil ) {
            NSString *url = [question allocLocalizeString:[NSString stringWithFormat:@"<img src='%@'/>", answer.mediaUrl] andSurveyId:question.surveyId];
            
            [content appendFormat:@"<label for='q_%lu_%lu'>%@</label>", question.questionId, answer.oID, url];
        }
        
        [content appendString:@"</li>"];
	}
    
	if ( [question hasOther] ) {
        if ( [question isCheckbox] == NO )
            [content appendFormat:@"<li><input type='radio' name='q_%lu[choice]' id='q_%lu_other' value='other'/></li>", question.questionId, question.questionId];

        [content appendString:@"</ul>"];
        [content appendFormat:@"<div class='other'><label for='q_%lu_other'>%@</label> <input type='text' class='other' name='q_%lu[other]' data-for='q_%lu_other'/></div>", question.questionId, [pack getPhrase:PHRASE_OTHER], question.questionId, question.questionId];
    }
    else
        [content appendString:@"</ul>"];

    if ( [question.commentText length] > 0 ) {
        [content appendFormat:@"<div class='comments'>%@<br/><form><textarea cols='80' rows='4' name='q_%lu[comments]'></textarea></div>", question.commentText, question.questionId];
    }
    
    [content appendString:@"</div></div></div></form>"];
    
	if ( UI_USER_INTERFACE_IDIOM() == UIUserInterfaceIdiomPad ) {
		webNote = [NSString stringWithFormat:@"<html><head><script type='text/javascript' src='jquery.js'></script><script type='text/javascript' src='survey.js'></script><script type='text/javascript' src='jquery.mobile.js'></script><link href=\"shared.css\" rel=\"stylesheet\" /><link href=\"ipad.css\" rel=\"stylesheet\" /><meta name='viewport' content='initial-scale=1.0, user-scalable=no, width=%f'></head>"
                   "<body>%@</body>"
                   "</html>", [self getWidthInOrientation:UIDeviceOrientationPortrait] - ( [Constants innerFrameXOffset] * 2 ), content];
	}
	else {
		webNote = [NSString stringWithFormat:@"<html><head><script type='text/javascript' src='jquery.js'></script><script type='text/javascript' src='survey.js'></script><script type='text/javascript' src='jquery.mobile.js'></script><link href=\"shared.css\" rel=\"stylesheet\" /><link href=\"iphone.css\" rel=\"stylesheet\" /><meta name='viewport' content='initial-scale=0.7, user-scalable=no, width=%f'></head>"
                   "<body>%@</body>"
                   "</html>", [self getWidthInOrientation:UIDeviceOrientationPortrait] - ( [Constants innerFrameXOffset] * 2 ), content];
	}
    
	web.hidden   = NO;
	web.delegate = self;
    web.backgroundColor = [UIColor clearColor];
    web.opaque = NO;
    
    // This hides the UIWebView gradient at the bottom, which shows up on the iPhone
	if ( UI_USER_INTERFACE_IDIOM() == UIUserInterfaceIdiomPhone) {
        for ( UIView *wview in [[[web subviews] objectAtIndex:0] subviews] ) { 
            if ( [wview isKindOfClass:[UIImageView class]] )
                wview.hidden = YES;
        }
    }

    NSString *htmlPath = [[NSBundle mainBundle] resourcePath];
	
	htmlPath = [htmlPath stringByReplacingOccurrencesOfString:@"/" withString:@"//"];
	htmlPath = [htmlPath stringByReplacingOccurrencesOfString:@" " withString:@"%20"];
    
    for (id subview in web.subviews) {
        if ( [[subview class] isSubclassOfClass: [UIScrollView class]] )
            ((UIScrollView *)subview).bounces = NO;
    }
    
    [self.view addSubview:web];

    [web loadHTMLString:webNote baseURL:[NSURL URLWithString:[NSString stringWithFormat:@"file:/%@//", htmlPath]]];
}

- (IBAction)readOther:(id)sender {
	// Remove the popup keyboard
  [sender resignFirstResponder];
	
	// If this only allows one choice, and some text was entered, disable the other choices
	if ( ( [question isRadio] || [question isListboxOne] ) && [otherField.text length] > 0 ) {
		[chosen removeAllObjects];  // Clear the list - only one item is allowed
		[choiceTable reloadData];
	}
}

- (BOOL)hasOther {
	if ( [otherField.text length] > 0 )
		return YES;
	return NO;
}

- (boolean_t) isChosen:(NSNumber *)key {
	if ( [chosen containsObject:key] )
		return YES;
	return NO;
}

-(BOOL)shouldAutorotate {
    return YES;
}

-(NSUInteger)supportedInterfaceOrientations {
    return UIInterfaceOrientationMaskAll;
}

- (void)willAnimateRotationToInterfaceOrientation:(UIInterfaceOrientation)interfaceOrientation duration:(NSTimeInterval)duration{
	// Reset the positions of the various items
	[self.view setFrame:[self getFrameRect]];
    [web setFrame:[self getWebRect]];

	if ( toolbar )
		[toolbar setFrame:[self getToolbarRect]];
}

- (void)didReceiveMemoryWarning {
    // Releases the view if it doesn't have a superview.
    [super didReceiveMemoryWarning];
    
    // Release any cached data, images, etc that aren't in use.
}

- (void)dealloc {
    [[NSNotificationCenter defaultCenter] removeObserver:self];
}


@end
