//
//  LiveSurveySelectionViewController.m
//  Polldaddy
//
//  Created by Kevin Conboy on 5/27/10.
//  Copyright 2010 Automattic, Inc. All rights reserved.
//

#import "LiveSurveySelectionViewController.h"
#import "MultiSelectCellController.h"
#import "SurveysFullScreenViewController.h"
#import "CellController.h"
#import "PolldaddyAPI.h"
#import "PolldaddyAPI2.h"
#import "GTMNSString+HTML.h"
#import "NSString+XMLEntities.h"
#import "Survey.h"
#import "Constants.h"
#import "Configuration.h"

NSComparisonResult compareAZCell( MultiSelectCellController *element1, MultiSelectCellController *element2, void *context );

NSComparisonResult compareAZCell( MultiSelectCellController *element1, MultiSelectCellController *element2, void *context ) {
	return [element1.label caseInsensitiveCompare:element2.label];	
}

extern UIInterfaceOrientation gAppOrientation;

@implementation LiveSurveySelectionViewController


@synthesize liveTable, parentDelegate,saveSelectionsButton;


#pragma mark -
#pragma mark View lifecycle


- (void)viewDidLoad {
	[super viewDidLoad];

	[self willAnimateRotationToInterfaceOrientation:gAppOrientation duration:0];

	[liveTable setEditing:NO];
	[liveTable setAllowsSelectionDuringEditing:NO];
	[liveTable setBackgroundView:nil];

	liveTable.backgroundColor = [UIColor clearColor];
    
    // Setup API and delegate back to us
    api = [[PolldaddyAPI2 alloc] init];
    
    running = 0;
    resources = [[NSMutableDictionary alloc] init];
}

- (IBAction) saveSelections{
	
	[parentDelegate saveSelections];

}

- (void) swapOutListView{
	[UIView beginAnimations:nil context:nil];
	[UIView setAnimationCurve:UIViewAnimationCurveEaseOut];
	[UIView setAnimationDuration:0.5];
	[UIView setAnimationTransition:UIViewAnimationTransitionFlipFromLeft forView:self.view cache:YES];
	[UIView commitAnimations];
	
	[UIView beginAnimations:nil context:nil];
	[UIView setAnimationCurve:UIViewAnimationCurveEaseIn];
	[UIView setAnimationDuration:0.125];
	[UIView setAnimationTransition:UIViewAnimationTransitionNone forView:self.view cache:YES];
	[self.view setAlpha:0.0];
	[UIView commitAnimations];
}

- (void) swapInListView{
	[UIView beginAnimations:nil context:nil];
	[UIView setAnimationCurve:UIViewAnimationCurveEaseOut];
	[UIView setAnimationDuration:0.5];
	[UIView setAnimationTransition:UIViewAnimationTransitionFlipFromLeft forView:self.view cache:YES];
	[UIView setAnimationDelay:0.25];
	[UIView commitAnimations];
	
	[UIView beginAnimations:nil context:nil];
	[UIView setAnimationCurve:UIViewAnimationCurveEaseIn];
	[UIView setAnimationDuration:0.125];
	[UIView setAnimationTransition:UIViewAnimationTransitionNone forView:self.view cache:YES];
	[UIView setAnimationDelay:0.5];
	[self.view setAlpha:1.0];
	[UIView commitAnimations];
}

- (BOOL)shouldAutorotateToInterfaceOrientation:(UIInterfaceOrientation)interfaceOrientation {
    // Override to allow orientations other than the default portrait orientation.
    return YES;
}

