//
//  PDDatabase.m
//  Polldaddy
//
//  Created by Eoin Gallagher on 26/05/2010.
//  Copyright 2010 Automattic. All rights reserved.
//

#import "PDDatabase.h"


@implementation PDDatabase

@synthesize databaseName, databasePath, db;

-(PDDatabase *) init{
	self = [super init];
	
	// Setup some globals
	databaseName = @"polldaddy.sql";
	
	// Get the path to the documents directory and append the databaseName
	NSArray *documentPaths = NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES);
	NSString *documentsDir = [documentPaths objectAtIndex:0];
	databasePath = [documentsDir stringByAppendingPathComponent:databaseName];
	
	// Execute the "checkAndCreateDatabase" function
	[self checkAndCreateDatabase];
	
	db = [FMDatabase databaseWithPath:databasePath];
	
	[db setTraceExecution:NO];
	[db setLogsErrors:YES];
	
    if (![db open]) {
        NSLog(@"Could not open db.");
        return 0;
    }
	
	return self;
}

- (void) checkAndCreateDatabase{
	// Check if the SQL database has already been saved to the users phone, if not then copy it over
	BOOL success;
	
	// Create a FileManager object, we will use this to check the status
	// of the database and to copy it over if required
	NSFileManager *fileManager = [NSFileManager defaultManager];
	
	// Check if the database has already been created in the users filesystem
	success = [fileManager fileExistsAtPath:databasePath];
	
	// If the database already exists then return without doing anything
	if(success) return;
	
	// If not then proceed to copy the database from the application to the users filesystem
	
	// Get the path to the database in the application package
	NSString *databasePathFromApp = [[[NSBundle mainBundle] resourcePath] stringByAppendingPathComponent:databaseName];
	
	// Copy the database from the package to the users filesystem
	[fileManager copyItemAtPath:databasePathFromApp toPath:databasePath error:nil];	
}

- (FMResultSet *) get: (NSString *)sql {    
	return [db executeQuery:sql];
}

- (void) set: (NSString *)sql withArgumentsInArray:(NSArray *)arguments {	
	[db beginTransaction];
	
	[db executeUpdate:sql withArgumentsInArray:arguments ];
	if ([db hadError]) {
		NSLog(@"Database set error %d: %@", [db lastErrorCode], [db lastErrorMessage]);
	}

    [db commit];
}

@end
