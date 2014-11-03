//
//  polldaddyAPI.m
//  pad-api-test
//
//  Created by Lenny on 24/05/2010.
//  Copyright 2010 Automattic. All rights reserved.
//

#import "PolldaddyAPI.h"
#import "Constants.h"
#import "Survey.h"
#import "Response.h"
#import "TBXML.h"
#import "PDDatabase.h"
#import <SystemConfiguration/SystemConfiguration.h>
#import <netinet/in.h>
#import "NSString+XMLEntities.h"
#import "Reachability.h"
#import "Configuration.h"

@implementation PolldaddyAPI


+ (boolean_t) connectionAvailable:(boolean_t)withError {
	Reachability *r = [Reachability reachabilityWithHostName:@"api.polldaddy.com"];
	NetworkStatus internetStatus = [r currentReachabilityStatus];
	
	if ( internetStatus == NotReachable ) {
		NSLog(@"Not reachable");
		return NO;
	}

	NSLog(@"Reachable %d", internetStatus);
	return YES;
}


// showError: Short to show a alert box

+ (void) showError:(NSString*)title withMessage:(NSString*)message withButtonTitle:(NSString*)buttonTitle {

	UIAlertView *someError = [[UIAlertView alloc] initWithTitle:title message:message delegate: self cancelButtonTitle: buttonTitle otherButtonTitles: nil];
	[someError show];

}


// makeRequest: Makes a request to the API.

+ (NSString *) makeRequest:(NSString *)requestBody {

	UIApplication       *app = [UIApplication sharedApplication];
	NSURL               *webServiceURL = [NSURL URLWithString:[Configuration sharedInstance].polldaddyUrl];
	NSMutableURLRequest *urlRequest = [NSMutableURLRequest requestWithURL:webServiceURL];
	
	app.networkActivityIndicatorVisible = YES;

	[urlRequest setHTTPMethod:@"POST"];
	[urlRequest setValue:@"text/xml; charset=UTF-8" forHTTPHeaderField:@"Content-type"];
	[urlRequest setHTTPBody:[requestBody dataUsingEncoding:NSUTF8StringEncoding]];
	
	NSData        *urlData;
	NSURLResponse *response;
	NSError       *error;
	NSString      *responseBody, *resp;
	
	urlData      = [NSURLConnection sendSynchronousRequest:urlRequest returningResponse:&response error:&error];
	responseBody = [[NSString alloc] initWithData:urlData encoding:NSUTF8StringEncoding];		
	resp         = [NSString stringWithString:responseBody];

	app.networkActivityIndicatorVisible = NO;
	
	return resp;
	
}

// pdRequest: Makes a PD request. Just hand over demand to it.

+ (NSString*) pdRequest:(NSString*)demand {

	NSString * polldaddyUserCode = [PolldaddyAPI getUserCode];
	
	NSString *request = [NSString stringWithFormat:@"<?xml version='1.0' encoding='utf-8' ?>"
					  "<pd:pdRequest xmlns:pd='http://api.polldaddy.com/pdapi.xsd' partnerGUID='%@'>"
					  "	<pd:userCode>%@</pd:userCode>"
					  "%@"
					  " </pd:pdRequest>", [Configuration sharedInstance].polldaddyAPIKey, polldaddyUserCode, demand ];

	return [PolldaddyAPI makeRequest:request];

}


// getSurvey: returns local copy of survey in Survey object.

+ (Survey*) allocGetSurvey:(unsigned int)surveyID {
	
	PDDatabase *database = [[PDDatabase alloc] init];	
	NSString *formXML = @"";
	
	FMResultSet *rs = [database get:[NSString stringWithFormat:@"SELECT formXML FROM surveys WHERE surveyId = %d", surveyID]];

	while ([rs next])
		formXML = [rs stringForColumn:@"formXML"];
	
	[rs close];

	if ( [formXML length] > 0 )
		return [[Survey alloc] initWithXML:formXML];

	return FALSE;
}

