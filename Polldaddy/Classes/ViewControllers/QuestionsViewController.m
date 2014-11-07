    //
//  QuestionsViewController.m
//  Polldaddy
//
//  Created by Kevin Conboy on 5/21/10.
//  Copyright 2010 Automattic, Inc All rights reserved.
//

#import <UIKit/UIKit.h>
#import "QuestionsViewController.h"
#import "Survey.h"
#import "Question.h"
#import "Rule.h"
#import "PolldaddyAPI.h"
#import "RootViewController.h"
#import "Constants.h"
#import "Language.h"

#import "ST_Text.h"
#import "ST_Html.h"
#import "ST_DateTime.h"
#import "ST_MultiChoice.h"
#import "ST_EmailAddress.h"
#import "ST_Url.h"
#import "ST_Matrix.h"
#import "ST_Name.h"
#import "ST_Address.h"
#import "ST_PageHeader.h"
#import "ST_Html.h"
#import "ST_QuizResults.h"
#import "ST_FileUpload.h"
#import "ST_PhoneNumber.h"
#import "ST_Number.h"

#import "UI_Text.h"
#import "UI_TextMulti.h"
#import "UI_DateTime.h"
#import "UI_MultiChoice.h"
#import "UI_EmailAddress.h"
#import "UI_Url.h"
#import "UI_Matrix.h"
#import "UI_Name.h"
#import "UI_Html.h"
#import "UI_Address.h"
#import "UI_PageHeader.h"
#import "UI_FileUpload.h"
#import "UI_QuizResults.h"
#import "UI_PhoneNumber.h"
#import "UI_Number.h"

@implementation QuestionsViewController

@synthesize surveyButton, cancelButton, questionDetails, loading;

