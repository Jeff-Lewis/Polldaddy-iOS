//
//  Polldaddy API.m
//  Polldaddy
//
//  Created by John Godley on 26/07/2011.
//  Copyright 2011 Automattic. All rights reserved.
//

#import "PolldaddyAPI.h"
#import "PolldaddyAPI2.h"
#import "Constants.h"
#import "Survey.h"
#import "Response.h"
#import "TBXML.h"
#import "PDDatabase.h"
#import <SystemConfiguration/SystemConfiguration.h>
#import <netinet/in.h>
#import "NSString+XMLEntities.h"
#import "Reachability.h"
#import "PDURLConnection.h"

// Async version
@implementation PolldaddyAPI2

@synthesize delegate;

const unsigned int TAG_SURVEY = 0;
const unsigned int TAG_SURVEY_RESOURCE = 1;
const unsigned int TAG_SURVEY_PACK = 2;
const unsigned int TAG_SURVEY_STYLE = 3;
const unsigned int TAG_RESPONSE = 4;

/**
 * Second part of reading survey data
 */
- (void)remoteSurveyData:(PDURLConnection *)connection {
    id<API_Survey> other = connection.otherDelegate;
    
    if ( connection.inError == NO && connection.response.statusCode == 200 ) {
        TBXML        *surveyXML = [TBXML tbxmlWithXMLData:connection.responseData];
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
                                Survey *survey = [[Survey alloc] initWithXML:final];
                                
                                if ( survey ) {
                                    
                                    NSString * userId = [NSString stringWithFormat:@"%@", [PolldaddyAPI getUserID]];
                                    
                                    PDDatabase *database = [[PDDatabase alloc] init];	
                                    
                                    NSArray *listOfParams = [NSArray arrayWithObjects:
                                                             [NSNumber numberWithInt:[survey surveyId]],
                                                             [NSString stringWithString:[survey title]],
                                                             [NSString stringWithString:[survey title]],
                                                             [NSNumber numberWithInt:0],
                                                             [NSDate date],
                                                             [NSDate date],
                                                             final,
                                                             userId,
                                                             nil];

                                    if ( [other respondsToSelector:@selector(finished:success:withSurvey:)] )
                                        [other finished:connection.itemID success:YES withSurvey:survey];

                                    [database set:@"INSERT INTO surveys ( surveyId, name, title, responses, lastSyncd, created, formXML, userId ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)" withArgumentsInArray:listOfParams];
                                    return;
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    
    // Signal that an error occurred at some point
    if ( [other respondsToSelector:@selector(finished:success:withSurvey:)] )
        [other finished:connection.itemID success:NO withSurvey:nil];
}

-(void)finished:(PDURLConnection *)connection {
    // Send the data on up
    if ( connection.tag == TAG_SURVEY ) {
        [self remoteSurveyData:connection];
    }
    else if ( connection.tag == TAG_SURVEY_RESOURCE ) {
        id<API_Survey> other = connection.otherDelegate;
        
        [other finishedResource:connection.itemID withData:connection.responseData andFilename:connection.response.suggestedFilename];
    }
    else if ( connection.tag == TAG_SURVEY_PACK ) {
        id<API_Survey> other = connection.otherDelegate;

        // Chop out XML data between <pack> and </pack>
        NSString *string = [[NSString alloc] initWithData:connection.responseData encoding:NSUTF8StringEncoding];

        NSRange start = [string rangeOfString:@"<pack"];
        NSRange end   = [string rangeOfString:@"</pack>"];
        
        if ( start.length > 0 && end.length > 0 ) {
            NSRange sub = NSMakeRange( start.location, end.location + end.length - start.location );
            
            [other finishedLanguage:connection.itemID withData:[[string substringWithRange:sub] dataUsingEncoding: NSUTF8StringEncoding]];
        }
        else
            [other finishedLanguage:connection.itemID withData:nil];

    }
    else if ( connection.tag == TAG_SURVEY_STYLE ) {
        id<API_Survey> other = connection.otherDelegate;
        
        [other finishedStyle:connection.itemID withData:connection.responseData];
    }
    else if ( connection.tag == TAG_RESPONSE ) {
        id<PolldaddyApiStatus> other = connection.otherDelegate;
        
        [other submitFinished:connection.responseData];
    }
    
    // Clean up
    [connections removeObject:connection];
    
    // Switch the lights off on the way out
    if ( [connections count] == 0 )
        [UIApplication sharedApplication].networkActivityIndicatorVisible = NO;
}

- (void)bytesRead:(NSInteger)totalRead withRequest:(PDURLConnection *)connection {
    NSString       *message;
    id<API_Survey>  other = connection.otherDelegate;

    if ( connection.tag == TAG_SURVEY_PACK )
        message = @"pack";
    else if ( connection.tag == TAG_SURVEY_STYLE )
        message = @"style";
    else
        message = [connection.request.URL absoluteString];

    if ( [other respondsToSelector:@selector(fetchingURL:withURL:withBytes:)] )
        [other fetchingURL:connection.itemID withURL:message withBytes:totalRead];
}

- (void)bytesWritten:(NSInteger)totalSent andTotal:(NSInteger)totalExpected withConnection:(PDURLConnection *)connection {
    if ( connection.tag == TAG_RESPONSE ) {
        id<PolldaddyApiStatus> other = connection.otherDelegate;
        
        if ( [other respondsToSelector:@selector(writeStatus:andTotal:)] )
            [other writeStatus:totalSent andTotal:totalExpected];
    }
}

- (void)connection:(PDURLConnection *)connection didFailWithError:(NSError *)msg {  
    connection.inError = YES;
    
    if ( connection.tag == TAG_SURVEY ) {
        [self finished:connection];
    }
    else if ( connection.tag == TAG_SURVEY_RESOURCE ) {
        // XXX
    }
}

- (PDURLConnection *)allocURL:(NSString *)url {
	// Create the request
	NSMutableURLRequest *urlRequest = [NSMutableURLRequest requestWithURL:[NSURL URLWithString:url]];

    [urlRequest setTimeoutInterval:2];
    
    // Need to switch on network activity?
    if ( [connections count] == 0 )
        [UIApplication sharedApplication].networkActivityIndicatorVisible = YES;
	
	// Now make the request
    PDURLConnection *connection = [[PDURLConnection alloc] initWithRequest:urlRequest delegate:self];
    
    // Add it to our list of connections
    [connections addObject:connection];
    
    return connection;
}

- (PDURLConnection *)allocConnection:(NSString *)data {
	// Add the XML wrapper around the data
	NSString *request = [NSString stringWithFormat:@"<?xml version='1.0' encoding='utf-8' ?>"
                         "<pd:pdRequest xmlns:pd='http://api.polldaddy.com/pdapi.xsd' partnerGUID='%@'>"
                         "	<pd:userCode>%@</pd:userCode>"
                         "%@"
                         " </pd:pdRequest>", PolldaddyAPIKey, [PolldaddyAPI getUserCode], data ];
    
	// Create the request
	NSMutableURLRequest *urlRequest = [NSMutableURLRequest requestWithURL:[NSURL URLWithString:PolldaddyAPIURL]];

	[urlRequest setHTTPMethod:@"POST"];
	[urlRequest setValue:@"text/xml; charset=UTF-8" forHTTPHeaderField:@"Content-type"];
	[urlRequest setHTTPBody:[request dataUsingEncoding:NSUTF8StringEncoding]];
    [urlRequest setTimeoutInterval:2];

    // Need to switch on network activity?
    if ( [connections count] == 0 )
        [UIApplication sharedApplication].networkActivityIndicatorVisible = YES;
	
	// Now make the request
    PDURLConnection *connection = [[PDURLConnection alloc] initWithRequest:urlRequest delegate:self];

    // Add it to our list of connections
    [connections addObject:connection];
    
    return connection;
}

- (NSString *)getDevice {
	return UI_USER_INTERFACE_IDIOM() == UIUserInterfaceIdiomPad ? @"iPad" : @"iPhone";
}

- (NSString *)getDeviceVersion {
	return [NSString stringWithFormat:@"v%@", [[NSBundle mainBundle] objectForInfoDictionaryKey:@"CFBundleShortVersionString"]];
}

- (NSString *)getPlatform {
    return [NSString stringWithFormat:@"iOS %@", [[UIDevice currentDevice] systemVersion]];
}

- (void)stopEverything {
    for ( NSURLConnection *connection in connections ) {
        [connection cancel];
    }
}

- (BOOL)submitResponse:(unsigned int)surveyID andResponse:(Response *)response withDelegate:(id <PolldaddyApiStatus>)del {
    // Get survey XML
	NSString *request = [NSString stringWithFormat:@"<pd:demands>"
                        "<pd:demand id='submitsurveyresponse'>"
                        "<pd:survey_response survey_id='%d'>"
                        "%@"
                        "<pd:tags>"
                        "<pd:tag><pd:name>source</pd:name><pd:value>%@</pd:value></pd:tag>"
                        "<pd:tag><pd:name>version</pd:name><pd:value>%@</pd:value></pd:tag>"
                        "<pd:tag><pd:name>platform</pd:name><pd:value>%@</pd:value></pd:tag>"
                        "</pd:tags>"
                        "</pd:survey_response>"	
                        "</pd:demand>"
                        "</pd:demands>", surveyID, response, [self getDevice], [self getDeviceVersion], [self getPlatform]];
	
    if ( del == NULL ) {
        NSString *responseBody = [PolldaddyAPI pdRequest:request];
        if ( [self responseWasAccepted:[responseBody dataUsingEncoding:NSUTF8StringEncoding]] > 0 )
            return YES;
        
        return NO;
    }
    else {
        PDURLConnection *connection = [self allocConnection:request];
        
        // Setup data so we know what this connection is doing
        [connection setTag:TAG_RESPONSE];
        [connection setOtherDelegate:del];
        [connection setItemID:surveyID];
        
        [connection start];
    }
    
    return YES;
}

- (unsigned int)responseWasAccepted:(NSData *)data {
	TBXML        *responseXML = [TBXML tbxmlWithXMLData:data];
	TBXMLElement *root = responseXML.rootXMLElement;
    
	if ( root ) {
		
		// check for the existance of error nodes
		TBXMLElement *errorsNode = [TBXML childElementNamed:@"pd:errors" parentElement:root];
		
		if ( errorsNode != nil ) {
			
			// If error nodes exist them extract the error message and return false.
			TBXMLElement *errorNode = [TBXML childElementNamed:@"pd:error" parentElement:errorsNode];
			
			NSLog( @"API Returned Error: %@", [TBXML textForElement:errorNode] );
			
			return 0;
			
		}
		else {
			
			TBXMLElement *demandsNode = [TBXML childElementNamed:@"pd:demands" parentElement:root];
			
			while ( demandsNode ) {
				
				TBXMLElement *demandNode = [TBXML childElementNamed:@"pd:demand" parentElement:demandsNode];
				
				while ( demandNode ) {
					
					TBXMLElement *surveyResponseNode = [TBXML childElementNamed:@"pd:survey_response" parentElement:demandNode];
					
					if ( surveyResponseNode ) {
						return (unsigned int) [NSNumber numberWithInt:[[TBXML valueOfAttributeNamed:@"id" forElement:surveyResponseNode] integerValue]];
					}
					
					demandNode = [TBXML nextSiblingNamed:@"pd:demand" searchFromElement:demandsNode];
				}			
				
				demandsNode = [TBXML nextSiblingNamed:@"pd:demands" searchFromElement: root];
			}
			
			return 0;
		}
		
	}
	
	return 0;	
}

- (void)getRemoteSurvey:(unsigned int)surveyID delegate:(id <API_Survey>)del {
	// Clear the old survey out
	[PolldaddyAPI purgeSurvey:surveyID];
	
    // Get survey XML
    NSString *request = [NSString stringWithFormat:@"<pd:demands><pd:demand id='getsurvey'><pd:survey id='%d' /></pd:demand></pd:demands>", surveyID];
	
    PDURLConnection *connection = [self allocConnection:request];

    // Setup data so we know what this connection is doing
    [connection setTag:TAG_SURVEY];
    [connection setOtherDelegate:del];
    [connection setItemID:surveyID];

    [connection start];
}

- (void)getResources:(RemoteResources *)resources delegate:(id <API_Survey>)del {
    if ( resources.current < [resources.content count] ) {
        RemoteContent   *content = [resources.content objectAtIndex:resources.current];
        PDURLConnection *connection = [self allocURL:content.remote];
        
        // Setup data so we know what this connection is doing
        [connection setTag:TAG_SURVEY_RESOURCE];
        [connection setOtherDelegate:del];
        [connection setItemID:resources.survey.surveyId];
        
        [connection start];
    }
    else {
        [del finishedResource:resources.survey.surveyId withData:nil andFilename:nil];
    }
}

- (void)getStyle:(Survey *)survey delegate:(id <API_Survey>)del {
    NSString *request = [NSString stringWithFormat:@"<pd:demands><pd:demand id='getstyle'><pd:style id='%d' /></pd:demand></pd:demands>", survey.styleId];
	
    PDURLConnection *connection = [self allocConnection:request];
    
    // Setup data so we know what this connection is doing
    [connection setTag:TAG_SURVEY_STYLE];
    [connection setOtherDelegate:del];
    [connection setItemID:survey.surveyId];
    
    [connection start];
}

- (void)getLanguage:(Survey *)survey delegate:(id <API_Survey>)del {
    NSString *request = [NSString stringWithFormat:@"<pd:demands><pd:demand id='getpack'><pd:languagepack id='%d' /></pd:demand></pd:demands>", survey.packId];
	
    PDURLConnection *connection = [self allocConnection:request];
    
    // Setup data so we know what this connection is doing
    [connection setTag:TAG_SURVEY_PACK];
    [connection setOtherDelegate:del];
    [connection setItemID:survey.surveyId];
    
    [connection start];
}

- (PolldaddyAPI2 *)init {
    self = [super init];
    
    connections = [[NSMutableArray alloc] init];
    return self;
}

- (void)dealloc {
    [connections removeAllObjects];
}

@end