+ (Survey*) allocSurveyFromAPI:(unsigned int)surveyID andFormXML:(NSString**)formXML {
		
	NSString * demand =	[NSString stringWithFormat:@"<pd:demands>"
						"	<pd:demand id='getsurvey'>"
						"		<pd:survey id='%d' />"
						"	</pd:demand>"
						"</pd:demands>", surveyID];
	
	NSString *surveyString = [PolldaddyAPI pdRequest:demand];		

//	NSLog(@"%@", surveyString);
	TBXML        *surveyXML = [TBXML tbxmlWithXMLString:surveyString];
	TBXMLElement *root = surveyXML.rootXMLElement;
	
	if ( root ) {
		TBXMLElement *demandsNode = [TBXML childElementNamed:@"pd:demands" parentElement:root];

		if ( demandsNode ) {
			TBXMLElement *demandNode = [TBXML childElementNamed:@"pd:demand" parentElement:demandsNode];
			
			if ( demandNode ) {
				TBXMLElement *surveyNode = [TBXML childElementNamed:@"pd:survey" parentElement:demandNode];

				if ( surveyNode ) {
					TBXMLElement *surveyXMLNode = [TBXML childElementNamed:@"pd:survey_xml" parentElement:surveyNode];
					TBXMLElement *ruleXMLNode   = [TBXML childElementNamed:@"pd:rule_xml" parentElement:surveyNode];
					
					if ( surveyXMLNode ) {
						NSString *escapedUrl   = [[TBXML textForElement:surveyXMLNode] stringByReplacingPercentEscapesUsingEncoding:NSUTF8StringEncoding];
						NSString *escapedRules = [[TBXML textForElement:ruleXMLNode] stringByReplacingPercentEscapesUsingEncoding:NSUTF8StringEncoding];

						if ( !escapedUrl )
							escapedUrl = [TBXML textForElement:surveyXMLNode];
						
						// Here we wedge the rules XML to the end of the survey XML - this saves us a bunch of hard work adding extra DB columns
						NSString *final = [escapedUrl stringByReplacingOccurrencesOfString:@"</formData>" withString:[NSString stringWithFormat:@"%@</formData>", escapedRules]];
						
						if ( escapedUrl ) {
							*formXML = final;
								
							return [[Survey alloc] initWithXML:final];
						}
					}
				}
			}
		}
	}

	return FALSE;
}

// listSurveys: Lists local copy of surveys 

+ (NSMutableDictionary *) allocSurveys {
	
	NSMutableDictionary *surveys = [[NSMutableDictionary alloc] init];
	PDDatabase *database = [[PDDatabase alloc] init];	
	
	NSString * userID = [NSString stringWithFormat:@"%@", [PolldaddyAPI getUserID]];
	
	FMResultSet *rs = [database get:[NSString stringWithFormat:@"select surveyId, title from surveys WHERE userId = %@", userID]];
	
	NSNumber *surveyID;
	NSString *surveyName;
	
	while ([rs next]) {
		
		surveyID   = [NSNumber numberWithInt:[rs intForColumn:@"surveyId"]];
		surveyName = [[rs stringForColumn:@"title"] stringByDecodingHTMLEntities];
		
		[surveys setObject:surveyName forKey:surveyID]; 
	}
	
	[rs close];
	return surveys;
	
}


// listSurveysFromAPI: get a list of live surveys

