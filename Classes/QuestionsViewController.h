//
//  QuestionsViewController.h
//  Polldaddy
//
//  Created by Kevin Conboy on 5/21/10.
//  Copyright 2010 Automattic, Inc All rights reserved.
//

#import <UIKit/UIKit.h>

@class Survey, RootViewController, Question, Language;
@class UI_Question;

@interface QuestionsViewController : UIViewController {
	RootViewController *parentDelegate;

	// General question items
	UIButton  *surveyButton;
	UIButton  *cancelButton;
	UIWebView *questionDetails;
	
	UIActivityIndicatorView *loading;
	
	// Our survey details
	Survey   *survey;
    Language *pack;
	
	// What is currently being displayed
	UI_Question *currentField;
	int         currentQnum;
	
	// Those all-important answers - stored as dictionary of qID => answer XML
	NSMutableDictionary *answers;
	NSMutableArray      *skipped;
	
	BOOL showEverything;
    
    NSTimer *timeout;
}

@property (nonatomic, strong) IBOutlet UIButton *surveyButton, *cancelButton;
@property (nonatomic, strong) IBOutlet UIWebView *questionDetails;
@property (nonatomic, strong) IBOutlet UIActivityIndicatorView *loading;

- (id)initWithController:(RootViewController *)root;
- (void)willAnimateRotationToInterfaceOrientation:(UIInterfaceOrientation)interfaceOrientation duration:(NSTimeInterval)duration;

- (void)hideEverything:(BOOL)hideOrShow;
- (IBAction) buttonPressed: (id) sender;
- (void) displayQuestion:(int)qNum withNewField:(boolean_t)newField;
- (void) loadSurvey:(unsigned int) surveyId;
- (void)questionFirstLoaded:(NSNotification *)notification;
- (void)questionLoaded:(BOOL)drawQuestion;
- (void)heartbeat;
@end
