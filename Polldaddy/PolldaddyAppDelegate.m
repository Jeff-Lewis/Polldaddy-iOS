//
//  PolldaddyAppDelegate.m
//  Polldaddy
//
//  Created by Kevin Conboy on 5/21/10.
//  Copyright Automattic 2010. All rights reserved.
//

#import "PolldaddyAppDelegate.h"
#import <HockeySDK/HockeySDK.h>

@interface PolldaddyAppDelegate() <BITHockeyManagerDelegate>

@end

@implementation PolldaddyAppDelegate

@synthesize window,rootViewController;


- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions {    

	rootViewController = [[RootViewController alloc] initWithNibName:@"RootViewController" bundle:nil];
	
    [self.window setRootViewController:rootViewController];
    [self.window makeKeyAndVisible];
    
    [self configureHockeySDK];
    
    return YES;
}

- (BOOL)application:(UIApplication *)application openURL:(NSURL *)url sourceApplication:(NSString *)sourceApplication annotation:(id)annotation
{
    BOOL returnValue = NO;

    if ([[BITHockeyManager sharedHockeyManager].authenticator handleOpenURL:url
                                                          sourceApplication:sourceApplication
                                                                 annotation:annotation]) {
        returnValue = YES;
    }
    
    return returnValue;
}


- (void)configureHockeySDK
{
#ifndef INTERNAL_BUILD
    return;
#endif
    
    NSString *plistPath = [[NSBundle mainBundle] pathForResource:@"Configuration" ofType:@"plist"];
    NSDictionary *configuration = [[NSDictionary alloc] initWithContentsOfFile:plistPath];
    NSString *hockeyAppId;
    
    if(configuration == nil) {
        return;
    } else {
        hockeyAppId = configuration[@"HockeyAppId"];
    }
    [[BITHockeyManager sharedHockeyManager] configureWithIdentifier:hockeyAppId
                                                           delegate:self];
    [[BITHockeyManager sharedHockeyManager] startManager];
}

@end