+ (NSMutableDictionary *) allocSurveysFromAPI {

	NSString * demand =	@"<pd:demands>"
	"	<pd:demand id='getsurveys'>"
	"	</pd:demand>"
	"</pd:demands>";
	
	NSString * surveysString = [PolldaddyAPI pdRequest:demand];		
	
	
	NSMutableDictionary *surveys = [[NSMutableDictionary alloc] init];
	
	NSNumber *surveyID;
	NSString *surveyName;
	
	TBXML        *surveyXML = [TBXML tbxmlWithXMLString:surveysString];
	TBXMLElement *root = surveyXML.rootXMLElement;
	
	if ( root ) {
		
		TBXMLElement *demandsNode = [TBXML childElementNamed:@"pd:demands" parentElement:root];
		
		while ( demandsNode ) {
			
			TBXMLElement *demandNode = [TBXML childElementNamed:@"pd:demand" parentElement:demandsNode];
			
			while ( demandNode ) {
				
				TBXMLElement *surveysNode = [TBXML childElementNamed:@"pd:surveys" parentElement:demandNode];
				
				while ( surveysNode ) {
					
					TBXMLElement *surveyNode = [TBXML childElementNamed:@"pd:survey" parentElement:surveysNode];
					
					while ( surveyNode ) {
						TBXMLElement *nameNode = [TBXML childElementNamed:@"pd:title" parentElement:surveyNode];
						
						surveyID   = [NSNumber numberWithInt:[[TBXML valueOfAttributeNamed:@"id" forElement:surveyNode] integerValue]];
						surveyName = [[TBXML textForElement:nameNode] stringByDecodingHTMLEntities];
						
						[surveys setObject:surveyName forKey:surveyID];
						
						//NSLog( @"id: %@ | %@", surveyID, surveyName );
						
						surveyNode = [TBXML nextSiblingNamed:@"pd:survey" searchFromElement:surveyNode];
						
					}
					surveysNode = [TBXML nextSiblingNamed:@"pd:surveys" searchFromElement:demandNode];
				}
				
				demandNode = [TBXML nextSiblingNamed:@"pd:demand" searchFromElement:demandsNode];
			}			
			
			demandsNode = [TBXML nextSiblingNamed:@"pd:demands" searchFromElement: root];
		}
	}
	
	return surveys;
	
}


// listSurveysFromAPI: get a list of live surveys

+ (NSMutableDictionary *) allocQuizzesFromAPI {
	
	NSString * demand =	@"<pd:demands>"
	"	<pd:demand id='getquizzes'>"
	"	</pd:demand>"
	"</pd:demands>";
	
	NSString * surveysString = [PolldaddyAPI pdRequest:demand];		
	
	NSMutableDictionary *surveys = [[NSMutableDictionary alloc] init];
	
	NSNumber *surveyID;
	NSString *surveyName;
	
	TBXML        *surveyXML = [TBXML tbxmlWithXMLString:surveysString];
	TBXMLElement *root = surveyXML.rootXMLElement;

	if ( root ) {
		
		TBXMLElement *demandsNode = [TBXML childElementNamed:@"pd:demands" parentElement:root];
		
		while ( demandsNode ) {
			
			TBXMLElement *demandNode = [TBXML childElementNamed:@"pd:demand" parentElement:demandsNode];
			
			while ( demandNode ) {
				
				TBXMLElement *surveysNode = [TBXML childElementNamed:@"pd:quizzes" parentElement:demandNode];
				
				while ( surveysNode ) {
					
					TBXMLElement *surveyNode = [TBXML childElementNamed:@"pd:quiz" parentElement:surveysNode];
					
					while ( surveyNode ) {
						TBXMLElement *nameNode = [TBXML childElementNamed:@"pd:title" parentElement:surveyNode];
						
						surveyID   = [NSNumber numberWithInt:[[TBXML valueOfAttributeNamed:@"id" forElement:surveyNode] integerValue]];
						surveyName = [[TBXML textForElement:nameNode] stringByDecodingHTMLEntities];
						
						[surveys setObject:surveyName forKey:surveyID];
						
						//NSLog( @"id: %@ | %@", surveyID, surveyName );
						
						surveyNode = [TBXML nextSiblingNamed:@"pd:quiz" searchFromElement:surveyNode];
						
					}
					surveysNode = [TBXML nextSiblingNamed:@"pd:quizzes" searchFromElement:demandNode];
				}
				
				demandNode = [TBXML nextSiblingNamed:@"pd:demand" searchFromElement:demandsNode];
			}			
			
			demandsNode = [TBXML nextSiblingNamed:@"pd:demands" searchFromElement: root];
		}
	}
	
	return surveys;
	
}


// purgeSurvey: deletes a local survey.

+ (boolean_t) purgeSurvey: (int)surveyID {
    // First we get the survey from the DB
    Survey *survey = [PolldaddyAPI allocGetSurvey:surveyID];
    
    // Now we can clear any downloaded resources
    [survey clearResources];
    
    // Now we delete it from the DB
	PDDatabase *database = [[PDDatabase alloc] init];	
	NSArray    *listOfParams = [NSArray arrayWithObjects:[NSNumber numberWithInt:surveyID], nil];
	
	[database set:@"DELETE FROM surveys WHERE surveyId = ?" withArgumentsInArray:listOfParams];	
	
	return TRUE;
}

