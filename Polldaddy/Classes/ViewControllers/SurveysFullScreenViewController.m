    //
//  SurveysFullScreenViewController.m
//  Polldaddy
//
//  Created by Kevin Conboy on 5/25/10.
//  Copyright 2010 Automattic, Inc. All rights reserved.
//

#import "SurveysFullScreenViewController.h"
#import "Survey.h"
#import "RootViewController.h"
#import "PolldaddyAPI.h"
#import "LiveSurveySelectionViewController.h"
#import "SignInViewController.h"
#import "Constants.h"
#import "NumOfflineListCell.h"
#import "ProgressView.h"
#import "PolldaddyAppDelegate.h"


@interface AutoSyncer : NSOperation {
}

@end

@implementation AutoSyncer

-(void)main {
    if ( self.isCancelled )
        return;

    ProgressView *view = [[ProgressView alloc] init];

    NSLog(@"Syncing thread start");
    [view syncAllResponses];
    NSLog(@"Syncing thread over");
}

@end

// Helper class to store the contents of the survey list page
@interface SurveyListObject : NSObject
{
	NSString     *title;
	unsigned long  surveyId;
	unsigned long  responseCount;
}

@property (readonly,nonatomic,strong) NSString *title;
@property (readonly,nonatomic) unsigned long surveyId, responseCount;

@end

@implementation SurveyListObject

@synthesize title, surveyId, responseCount;

- (id)initWithTitle:(NSString *)theTitle andId:(unsigned long)theId andCount:(unsigned long)theCount {
	self = [super init];
	
	surveyId      = theId;
	responseCount = theCount;
	title         = theTitle;
	
	return self;
}


@end

// Helper function to order the survey list
NSComparisonResult compareAZSurvey( SurveyListObject *element1, SurveyListObject *element2, void *context );
NSComparisonResult compareAZSurvey( SurveyListObject *element1, SurveyListObject *element2, void *context ) {
	return [element1.title caseInsensitiveCompare:element2.title];
}

@implementation SurveysFullScreenViewController

@synthesize surveysListTable, logOut, header, version, loadMore, panel, background;

#pragma mark -
#pragma mark initialization and view setup methods

-(id)initWithController:(RootViewController *)root {
	self = [super init];
	
	isDoingSomething = NO;

	if ( [Constants isIpad] )
		self = [self initWithNibName:@"SurveysFullScreenViewController" bundle:nil];
	else
		self = [self initWithNibName:@"SurveysFullScreenView-iPhone" bundle:nil];

	// set a bit whether the user is selecting surveys online
	isFlipped = NO;
	
	// setting parent controller pointer
	parentDelegate = root;
	listOfSurveys = nil;
	return self;
}

- (UIImage *)getPanelImageTall {
	if ( [Constants isIpad] )
		return [UIImage imageNamed:@"surveys-list.png"];
	return [UIImage imageNamed:@"surveys-list-iPhone.png"];
}

- (UIImage *)getPanelImageWide {
	if ( [Constants isIpad] )
		return [UIImage imageNamed:@"surveys-list-wide.png"];
	return [UIImage imageNamed:@"surveys-list-wide-iPhone.png"];	
}

- (void)newResponseReceived:(NSNotification *)notif {
    NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];
    unsigned long auto_sync = [defaults integerForKey:@"survey_auto_sync"] ? [defaults integerForKey:@"survey_auto_sync"] : 0;

    if ( auto_sync == 1 ) {
        NSLog( @"Auto syncing" );

        if ( [PolldaddyAPI getTotalOfflineResponses:0] > 0 && [PolldaddyAPI connectionAvailable:TRUE] ) {
            // Send the task off to the threader
            AutoSyncer *sync = [[AutoSyncer alloc] init];
            [threader addOperation:sync];
            
        }
    }
}

- (void)newResponseSynced:(NSNotification *)notif {
    [self loadOfflineSurveys];
}

- (void)defaultsChanged:(NSNotification *)notification {
    // Auto-sync setting has changed. If now enabled, fire off a 'new response' message so any remaining responses are synced
    NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];
    unsigned long auto_sync = [defaults integerForKey:@"survey_auto_sync"] ? [defaults integerForKey:@"survey_auto_sync"] : 0;
    
    if ( auto_sync == 1 ) {
        [[NSNotificationCenter defaultCenter] postNotificationName:@"polldaddy new response" object:self];
    }
}

