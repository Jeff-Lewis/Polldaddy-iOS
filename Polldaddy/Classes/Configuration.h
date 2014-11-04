//
//  Configuration.h
//  Polldaddy
//
//  Created by William Welbes on 11/3/14.
//  Copyright (c) 2014 Automattic. All rights reserved.
//
//  Singleton Configuration class intented to load values in the configuration file

#import <Foundation/Foundation.h>

@interface Configuration : NSObject

+ (Configuration*)sharedInstance;

@property(nonatomic, readonly) NSString * polldaddyAPIKey;
@property(nonatomic, readonly) NSString * polldaddyUrl;

@end