+ (boolean_t) purgeSurveyResponses: (int)surveyID {
	
	PDDatabase *database = [[PDDatabase alloc] init];	
	
	NSArray *listOfParams = [NSArray arrayWithObjects:
													 [NSNumber numberWithInt:surveyID],
													 nil];
	
	[database set:@"DELETE FROM respondents WHERE surveyId = ?" withArgumentsInArray:listOfParams];	
	
	return TRUE;
}

// cacheSurvey takes a copy of the survey from the API and stores it locally.

+ (boolean_t) cacheSurvey: (int)surveyID {
	
	NSString *formXML;
	Survey   *survey = [PolldaddyAPI allocSurveyFromAPI:surveyID andFormXML:&formXML];

	if ( survey ) {
        // Remove old survey
        [PolldaddyAPI purgeSurvey:surveyID];
        
		NSString * userId = [NSString stringWithFormat:@"%@", [PolldaddyAPI getUserID]];
		
		PDDatabase *database = [[PDDatabase alloc] init];	
			
		NSArray *listOfParams = [NSArray arrayWithObjects:
								 [NSNumber numberWithInt:[survey surveyId]],
								 [NSString stringWithString:[survey title]],
								 [NSString stringWithString:[survey title]],
								 [NSNumber numberWithInt:0],
								 [NSDate date],
								 [NSDate date],
								 formXML,
								 userId,
								 nil];

		[database set:@"INSERT INTO surveys ( surveyId, name, title, responses, lastSyncd, created, formXML, userId ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)" withArgumentsInArray:listOfParams];
	}

	return TRUE;
}

// getTotalOfflineResponses: Returns the number of offline responses for a survey

+ (unsigned int) getTotalOfflineResponses: (int)surveyID {

	int totalResponses = 0;
	
	PDDatabase *database = [[PDDatabase alloc] init];	
	FMResultSet *rs;
    
    if ( surveyID == 0 )
        rs = [database get:[NSString stringWithFormat:@"SELECT count(*) AS 'total' FROM respondents"]];
    else
        rs = [database get:[NSString stringWithFormat:@"SELECT count(*) AS 'total' FROM respondents WHERE surveyId = %d", surveyID]];
	
	while ([rs next]) {
		
		totalResponses = [rs intForColumn:@"total"];			

	}
	
	[rs close];
	return totalResponses;
}

+ (Response *) allocGetResponse: (unsigned int)responsePosition forSurvey:(Survey *)survey {
	PDDatabase *database = [[PDDatabase alloc] init];	
	FMResultSet *rs = [database get:[NSString stringWithFormat:@"SELECT * FROM respondents WHERE surveyId = %d ORDER BY responseId DESC LIMIT %d,1", survey.surveyId, responsePosition]];

	Response *response = NULL;
	
	if ([rs next]) {
		response = [[Response alloc] initWithXML:[rs stringForColumn:@"responseXML"] andId:[rs intForColumn:@"responseId"] andStart:[rs intForColumn:@"startDate"] andEnd:[rs intForColumn:@"endDate"]];
	}
	
	[rs close];
	return response;
}

// purgeResponse: deletes responses based on an array of local response IDs

+ (boolean_t) purgeResponse: (NSMutableArray*)purgeList {
	if ( [purgeList count] > 0 ) {
		PDDatabase *db = [[PDDatabase alloc] init];	
		
		NSArray *listOfParams = [NSArray array];
		
		for (NSNumber *key in purgeList) {
			[db set:[NSString stringWithFormat:@"DELETE FROM respondents WHERE responseId = %@", key] withArgumentsInArray:listOfParams];	
			
		}	
		
		return TRUE;	
	}
	
	return FALSE;
}

// submitResponse: stores a response locally.