-(id)initWithController:(RootViewController *)root {
	self = [super init];
	
    timeout = nil;
    
	if (UI_USER_INTERFACE_IDIOM() == UIUserInterfaceIdiomPad)
		self = [self initWithNibName:@"QuestionsViewController" bundle:nil];
	else 
		self = [self initWithNibName:@"QuestionsViewController-iPhone" bundle:nil];
	
	[[self view] setBackgroundColor:[UIColor clearColor]];
	answers = [[NSMutableDictionary alloc] init];
	skipped = [[NSMutableArray alloc] init];
	parentDelegate = root;
	showEverything = YES;
	
	[[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(questionFirstLoaded:) name:@"QuestionLoaded" object:nil];
	
	return self;
}

-(void)stopTimer {
    if ( timeout != nil ) {
        [timeout invalidate];
        timeout = nil;
    }
}

-(void)saveSurvey:(BOOL)completed {
	if ( [answers count] > 0 ) {
		NSLog(@"completed=%@", completed ? @"YES" : @"NO");
		
		// Cancel the survey - save whatever responses we have
		NSMutableString *answer = [NSMutableString stringWithFormat:@"<answers pCompleted=\"%lu\">", (unsigned long)[answers count]];
		
		// Add each answer
		for ( NSString *key in answers ) {
			[answer appendString:[answers objectForKey:key]];
		}
		
		// Add end of XML
		[answer appendString:@"</answers>"];
		
		NSLog(@"Answer XML=%@", answer);
		
		// Send it back to Polldaddy
		[PolldaddyAPI submitResponse:survey.surveyId andResponseXML:answer andCompleted:completed];
	}

    [self stopTimer];
}

-(void)restartSurvey:(BOOL)isComplete {
	// Save what we have
	[self saveSurvey:isComplete];
	
	// Reset the answers
	[answers removeAllObjects];
	[skipped removeAllObjects];
	
	// Reset the question number and show
	currentQnum = 0;
	[self displayQuestion:0 withNewField:YES];
}

-(void)finishSurvey:(BOOL)isComplete {
	[self saveSurvey:isComplete];
	
	// And show the survey list
	[self.view removeFromSuperview];
    [self stopTimer];

	[parentDelegate showSurveys];
}

- (void)alertView:(UIAlertView *)alertView clickedButtonAtIndex:(NSInteger)buttonIndex {
	if (buttonIndex == 1)
		[self restartSurvey:NO];		
}

- (IBAction) buttonPressed: (id) sender {
	Question *question = [survey getQuestionForPosition: currentQnum];

    [self stopTimer];

	// Collect data for this question
	if ( question && currentField ) {
		NSMutableString *answer = [NSMutableString stringWithFormat:@"<answer qID=\"%lu\" qType=\"%lu\">%@</answer>", question.questionId, question.questionType, [currentField collectData]];
		
		if ( [question isQuestion] )
			[answers setObject:answer forKey:[NSNumber numberWithLong:question.questionId]];
		
		NSLog(@"Answer = %@", answer);
	}
	
	if ( sender == cancelButton ) {
		// On the first question we exit the survey and return to the survey list, otherwise restart the survey

		if ( currentQnum == 0 ) {
			[self finishSurvey:NO];
		}
		else {
			UIAlertView *alert = [[UIAlertView alloc] init];
			
            [alert setTitle:[pack getPhrase:PHRASE_CANCEL]];
            [alert setMessage:[pack getPhrase:PHRASE_CLOSE_CONFIRM]];
			
			[alert setDelegate:self];
			[alert addButtonWithTitle:[pack getPhrase:PHRASE_CLOSE_CANCEL]];
			[alert addButtonWithTitle:[pack getPhrase:PHRASE_CLOSE_YES]];
			[alert show];
		}
	}
	else if ( question ) {
		// Show an error if:
		//    - Answer is not valid
		//    - Question is mandatory and it hasnt been completed
		boolean_t moveOn = TRUE;
		
		if ( ( [question isMandatory] && currentField && [currentField isCompleted] == NO ) ) {
			UIAlertView *alert = [[UIAlertView alloc] initWithTitle:[pack getPhrase:PHRASE_VALID_RESPONSE] message:[currentField getError] delegate:self cancelButtonTitle:NSLocalizedString( @"Ok", @"" ) otherButtonTitles:nil];
			moveOn = FALSE;
			[alert show];
		}
		else if ( currentField && [currentField isValid] == NO ) {
			UIAlertView *alert = [[UIAlertView alloc] initWithTitle:[pack getPhrase:PHRASE_VALID_RESPONSE] message:[currentField getValidError] delegate:self cancelButtonTitle:NSLocalizedString( @"Ok", @"" ) otherButtonTitles:nil];
			moveOn = FALSE;
			[alert show];
		}
		
		if ( moveOn ) {
			BOOL         done = NO;
			unsigned long jump_to = 0;

			if ( [question isQuestion] ) {
				// Apply any rule processing
				NSMutableArray *actions = [[NSMutableArray alloc] init];

				[question applyRules:actions withAnswer:currentField];
				
				for ( Rule *rule in actions ) {
					if ( [rule isEnd] )
						done = YES;
					else if ( [rule isJump] ) {
						jump_to = [[survey getFirstQuestionForPage: [rule getTargetPage]] realQnum];
                        
                        if ( [survey firstIsFake] == NO )
                            jump_to--;
                    }
					else if ( [rule isSkip] )
						[skipped addObject:[NSNumber numberWithUnsignedLong:[rule getTargetPage]]];
				}
				
			}
			
			if ( done )
				currentQnum = [survey.questions count] - 1;
			else {
				currentQnum++;
				if ( jump_to > 0 )
					currentQnum = jump_to;
			}

			[self displayQuestion:currentQnum withNewField:YES];
		}
	}
	else
		[self restartSurvey:YES];
}

- (void)timedOut:(NSTimer*)theTimer {
    NSLog(@"Timed out");
    timeout = nil;
    
    [self restartSurvey:false];
}

- (void)startTimer {
    NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];
    unsigned long timer_amount = [defaults integerForKey:@"survey_timeout"] ? [defaults integerForKey:@"survey_timeout"] : 0;

    timer_amount *= 60;

    [timeout invalidate];

    if ( timer_amount > 0 && currentQnum != 0 ) {
        NSLog(@"Timer started for %lu", timer_amount);
        timeout = [NSTimer scheduledTimerWithTimeInterval:timer_amount target:self selector:@selector(timedOut:) userInfo:nil repeats:NO];
    }
}

- (void)heartbeat {
    NSLog(@"Timer reset");
    [self startTimer];
}

