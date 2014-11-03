//
//  Utility.m
//  Polldaddy
//
//  Created by William Welbes on 11/3/14.
//  Copyright (c) 2014 Automattic. All rights reserved.
//

#import "Configuration.h"

@implementation Configuration

@synthesize polldaddyAPIKey = _polldaddyAPIKey;
@synthesize polldaddyUrl = _polldaddyUrl;

+ (Configuration*)sharedInstance {
    static Configuration *sharedConfiguration = nil;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        sharedConfiguration = [[self alloc] init];
    });
    return sharedConfiguration;
}

-(id)init
{
    self = [super init];
    if(self != nil) {
        //Initiallize from configuration
        [self loadConfiguration];
    }
    return self;
}

-(void)loadConfiguration
{
    //Load the configuration from the plist
    NSString *plistPath = [[NSBundle mainBundle] pathForResource:@"Configuration" ofType:@"plist"];
    NSDictionary *configuration = [[NSDictionary alloc] initWithContentsOfFile:plistPath];
    
    if(configuration == nil) {
        NSLog(@"Error loading configuration.  Please confirm you've created a Configuration.plist file with the appropraite values like configuation-sample.plist.");
    } else {
        _polldaddyAPIKey = configuration[@"PollDaddyAPI"][@"PolldaddyAPIKey"];
        _polldaddyUrl = configuration[@"PollDaddyAPI"][@"PolldaddyUrl"];
    }
}

@end
