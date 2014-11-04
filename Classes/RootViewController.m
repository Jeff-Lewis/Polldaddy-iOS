    //
//  RootViewController.m
//  Polldaddy
//
//  Created by Kevin Conboy on 5/25/10.
//  Copyright 2010 Automattic, Inc. All rights reserved.
//

#import "RootViewController.h"
#import "QuestionsViewController.h"
#import "ResponseViewController.h"
#import "PolldaddyAPI.h"
#import "Survey.h"

UIInterfaceOrientation gAppOrientation;

@implementation RootViewController
@synthesize displayedViewControllers, signInView, splitViewController, questionsViewController, surveysFullScreenViewController,background,panel, lastButton;

#pragma mark -
#pragma mark initialization and view setup methods

// Implement viewDidLoad to do additional setup after loading the view, typically from a nib.
- (void)viewDidLoad {
  [super viewDidLoad];
	
	[[UIDevice currentDevice] beginGeneratingDeviceOrientationNotifications];
	[[self view] setFrame:CGRectMake(0, 20, 768, 1004)];
	displayedViewControllers = [[NSMutableArray alloc] init];

	if ( [PolldaddyAPI hasValidAccount] == TRUE ) {
		surveysFullScreenViewController = [[SurveysFullScreenViewController alloc] initWithController:self];
		[[self view] addSubview:[surveysFullScreenViewController view]];
		[displayedViewControllers addObject:surveysFullScreenViewController];
	}
	else {
		signInView = [[SignInViewController alloc] init];
		[[self view] addSubview:[signInView view]];		
		[displayedViewControllers addObject:signInView];
		[signInView selectField];
		[signInView addObserver:self forKeyPath:@"loggedIn" options:(NSKeyValueObservingOptionNew | NSKeyValueObservingOptionOld) context:NULL];	
	}
}

- (void)observeValueForKeyPath:(NSString *)keyPath ofObject:(id)object change:(NSDictionary *)change context:(void *)context{
	if ( [keyPath  isEqual: @"loggedIn"] ) {
		[signInView removeObserver:self forKeyPath:@"loggedIn"];
		[self showSurveys];		
	}
}

-(UIStatusBarStyle)preferredStatusBarStyle {
    return UIStatusBarStyleLightContent;
}

#pragma mark -
#pragma mark autorotation and transition methods

-(BOOL)shouldAutorotate {
    BOOL shouldAutorotate = YES;
    
    if ( signInView != nil ) {
        if (UI_USER_INTERFACE_IDIOM() != UIUserInterfaceIdiomPad) {
            shouldAutorotate = NO;
        }
    }
    
    return shouldAutorotate;
}

-(NSUInteger)supportedInterfaceOrientations {
    return UIInterfaceOrientationMaskAll;
}

- (void)setBackgroundImages {
	if ( UIDeviceOrientationIsPortrait( self.interfaceOrientation ) )
		[panel setImage:[UIImage imageNamed:@"question-panel-tall.png"]];
	else
		[panel setImage:[UIImage imageNamed:@"question-panel-wide.png"]];

	if (UI_USER_INTERFACE_IDIOM() == UIUserInterfaceIdiomPad) {
		if ( UIDeviceOrientationIsPortrait( self.interfaceOrientation ) )
			[panel setFrame:CGRectMake(0, 10, 768, 1004)];
		else
			[panel setFrame:CGRectMake(0, 0, 1024, 748)];
	}
	else {
		if ( UIDeviceOrientationIsPortrait( self.interfaceOrientation ) )
			[panel setFrame:CGRectMake(0, 0, 320, 460)];
		else
			[panel setFrame:CGRectMake(0, 0, 480, 300)];
	}
}

- (void)willAnimateRotationToInterfaceOrientation:(UIInterfaceOrientation)interfaceOrientation duration:(NSTimeInterval)duration{
	unsigned int i;
	for (i=0; i<[displayedViewControllers count]; i++) {
		
		UIViewController *thisViewController = [displayedViewControllers objectAtIndex:i];
			
		[thisViewController willAnimateRotationToInterfaceOrientation:interfaceOrientation duration:duration];
	}
	
	if ( panel )
		[self setBackgroundImages];
}

#pragma mark -
#pragma mark swapping views methods


- (void)readyToShowSurvey:(NSString *)animationID finished:(bool)finished context:(void *)context{
	// Starting a survey so create the questions controller, load the survey data, and go for it
	
}