- (void)viewDidLoad {
	[super viewDidLoad];
	
    // Create our thread queue
    threader = [[NSOperationQueue alloc] init];
    [threader setMaxConcurrentOperationCount:1];
    
    // Listen for notifications of new responses
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(newResponseReceived:) name:@"polldaddy new response" object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(newResponseSynced:) name:@"polldaddy response synced" object:nil];

    // Listen for changes to the auto_sync setting
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(defaultsChanged:) name:NSUserDefaultsDidChangeNotification object:nil];

	NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];
	
	// Update the version number
	version.text = [NSString stringWithFormat:@"v%@ (build %@)", [[NSBundle mainBundle] objectForInfoDictionaryKey:@"CFBundleShortVersionString"], [[NSBundle mainBundle] objectForInfoDictionaryKey:@"CFBundleVersion"]];
	header.text  = [defaults stringForKey:@"survey_page_title"] ? [defaults stringForKey:@"survey_page_title"] : NSLocalizedString( @"My Surveys", @"Default header for surveys page" );
	header.text  = [header.text substringToIndex: [header.text length] > 20 ? 20 : [header.text length]];
	
	[self loadOfflineSurveys];
	
	//if there are no surveys in the system yet, show the online surveys list instead
	if ( [listOfSurveys count] == 0 )
		[self loadMoreAction];
}

- (void)reviewSurveyResponses {
	[parentDelegate reviewSurvey:clickedSurvey];
}

- (void)loadOfflineSurveys {
	
	// Boot up our list of surveys
	listOfSurveys = [[NSMutableArray alloc] init];
	
	NSMutableDictionary *surveysDictionary = [PolldaddyAPI allocSurveys];
	SurveyListObject    *survey;
	
	// Add surveys to the list
    unsigned long total = 0, count = 0;
	for ( NSNumber *key in surveysDictionary ) {
        count = [PolldaddyAPI getTotalOfflineResponses:key.unsignedLongValue];
        total += count;

		// Allocate surveyobject
		survey = [[SurveyListObject alloc] initWithTitle:[surveysDictionary objectForKey:key] andId:key.unsignedLongValue andCount:count];

		// Add to array
		[listOfSurveys addObject:survey];
		
		// No longer needed here
	}	
	
	
	// Order the list by survey name
	[listOfSurveys sortUsingFunction:compareAZSurvey context:nil];
	
	// Set ourself to be the data source and delegate for the table
	[surveysListTable reloadData];
	[surveysListTable setDataSource:self];
	[surveysListTable setDelegate:self];

    // Do we have any responses at start? Send
    if ( total > 0 )
        [[NSNotificationCenter defaultCenter] postNotificationName:@"polldaddy new response" object:self];
}

#pragma mark -
#pragma mark table view delegate and datasource methods

- (void)tableView:(UITableView *)tableView didSelectRowAtIndexPath:(NSIndexPath *)indexPath {
	// grab the survey associated with the selected item
	SurveyListObject *survey = [listOfSurveys objectAtIndex:indexPath.row];
	
	// grab the surveyID
	clickedSurvey = survey.surveyId;
	
	// tell rootviewcontroller that a survey was selected so it can display the actionsheet
	[parentDelegate didSelectSurvey:survey.surveyId];
}

- (NSInteger)numberOfSectionsInTableView:(UITableView *)tableView {
	return 1;
}

- (NSInteger)tableView:(UITableView *)tableView numberOfRowsInSection:(NSInteger)section {
	return [listOfSurveys count];
}

- (CGFloat)tableView:(UITableView *)tableView heightForRowAtIndexPath:(NSIndexPath *)indexPath {
	if (UI_USER_INTERFACE_IDIOM() == UIUserInterfaceIdiomPad)
		return 90;
	return 40;
}


