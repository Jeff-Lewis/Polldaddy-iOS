//
//  RemoteResources.h
//  Polldaddy
//
//  Created by John Godley on 28/07/2011.
//  Copyright 2011 Automattic. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "PolldaddyAPI2.h"

@class Survey;

@interface RemoteContent : NSObject {
    NSString *remote;
    NSString *local;
}

@property (nonatomic,copy)NSString *remote, *local;

+ (NSString *)localName:(NSString *)input;

@end

@interface RemoteResources : NSObject {
    unsigned int    stage;
    Survey         *survey;
    NSMutableArray *content;
    unsigned int    current;
}

@property (nonatomic)unsigned int current;
@property (nonatomic,strong) Survey *survey;
@property (nonatomic,strong) NSMutableArray *content;

-(void)addResource:(NSString *)url;
-(BOOL)next;
-(BOOL)alreadyExists:(NSString *)url;
-(RemoteResources *)initWithSurvey:(Survey *)survey;
-(BOOL)nextInQueue:(PolldaddyAPI2 *)api delegate:(id <API_Survey>)del;
@end
