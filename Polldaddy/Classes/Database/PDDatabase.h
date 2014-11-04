//
//  PDDatabase.h
//  Polldaddy
//
//  Created by Eoin Gallagher on 26/05/2010.
//  Copyright 2010 Automattic. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "FMDatabase.h"
#import "FMDatabaseAdditions.h"


@interface PDDatabase : NSObject {
	NSString	*databaseName;
	NSString	*databasePath;
	FMDatabase*	db;
}

@property (nonatomic, copy)   NSString       *databaseName;
@property (nonatomic, copy)   NSString       *databasePath;
@property (nonatomic, copy)   FMDatabase*	 db;

- (PDDatabase *) init;
- (void) checkAndCreateDatabase;
- (FMResultSet *) get: (NSString *)sql;
- (void) set : (NSString *)sql withArgumentsInArray:(NSArray *)arguments;

@end
