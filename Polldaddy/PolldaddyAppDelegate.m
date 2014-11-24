//
//  PolldaddyAppDelegate.m
//  Polldaddy
//
//  Created by Kevin Conboy on 5/21/10.
//  Copyright Automattic 2010. All rights reserved.
//

#import "PolldaddyAppDelegate.h"
#import <HockeySDK/HockeySDK.h>
#import <Mixpanel/Mixpanel.h>

@interface PolldaddyAppDelegate() <BITHockeyManagerDelegate>

@end

@implementation PolldaddyAppDelegate

@synthesize window,rootViewController;


- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions {    

	rootViewController = [[RootViewController alloc] initWithNibName:@"RootViewController" bundle:nil];
	
    [self.window setRootViewController:rootViewController];
    [self.window makeKeyAndVisible];
    
    [self configureHockeySDK];
    [self configureMixpanel];
    
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

- (void)applicationDidBecomeActive:(UIApplication *)application
{
    [[Mixpanel sharedInstance] track:@"Application Opened"];
}


- (void)configureHockeySDK
{
#ifndef INTERNAL_BUILD
    return;
#endif
    
    NSString *hockeyAppId = (NSString *)[self retrieveConfigurationValue:@"HockeyAppId"];
    if (hockeyAppId == nil) {
        return;
    }
    
    [[BITHockeyManager sharedHockeyManager] configureWithIdentifier:hockeyAppId
                                                           delegate:self];
    [[BITHockeyManager sharedHockeyManager] startManager];
}

- (void)configureMixpanel
{
    NSString *mixpanelAPIToken = (NSString *)[self retrieveConfigurationValue:@"MixpanelAPIToken"];
    if (mixpanelAPIToken == nil) {
        return;
    }
    
    [Mixpanel sharedInstanceWithToken:mixpanelAPIToken];
    [[Mixpanel sharedInstance] registerSuperProperties:@{ @"platform" : @"iOS"}];
}

- (id)retrieveConfigurationValue:(NSString *)key
{
    NSString *plistPath = [[NSBundle mainBundle] pathForResource:@"Configuration" ofType:@"plist"];
    NSDictionary *configuration = [[NSDictionary alloc] initWithContentsOfFile:plistPath];
    id value;
    
    if(configuration == nil) {
        return nil;
    } else {
        value = configuration[key];
    }
    
    return value;
}

@end
