//
//  AN_Matrix.h
//  Polldaddy
//
//  Created by John Godley on 08/07/2010.
//  Copyright 2010 Automattic. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "Answer.h"

@interface MatrixChoice : NSObject {
	unsigned int  rowID;
	NSArray      *columns;
}

@property (nonatomic,readonly) unsigned int rowID;
@property (nonatomic,readonly,strong) NSArray *columns;

- (id)initWithRow:(unsigned int)row andColumns:(NSArray *)columns;
@end

@class Question;

@interface AN_Matrix : Answer {
	NSArray *choices;
}

- (Answer *) initWithXML:(TBXMLElement *)node;
- (NSString *) summaryForQuestion:(Question *)question;

@end