- (UITableViewCell *)tableView:(UITableView *)tableView cellForRowAtIndexPath:(NSIndexPath *)indexPath {
	static NSString *CellIdentifier = @"Cell";
	
	NumOfflineListCell *cell = (NumOfflineListCell *)[tableView dequeueReusableCellWithIdentifier:CellIdentifier];
	if ( cell == nil ) {
        cell = [[NumOfflineListCell alloc] initWithFrame:CGRectZero];

		cell.accessoryType = UITableViewCellAccessoryNone;
	}
	
	// Get survey
	SurveyListObject *survey = [listOfSurveys objectAtIndex:indexPath.row];
	
	[cell.offlineResponses setBackgroundColor:[UIColor clearColor]];
	[cell.surveyName setBackgroundColor:[UIColor clearColor]];
	
	// Set title for this row
	cell.surveyName.text = survey.title;
	
	if ( survey.responseCount == 1 )
		cell.offlineResponses.text = NSLocalizedString( @"1 offline response", @"" );
	else
		cell.offlineResponses.text = [NSString stringWithFormat:NSLocalizedString( @"%d offline responses", @"" ), survey.responseCount ];
	
	return cell;
}

#pragma mark -
#pragma mark animation and interface orientation handlers

- (void)willAnimateRotationToInterfaceOrientation:(UIInterfaceOrientation)interfaceOrientation duration:(NSTimeInterval)duration {
//	if ( isDoingSomething == YES )
//		return;

	NSLog(@"will animate");
	if ( [Constants isIpad] ) {
		if ( interfaceOrientation == UIInterfaceOrientationPortrait || interfaceOrientation == UIInterfaceOrientationPortraitUpsideDown ) {
			
			// if the interface is rotating to portrait mode, set the frame to the correct dimensions
			[[self view] setFrame:CGRectMake(0, 0, 768, 1024)];
			
			// set the various item locations
			background.frame = CGRectMake(0, 0, 1024, 1024);
			header.frame = CGRectMake(71, 51, 336, 75);
			panel.frame = CGRectMake(46, 199, 676, 762);
			surveysListTable.frame = CGRectMake(72, 270, 623, 657);
			loadMore.frame = CGRectMake(563, 54, [loadMore frame].size.width, [loadMore frame].size.height);
			logOut.frame = CGRectMake(645, 54, [loadMore frame].size.width, [loadMore frame].size.height);
			version.frame = CGRectMake( 20, 983, 144, 21);

			// use the tall background image
			[panel setImage:[self getPanelImageTall]];
		}
		else {
			
			// if the interface is rotating to landscape mode, set the frames appropriately
			
			[[self view] setFrame:CGRectMake(0, 0, 1024, 768)];
			
			// set the various item locations
			background.frame = CGRectMake(0, -60, 1024, 1024);
			header.frame = CGRectMake(51, 20, 300, 75);
			panel.frame = CGRectMake(16, 120, 991, 637);
			surveysListTable.frame = CGRectMake(45, 178, 933, 530);
			loadMore.frame = CGRectMake(833, 25, [loadMore frame].size.width, [loadMore frame].size.height);
			logOut.frame = CGRectMake(923, 25, [loadMore frame].size.width, [loadMore frame].size.height);
			version.frame = CGRectMake( 20, 738, 144, 21);

			// use the wider background image
			[panel setImage:[self getPanelImageWide]];
		}
	}
	else {
		if ( interfaceOrientation == UIInterfaceOrientationPortrait || interfaceOrientation == UIInterfaceOrientationPortraitUpsideDown ) {
			// if the interface is rotating to portrait mode, set the frame to the correct dimensions
			[[self view] setFrame:CGRectMake(0, 0, 320, [Utility deviceHeight])];
			
			// set the various item locations
			background.frame = CGRectMake( 0, 0, 320, [Utility deviceHeight] );
			header.frame     = CGRectMake( 20, 31, 236, 40 );
			panel.frame      = CGRectMake( 5, 86, 309, [Utility deviceHeight] - 86 - 12 );
			loadMore.frame   = CGRectMake( 224, 20, [loadMore frame].size.width, [loadMore frame].size.height );
			logOut.frame     = CGRectMake( 272, 20, [loadMore frame].size.width, [loadMore frame].size.height );
			version.frame    = CGRectMake( 14, [Utility deviceHeight] - 22, 144, 21 );
			
			surveysListTable.frame = CGRectMake( 20, 114, 280, [Utility deviceHeight] - 114 - 36 );

			// use the tall background image
			[panel setImage:[self getPanelImageTall]];
		}
		else {
			// if the interface is rotating to landscape mode, set the frames appropriately
			[[self view] setFrame:CGRectMake( 0, 0, [Utility deviceHeight], 320 )];
			
			// set the various item locations
			background.frame = CGRectMake( 0, 0, [Utility deviceHeight], 320 );
			header.frame     = CGRectMake( 10, 10, 300, 35 );
			panel.frame      = CGRectMake( 5, 55, [Utility deviceHeight] - 5, 240 );
			loadMore.frame   = CGRectMake( [Utility deviceHeight] - 90, -5, [loadMore frame].size.width, [loadMore frame].size.height );
			logOut.frame     = CGRectMake( [Utility deviceHeight] - 50, -5, [loadMore frame].size.width, [loadMore frame].size.height );
			version.frame    = CGRectMake( 20, 292, 144, 21 );

			surveysListTable.frame = CGRectMake( 22, 80, [Utility deviceHeight] - 50, 190 );
			
			[panel setImage:[self getPanelImageWide]];
		}
	}
}

