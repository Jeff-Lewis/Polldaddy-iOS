//
//  Polldaddy API.h
//  Polldaddy
//
//  Created by John Godley on 26/07/2011.
//  Copyright 2011 Automattic. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "PDURLConnection.h"

@class Response, Survey, RemoteResources;

@protocol PolldaddyApiStatus <NSObject>
    - (void)submitFinished:(NSData *)data;

@optional
    - (void)writeStatus:(NSInteger)totalSent andTotal:(NSInteger)totalExpected;
    - (void)readStatus:(NSInteger)totalRead;
@end

@protocol API_Survey <NSObject>
-(void)fetchingURL:(unsigned long)surveyID withURL:(NSString *)url withBytes:(unsigned long)bytes;
-(void)finished:(unsigned long)surveyID success:(bool)success withSurvey:(Survey *)survey;
-(void)finishedResource:(unsigned long)surveyID withData:(NSData *)data andFilename:(NSString *)filename;
-(void)finishedLanguage:(unsigned long)surveyID withData:(NSData *)data;
-(void)finishedStyle:(unsigned long)surveyID withData:(NSData *)data;
@end

@interface PolldaddyAPI2 : NSObject <PDURLConnectionStatus> {
	id <PolldaddyApiStatus> delegate;
	
    NSMutableArray *connections;
}

@property (nonatomic, strong) id <PolldaddyApiStatus> delegate;

- (void)stopEverything;
- (BOOL)submitResponse:(unsigned long)surveyID andResponse:(Response *)response withDelegate:(id <PolldaddyApiStatus>)del;
- (unsigned int)responseWasAccepted:(NSData *)data;

- (void)getRemoteSurvey:(unsigned long)surveyID delegate:(id <API_Survey>)del;
- (void)getResources:(RemoteResources *)resources delegate:(id <API_Survey>)del;
- (void)getLanguage:(Survey *)survey delegate:(id <API_Survey>)del;
- (void)getStyle:(Survey *)survey delegate:(id <API_Survey>)del;

@end