- (void)willAnimateRotationToInterfaceOrientation:(UIInterfaceOrientation)interfaceOrientation duration:(NSTimeInterval)duration {
	if ( [Constants isIpad] ) {
		if ( interfaceOrientation == UIInterfaceOrientationPortrait || interfaceOrientation == UIInterfaceOrientationPortraitUpsideDown ) {
			[self.view setFrame:CGRectMake(62, 204, 638, 750)];
			[saveSelectionsButton setFrame:CGRectMake(25, 623, saveSelectionsButton.frame.size.width, saveSelectionsButton.frame.size.height)];
			[liveTable setFrame:CGRectMake(12, 26, 620, 590)];
		}
		else {
			// if the interface is rotating to landscape mode, set the frames appropriately
			[self.view setFrame:CGRectMake(35, 126, 950, 630)];
			[saveSelectionsButton setFrame:CGRectMake(180, 500, saveSelectionsButton.frame.size.width, saveSelectionsButton.frame.size.height)];
			[liveTable setFrame:CGRectMake(13, 28, 930, 450)];
		}
	}
	else {
		if ( interfaceOrientation == UIInterfaceOrientationPortrait || interfaceOrientation == UIInterfaceOrientationPortraitUpsideDown ) {
			[self.view setFrame:CGRectMake(10, 70, 300, 368)];
			[saveSelectionsButton setFrame:CGRectMake(20, 317, saveSelectionsButton.frame.size.width, saveSelectionsButton.frame.size.height)];
		}
		else {
			// if the interface is rotating to landscape mode, set the frames appropriately

			[self.view setFrame:CGRectMake(15, 60, 460, 220)];
			[saveSelectionsButton setFrame:CGRectMake(100, 175, saveSelectionsButton.frame.size.width, saveSelectionsButton.frame.size.height)];
		}	
	}
}



#pragma mark -
#pragma mark Table view data source
//
// constructTableGroups
//
// Creates/updates cell data. This method should only be invoked directly if
// a "reloadData" needs to be avoided. Otherwise, updateAndReload should be used.
//
- (void)constructTableGroups {
	NSMutableDictionary *selected = [PolldaddyAPI allocSurveys];
	
	NSMutableArray      *selectedSurveys = [NSMutableArray array];
	NSMutableArray      *selectedQuizzes = [NSMutableArray array];

	NSMutableDictionary *surveysDictionary = [PolldaddyAPI allocSurveysFromAPI];
	NSMutableDictionary *quizDictionary    = [PolldaddyAPI allocQuizzesFromAPI];

	// Get list of surveys
	for ( NSNumber *key in surveysDictionary ) {
		MultiSelectCellController *row = [[MultiSelectCellController alloc] initWithLabel: [surveysDictionary objectForKey:key] andSurveyId:key.unsignedIntValue];
		
		if ( [selected objectForKey:key] )
			row.selected = YES;
		
		[selectedSurveys addObject:row];
 	}

	// Get list of quizzes
	for ( NSNumber *key in quizDictionary ) {
		MultiSelectCellController *row = [[MultiSelectCellController alloc] initWithLabel: [quizDictionary objectForKey:key] andSurveyId:key.unsignedIntValue];
		
		if ( [selected objectForKey:key] )
			row.selected = YES;
		
		[selectedQuizzes addObject:row];
 	}
	
	// Delete any surveys that we have in our local list, but have been deleted on the server. Only do this if we have some new surveys
    if ( [surveysDictionary count] > 0 || [quizDictionary count] > 0 ) {
        for ( NSNumber *key in selected ) {
            if ( [surveysDictionary objectForKey:key] == nil && [quizDictionary objectForKey:key] == nil ) {
                [PolldaddyAPI purgeSurvey:[key intValue]];
                [PolldaddyAPI purgeSurveyResponses:[key intValue]];
            }
        }
    }
    
	// Sort the tables
	[selectedSurveys sortUsingFunction:compareAZCell context:nil];
	[selectedQuizzes sortUsingFunction:compareAZCell context:nil];
	
	// Copy for our table
	surveys = [[NSArray alloc] initWithArray:selectedSurveys];
	quizzes = [[NSArray alloc] initWithArray:selectedQuizzes];

	// Clean up
    
    NSLog(@"Data loaded");
    [self swapInListView];		
}

//
// clearTableGroups
//
// Releases the table group data (it will be recreated when next needed)
//
- (void)clearTableGroups
{
	surveys = quizzes = nil;
}

//
// updateAndReload
//
// Performs all work needed to refresh the data and the associated display
//
- (void)updateAndReload
{
	[self clearTableGroups];
	[self constructTableGroups];
	[liveTable reloadData];
}