- (void) swapOutListView{
	NSLog(@"Swap out");
	// run the various animations 
	
	// animation block for the panel view
	[UIView beginAnimations:nil context:nil];
	[UIView setAnimationCurve:UIViewAnimationCurveEaseOut];
	[UIView setAnimationDuration:0.25];
	[UIView setAnimationTransition:UIViewAnimationTransitionNone forView:panel cache:YES];
	[panel setAlpha:0.0];
	[panel setFrame:CGRectMake([panel frame].origin.x, 300, [panel frame].size.width, [panel frame].size.height)];
	[UIView setAnimationDelegate:self];
	[UIView setAnimationDidStopSelector:@selector(fadingDidStop:finished:context:)];
	[UIView commitAnimations];
	
	// animation block for the surveys list table
	[UIView beginAnimations:nil context:nil];
	[UIView setAnimationCurve:UIViewAnimationCurveEaseOut];
	[UIView setAnimationDuration:0.25];
	[UIView setAnimationTransition:UIViewAnimationTransitionNone forView:surveysListTable cache:YES];
	[surveysListTable setAlpha:0.0];
	[surveysListTable setFrame:CGRectMake([surveysListTable frame].origin.x, 300, [surveysListTable frame].size.width, [surveysListTable frame].size.height)];
	[UIView commitAnimations];
	
	// animation block for the header text
	[UIView beginAnimations:nil context:nil];
	[UIView setAnimationCurve:UIViewAnimationCurveEaseOut];
	[UIView setAnimationDuration:0.25];
	[UIView setAnimationTransition:UIViewAnimationTransitionNone forView:header cache:YES];
	[header setFrame:CGRectMake([header frame].origin.x, -100, [header frame].size.width, [header frame].size.height)];
	[UIView commitAnimations];
	
	// animation block for the load button
	[UIView beginAnimations:nil context:nil];
	[UIView setAnimationCurve:UIViewAnimationCurveEaseOut];
	[UIView setAnimationDuration:0.25];
	[UIView setAnimationTransition:UIViewAnimationTransitionNone forView:loadMore cache:YES];
	[loadMore setFrame:CGRectMake([loadMore frame].origin.x, -100, [loadMore frame].size.width, [loadMore frame].size.height)];
	[UIView commitAnimations];
	
	// animation block for the load button
	[UIView beginAnimations:nil context:nil];
	[UIView setAnimationCurve:UIViewAnimationCurveEaseOut];
	[UIView setAnimationDuration:0.25];
	[UIView setAnimationTransition:UIViewAnimationTransitionNone forView:logOut cache:YES];
	[logOut setFrame:CGRectMake([logOut frame].origin.x, -100, [logOut frame].size.width, [logOut frame].size.height)];
	[UIView commitAnimations];
}

