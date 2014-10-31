//
//  PolldaddyAppDelegate.m
//  Polldaddy
//
//  Created by Kevin Conboy on 5/21/10.
//  Copyright Automattic 2010. All rights reserved.
//

#import "PolldaddyAppDelegate.h"

@implementation PolldaddyAppDelegate

@synthesize window,rootViewController;


- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions {    

	rootViewController = [[RootViewController alloc] init];
	
	[window addSubview:rootViewController.view];
	[window makeKeyAndVisible];	

  return YES;
}
 



@end
