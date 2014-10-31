//
//  polldaddyAPI.h
//  pad-api-test
//
//  Created by Lenny on 24/05/2010.
//  Copyright 2010 Automattic. All rights reserved.
//

#import <Foundation/Foundation.h>

@class Survey, Response;

@interface PolldaddyAPI : NSObject {
	

}

+ (boolean_t) connectionAvailable:(boolean_t)withError;

+ (void) showError:(NSString*)title withMessage:(NSString*)message withButtonTitle:(NSString*)buttonTitle;

+ (NSString*) makeRequest:(NSString*)requestBody;

+ (NSString*) pdRequest:(NSString*)demand;

+ (Survey *)allocGetSurvey:(unsigned int)surveyID;

+ (Survey *) allocSurveyFromAPI:(unsigned int)surveyID andFormXML:(NSString**)formXML;

+ (boolean_t) purgeSurvey: (int)surveyID;

+ (boolean_t) cacheSurvey: (int)surveyID;

+ (NSMutableDictionary *) allocSurveys;

+ (NSMutableDictionary *) allocSurveysFromAPI;
+ (NSMutableDictionary *) allocQuizzesFromAPI;

+ (Response *) allocGetResponse: (unsigned int)responsePosition forSurvey:(Survey *)survey;

+ (unsigned int) getTotalOfflineResponses: (int)surveyID;

+ (boolean_t) purgeResponse: (NSMutableArray*)purgeList;
+ (boolean_t) purgeSurveyResponses: (int)surveyID;

+ (int)submitResponse:(int)surveyID andResponseXML:(NSString*)responseString andCompleted:(bool)isCompleted;

+ (boolean_t)accountLogin:(NSString*)email andPassword: (NSString*)password;

+ (NSString *) getUserCode;

+ (NSNumber *) getUserID;

+ (boolean_t) setUserCode:(NSString*)userCode withUserID:(NSNumber*) userID;
	
+ (boolean_t) hasValidAccount;

+ (boolean_t) accountLogOut;

@end

