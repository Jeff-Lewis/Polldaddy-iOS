//
//  RemoteResources.m
//  Polldaddy
//
//  Created by John Godley on 28/07/2011.
//  Copyright 2011 Automattic. All rights reserved.
//

#import "RemoteResources.h"
#import <CommonCrypto/CommonDigest.h>
#import "Survey.h"

const unsigned int STAGE_LANGUAGE  = 0;
const unsigned int STAGE_STYLE     = 1;
const unsigned int STAGE_RESOURCES = 2;

@implementation RemoteContent 

@synthesize local, remote;

+ (NSString *)localName:(NSString *)input {
    unsigned char result[CC_MD5_DIGEST_LENGTH];
    
    // Convert NSString into C-string and generate MD5 Hash
    CC_MD5([input UTF8String], (CC_LONG)[input length], result);
    
    // Convert C-string (the hash) into NSString
    NSMutableString *hash = [NSMutableString string];
    
    for (int i = 0; i < CC_MD5_DIGEST_LENGTH; i++) {
        [hash appendFormat:@"%02X", result[i]];
    }
    
    return [hash lowercaseString];
}


@end

@implementation RemoteResources

@synthesize survey, current, content;

- (id)init {
    self = [super init];
    if (self) {
        // Initialization code here.
        content = [[NSMutableArray alloc] init];
        current = 0;
        survey  = nil;
    }
    
    return self;
}

-(RemoteResources *)initWithSurvey:(Survey *)theSurvey {
    self = [super init];
    
    content = [[NSMutableArray alloc] init];
    current = 0;
    stage   = STAGE_LANGUAGE;
    survey  = theSurvey;
    
    [survey localizeResources:self];
    return self;
}

-(BOOL)nextInQueue:(PolldaddyAPI2 *)api delegate:(id <API_Survey>)del {
    // Decide what to do based upon the stage
    if ( stage == STAGE_LANGUAGE ) {
        stage = STAGE_RESOURCES;
        
        if ( survey.packId > 1000 )
            [api getLanguage:survey delegate:del];
        else
            [del finishedLanguage:survey.surveyId withData:nil];
    }
    else if ( stage == STAGE_STYLE ) {
        stage = STAGE_RESOURCES;

        if ( survey.styleId > 0 )
            [api getStyle:survey delegate:del];
        else
            [del finishedStyle:survey.surveyId withData:nil];
    }
    else if ( stage == STAGE_RESOURCES ) {
        // Start processing of this array
        [api getResources:self delegate:del];
    }
    
    return NO;
}

-(void)addResource:(NSString *)url {
    RemoteContent *sco = [[RemoteContent alloc] init];
    
    sco.local  = nil;
    sco.remote = url;
     
    [content addObject:sco];
     
 }
 
-(BOOL)next {
    current++;
    
    if ( current < content.count )
        return YES;
    
    return NO;
}

-(BOOL)alreadyExists:(NSString *)url {
    for ( RemoteContent *cont in content ) {
        if ( [cont.remote compare:url] == NSOrderedSame )
            return YES;
    }
    
    return NO;
}

 -(void)dealloc {
     [content removeAllObjects];
 }

@end
