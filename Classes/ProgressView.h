//
//  ProgressView.h
//  Polldaddy
//
//  Created by John Godley on 24/01/2011.
//  Copyright 2011 Automattic. All rights reserved.
//

#import <UIKit/UIKit.h>
#import "PolldaddyAPI2.h"

@protocol SyncStatus
@optional
- (void)syncFinished:(unsigned int)total;
@end

@class PolldaddyAPI2;

@interface ProgressView : UIViewController <PolldaddyApiStatus> {
	UIProgressView *progress;
	UIActivityIndicatorView *loading;
	UILabel *outOf;
	UILabel *size;
	UILabel *syncTitle;
	UIButton *button;
	
	UIView *grouper;
	
	unsigned int total;
	unsigned int surveyID;
	unsigned int lastResponseID;
	BOOL finished;
	
	PolldaddyAPI2 *api;
	
	unsigned int responsesProcessed;
	unsigned int responsesSent;
	
	NSMutableArray *purgeList;
	
	id <SyncStatus> delegate;
}

- (id)initWithNibName:(NSString *)nibNameOrNil andSurvey:(unsigned int)survey;
- (IBAction) buttonPressed:(id) sender;
- (void)syncAllResponses;

@property (nonatomic, strong) IBOutlet UIProgressView *progress;
@property (nonatomic, strong) IBOutlet UIActivityIndicatorView *loading;
@property (nonatomic, strong) IBOutlet UILabel *outOf;
@property (nonatomic, strong) IBOutlet UILabel *size;
@property (nonatomic, strong) IBOutlet UILabel *syncTitle;
@property (nonatomic, strong) IBOutlet UIButton *button;
@property (nonatomic, strong) IBOutlet UIView *grouper;
@property (nonatomic, strong) id delegate;
@end