- (void) swapInListView: (UIInterfaceOrientation) orientation {
	NSLog(@"SWAP IN");
	[self loadOfflineSurveys];

	isDoingSomething = NO;

	// setting up data holders for item locations
	int panel_y;
	int table_y;
	int header_y;
	int loadMore_y;
	int logout_y;
	
	
	// if we're rotating to portrait view
	if ( [Constants isIpad] ) {
		if (UIInterfaceOrientationIsPortrait(orientation)) {
			panel_y = 180;
			table_y = 250;
			header_y = 51;
			loadMore_y = 34;
			logout_y = 34;
		} else {
			// if we're rotating to landscape view	
			panel_y = 100;
			table_y = 158;
			header_y = 20;
			loadMore_y = 31;
			logout_y = 32;
		}
	}
	else {
		if (UIInterfaceOrientationIsPortrait(orientation)) {
			panel_y = 86;
			table_y = 114;
			header_y = 31;
			loadMore_y = 20;
			logout_y = 20;
		} else {
			// if we're rotating to landscape view	
			panel_y = 55;
			table_y = 80;
			header_y = 10;
			loadMore_y = -5;
			logout_y = -5;
		}
	}
	
	// animation block for panel
	
	[UIView beginAnimations:nil context:@"animation"];
	[UIView setAnimationCurve:UIViewAnimationCurveEaseOut];
	[UIView setAnimationDuration:0.25];
	[UIView setAnimationTransition:UIViewAnimationTransitionNone forView:panel cache:YES];
	[panel setAlpha:1.0];
	[panel setFrame:CGRectMake([panel frame].origin.x, panel_y, [panel frame].size.width, [panel frame].size.height)];
	[UIView setAnimationDelegate:self];
	[UIView setAnimationDidStopSelector:@selector(fadingDidStop:finished:context:)];
	[UIView commitAnimations];
	
	// animation block for surveys list table
	[UIView beginAnimations:nil context:nil];
	[UIView setAnimationCurve:UIViewAnimationCurveEaseOut];
	[UIView setAnimationDuration:0.25];
	[UIView setAnimationTransition:UIViewAnimationTransitionNone forView:surveysListTable cache:YES];
	[surveysListTable setAlpha:1.0];
	[surveysListTable setFrame:CGRectMake([surveysListTable frame].origin.x, table_y, [surveysListTable frame].size.width, [surveysListTable frame].size.height)];
	[UIView commitAnimations];
	
	// animation block for header
	[UIView beginAnimations:nil context:nil];
	[UIView setAnimationCurve:UIViewAnimationCurveEaseOut];
	[UIView setAnimationDuration:0.25];
	[UIView setAnimationTransition:UIViewAnimationTransitionNone forView:header cache:YES];
	[header setFrame:CGRectMake([header frame].origin.x, header_y , [header frame].size.width, [header frame].size.height)];
	[UIView commitAnimations];
	
	// animation block for load button
	[UIView beginAnimations:nil context:nil];
	[UIView setAnimationCurve:UIViewAnimationCurveEaseOut];
	[UIView setAnimationDuration:0.25];
	[UIView setAnimationTransition:UIViewAnimationTransitionNone forView:loadMore cache:YES];
	[loadMore setFrame:CGRectMake([loadMore frame].origin.x, loadMore_y, [loadMore frame].size.width, [loadMore frame].size.height)];
	[UIView commitAnimations];
	
	// animation block for load button
	[UIView beginAnimations:nil context:nil];
	[UIView setAnimationCurve:UIViewAnimationCurveEaseOut];
	[UIView setAnimationDuration:0.25];
	[UIView setAnimationTransition:UIViewAnimationTransitionNone forView:logOut cache:YES];
	[logOut setFrame:CGRectMake([logOut frame].origin.x, logout_y, [logOut frame].size.width, [logOut frame].size.height)];
	[UIView commitAnimations];
}

-(BOOL)shouldAutorotate {
    return YES;
}

-(NSUInteger)supportedInterfaceOrientations {
    return UIInterfaceOrientationMaskAll;
}

- (IBAction) logOutNow {

	UIAlertView *alert = [[UIAlertView alloc] init];
	[alert setTitle:NSLocalizedString( @"Confirm", @"" )];
	[alert setMessage:NSLocalizedString( @"Are you sure you want to log out of your account?", @"" )];
	[alert setDelegate:self];
	[alert addButtonWithTitle:NSLocalizedString( @"Yes", @"" )];
	[alert addButtonWithTitle:NSLocalizedString( @"Cancel", @"" )];
	[alert show];
	
}