+ (boolean_t) submitResponse: (int)surveyID andResponseXML:(NSString*)responseString andCompleted:(bool)isCompleted {

	NSString * userID;
	
	userID = [NSString stringWithFormat:@"%@", [PolldaddyAPI getUserID]];
	
	PDDatabase *database = [[PDDatabase alloc] init];	
	
	NSArray *listOfParams = [NSArray arrayWithObjects:
							 [NSNumber numberWithInt:surveyID],
							 responseString,
							 [NSDate date],
							 [NSDate date],
							 [NSNumber numberWithInt:( isCompleted == YES ? 2 : 1 )],
							 [NSNumber numberWithInt:0],
							 [NSNumber numberWithInt:0],
							 userID,	
							 nil];
	
	[database set:@"INSERT INTO respondents ( surveyId, responseXML, startDate, endDate, completed, latitude, longitude, userId ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)" withArgumentsInArray:listOfParams];
    
    // Notify that a response has been received
    [[NSNotificationCenter defaultCenter] postNotificationName:@"polldaddy new response" object:self];

	return TRUE;

}
// accountLogin: logins in through the API and returns a userCode and userID

+ (boolean_t)accountLogin:(NSString*)email andPassword:(NSString*)password {
	if ( [email length] > 0 && [password length] > 0 ) {
		
		NSString * requestBody = [NSString stringWithFormat:@"<?xml version='1.0' encoding='utf-8' ?>"
								  "<pd:pdInitiate partnerGUID='%@' partnerUserID='0' xmlns:pd='http://api.polldaddy.com/pdapi.xsd'>"
								  "		<pd:Email>%@</pd:Email>"
								  "		<pd:Password>%@</pd:Password>"
								  "</pd:pdInitiate>", [Configuration sharedInstance].polldaddyAPIKey, [email stringByEncodingHTMLEntities], [password stringByEncodingHTMLEntities] ];
//		NSLog(@"%@", requestBody);
		NSString * responseBody = [PolldaddyAPI makeRequest:requestBody];
		
		NSLog(@"Response = %@", responseBody);
		
		NSString * userCode;
		NSNumber * userID;
		
		// needs logic for wrong password
		
		TBXML        *responseXML = [TBXML tbxmlWithXMLString:responseBody];
		TBXMLElement *root = responseXML.rootXMLElement;
		
		if ( root ) {
			
			// check for the existance of error nodes
			TBXMLElement *errorsNode = [TBXML childElementNamed:@"pd:errors" parentElement:root];

			if ( errorsNode != nil ) {
				//NSString * errorMSG;

				// If error nodes exist them extract the error message and return false.
				//TBXMLElement *errorNode = [TBXML childElementNamed:@"pd:error" parentElement:errorsNode];
				//errorMSG = [TBXML textForElement:errorNode];
				
				//NSLog("API Returned Error: %@", errorMSG );
				
				[PolldaddyAPI showError:NSLocalizedString( @"Account Login", @"" ) withMessage:NSLocalizedString( @"The login details you entered are incorrect, please try again.", @"" ) withButtonTitle:NSLocalizedString( @"Ok", @"" )];
				
				return FALSE;
			}
			else {
				
				TBXMLElement *userCodeNode = [TBXML childElementNamed:@"pd:userCode" parentElement:root];
				
				if ( userCodeNode ) {
					userCode = [TBXML textForElement:userCodeNode];
					userID = [NSNumber numberWithInt:[[TBXML valueOfAttributeNamed:@"partnerUserID" forElement:root] integerValue]];
					
					[PolldaddyAPI setUserCode:userCode withUserID:userID];
					
					return TRUE;
				}
				else
					[PolldaddyAPI showError:NSLocalizedString( @"Account Login", @"" ) withMessage:NSLocalizedString( @"There appears to be a problem logging in, please try again.", @"" ) withButtonTitle:NSLocalizedString( @"Ok", @"" )];
			}
			
		}
		else {
			[PolldaddyAPI showError:NSLocalizedString( @"Account Login", @"" ) withMessage:NSLocalizedString( @"There appears to be a problem logging in, please try again.", @"" ) withButtonTitle:NSLocalizedString( @"Ok", @"" )];
		}
		
	}
	else
		[PolldaddyAPI showError:NSLocalizedString( @"Account Login", @"" ) withMessage:NSLocalizedString( @"Please enter an email address and password.", @"" ) withButtonTitle:NSLocalizedString( @"Ok", @"" )];
	
	return FALSE;
	
}

