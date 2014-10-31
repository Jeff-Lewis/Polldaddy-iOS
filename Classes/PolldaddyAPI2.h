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
-(void)fetchingURL:(unsigned int)surveyID withURL:(NSString *)url withBytes:(unsigned int)bytes;
-(void)finished:(unsigned int)surveyID success:(bool)success withSurvey:(Survey *)survey;
-(void)finishedResource:(unsigned int)surveyID withData:(NSData *)data andFilename:(NSString *)filename;
-(void)finishedLanguage:(unsigned int)surveyID withData:(NSData *)data;
-(void)finishedStyle:(unsigned int)surveyID withData:(NSData *)data;
@end

@interface PolldaddyAPI2 : NSObject <PDURLConnectionStatus> {
	id <PolldaddyApiStatus> delegate;
	
    NSMutableArray *connections;
}

@property (nonatomic, strong) id <PolldaddyApiStatus> delegate;

- (void)stopEverything;
- (BOOL)submitResponse:(unsigned int)surveyID andResponse:(Response *)response withDelegate:(id <PolldaddyApiStatus>)del;
- (unsigned int)responseWasAccepted:(NSData *)data;

- (void)getRemoteSurvey:(unsigned int)surveyID delegate:(id <API_Survey>)del;
- (void)getResources:(RemoteResources *)resources delegate:(id <API_Survey>)del;
- (void)getLanguage:(Survey *)survey delegate:(id <API_Survey>)del;
- (void)getStyle:(Survey *)survey delegate:(id <API_Survey>)del;

@end