- (void)alertView:(UIAlertView *)alertView clickedButtonAtIndex:(NSInteger)buttonIndex
{
	if (buttonIndex == 0)
	{
		[PolldaddyAPI accountLogOut];
		
		[parentDelegate showSignInAfterLogOut];
		
	}
}


#pragma mark -
#pragma mark loading more surveys from the web
- (void) saveSelections {
	[self loadMoreAction];
}

- (IBAction) loadMoreAction{
	
	if ( [PolldaddyAPI connectionAvailable:TRUE] ) { // if there IS a connection
	
		if(isFlipped == NO){
			[loadMore setSelected:YES];
			// animations for flipping the panel backwards
			
			[UIView beginAnimations:nil context:nil];
			[UIView setAnimationCurve:UIViewAnimationCurveEaseOut];
			[UIView setAnimationDuration:0.5];
			[UIView setAnimationTransition:UIViewAnimationTransitionFlipFromRight forView:panel cache:YES];
			[UIView commitAnimations];
			
			// flip the table and hide it halfway
			
			[UIView beginAnimations:nil context:nil];
			[UIView setAnimationCurve:UIViewAnimationCurveEaseOut];
			[UIView setAnimationDuration:0.5];
			[UIView setAnimationTransition:UIViewAnimationTransitionFlipFromRight forView:surveysListTable cache:YES];
			[UIView commitAnimations];
			
			[UIView beginAnimations:nil context:nil];
			[UIView setAnimationCurve:UIViewAnimationCurveEaseIn];
			[UIView setAnimationDuration:0.125];
			[UIView setAnimationTransition:UIViewAnimationTransitionNone forView:surveysListTable cache:YES];
			[surveysListTable setAlpha:0.0];
			[UIView commitAnimations];
			
			isFlipped = YES;
			
			// load livesurveyviewcontroller to display the live list of surveys
			
			if (UI_USER_INTERFACE_IDIOM() == UIUserInterfaceIdiomPad) {
				liveSurveysView = [[LiveSurveySelectionViewController alloc] initWithNibName:@"LiveSurveySelectionViewController" bundle:nil];
				[[liveSurveysView liveTable] setFrame:CGRectMake([[liveSurveysView liveTable] frame].origin.x, [[liveSurveysView liveTable] frame].origin.y, [[liveSurveysView liveTable] frame].size.width, 790) ];
				
				if ( UIDeviceOrientationIsLandscape( [Utility currentInterfaceOrientation] ) ) {
					[[liveSurveysView view] setFrame:CGRectMake(33, 125, 950, 620)];
					[[liveSurveysView saveSelectionsButton] setFrame:CGRectMake(180, 500, [[liveSurveysView saveSelectionsButton] frame].size.width, [[liveSurveysView saveSelectionsButton] frame].size.height)];
				} else {
					[[liveSurveysView view] setFrame:CGRectMake(62, 210, 638, 750)];
					[[liveSurveysView saveSelectionsButton] setFrame:CGRectMake(25, 623, [[liveSurveysView saveSelectionsButton] frame].size.width, [[liveSurveysView saveSelectionsButton] frame].size.height)];
				}
			}
			else {
				liveSurveysView = [[LiveSurveySelectionViewController alloc] initWithNibName:@"LiveSurveySelectionViewController-iPhone" bundle:nil];
                UITableView * liveTable = [liveSurveysView liveTable];
                liveTable.frame = CGRectMake(liveTable.frame.origin.x, liveTable.frame.origin.y, liveTable.frame.size.width, [Utility deviceHeight] - 80);
				
				if ( UIDeviceOrientationIsLandscape( [Utility currentInterfaceOrientation] ) ) {
                    liveSurveysView.view.frame = CGRectMake(15, 60, [Utility deviceHeight] - 25, 220);
                    CGFloat saveButtonX = (liveSurveysView.view.frame.size.width - liveSurveysView.saveSelectionsButton.frame.size.width) / 2.0;
                    liveSurveysView.saveSelectionsButton.frame = CGRectMake(saveButtonX, 175, liveSurveysView.saveSelectionsButton.frame.size.width, liveSurveysView.saveSelectionsButton.frame.size.height);
				} else {
                    liveSurveysView.view.frame = CGRectMake(10, 90, 300, [Utility deviceHeight] - 112);
                    liveSurveysView.saveSelectionsButton.frame = CGRectMake(20, [Utility deviceHeight] - 163, liveSurveysView.saveSelectionsButton.frame.size.width, liveSurveysView.saveSelectionsButton.frame.size.height);
				}
			}
			
			[[liveSurveysView view] setAlpha:0.0];
			[[parentDelegate displayedViewControllers] addObject:liveSurveysView];
			
			[liveSurveysView setParentDelegate:self];
			
			[[self view] addSubview:[liveSurveysView view]];
		} else{
			// otherwise flip everything back
			
			[loadMore setSelected:NO];
			
			[UIView beginAnimations:nil context:nil];
			[UIView setAnimationCurve:UIViewAnimationCurveEaseOut];
			[UIView setAnimationDuration:0.5];
			[UIView setAnimationTransition:UIViewAnimationTransitionFlipFromLeft forView:panel cache:YES];
			[UIView commitAnimations];
			
			[UIView beginAnimations:nil context:nil];
			[UIView setAnimationCurve:UIViewAnimationCurveEaseOut];
			[UIView setAnimationDuration:0.5];
			[UIView setAnimationTransition:UIViewAnimationTransitionFlipFromLeft forView:surveysListTable cache:YES];
			[UIView commitAnimations];
			
			[UIView beginAnimations:nil context:nil];
			[UIView setAnimationCurve:UIViewAnimationCurveEaseOut];
			[UIView setAnimationDuration:0.125];
			[UIView setAnimationTransition:UIViewAnimationTransitionNone forView:surveysListTable cache:YES];
			[surveysListTable setAlpha:1.0];
			[UIView commitAnimations];
			
			[liveSurveysView swapOutListView];

			[self loadOfflineSurveys];

			isFlipped = NO;
		}
	}
}	

