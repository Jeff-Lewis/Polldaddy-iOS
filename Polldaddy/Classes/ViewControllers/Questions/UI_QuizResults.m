//
//  UI_PageHeader.m
//  Polldaddy
//
//  Created by John Godley on 31/05/2010.
//  Copyright 2010 Automattic. All rights reserved.
//

#import "UI_QuizResults.h"
#import "Survey.h"
#import "Answer.h"
#import "ST_MultiChoice.h"
#import "AN_MultiChoice.h"
#import "Constants.h"
#import "Language.h"

@implementation UI_QuizResults

- initWithSurvey:(Survey *)survey andAnswers:(NSMutableDictionary *)answers andPack:(Language *)thePack {
	self = [super init];
    pack = thePack;

	NSMutableString *full = [[NSMutableString alloc] init];
	
	unsigned int correct = 0, total = 0;
	float        percent = 0;
	
	// Change the note to include HTML for results
	NSMutableString *answerStr;
	
	// Go through the survey questions, picking out any multi choice
	for ( Question *question in survey.questions ) {
		if ( [question isKindOfClass:[ST_MultiChoice class]] ) {
			total++;
			
			// Get the answer for this question
			answerStr = [answers objectForKey:[NSNumber numberWithLong:question.questionId]];
			if ( answerStr ) {
				// Convert it to an answer
				TBXML          *tbxml = [TBXML tbxmlWithXMLString:answerStr];
				TBXMLElement   *root = tbxml.rootXMLElement;
				
				ST_MultiChoice *mquestion = (ST_MultiChoice *)question;
				AN_MultiChoice *answer = [AN_MultiChoice alloc];
				
				answer = (AN_MultiChoice *)[answer initWithXML:root];
				answer.questionType = 400;
				
				[full appendFormat:@"<div class=\"quiz-question\">Q%lu. %@</div>", mquestion.questionNumber, mquestion.title];
				
				for ( ChoiceElement *option in mquestion.answers ) {
					if ( [answer wasSelected:option.oID] && option.oID == mquestion.correctAnswer ) {
						correct++;
						
						[full appendFormat:@"<div class=\"quiz-status-correct\">&#10003;</div>"];
						[full appendFormat:@"<div class=\"quiz-answer-correct\">%@</div>", option.title ];
					}
					else if ( [answer wasSelected:option.oID] && option.oID != mquestion.correctAnswer ) {
						[full appendFormat:@"<div class=\"quiz-status-wrong\">&#10006;</div>"];
						[full appendFormat:@"<div class=\"quiz-answer-wrong\">%@</div>", option.title ];
					}
					else if ( option.oID == mquestion.correctAnswer ) {
						[full appendFormat:@"<div class=\"quiz-status-tick\">&#10003;</div>"];
						[full appendFormat:@"<div class=\"quiz-answer-tick\">%@</div>", option.title ];
					}
					else {
						[full appendFormat:@"<div class=\"quiz-status\"></div>"];
						[full appendFormat:@"<div class=\"quiz-answer\">%@</div>", option.title ];
					}
					
					[full appendString:@"<p class=\"clear\"></p>"];
				}

			}
		}
	}
	
	if ( total > 0 )
		percent = 100.0 * ( (float)correct / (float)total );
	
	results = [NSMutableString stringWithString:@""];
	passed  = YES;
	
	failMessage = survey.endMessageFail;

	if ( survey.passThreshold > 0 && percent < survey.passThreshold )
		passed = NO;

	if ( [survey showFullResults] || [survey showFinalScore] ) {
		[results appendFormat:@"<br/><br/>You scored %.0f%%<br/>", percent];
		
		if ( passed )
			[results appendFormat:@"%@", [pack getPhrase:PHRASE_QUIZ_PASSED]];
		else
			[results appendFormat:@"%@", [pack getPhrase:PHRASE_QUIZ_FAILED]];
		
		if ( [survey showFullResults] ) {
			[results appendFormat:@"<br/><br/>%@", [NSString stringWithString:full]];
		}
	}
	
	return self;
}

-(void) loadTitle:(NSString *)title withNote:(NSString *)note withDisplay:(UIWebView *)questionDetails isMandatory:(BOOL)mandatory {
	NSString *webNote, *message;
	
	if ( passed )
		message = note;
	else
		message = failMessage;
	
	if ( UI_USER_INTERFACE_IDIOM() == UIUserInterfaceIdiomPad ) {
		webNote = [NSString stringWithFormat:@"<html><head><link href=\"shared.css\" rel=\"stylesheet\" /><link href=\"ipad.css\" rel=\"stylesheet\" /><meta name='viewport' content='initial-scale=1.0, user-scalable=no, width=%f'></head>"
							 "<body class=\"quiz-results\"><h1>%@</h1>%@%@</body>"
							 "</html>", [self getWidthInOrientation:UIDeviceOrientationPortrait] - ( [Constants innerFrameXOffset] * 2 ), title, message, results];
	}
	else {
		webNote = [NSString stringWithFormat:@"<html><head><link href=\"shared.css\" rel=\"stylesheet\" /><link href=\"iphone.css\" rel=\"stylesheet\" /><meta name='viewport' content='initial-scale=0.7, user-scalable=no, width=%f'></head>"
							 "<body class=\"quiz-results\"><h1>%@</h1>%@%@</body>"
							 "</html>", [self getWidthInOrientation:UIDeviceOrientationPortrait] - ( [Constants innerFrameXOffset] * 2 ), title, message, results];
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
	
	unsigned long height = [[view stringByEvaluatingJavaScriptFromString:@"document.documentElement.clientHeight;"] integerValue];
	
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



@end
