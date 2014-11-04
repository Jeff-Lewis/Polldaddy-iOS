//
//  PolldaddyAppDelegate.h
//  Polldaddy
//
//  Created by Kevin Conboy on 5/21/10.
//  Copyright Automattic 2010. All rights reserved.
//

#import <UIKit/UIKit.h>
#import "RootViewController.h"


@interface PolldaddyAppDelegate : NSObject <UIApplicationDelegate> {
	UIWindow *window;
	RootViewController *rootViewController;

}

@property (nonatomic, strong) IBOutlet RootViewController *rootViewController;
@property (nonatomic, strong) IBOutlet UIWindow *window;


@end

