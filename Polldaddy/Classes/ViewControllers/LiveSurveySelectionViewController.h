//
//  LiveSurveySelectionViewController.h
//  Polldaddy
//
//  Created by Kevin Conboy on 5/27/10.
//  Copyright 2010 Automattic, Inc. All rights reserved.
//

#import <UIKit/UIKit.h>
#import "PolldaddyAPI2.h"

@class SurveysFullScreenViewController;

@interface LiveSurveySelectionViewController : UIViewController <UITableViewDataSource, UITableViewDelegate, API_Survey> {
	UITableView         *liveTable;
	NSArray             *surveys;
	NSArray             *quizzes;
	UIButton            *saveSelectionsButton;
    
    unsigned int running;

	SurveysFullScreenViewController *parentDelegate;
    
  	PolldaddyAPI2 *api;
    
    NSMutableDictionary *resources;
}

@property (nonatomic,strong) IBOutlet UITableView *liveTable;
@property (nonatomic, strong) SurveysFullScreenViewController *parentDelegate;
@property (nonatomic, strong) IBOutlet UIButton *saveSelectionsButton;

- (void) swapInListView;
- (void) swapOutListView;
- (IBAction) saveSelections;

- (NSIndexPath *)indexPathForCellController:(id)cellController;
@end