// getUserID: gets the userID that is stored locally

+ (NSNumber *) getUserID {
	NSArray *paths = NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES);
	NSString *documentsDirectory = [paths objectAtIndex:0];
	NSString *finalPath = [documentsDirectory stringByAppendingPathComponent:@"polldaddy-api-settings.plist"];
	
	NSDictionary *dictionary;
	dictionary = [NSDictionary dictionaryWithContentsOfFile:finalPath];
	
	for (id key in dictionary) {
		
		if ( [key isEqualToString: @"userID"] ) {
			return [dictionary objectForKey:key];
		}
	}
	return FALSE;
}

// getUserCode: gets the userCode that is stored locally

+ (NSString *) getUserCode {
	NSArray      *paths = NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES);
	NSString     *documentsDirectory = [paths objectAtIndex:0];
	NSString     *finalPath = [documentsDirectory stringByAppendingPathComponent:@"polldaddy-api-settings.plist"];
	NSDictionary *dictionary;
	
	dictionary = [NSDictionary dictionaryWithContentsOfFile:finalPath];
	
	for (id key in dictionary) {		
		if ( [key isEqualToString: @"userCode"] ) {
			return [NSString stringWithString:[dictionary objectForKey:key]];
		}
	}
	
	return FALSE;
}


// setUserCode: sets the userCode locally

+ (boolean_t) setUserCode:(NSString*)userCode withUserID:(NSNumber*)userID {
	
	NSArray *paths = NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES);
	NSString *documentsDirectory = [paths objectAtIndex:0];
	NSString *finalPath = [documentsDirectory stringByAppendingPathComponent:@"polldaddy-api-settings.plist"];

	NSMutableDictionary *dictionary = [[NSMutableDictionary alloc] init];
	
	[dictionary setObject:userCode forKey:@"userCode"];
	[dictionary setObject:userID forKey:@"userID"];
	[dictionary writeToFile:finalPath atomically:NO];
	return TRUE;

}

// hasValidAccount:Checks to see if the account is stil valid (call on app opening)

+ (boolean_t) hasValidAccount {

	NSString * userCode;
	
	userCode = [PolldaddyAPI getUserCode];

	
	if ( [PolldaddyAPI connectionAvailable:FALSE] ) { // if there IS a connection

		if ( [userCode length] > 7 ) {	// > false
			
			// check to make sure its a valid userCode
					
			NSString * demand =	@"<pd:demands>"
			"	<pd:demand id='GetAccount'>"
			"	</pd:demand>"
			"</pd:demands>";
			
			NSString * responseBody = [PolldaddyAPI pdRequest:demand];		

			
			// needs logic for wrong password
			
			TBXML        *responseXML = [TBXML tbxmlWithXMLString:responseBody];
			TBXMLElement *root = responseXML.rootXMLElement;
			
			
			if ( root ) {
				
				// check for the existance of error nodes
				TBXMLElement *errorsNode = [TBXML childElementNamed:@"pd:errors" parentElement:root];
				
				if ( errorsNode != nil ) {
					
					// Usercode is invalid

					[PolldaddyAPI showError:NSLocalizedString( @"Account Login", @"" ) withMessage:NSLocalizedString( @"Your account details have changed, please log in again.", @"" ) withButtonTitle:NSLocalizedString( @"Ok", @"" )];

					[PolldaddyAPI setUserCode:@"" withUserID:[NSNumber numberWithInt:0]];
					return FALSE;
					
				}
				else {
					
					// Usercode is still valid
					return TRUE;
					
				}
				
			}
		}
		else
			return FALSE;
	}

	if ( [userCode length] > 7 )
		return TRUE;
	else
		return FALSE;
}


+(boolean_t) accountLogOut {

	[PolldaddyAPI setUserCode:@"" withUserID:[NSNumber numberWithInt:0]];
	return TRUE;

}

@end