//
// numberOfSectionsInTableView:
//
// Return the number of sections for the table.
//
- (NSInteger)numberOfSectionsInTableView:(UITableView *)tableView
{
	if (!surveys)
		[self constructTableGroups];

	return ( [surveys count] > 0 ? 1 : 0 ) + ( [quizzes count] > 0 ? 1 : 0 );
}

//
// tableView:numberOfRowsInSection:
//
// Returns the number of rows in a given section.
//
- (NSInteger)tableView:(UITableView *)tableView numberOfRowsInSection:(NSInteger)section
{
	if (!surveys)
		[self constructTableGroups];

    NSArray *array = surveys;
    
    if ( section > 0 || ( [surveys count] == 0 && [quizzes count] > 0 ) )
        array = quizzes;

    return [array count];
}

-(MultiSelectCellController *)getControllerForCell:(NSIndexPath *)path {
    NSArray *array = surveys;
    
    if ( path.section > 0 || ( [ surveys count] == 0 && [quizzes count] > 0 ) )
        array = quizzes;

    if ( (unsigned int)path.row < [array count] )
        return [array objectAtIndex:path.row];
    return nil;
}

//
// tableView:cellForRowAtIndexPath:
//
// Returns the cell for a given indexPath.
//
- (UITableViewCell *)tableView:(UITableView *)tableView cellForRowAtIndexPath:(NSIndexPath *)indexPath {
    return [[self getControllerForCell:indexPath] tableView:liveTable cellForRowAtIndexPath:indexPath];
}


//
// tableView:didSelectRowAtIndexPath:
//
// Handle row selection
//
- (void)tableView:(UITableView *)tableView didSelectRowAtIndexPath:(NSIndexPath *)indexPath {
	MultiSelectCellController *cellController = [self getControllerForCell:indexPath];

    // Is this cell already loading? Cant press it again
    if ( cellController.loading == NO ) {
        // No, press it
        [cellController tableView:tableView didSelectRowAtIndexPath:indexPath];

        unsigned int surveyID = cellController.surveyId;

        // Is it now loading?
        if ( [cellController loading] ) {
            // Row is loading - go fetch the data
            saveSelectionsButton.enabled = NO;
            saveSelectionsButton.alpha = 0.5f;
            [parentDelegate toggleButtons:NO];
            running++;

            // Start the process
            [api getRemoteSurvey:surveyID delegate:self];
        }
        else
            [PolldaddyAPI purgeSurvey:surveyID];
    }
}

-(MultiSelectCellController *)getCellControllerForSurvey:(unsigned int)surveyID {
    for ( MultiSelectCellController *item in surveys ) {
        if ( item.surveyId == surveyID ) {
            return item;
        }
    }
    
    for ( MultiSelectCellController *item in quizzes ) {
        if ( item.surveyId == surveyID ) {
            return item;
        }
    }
    
    return nil;
}

-(UITableViewCell *)getCellForSurvey:(unsigned int)surveyID {
    unsigned int count = 0;
    
    for ( MultiSelectCellController *item in surveys ) {
        if ( item.surveyId == surveyID ) {
            return [self tableView:liveTable cellForRowAtIndexPath:[NSIndexPath indexPathForRow:count inSection:0]];
        }
        
        count++;
    }
    
    count = 0;
    for ( MultiSelectCellController *item in quizzes ) {
        if ( item.surveyId == surveyID ) {
            return [self tableView:liveTable cellForRowAtIndexPath:[NSIndexPath indexPathForRow:count inSection:0]];
        }

        count++;
    }
    
    return nil;
}

-(void)finishedLanguage:(unsigned int)surveyID withData:(NSData *)data {
    RemoteResources *res = [resources objectForKey:[NSNumber numberWithInt:surveyID]];
    
    if ( res ) {
        [res.survey storeLanguage:data];
        
        // Move on to the next
        [res nextInQueue:api delegate:self];
    }
}

-(void)finishedStyle:(unsigned int)surveyID withData:(NSData *)data {
    RemoteResources *res = [resources objectForKey:[NSNumber numberWithInt:surveyID]];
    
    if ( res ) {
        [res.survey storeStyle:data];

        // Move on to the next
        [res nextInQueue:api delegate:self];
    }
}