- (void)fadingDidStop:(NSString *)animationID finished:(bool)finished context:(void *)context{
	if ( clickedSurvey > 0 ) {
		// Deselect our survey - or should we leave it selected?
		[[self surveysListTable] deselectRowAtIndexPath:[[self surveysListTable] indexPathForSelectedRow] animated:NO];
		
		// Tell our parent we want to start a survey
		if ( parentDelegate.lastButton == 0 ) {
			[parentDelegate startSurvey:clickedSurvey];
			isDoingSomething = YES;
		}
		
		// Reset what was clicked so this doesnt get called again when the surveys list animation fades in
		clickedSurvey = 0;
	}
}

- (void)syncFinished:(unsigned int)total {
	// Update the list
	if ( total > 0 ) {
		[self loadOfflineSurveys];
		[self swapInListView:[Utility currentInterfaceOrientation]];
	}
}

- (void)toggleButtons:(boolean_t)onoff {
    loadMore.enabled = onoff;
    logOut.enabled = onoff;
    
    if ( onoff == YES ) {
        loadMore.alpha = 1.0f;
        logOut.alpha = 1.0f;
    }
    else {
        loadMore.alpha = 0.5f;
        logOut.alpha = 0.5f;
    }
}

// Sync responses for the selected survey
- (void)syncResponses {
	if ( [PolldaddyAPI connectionAvailable:TRUE] ) { // if there IS a connection
		PolldaddyAppDelegate *delegate = (PolldaddyAppDelegate *)[[UIApplication sharedApplication] delegate];

		if ( [Constants isIpad] )
			progressView = [[ProgressView alloc] initWithNibName:@"ProgressViewIpad" andSurvey:clickedSurvey];
		else
			progressView = [[ProgressView alloc] initWithNibName:@"ProgressView" andSurvey:clickedSurvey];
		
		progressView.delegate = self;
        [delegate.rootViewController presentViewController:progressView animated:YES completion:nil];
	}
	else {
		NSLog(@"no connection");
	}
}

#pragma mark -
#pragma mark cleanup and dealloc

- (void)didReceiveMemoryWarning {
    // Releases the view if it doesn't have a superview.
    [super didReceiveMemoryWarning];
    
    // Release any cached data, images, etc that aren't in use.
}

-(void)dealloc
{
    // Remove notification
    [[NSNotificationCenter defaultCenter] removeObserver:self name:@"polldaddy new response" object:nil];
    [[NSNotificationCenter defaultCenter] removeObserver:self name:@"polldaddy response synced" object:nil];
}


@end
