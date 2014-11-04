//
//  RootViewController.h
//  Polldaddy
//
//  Created by Kevin Conboy on 5/25/10.
//  Copyright 2010 Automattic, Inc. All rights reserved.
//

#import <UIKit/UIKit.h>
#import "SignInViewController.h"
#import "SurveysFullScreenViewController.h"
#import "PolldaddyAPI.h"
#import "Reachability.h"

@class QuestionsViewController, ResponseViewController;

@interface RootViewController : UIViewController <UIActionSheetDelegate>{
	UIImageView                     *splashView;
	UISplitViewController           *splitViewController;
	SurveysFullScreenViewController *surveysFullScreenViewController;
	QuestionsViewController         *questionsViewController;
  ResponseViewController          *responseViewController;
	SignInViewController            *signInView;
	UIImageView						*background; 
	UIImageView						*panel; 
	
	NSInteger lastButton;
	
	NSMutableArray *displayedViewControllers;
	
	Reachability *internetReachable;
	Reachability *hostReachable;
}

@property (nonatomic, strong) IBOutlet SignInViewController            *signInView;
@property (nonatomic, strong) IBOutlet SurveysFullScreenViewController *surveysFullScreenViewController;
@property (nonatomic, strong) IBOutlet UISplitViewController           *splitViewController;
@property (nonatomic, strong) IBOutlet QuestionsViewController         *questionsViewController;
@property (nonatomic, strong) UIImageView *background;
@property (nonatomic, strong) UIImageView *panel;
@property (nonatomic,readonly) NSInteger lastButton;
@property (nonatomic, strong) NSMutableArray *displayedViewControllers;

- (void) startSurvey: (unsigned long)surveyId;
- (void) reviewSurvey: (unsigned long)surveyId;
- (void) didSelectSurvey: (unsigned long)surveyId;
- (void) showSurveys;
- (void) showSignInAfterLogOut;

@end