- (void)displayQuestion:(long)qNum withNewField:(boolean_t)newField {
	// Remove any field currently being displayed
	if ( currentField && newField == YES ) {
		[currentField.view removeFromSuperview];
		currentField = nil;
	}

	// Get the current question
	Question *question = [survey getQuestionForPosition: qNum];
	
	if ( question ) {
		NSLog( @"Question %lu - %lu (page %lu)", qNum, question.questionType, ( question.page + 1 ) );
		
		if ( newField == YES ) {
			// Is this question on a skipped page?
			while ( [skipped containsObject:[NSNumber numberWithUnsignedLong:( question.page )]] ) {
				NSLog(@"Skipping %lu", currentQnum);
				question = [survey getQuestionForPosition:++currentQnum];
			}
			
			cancelButton.hidden = YES;
			surveyButton.hidden = YES;

			// Display question
			switch ( question.questionType ) {
				// Special classes used internally
				case 19: {
					currentField = [UI_QuizResults alloc];

					(void)[(UI_QuizResults *)currentField initWithSurvey:survey andAnswers:answers andPack:pack];
					break;
				}
					
				// Standard question types
				case 100:
					currentField = [[UI_Text alloc] initWithQuestion:(ST_Text *)question andPack:pack];
					break;
					
				case 200:
					currentField = [[UI_TextMulti alloc] initWithQuestion:(ST_Text *)question andPack:pack];
					break;

				case 400:
					currentField = [(UI_MultiChoice *)[UI_MultiChoice alloc] initWithQuestion:(ST_MultiChoice *)question andPack:pack];
					break;
					
				case 800:
					currentField = [(UI_Name *)[UI_Name alloc] initWithQuestion:(ST_Name *)question andPack:pack];
					break;
					
				case 900:
					currentField = [(UI_Address *)[UI_Address alloc] initWithQuestion:(ST_Address *)question andPack:pack];
					break;

				case 950:
					currentField = [(UI_PhoneNumber *)[UI_PhoneNumber alloc] initWithQuestion:(ST_PhoneNumber *)question andPack:pack];
					break;
					
				case 1000:
					currentField = [(UI_DateTime *)[UI_DateTime alloc] initWithQuestion:(ST_DateTime *)question andPack:pack];
					break;

				case 1100:
					currentField = [(UI_Number *)[UI_Number alloc] initWithQuestion:(ST_Number *)question andPack:pack];
					break;
					
				case 1200:
					currentField = [(UI_Matrix *)[UI_Matrix alloc] initWithQuestion:(ST_Matrix *)question andPack:pack];
					break;
					
				case 1400:
					currentField = [(UI_EmailAddress *)[UI_EmailAddress alloc] initWithQuestion:(ST_EmailAddress *)question andPack:pack];
					break;
					
				case 1500:
					currentField = [(UI_Url *)[UI_Url alloc] initWithQuestion:(ST_Url *)question andPack:pack];
					break;				

				case 1600:
					currentField = [(UI_FileUpload *)[UI_FileUpload alloc] initWithQuestion:(ST_FileUpload *)question andPack:pack];
					break;				
					
				case 1900:
					currentField = [(UI_PageHeader *)[UI_PageHeader alloc] initWithQuestion:(ST_PageHeader *)question andPack:pack];
					break;				
					
				case 2000:
					currentField = [(UI_Html *)[UI_Html alloc] initWithQuestion:(ST_Html *)question andPack:pack];
					break;
					
				default:
					currentField = [(UI_Question *)[UI_Question alloc] init];
                    currentField.pack = pack;
					break;
			}

			if ( currentField ) {
//XXX				loading.hidden = NO;
				
				// Show the note and title, if appropriate for the question
				[currentField loadTitle:question.title withNote:question.note withDisplay:questionDetails isMandatory:[question isMandatory]];
				[self.view addSubview:currentField.view];
				[self.view bringSubviewToFront:questionDetails];

                [self startTimer];
            }
		}
		else if ( currentField ) {
			// Update the position of the title and note
			[currentField updateDetails:questionDetails];
			[self.view bringSubviewToFront:questionDetails];
			[self questionLoaded:NO];
		}
	}
	else if ( [survey.questions count] == 0 )
		[self finishSurvey:NO];
	else
		[self restartSurvey:YES];
}

