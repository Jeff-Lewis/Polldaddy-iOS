    //
//  ResponseViewController.m
//  Polldaddy
//
//  Created by John Godley on 07/07/2010.
//  Copyright 2010 Automattic. All rights reserved.
//

#import "RootViewController.h"
#import "ResponseViewController.h"
#import "PolldaddyAPI.h"
#import "Response.h"
#import "Answer.h"
#import "Question.h"
#import "Survey.h"
#import "Constants.h"
#import "UI_Question.h"
#import "ST_MultiChoice.h"
#import "AN_MultiChoice.h"

@implementation ResponseViewController

@synthesize respondentTitle, startLabel, endLabel, nextButton, prevButton, cancelButton, deleteButton, scroller, started, ended;

-(id)initWithController:(RootViewController *)root {
	self = [super init];

	if ( [Constants isIpad] )
		self = [self initWithNibName:@"ResponseViewController" bundle:nil];
	else
		self = [self initWithNibName:@"ResponseViewController-iPhone" bundle:nil];
	
	parentDelegate     = root;
	currentResponse    = nil;
	currentResponsePos = 0;
	return self;
}

- (void)displayAnswers {
	UI_Question *uiQ = [[UI_Question alloc] init];

	[self.view setBackgroundColor:[UIColor clearColor]];
	 
	// Clear scroller
	[scroller.subviews makeObjectsPerformSelector:@selector(removeFromSuperview)]; 
	
	if ( currentResponse ) {
		currentResponse = nil;
	}
	
	// Get response
	currentResponse = [PolldaddyAPI allocGetResponse:currentResponsePos forSurvey:survey];
	unsigned long total = [PolldaddyAPI getTotalOfflineResponses:survey.surveyId];
	
	if ( currentResponse ) {
		NSDateFormatter *dateFormatter = [[NSDateFormatter alloc] init];

		[dateFormatter setTimeStyle:NSDateFormatterMediumStyle];		
		[dateFormatter setDateStyle:NSDateFormatterShortStyle];
		[dateFormatter setLocale:[NSLocale currentLocale]];
		
		// Set response info
		if ( [survey isSurvey] )
			respondentTitle.text = [NSString stringWithFormat:NSLocalizedString( @"Response: %d", @"" ), total - currentResponsePos];
		else {
			unsigned int correct = 0, total_answers = 0;
			float        percent = 0;
			
			// Go through the survey questions, picking out any multi choice
			for ( Question *question in survey.questions ) {
				if ( [question isKindOfClass:[ST_MultiChoice class]] ) {
					total_answers++;
					
					// Get the answer for this question
					AN_MultiChoice *answer = (AN_MultiChoice *)[currentResponse getAnswerForQuestion:question];
					ST_MultiChoice *mquestion = (ST_MultiChoice *)question;
			
					for ( ChoiceElement *option in mquestion.answers ) {
						if ( [answer wasSelected:option.oID] && option.oID == mquestion.correctAnswer ) {
							correct++;
						}
					}
				}
			}
			
			if ( total_answers > 0 )
				percent = 100.0 * ( (float)correct / (float)total_answers );

			respondentTitle.text = [NSString stringWithFormat:NSLocalizedString( @"Response: %d - %.2f%%", @"" ), total - currentResponsePos, percent];			
		}
		
		startLabel.text      = [dateFormatter stringFromDate:currentResponse.startDate];
		endLabel.text        = [dateFormatter stringFromDate:currentResponse.endDate];
		startLabel.textColor = [UIColor PdTextColor];
		endLabel.textColor   = [UIColor PdTextColor];
		
		if ( [Constants isIphone] ) {
			respondentTitle.font = [UIFont boldSystemFontOfSize:16];
			startLabel.font      = [UIFont systemFontOfSize:14];
			endLabel.font        = [UIFont systemFontOfSize:14];
			ended.font           = [UIFont systemFontOfSize:14];
			started.font         = [UIFont systemFontOfSize:14];
		}

		// Enable/disable buttons
		if ( currentResponsePos == 0 )
			prevButton.hidden = YES;
		else
			prevButton.hidden = NO;
		
		if ( currentResponsePos == total - 1 )
			nextButton.hidden = YES;
		else
			nextButton.hidden = NO;
		
		// Display the answers
		CGPoint offset = CGPointMake( 0, 0 );

		// Loop through questions and get answer for question
		for ( Question *question in survey.questions ) {
			Answer *answer = [currentResponse getAnswerForQuestion:question];
			
			if ( [question isQuestion] ) {
				UILabel     *title = [[UILabel alloc] init], *ansText = [[UILabel alloc] init];
				UI_Question *ui = [[UI_Question alloc] init];
				NSString    *summaryText;
				
				if ( answer ) {
					if ( [survey isSurvey] )
						summaryText = [answer summaryForQuestion:question];
					else {
						if ( [question isKindOfClass:[ST_MultiChoice class]] )
							summaryText = [(AN_MultiChoice *)answer summaryForQuizQuestion:(ST_MultiChoice *)question];
						else
							summaryText = [answer summaryForQuestion:question];
					}
				}
				else
					summaryText = @"";

				// Display details for the question
				title.backgroundColor = [UIColor clearColor];
				if ( [Constants isIpad] )
					title.font = [UIFont boldSystemFontOfSize:18];
				else
					title.font = [UIFont boldSystemFontOfSize:15];
				
				title.lineBreakMode   = NSLineBreakByWordWrapping;
				title.numberOfLines   = 0;
				
				ansText.backgroundColor = [UIColor clearColor];
				ansText.textColor       = [UIColor PdTextColor];
				ansText.lineBreakMode   = NSLineBreakByWordWrapping;
				ansText.numberOfLines   = 0;
				
				if ( [Constants isIphone] )
					ansText.font = [UIFont boldSystemFontOfSize:13];
				
				if ( [summaryText length] == 0 ) {
					summaryText = NSLocalizedString( @"-- Skipped --", @"" );
					
					if ( [Constants isIphone] )
						ansText.font = [UIFont italicSystemFontOfSize:13];
					else
						ansText.font = [UIFont italicSystemFontOfSize:15];
					
					title.textColor = [UIColor PdTextColor];
				}
				
				offset.x = 0;
				offset   = [ui autoHeightLabel:title withText:[NSString stringWithFormat:@"%lu) %@", question.questionNumber, question.title] atPoint:offset];
				
				offset.x = [Constants innerFrameXOffset];
				offset   = [ui autoHeightLabel:ansText withText:summaryText atPoint:offset];
				
				// Give us a bit of space after each question
				offset.y += [Constants labelBottomPadding];
				
				[scroller addSubview:title];
				[scroller addSubview:ansText];
				
			}
		}
		
        UIInterfaceOrientation interfaceOrientation = [UIApplication sharedApplication].statusBarOrientation;
        
        NSLog(@"ResponseViewController frame: %@", NSStringFromCGRect(self.view.frame));
        
        // Display buttons in appropriate places
        if ( [Constants isIpad] ) {
            if ( UIInterfaceOrientationIsLandscape(interfaceOrientation)) {
                self.view.frame = CGRectMake(0.0, 0.0, 1024.0, 768.0);
                [prevButton setFrame:CGRectMake(33, 670, 200, 62)];
                [cancelButton setFrame:CGRectMake(470, 670, 98, 62)];
                [nextButton setFrame:CGRectMake(790, 670, 200, 62)];
                [deleteButton setFrame:CGRectMake(920, 91, 72, 37)];
            }
            else {
                self.view.frame = CGRectMake(0.0, 0.0, 768.0, 1024.0);
                [prevButton setFrame:CGRectMake(33, 906, 200, 62)];
                [cancelButton setFrame:CGRectMake(336, 906, 98, 62)];
                [nextButton setFrame:CGRectMake(537, 906, 200, 62)];
                [deleteButton setFrame:CGRectMake(665, 71, 72, 37)];
            }
        }
        else {
            if ( UIInterfaceOrientationIsLandscape(interfaceOrientation) ) {
                self.view.frame = CGRectMake(0.0, 0.0, [Utility deviceHeight], 320.0);
                [prevButton setFrame:CGRectMake( 20, [uiQ getMaxHeight] - 41, 80, [Constants buttonHeight])];
                [cancelButton setFrame:CGRectMake(([Utility deviceHeight] - 80) / 2.0, [uiQ getMaxHeight] - 41, 80, [Constants buttonHeight])];
                [nextButton setFrame:CGRectMake([Utility deviceHeight] - 100, [uiQ getMaxHeight] - 41, 80, [Constants buttonHeight])];
                [deleteButton setFrame:CGRectMake([Utility deviceHeight] - 80, 62, 60, 24)];
            }
            else {
                self.view.frame = CGRectMake(0.0, 0.0, 320.0, [Utility deviceHeight]);
                [prevButton setFrame:CGRectMake( 20, [uiQ getMaxHeight] - 50, 80, [Constants buttonHeight])];
                [cancelButton setFrame:CGRectMake(120, [uiQ getMaxHeight] - 50, 80, [Constants buttonHeight])];
                [nextButton setFrame:CGRectMake(220, [uiQ getMaxHeight] - 50, 80, [Constants buttonHeight])];
                [deleteButton setFrame:CGRectMake(240, 62, 60, 24)];
            }
        }
        
		// Set scroller dimensions
		unsigned int offsetHeight = ended.frame.origin.y + ended.frame.size.height + ( [Constants labelBottomPadding] * 2 );

		[scroller setFrame:CGRectMake( scroller.frame.origin.x, offsetHeight, [uiQ getMaxFrameWidth], [uiQ getMaxHeight] - offsetHeight - 9 - [Constants questionToolbarHeight] )];
        
        NSLog(@"scroller frame: %@", NSStringFromCGRect(scroller.frame));

		// Set scroller internal height
		scroller.contentSize = CGSizeMake( [uiQ getMaxFrameWidth], offset.y );
		[scroller flashScrollIndicators];
	}
	
}