- (void) showSurveys {
	if ( questionsViewController || responseViewController ) {
		[UIView beginAnimations:nil context:nil];
		[UIView setAnimationCurve:UIViewAnimationCurveEaseOut];
		[UIView setAnimationDuration:0.25];
		[background setAlpha:0.0];
		[UIView setAnimationTransition:UIViewAnimationTransitionNone forView:background cache:NO];
		[UIView commitAnimations];
		
		[UIView beginAnimations:nil context:nil];
		[UIView setAnimationCurve:UIViewAnimationCurveEaseOut];
		[UIView setAnimationDelegate:self];
		[UIView setAnimationDidStopSelector:@selector(readyToShowSurvey:finished:context:)];
		[UIView setAnimationDuration:0.25];
		[panel setAlpha:0.0];
		[UIView setAnimationTransition:UIViewAnimationTransitionNone forView:panel cache:NO];
		[UIView commitAnimations];
	}
	
	// Delete the questions controller, if one exists
	if ( questionsViewController ) {
		[displayedViewControllers removeObject:questionsViewController];
		questionsViewController = nil;
	}

	if ( responseViewController ) {
		[[surveysFullScreenViewController view] setAlpha:1];

		[displayedViewControllers removeObject:responseViewController];
		responseViewController = nil;
	}
	
	// Remove the sign-in screen if it still exists
	if ( signInView ) {
		surveysFullScreenViewController = [[SurveysFullScreenViewController alloc] initWithController:self];
		[displayedViewControllers addObject:surveysFullScreenViewController];
		
		[[self view] insertSubview:[surveysFullScreenViewController view] belowSubview:signInView.view];
		
		if([[UIDevice currentDevice] orientation] == UIInterfaceOrientationLandscapeRight || [[UIDevice currentDevice] orientation] == UIInterfaceOrientationLandscapeLeft){
			[self willAnimateRotationToInterfaceOrientation:[[UIDevice currentDevice] orientation] duration:1.0];
		}
		
		// Remove the sign-in screen
		[signInView viewWillDisappear:YES];	
		[displayedViewControllers removeObjectAtIndex:[displayedViewControllers indexOfObject:signInView]];
		signInView = nil;
	}
	else {
		if ( UIDeviceOrientationIsPortrait( self.interfaceOrientation ) )
			[surveysFullScreenViewController swapInListView:UIInterfaceOrientationPortrait];
		else
			[surveysFullScreenViewController swapInListView:UIInterfaceOrientationLandscapeLeft];

		[surveysFullScreenViewController.surveysListTable reloadData];
	}
}


- (void) didSelectSurvey: (unsigned long)surveyId{
	UIActionSheet *actionSheet;

	long totalResponses = [PolldaddyAPI getTotalOfflineResponses:surveyId];
	
	if ( totalResponses == 0 ) {
		lastButton = 0;
		[surveysFullScreenViewController swapOutListView];
	} 
	else {
		Survey *survey = [PolldaddyAPI allocGetSurvey:surveyId];

		if ( [survey isSurvey] )
			actionSheet = [[UIActionSheet alloc] initWithTitle:nil delegate:self cancelButtonTitle:NSLocalizedString( @"Cancel", @"" ) destructiveButtonTitle:nil otherButtonTitles:NSLocalizedString( @"Start Survey", @"" ), NSLocalizedString( @"Review Responses", @"" ), NSLocalizedString( @"Sync Responses", @"" ),nil];
		else
			actionSheet = [[UIActionSheet alloc] initWithTitle:nil delegate:self cancelButtonTitle:NSLocalizedString( @"Cancel", @"" ) destructiveButtonTitle:nil otherButtonTitles:NSLocalizedString( @"Start Quiz", @"" ), NSLocalizedString( @"Review Responses", @"" ), NSLocalizedString( @"Sync Responses", @"" ),nil];


		actionSheet.actionSheetStyle = UIActionSheetStyleDefault;
		
		[actionSheet showInView:[surveysFullScreenViewController view]];
	}
}

- (void) reviewSurvey: (unsigned long)surveyId {
	background = [[UIImageView alloc] initWithImage:[UIImage imageNamed:@"survey-question-bg.png"]];
	[background setAlpha:0.0];
	[[self view] addSubview:background];
	
	panel = [[UIImageView alloc] init];
	[self setBackgroundImages];
	
//	[panel setAlpha:0.0];
	[[self view] addSubview:panel];
	
//	[UIView beginAnimations:nil context:nil];
//	[UIView setAnimationCurve:UIViewAnimationCurveEaseOut];
//	[UIView setAnimationDuration:0.25];
//	[background setAlpha:1.0];
//	[UIView setAnimationTransition:UIViewAnimationTransitionNone forView:background cache:NO];
//	[UIView commitAnimations];
//	
//	
//	[UIView beginAnimations:nil context:nil];
//	[UIView setAnimationCurve:UIViewAnimationCurveEaseOut];
//	[UIView setAnimationDelegate:self];
//	[UIView setAnimationDidStopSelector:@selector(readyToShowSurvey:finished:context:)];
//	[UIView setAnimationDuration:0.25];
//	[panel setAlpha:1.0];
//	[UIView setAnimationTransition:UIViewAnimationTransitionNone forView:panel cache:NO];
//	[UIView commitAnimations];
	
	responseViewController = [[ResponseViewController alloc] initWithController:self];
	[responseViewController loadSurvey:surveyId];
	
	if ( responseViewController ) {
		[[responseViewController view] setAlpha:0.0];
		[[surveysFullScreenViewController view] setAlpha:0];

		[[self view] addSubview:[responseViewController view]];
		[displayedViewControllers addObject:responseViewController];	
		
		[UIView beginAnimations:nil context:nil];
		[UIView setAnimationCurve:UIViewAnimationCurveEaseOut];
		[UIView setAnimationDelegate:self];
		[UIView setAnimationDuration:0.25];
		[responseViewController.view setAlpha:1.0];
		[UIView setAnimationTransition:UIViewAnimationTransitionNone forView:responseViewController.view cache:NO];
		[UIView commitAnimations];
		
	}
	else {
		UIAlertView *alert = [[UIAlertView alloc] initWithTitle:NSLocalizedString( @"Survey Problem", @"" ) message:NSLocalizedString( @"The survey has no questions and cannot be displayed!", @"" ) delegate:self cancelButtonTitle:NSLocalizedString( @"Ok", @"" ) otherButtonTitles:nil];
		[alert show];
	}
}