- (void)questionLoaded:(BOOL)drawQuestion {
	UI_Question *uiQ = [[UI_Question alloc] init];
	NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];
	BOOL show_exit = [defaults objectForKey:@"survey_allow_exit"] ? [defaults boolForKey:@"survey_allow_exit"] : YES;
	
	loading.hidden = YES;
	
	// Work out what buttons to show
	if ( currentQnum == 0 ) {
		// Survey start page - show exit button instead of restart
		[uiQ displayNextButton:surveyButton andCancelButton:cancelButton];
		
        [cancelButton setTitle:[pack getPhrase:PHRASE_CANCEL] forState:UIControlStateNormal];
        [surveyButton setTitle:[NSString stringWithFormat:@"%@ »", [pack getPhrase:PHRASE_START]] forState:UIControlStateNormal];

		cancelButton.hidden = YES;
		if ( show_exit )
			cancelButton.hidden = NO;
		
		surveyButton.hidden = NO;
	}
	else if ( [survey hasNextQuestion: currentQnum] == FALSE) {
		// Finish page - show single restart button
		cancelButton.hidden = YES;
		surveyButton.hidden = NO;

		[surveyButton setTitle:[NSString stringWithFormat:@"%@ »", [pack getPhrase:PHRASE_STARTOVER]] forState:UIControlStateNormal];
		
		if (UI_USER_INTERFACE_IDIOM() == UIUserInterfaceIdiomPad) {
			if ( UIInterfaceOrientationIsLandscape([Utility currentInterfaceOrientation]) )
				[surveyButton setFrame:CGRectMake(355, 653, 340, [Constants buttonHeight])];
			else
				[surveyButton setFrame:CGRectMake(220, 890, 340, [Constants buttonHeight])];
		}
		else {
			if ( UIInterfaceOrientationIsLandscape([Utility currentInterfaceOrientation]) )
				[surveyButton setFrame:CGRectMake( ( [uiQ getMaxWidth] - 130 ) / 2, [uiQ getMaxHeight] - 62, 130, [Constants buttonHeight] )];
			else
				[surveyButton setFrame:CGRectMake( ( [uiQ getMaxWidth] - 130 ) / 2, [uiQ getMaxHeight] - 70, 130, [Constants buttonHeight] )];
		}
	}
	else if ( currentField ) {
		surveyButton.hidden = NO;
		cancelButton.hidden = YES;
		if ( show_exit )
			cancelButton.hidden = NO;
		
		// Display the buttons as determined by the question
		if ( drawQuestion )
			[currentField displayQuestion];

		[currentField displayNextButton:surveyButton andCancelButton:cancelButton];
		[currentField setController:self];
	}
	
	[self.view bringSubviewToFront:surveyButton];
	[self.view bringSubviewToFront:cancelButton];

}

- (void)hideEverything:(BOOL)hideOrShow {
	showEverything = hideOrShow;
	
	if ( hideOrShow ) {
		surveyButton.hidden    = YES;
		cancelButton.hidden    = YES;
		questionDetails.hidden = YES;
	}
	else{
		surveyButton.hidden    = NO;
		cancelButton.hidden    = NO;
		questionDetails.hidden = NO;
	}
}

- (void)questionFirstLoaded:(NSNotification *)notification {
	[self questionLoaded:YES];
}

- (void)loadSurvey:(unsigned long) surveyId {
	survey = [PolldaddyAPI allocGetSurvey:surveyId];
	
	if ( survey ) {
        // Load language pack
        pack = [[Language alloc] initForSurvey:survey];

        // What question number to start from
		unsigned int start = 0;
		
		currentQnum = start;
		
		// Use this to get screen dimensions
		UI_Question *uiQuestion = [[UI_Question alloc] init];
		
		[[self view] setFrame:CGRectMake(0.0, 20.0, [uiQuestion getMaxWidth], [uiQuestion getMaxHeight])];

		// Display first question
		[self displayQuestion:start withNewField:YES];
	}
	else
		[self finishSurvey:NO];
}

// Implement viewDidLoad to do additional setup after loading the view, typically from a nib.
- (void)viewDidLoad {
	[super viewDidLoad];

	// Setup web view
	questionDetails.opaque          = NO;
	questionDetails.backgroundColor = [UIColor clearColor];
	questionDetails.scalesPageToFit = YES;
}

-(BOOL)shouldAutorotate {
    return YES;
}

-(NSUInteger)supportedInterfaceOrientations {
    return UIInterfaceOrientationMaskAll;
}

- (void)willAnimateRotationToInterfaceOrientation:(UIInterfaceOrientation)interfaceOrientation duration:(NSTimeInterval)duration{
	if ( showEverything == YES ) {
		UI_Question *uiQuestion = [[UI_Question alloc] init];
		
		// Change the dimensions of the page according to orientation. Is there an automatic way of doing this?
		[[self view] setFrame:CGRectMake(0.0, 20.0, [uiQuestion getMaxWidth], [uiQuestion getMaxHeight])];
		
		// Redisplay the question in the new orientation. Note that we dont add a new question - we want to reposition the existing one
		[self displayQuestion:currentQnum withNewField:NO];
		
		// Send reorientation message to field
		if ( currentField )
			[currentField willAnimateRotationToInterfaceOrientation:interfaceOrientation duration:duration];
		
	}
}


- (void)didReceiveMemoryWarning {
	// Releases the view if it doesn't have a superview.
	[super didReceiveMemoryWarning];
}


- (void)dealloc {
	[[NSNotificationCenter defaultCenter] removeObserver:self];

	// Remove the question
	[currentField.view removeFromSuperview];

}


@end
