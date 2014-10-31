//
//  ProgressView.m
//  Polldaddy
//
//  Created by John Godley on 24/01/2011.
//  Copyright 2011 Automattic. All rights reserved.
//

#import "ProgressView.h"
#import <QuartzCore/QuartzCore.h>
#import "PolldaddyAPI.h"
#import "PolldaddyAPI2.h"
#import "Response.h"
#import "PDDatabase.h"

@implementation ProgressView

@synthesize progress, loading, outOf, size, grouper, button, syncTitle, delegate;

// The designated initializer.  Override if you create the controller programmatically and want to perform customization that is not appropriate for viewDidLoad.
- (id)initWithNibName:(NSString *)nibNameOrNil andSurvey:(unsigned int)survey {
	self = [super initWithNibName:nibNameOrNil bundle:nil];

	if ( self ) {
		surveyID = survey;
		responsesProcessed = 0;
	}

	return self;
}

- (void)syncAllResponses {
	PDDatabase  *database = [[PDDatabase alloc] init];
	FMResultSet *set = [database get:[NSString stringWithFormat:@"SELECT responseId, responseXML, completed, startDate, endDate, surveyId FROM respondents", surveyID, lastResponseID]];
    
    purgeList = [[NSMutableArray alloc] init];
	api = [[PolldaddyAPI2 alloc] init];

    while ( [set next] ) {
        Response *response = [[Response alloc] initWithResultSet:set];

        // Sync this response
        if ( [api submitResponse:[set intForColumn:@"surveyid"] andResponse:response withDelegate:NULL] ) {
            // Add this ID to the list of items to purge
            [purgeList addObject:[NSNumber numberWithInt:[set intForColumn:@"responseId"]]];            
        }

    }

    // Purge everything
   	[PolldaddyAPI purgeResponse:purgeList];
    
    NSLog(@"Notifying");
    [[NSNotificationCenter defaultCenter] postNotificationName:@"polldaddy response synced" object:self];

	[set close];
    
    purgeList = nil;
    api = nil;
}

- (void)updateProgress {
	[outOf setText:[NSString stringWithFormat:@"%d out of %d", responsesProcessed, total]];
	progress.progress = (float)responsesProcessed / (float)total;
}

- (void)finished {
	finished = YES;
	
	// Clear any processed data out of the DB
	[PolldaddyAPI purgeResponse:purgeList];

	// Let the user know
	[outOf setText:[NSString stringWithFormat:@"%d synced, %d failed", responsesSent, responsesProcessed - responsesSent]];
	[syncTitle setText:@"Finished!"];
	[button setTitle:@"OK" forState:UIControlStateNormal];
	[loading stopAnimating];
	[size setText:@""];
}

- (BOOL)nextSync {
	BOOL result = NO;

	// Setup database and connection
	PDDatabase  *database = [[PDDatabase alloc] init];
	FMResultSet *set = [database get:[NSString stringWithFormat:@"SELECT responseId, responseXML, completed, startDate, endDate FROM respondents WHERE surveyId = %d AND responseId > %d LIMIT 1", surveyID, lastResponseID]];
	
	if ( [set next] ) {
		Response *response = [[Response alloc] initWithResultSet:set];

		lastResponseID = [set intForColumn:@"responseId"];
		[api submitResponse:surveyID andResponse:response withDelegate:self];
		
		result = YES;
        NSLog(@"Done");
	}
	else
		[self finished];

	[set close];

	return result;
}

- (void)doNextResponse {
	if ( finished == NO ) {
		[self updateProgress];
		[self nextSync];
	}
}

- (void)submitFinished:(NSData *)data {
	responsesProcessed++;
	
	unsigned int response = [api responseWasAccepted:data];
	if ( response > 0 ) {
		[purgeList addObject:[NSNumber numberWithInt:lastResponseID]];
		responsesSent++;
	}
	
	// Schedule this for the future so that our data handler can finish and close down
	[self performSelectorOnMainThread:@selector(doNextResponse) withObject:nil waitUntilDone:NO];
}

- (void)writeStatus:(NSInteger)totalSent andTotal:(NSInteger)totalExpected {
	if ( totalSent > 1024 * 1024 * 1024 )
		[size setText:[NSString stringWithFormat:@"%2.2f MB", (float)totalSent / (float)( 1024 * 1024 )]];
	else if ( totalSent > 1024 )
		[size setText:[NSString stringWithFormat:@"%2.2f KB", (float)totalSent / (float)1024]];
	else
		[size setText:[NSString stringWithFormat:@"%d bytes", totalSent]];
}

- (void)buttonPressed:(id)sender {
	if ( finished ) {
		[delegate syncFinished:responsesProcessed];
		
		[self dismissModalViewControllerAnimated:YES];
	}
	else {
		[api stopEverything];
		[self finished];
	}
}

// Implement viewDidLoad to do additional setup after loading the view, typically from a nib.
- (void)viewDidLoad {
	[super viewDidLoad];
	
	[loading startAnimating];
	[size setText:@""];
	
	total = [PolldaddyAPI getTotalOfflineResponses:surveyID];
	lastResponseID = 0;
	finished = NO;
	
	// Setup API and delegate back to us
	api = [[PolldaddyAPI2 alloc] init];
	
	// Create list of items processed
	purgeList = [[NSMutableArray alloc] init];

	// Reset the progress
	[self updateProgress];

	// Start the first response off
	[PolldaddyAPI cacheSurvey:surveyID];
	
	[self nextSync];
}

/*
// Override to allow orientations other than the default portrait orientation.
- (BOOL)shouldAutorotateToInterfaceOrientation:(UIInterfaceOrientation)interfaceOrientation {
    // Return YES for supported orientations.
    return (interfaceOrientation == UIInterfaceOrientationPortrait);
}
*/

- (void)didReceiveMemoryWarning {
    // Releases the view if it doesn't have a superview.
    [super didReceiveMemoryWarning];
    
    // Release any cached data, images, etc. that aren't in use.
}

- (void)viewDidUnload {
    [super viewDidUnload];
    // Release any retained subviews of the main view.
    // e.g. self.myOutlet = nil;
}



@end