- (void) startSurvey: (unsigned long)surveyId {
	background = [[UIImageView alloc] initWithImage:[UIImage imageNamed:@"survey-question-bg.png"]];
	[background setAlpha:0.0];
	[[self view] addSubview:background];
	
	panel = [[UIImageView alloc] init];
	[self setBackgroundImages];
	
	[panel setAlpha:0.0];
	[[self view] addSubview:panel];

	[UIView beginAnimations:nil context:nil];
	[UIView setAnimationCurve:UIViewAnimationCurveEaseOut];
	[UIView setAnimationDuration:0.25];
	[background setAlpha:1.0];
	[UIView setAnimationTransition:UIViewAnimationTransitionNone forView:background cache:NO];
	[UIView commitAnimations];
	
	[UIView beginAnimations:nil context:nil];
	[UIView setAnimationCurve:UIViewAnimationCurveEaseOut];
	[UIView setAnimationDelegate:self];
	[UIView setAnimationDidStopSelector:@selector(readyToShowSurvey:finished:context:)];
	[UIView setAnimationDuration:0.25];
	[panel setAlpha:1.0];
	[UIView setAnimationTransition:UIViewAnimationTransitionNone forView:panel cache:NO];
	[UIView commitAnimations];
	
	questionsViewController = [[QuestionsViewController alloc] initWithController:self];
	[questionsViewController loadSurvey:surveyId];
	
	if ( questionsViewController ) {
		[[questionsViewController view] setAlpha:0.0];
		
		[[self view] addSubview:[questionsViewController view]];
		[displayedViewControllers addObject:questionsViewController];	

		[UIView beginAnimations:nil context:nil];
		[UIView setAnimationCurve:UIViewAnimationCurveEaseOut];
		[UIView setAnimationDelegate:self];
		[UIView setAnimationDuration:0.25];
		[questionsViewController.view setAlpha:1.0];
		[UIView setAnimationTransition:UIViewAnimationTransitionNone forView:questionsViewController.view cache:NO];
		[UIView commitAnimations];
		
	}
	else {
		UIAlertView *alert = [[UIAlertView alloc] initWithTitle:NSLocalizedString( @"Survey Problem", @"" ) message:NSLocalizedString( @"The survey has no questions and cannot be displayed!", @"" ) delegate:self cancelButtonTitle:NSLocalizedString( @"Ok", @"" ) otherButtonTitles:nil];
		[alert show];
	}
	
}

- (void)actionSheet:(UIActionSheet *)actionSheet clickedButtonAtIndex:(NSInteger)buttonIndex{
	lastButton = buttonIndex;
	
	switch ( buttonIndex ) {
		case 0:
			[surveysFullScreenViewController swapOutListView];
			break;

		case 1:
			[surveysFullScreenViewController reviewSurveyResponses];
			break;

		case 2:
			[surveysFullScreenViewController syncResponses];
			[[surveysFullScreenViewController surveysListTable] deselectRowAtIndexPath:[[surveysFullScreenViewController surveysListTable] indexPathForSelectedRow] animated:YES];
			[[surveysFullScreenViewController surveysListTable] reloadData];
			break;

		case 3:
			[[surveysFullScreenViewController surveysListTable] deselectRowAtIndexPath:[[surveysFullScreenViewController surveysListTable] indexPathForSelectedRow] animated:YES];
			break;

		default:
			break;
	}
}

- (void) showSignInAfterLogOut{
	[[UIDevice currentDevice] beginGeneratingDeviceOrientationNotifications];

	signInView = [[SignInViewController alloc] init];
	[[self view] addSubview:[signInView view]];	
	[signInView selectField];
	[signInView addObserver:self forKeyPath:@"loggedIn" options:(NSKeyValueObservingOptionNew | NSKeyValueObservingOptionOld) context:NULL];	
	[displayedViewControllers addObject:signInView];
	[signInView willAnimateRotationToInterfaceOrientation:[[UIDevice currentDevice] orientation] duration:1.0];
	[[surveysFullScreenViewController view] removeFromSuperview];
	[displayedViewControllers removeObject:surveysFullScreenViewController];
	
	surveysFullScreenViewController = nil;
}


#pragma mark -
#pragma mark cleanup and dealloc methods

- (void)didReceiveMemoryWarning {
    // Releases the view if it doesn't have a superview.
    [super didReceiveMemoryWarning];
    
    // Release any cached data, images, etc that aren't in use.
}


@end