-(void)finishedResource:(unsigned int)surveyId withData:(NSData *)data andFilename:(NSString *)filename {
    RemoteResources *remote = [resources objectForKey:[NSNumber numberWithInt:surveyId]];
    
    if ( remote ) {
        // Pass the resource on to the survey to deal with
        if ( data )
            [remote.survey storeResource:remote withData:data andFilename:filename];
        
        // Any more resources for this survey?
        if ( [remote next] ) {
            // Get next resource
            [api getResources:remote delegate:self];
        }
        else {
            // Hurrah, done!
            MultiSelectCellController *cellController = [self getCellControllerForSurvey:surveyId];
            
            if ( cellController ) {
                UITableViewCell *cell = [self getCellForSurvey:surveyId];
                
                [cellController selected:cell];
                [liveTable reloadData];
            }
            
            running--;
            
            if ( running <= 0 ) {
                saveSelectionsButton.enabled = YES;
                saveSelectionsButton.alpha = 1.0f;
                [parentDelegate toggleButtons:YES];
                running = 0;
            }
            
            // Remove the remoteresources object
            [resources removeObjectForKey:[NSNumber numberWithInt:surveyId]];
        }
    }
}

-(void)finished:(unsigned int)surveyID success:(bool)success withSurvey:(Survey *)survey {
    MultiSelectCellController *cellController = [self getCellControllerForSurvey:surveyID];

    if ( cellController ) {
        UITableViewCell *cell = [self getCellForSurvey:surveyID];

        if ( success == NO ) {
            // Select the cell twice so it toggles to unselected
            [cellController selected:cell];
            [cellController selected:cell];
            [cellController setStatus:@"An error occurred while loading this item, please try again" forCell:cell];
        }
        else {
            // We have the survey data itself, now start a queue of actions to perform on the survey before it's fully ready
            RemoteResources *res = [[RemoteResources alloc] initWithSurvey:survey];
            
            // Add the list of resources into our dictionary
            [resources setObject:res forKey:[NSNumber numberWithInt:surveyID]];
            
            // Start this off
            [res nextInQueue:api delegate:self];
        }
        
        [liveTable reloadData];
    }
    else
        running--;

    if ( running <= 0 ) {
        saveSelectionsButton.enabled = YES;
        saveSelectionsButton.alpha = 1.0f;
        [parentDelegate toggleButtons:YES];
        running = 0;
    }
}

-(void)fetchingURL:(unsigned int)surveyID withURL:(NSString *)url withBytes:(unsigned int)bytes {
    // Find the row for the surveyID
    MultiSelectCellController *cellController = [self getCellControllerForSurvey:surveyID];

    if ( cellController ) { 
        UITableViewCell *cell = [self getCellForSurvey:surveyID];

        if ( [url compare:[NSString stringWithString:[Configuration sharedInstance].polldaddyUrl]] == NSOrderedSame ) {
            // Fetching survey XML
            [cellController setStatus:[NSString stringWithFormat:@"Loading questions (%@)", [NSString stringPrettyBytes:bytes]] forCell:cell];
        }
        else if ( [url compare:@"pack"] == NSOrderedSame ) {
            // Fetching survey XML
            [cellController setStatus:[NSString stringWithFormat:@"Loading language pack (%@)", [NSString stringPrettyBytes:bytes]] forCell:cell];
        }
        else if ( [url compare:@"style"] == NSOrderedSame ) {
            // Fetching survey XML
            [cellController setStatus:[NSString stringWithFormat:@"Loading style (%@)", [NSString stringPrettyBytes:bytes]] forCell:cell];
        }
        else {
            // Some resource
            RemoteResources *res = [resources objectForKey:[NSNumber numberWithInt:surveyID]];
            
            if ( res ) {
                if ( res.content.count == 1 )
                    [cellController setStatus:[NSString stringWithFormat:@"Retrieving resource (%@)", [NSString stringPrettyBytes:bytes]] forCell:cell];
                else
                    [cellController setStatus:[NSString stringWithFormat:@"Retrieving resource %d of %d (%@)", ( res.current + 1 ), ( res.content.count + 1 ), [NSString stringPrettyBytes:bytes]] forCell:cell];
            }
        }
        
        [liveTable reloadData];
    }
}

