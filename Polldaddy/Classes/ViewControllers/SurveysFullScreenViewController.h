//
//  SurveysFullScreenViewController.h
//  Polldaddy
//
//  Created by Kevin Conboy on 5/25/10.
//  Copyright 2010 Automattic, Inc. All rights reserved.
//

#import <UIKit/UIKit.h>
#import "ProgressView.h"
#include "PDButton.h"
#import "LiveSurveySelectionViewController.h"

@class RootViewController;

@interface SurveysFullScreenViewController : UIViewController <UITableViewDataSource, UITableViewDelegate, UIActionSheetDelegate>{
	UITableView *surveysListTable;

	UIActionSheet  *progressSheet;
	ProgressView   *progressView;
	UIProgressView *progressBar;
	UIImageView    *background;
	UIImageView    *panel;

	UILabel     *header;
	UILabel     *version;

	UIButton	  *loadMore;
	UIButton	  *logOut;

	bool         isFlipped;
	bool         isDoingSomething;
	bool         lastAction;
	unsigned long clickedSurvey;
	
	NSMutableArray *listOfSurveys;
    NSOperationQueue *threader;
	
	LiveSurveySelectionViewController *liveSurveysView;
	RootViewController                *parentDelegate;
}

@property (nonatomic,strong) IBOutlet UITableView *surveysListTable;
@property (nonatomic,strong) IBOutlet UILabel *header, *version;
@property (nonatomic,strong) IBOutlet UIImageView *panel, *background;
@property (nonatomic,strong) IBOutlet UIButton *loadMore, *logOut;

- (id)initWithController:(RootViewController *)root;

// UITableViewDataSource functions
- (NSInteger)numberOfSectionsInTableView:(UITableView *)tableView;
- (NSInteger)tableView:(UITableView *)tableView numberOfRowsInSection:(NSInteger)section;
- (UITableViewCell *)tableView:(UITableView *)tableView cellForRowAtIndexPath:(NSIndexPath *)indexPath;

// UITableViewDelegate functions
- (void)tableView:(UITableView *)tableView didSelectRowAtIndexPath:(NSIndexPath *)indexPath;

// Other stuff
- (IBAction)loadMoreAction;
- (IBAction)logOutNow;
- (void) saveSelections;
- (void) swapOutListView;
- (void) swapInListView:(UIInterfaceOrientation)orientation;
- (void)fadingDidStop:(NSString *)animationID finished:(bool)finished context:(void *)context;
- (void)syncResponses;
- (void)loadOfflineSurveys;
- (void)reviewSurveyResponses;
- (void)syncFinished:(unsigned int)total;
- (void)toggleButtons:(boolean_t)onoff;
@end
