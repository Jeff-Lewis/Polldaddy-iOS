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
- (void)syncFinished:(unsigned long)total;
@end

@class PolldaddyAPI2;

@interface ProgressView : UIViewController

- (id)initWithNibName:(NSString *)nibNameOrNil andSurvey:(unsigned long)survey;
- (void)syncAllResponses;


@property (nonatomic, strong) id delegate;
@end
