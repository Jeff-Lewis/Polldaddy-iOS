//
//  ResponseViewController.h
//  Polldaddy
//
//  Created by John Godley on 07/07/2010.
//  Copyright 2010 Automattic. All rights reserved.
//

#import <UIKit/UIKit.h>

@class Survey, RootViewController, Response;

@interface ResponseViewController : UIViewController {
	RootViewController *parentDelegate;

	// Our survey details
	Survey   *survey;
	Response *currentResponse;
	
	// Buttons and such
	UILabel  *respondentTitle;
	UILabel  *startLabel;
	UILabel  *endLabel;
	UILabel  *started;
	UILabel  *ended;
	UIButton *nextButton;
	UIButton *prevButton;
	UIButton *cancelButton;
	UIButton *deleteButton;
	
	UIScrollView *scroller;
	
	unsigned int currentResponsePos, weirdOffset;
}

@property (nonatomic, strong) IBOutlet UILabel  *respondentTitle, *startLabel, *endLabel, *started, *ended;
@property (nonatomic, strong) IBOutlet UIButton *nextButton, *prevButton, *cancelButton, *deleteButton;
@property (nonatomic, strong) IBOutlet UIScrollView *scroller;

- (id)initWithController:(RootViewController *)root;
- (void) loadSurvey:(unsigned long) surveyId;

- (IBAction) exitButton: (id) sender;
- (IBAction) nextResponse: (id) sender;
- (IBAction) previousResponse: (id) sender;
- (IBAction) deleteButton: (id) sender;

@end