- (void)loadSurvey:(unsigned long) surveyId {
	survey = [PolldaddyAPI allocGetSurvey:surveyId];
}

- (void)viewDidLoad {
    [super viewDidLoad];
    
    if ( survey ) {
        
		if ( UIInterfaceOrientationIsLandscape([Utility currentInterfaceOrientation]) ) {
			UI_Question *uiQ = [[UI_Question alloc] init];

			[self.view setFrame:CGRectMake(0, 0, [uiQ getMaxWidth], [uiQ getMaxHeight])];
		}

		[self displayAnswers];
	}
}

- (IBAction) deleteButton: (id) sender {
	NSMutableArray *list = [NSMutableArray arrayWithObject:[NSNumber numberWithInt:currentResponse.respondentId]];
													
	[PolldaddyAPI purgeResponse:list];
	
	if ( currentResponsePos == 0 ) {
		if ( [PolldaddyAPI getTotalOfflineResponses:survey.surveyId] == 0 ) {
			[self exitButton:nil];
			return;
		}
	}
	else
		currentResponsePos--;

	[self displayAnswers];		
}

- (IBAction) exitButton: (id) sender {
	[self.view removeFromSuperview];
	
	[parentDelegate showSurveys];
}

- (IBAction) nextResponse: (id) sender {
	if ( currentResponsePos < [PolldaddyAPI getTotalOfflineResponses:survey.surveyId] ) {
		currentResponsePos++;
		[self displayAnswers];
	}
}

- (IBAction) previousResponse: (id) sender {
	if ( currentResponsePos > 0 ) {
		currentResponsePos--;
		[self displayAnswers];
	}
}

-(BOOL)shouldAutorotate {
    return YES;
}

-(NSUInteger)supportedInterfaceOrientations {
    return UIInterfaceOrientationMaskAll;
}

- (void)willAnimateRotationToInterfaceOrientation:(UIInterfaceOrientation)interfaceOrientation duration:(NSTimeInterval)duration{
	UI_Question *uiQ = [[UI_Question alloc] init];

	[self.view setFrame:CGRectMake(0, 0, [uiQ getMaxWidth], [uiQ getMaxHeight])];
	[self displayAnswers];
	
}

- (void)didReceiveMemoryWarning {
    // Releases the view if it doesn't have a superview.
    [super didReceiveMemoryWarning];
    
    // Release any cached data, images, etc that aren't in use.
}




@end