//
// indexPathForCellController:
//
// Returns the indexPath for the specified CellController object
//
- (NSIndexPath *)indexPathForCellController:(id)cellController {
	NSInteger sectionIndex, sectionCount = 0;

	// Look through surveys
	for ( MultiSelectCellController *cell in surveys ) {
		if ( [cell isEqual:cellController] ) {
			sectionIndex = 0;
			return [NSIndexPath indexPathForRow:sectionCount inSection:sectionIndex];
		}
		
		sectionCount++;
	}
	
	// Look through quizzes
	sectionCount = 0;
	for ( MultiSelectCellController *cell in quizzes ) {
		if ( [cell isEqual:cellController] ) {
			sectionIndex = 0;
			if ( [surveys count] > 0 && [quizzes count] > 0 )
				sectionIndex = 1;

			return [NSIndexPath indexPathForRow:sectionCount inSection:sectionIndex];
		}
		
		sectionCount++;
	}
	
	return nil;
}

- (CGFloat)tableView:(UITableView *)tableView heightForRowAtIndexPath:(NSIndexPath *)indexPath {
	if (UI_USER_INTERFACE_IDIOM() == UIUserInterfaceIdiomPad)
		return 90;
	return 40;
}

- (CGFloat)tableView:(UITableView *)tableView heightForHeaderInSection:(NSInteger)section {
	if (UI_USER_INTERFACE_IDIOM() == UIUserInterfaceIdiomPad)
		return 20;
	return 20;
}

- (UIView *)tableView:(UITableView *)tableView viewForHeaderInSection:(NSInteger)section {
	// Section header view
	UIView  *customView  = [[UIView alloc] initWithFrame:CGRectMake( 0, 0.0, tableView.frame.size.width, [self tableView:tableView heightForHeaderInSection:1] )];

	customView.backgroundColor = [UIColor clearColor];

	// Text inside the view
	UILabel *headerLabel = [[UILabel alloc] initWithFrame:CGRectMake( 10, 0.0, tableView.frame.size.width, [self tableView:tableView heightForHeaderInSection:1] )];
	
	headerLabel.backgroundColor = [UIColor clearColor];
	headerLabel.textColor       = [UIColor lightGrayColor];

	if ( UI_USER_INTERFACE_IDIOM() == UIUserInterfaceIdiomPad ){
		headerLabel.font            = [UIFont fontWithName:@"Helvetica" size:14];
		if ( [surveys count] > 0 && [quizzes count] > 0 ) {
			if ( section == 0 )
				headerLabel.text = [NSString stringWithString:@"SELECT SURVEYS TO MAKE AVAILABLE OFFLINE"];
			else
				headerLabel.text = [NSString stringWithString:@"SELECT QUIZZES TO MAKE AVAILABLE OFFLINE"];
		}
		else if ( [surveys count] > 0 )
			headerLabel.text = [NSString stringWithString:@"SELECT SURVEYS TO MAKE AVAILABLE OFFLINE"];
		else
			headerLabel.text = [NSString stringWithString:@"SELECT QUIZZES TO MAKE AVAILABLE OFFLINE"];
	}
	else{
		headerLabel.font            = [UIFont fontWithName:@"Helvetica" size:12];
		if ( [surveys count] > 0 && [quizzes count] > 0 ) {
			if ( section == 0 )
				headerLabel.text = [NSString stringWithString:@"SELECT SURVEYS FOR OFFLINE USE"];
			else
				headerLabel.text = [NSString stringWithString:@"SELECT QUIZZES FOR OFFLINE USE"];
		}
		else if ( [surveys count] > 0 )
			headerLabel.text = [NSString stringWithString:@"SELECT SURVEYS FOR OFFLINE USE"];
		else
			headerLabel.text = [NSString stringWithString:@"SELECT QUIZZES FOR OFFLINE USE"];
	}
	
	[customView addSubview:headerLabel];
	return customView;
}

//
// didReceiveMemoryWarning
//
// Release any cache data.
//
- (void)didReceiveMemoryWarning
{
	[super didReceiveMemoryWarning];
	
//	[self clearTableGroups];
}
//
// dealloc
//
// Release instance memory
//
- (void)dealloc
{
	[self clearTableGroups];
}


@end

